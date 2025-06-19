import http from "@/lib/http";
import { getAuthHeader } from "@/shared/state/storage";

// API önbelleği
const apiCache = {
  posts: new Map(), // sayfa numarası -> [veri, zaman damgası] eşlemesi
  expireTime: 10000, // 10 saniye önbellek süresi
  
  // Önbellekten veri alma
  get(key, page) {
    const cacheKey = `${key}_${page}`;
    const cached = this[key].get(page);
    if (!cached) return null;
    
    const [data, timestamp] = cached;
    const now = Date.now();
    
    // Önbellek süresi dolmuşsa önbelleği temizle
    if (now - timestamp > this.expireTime) {
      this[key].delete(page);
      return null;
    }
    
    return data;
  },
  
  // Önbelleğe veri kaydetme
  set(key, page, data) {
    const cacheKey = `${key}_${page}`;
    this[key].set(page, [data, Date.now()]);
  },
  
  // Belirli bir anahtarın önbelleğini temizleme
  invalidate(key) {
    if (this[key]) {
      this[key].clear();
    }
  },
  
  // Tüm önbelleği temizleme
  clear() {
    this.posts.clear();
  }
};

// Yeniden deneme fonksiyonu
const fetchWithRetry = async (apiCall, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await apiCall();
      return response;
    } catch (error) {
      console.warn(`API isteği başarısız (${attempt + 1}/${maxRetries}):`, error.message);
      lastError = error;
      
      // Son denemede tekrar deneme, direkt hata fırlat
      if (attempt === maxRetries - 1) break;
      
      // Belirli bir süre bekle
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  
  throw lastError;
};

export const loadPosts = async (page = 0, size = 10, useCache = true) => {
  // Önbellekte bu sayfa için veri var mı kontrol et
  if (useCache) {
    const cachedData = apiCache.get('posts', page);
    if (cachedData) {
      console.log(`Önbellekten ${cachedData.content?.length || 0} gönderi yüklendi (sayfa ${page})`);
      return { data: cachedData };
    }
  }
  
  const apiCall = async () => {
    // Daha güçlü önbellek busting
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const cacheBuster = `_cb=${timestamp}-${randomStr}`;
    
    const response = await http.get(`/posts`, { 
      params: { 
        page, 
        size,
        sort: 'timestamp,desc',
        [cacheBuster]: '' // Güçlendirilmiş cache busting
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest' // AJAX isteği olduğunu belirt
      }
    });
    
    console.log(`API yanıtı: ${response.data?.content?.length || 0} gönderi yüklendi`);
    
    // Önbelleğe kaydet
    if (response.data) {
      apiCache.set('posts', page, response.data);
    }
    
    return response;
  };
  
  try {
    // Retry mekanizması ile API çağrısı yap
    return await fetchWithRetry(apiCall, 3, 800);
  } catch (error) {
    console.error('Gönderiler yüklenirken hata oluştu (tüm denemeler başarısız):', error);
    throw error;
  }
};

