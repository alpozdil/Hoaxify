package com.hoaxify.ws.message;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.hoaxify.ws.message.dto.MessageDTO;
import com.hoaxify.ws.message.dto.WebSocketMessageResponse;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

import jakarta.validation.Valid;

@Controller
@CrossOrigin(origins = "*")
public class WebSocketMessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Mesaj gönder
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Valid @Payload MessageDTO messageDTO, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Session'dan kullanıcı bilgilerini al
            Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
            String username = (String) headerAccessor.getSessionAttributes().get("username");
            
            if (userId == null) {
                System.err.println("WebSocket: Kullanıcı kimliği bulunamadı");
                return;
            }

            // Mesajı gönderen kullanıcıyı al
            User sender = userService.getUserById(userId);
            User receiver = userService.getUserById(messageDTO.getReceiverId());

            // Mesajı kaydet
            Message savedMessage = messageService.sendMessage(messageDTO, sender);

            // WebSocket response oluştur
            WebSocketMessageResponse response = new WebSocketMessageResponse(
                savedMessage.getId(),
                savedMessage.getContent(),
                savedMessage.getSender().getId(),
                savedMessage.getSender().getUsername(),
                savedMessage.getReceiver().getId(),
                savedMessage.getReceiver().getUsername(),
                savedMessage.getCreatedAt(),
                savedMessage.getConversationId()
            );

            // Alıcıya mesajı gönder
            messagingTemplate.convertAndSendToUser(
                String.valueOf(receiver.getId()),
                "/queue/messages",
                response
            );

            // Gönderene de geri bildirim gönder (mesajın gönderildiğini teyit etmek için)
            messagingTemplate.convertAndSendToUser(
                String.valueOf(sender.getId()),
                "/queue/messages",
                response
            );

            System.out.println("WebSocket mesaj gönderildi: " + savedMessage.getContent());

        } catch (Exception e) {
            System.err.println("WebSocket mesaj gönderme hatası: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Konuşmaya katıl (mesaj okundu işaretlemek için)
    @MessageMapping("/chat.joinConversation/{conversationId}")
    public void joinConversation(@DestinationVariable String conversationId, SimpMessageHeaderAccessor headerAccessor) {
        try {
            Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
            
            if (userId != null) {
                // Mesajları okundu olarak işaretle
                messageService.markMessagesAsRead(conversationId, userId);
                
                // Diğer kullanıcıya mesajların okunduğunu bildir
                messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/read",
                    new ReadStatusUpdate(conversationId, userId)
                );
                
                System.out.println("Kullanıcı " + userId + " konuşmaya katıldı: " + conversationId);
            }
        } catch (Exception e) {
            System.err.println("Konuşmaya katılma hatası: " + e.getMessage());
        }
    }

    // Kullanıcı çevrimiçi durumu
    @MessageMapping("/chat.addUser")
    public void addUser(SimpMessageHeaderAccessor headerAccessor) {
        try {
            Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
            String username = (String) headerAccessor.getSessionAttributes().get("username");
            
            if (userId != null && username != null) {
                // Kullanıcının çevrimiçi olduğunu bildir
                messagingTemplate.convertAndSend(
                    "/topic/user.status",
                    new UserStatusUpdate(userId, username, true)
                );
                
                System.out.println("Kullanıcı çevrimiçi: " + username);
            }
        } catch (Exception e) {
            System.err.println("Kullanıcı ekleme hatası: " + e.getMessage());
        }
    }

    // Mesaj okundu durumu için yardımcı sınıf
    public static class ReadStatusUpdate {
        private String conversationId;
        private Long userId;

        public ReadStatusUpdate(String conversationId, Long userId) {
            this.conversationId = conversationId;
            this.userId = userId;
        }

        public String getConversationId() { return conversationId; }
        public Long getUserId() { return userId; }
    }

    // Kullanıcı durum güncelleme için yardımcı sınıf
    public static class UserStatusUpdate {
        private Long userId;
        private String username;
        private boolean online;

        public UserStatusUpdate(Long userId, String username, boolean online) {
            this.userId = userId;
            this.username = username;
            this.online = online;
        }

        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public boolean isOnline() { return online; }
    }
} 