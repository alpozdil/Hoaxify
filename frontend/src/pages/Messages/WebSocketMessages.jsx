import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthState } from "@/shared/state/context";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { useToastContext } from "@/App";
import { useMessageNotifications } from "@/shared/hooks/useMessageNotifications";
import { 
  getConversations, 
  getMessagesInConversation, 
  markMessagesAsRead,
  startConversation,
  sendMessageREST
} from "@/shared/api/message";
import WebSocketService from "@/services/WebSocketService";

export function WebSocketMessages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const authState = useAuthState();
  const { showError, showSuccess } = useToastContext();
  const { 
    unreadMessageCount,
    loadUnreadMessageCount,
    decrementUnreadCount,
    incrementUnreadCount
  } = useMessageNotifications();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [connectionType, setConnectionType] = useState('rest');
  const messagesEndRef = useRef(null);
  const messageHandlerId = useRef(null);
  const initializationAttempted = useRef(false);
  const lastMessageUpdateRef = useRef(Date.now());

  // WebSocket bağlantısını sessizce başlat
  useEffect(() => {
    if (authState.id && authState.token && !initializationAttempted.current) {
      initializationAttempted.current = true;
      initializeWebSocketSilently();
    }

    return () => {
      // Cleanup
      if (messageHandlerId.current) {
        WebSocketService.removeMessageHandler(messageHandlerId.current);
      }
    };
  }, [authState.id, authState.token]);

  // WebSocket'i sessizce başlat - kullanıcıya hiç gürültü yapmaz
  const initializeWebSocketSilently = async () => {
    try {
      await WebSocketService.connect(authState.token, authState.id);
      
      // Mesaj handler'ı ekle
      messageHandlerId.current = WebSocketService.addMessageHandler(handleNewMessage);
      
      // Connection type'ı güncelle
      updateConnectionType();
      
    } catch (error) {
      // Sessizce geç, kullanıcıya hiçbir şey gösterme
    }
  };

  // Connection type'ı güncelle
  const updateConnectionType = () => {
    const type = WebSocketService.getConnectionType();
    setConnectionType(type);
  };

  // Yeni mesaj geldiğinde - GELİŞTİRİLMİŞ VERSİYON
  const handleNewMessage = (messageData) => {
    // Mesaj formatını kontrol et
    if (!messageData || !messageData.content) {
      return;
    }
    
    // Duplicate mesaj kontrolü - zaman damgası ile
    const now = Date.now();
    if (now - lastMessageUpdateRef.current < 500) {
      return; // 500ms içinde tekrar mesaj gelirse ignore et
    }
    lastMessageUpdateRef.current = now;
    
    console.log('📨 Yeni WebSocket mesajı alındı:', {
      senderId: messageData.senderId,
      content: messageData.content.substring(0, 50) + '...',
      conversationId: messageData.conversationId
    });
    
    // Mevcut konuşma ile ilgili mesaj mı?
    if (selectedConversation && messageData.conversationId === selectedConversation.conversationId) {
      setMessages(prevMessages => {
        // Duplicate mesaj kontrolü - ID, içerik ve zaman bazlı
        const messageExists = prevMessages.some(msg => 
          msg.id === messageData.id || 
          (msg.content === messageData.content && 
           msg.senderId === messageData.senderId &&
           Math.abs(new Date(msg.createdAt) - new Date(messageData.createdAt)) < 2000)
        );
        
        if (messageExists) {
          console.log('⚠️ Duplicate mesaj ignore edildi');
          return prevMessages;
        }
        
        // Optimistic mesajları temizle (aynı içerik ve gönderen için)
        const filteredMessages = prevMessages.filter(msg => 
          !(msg.isOptimistic && 
            msg.content === messageData.content && 
            msg.senderId === messageData.senderId)
        );
        
        const newMessages = [...filteredMessages, messageData];
        
        // Mesajları okundu olarak işaretle (eğer konuşma açıksa)
        if (messageData.senderId !== authState.id) {
          setTimeout(() => {
            markConversationAsRead(selectedConversation.conversationId);
          }, 1000);
        }
        
        console.log('✅ Mesaj UI\'ye eklendi, toplam:', newMessages.length);
        return newMessages;
      });
      
      // Scroll otomatik olarak aşağı kay
      setTimeout(() => scrollToBottom(), 100);
    }
    
    // Konuşma listesini güncelle - Debounce ile
    setTimeout(() => {
      loadConversations();
      // Mesaj bildirim sayısını güncelle
      loadUnreadMessageCount();
    }, 500);
    
    // Bildirim göster (sadece mesaj alırken, gönderirken değil)
    if (messageData.senderId !== authState.id) {
      const shortContent = messageData.content.length > 30 
        ? messageData.content.substring(0, 30) + '...' 
        : messageData.content;
      showSuccess(`📨 ${messageData.senderUsername}: ${shortContent}`);
      
      // Eğer başka konuşmadan mesaj geldiyse bildirim sayısını arttır
      if (!selectedConversation || messageData.conversationId !== selectedConversation.conversationId) {
        incrementUnreadCount();
      }
    }
  };

  // Konuşmaları yükle
  useEffect(() => {
    loadConversations();
  }, []);

  // Seçili konuşma değiştiğinde mesajları yükle
  useEffect(() => {
    if (conversationId) {
      // Önceki konuşmadan ayrıl
      if (selectedConversation && selectedConversation.conversationId !== conversationId) {
        WebSocketService.leaveConversation(selectedConversation.conversationId);
      }
      
      loadMessages(conversationId);
      markConversationAsRead(conversationId);
      
      // WebSocket ile konuşmaya katıl (sessizce)
      WebSocketService.joinConversation(conversationId);
      
      // Mobil cihazlarda mesaj alanını göster
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    }
  }, [conversationId, selectedConversation]);

  // Yeni mesaj geldiğinde scroll - Debounce ile
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Connection type'ı periyodik kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      updateConnectionType();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Debug: WebSocket durumunu log'la (geliştirme için)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const debug = WebSocketService.getDebugInfo();
        if (debug.connected !== connectionType === 'websocket') {
          console.log('🔄 WebSocket Durum Değişikliği:', {
            önceki: connectionType,
            şimdiki: debug.connected ? 'websocket' : 'rest',
            debug
          });
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [connectionType]);

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
      
      // API'den gelen mesajları WebSocket formatına çevir
      const formattedMessages = (response.data.content || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender.id,
        senderUsername: msg.sender.username,
        receiverId: msg.receiver.id,
        receiverUsername: msg.receiver.username,
        createdAt: msg.createdAt,
        conversationId: msg.conversationId
      }));
      
      setMessages(formattedMessages);
      
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
      
      // Mesaj bildirim sayısını güncelle
      loadUnreadMessageCount();
    } catch (error) {
      // Sessizce geç
    }
  };

  // Akıllı mesaj gönderme - WebSocket yoksa otomatik REST API
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    const tempMessageId = `temp-${Date.now()}`;
    
    // Optimistic update - Mesajı hemen UI'ye ekle
    const optimisticMessage = {
      id: tempMessageId,
      content: messageContent,
      senderId: authState.id,
      senderUsername: authState.username,
      receiverId: selectedConversation.otherUser.id,
      receiverUsername: selectedConversation.otherUser.username,
      createdAt: new Date().toISOString(),
      conversationId: selectedConversation.conversationId,
      isOptimistic: true, // Geçici mesaj işareti
      sending: true
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage("");
    setTimeout(() => scrollToBottom(), 50);
    
    try {
      let success = false;
      let actualMessage = null;

      // Önce WebSocket'i dene
      if (WebSocketService.isConnected()) {
        success = WebSocketService.sendMessage(messageContent, selectedConversation.otherUser.id);
        
        if (success) {
          // WebSocket başarılı - geçici mesajı güncelle
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === tempMessageId 
                ? { ...msg, sending: false }
                : msg
            )
          );
          
          // WebSocket üzerinden gelen gerçek mesajı bekleyip duplicate'i kaldıracağız
          console.log('📤 WebSocket ile mesaj gönderildi');
        }
      }
      
      // WebSocket başarısızsa REST API kullan
      if (!success) {
        try {
          const restResponse = await sendMessageREST({
            content: messageContent,
            receiverId: selectedConversation.otherUser.id
          });
          
          if (restResponse.status === 200 || restResponse.status === 201) {
            success = true;
            actualMessage = restResponse.data;
            
            // REST API başarılı - geçici mesajı gerçek mesajla değiştir
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === tempMessageId 
                  ? {
                      ...actualMessage,
                      id: actualMessage.id,
                      senderId: actualMessage.sender.id,
                      senderUsername: actualMessage.sender.username,
                      receiverId: actualMessage.receiver.id,
                      receiverUsername: actualMessage.receiver.username,
                      conversationId: actualMessage.conversationId,
                      isOptimistic: false,
                      sending: false
                    }
                  : msg
              )
            );
            
            console.log('📤 REST API ile mesaj gönderildi');
          }
        } catch (restError) {
          console.error('REST API mesaj gönderme hatası:', restError);
          success = false;
        }
      }
      
      if (success) {
        // Connection type'ı güncelle
        updateConnectionType();
        
        // Konuşma listesini güncelle
        setTimeout(() => {
          loadConversations();
          loadUnreadMessageCount();
        }, 500);
      } else {
        // Başarısız - geçici mesajı kaldır
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== tempMessageId)
        );
        throw new Error("Mesaj gönderilemedi");
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      // Hata durumunda geçici mesajı kaldır
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempMessageId)
      );
      
      showError('Mesaj gönderilemedi, lütfen tekrar deneyin');
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
    e.stopPropagation();
    navigate(`/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  <p className="text-blue-100 text-sm">
                    {conversations.length} konuşma
                    {unreadMessageCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {unreadMessageCount} okunmamış
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  connectionType === 'websocket' ? 'bg-green-400' : 'bg-blue-400'
                }`}></div>
                <span className="text-xs text-blue-100">
                  {connectionType === 'websocket' ? 'Canlı' : 'Stabil'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Konuşma Listesi */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
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
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    conversationId === conversation.conversationId ? 'bg-blue-50 border-blue-200' : ''
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
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
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
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
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
                      {connectionType === 'websocket' ? 'Gerçek zamanlı' : 'Çevrimiçi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mesaj Alanı */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-gradient-to-br from-gray-50 to-blue-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                      <i className="bi bi-chat-heart text-2xl md:text-3xl text-purple-500"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Konuşma başlasın!</h3>
                    <p className="text-gray-500 text-sm text-center">İlk mesajınızı gönderin</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === authState.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg relative ${
                            message.senderId === authState.id
                              ? `bg-blue-500 text-white ${message.isOptimistic ? 'opacity-70' : ''}`
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm md:text-base">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${
                              message.senderId === authState.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.createdAt)}
                            </p>
                            {/* Gönderme durumu göstergesi */}
                            {message.senderId === authState.id && (
                              <div className="ml-2">
                                {message.sending ? (
                                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : message.isOptimistic ? (
                                  <i className="bi bi-clock text-xs text-blue-200" title="Gönderiliyor..."></i>
                                ) : (
                                  <i className="bi bi-check2 text-xs text-blue-200" title="Gönderildi"></i>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Mesaj Gönderme Alanı - TAMAMİYLE OTOMATİK */}
              <div className="p-3 md:p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-4 py-2 md:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                      newMessage.trim() && !sendingMessage
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
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
                  Mesajlaşmaya başlamak için sol taraftaki konuşmalardan birini seçin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 