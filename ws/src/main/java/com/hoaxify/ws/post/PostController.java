package com.hoaxify.ws.post;

import java.util.List;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hoaxify.ws.post.dto.PostSubmitDTO;
import com.hoaxify.ws.shared.CurrentUser;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class PostController {

    @Autowired
    PostService postService;
    
    @Autowired
    UserService userService;

    @GetMapping("/posts")
    public Page<Post> getPosts(@PageableDefault(sort = "createdAt", direction = Direction.DESC) Pageable pageable, 
                              @CurrentUser User currentUser) {
        try {
            System.out.println("PostController.getPosts çağrıldı: " + pageable);
            
            // Eğer currentUser null ise Security Context'ten almaya çalış
            if (currentUser == null) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.isAuthenticated() && 
                    !"anonymousUser".equals(authentication.getName()) &&
                    authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                    com.hoaxify.ws.configuration.CurrentUser authUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                    currentUser = userService.getUserById(authUser.getId());
                    System.out.println("PostController: Security Context'ten kullanıcı alındı - ID=" + currentUser.getId());
                } else {
                    System.out.println("PostController: Kullanıcı oturum açmamış, beğeni durumu gösterilmeyecek");
                }
            } else {
                System.out.println("PostController: CurrentUser anotasyonu ile kullanıcı alındı - ID=" + currentUser.getId());
            }
            
            // İstek hakkında daha fazla bilgi logla
            System.out.println("Sayfa: " + pageable.getPageNumber() + ", Boyut: " + pageable.getPageSize() + 
                ", Sıralama: " + pageable.getSort());
            
            // İsteği işle
            Page<Post> posts = postService.getPosts(pageable, currentUser);
            
            // Yanıt hakkında bilgi logla
            System.out.println("Yanıt: " + posts.getNumberOfElements() + " gönderi, Toplam: " + 
                posts.getTotalElements() + ", Toplam Sayfa: " + posts.getTotalPages());
            
            return posts;
        } catch (Exception e) {
            System.err.println("PostController - Gönderiler alınırken hata: " + e.getMessage());
            System.err.println("İstisna sınıfı: " + e.getClass().getName());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/users/{userId}/posts")
    public Page<Post> getUserPosts(@PathVariable long userId,
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) Pageable pageable,
            @CurrentUser User currentUser) {
        
        // Eğer currentUser null ise Security Context'ten almaya çalış
        if (currentUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getName()) &&
                authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser authUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                currentUser = userService.getUserById(authUser.getId());
            }
        }
        
        return postService.getPostsOfUser(userId, pageable, currentUser);
    }

    @PostMapping("/posts")
    @PreAuthorize("isAuthenticated()")
    public Post createPost(@Valid PostSubmitDTO post, @CurrentUser User user,
            @RequestParam(name = "attachments", required = false) List<MultipartFile> attachments) {
        
        try {
            if (user == null) {
                // Security context'ten kullanıcıyı almayı deneyelim
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                    com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                    user = userService.getUserById(currentUser.getId());
                    
                    System.out.println("PostController: Token'dan kullanıcı alındı - ID=" + user.getId() + ", Username=" + user.getUsername());
                } else {
                    System.out.println("PostController: Kullanıcı bulunamadı veya oturum açılmamış!");
                    throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
                }
            } else {
                System.out.println("PostController: CurrentUser anotasyonu ile kullanıcı alındı - ID=" + user.getId() + ", Username=" + user.getUsername());
            }
            
            // Content ve attachment validasyonu
            String content = post.getContent();
            boolean hasContent = content != null && !content.trim().isEmpty();
            boolean hasAttachments = attachments != null && !attachments.isEmpty();
            
            System.out.println("PostController: Content kontrolü - hasContent: " + hasContent + ", hasAttachments: " + hasAttachments);
            System.out.println("PostController: Content değeri: '" + content + "'");
            
            if (!hasContent && !hasAttachments) {
                System.err.println("PostController: Hem content hem attachment boş!");
                throw new RuntimeException("Gönderi oluşturmak için en az metin veya dosya eklemelisiniz.");
            }
            
            // Dosya validasyonu
            if (attachments != null && !attachments.isEmpty()) {
                System.out.println("PostController: " + attachments.size() + " dosya yükleniyor");
                
                for (MultipartFile file : attachments) {
                    // Dosya boyutu kontrolü
                    long maxSize = 50 * 1024 * 1024; // 50MB
                    if (file.getSize() > maxSize) {
                        throw new RuntimeException("Dosya boyutu çok büyük: " + file.getOriginalFilename() + 
                            " (" + (file.getSize() / 1024 / 1024) + "MB). Maksimum 50MB olmalı.");
                    }
                    
                    // Dosya tipi kontrolü - iPhone HEIC/HEIF desteği dahil
                    String contentType = file.getContentType();
                    String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
                    
                    boolean isValidType = false;
                    if (contentType != null) {
                        // Standart mime type kontrolü
                        isValidType = contentType.startsWith("image/") || contentType.startsWith("video/");
                    }
                    
                    // iPhone HEIC/HEIF ve diğer format desteği (filename extension ile)
                    if (!isValidType) {
                        isValidType = filename.endsWith(".heic") || filename.endsWith(".heif") ||
                                     filename.endsWith(".jpg") || filename.endsWith(".jpeg") || 
                                     filename.endsWith(".png") || filename.endsWith(".gif") || 
                                     filename.endsWith(".webp") || filename.endsWith(".mp4") || 
                                     filename.endsWith(".mov") || filename.endsWith(".quicktime") ||
                                     filename.endsWith(".avi") || filename.endsWith(".webm");
                    }
                    
                    if (!isValidType) {
                        throw new RuntimeException("Desteklenmeyen dosya tipi: " + contentType + 
                            " (Dosya: " + file.getOriginalFilename() + "). Sadece resim ve video dosyaları kabul edilir.");
                    }
                    
                    // iPhone HEIC/HEIF için özel log
                    if (filename.endsWith(".heic") || filename.endsWith(".heif")) {
                        System.out.println("iPhone HEIC/HEIF dosyası kabul edildi: " + file.getOriginalFilename());
                    }
                    
                    // Video için özel kontroller
                    if (contentType != null && contentType.startsWith("video/")) {
                        System.out.println("Video dosyası yükleniyor: " + file.getOriginalFilename() + 
                            " (" + (file.getSize() / 1024 / 1024) + "MB)");
                    }
                    
                    System.out.println("Dosya kabul edildi: " + file.getOriginalFilename() + 
                        " (Tip: " + contentType + ", Boyut: " + (file.getSize() / 1024 / 1024) + "MB)");
                }
            }
            
            return postService.createPost(post, user, attachments);
        } catch (Exception e) {
            System.err.println("PostController - Gönderi oluşturulurken hata: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/posts/{id}")
    public Post getPostById(@PathVariable long id) {
        return postService.getPostById(id);
    }

    @PutMapping("/posts/{id}")
    @PreAuthorize("isAuthenticated()")
    public Post updatePost(@PathVariable long id, @Valid PostSubmitDTO postUpdate, @CurrentUser User loggedInUser) {
        if (loggedInUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                loggedInUser = userService.getUserById(currentUser.getId());
            } else {
                throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            }
        }
        
        return postService.updatePost(id, postUpdate, loggedInUser);
    }

    @DeleteMapping("/posts/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deletePost(@PathVariable long id, @CurrentUser User loggedInUser) {
        if (loggedInUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                loggedInUser = userService.getUserById(currentUser.getId());
            } else {
                throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            }
        }
        
        postService.deletePost(id, loggedInUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/posts/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> likePost(@PathVariable long id, @CurrentUser User user) {
        if (user == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser currentUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                user = userService.getUserById(currentUser.getId());
            } else {
                throw new RuntimeException("Kullanıcı bilgileri alınamadı. Lütfen tekrar giriş yapın.");
            }
        }
        
        boolean liked = postService.toggleLike(id, user);
        
        // Frontend için response
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("liked", liked);
        response.put("message", liked ? "Gönderi beğenildi" : "Beğeni kaldırıldı");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}/liked-posts")
    public Page<Post> getLikedPosts(@PathVariable long userId,
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) Pageable pageable,
            @CurrentUser User currentUser) {
            
        // Eğer currentUser null ise Security Context'ten almaya çalış
        if (currentUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getName()) &&
                authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser authUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                currentUser = userService.getUserById(authUser.getId());
            }
        }
        
        return postService.getLikedPostsByUser(userId, pageable, currentUser);
    }

    @GetMapping("/users/{userId}/media-posts")
    public Page<Post> getMediaPosts(@PathVariable long userId,
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) Pageable pageable,
            @CurrentUser User currentUser) {
            
        // Eğer currentUser null ise Security Context'ten almaya çalış
        if (currentUser == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getName()) &&
                authentication.getPrincipal() instanceof com.hoaxify.ws.configuration.CurrentUser) {
                com.hoaxify.ws.configuration.CurrentUser authUser = (com.hoaxify.ws.configuration.CurrentUser) authentication.getPrincipal();
                currentUser = userService.getUserById(authUser.getId());
            }
        }
        
        return postService.getMediaPostsByUser(userId, pageable, currentUser);
    }
} 