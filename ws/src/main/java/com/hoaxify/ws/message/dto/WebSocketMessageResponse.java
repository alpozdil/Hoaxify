package com.hoaxify.ws.message.dto;

import java.util.Date;

public class WebSocketMessageResponse {
    private long id;
    private String content;
    private long senderId;
    private String senderUsername;
    private long receiverId;
    private String receiverUsername;
    private Date createdAt;
    private String conversationId;

    public WebSocketMessageResponse() {}

    public WebSocketMessageResponse(long id, String content, long senderId, String senderUsername, 
                                  long receiverId, String receiverUsername, Date createdAt, String conversationId) {
        this.id = id;
        this.content = content;
        this.senderId = senderId;
        this.senderUsername = senderUsername;
        this.receiverId = receiverId;
        this.receiverUsername = receiverUsername;
        this.createdAt = createdAt;
        this.conversationId = conversationId;
    }

    // Getters and Setters
    public long getId() { return id; }
    public void setId(long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public long getSenderId() { return senderId; }
    public void setSenderId(long senderId) { this.senderId = senderId; }

    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }

    public long getReceiverId() { return receiverId; }
    public void setReceiverId(long receiverId) { this.receiverId = receiverId; }

    public String getReceiverUsername() { return receiverUsername; }
    public void setReceiverUsername(String receiverUsername) { this.receiverUsername = receiverUsername; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
} 