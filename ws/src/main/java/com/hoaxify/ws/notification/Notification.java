package com.hoaxify.ws.notification;

import java.util.Date;

import com.hoaxify.ws.user.User;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue
    private Long id;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status = NotificationStatus.UNREAD;

    @ManyToOne
    @JoinColumn(name = "source_user_id", nullable = false)
    private User sourceUser;

    @ManyToOne
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    private Long postId;

    private String content;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    // Constructors
    public Notification() {}

    public Notification(NotificationType type, User sourceUser, User targetUser, Long postId, String content) {
        this.type = type;
        this.sourceUser = sourceUser;
        this.targetUser = targetUser;
        this.postId = postId;
        this.content = content;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public User getSourceUser() {
        return sourceUser;
    }

    public void setSourceUser(User sourceUser) {
        this.sourceUser = sourceUser;
    }

    public User getTargetUser() {
        return targetUser;
    }

    public void setTargetUser(User targetUser) {
        this.targetUser = targetUser;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
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
} 