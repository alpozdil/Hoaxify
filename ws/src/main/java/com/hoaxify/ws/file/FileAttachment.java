package com.hoaxify.ws.file;

import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hoaxify.ws.post.Post;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

@Entity
public class FileAttachment {

    @Id
    @GeneratedValue
    private long id;

    private String name;

    private String fileType;

    @Temporal(TemporalType.TIMESTAMP)
    private Date uploadDate = new Date();

    @ManyToOne
    @JoinColumn(name = "post_id")
    @JsonIgnore
    private Post post;

    public FileAttachment() {
    }

    public FileAttachment(String name, String fileType) {
        this.name = name;
        this.fileType = fileType;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Date getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(Date uploadDate) {
        this.uploadDate = uploadDate;
    }

    public Post getPost() {
        return post;
    }

    public void setPost(Post post) {
        this.post = post;
    }
} 