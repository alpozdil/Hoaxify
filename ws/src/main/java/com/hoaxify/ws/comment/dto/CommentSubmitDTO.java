package com.hoaxify.ws.comment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CommentSubmitDTO {
    
    @NotNull
    @Size(min = 1, max = 500)
    private String content;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
} 