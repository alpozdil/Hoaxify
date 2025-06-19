package com.hoaxify.ws.message;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hoaxify.ws.message.dto.MessageDTO;
import com.hoaxify.ws.message.dto.ConversationResponseDTO;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserService userService;

    // Mesaj gönder
    @Transactional
    public Message sendMessage(MessageDTO messageDTO, User sender) {
        User receiver = userService.getUserById(messageDTO.getReceiverId());
        
        // Mesajı oluştur
        Message message = new Message(messageDTO.getContent(), sender, receiver);
        Message savedMessage = messageRepository.save(message);
        
        // Konuşmayı güncelle veya oluştur
        updateOrCreateConversation(savedMessage);
        
        return savedMessage;
    }

    // Konuşmadaki mesajları getir
    public Page<Message> getMessagesInConversation(String conversationId, Pageable pageable) {
        return messageRepository.findByConversationId(conversationId, pageable);
    }

    // İki kullanıcı arasındaki mesajları getir
    public Page<Message> getMessagesBetweenUsers(long userId1, long userId2, Pageable pageable) {
        String conversationId = generateConversationId(userId1, userId2);
        return messageRepository.findByConversationId(conversationId, pageable);
    }

    // Kullanıcının konuşmalarını getir
    public List<ConversationResponseDTO> getUserConversations(long userId) {
        Pageable pageable = PageRequest.of(0, 50); // En fazla 50 konuşma
        Page<Conversation> conversations = conversationRepository.findByUserId(userId, pageable);
        
        return conversations.getContent().stream()
                .map(conversation -> new ConversationResponseDTO(conversation, userId))
                .collect(Collectors.toList());
    }

    // Mesajları okundu olarak işaretle
    @Transactional
    public void markMessagesAsRead(String conversationId, long userId) {
        int updatedCount = messageRepository.markMessagesAsRead(conversationId, userId);
        
        // Konuşmadaki okunmamış sayacını sıfırla
        if (updatedCount > 0) {
            updateConversationUnreadCount(conversationId, userId, 0);
        }
    }

    // Okunmamış mesaj sayısını getir
    public long getUnreadMessageCount(long userId) {
        return messageRepository.countUnreadMessages(userId);
    }

    // Konuşma ID'si oluştur
    private String generateConversationId(long userId1, long userId2) {
        long minId = Math.min(userId1, userId2);
        long maxId = Math.max(userId1, userId2);
        return minId + "_" + maxId;
    }

    // Konuşmayı güncelle veya oluştur
    @Transactional
    private void updateOrCreateConversation(Message message) {
        String conversationId = message.getConversationId();
        Optional<Conversation> existingConversation = conversationRepository.findByConversationId(conversationId);
        
        Conversation conversation;
        if (existingConversation.isPresent()) {
            conversation = existingConversation.get();
        } else {
            // Yeni konuşma oluştur
            conversation = new Conversation(conversationId, message.getSender(), message.getReceiver());
        }
        
        // Konuşma bilgilerini güncelle
        conversation.setLastMessage(message.getContent());
        conversation.setLastMessageTime(message.getCreatedAt());
        conversation.setLastSender(message.getSender());
        
        // Alıcının okunmamış mesaj sayısını artır
        if (conversation.getUser1().getId() == message.getReceiver().getId()) {
            conversation.setUnreadCountUser1(conversation.getUnreadCountUser1() + 1);
        } else {
            conversation.setUnreadCountUser2(conversation.getUnreadCountUser2() + 1);
        }
        
        conversationRepository.save(conversation);
    }

    // Konuşmadaki okunmamış sayacını güncelle
    @Transactional
    private void updateConversationUnreadCount(String conversationId, long userId, int count) {
        Optional<Conversation> conversationOpt = conversationRepository.findByConversationId(conversationId);
        if (conversationOpt.isPresent()) {
            Conversation conversation = conversationOpt.get();
            
            if (conversation.getUser1().getId() == userId) {
                conversation.setUnreadCountUser1(count);
            } else if (conversation.getUser2().getId() == userId) {
                conversation.setUnreadCountUser2(count);
            }
            
            conversationRepository.save(conversation);
        }
    }

    // Belirli bir konuşmayı getir
    public Optional<Conversation> getConversation(String conversationId) {
        return conversationRepository.findByConversationId(conversationId);
    }

    // İki kullanıcı arasında konuşma başlat
    @Transactional
    public String startConversation(long userId1, long userId2) {
        String conversationId = generateConversationId(userId1, userId2);
        
        // Konuşma zaten var mı kontrol et
        Optional<Conversation> existingConversation = conversationRepository.findByConversationId(conversationId);
        if (existingConversation.isPresent()) {
            return conversationId;
        }
        
        // Yeni konuşma oluştur
        User user1 = userService.getUserById(userId1);
        User user2 = userService.getUserById(userId2);
        
        Conversation conversation = new Conversation(conversationId, user1, user2);
        conversationRepository.save(conversation);
        
        return conversationId;
    }
} 