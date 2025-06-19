import axios from "axios";
import { i18nInstance } from "@/locales";

// API base URL - production'da Vercel proxy kullan, development'ta localhost
const isProduction = import.meta.env.MODE === 'production';
const API_BASE_URL = isProduction 
  ? '' // Vercel proxy kullan - relative URL
  : (import.meta.env.VITE_API_URL || 'http://localhost:8080');

// Varsayılan yapılandırma ile HTTP istemcisi oluştur
const http = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    withCredentials: true,
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

console.log('=== HTTP CLIENT CONFIG ===');
console.log('Environment Mode:', import.meta.env.MODE);
console.log('Is Production:', isProduction);
console.log('API Base URL:', API_BASE_URL);
console.log('Full Base URL:', `${API_BASE_URL}/api/v1`);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('==========================');

// Güvenilir istek sayacı
const pendingRequests = new Map();
let requestId = 0;

// İstek interceptor'ı
http.interceptors.request.use((config) => {
    // Dil başlığı ekle
    config.headers["Accept-Language"] = i18nInstance.language;
    
    // Token gerektirmeyen endpoint'ler
    const publicEndpoints = [
        '/users/password-reset',
        '/auth'
    ];
    
    // Şifre yenileme token endpoint'i (dinamik path)
    const isPasswordResetEndpoint = config.url.includes('/password') && config.url.includes('/users/');
    
    // Kullanıcı kayıt endpoint'i (POST /users)
    const isUserRegistration = config.url === '/users' && config.method?.toLowerCase() === 'post';
    
    // Public endpoint kontrolü
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint)) || 
                            isPasswordResetEndpoint || 
                            isUserRegistration;
    
    if (!isPublicEndpoint) {
        // Authentication token ekle
        const token = localStorage.getItem('token');
        console.log("HTTP Interceptor: Token from localStorage:", token);
        console.log("HTTP Interceptor: Token type:", typeof token);
        
        if (token) {
            const authHeader = `Bearer ${token}`;
            config.headers["Authorization"] = authHeader;
            console.log("HTTP Interceptor: Authorization header set to:", authHeader);
        } else {
            console.log("HTTP Interceptor: No token found in localStorage");
        }
    } else {
        console.log("HTTP Interceptor: Public endpoint, skipping token:", config.url);
    }
    
    // Cache-busting için rastgele bir değer ekle
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    // URL'de bir soru işareti olup olmadığını kontrol et
    const separator = config.url.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_=${timestamp}-${randomStr}`;
    
    // İstek ID'sini ekle ve takip et
    const currentId = requestId++;
    config._id = currentId;
    pendingRequests.set(currentId, { timestamp, config });
    
    return config;
}, error => {
    console.error("HTTP istek oluşturulamadı:", error);
    return Promise.reject(error);
});

// Yanıt interceptor'ı
http.interceptors.response.use(
    response => {
        // İsteği takipten çıkar
        if (response.config._id !== undefined) {
            pendingRequests.delete(response.config._id);
        }
        
        try {
            // Resim URL'lerini işle - sadece response.data.content bir dizi ise
            if (response.data && response.data.content && Array.isArray(response.data.content)) {
                response.data.content = response.data.content.map(post => {
                    try {
                        if (post.attachments && post.attachments.length > 0) {
                            post.attachments = post.attachments.map(attachment => {
                                // Eğer URL zaten tam bir URL ise, dokunma
                                if (attachment.url && attachment.url.startsWith('http')) {
                                    return attachment;
                                }
                                // Değilse, local URL ekle
                                return {
                                    ...attachment,
                                    url: `/assets${attachment.url}`
                                };
                            });
                        }
                        return post;
                    } catch (error) {
                        console.warn("Post işlenirken hata:", error);
                        return post; // Sorun olursa orijinal postu döndür
                    }
                });
            }
            // Tek post yanıtı için fileAttachments işleme
            else if (response.data && response.data.fileAttachments && Array.isArray(response.data.fileAttachments)) {
                response.data.fileAttachments = response.data.fileAttachments.map(attachment => {
                    try {
                        if (attachment.url && !attachment.url.startsWith('http')) {
                            attachment.url = `/assets${attachment.url}`;
                        }
                        return attachment;
                    } catch (error) {
                        console.warn("Attachment işlenirken hata:", error);
                        return attachment;
                    }
                });
            }
        } catch (error) {
            console.warn("Yanıt intercept edilirken hata:", error);
            // Hata durumunda orijinal yanıtı döndür
        }
        
        return response;
    },
    error => {
        // İsteği takipten çıkar
        if (error.config?._id !== undefined) {
            pendingRequests.delete(error.config._id);
        }
        
        // 401 Unauthorized hatası durumunda oturum sonlandırma
        if (error.response && error.response.status === 401) {
            console.log("Yetkilendirme hatası, oturum sonlandırılıyor");
            localStorage.removeItem('token');
            localStorage.removeItem('auth');
            
            // Eğer login sayfasında değilsek yönlendir
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        // Ağ hatası durumunda daha açıklayıcı mesaj ekle
        if (error.message === 'Network Error') {
            console.error("Ağ hatası: Sunucuya bağlanılamıyor");
            error.extraInfo = "Sunucu bağlantısı kurulamadı. Lütfen internet bağlantınızı ve sunucunun çalışır durumda olduğunu kontrol edin.";
        }
        
        return Promise.reject(error);
    }
);

// Bekleyen istekleri temizleme fonksiyonu - memory leak önlemek için
setInterval(() => {
    const now = Date.now();
    pendingRequests.forEach((request, id) => {
        // 30 saniyeden fazla bekleyen istekleri temizle
        if (now - request.timestamp > 30000) {
            pendingRequests.delete(id);
        }
    });
}, 60000);

export default http;