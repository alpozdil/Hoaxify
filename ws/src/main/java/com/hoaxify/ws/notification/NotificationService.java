package com.hoaxify.ws.notification;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hoaxify.ws.user.User;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Yeni bildirim oluştur
     */
    public void createNotification(NotificationType type, User sourceUser, User targetUser, Long postId, String content) {
        // Kendi kendine bildirim gönderme
        if (sourceUser.getId() == targetUser.getId()) {
            return;
        }

        // Aynı bildirim zaten varsa oluşturma (özellikle LIKE için)
        if (type == NotificationType.LIKE) {
            Optional<Notification> existing = notificationRepository
                .findByTypeAndSourceUserAndTargetUserAndPostId(type, sourceUser, targetUser, postId);
            if (existing.isPresent()) {
                return;
            }
        }

        Notification notification = new Notification(type, sourceUser, targetUser, postId, content);
        notificationRepository.save(notification);
    }

    /**
     * Kullanıcının bildirimleri - sayfalanmış
     */
    public Page<NotificationDTO> getNotifications(User user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notifications = notificationRepository.findByTargetUserOrderByCreatedAtDesc(user, pageable);
        
        return notifications.map(NotificationDTO::new);
    }

    /**
     * Okunmamış bildirim sayısı
     */
    public int getUnreadCount(User user) {
        return notificationRepository.countByTargetUserAndStatus(user, NotificationStatus.UNREAD);
    }

    /**
     * Bildirimi okundu olarak işaretle
     */
    public void markAsRead(Long notificationId, User user) {
        Optional<Notification> notification = notificationRepository.findByIdAndTargetUser(notificationId, user);
        if (notification.isPresent()) {
            notification.get().setStatus(NotificationStatus.READ);
            notificationRepository.save(notification.get());
        }
    }

    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    public void markAllAsRead(User user) {
        List<Notification> notifications = notificationRepository.findByTargetUserAndStatus(user, NotificationStatus.UNREAD);
        notifications.forEach(n -> n.setStatus(NotificationStatus.READ));
        notificationRepository.saveAll(notifications);
    }

    /**
     * Bildirimi sil
     */
    public void deleteNotification(Long notificationId, User user) {
        Optional<Notification> notification = notificationRepository.findByIdAndTargetUser(notificationId, user);
        if (notification.isPresent()) {
            notificationRepository.delete(notification.get());
        }
    }

    /**
     * Tüm bildirimleri sil
     */
    public void deleteAllNotifications(User user) {
        List<Notification> notifications = notificationRepository.findByTargetUser(user);
        notificationRepository.deleteAll(notifications);
    }

    /**
     * Like geri çekildiğinde bildirimi sil
     */
    public void deleteLikeNotification(User sourceUser, User targetUser, Long postId) {
        Optional<Notification> notification = notificationRepository
            .findByTypeAndSourceUserAndTargetUserAndPostId(
                NotificationType.LIKE, sourceUser, targetUser, postId
            );
        if (notification.isPresent()) {
            notificationRepository.delete(notification.get());
        }
    }

    /**
     * Takip bırakıldığında bildirimi sil
     */
    public void deleteFollowNotification(User sourceUser, User targetUser) {
        Optional<Notification> notification = notificationRepository
            .findByTypeAndSourceUserAndTargetUser(
                NotificationType.FOLLOW, sourceUser, targetUser
            );
        if (notification.isPresent()) {
            notificationRepository.delete(notification.get());
        }
    }

    /**
     * Post silindiğinde ilgili bildirimleri temizle
     */
    public void deleteNotificationsByPostId(Long postId) {
        List<Notification> notifications = notificationRepository.findByPostId(postId);
        notificationRepository.deleteAll(notifications);
    }
} 