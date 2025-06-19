package com.hoaxify.ws.message.dto;

import com.hoaxify.ws.message.Conversation;
import com.hoaxify.ws.user.User;

import java.util.Date;

public class ConversationResponseDTO {

    private long id;
    private String conversationId;
    private UserSummary otherUser;
    private String lastMessage;
    private Date lastMessageTime;
    private UserSummary lastSender;
    private int unreadCount;
    private boolean isLastMessageFromMe;

    public ConversationResponseDTO() {
    }

    public ConversationResponseDTO(Conversation conversation, long currentUserId) {
        this.id = conversation.getId();
        this.conversationId = conversation.getConversationId();
        
        // Diğer kullanıcıyı belirle
        User otherUserEntity = conversation.getOtherUser(currentUserId);
        this.otherUser = new UserSummary(otherUserEntity);
        
        this.lastMessage = conversation.getLastMessage();
        this.lastMessageTime = conversation.getLastMessageTime();
        
        if (conversation.getLastSender() != null) {
            this.lastSender = new UserSummary(conversation.getLastSender());
            this.isLastMessageFromMe = conversation.getLastSender().getId() == currentUserId;
        }
        
        this.unreadCount = conversation.getUnreadCountForUser(currentUserId);
    }

    // Basit User summary sınıfı
    public static class UserSummary {
        private long id;
        private String username;
        private String email;
        private String image;

        public UserSummary(User user) {
            this.id = user.getId();
            this.username = user.getUsername();
            this.email = user.getEmail();
            this.image = user.getImage();
        }

        // Getters and Setters
        public long getId() {
            return id;
        }

        public void setId(long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }
    }

    // Ana sınıfın getters and setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public UserSummary getOtherUser() {
        return otherUser;
    }

    public void setOtherUser(UserSummary otherUser) {
        this.otherUser = otherUser;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public Date getLastMessageTime() {
        return lastMessageTime;
    }

    public void setLastMessageTime(Date lastMessageTime) {
        this.lastMessageTime = lastMessageTime;
    }

    public UserSummary getLastSender() {
        return lastSender;
    }

    public void setLastSender(UserSummary lastSender) {
        this.lastSender = lastSender;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }

    public boolean isLastMessageFromMe() {
        return isLastMessageFromMe;
    }

    public void setLastMessageFromMe(boolean lastMessageFromMe) {
        isLastMessageFromMe = lastMessageFromMe;
    }
} 