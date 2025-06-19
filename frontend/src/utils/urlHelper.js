// URL Helper Utility - iPhone ve Production uyumluluğu için

// Cloudinary cloud name cache
let cloudName = null;

/**
 * Backend'den Cloudinary cloud name'i alır
 * @returns {Promise<string>} Cloud name
 */
const getCloudName = async () => {
  if (cloudName) {
    return cloudName;
  }

  try {
    // Vercel proxy ile API'ye erişim
    const response = await fetch('/api/v1/config/cloudinary');
    const config = await response.json();
    cloudName = config.cloudName || 'dwwjx5akf';
    console.log('Cloudinary cloud name alındı:', cloudName);
    return cloudName;
  } catch (error) {
    console.warn('Cloud name alınamadı, fallback kullanılıyor:', error);
    return 'dwwjx5akf'; // Sizin cloud name'iniz
  }
};

/**
 * Backend URL'ini döndürür
 * @returns {string} Backend URL
 */
export const getBackendUrl = () => {
  const isProduction = import.meta.env.MODE === 'production';
  // Production'da Vercel proxy kullanıyoruz, relative URL yeterli
  return isProduction 
    ? '' // Vercel proxy kullan
    : 'http://localhost:8080';
};

/**
 * Attachment URL'ini oluşturur - Local storage ve Cloudinary uyumlu
 * @param {Object} attachment - Attachment objesi
 * @returns {string} Tam URL
 */
export const getAttachmentUrl = (attachment) => {
  if (!attachment || !attachment.name) {
    console.warn('Invalid attachment object:', attachment);
    return '';
  }

  console.log('Attachment object:', attachment);

  // Cloudinary URL ise direkt döndür
  if (attachment.name.startsWith('https://res.cloudinary.com/')) {
    console.log('Direct Cloudinary URL detected:', attachment.name);
    return attachment.name;
  }

  // Cloudinary public ID ise URL'e çevir
  if (attachment.name.startsWith('hoaxify/')) {
    // Cloud name'i dinamik olarak al
    getCloudName().then(name => {
      cloudName = name;
    });
    const currentCloudName = cloudName || 'dwwjx5akf'; // Sizin cloud name'iniz
    const cloudinaryUrl = `https://res.cloudinary.com/${currentCloudName}/image/upload/${attachment.name}`;
    console.log('Cloudinary URL generated for attachment:', {
      publicId: attachment.name,
      url: cloudinaryUrl,
      cloudName: currentCloudName
    });
    return cloudinaryUrl;
  }

  // Local storage - Vercel proxy ile CORS problemi yok
  const url = `/assets/attachment/${attachment.name}`;
  
  console.log('Local attachment URL generated:', {
    name: attachment.name,
    url: url,
    isProduction: import.meta.env.MODE === 'production'
  });
  
  return url;
};

/**
 * Profile image URL'ini oluşturur - Local storage ve Cloudinary uyumlu
 * @param {string} imageName - Profil resmi adı veya Cloudinary public ID
 * @returns {string} Tam URL
 */
export const getProfileImageUrl = (imageName) => {
  if (!imageName) return '';

  // Cloudinary URL ise direkt döndür
  if (imageName.startsWith('https://res.cloudinary.com/')) {
    return imageName;
  }

  // Cloudinary public ID ise URL'e çevir
  if (imageName.startsWith('hoaxify/')) {
    // Cloud name'i dinamik olarak al
    getCloudName().then(name => {
      cloudName = name;
    });
    const currentCloudName = cloudName || 'dwwjx5akf'; // Sizin cloud name'iniz
    
    // Cache busting için timestamp ve transformation ekle
    const timestamp = Date.now();
    const baseUrl = `https://res.cloudinary.com/${currentCloudName}/image/upload`;
    
    // Cloudinary transformations: quality optimization + cache busting
    const transformations = `c_fill,g_face,q_auto:good,f_auto`;
    
    return `${baseUrl}/${transformations}/v${timestamp}/${imageName}`;
  }

  // Local storage - Vercel proxy ile CORS problemi yok
  return `/assets/profile/${imageName}`;
};

/**
 * Dosya tipinin iPhone uyumlu olup olmadığını kontrol eder
 * @param {File} file - Kontrol edilecek dosya
 * @returns {boolean} Uyumlu mu?
 */
export const isIPhoneCompatibleFile = (file) => {
  if (!file) return false;

  const fileName = file.name ? file.name.toLowerCase() : '';
  const fileType = file.type || '';

  // Standart mime type kontrolü
  const isValidMimeType = fileType.startsWith('image/') || fileType.startsWith('video/');
  
  // iPhone HEIC/HEIF ve diğer formatlar
  const isValidExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif') ||
                          fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
                          fileName.endsWith('.png') || fileName.endsWith('.gif') || 
                          fileName.endsWith('.webp') || fileName.endsWith('.mp4') || 
                          fileName.endsWith('.mov') || fileName.endsWith('.quicktime') ||
                          fileName.endsWith('.avi') || fileName.endsWith('.webm');

  return isValidMimeType || isValidExtension;
};

/**
 * iPhone kullanıcısı mı kontrol eder
 * @returns {boolean} iPhone kullanıcısı mı?
 */
export const isIPhoneUser = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * Safari kullanıcısı mı kontrol eder
 * @returns {boolean} Safari kullanıcısı mı?
 */
export const isSafariUser = () => {
  return /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
};

/**
 * HEIC/HEIF dosyası mı kontrol eder
 * @param {Object} attachment - Attachment objesi
 * @returns {boolean} HEIC/HEIF dosyası mı?
 */
export const isHeicFile = (attachment) => {
  if (!attachment) return false;
  
  const fileType = attachment.fileType || '';
  const fileName = attachment.name || '';
  
  return fileType === 'image/heic' || 
         fileType === 'image/heif' ||
         fileName.toLowerCase().endsWith('.heic') ||
         fileName.toLowerCase().endsWith('.heif');
};

/**
 * Dosya tipini human-readable formata çevirir
 * @param {Object} attachment - Attachment objesi  
 * @returns {string} İnsan tarafından okunabilir dosya tipi
 */
export const getReadableFileType = (attachment) => {
  if (!attachment) return 'DOSYA';
  
  if (isHeicFile(attachment)) {
    return 'HEIC';
  }
  
  const fileType = attachment.fileType || '';
  if (fileType.includes('/')) {
    const extension = fileType.split('/')[1].toUpperCase();
    return extension === 'QUICKTIME' ? 'MOV' : extension;
  }
  
  return 'DOSYA';
}; 