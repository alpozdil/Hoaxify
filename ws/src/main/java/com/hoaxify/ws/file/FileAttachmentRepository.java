package com.hoaxify.ws.file;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hoaxify.ws.post.Post;

public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {
    List<FileAttachment> findByPostId(long postId);
    
    List<FileAttachment> findByPost(Post post);
    
    void deleteByPost(Post post);
} 