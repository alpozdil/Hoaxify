package com.hoaxify.ws.comment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.hoaxify.ws.post.Post;
import com.hoaxify.ws.user.User;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    Page<Comment> findByPost(Post post, Pageable pageable);
    
    Page<Comment> findByPostAndParentCommentIsNull(Post post, Pageable pageable);
    
    Page<Comment> findByUser(User user, Pageable pageable);
    
    Page<Comment> findByParentComment(Comment parentComment, Pageable pageable);
    
    long countByPost(Post post);
    
    long countByPostAndParentCommentIsNull(Post post);
    
    long countByParentComment(Comment parentComment);
    
    void deleteByPost(Post post);
    
    void deleteByUser(User user);
} 