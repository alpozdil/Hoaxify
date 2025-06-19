import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { likePost, deletePost } from "./api";
import { useAuthState, useAuthDispatch } from "@/shared/state/context";
import { storeToken, getAuthHeader } from "@/shared/state/storage";
import { CommentSection } from "./CommentSection";
import { useToastContext } from "@/App";
import { getAttachmentUrl } from "@/utils/urlHelper";

export function Post({ post }) {
  const authState = useAuthState();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToastContext();
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [liked, setLiked] = useState(post.liked);
  const [apiProgress, setApiProgress] = useState(false);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  
  // Gönderi sahibi olup olmadığını kontrol et
  useEffect(() => {
    if (authState.isLoggedIn && post.user && authState.id === post.user.id) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }
  }, [authState, post]);

  // Post'un liked durumu değiştiğinde state'i güncelle
  useEffect(() => {
    setLiked(post.liked || false);
    setLikeCount(post.likeCount || 0);
  }, [post.liked, post.likeCount]);

  const handleLike = async () => {
    if (!authState.isLoggedIn) {
      navigate("/login");
      return;
    }
    
    setApiProgress(true);
    setError(null);
    
    try {
      const response = await likePost(post.id);
      
      // Backend'den gelen response'u işle
      if (response.data && typeof response.data.liked === 'boolean') {
        setLiked(response.data.liked);
        setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1);
        
        console.log(response.data.message);
      } else {
        // Eski format destegi - toggle mantığı
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Beğeni işlemi başarısız oldu";
      setError(errorMessage);
      showError(errorMessage);
      console.error("Beğeni hatası:", error);
      
      // Yetkilendirme hatası varsa login sayfasına yönlendir
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setApiProgress(false);
    }
  };

  const handleDelete = async () => {
    // Kullanıcı doğrulaması
    if (!authState.isLoggedIn) {
      navigate("/login");
      return;
    }
    
    // Silme yetkisi kontrolü
    if (!isOwner) {
      setError("Bu gönderiyi silme yetkiniz yok");
      return;
    }
    
    // Kullanıcı onayı
    if (!window.confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) {
      return;
    }
    
    setApiProgress(true);
    setError(null);
    
    try {
      console.log("Gönderi silme isteği gönderiliyor. Post ID:", post.id);
      console.log("Kullanıcı bilgileri:", authState);
      
      // Post sahibi ile oturum açan kullanıcı aynı mı kontrol et
      if (post.user.id !== authState.id) {
        console.error("Yetki hatası: Gönderi sahibi ile giriş yapan kullanıcı farklı");
        setError("Bu gönderiyi silme yetkiniz yok. Sadece kendi gönderilerinizi silebilirsiniz.");
        setApiProgress(false);
        return;
      }
      
      // Auth header kontrolü
      const authHeader = getAuthHeader();
      if (!authHeader) {
        console.error("Yetkilendirme bilgisi bulunamadı");
        throw new Error("Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.");
      }
      
      await deletePost(post.id);
      
      // Başarılı silme işleminden sonra gönderileri yenile
      window.dispatchEvent(new CustomEvent('postUpdated'));
      
      // Başarı toast'ı göster
      showSuccess("Gönderi başarıyla silindi.");
      
      console.log("Gönderi başarıyla silindi");
      
    } catch (error) {
      console.error("Silme hatası:", error);
      
      let errorMessage = "Gönderi silme işlemi başarısız oldu.";
      
      if (error.response?.status === 500) {
        // 500 Internal Server Error - özellikle referential integrity constraint hatası
        if (error.response?.data?.message?.includes('constraint') || 
            error.response?.data?.message?.includes('FOREIGN KEY') ||
            error.response?.data?.message?.includes('referential integrity')) {
          errorMessage = "Bu gönderi beğeniler veya yorumlar içerdiği için şu anda silinemiyor. Lütfen önce beğenileri ve yorumları kaldırın.";
        } else {
          errorMessage = "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
        }
      } else if (error.response?.status === 403) {
        errorMessage = "Bu gönderiyi silme yetkiniz yok. Sadece kendi gönderilerinizi silebilirsiniz.";
        
        // Eğer post.user ile authState farklıysa UI'da isOwner güncellemesi yap
        if (post.user.id !== authState.id) {
          setIsOwner(false);
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
        // Oturumu sonlandır
        dispatch({type: 'logout-success'});
        navigate("/login");
      } else if (error.response?.status === 404) {
        errorMessage = "Gönderi bulunamadı. Zaten silinmiş olabilir.";
        // Gönderileri yenile
        window.dispatchEvent(new CustomEvent('postUpdated'));
      } else {
        // Diğer tüm hatalar için genel mesaj
        errorMessage = error.response?.data?.message || 
                      error.message || 
                      "Gönderi silme işlemi başarısız oldu. Lütfen tekrar deneyin.";
      }
      
      // Hata toast'ı göster
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setApiProgress(false);
    }
  };

  const toggleComments = () => {
    setCommentsExpanded(!commentsExpanded);
  };

  return (
    <div className="post-card group">
      <div className="flex items-start space-x-4 mb-4">
        <ProfileImage width={48} height={48} image={post.user.image} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/user/${post.user.id}`} className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                {post.user.username}
              </Link>
              <div className="text-sm text-gray-500">
                {new Date(post.timestamp).toLocaleString()}
              </div>
            </div>
            {isOwner && (
              <button
                className="btn btn-danger text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
                disabled={apiProgress}
                title="Gönderiyi Sil"
              >
                {apiProgress ? (
                  <span className="spinner w-4 h-4"></span>
                ) : (
                  <i className="bi bi-trash"></i>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Fotoğraf/Video görüntüleme - İyileştirilmiş */}
      {post.fileAttachments && post.fileAttachments.length > 0 && (
        <div className="mb-4 space-y-3">
          {post.fileAttachments.map((attachment, index) => {
            console.log(`Processing attachment ${index}:`, attachment);
            
            return (
              <div key={index} className="rounded-xl overflow-hidden">
                {(attachment.fileType && attachment.fileType.startsWith('image/')) || 
                 attachment.fileType === 'image/heic' || 
                 attachment.fileType === 'image/heif' ? (
                  <img
                    src={getAttachmentUrl(attachment)}
                    alt={`Gönderi ${index + 1}`}
                    className="w-full h-auto object-contain rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gray-50"
                    style={{ maxHeight: 'none' }}
                    onLoad={(e) => {
                      console.log(`Image loaded successfully: ${e.target.src}`);
                    }}
                    onError={(e) => {
                      console.error(`Image failed to load: ${e.target.src}`);
                      console.error('Attachment object:', attachment);
                      
                      // Infinite loop önleme
                      if (e.target.dataset.errorHandled) {
                        return;
                      }
                      e.target.dataset.errorHandled = 'true';
                      
                      // HEIC/HEIF dosyası yüklenemiyorsa özel placeholder göster
                      if (attachment.fileType === 'image/heic' || attachment.fileType === 'image/heif') {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'heic-placeholder w-full h-auto flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-8';
                        placeholder.innerHTML = `
                          <i class="bi bi-image text-6xl text-yellow-600 mb-4"></i>
                          <span class="text-yellow-800 text-lg font-medium">HEIC Fotoğraf</span>
                          <span class="text-yellow-600 text-sm mt-2">iPhone kamera formatı</span>
                          <span class="text-yellow-500 text-xs mt-1">${attachment.name}</span>
                        `;
                        e.target.parentNode.replaceChild(placeholder, e.target);
                      } else {
                        // Diğer resimler için basit placeholder
                        const placeholder = document.createElement('div');
                        placeholder.className = 'w-full h-auto flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded-xl p-8';
                        placeholder.innerHTML = `
                          <i class="bi bi-image text-4xl text-gray-400 mb-2"></i>
                          <span class="text-gray-600 text-sm">Resim yüklenemedi</span>
                          <span class="text-gray-400 text-xs mt-1">${attachment.name}</span>
                        `;
                        e.target.parentNode.replaceChild(placeholder, e.target);
                      }
                    }}
                    onClick={(e) => {
                      // Büyük görüntü modal'ı açılabilir (gelecekte)
                      console.log('Image clicked for full view');
                    }}
                  />
                ) : attachment.fileType && attachment.fileType.startsWith('video/') ? (
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video
                      controls
                      preload="metadata"
                      playsInline
                      webkit-playsinline="true"
                      className="w-full h-auto rounded-xl shadow-md"
                      style={{ maxHeight: 'none' }}
                      onError={(e) => {
                        console.error(`Video failed to load: ${e.target.src}`);
                        console.error('Attachment object:', attachment);
                      }}
                      onLoadedMetadata={(e) => {
                        console.log(`Video metadata loaded: ${e.target.src}`);
                        console.log(`Duration: ${e.target.duration} seconds`);
                      }}
                    >
                      <source src={getAttachmentUrl(attachment)} type={attachment.fileType} />
                      <p className="text-white p-4">
                        Tarayıcınız video oynatmayı desteklemiyor. 
                        <a 
                          href={getAttachmentUrl(attachment)} 
                          className="text-blue-300 hover:text-blue-100 ml-1"
                          download
                        >
                          Videoyu indirin
                        </a>
                      </p>
                    </video>
                    
                    {/* Video overlay bilgileri */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                      <i className="bi bi-camera-video mr-1"></i>
                      Video
                    </div>
                    
                    {/* Video boyutu bilgisi (eğer varsa) */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {attachment.fileType && attachment.fileType.includes('/') ? attachment.fileType.split('/')[1].toUpperCase() : 'DOSYA'}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <a
                      href={getAttachmentUrl(attachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full justify-center text-gray-700 hover:text-gray-900"
                    >
                      <i className="bi bi-file-earmark-arrow-down text-xl mr-3"></i>
                      <div className="text-left">
                        <div className="font-medium">Dosyayı İndir</div>
                        <div className="text-sm text-gray-500">
                          {attachment.name} • {attachment.fileType}
                        </div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">{error}</div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            liked 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-red-600'
          }`}
          onClick={handleLike}
          disabled={apiProgress || !authState.isLoggedIn}
        >
          <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} mr-2`}></i>
          <span className="font-semibold">{likeCount}</span>
        </button>
        
        <button
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-primary-600 transition-all duration-200"
          onClick={toggleComments}
        >
          <i className="bi bi-chat mr-2"></i>
          <span>Yorumlar</span>
          <i className={`bi ${commentsExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} ml-1`}></i>
        </button>
      </div>

      {/* Yorum sistemi */}
      <CommentSection 
        post={post} 
        isExpanded={commentsExpanded} 
        onToggle={toggleComments}
      />
    </div>
  );
} 