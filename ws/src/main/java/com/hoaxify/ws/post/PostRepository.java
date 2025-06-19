package com.hoaxify.ws.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hoaxify.ws.user.User;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    
    Page<Post> findByUser(User user, Pageable pageable);
    
    List<Post> findByUser(User user);
    
    void deleteByUser(User user);
    
    Page<Post> findAll(Pageable pageable);

    // Arama sorguları
    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Post> findByContentContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE " +
           "LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.user.username) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Post> searchPostsByContentOrUsername(@Param("keyword") String keyword, Pageable pageable);

    // Kullanıcının beğendiği gönderileri getir
    @Query("SELECT p FROM Post p JOIN PostLike pl ON p.id = pl.post.id WHERE pl.user = :user ORDER BY pl.id DESC")
    Page<Post> findLikedPostsByUser(@Param("user") User user, Pageable pageable);

    // Kullanıcının medya içeren gönderilerini getir (resim/video)
    @Query("SELECT DISTINCT p FROM Post p JOIN p.fileAttachments fa WHERE p.user = :user AND (fa.fileType LIKE 'image/%' OR fa.fileType LIKE 'video/%') ORDER BY p.createdAt DESC")
    Page<Post> findMediaPostsByUser(@Param("user") User user, Pageable pageable);
} 