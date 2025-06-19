import { useState, useEffect } from "react";
import { useAuthState } from "../state/context";
import { createPost, loadPosts } from "@/pages/Home/components/api";
import { useToastContext } from "@/App";

// Etkinlik yayıcısı
const postUpdateEvent = new CustomEvent('postUpdated');

export function CreatePostModal() {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [apiProgress, setApiProgress] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const authState = useAuthState();
  const { showError, showSuccess } = useToastContext();

  // Global click handler for opening modal
  useEffect(() => {
    const handleCreatePostClick = () => {
      setIsOpen(true);
    };

    // Listen for create post button clicks
    document.addEventListener('createPost', handleCreatePostClick);
    
    return () => {
      document.removeEventListener('createPost', handleCreatePostClick);
    };
  }, []);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validFiles = [];
    
    for (const file of files) {
      // Dosya boyutu kontrolü
      if (file.size > maxSize) {
        showError(`${file.name} dosyası çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum 50MB olmalı.`);
        continue;
      }
      
      // Dosya tipi kontrolü - iPhone HEIC/HEIF desteği dahil
      const isImage = (file.type && file.type.startsWith('image/')) || 
                     file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif');
      const isVideo = file.type && file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        showError(`${file.name} desteklenmeyen dosya tipi. Sadece resim ve video dosyaları kabul edilir.`);
        continue;
      }
      
      // iPhone için özel format kontrolü
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log(`iPhone HEIC/HEIF dosyası tespit edildi: ${file.name}`);
        // HEIC dosyasını Canvas ile dönüştürmeyi deneyebiliriz (gelecekte)
      }
      
      // Video için özel kontroller
      if (file.type && file.type.startsWith('video/')) {
        console.log(`Video dosyası seçildi: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length !== files.length) {
      showError(`${files.length - validFiles.length} dosya reddedildi. Sadece ${validFiles.length} dosya eklendi.`);
    }
    
    setSelectedFiles(validFiles);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiProgress(true);
    setErrors({});

    try {
      // API fonksiyonunu kullan
      await createPost(content, selectedFiles);
      
      // Başarıyla gönderildi
      setSuccess(true);
      showSuccess("Gönderi başarıyla paylaşıldı!");
      
      // Gönderi oluşturulduğunda bir etkinlik yayınla
      window.dispatchEvent(postUpdateEvent);
      console.log('Gönderi başarıyla oluşturuldu, etkinlik yayınlandı');
      
      // Modal'ı kapat ve state'i temizle
      setIsOpen(false);
      setContent("");
      setSelectedFiles([]);
      setErrors({});
    } catch (error) {
      if (error.response?.data?.validationErrors) {
        setErrors(error.response.data.validationErrors);
      } else {
        const errorMessage = error.response?.data?.message || "Gönderi oluşturulurken bir hata oluştu.";
        setErrors({ general: errorMessage });
        showError(errorMessage);
      }
    } finally {
      setApiProgress(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    if (success) {
      setContent("");
      setSelectedFiles([]);
      setSuccess(false);
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={closeModal}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle animate-scale-in">
          <div className="modal-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Yeni Gönderi Oluştur
            </h3>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={closeModal}
            >
              <i className="bi bi-x text-xl"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errors.general && (
                <div className="alert alert-danger mb-4">{errors.general}</div>
              )}
              
              <div className="mb-4">
                <textarea
                  className={`form-control ${errors.content ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""}`}
                  rows="5"
                  placeholder="Ne düşünüyorsun?"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                ></textarea>
                {errors.content && (
                  <div className="mt-2 text-sm text-red-600">{errors.content}</div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="fileInput" className="form-label">
                  <i className="bi bi-camera mr-2"></i>
                  Fotoğraf/Video Ekle
                </label>
                
                {/* iPhone için ayrı butonlar */}
                <div className="flex gap-2 mb-3 md:hidden">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-300 hover:bg-blue-200 transition-colors"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/mov,video/quicktime,video/x-msvideo,video/webm';
                      input.capture = 'environment';
                      input.onchange = handleFileSelect;
                      input.click();
                    }}
                  >
                    <i className="bi bi-camera mr-2"></i>
                    Kamera
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-300 hover:bg-green-200 transition-colors"
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <i className="bi bi-images mr-2"></i>
                    Galeri
                  </button>
                </div>
                
                <div className="file-upload-area" 
                     onDragOver={(e) => {
                       e.preventDefault();
                       e.currentTarget.classList.add('drag-over');
                     }}
                     onDragLeave={(e) => {
                       e.preventDefault();
                       e.currentTarget.classList.remove('drag-over');
                     }}
                     onDrop={(e) => {
                       e.preventDefault();
                       e.currentTarget.classList.remove('drag-over');
                       const files = Array.from(e.dataTransfer.files);
                       const mockEvent = { target: { files } };
                       handleFileSelect(mockEvent);
                     }}
                     onClick={() => document.getElementById('fileInput').click()}
                >
                  <input
                    type="file"
                    className="hidden"
                    id="fileInput"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/mov,video/quicktime,video/x-msvideo,video/webm"
                  />
                  <div className="text-center">
                    <i className="bi bi-cloud-upload text-3xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 mb-1">Dosyaları buraya sürükleyin veya tıklayın</p>
                    <p className="text-sm text-gray-400">Galeri, kamera veya dosyalardan seçim yapabilirsiniz</p>
                    <p className="text-sm text-gray-400">PNG, JPG, HEIC, MP4, WebM dosyaları desteklenir (Max: 50MB)</p>
                  </div>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">
                        {selectedFiles.length} dosya seçildi
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        <i className="bi bi-trash mr-1"></i>
                        Tümünü kaldır
                      </button>
                    </div>
                    
                    <div className="media-preview-grid">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="media-preview-item">
                          {(file.type && file.type.startsWith("image/")) || 
                           file.name.toLowerCase().endsWith('.heic') || 
                           file.name.toLowerCase().endsWith('.heif') ? (
                            <div className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Önizleme ${index}`}
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  // Infinite loop önleme
                                  if (e.target.dataset.errorHandled) {
                                    return;
                                  }
                                  e.target.dataset.errorHandled = 'true';
                                  
                                  // HEIC/HEIF dosyası preview'da yüklenemiyorsa placeholder göster
                                  if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'heic-placeholder w-full h-32 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200';
                                    placeholder.innerHTML = `
                                      <i class="bi bi-image text-2xl text-yellow-600 mb-1"></i>
                                      <span class="text-yellow-800 text-xs font-medium">HEIC</span>
                                    `;
                                    e.target.parentNode.replaceChild(placeholder, e.target);
                                  } else {
                                    // Diğer resimler için basit placeholder
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'w-full h-32 flex flex-col items-center justify-center bg-gray-100 border border-gray-200';
                                    placeholder.innerHTML = `
                                      <i class="bi bi-image text-xl text-gray-400 mb-1"></i>
                                      <span class="text-gray-600 text-xs">Önizleme yok</span>
                                    `;
                                    e.target.parentNode.replaceChild(placeholder, e.target);
                                  }
                                }}
                              />
                              <div className="media-preview-overlay"></div>
                              <div className="media-type-badge">
                                <i className="bi bi-image mr-1"></i>
                                {file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') ? 'HEIC' : 'Fotoğraf'}
                              </div>
                            </div>
                          ) : file.type && file.type.startsWith("video/") ? (
                            <div className="video-preview">
                              <video
                                className="w-full h-32 object-cover"
                                muted
                                preload="metadata"
                                onLoadedMetadata={(e) => {
                                  // Video süresini al
                                  const duration = e.target.duration;
                                  console.log(`Video duration: ${duration} seconds`);
                                }}
                              >
                                <source src={URL.createObjectURL(file)} type={file.type} />
                              </video>
                              <div className="video-play-overlay">
                                <i className="bi bi-play-circle video-play-button"></i>
                              </div>
                              <div className="media-type-badge">
                                <i className="bi bi-camera-video mr-1"></i>
                                Video
                              </div>
                              <div className="media-size-badge">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center">
                              <i className="bi bi-file-earmark text-3xl text-gray-500 mb-2"></i>
                              <span className="text-xs text-gray-600 text-center px-2 break-all">
                                {file.name}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            className="remove-media-btn"
                            onClick={() => {
                              const newFiles = [...selectedFiles];
                              newFiles.splice(index, 1);
                              setSelectedFiles(newFiles);
                            }}
                            title="Dosyayı kaldır"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Dosya listesi */}
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Dosya Detayları:</h4>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center min-w-0 flex-1">
                            <i className={`bi ${(file.type && file.type.startsWith('image/')) || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') ? 'bi-image' : file.type && file.type.startsWith('video/') ? 'bi-camera-video' : 'bi-file-earmark'} mr-2 text-gray-500`}></i>
                            <span className="truncate font-medium">{file.name}</span>
                          </div>
                          <div className="flex items-center space-x-3 ml-3">
                            <span className="text-blue-600 font-medium">
                              {file.name.toLowerCase().endsWith('.heic') ? 'HEIC' : 
                               file.name.toLowerCase().endsWith('.heif') ? 'HEIF' :
                               file.type && file.type.includes('/') ? file.type.split('/')[1].toUpperCase() : 'DOSYA'}
                            </span>
                            <span className="text-gray-500">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary mr-3"
                onClick={closeModal}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={apiProgress || (!content && selectedFiles.length === 0)}
              >
                {apiProgress ? (
                  <>
                    <span className="spinner w-4 h-4 mr-2"></span>
                    Paylaşılıyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send mr-2"></i>
                    Paylaş
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { postUpdateEvent }; 