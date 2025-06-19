package com.hoaxify.ws.notification;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hoaxify.ws.user.dto.UserDTO;

public class NotificationDTO {
    
    private Long id;
    private String type;
    private String status;
    private UserDTO sourceUser;
    private Long postId;
    private String content;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private Date createdAt;

    // Constructors
    public NotificationDTO() {}

    public NotificationDTO(Notification notification) {
        this.id = notification.getId();
        this.type = notification.getType().name();
        this.status = notification.getStatus().name();
        this.sourceUser = new UserDTO(notification.getSourceUser());
        this.postId = notification.getPostId();
        this.content = notification.getContent();
        this.createdAt = notification.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UserDTO getSourceUser() {
        return sourceUser;
    }

    public void setSourceUser(UserDTO sourceUser) {
        this.sourceUser = sourceUser;
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