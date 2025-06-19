package com.hoaxify.ws.comment;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hoaxify.ws.comment.dto.CommentSubmitDTO;
import com.hoaxify.ws.post.Post;
import com.hoaxify.ws.post.PostService;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.notification.NotificationService;
import com.hoaxify.ws.notification.NotificationType;

@Service
public class CommentService {
    
    @Autowired
    CommentRepository commentRepository;
    
    @Autowired
    CommentLikeRepository commentLikeRepository;
    
    @Autowired
    PostService postService;
    
    @Autowired
    NotificationService notificationService;
    
    public Page<Comment> getCommentsOfPost(long postId, Pageable pageable, User currentUser) {
        Post post = postService.getPostById(postId);
        // Sadece ana yorumları getir (parentComment = null)
        Page<Comment> comments = commentRepository.findByPostAndParentCommentIsNull(post, pageable);
        
        // Her ana yorum için replies sayısını hesapla
        for (Comment comment : comments.getContent()) {
            // Yorumun yanıt sayısını hesapla ve set et
            long replyCount = commentRepository.countByParentComment(comment);
            comment.setReplyCount((int) replyCount);
            
            // Replies listesini boş liste yap (performans için lazy loading)
            comment.setReplies(new java.util.ArrayList<>());
        }
        
        setLikedStatusForComments(comments.getContent(), currentUser);
        return comments;
    }
    
    public Page<Comment> getCommentsOfPost(long postId, Pageable pageable) {
        return getCommentsOfPost(postId, pageable, null);
    }
    
    public Page<Comment> getCommentsOfUser(long userId, Pageable pageable) {
        // User'ı almak için UserService'e ihtiyaç var ama şimdilik basit bir yaklaşım kullanıyoruz
        User user = new User();
        user.setId(userId);
        return commentRepository.findByUser(user, pageable);
    }
    
