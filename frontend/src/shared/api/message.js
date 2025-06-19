import http from "@/lib/http";

// Konuşmaları getir
export const getConversations = () => {
  return http.get("/conversations");
};

// Belirli konuşmadaki mesajları getir
export const getMessagesInConversation = (conversationId, page = 0, size = 20) => {
  return http.get(`/conversations/${conversationId}/messages`, {
    params: { page, size }
  });
};

// İki kullanıcı arasındaki mesajları getir
export const getMessagesBetweenUsers = (otherUserId, page = 0, size = 20) => {
  return http.get(`/messages/with/${otherUserId}`, {
    params: { page, size }
  });
};

// Mesaj gönder
export const sendMessage = (content, receiverId) => {
  return http.post("/messages", {
    content,
    receiverId
  });
};

// Konuşma başlat
export const startConversation = (otherUserId) => {
  return http.post(`/conversations/start/${otherUserId}`);
};

// Okunmamış mesaj sayısını getir
export const getUnreadMessageCount = () => {
  return http.get("/messages/unread-count");
};

// Mesajları okundu olarak işaretle
export const markMessagesAsRead = (conversationId) => {
  return http.put(`/conversations/${conversationId}/mark-read`);
};

// Mesaj gönder (REST API Fallback)
export const sendMessageREST = async (messageData) => {
  return await http.post("/messages", messageData);
}; 