package com.hoaxify.ws.notification;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hoaxify.ws.configuration.CurrentUser;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;

    /**
     * Kullanıcının bildirimleri - sayfalanmış
     */
    @GetMapping
    @PreAuthorize("authentication.name != null")
    public Page<NotificationDTO> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        if (currentUser == null) {
            throw new RuntimeException("Bildirimleri görüntülemek için oturum açmanız gerekiyor");
        }
        
        User user = userService.getUserById(currentUser.getId());
        return notificationService.getNotifications(user, page, size);
    }

    /**
     * Okunmamış bildirim sayısı
     * Bu endpoint anonymous kullanıcılar için 0 döndürür
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Integer> getUnreadCount(@AuthenticationPrincipal CurrentUser currentUser) {
        if (currentUser == null) {
            // Giriş yapmamış kullanıcılar için 0 döndür
            return ResponseEntity.ok(0);
        }
        
        try {
            User user = userService.getUserById(currentUser.getId());
            int count = notificationService.getUnreadCount(user);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            // Hata durumunda 0 döndür
            return ResponseEntity.ok(0);
        }
    }

    /**
     * Bildirimi okundu olarak işaretle
     */
    @PatchMapping("/{id}/read")
    @PreAuthorize("authentication.name != null")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id, 
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        if (currentUser == null) {
            throw new RuntimeException("Bildirimi işaretlemek için oturum açmanız gerekiyor");
        }
        
        User user = userService.getUserById(currentUser.getId());
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok().build();
    }

    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    @PatchMapping("/mark-all-read")
    @PreAuthorize("authentication.name != null")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal CurrentUser currentUser) {
        if (currentUser == null) {
            throw new RuntimeException("Bildirimleri işaretlemek için oturum açmanız gerekiyor");
        }
        
        User user = userService.getUserById(currentUser.getId());
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }

    /**
     * Bildirimi sil
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("authentication.name != null")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id, 
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        if (currentUser == null) {
            throw new RuntimeException("Bildirimi silmek için oturum açmanız gerekiyor");
        }
        
        User user = userService.getUserById(currentUser.getId());
        notificationService.deleteNotification(id, user);
        return ResponseEntity.ok().build();
    }

    /**
     * Tüm bildirimleri sil
     */
    @DeleteMapping("/all")
    @PreAuthorize("authentication.name != null")
    public ResponseEntity<Void> deleteAllNotifications(@AuthenticationPrincipal CurrentUser currentUser) {
        if (currentUser == null) {
            throw new RuntimeException("Bildirimleri silmek için oturum açmanız gerekiyor");
        }
        
        User user = userService.getUserById(currentUser.getId());
        notificationService.deleteAllNotifications(user);
        return ResponseEntity.ok().build();
    }
} 