export const loadPost = async (id) => {
  const apiCall = async () => {
    // Daha güçlü önbellek busting
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const cacheBuster = `_cb=${timestamp}-${randomStr}`;
    
    return await http.get(`/posts/${id}`, {
      params: { [cacheBuster]: '' },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    return await fetchWithRetry(apiCall, 2, 800);
  } catch (error) {
    console.error(`${id} ID'li gönderi yüklenirken hata oluştu:`, error);
    throw error;
  }
};

export const createPost = async (content, attachments = []) => {
  if (!getAuthHeader()) {
    throw new Error('Gönderi paylaşmak için oturum açmanız gerekiyor.');
  }

  const apiCall = async () => {
    console.log('=== CREATE POST API CALL BAŞLADI ===');
    console.log('Content:', content);
    console.log('Attachments:', attachments);
    
    const formData = new FormData();
    formData.append('content', content);
    
    if (attachments.length > 0) {
      console.log('Attachments ekleniyor...');
      for (const file of attachments) {
        console.log('File:', file.name, 'Type:', file.type, 'Size:', file.size);
        formData.append('attachments', file);
      }
    }
    
    // FormData içeriğini logla
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    return await http.post(`/posts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    const response = await fetchWithRetry(apiCall, 2, 1000);
    console.log('=== CREATE POST API RESPONSE ===');
    console.log('Full response:', response);
    console.log('Response data:', response.data);
    
    if (response.data.fileAttachments) {
      console.log('FileAttachments in response:', response.data.fileAttachments);
      response.data.fileAttachments.forEach((attachment, index) => {
        console.log(`  Attachment ${index}:`, attachment);
      });
    } else {
      console.log('No fileAttachments in response');
    }
    
    // Gönderi oluşturulduğunda önbelleği temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('=== CREATE POST API ERROR ===');
    console.error('Gönderi oluşturulurken hata oluştu:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

export const likePost = async (postId) => {
  if (!getAuthHeader()) {
    throw new Error('Gönderi beğenmek için oturum açmanız gerekiyor.');
  }
  
  const apiCall = async () => {
    return await http.post(`/posts/${postId}/like`, {}, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    return await fetchWithRetry(apiCall, 2);
  } catch (error) {
    console.error('Gönderi beğenilirken hata oluştu:', error);
    throw error;
  }
};

export const deletePost = async (postId) => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error('Gönderi silmek için oturum açmanız gerekiyor.');
  }
  
  const apiCall = async () => {
    return await http.delete(`/posts/${postId}`, {
      headers: {
        ...authHeader,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    const response = await fetchWithRetry(apiCall, 2);
    
    // Gönderi silindiğinde önbelleği temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('Gönderi silinirken hata oluştu:', error);
    
    // Hata tipine göre özel mesajlar
    if (error.response?.status === 500) {
      // Referential integrity constraint hatası için özel mesaj
      if (error.response?.data?.message?.includes('constraint') || 
          error.response?.data?.message?.includes('FOREIGN KEY') ||
          error.response?.data?.message?.includes('referential integrity')) {
        const enhancedError = new Error('Bu gönderi beğeniler veya yorumlar içerdiği için şu anda silinemiyor. Lütfen daha sonra tekrar deneyin.');
        enhancedError.response = error.response;
        throw enhancedError;
      }
    } else if (error.response?.status === 403) {
      const enhancedError = new Error('Bu gönderiyi silme yetkiniz yok. Sadece kendi gönderilerinizi silebilirsiniz.');
      enhancedError.response = error.response;
      throw enhancedError;
    } else if (error.response?.status === 404) {
      const enhancedError = new Error('Gönderi bulunamadı. Zaten silinmiş olabilir.');
      enhancedError.response = error.response;
      throw enhancedError;
    }
    
    throw error;
  }
};

// YORUM API FONKSİYONLARI

export const loadComments = async (postId, page = 0, size = 10) => {
  const apiCall = async () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const cacheBuster = `_cb=${timestamp}-${randomStr}`;
    
    return await http.get(`/posts/${postId}/comments`, { 
      params: { 
        page, 
        size,
        sort: 'id,desc',
        [cacheBuster]: ''
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    return await fetchWithRetry(apiCall, 2, 800);
  } catch (error) {
    console.error('Yorumlar yüklenirken hata oluştu:', error);
    throw error;
  }
};

export const createComment = async (postId, content) => {
  if (!getAuthHeader()) {
    throw new Error('Yorum yapmak için oturum açmanız gerekiyor.');
  }

  const apiCall = async () => {
    return await http.post(`/posts/${postId}/comments`, 
      { content },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
  };
  
  try {
    const response = await fetchWithRetry(apiCall, 2, 1000);
    console.log('Yorum başarıyla oluşturuldu', response.data);
    
    // Yorum oluşturulduğunda post önbelleğini temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('Yorum oluşturulurken hata oluştu:', error);
    throw error;
  }
};

export const updateComment = async (commentId, content) => {
  if (!getAuthHeader()) {
    throw new Error('Yorum düzenlemek için oturum açmanız gerekiyor.');
  }

  const apiCall = async () => {
    return await http.put(`/comments/${commentId}`, 
      { content },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );
  };
  
  try {
    const response = await fetchWithRetry(apiCall, 2);
    console.log('Yorum başarıyla güncellendi', response.data);
    
    // Yorum güncellendiğinde post önbelleğini temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('Yorum güncellenirken hata oluştu:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error('Yorum silmek için oturum açmanız gerekiyor.');
  }
  
  const apiCall = async () => {
    return await http.delete(`/comments/${commentId}`, {
      headers: {
        ...authHeader,
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    const response = await fetchWithRetry(apiCall, 2);
    console.log('Yorum başarıyla silindi');
    
    // Yorum silindiğinde post önbelleğini temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('Yorum silinirken hata oluştu:', error);
    throw error;
  }
};

export const getCommentCount = async (postId) => {
  const apiCall = async () => {
    return await http.get(`/posts/${postId}/comments/count`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    return await fetchWithRetry(apiCall, 2);
  } catch (error) {
    console.error('Yorum sayısı alınırken hata oluştu:', error);
    throw error;
  }
};

export const likeComment = async (commentId) => {
  if (!getAuthHeader()) {
    throw new Error('Beğenmek için oturum açmanız gerekiyor.');
  }

  const apiCall = async () => {
    return await http.post(`/comments/${commentId}/like`, null, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    const response = await fetchWithRetry(apiCall, 2);
    console.log('Yorum beğeni durumu güncellendi');
    
    // Yorum beğeni durumu güncellendiğinde post önbelleğini temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('Yorum beğeni durumu güncellenirken hata oluştu:', error);
    throw error;
  }
};

export const createReply = async (commentId, content) => {
  console.log('api.js: createReply başlatılıyor', { commentId, content });
  
  const authHeader = getAuthHeader();
  if (!authHeader) {
    console.error('api.js: createReply - Auth header bulunamadı');
    throw new Error('Yanıt vermek için oturum açmanız gerekiyor.');
  }

  console.log('api.js: createReply - Auth header mevcut', authHeader);

  const apiCall = async () => {
    console.log('api.js: createReply - HTTP POST çağrısı yapılıyor...');
    return await http.post(`/comments/${commentId}/replies`, 
      { content },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...authHeader
        }
      }
    );
  };
  
  try {
    console.log('api.js: createReply - fetchWithRetry başlatılıyor...');
    const response = await fetchWithRetry(apiCall, 2);
    console.log('api.js: createReply başarılı', {
      status: response.status,
      data: response.data
    });
    
    // Yanıt oluşturulduğunda post önbelleğini temizle
    apiCache.invalidate('posts');
    
    return response;
  } catch (error) {
    console.error('api.js: createReply hatası:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      } : null
    });
    throw error;
  }
};

export const getReplies = async (commentId, page = 0, size = 10) => {
  const apiCall = async () => {
    return await http.get(`/comments/${commentId}/replies`, {
      params: { page, size },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  };
  
  try {
    return await fetchWithRetry(apiCall, 2);
  } catch (error) {
    console.error('Yanıtlar alınırken hata oluştu:', error);
    throw error;
  }
};