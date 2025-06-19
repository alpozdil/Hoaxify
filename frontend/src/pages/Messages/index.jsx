import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthState } from "@/shared/state/context";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { useToastContext } from "@/App";
import { 
  getConversations, 
  getMessagesInConversation, 
  sendMessage, 
  markMessagesAsRead,
  startConversation 
} from "@/shared/api/message";

export function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const authState = useAuthState();
  const { showError, showSuccess } = useToastContext();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);

  // Konuşmaları yükle
  useEffect(() => {
    loadConversations();
  }, []);

  // Seçili konuşma değiştiğinde mesajları yükle
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      markConversationAsRead(conversationId);
      // Mobil cihazlarda mesaj alanını göster
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    }
  }, [conversationId]);

  // Yeni mesaj geldiğinde scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error("Konuşmalar yüklenirken hata:", error);
      showError("Konuşmalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const response = await getMessagesInConversation(convId);
      setMessages(response.data.content || []);
      
      // Seçili konuşmayı bul
      const conversation = conversations.find(c => c.conversationId === convId);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error("Mesajlar yüklenirken hata:", error);
      showError("Mesajlar yüklenemedi");
    }
  };

  const markConversationAsRead = async (convId) => {
    try {
      await markMessagesAsRead(convId);
      // Konuşma listesini güncelle
      loadConversations();
    } catch (error) {
      console.error("Mesajlar okundu olarak işaretlenirken hata:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      await sendMessage(newMessage, selectedConversation.otherUser.id);
      setNewMessage("");
      showSuccess("Mesaj gönderildi");
      
      // Mesajları yeniden yükle
      loadMessages(conversationId);
      loadConversations();
    } catch (error) {
      console.error("Mesaj gönderilirken hata:", error);
      showError("Mesaj gönderilemedi");
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return "Dün";
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('tr-TR', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
  };

  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Şimdi";
    if (diffInMinutes < 60) return `${diffInMinutes}dk`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}sa`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const selectConversation = (conversation) => {
    navigate(`/messages/${conversation.conversationId}`);
  };

  const handleBackToConversations = () => {
    setShowSidebar(true);
    navigate('/messages');
  };

  // Kullanıcı profiline git
  const handleUserClick = (e, userId) => {
    e.stopPropagation(); // Konuşma seçimini engellemek için
    navigate(`/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Mesajlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex h-screen">
        {/* Sol Panel - Konuşma Listesi */}
        <div className={`${
          showSidebar ? 'block' : 'hidden'
        } md:block w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col`}>
          {/* Header */}
          <div className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                  <i className="bi bi-chat-dots text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Mesajlar</h2>
                  <p className="text-blue-100 text-sm">{conversations.length} konuşma</p>
                </div>
              </div>
              {/* Mobil için arama butonu */}
              <button className="md:hidden p-2 bg-white/20 rounded-lg">
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
          
          {/* Konuşma Listesi */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="empty-message-state">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-200 rounded-full flex items-center justify-center mb-4">
                  <i className="bi bi-chat-dots text-3xl text-blue-500"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz mesajınız yok</h3>
                <p className="text-gray-500 text-sm">Bir kullanıcıyla mesajlaşmaya başlayın</p>
              </div>
            ) : (
              conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    conversationId === conversation.conversationId ? 'active' : ''
                  }`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="relative cursor-pointer"
                      onClick={(e) => handleUserClick(e, conversation.otherUser.id)}
                    >
                      <ProfileImage width={48} height={48} image={conversation.otherUser.image} />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 
                          className="font-semibold text-gray-900 truncate text-sm md:text-base hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={(e) => handleUserClick(e, conversation.otherUser.id)}
                        >
                          {conversation.otherUser.username}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatLastMessageTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1 mr-2">
                          {conversation.isLastMessageFromMe && (
                            <span className="text-blue-600 mr-1">Sen:</span>
                          )}
                          {conversation.lastMessage || "Mesaj gönder"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="unread-badge flex-shrink-0">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ Panel - Mesaj Alanı */}
        <div className={`${
          !showSidebar ? 'block' : 'hidden'
        } md:block flex-1 flex flex-col bg-white`}>
          {selectedConversation ? (
            <>
              {/* Mesaj Header */}
              <div className="message-header">
                <div className="flex items-center">
                  {/* Mobil geri butonu */}
                  <button 
                    className="md:hidden p-2 mr-3 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    onClick={handleBackToConversations}
                  >
                    <i className="bi bi-arrow-left text-lg"></i>
                  </button>
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(`/users/${selectedConversation.otherUser.id}`)}
                  >
                    <ProfileImage width={40} height={40} image={selectedConversation.otherUser.image} />
                  </div>
                  <div className="ml-3">
                    <h3 
                      className="font-semibold text-gray-900 text-sm md:text-base hover:text-blue-600 cursor-pointer transition-colors"
                      onClick={() => navigate(`/users/${selectedConversation.otherUser.id}`)}
                    >
                      {selectedConversation.otherUser.username}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">
                      @{selectedConversation.otherUser.username.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors hidden md:block">
                    <i className="bi bi-telephone"></i>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors hidden md:block">
                    <i className="bi bi-camera-video"></i>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <i className="bi bi-info-circle"></i>
                  </button>
                </div>
              </div>

              {/* Mesajlar */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gradient-to-br from-gray-50 to-blue-50 message-area">
                {messages.length === 0 ? (
                  <div className="empty-message-state">
                    <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                      <i className="bi bi-chat-heart text-2xl md:text-3xl text-purple-500"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Konuşma başlasın!</h3>
                    <p className="text-gray-500 text-sm text-center">İlk mesajınızı gönderin</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {messages.map((message, index) => {
                      const isMyMessage = message.sender.id === authState.id;
                      const prevMessage = messages[index - 1];
                      const showAvatar = !prevMessage || prevMessage.sender.id !== message.sender.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex items-end space-x-2 max-w-xs md:max-w-sm lg:max-w-md ${isMyMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {!isMyMessage && (
                              <div 
                                className="w-6 md:w-8 h-6 md:h-8 flex-shrink-0 cursor-pointer"
                                onClick={() => navigate(`/users/${message.sender.id}`)}
                              >
                                {showAvatar && (
                                  <ProfileImage width={window.innerWidth < 768 ? 24 : 32} height={window.innerWidth < 768 ? 24 : 32} image={message.sender.image} />
                                )}
                              </div>
                            )}
                            <div
                              className={`message-bubble ${isMyMessage ? 'sent' : 'received'} ${
                                showAvatar ? '' : (isMyMessage ? '' : 'ml-8 md:ml-10')
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p className={`text-xs mt-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatMessageTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mesaj Gönder */}
              <div className="message-input-container">
                <form onSubmit={handleSendMessage} className="flex items-end space-x-2 md:space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        className="message-input text-sm md:text-base"
                        placeholder="Mesajınızı yazın..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={sendingMessage}
                        rows="1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                      />
                      <div className="absolute right-3 bottom-3 flex items-center space-x-1 md:space-x-2">
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors hidden md:block"
                        >
                          <i className="bi bi-emoji-smile"></i>
                        </button>
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <i className="bi bi-paperclip"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="send-button w-10 h-10 md:w-12 md:h-12"
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i className="bi bi-send text-sm md:text-base"></i>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
              <div className="text-center">
                <div className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-blue-100 to-purple-200 rounded-full flex items-center justify-center mb-6">
                  <i className="bi bi-chat-square-text text-4xl md:text-5xl text-blue-500"></i>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Bir konuşma seçin</h2>
                <p className="text-gray-600 max-w-md text-sm md:text-base text-center">
                  Mesajlaşmaya başlamak için sol taraftaki konuşmalardan birini seçin veya yeni bir konuşma başlatın
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 