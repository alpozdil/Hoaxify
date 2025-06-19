import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 2000;
    this.messageHandlers = new Map();
    this.isConnecting = false;
    this.connectionTimeout = null;
    this.healthCheckInterval = null;
    this.lastHeartbeat = null;
    this.silentMode = true; // Sessiz mod - kullanıcıya gürültü yapmaz
    this.backgroundRetryInterval = null;
  }

  // WebSocket bağlantısını sessizce başlat
  connect(token, userId) {
    if (this.connected && this.client?.connected) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        
        // Önceki bağlantıyı ve timer'ları temizle
        this.cleanup();
        
        // Sessiz timeout - daha kısa süre
        this.connectionTimeout = setTimeout(() => {
          this.isConnecting = false;
          this.startBackgroundRetry(token, userId);
          resolve(); // Hata vermez, sessizce geçer
        }, 8000);

        // API URL'yi kontrol et
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        
        // SockJS fallback ile bağlantı
        const socket = new SockJS(`${apiUrl}/ws`);
        
        this.client = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            'Authorization': `Bearer ${token}`
          },
          debug: () => {}, // Debug mesajlarını tamamen kapat
          reconnectDelay: 0,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          onConnect: (frame) => {
            this.connected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.lastHeartbeat = Date.now();
            
            // Timeout'u temizle
            if (this.connectionTimeout) {
              clearTimeout(this.connectionTimeout);
              this.connectionTimeout = null;
            }
            
            // Background retry'ı durdur
            this.stopBackgroundRetry();
            
            // Health check başlat
            this.startHealthCheck();
            
            // Kullanıcıyı aktif olarak işaretle
            this.addUser();
            
            // Mesajları dinlemeye başla
            this.subscribeToMessages(userId);
            this.subscribeToUserStatus();
            
            resolve();
          },
          onStompError: (frame) => {
            this.connected = false;
            this.isConnecting = false;
            this.cleanup();
            this.startBackgroundRetry(token, userId);
            resolve(); // Hata vermez, sessizce geçer
          },
          onDisconnect: () => {
            this.connected = false;
            this.isConnecting = false;
            this.cleanup();
            this.startBackgroundRetry(token, userId);
          },
          onWebSocketError: (error) => {
            this.connected = false;
            this.isConnecting = false;
            this.cleanup();
            this.startBackgroundRetry(token, userId);
          }
        });

        // Bağlantıyı başlat
        this.client.activate();

      } catch (error) {
        this.isConnecting = false;
        this.cleanup();
        this.startBackgroundRetry(token, userId);
        resolve(); // Hata vermez, sessizce geçer
      }
    });
  }

  // Arka plan sessiz yeniden deneme
  startBackgroundRetry(token, userId) {
    if (this.backgroundRetryInterval) {
      clearInterval(this.backgroundRetryInterval);
    }
    
    this.backgroundRetryInterval = setInterval(() => {
      if (!this.connected && !this.isConnecting) {
        this.connect(token, userId).catch(() => {
          // Sessizce devam et
        });
      }
    }, 15000); // 15 saniyede bir sessizce dene
  }

  // Arka plan retry'ı durdur
  stopBackgroundRetry() {
    if (this.backgroundRetryInterval) {
      clearInterval(this.backgroundRetryInterval);
      this.backgroundRetryInterval = null;
    }
  }

  // Health check sistemi - sessiz
  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(() => {
      if (!this.connected || !this.client?.connected) {
        this.cleanup();
        return;
      }
      
      // Heartbeat kontrolü
      const now = Date.now();
      if (this.lastHeartbeat && (now - this.lastHeartbeat) > 30000) {
        this.client.deactivate();
        return;
      }
    }, 15000);
  }

  // Temizlik fonksiyonu
  cleanup() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    this.subscriptions.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (e) {
        // Sessizce geç
      }
    });
    this.subscriptions.clear();
  }

  // Mesajları dinle
  subscribeToMessages(userId) {
    if (!this.isConnected()) return;

    try {
      const subscription = this.client.subscribe(`/user/${userId}/queue/messages`, (message) => {
        try {
          const messageData = JSON.parse(message.body);
          
          // Mesaj handler'larını çağır
          this.messageHandlers.forEach(handler => {
            try {
              handler(messageData);
            } catch (error) {
              // Sessizce geç
            }
          });
        } catch (error) {
          // Sessizce geç
        }
      });

      this.subscriptions.set('messages', subscription);
    } catch (error) {
      // Sessizce geç
    }
  }

  // Kullanıcı durumunu dinle
  subscribeToUserStatus() {
    if (!this.isConnected()) return;

    try {
      const subscription = this.client.subscribe('/topic/user.status', (message) => {
        try {
          const statusData = JSON.parse(message.body);
          
          // Status handler'larını çağır
          const statusHandlers = this.messageHandlers.get('userStatus') || [];
          statusHandlers.forEach(handler => {
            try {
              handler(statusData);
            } catch (error) {
              // Sessizce geç
            }
          });
        } catch (error) {
          // Sessizce geç
        }
      });

      this.subscriptions.set('userStatus', subscription);
    } catch (error) {
      // Sessizce geç
    }
  }

  // Mesaj gönder - sessiz ve akıllı
  sendMessage(content, receiverId) {
    if (!content || content.trim().length === 0) {
      return false;
    }

    // WebSocket aktifse onu kullan
    if (this.isConnected()) {
      try {
        const messagePayload = {
          content: content.trim(),
          receiverId: receiverId,
          timestamp: Date.now()
        };
        
        this.client.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(messagePayload),
          headers: {
            'content-type': 'application/json'
          }
        });
        
        // Heartbeat'i güncelle
        this.lastHeartbeat = Date.now();
        return true;
      } catch (error) {
        return false;
      }
    }

    // WebSocket yoksa false döndür (REST API kullanılacak)
    return false;
  }

  // Konuşmaya katıl
  joinConversation(conversationId) {
    if (!this.isConnected()) return false;

    try {
      this.client.publish({
        destination: `/app/chat.joinConversation/${conversationId}`,
        body: JSON.stringify({
          timestamp: Date.now()
        }),
        headers: {
          'content-type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Konuşmadan ayrıl
  leaveConversation(conversationId) {
    if (!this.isConnected()) return false;

    try {
      this.client.publish({
        destination: `/app/chat.leaveConversation/${conversationId}`,
        body: JSON.stringify({
          timestamp: Date.now()
        }),
        headers: {
          'content-type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Kullanıcıyı aktif olarak işaretle
  addUser() {
    if (!this.isConnected()) return;

    try {
      this.client.publish({
        destination: '/app/chat.addUser',
        body: JSON.stringify({
          timestamp: Date.now()
        }),
        headers: {
          'content-type': 'application/json'
        }
      });
    } catch (error) {
      // Sessizce geç
    }
  }

  // Mesaj handler ekle
  addMessageHandler(handler) {
    const id = Date.now() + Math.random();
    this.messageHandlers.set(id, handler);
    return id;
  }

  // Mesaj handler kaldır
  removeMessageHandler(id) {
    this.messageHandlers.delete(id);
  }

  // User status handler ekle
  addUserStatusHandler(handler) {
    const existingHandlers = this.messageHandlers.get('userStatus') || [];
    existingHandlers.push(handler);
    this.messageHandlers.set('userStatus', existingHandlers);
    return existingHandlers.length - 1;
  }

  // User status handler kaldır
  removeUserStatusHandler(index) {
    const existingHandlers = this.messageHandlers.get('userStatus') || [];
    if (index >= 0 && index < existingHandlers.length) {
      existingHandlers.splice(index, 1);
      this.messageHandlers.set('userStatus', existingHandlers);
    }
  }

  // Mesaj okundu bilgisi gönder
  markMessageAsRead(messageId, conversationId) {
    if (!this.isConnected()) return false;

    try {
      this.client.publish({
        destination: '/app/chat.markAsRead',
        body: JSON.stringify({
          messageId: messageId,
          conversationId: conversationId,
          timestamp: Date.now()
        }),
        headers: {
          'content-type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Typing indicator gönder
  sendTypingIndicator(conversationId, isTyping) {
    if (!this.isConnected()) return false;

    try {
      this.client.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          conversationId: conversationId,
          isTyping: isTyping,
          timestamp: Date.now()
        }),
        headers: {
          'content-type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Bağlantıyı kapa
  disconnect() {
    this.stopBackgroundRetry();
    this.cleanup();
    this.messageHandlers.clear();
    
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        // Sessizce geç
      }
      this.client = null;
    }
    
    this.connected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Bağlantı durumunu kontrol et - basit
  isConnected() {
    return this.connected && 
           this.client && 
           this.client.connected && 
           !this.isConnecting;
  }

  // Bağlantı türünü döndür - UI için
  getConnectionType() {
    return this.connected ? 'websocket' : 'rest';
  }

  // Bağlantı durumunu detaylı al
  getConnectionStatus() {
    return {
      connected: this.connected,
      connecting: this.isConnecting,
      type: this.getConnectionType(),
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  // Debug bilgisi al (geliştirme için)
  getDebugInfo() {
    return {
      connected: this.connected,
      connecting: this.isConnecting,
      client: !!this.client,
      clientConnected: this.client?.connected || false,
      subscriptions: this.subscriptions.size,
      messageHandlers: this.messageHandlers.size,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      silentMode: this.silentMode
    };
  }
}

// Singleton instance
const webSocketService = new WebSocketService();
export default webSocketService; 