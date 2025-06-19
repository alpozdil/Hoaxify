package com.hoaxify.ws.message.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class MessageDTO {

    @NotNull
    @Size(min = 1, max = 1000)
    private String content;

    @NotNull
    private Long receiverId;

    public MessageDTO() {
    }

    public MessageDTO(String content, Long receiverId) {
        this.content = content;
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
} 