    @Transactional
    public Comment createComment(long postId, CommentSubmitDTO commentSubmit, User user) {
        try {
            System.out.println("CommentService.createComment çağrıldı. Post ID: " + postId + ", Kullanıcı: " + user.getUsername());
            
            Post post = postService.getPostById(postId);
            
            Comment comment = new Comment();
            comment.setContent(commentSubmit.getContent());
            comment.setUser(user);
            comment.setPost(post);
            
            Comment savedComment = commentRepository.save(comment);
            
            // Post'un yorum sayısını artır
            postService.increaseCommentCount(postId);
            
            // Yorum bildirimi oluştur (kendi gönderisine yorum yapmıyorsa)
            if (user.getId() != post.getUser().getId()) {
                notificationService.createNotification(
                    NotificationType.COMMENT, 
                    user, 
                    post.getUser(), 
                    postId, 
                    commentSubmit.getContent()
                );
            }
            
            return savedComment;
        } catch (Exception e) {
            System.err.println("Yorum oluşturulurken hata: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Comment getCommentById(long id) {
        Optional<Comment> optionalComment = commentRepository.findById(id);
        if (optionalComment.isPresent()) {
            return optionalComment.get();
        }
        throw new RuntimeException("Yorum bulunamadı");
    }
    
    public Comment updateComment(long id, CommentSubmitDTO commentUpdate, User loggedInUser) {
        Comment comment = getCommentById(id);
        
        if (comment.getUser().getId() != loggedInUser.getId()) {
            throw new RuntimeException("Bu yorumu düzenleme yetkiniz yok");
        }
        
        comment.setContent(commentUpdate.getContent());
        return commentRepository.save(comment);
    }
    
    @Transactional
    public void deleteComment(long id, User loggedInUser) {
        Comment comment = getCommentById(id);
        
        // Yetki kontrolü: Kendi yorumu veya gönderi sahibi olabilir
        boolean isCommentOwner = comment.getUser().getId() == loggedInUser.getId();
        boolean isPostOwner = comment.getPost().getUser().getId() == loggedInUser.getId();
        
        if (!isCommentOwner && !isPostOwner) {
            throw new RuntimeException("Bu yorumu silme yetkiniz yok. Sadece kendi yorumlarınızı veya kendi gönderinizdeki yorumları silebilirsiniz.");
        }
        
        System.out.println("CommentService: Yorum siliniyor - Yorum ID: " + id + 
                          ", Silen Kullanıcı: " + loggedInUser.getUsername() + 
                          ", Yorum Sahibi: " + isCommentOwner + 
                          ", Gönderi Sahibi: " + isPostOwner);
        
        // Yorum beğenilerini sil
        commentLikeRepository.deleteByComment(comment);
        
        // Post'un yorum sayısını azalt
        postService.decreaseCommentCount(comment.getPost().getId());
        
        commentRepository.delete(comment);
    }
    
    public long getCommentCountByPost(long postId) {
        Post post = postService.getPostById(postId);
        return commentRepository.countByPost(post);
    }
    
    @Transactional
    public Comment createReply(long commentId, CommentSubmitDTO replySubmit, User user) {
        Comment parentComment = getCommentById(commentId);
        Post post = parentComment.getPost();
        
        Comment reply = new Comment();
        reply.setContent(replySubmit.getContent());
        reply.setUser(user);
        reply.setPost(post);
        reply.setParentComment(parentComment);
        
        Comment savedReply = commentRepository.save(reply);
        
        // Post'un yorum sayısını artır
        postService.increaseCommentCount(post.getId());
        
        // Yanıt bildirimi oluştur (kendi yorumuna yanıt vermiyorsa)
        if (user.getId() != parentComment.getUser().getId()) {
            notificationService.createNotification(
                NotificationType.COMMENT, 
                user, 
                parentComment.getUser(), 
                post.getId(), 
                replySubmit.getContent()
            );
        }
        
        return savedReply;
    }
    
    @Transactional
    public boolean toggleLike(long commentId, User user) {
        Comment comment = getCommentById(commentId);
        
        Optional<CommentLike> existingLike = commentLikeRepository.findByCommentAndUser(comment, user);
        
        if (existingLike.isPresent()) {
            // Unlike - beğeniyi kaldır
            commentLikeRepository.delete(existingLike.get());
            comment.setLikeCount(comment.getLikeCount() - 1);
            commentRepository.save(comment);
            System.out.println("CommentService: Kullanıcı " + user.getUsername() + " yorum " + commentId + " beğenisini kaldırdı");
            
            // Beğeni bildirimini sil
            notificationService.deleteLikeNotification(user, comment.getUser(), comment.getPost().getId());
            
            return false; // unliked
        } else {
            // Like - beğeni ekle
            CommentLike commentLike = new CommentLike(comment, user);
            commentLikeRepository.save(commentLike);
            comment.setLikeCount(comment.getLikeCount() + 1);
            commentRepository.save(comment);
            System.out.println("CommentService: Kullanıcı " + user.getUsername() + " yorum " + commentId + " beğendi");
            
            // Beğeni bildirimi oluştur (kendi yorumunu beğenmiyorsa)
            if (user.getId() != comment.getUser().getId()) {
                notificationService.createNotification(
                    NotificationType.LIKE, 
                    user, 
                    comment.getUser(), 
                    comment.getPost().getId(), 
                    null
                );
            }
            
            return true; // liked
        }
    }
    
    public boolean isCommentLikedByUser(long commentId, User user) {
        Comment comment = getCommentById(commentId);
        return commentLikeRepository.existsByCommentAndUser(comment, user);
    }
    
    public Page<Comment> getReplies(long commentId, Pageable pageable, User currentUser) {
        Comment parentComment = getCommentById(commentId);
        Page<Comment> replies = commentRepository.findByParentComment(parentComment, pageable);
        setLikedStatusForComments(replies.getContent(), currentUser);
        return replies;
    }
    
    public Page<Comment> getReplies(long commentId, Pageable pageable) {
        return getReplies(commentId, pageable, null);
    }
    
    // Yorumların beğeni durumunu set et
    private void setLikedStatusForComments(List<Comment> comments, User currentUser) {
        if (currentUser == null) return;
        
        for (Comment comment : comments) {
            boolean isLiked = isCommentLikedByUser(comment.getId(), currentUser);
            comment.setLiked(isLiked);
        }
    }
    
    // Tek yorum için beğeni durumunu set et
    private void setLikedStatusForComment(Comment comment, User currentUser) {
        if (currentUser == null) return;
        
        boolean isLiked = isCommentLikedByUser(comment.getId(), currentUser);
        comment.setLiked(isLiked);
    }
} 