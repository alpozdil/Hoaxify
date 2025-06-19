package com.hoaxify.ws.comment.dto;

import com.hoaxify.ws.comment.Comment;
import com.hoaxify.ws.user.User;

import java.util.Date;

public class CommentResponseDTO {
    private long id;
    private String content;
    private Date createdAt;
    private UserInfo user;
    private int likeCount;
    private boolean liked;
    private Long parentCommentId;
    private int replyCount;

    public CommentResponseDTO() {}

    public CommentResponseDTO(Comment comment) {
        this.id = comment.getId();
        this.content = comment.getContent();
        this.createdAt = comment.getCreatedAt();
        this.likeCount = comment.getLikeCount();
        this.liked = comment.isLiked();
        this.parentCommentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;
        
        // Entity'den replyCount'u al
        this.replyCount = comment.getReplyCount();
        
        if (comment.getUser() != null) {
            this.user = new UserInfo(comment.getUser());
        }
    }

    public static class UserInfo {
        private long id;
        private String username;
        private String image;

        public UserInfo() {}

        public UserInfo(User user) {
            this.id = user.getId();
            this.username = user.getUsername();
            this.image = user.getImage();
        }

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

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }
    }

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

    public UserInfo getUser() {
        return user;
    }

    public void setUser(UserInfo user) {
        this.user = user;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public boolean isLiked() {
        return liked;
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }

    public Long getParentCommentId() {
        return parentCommentId;
    }

    public void setParentCommentId(Long parentCommentId) {
        this.parentCommentId = parentCommentId;
    }

    public int getReplyCount() {
        return replyCount;
    }

    public void setReplyCount(int replyCount) {
        this.replyCount = replyCount;
    }
} 