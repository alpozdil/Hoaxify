package com.hoaxify.ws.post;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import com.hoaxify.ws.file.FileAttachment;
import com.hoaxify.ws.file.FileService;
import com.hoaxify.ws.post.dto.PostSubmitDTO;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;
import com.hoaxify.ws.notification.NotificationService;
import com.hoaxify.ws.notification.NotificationType;

@Service
public class PostService {
    
    @Autowired
    PostRepository postRepository;
    
    @Autowired
    PostLikeRepository postLikeRepository;
    
    @Autowired
    UserService userService;
    
    @Autowired
    FileService fileService;
    
    @Autowired
    NotificationService notificationService;
    
    public Page<Post> getPosts(Pageable pageable, User currentUser) {
        try {
            System.out.println("PostService.getPosts çağrıldı: " + pageable);
            Page<Post> posts = postRepository.findAll(pageable);
            setLikedStatusForPosts(posts.getContent(), currentUser);
            return posts;
        } catch (Exception e) {
            System.err.println("Gönderiler alınırken hata oluştu: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Page<Post> getPosts(Pageable pageable) {
        return getPosts(pageable, null);
    }
    
    public Page<Post> getPostsOfUser(long userId, Pageable pageable, User currentUser) {
        User user = userService.getUserById(userId);
        Page<Post> posts = postRepository.findByUser(user, pageable);
        setLikedStatusForPosts(posts.getContent(), currentUser);
        return posts;
    }
    
    // Geriye uyumluluk için overloaded method
    public Page<Post> getPostsOfUser(long userId, Pageable pageable) {
        return getPostsOfUser(userId, pageable, null);
    }
    
    @Transactional
    public Post createPost(PostSubmitDTO postSubmit, User user, List<MultipartFile> attachments) {
        try {
            System.out.println("=== PostService.createPost BAŞLADI ===");
            System.out.println("Kullanıcı: " + user.getUsername() + " (ID: " + user.getId() + ")");
            System.out.println("İçerik: '" + postSubmit.getContent() + "'");
            System.out.println("Attachment sayısı: " + (attachments != null ? attachments.size() : 0));
            
            Post post = new Post();
            
            // Content kontrolü - boş string veya null ise null olarak kaydet
            String content = postSubmit.getContent();
            if (content != null && content.trim().isEmpty()) {
                content = null; // Boş string yerine null kaydet
                System.out.println("Boş content null olarak ayarlandı");
            }
            post.setContent(content);
            post.setUser(user);
            
            Post savedPost = postRepository.save(post);
            System.out.println("Post kaydedildi, ID: " + savedPost.getId() + ", Content: " + savedPost.getContent());
            
            if (attachments != null && !attachments.isEmpty()) {
                System.out.println("Attachment'lar işleniyor...");
                List<FileAttachment> savedAttachments = fileService.savePostAttachments(attachments, savedPost);
                System.out.println("Kaydedilen attachment sayısı: " + savedAttachments.size());
                
                savedPost.setFileAttachments(savedAttachments);
                
                // FileAttachment bilgilerini logla
                for (FileAttachment attachment : savedAttachments) {
                    System.out.println("- Attachment ID: " + attachment.getId() + 
                        ", Name: " + attachment.getName() + 
                        ", Type: " + attachment.getFileType());
                }
            }
            
            System.out.println("=== PostService.createPost TAMAMLANDI ===");
            return savedPost;
        } catch (Exception e) {
            System.err.println("=== PostService.createPost HATA ===");
            System.err.println("Gönderi oluşturulurken hata: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Post getPostById(long id) {
        Optional<Post> optionalPost = postRepository.findById(id);
        if (optionalPost.isPresent()) {
            return optionalPost.get();
        }
        throw new RuntimeException("Post bulunamadı");
    }
    
    public Post updatePost(long id, PostSubmitDTO postUpdate, User loggedInUser) {
        Post post = getPostById(id);
        
        if (post.getUser().getId() != loggedInUser.getId()) {
            throw new RuntimeException("Bu gönderiyi düzenleme yetkiniz yok");
        }
        
        post.setContent(postUpdate.getContent());
        return postRepository.save(post);
    }
    
    public void deletePost(long id, User loggedInUser) {
        Post post = getPostById(id);
        
        if (post.getUser().getId() != loggedInUser.getId()) {
            throw new RuntimeException("Bu gönderiyi silme yetkiniz yok");
        }
        
        // Post ile ilgili bildirimleri sil
        notificationService.deleteNotificationsByPostId(id);
        
        postRepository.delete(post);
    }
    
    @Transactional
    public boolean toggleLike(long postId, User user) {
        Post post = getPostById(postId);
        
        Optional<PostLike> existingLike = postLikeRepository.findByPostAndUser(post, user);
        
        if (existingLike.isPresent()) {
            // Unlike - beğeniyi kaldır
            postLikeRepository.delete(existingLike.get());
            post.setLikeCount(post.getLikeCount() - 1);
            postRepository.save(post);
            System.out.println("PostService: Kullanıcı " + user.getUsername() + " post " + postId + " beğenisini kaldırdı");
            
            // Beğeni bildirimini sil
            notificationService.deleteLikeNotification(user, post.getUser(), postId);
            
            return false; // unliked
        } else {
            // Like - beğeni ekle
            PostLike postLike = new PostLike(post, user);
            postLikeRepository.save(postLike);
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            System.out.println("PostService: Kullanıcı " + user.getUsername() + " post " + postId + " beğendi");
            
            // Beğeni bildirimi oluştur (kendi gönderisini beğenmiyorsa)
            if (user.getId() != post.getUser().getId()) {
                notificationService.createNotification(
                    NotificationType.LIKE, 
                    user, 
                    post.getUser(), 
                    postId, 
                    null
                );
            }
            
            return true; // liked
        }
    }
    
    public boolean isPostLikedByUser(long postId, User user) {
        Post post = getPostById(postId);
        return postLikeRepository.existsByPostAndUser(post, user);
    }
    
    public Page<Post> getLikedPostsByUser(long userId, Pageable pageable, User currentUser) {
        User user = userService.getUserById(userId);
        Page<Post> posts = postRepository.findLikedPostsByUser(user, pageable);
        setLikedStatusForPosts(posts.getContent(), currentUser);
        return posts;
    }
    
    // Geriye uyumluluk için overloaded method
    public Page<Post> getLikedPostsByUser(long userId, Pageable pageable) {
        return getLikedPostsByUser(userId, pageable, null);
    }
    
    public Page<Post> getMediaPostsByUser(long userId, Pageable pageable, User currentUser) {
        User user = userService.getUserById(userId);
        Page<Post> posts = postRepository.findMediaPostsByUser(user, pageable);
        setLikedStatusForPosts(posts.getContent(), currentUser);
        return posts;
    }
    
    // Geriye uyumluluk için overloaded method
    public Page<Post> getMediaPostsByUser(long userId, Pageable pageable) {
        return getMediaPostsByUser(userId, pageable, null);
    }
    
    public void increaseCommentCount(long postId) {
        Post post = getPostById(postId);
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
    }
    
    public void decreaseCommentCount(long postId) {
        Post post = getPostById(postId);
        if (post.getCommentCount() > 0) {
            post.setCommentCount(post.getCommentCount() - 1);
            postRepository.save(post);
        }
    }

    // Arama fonksiyonları

    public Page<Post> searchPosts(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return postRepository.findAll(pageable);
        }
        
        keyword = keyword.trim();
        return postRepository.searchPostsByContentOrUsername(keyword, pageable);
    }

    public Page<Post> searchPostsByContent(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return postRepository.findAll(pageable);
        }
        
        keyword = keyword.trim();
        return postRepository.findByContentContainingIgnoreCase(keyword, pageable);
    }

    // Gönderilere kullanıcının beğeni durumunu ekler
    private void setLikedStatusForPosts(List<Post> posts, User currentUser) {
        if (currentUser == null) return;
        
        for (Post post : posts) {
            boolean isLiked = isPostLikedByUser(post.getId(), currentUser);
            post.setLiked(isLiked);
        }
    }
    
    // Tek gönderi için beğeni durumunu ekler
    private void setLikedStatusForPost(Post post, User currentUser) {
        if (currentUser == null) return;
        
        boolean isLiked = isPostLikedByUser(post.getId(), currentUser);
        post.setLiked(isLiked);
    }
} 