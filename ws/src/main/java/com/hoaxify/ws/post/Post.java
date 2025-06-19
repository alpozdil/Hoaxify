package com.hoaxify.ws.post;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hoaxify.ws.file.FileAttachment;
import com.hoaxify.ws.comment.Comment;
import com.hoaxify.ws.user.User;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Date;
import java.util.List;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue
    private long id;

    @Size(max = 1000, message = "İçerik 1000 karakteri geçemez")
    @Column(length = 1000, nullable = true)
    private String content;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    private Date timestamp = new Date();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @NotNull
    @JsonIgnoreProperties({"password", "email", "active", "activationToken", "tokens", "passwordResetToken"})
    private User user;

    @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, fetch = FetchType.EAGER)
    private List<FileAttachment> fileAttachments;

    @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Comment> comments;

    private int likeCount = 0;
    
    private int commentCount = 0;

    // Kullanıcının bu gönderiyi beğenip beğenmediğini gösterir (veritabanında saklanmaz)
    @Transient
    private boolean liked = false;

    public Post() {
    }

    public Post(String content, User user) {
        this.content = content;
        this.user = user;
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

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<FileAttachment> getFileAttachments() {
        return fileAttachments;
    }

    public void setFileAttachments(List<FileAttachment> fileAttachments) {
        this.fileAttachments = fileAttachments;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public int getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(int commentCount) {
        this.commentCount = commentCount;
    }

    public boolean isLiked() {
        return liked;
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }
} 