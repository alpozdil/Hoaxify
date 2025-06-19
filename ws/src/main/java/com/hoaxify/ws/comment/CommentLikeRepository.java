package com.hoaxify.ws.comment;

import org.springframework.data.jpa.repository.JpaRepository;
import com.hoaxify.ws.user.User;

import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    
    Optional<CommentLike> findByCommentAndUser(Comment comment, User user);
    
    boolean existsByCommentAndUser(Comment comment, User user);
    
    long countByComment(Comment comment);
    
    void deleteByCommentAndUser(Comment comment, User user);
    
    void deleteByComment(Comment comment);
    
    void deleteByUser(User user);
} 