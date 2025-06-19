package com.hoaxify.ws.notification;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hoaxify.ws.user.User;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Kullanıcının bildirimleri - sayfalanmış
    Page<Notification> findByTargetUserOrderByCreatedAtDesc(User targetUser, Pageable pageable);

    // Kullanıcının okunmamış bildirim sayısı
    int countByTargetUserAndStatus(User targetUser, NotificationStatus status);

    // Kullanıcının belirli durumdaki bildirimleri
    List<Notification> findByTargetUserAndStatus(User targetUser, NotificationStatus status);

    // Kullanıcı ve bildirim ID'si ile bildirim bulma
    Optional<Notification> findByIdAndTargetUser(Long id, User targetUser);

    // Aynı bildirimin tekrar oluşmasını önlemek için (özellikle LIKE için)
    Optional<Notification> findByTypeAndSourceUserAndTargetUserAndPostId(
        NotificationType type, 
        User sourceUser, 
        User targetUser, 
        Long postId
    );

    // Kullanıcının tüm bildirimleri
    List<Notification> findByTargetUser(User targetUser);
    
    // Kullanıcının gönderdiği tüm bildirimler
    List<Notification> findBySourceUser(User sourceUser);

    // Post silme durumunda ilgili bildirimleri temizlemek için
    List<Notification> findByPostId(Long postId);

    // Kullanıcı takibini bırakma durumunda takip bildirimini silmek için
    Optional<Notification> findByTypeAndSourceUserAndTargetUser(
        NotificationType type, 
        User sourceUser, 
        User targetUser
    );
} 