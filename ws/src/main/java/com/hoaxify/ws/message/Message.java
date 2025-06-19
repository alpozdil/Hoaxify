package com.hoaxify.ws.message;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hoaxify.ws.user.User;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Date;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue
    private long id;

    @Size(min = 1, max = 1000)
    @Column(length = 1000)
    private String content;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id")
    @NotNull
    @JsonIgnoreProperties({"password", "email", "active", "activationToken", "tokens", "passwordResetToken"})
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "receiver_id")
    @NotNull
    @JsonIgnoreProperties({"password", "email", "active", "activationToken", "tokens", "passwordResetToken"})
    private User receiver;

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "conversation_id")
    private String conversationId;

    public Message() {
    }

    public Message(String content, User sender, User receiver) {
        this.content = content;
        this.sender = sender;
        this.receiver = receiver;
        this.conversationId = generateConversationId(sender.getId(), receiver.getId());
    }

    // İki kullanıcı arasında benzersiz konuşma ID'si oluştur
    private String generateConversationId(long userId1, long userId2) {
        long minId = Math.min(userId1, userId2);
        long maxId = Math.max(userId1, userId2);
        return minId + "_" + maxId;
    }

    // Getters and Setters
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public User getReceiver() {
        return receiver;
    }

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }
} 