package com.hoaxify.ws.comment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.hoaxify.ws.configuration.CurrentUser;

@Service
public class CommentSecurityService {

    @Autowired
    private CommentRepository commentRepository;

    public boolean canReply(long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("CommentSecurityService.canReply: Kullanıcı kimlik doğrulaması yapılmamış");
            return false;
        }
        
        try {
            // Yorumun var olup olmadığını kontrol et
            boolean commentExists = commentRepository.existsById(commentId);
            if (!commentExists) {
                System.out.println("CommentSecurityService.canReply: Yorum bulunamadı - ID: " + commentId);
                return false;
            }
            
            System.out.println("CommentSecurityService.canReply: Yanıt izni verildi - Comment ID: " + commentId);
            return true;
        } catch (Exception e) {
            System.err.println("CommentSecurityService.canReply hata: " + e.getMessage());
            return false;
        }
    }

    public boolean canLike(long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println("CommentSecurityService.canLike: Kullanıcı kimlik doğrulaması yapılmamış");
            return false;
        }
        
        try {
            // Yorumun var olup olmadığını kontrol et
            boolean commentExists = commentRepository.existsById(commentId);
            if (!commentExists) {
                System.out.println("CommentSecurityService.canLike: Yorum bulunamadı - ID: " + commentId);
                return false;
            }
            
            System.out.println("CommentSecurityService.canLike: Beğeni izni verildi - Comment ID: " + commentId);
            return true;
        } catch (Exception e) {
            System.err.println("CommentSecurityService.canLike hata: " + e.getMessage());
            return false;
        }
    }

    public boolean canEdit(long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        try {
            Comment comment = commentRepository.findById(commentId).orElse(null);
            if (comment == null) {
                return false;
            }
            
            if (authentication.getPrincipal() instanceof CurrentUser) {
                CurrentUser currentUser = (CurrentUser) authentication.getPrincipal();
                // Sadece yorum sahibi düzenleyebilir
                return comment.getUser().getId() == currentUser.getId();
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("CommentSecurityService.canEdit hata: " + e.getMessage());
            return false;
        }
    }

    public boolean canDelete(long commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        try {
            Comment comment = commentRepository.findById(commentId).orElse(null);
            if (comment == null) {
                return false;
            }
            
            if (authentication.getPrincipal() instanceof CurrentUser) {
                CurrentUser currentUser = (CurrentUser) authentication.getPrincipal();
                // Yorum sahibi veya gönderi sahibi silebilir
                boolean isCommentOwner = comment.getUser().getId() == currentUser.getId();
                boolean isPostOwner = comment.getPost().getUser().getId() == currentUser.getId();
                return isCommentOwner || isPostOwner;
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("CommentSecurityService.canDelete hata: " + e.getMessage());
            return false;
        }
    }
} 