package com.hoaxify.ws.user;

import java.util.UUID;
import java.util.List;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.MailException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hoaxify.ws.configuration.CurrentUser;
import com.hoaxify.ws.email.EmailService;
import com.hoaxify.ws.file.FileService;
import com.hoaxify.ws.user.dto.PasswordResetRequest;
import com.hoaxify.ws.user.dto.PasswordUpdate;
import com.hoaxify.ws.user.dto.UserUpdate;
import com.hoaxify.ws.user.exception.ActivationNotificationException;
import com.hoaxify.ws.user.exception.InvalidTokenException;
import com.hoaxify.ws.user.exception.NotFoundException;
import com.hoaxify.ws.user.exception.NotUniqueEmailException;

// İlişkili repository'leri import et
import com.hoaxify.ws.post.PostRepository;
import com.hoaxify.ws.post.PostLikeRepository;
import com.hoaxify.ws.comment.CommentRepository;
import com.hoaxify.ws.message.MessageRepository;
import com.hoaxify.ws.message.ConversationRepository;
import com.hoaxify.ws.file.FileAttachmentRepository;
import com.hoaxify.ws.notification.NotificationService;
import com.hoaxify.ws.notification.NotificationType;
import com.hoaxify.ws.notification.NotificationRepository;
import com.hoaxify.ws.notification.Notification;
import com.hoaxify.ws.comment.CommentLikeRepository;
import com.hoaxify.ws.comment.Comment;

