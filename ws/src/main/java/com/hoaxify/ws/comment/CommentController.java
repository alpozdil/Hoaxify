package com.hoaxify.ws.comment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hoaxify.ws.comment.dto.CommentSubmitDTO;
import com.hoaxify.ws.comment.dto.CommentResponseDTO;
import com.hoaxify.ws.shared.CurrentUser;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class CommentController {

    @Autowired
    CommentService commentService;
    
    @Autowired
    UserService userService;

    @GetMapping("/posts/{postId}/comments")
    public Page<CommentResponseDTO> getCommentsOfPost(@PathVariable long postId, 
            @PageableDefault(sort = "id", direction = Direction.DESC) Pageable pageable,
            @CurrentUser User currentUser) {
        Page<Comment> comments = commentService.getCommentsOfPost(postId, pageable, currentUser);
        return comments.map(CommentResponseDTO::new);
    }

    @GetMapping("/users/{userId}/comments")
    public Page<CommentResponseDTO> getCommentsOfUser(@PathVariable long userId, 
            @PageableDefault(sort = "id", direction = Direction.DESC) Pageable pageable) {
        Page<Comment> comments = commentService.getCommentsOfUser(userId, pageable);
        return comments.map(CommentResponseDTO::new);
    }

    @PostMapping("/posts/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    public CommentResponseDTO createComment(@PathVariable long postId, 
            @Valid @RequestBody CommentSubmitDTO comment, 
            @CurrentUser User user) {
        
        try {
            if (user == null) {
                // Security context'ten kullanıcıyı almayı deneyelim
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                    com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                    user = userService.getUserById(currentUser.getId());
                    
                    System.out.println("CommentController: Token'dan kullanıcı alındı - ID=" + user.getId() + ", Username=" + user.getUsername());
                } else {
                    System.out.println("CommentController: Kullanıcı bulunamadı veya oturum açılmamış!");
                    throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
                }
            } else {
                System.out.println("CommentController: CurrentUser anotasyonu ile kullanıcı alındı - ID=" + user.getId() + ", Username=" + user.getUsername());
            }
            
            Comment createdComment = commentService.createComment(postId, comment, user);
            System.out.println("CommentController: Yorum oluşturuldu - ID=" + createdComment.getId());
            System.out.println("CommentController: Comment User - ID=" + createdComment.getUser().getId() + ", Username=" + createdComment.getUser().getUsername());
            
            CommentResponseDTO responseDTO = new CommentResponseDTO(createdComment);
            System.out.println("CommentController: DTO oluşturuldu - User ID=" + responseDTO.getUser().getId() + ", Username=" + responseDTO.getUser().getUsername());
            
            return responseDTO;
        } catch (Exception e) {
            System.err.println("CommentController - Yorum oluşturulurken hata: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/comments/{id}")
    public CommentResponseDTO getCommentById(@PathVariable long id) {
        Comment comment = commentService.getCommentById(id);
        return new CommentResponseDTO(comment);
    }

    @PutMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public CommentResponseDTO updateComment(@PathVariable long id, 
            @Valid @RequestBody CommentSubmitDTO commentUpdate, 
            @CurrentUser User loggedInUser) {
        
        if (loggedInUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                loggedInUser = userService.getUserById(currentUser.getId());
            } else {
                throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            }
        }
        
        Comment updatedComment = commentService.updateComment(id, commentUpdate, loggedInUser);
        return new CommentResponseDTO(updatedComment);
    }

    @DeleteMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteComment(@PathVariable long id, @CurrentUser User loggedInUser) {
        if (loggedInUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                loggedInUser = userService.getUserById(currentUser.getId());
            } else {
                throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            }
        }
        
        commentService.deleteComment(id, loggedInUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/posts/{postId}/comments/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable long postId) {
        long count = commentService.getCommentCountByPost(postId);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/comments/{commentId}/replies")
    @PreAuthorize("@commentSecurityService.canReply(#commentId)")
    public ResponseEntity<CommentResponseDTO> createReply(@PathVariable long commentId, 
            @Valid @RequestBody CommentSubmitDTO replySubmit,
            @CurrentUser User user) {
        
        try {
            if (user == null) {
                // Security context'ten kullanıcıyı almayı deneyelim
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                    com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                    user = userService.getUserById(currentUser.getId());
                    
                    System.out.println("CommentController: createReply - Token'dan kullanıcı alındı - ID=" + user.getId() + ", Username=" + user.getUsername());
                } else {
                    System.out.println("CommentController: createReply - Kullanıcı bulunamadı veya oturum açılmamış!");
                    throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
                }
            } else {
                System.out.println("CommentController: createReply - CurrentUser anotasyonu ile kullanıcı alındı - ID=" + user.getId() + ", Username=" + user.getUsername());
            }
            
            Comment createdReply = commentService.createReply(commentId, replySubmit, user);
            System.out.println("CommentController: Yanıt oluşturuldu - ID=" + createdReply.getId());
            
            CommentResponseDTO responseDTO = new CommentResponseDTO(createdReply);
            System.out.println("CommentController: Yanıt DTO oluşturuldu - User ID=" + responseDTO.getUser().getId() + ", Username=" + responseDTO.getUser().getUsername());
            
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            System.err.println("CommentController - Yanıt oluşturulurken hata: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/comments/{commentId}/like")
    @PreAuthorize("@commentSecurityService.canLike(#commentId)")
    public ResponseEntity<Boolean> toggleLike(@PathVariable long commentId,
            @CurrentUser User user) {
        if (user == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                user = userService.getUserById(currentUser.getId());
            } else {
                throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            }
        }
        
        boolean liked = commentService.toggleLike(commentId, user);
        return ResponseEntity.ok(liked);
    }

    @GetMapping("/comments/{commentId}/replies")
    public Page<CommentResponseDTO> getReplies(@PathVariable long commentId,
            @PageableDefault(sort = "id", direction = Direction.DESC) Pageable pageable,
            @CurrentUser User currentUser) {
        return commentService.getReplies(commentId, pageable, currentUser).map(CommentResponseDTO::new);
    }
} 