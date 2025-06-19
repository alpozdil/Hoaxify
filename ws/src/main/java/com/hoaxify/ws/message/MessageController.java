package com.hoaxify.ws.message;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.hoaxify.ws.message.dto.MessageDTO;
import com.hoaxify.ws.message.dto.ConversationResponseDTO;
import com.hoaxify.ws.configuration.CurrentUser;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    // Mesaj gönder
    @PostMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Message> sendMessage(@Valid @RequestBody MessageDTO messageDTO, @AuthenticationPrincipal CurrentUser currentUser) {
        User user = userService.getUserById(currentUser.getId());
        Message message = messageService.sendMessage(messageDTO, user);
        return ResponseEntity.ok(message);
    }

    // Kullanıcının konuşmalarını getir
    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ConversationResponseDTO>> getUserConversations(@AuthenticationPrincipal CurrentUser currentUser) {
        List<ConversationResponseDTO> conversations = messageService.getUserConversations(currentUser.getId());
        return ResponseEntity.ok(conversations);
    }

    // Belirli konuşmadaki mesajları getir
    @GetMapping("/conversations/{conversationId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Message>> getMessagesInConversation(
            @PathVariable String conversationId,
            @PageableDefault(sort = "createdAt", direction = Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        // Kullanıcının bu konuşmaya erişim yetkisi var mı kontrol et
        if (!hasAccessToConversation(conversationId, currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        Page<Message> messages = messageService.getMessagesInConversation(conversationId, pageable);
        
        // Mesajları okundu olarak işaretle
        messageService.markMessagesAsRead(conversationId, currentUser.getId());
        
        return ResponseEntity.ok(messages);
    }

    // İki kullanıcı arasındaki mesajları getir
    @GetMapping("/messages/with/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Message>> getMessagesBetweenUsers(
            @PathVariable long otherUserId,
            @PageableDefault(sort = "createdAt", direction = Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        Page<Message> messages = messageService.getMessagesBetweenUsers(currentUser.getId(), otherUserId, pageable);
        
        // Mesajları okundu olarak işaretle
        String conversationId = generateConversationId(currentUser.getId(), otherUserId);
        messageService.markMessagesAsRead(conversationId, currentUser.getId());
        
        return ResponseEntity.ok(messages);
    }

    // Konuşma başlat
    @PostMapping("/conversations/start/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> startConversation(
            @PathVariable long otherUserId,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        String conversationId = messageService.startConversation(currentUser.getId(), otherUserId);
        
        Map<String, String> response = new HashMap<>();
        response.put("conversationId", conversationId);
        response.put("message", "Konuşma başlatıldı");
        
        return ResponseEntity.ok(response);
    }

    // Okunmamış mesaj sayısını getir
    @GetMapping("/messages/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadMessageCount(@AuthenticationPrincipal CurrentUser currentUser) {
        long unreadCount = messageService.getUnreadMessageCount(currentUser.getId());
        
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", unreadCount);
        
        return ResponseEntity.ok(response);
    }

    // Mesajları okundu olarak işaretle
    @PutMapping("/conversations/{conversationId}/mark-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markMessagesAsRead(
            @PathVariable String conversationId,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        // Kullanıcının bu konuşmaya erişim yetkisi var mı kontrol et
        if (!hasAccessToConversation(conversationId, currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }
        
        messageService.markMessagesAsRead(conversationId, currentUser.getId());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Mesajlar okundu olarak işaretlendi");
        
        return ResponseEntity.ok(response);
    }

    // Helper methods
    private boolean hasAccessToConversation(String conversationId, long userId) {
        String[] parts = conversationId.split("_");
        if (parts.length != 2) {
            return false;
        }
        
        try {
            long userId1 = Long.parseLong(parts[0]);
            long userId2 = Long.parseLong(parts[1]);
            return userId == userId1 || userId == userId2;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private String generateConversationId(long userId1, long userId2) {
        long minId = Math.min(userId1, userId2);
        long maxId = Math.max(userId1, userId2);
        return minId + "_" + maxId;
    }
} 