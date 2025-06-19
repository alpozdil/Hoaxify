package com.hoaxify.ws.post.dto;

import jakarta.validation.constraints.Size;

public class PostSubmitDTO {
    
    @Size(max = 1000, message = "İçerik 1000 karakteri geçemez")
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 