@Service
public class UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserFollowingRepository userFollowingRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    EmailService emailService;

    @Autowired
    FileService fileService;

    // İlişkili veri silme için gerekli repository'ler
    @Autowired
    PostRepository postRepository;

    @Autowired
    PostLikeRepository postLikeRepository;

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    MessageRepository messageRepository;

    @Autowired
    ConversationRepository conversationRepository;

    @Autowired
    FileAttachmentRepository fileAttachmentRepository;
    
    @Autowired
    NotificationService notificationService;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    CommentLikeRepository commentLikeRepository;

    @Transactional(rollbackFor = MailException.class)
    public void save(User user){
        try {
            // Eğer aynı email'le inactive bir kullanıcı varsa, onu sil ve yeni kayıt yap
            User existingUser = userRepository.findByEmail(user.getEmail());
            if (existingUser != null && !existingUser.isActive()) {
                System.out.println("Inactive kullanıcı bulundu ve siliniyor: " + existingUser.getEmail());
                userRepository.delete(existingUser);
                userRepository.flush(); // Silme işlemini hemen gerçekleştir
            }
            
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setActivationToken(UUID.randomUUID().toString());
            userRepository.saveAndFlush(user);
            emailService.sendActivationEmail(user.getEmail(), user.getActivationToken());
            
            System.out.println("Kullanıcı başarıyla kaydedildi: " + user.getEmail());
        } catch (DataIntegrityViolationException ex){
            throw new NotUniqueEmailException();
        } catch (MailException ex) {
            throw new ActivationNotificationException();
        }
    }

    public void activateUser(String token) {
        User inDB = userRepository.findByActivationToken(token);
        if(inDB == null) {
            throw new InvalidTokenException();
        }
        inDB.setActive(true);
        inDB.setActivationToken(null);
        userRepository.save(inDB);
    }

    public Page<User> getUsers(Pageable page, CurrentUser currentUser) {
        if(currentUser == null) {
            return userRepository.findAll(page);
        }
        return userRepository.findByIdNot(currentUser.getId(), page);
    }

    public User getUser(long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException(id));
    }

    public User getUserById(long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException(id));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(long id, UserUpdate userUpdate) {
        System.out.println("=== UserService.updateUser başlatıldı ===");
        System.out.println("User ID: " + id);
        System.out.println("Username: " + userUpdate.username());
        System.out.println("Bio: " + userUpdate.bio());
        System.out.println("Image var mı: " + (userUpdate.image() != null));
        System.out.println("Banner var mı: " + (userUpdate.banner() != null));
        
        User inDB = getUser(id);
        
        // Username sadece gönderilirse güncelle
        if(userUpdate.username() != null && !userUpdate.username().trim().isEmpty()) {
            inDB.setUsername(userUpdate.username());
            System.out.println("Username güncellendi: " + userUpdate.username());
        } else {
            System.out.println("Username güncellenmedi (null veya boş)");
        }
        
        // Profil fotoğrafı güncelleme
        if(userUpdate.image() != null) {
            System.out.println("Profil fotoğrafı güncelleniyor...");
            if(userUpdate.image().trim().isEmpty()) {
                System.out.println("Profil fotoğrafı siliniyor...");
                // Boş string gönderildiyse profil fotoğrafını sil
                if(inDB.getImage() != null) {
                    fileService.deleteProfileImage(inDB.getImage());
                    inDB.setImage(null);
                    System.out.println("Eski profil fotoğrafı silindi");
                }
            } else {
                System.out.println("Yeni profil fotoğrafı kaydediliyor...");
                System.out.println("Base64 data uzunluğu: " + userUpdate.image().length());
                // Yeni fotoğraf yükle
                String fileName = fileService.saveBase64StringAsFile(userUpdate.image());
                if(fileName != null) {
                    // Eski profil fotoğrafını sil (eğer varsa)
                    if(inDB.getImage() != null) {
                        fileService.deleteProfileImage(inDB.getImage());
                        System.out.println("Eski profil fotoğrafı silindi: " + inDB.getImage());
                    }
                    inDB.setImage(fileName);
                    System.out.println("Yeni profil fotoğrafı kaydedildi: " + fileName);
                } else {
                    System.err.println("Profil fotoğrafı kaydedilemedi!");
                }
            }
        } else {
            System.out.println("Profil fotoğrafı değiştirilmiyor (null)");
        }
        
        // Banner fotoğrafı güncelleme
        if(userUpdate.banner() != null) {
            System.out.println("Banner fotoğrafı güncelleniyor...");
            if(userUpdate.banner().trim().isEmpty()) {
                System.out.println("Banner fotoğrafı siliniyor...");
                // Boş string gönderildiyse banner'ı sil
                if(inDB.getBanner() != null) {
                    fileService.deleteProfileImage(inDB.getBanner());
                    inDB.setBanner(null);
                    System.out.println("Eski banner silindi");
                }
            } else {
                System.out.println("Yeni banner kaydediliyor...");
                System.out.println("Banner Base64 data uzunluğu: " + userUpdate.banner().length());
                // Yeni banner yükle
                String bannerFileName = fileService.saveBase64StringAsFile(userUpdate.banner());
                if(bannerFileName != null) {
                    // Eski banner'ı sil (eğer varsa)
                    if(inDB.getBanner() != null) {
                        fileService.deleteProfileImage(inDB.getBanner());
                        System.out.println("Eski banner silindi: " + inDB.getBanner());
                    }
                    inDB.setBanner(bannerFileName);
                    System.out.println("Yeni banner kaydedildi: " + bannerFileName);
                } else {
                    System.err.println("Banner kaydedilemedi!");
                }
            }
        } else {
            System.out.println("Banner değiştirilmiyor (null)");
        }
        
        // Bio güncelleme - null kontrolü yap
        if(userUpdate.bio() != null) {
            inDB.setBio(userUpdate.bio().isEmpty() ? null : userUpdate.bio());
            System.out.println("Bio güncellendi: '" + userUpdate.bio() + "'");
        } else {
            System.out.println("Bio null, güncellenmedi");
        }
        
        User savedUser = userRepository.save(inDB);
        System.out.println("=== UserService.updateUser tamamlandı ===");
        System.out.println("Kaydedilen kullanıcı username: " + savedUser.getUsername());
        System.out.println("Kaydedilen kullanıcı image: " + savedUser.getImage());
        System.out.println("Kaydedilen kullanıcı banner: " + savedUser.getBanner());
        System.out.println("Kaydedilen kullanıcı bio: " + savedUser.getBio());
        
        return savedUser;
    }

    @Transactional
    public void deleteUser(long id) {
        User inDB = getUser(id);
        
        try {
            // 1. Kullanıcının mesajlarını ve konuşmalarını sil
            messageRepository.deleteBySenderOrReceiver(inDB, inDB);
            conversationRepository.deleteByUser1OrUser2(inDB, inDB);
            
            // 2. Kullanıcının bildirimleri sil
            List<Notification> userNotifications = notificationRepository.findByTargetUser(inDB);
            notificationRepository.deleteAll(userNotifications);
            
            // 3. Kullanıcının gönderdiği bildirimleri sil
            List<Notification> sentNotifications = notificationRepository.findBySourceUser(inDB);
            notificationRepository.deleteAll(sentNotifications);
            
            // 4. Kullanıcının postlarına yapılan beğenileri ve yorumları sil
            List<com.hoaxify.ws.post.Post> userPosts = postRepository.findByUser(inDB);
            for (com.hoaxify.ws.post.Post post : userPosts) {
                postLikeRepository.deleteByPost(post);
                
                // Post'a yapılan yorumların beğenilerini sil
                List<Comment> postComments = commentRepository.findByPost(post, org.springframework.data.domain.Pageable.unpaged()).getContent();
                for (Comment comment : postComments) {
                    commentLikeRepository.deleteByComment(comment);
                }
                
                commentRepository.deleteByPost(post);
                fileAttachmentRepository.deleteByPost(post);
                
                // Post'a ait bildirimleri sil
                notificationService.deleteNotificationsByPostId(post.getId());
            }
            
            // 5. Kullanıcının postlarını sil
            postRepository.deleteByUser(inDB);
            
            // 6. Kullanıcının diğer postlara yaptığı yorumlarının beğenilerini sil
            List<Comment> userComments = commentRepository.findByUser(inDB, org.springframework.data.domain.Pageable.unpaged()).getContent();
            for (Comment comment : userComments) {
                commentLikeRepository.deleteByComment(comment);
            }
            
            // 7. Kullanıcının diğer postlara yaptığı yorumları sil
            commentRepository.deleteByUser(inDB);
            
            // 8. Kullanıcının yorum beğenilerini sil
            commentLikeRepository.deleteByUser(inDB);
            
            // 9. Kullanıcının diğer postlara verdiği beğenileri sil
            postLikeRepository.deleteByUser(inDB);
            
            // 10. Takip ilişkilerini sil (hem takip ettiği hem de takip edenleri)
            userFollowingRepository.deleteByFollowerOrFollowing(inDB, inDB);
            
            // 11. Profil resmini sil
            if(inDB.getImage() != null) {
                fileService.deleteProfileImage(inDB.getImage());
            }
            
            // 12. Kullanıcıyı sil (Token'lar cascade ile otomatik silinecek)
            userRepository.delete(inDB);
            
            System.out.println("Kullanıcı ve tüm ilişkili verileri başarıyla silindi: " + inDB.getEmail());
            
        } catch (Exception e) {
            System.err.println("Kullanıcı silinirken hata oluştu: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Hesap kapatılırken bir hata oluştu", e);
        }
    }

    public void handleResetRequest(PasswordResetRequest passwordResetRequest) {
        User inDB = findByEmail(passwordResetRequest.email());
        if(inDB == null) throw new NotFoundException(0);
        inDB.setPasswordResetToken(UUID.randomUUID().toString());
        this.userRepository.save(inDB);
        this.emailService.sendPasswordResetEmail(inDB.getEmail(), inDB.getPasswordResetToken());
      }

    public void updatePassword(String token, PasswordUpdate passwordUpdate) {
        User inDB = userRepository.findByPasswordResetToken(token);
        if(inDB == null) {
            throw new InvalidTokenException();
        }
        inDB.setPasswordResetToken(null);
        inDB.setPassword(passwordEncoder.encode(passwordUpdate.password()));
        inDB.setActive(true);
        userRepository.save(inDB);
    }

    public void resendActivationEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User with email " + email + " not found");
        }
        
        if (user.isActive()) {
            throw new RuntimeException("User is already activated");
        }
        
        try {
            // Yeni aktivasyon token'ı oluştur
            user.setActivationToken(UUID.randomUUID().toString());
            userRepository.save(user);
            
            // Email'i yeniden gönder
            emailService.sendActivationEmail(user.getEmail(), user.getActivationToken());
            
            System.out.println("Aktivasyon e-postası yeniden gönderildi: " + email);
        } catch (MailException ex) {
            throw new ActivationNotificationException();
        }
    }

    // Takip işlemleri

    @Transactional
    public void followUser(long followerId, long followingId) {
        if (followerId == followingId) {
            throw new RuntimeException("Kullanıcı kendisini takip edemez");
        }

        User follower = getUser(followerId);
        User following = getUser(followingId);

        if (userFollowingRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new RuntimeException("Bu kullanıcıyı zaten takip ediyorsunuz");
        }

        UserFollowing userFollowing = new UserFollowing(follower, following);
        userFollowingRepository.save(userFollowing);
        
        // Takip bildirimi oluştur
        notificationService.createNotification(
            NotificationType.FOLLOW, 
            follower, 
            following, 
            null, 
            null
        );
    }

    @Transactional
    public void unfollowUser(long followerId, long followingId) {
        User follower = getUser(followerId);
        User following = getUser(followingId);

        if (!userFollowingRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new RuntimeException("Bu kullanıcıyı zaten takip etmiyorsunuz");
        }

        userFollowingRepository.deleteByFollowerAndFollowing(follower, following);
        
        // Takip bildirimini sil
        notificationService.deleteFollowNotification(follower, following);
    }

    public boolean isFollowing(long followerId, long followingId) {
        User follower = getUser(followerId);
        User following = getUser(followingId);
        return userFollowingRepository.existsByFollowerAndFollowing(follower, following);
    }

    public List<User> getFollowing(long userId) {
        User user = getUser(userId);
        return userFollowingRepository.findFollowingByFollower(user);
    }

    public List<User> getFollowers(long userId) {
        User user = getUser(userId);
        return userFollowingRepository.findFollowersByFollowing(user);
    }

    public Long getFollowingCount(long userId) {
        User user = getUser(userId);
        return userFollowingRepository.countFollowingByFollower(user);
    }

    public Long getFollowersCount(long userId) {
        User user = getUser(userId);
        return userFollowingRepository.countFollowersByFollowing(user);
    }

    // Arama fonksiyonları

    public Page<User> searchUsers(String keyword, Pageable pageable, CurrentUser currentUser) {
        if (keyword == null || keyword.trim().isEmpty()) {
            // Anahtar kelime boşsa tüm kullanıcıları döndür (kendisi hariç)
            if (currentUser != null) {
                return userRepository.findByIdNot(currentUser.getId(), pageable);
            } else {
                return userRepository.findAll(pageable);
            }
        }
        
        keyword = keyword.trim();
        
        if (currentUser != null) {
            return userRepository.searchUsersExcludingCurrent(keyword, currentUser.getId(), pageable);
        } else {
            return userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(keyword, pageable);
        }
    }
}
