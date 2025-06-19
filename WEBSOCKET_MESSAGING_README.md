# 🚀 WebSocket Tabanlı Mesajlaşma Sistemi

## 📋 Genel Bakış

Bu proje, önceki REST tabanlı mesajlaşma sisteminin yerini alan **WebSocket + STOMP protokolü** kullanan gerçek zamanlı mesajlaşma sistemi içerir. Bu yeni yaklaşım daha stabil, hızlı ve güvenilir bir mesajlaşma deneyimi sunar.

## 🏗️ Mimari Yapı

### Backend (Spring Boot)
- **WebSocket Configuration**: STOMP protokolü ile message broker
- **Security Integration**: JWT token tabanlı WebSocket authentication  
- **Real-time Controllers**: `@MessageMapping` ile mesaj işleme
- **Database Integration**: Mevcut JPA entity'ler ile uyumlu

### Frontend (React)
- **WebSocket Service**: Singleton pattern ile bağlantı yönetimi
- **Auto-reconnection**: Akıllı yeniden bağlanma mekanizması
- **Real-time UI**: Anlık mesaj görüntüleme ve durum güncellemeleri

## 🔧 Kurulum

### 1. Backend Dependencies (Zaten Eklendi)
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### 2. Frontend Dependencies (Zaten Eklendi)
```json
{
  "@stomp/stompjs": "^7.0.0",
  "sockjs-client": "^1.6.1"
}
```

### 3. Projeyi Çalıştırma

#### Backend:
```bash
cd Hoaxify-main/ws
mvn spring-boot:run
```

#### Frontend:
```bash
cd Hoaxify-main/frontend
npm install
npm run dev
```

## 🎯 Kullanım

### 1. WebSocket Mesajlaşma Sayfasına Erişim
- Tarayıcınızda `/messages` adresine gidin
- Otomatik olarak yeni WebSocket tabanlı arayüz yüklenecek
- Üst kısımda bağlantı durumu gösterilir (Yeşil: Bağlı, Kırmızı: Bağlantısız)

### 2. Mesaj Gönderme
- Konuşma listesinden bir kullanıcı seçin
- Mesaj kutusuna mesajınızı yazın
- Enter'a basın veya gönder butonuna tıklayın
- Mesaj **anında** karşı tarafa ulaşır

### 3. Gerçek Zamanlı Özellikler
- ✅ Anlık mesaj alma/gönderme
- ✅ Kullanıcı çevrimiçi durumu
- ✅ Mesaj okundu bilgisi
- ✅ Otomatik yeniden bağlanma
- ✅ Bağlantı durumu göstergesi

## 🔧 Teknik Detaylar

### WebSocket Endpoint'leri

| Destination | Açıklama |
|-------------|----------|
| `/ws` | WebSocket bağlantı noktası |
| `/app/chat.sendMessage` | Mesaj gönderme |
| `/app/chat.joinConversation/{id}` | Konuşmaya katılma |
| `/app/chat.addUser` | Kullanıcı aktifleştirme |

### Subscription Kanalları

| Channel | Açıklama |
|---------|----------|
| `/user/{userId}/queue/messages` | Kullanıcıya özel mesajlar |
| `/topic/user.status` | Kullanıcı durum güncellemeleri |
| `/topic/conversation/{id}/read` | Mesaj okundu bildirimleri |

### Security

- **JWT Authentication**: WebSocket bağlantısında Bearer token
- **Session Management**: Kullanıcı kimliği session'da saklanır
- **Authorization**: Sadece yetkili kullanıcılar mesaj gönderebilir

## 🔄 REST API ile Uyumluluk

WebSocket sistemi mevcut REST API'ler ile paralel çalışır:
- Konuşma listesi yükleme: REST API
- Geçmiş mesajları yükleme: REST API  
- Yeni mesaj gönderme: **WebSocket**
- Anlık mesaj alma: **WebSocket**

## 🐛 Sorun Giderme

### Bağlantı Sorunları
1. **"WebSocket bağlantısı yok"** hatası:
   - Sayfayı yenileyin (F5)
   - "Yeniden Bağlan" butonuna tıklayın
   - Network sekmesinde WebSocket bağlantısını kontrol edin

2. **Mesajlar gelmiyor**:
   - Bağlantı durumunu kontrol edin (üst kısımdaki gösterge)
   - Browser console'da hata mesajlarını kontrol edin
   - Backend loglarını inceleyin

3. **Authentication Hataları**:
   - Logout yapıp tekrar login olun
   - JWT token'ın geçerli olduğundan emin olun

### Development/Debug

Browser Developer Tools'da WebSocket trafiğini izlemek için:
1. Network sekmesini açın
2. WS (WebSocket) filtresini seçin
3. `/ws` bağlantısını bulun ve tıklayın
4. Messages sekmesinde STOMP mesajlarını görün

## 🚀 Performans Optimizasyonları

1. **Connection Pooling**: Tek WebSocket bağlantısı tüm mesajlaşma için kullanılır
2. **Automatic Reconnection**: Bağlantı koptuğunda 3 saniye arayla 5 defa yeniden dener
3. **Heartbeat**: 4 saniyede bir keep-alive mesajları
4. **Message Handlers**: Efficient event handling ile UI responsive kalır

## 📱 Mobil Uyumluluk

- **Responsive Design**: Mobil cihazlarda tam uyumlu
- **Touch Optimized**: Dokunmatik arayüz optimize edildi
- **Network Resilience**: Mobil ağ kesintilerine karşı dayanıklı

## 🔮 Gelecek Geliştirmeler

- [ ] Typing indicators (yazıyor göstergesi)
- [ ] Push notifications
- [ ] File sharing via WebSocket
- [ ] Group messaging
- [ ] Voice message support
- [ ] Video call integration

## 💡 Migration Notes

Eski REST tabanlı mesajlaşmadan yeni WebSocket sistemine geçiş:

1. **Mevcut Data**: Tüm konuşmalar ve mesajlar korunur
2. **URL Değişikliği**: `/messages` aynı kalır, sadece component değişti
3. **Database**: Hiçbir şema değişikliği gerekli değil
4. **Backward Compatibility**: REST API'ler hala çalışır

---

**🎉 Artık gerçek zamanlı, stabil bir mesajlaşma sisteminiz var!** 