package com.hoaxify.ws.post;

import org.springframework.data.jpa.repository.JpaRepository;
import com.hoaxify.ws.user.User;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    Optional<PostLike> findByPostAndUser(Post post, User user);
    
    boolean existsByPostAndUser(Post post, User user);
    
    long countByPost(Post post);
    
    void deleteByPostAndUser(Post post, User user);
    
    void deleteByPost(Post post);
    
    void deleteByUser(User user);
} 