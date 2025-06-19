package com.hoaxify.ws.message;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hoaxify.ws.user.User;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue
    private long id;

    @Column(name = "conversation_id", unique = true)
    private String conversationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user1_id")
    @JsonIgnoreProperties({"password", "email", "active", "activationToken", "tokens", "passwordResetToken"})
    private User user1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user2_id")
    @JsonIgnoreProperties({"password", "email", "active", "activationToken", "tokens", "passwordResetToken"})
    private User user2;

    @Column(length = 1000)
    private String lastMessage;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastMessageTime = new Date();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "last_sender_id")
    @JsonIgnoreProperties({"password", "email", "active", "activationToken", "tokens", "passwordResetToken"})
    private User lastSender;

    @Column(name = "unread_count_user1")
    private int unreadCountUser1 = 0;

    @Column(name = "unread_count_user2")
    private int unreadCountUser2 = 0;

    public Conversation() {
    }

    public Conversation(String conversationId, User user1, User user2) {
        this.conversationId = conversationId;
        this.user1 = user1;
        this.user2 = user2;
    }

    // Getters and Setters
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

    public User getUser1() {
        return user1;
    }

    public void setUser1(User user1) {
        this.user1 = user1;
    }

    public User getUser2() {
        return user2;
    }

    public void setUser2(User user2) {
        this.user2 = user2;
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

    public User getLastSender() {
        return lastSender;
    }

    public void setLastSender(User lastSender) {
        this.lastSender = lastSender;
    }

    public int getUnreadCountUser1() {
        return unreadCountUser1;
    }

    public void setUnreadCountUser1(int unreadCountUser1) {
        this.unreadCountUser1 = unreadCountUser1;
    }

    public int getUnreadCountUser2() {
        return unreadCountUser2;
    }

    public void setUnreadCountUser2(int unreadCountUser2) {
        this.unreadCountUser2 = unreadCountUser2;
    }

    // Helper method - belirli bir kullanıcı için okunmamış mesaj sayısını al
    public int getUnreadCountForUser(long userId) {
        if (this.user1.getId() == userId) {
            return this.unreadCountUser1;
        } else if (this.user2.getId() == userId) {
            return this.unreadCountUser2;
        }
        return 0;
    }

    // Helper method - diğer kullanıcıyı al
    public User getOtherUser(long currentUserId) {
        if (this.user1.getId() == currentUserId) {
            return this.user2;
        } else if (this.user2.getId() == currentUserId) {
            return this.user1;
        }
        return null;
    }
} 