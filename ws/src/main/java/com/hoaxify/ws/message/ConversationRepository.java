package com.hoaxify.ws.message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hoaxify.ws.user.User;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    // Konuşma ID'sine göre konuşma getir
    Optional<Conversation> findByConversationId(String conversationId);

    // Kullanıcının tüm konuşmalarını getir
    @Query("SELECT c FROM Conversation c WHERE c.user1.id = :userId OR c.user2.id = :userId ORDER BY c.lastMessageTime DESC")
    Page<Conversation> findByUserId(@Param("userId") long userId, Pageable pageable);

    // İki kullanıcı arasında konuşma var mı kontrol et
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.user1.id = :userId1 AND c.user2.id = :userId2) OR " +
           "(c.user1.id = :userId2 AND c.user2.id = :userId1)")
    Optional<Conversation> findByTwoUsers(@Param("userId1") long userId1, @Param("userId2") long userId2);

    // Kullanıcının toplam okunmamış mesaj sayısı
    @Query("SELECT " +
           "CASE " +
           "WHEN c.user1.id = :userId THEN SUM(c.unreadCountUser1) " +
           "WHEN c.user2.id = :userId THEN SUM(c.unreadCountUser2) " +
           "ELSE 0 " +
           "END " +
           "FROM Conversation c WHERE c.user1.id = :userId OR c.user2.id = :userId")
    Long getTotalUnreadCount(@Param("userId") long userId);

    // Kullanıcı silme için - user1 veya user2 olan tüm konuşmaları sil
    void deleteByUser1OrUser2(User user1, User user2);
} 