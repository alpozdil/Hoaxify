package com.hoaxify.ws.message;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hoaxify.ws.user.User;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // İki kullanıcı arasındaki mesajları getir
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId ORDER BY m.createdAt ASC")
    Page<Message> findByConversationId(@Param("conversationId") String conversationId, Pageable pageable);

    // İki kullanıcı arasındaki mesajları getir (list olarak)
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId ORDER BY m.createdAt ASC")
    List<Message> findByConversationIdOrderByCreatedAt(@Param("conversationId") String conversationId);

    // Bir kullanıcının gönderdiği mesajlar
    @Query("SELECT m FROM Message m WHERE m.sender.id = :senderId ORDER BY m.createdAt DESC")
    Page<Message> findBySenderId(@Param("senderId") long senderId, Pageable pageable);

    // Bir kullanıcının aldığı mesajlar
    @Query("SELECT m FROM Message m WHERE m.receiver.id = :receiverId ORDER BY m.createdAt DESC")
    Page<Message> findByReceiverId(@Param("receiverId") long receiverId, Pageable pageable);

    // Okunmamış mesajları işaretle
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.conversationId = :conversationId AND m.receiver.id = :receiverId AND m.isRead = false")
    int markMessagesAsRead(@Param("conversationId") String conversationId, @Param("receiverId") long receiverId);

    // Okunmamış mesaj sayısı
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :receiverId AND m.isRead = false")
    long countUnreadMessages(@Param("receiverId") long receiverId);

    // Belirli konuşmadaki okunmamış mesaj sayısı
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :conversationId AND m.receiver.id = :receiverId AND m.isRead = false")
    long countUnreadMessagesInConversation(@Param("conversationId") String conversationId, @Param("receiverId") long receiverId);

    // En son mesajı getir
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId ORDER BY m.createdAt DESC")
    List<Message> findLatestMessageInConversation(@Param("conversationId") String conversationId, Pageable pageable);

    // Kullanıcı silme için - gönderdiği veya aldığı tüm mesajları sil
    void deleteBySenderOrReceiver(User sender, User receiver);
} 