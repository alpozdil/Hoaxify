import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createPost } from "../Home/components/api";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { useAuthState } from "@/shared/state/context";

export function CreatePost() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authState = useAuthState();
  
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [shareApiProgress, setShareApiProgress] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [errors, setErrors] = useState({});

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleShare = async () => {
    if (!content && selectedFiles.length === 0) return;
    
    setShareApiProgress(true);
    setErrors({});
    
    try {
      await createPost(content, selectedFiles);
      navigate("/feed");
    } catch (error) {
      if (error.response?.data?.validationErrors) {
        setErrors(error.response.data.validationErrors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || "Gönderi oluşturulurken bir hata oluştu." 
        });
      }
      console.error("Gönderi paylaşılırken hata oluştu:", error);
    } finally {
      setShareApiProgress(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header">
          <h4 className="mb-0">{t("Yeni Gönderi Oluştur")}</h4>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-start mb-3">
            <ProfileImage width={40} height={40} image={authState.image} />
            <div className="flex-grow-1 ms-3">
              <textarea 
                className={`form-control ${errors.content ? "is-invalid" : ""}`}
                rows="5" 
                placeholder={t("Ne düşünüyorsun?")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              ></textarea>
              {errors.content && (
                <div className="invalid-feedback">{errors.content}</div>
              )}
            </div>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="position-relative">
                    {(file.type && file.type.startsWith("image/")) || 
                     file.name.toLowerCase().endsWith('.heic') || 
                     file.name.toLowerCase().endsWith('.heif') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Önizleme ${index}`}
                        style={{ width: "100px", height: "100px", objectFit: "cover" }}
                        className="rounded"
                        onError={(e) => {
                          // Infinite loop önleme
                          if (e.target.dataset.errorHandled) {
                            return;
                          }
                          e.target.dataset.errorHandled = 'true';
                          
                          // HEIC/HEIF dosyası preview'da yüklenemiyorsa placeholder göster
                          if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'heic-placeholder d-flex flex-column align-items-center justify-content-center bg-warning bg-opacity-25 border border-warning rounded';
                            placeholder.style.width = '100px';
                            placeholder.style.height = '100px';
                            placeholder.innerHTML = `
                              <i class="bi bi-image text-warning fs-4"></i>
                              <small class="text-warning">HEIC</small>
                            `;
                            e.target.parentNode.replaceChild(placeholder, e.target);
                          } else {
                            // Diğer resimler için basit placeholder
                            const placeholder = document.createElement('div');
                            placeholder.className = 'd-flex flex-column align-items-center justify-content-center bg-light border border-secondary rounded';
                            placeholder.style.width = '100px';
                            placeholder.style.height = '100px';
                            placeholder.innerHTML = `
                              <i class="bi bi-image text-secondary fs-4"></i>
                              <small class="text-secondary">Hata</small>
                            `;
                            e.target.parentNode.replaceChild(placeholder, e.target);
                          }
                        }}
                      />
                    ) : (
                      <div
                        className="bg-light d-flex align-items-center justify-content-center rounded"
                        style={{ width: "100px", height: "100px" }}
                      >
                        <i className="bi bi-file-earmark-play fs-3"></i>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0"
                      onClick={() => {
                        const newFiles = [...selectedFiles];
                        newFiles.splice(index, 1);
                        setSelectedFiles(newFiles);
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}
          
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <label className="btn btn-outline-secondary" htmlFor="file-upload">
                <i className="bi bi-image me-1"></i>
                {t("Fotoğraf/Video")}
              </label>
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/mov,video/quicktime,video/x-msvideo,video/webm"
                style={{ display: 'none' }} 
                onChange={handleFileSelect}
                key={fileInputKey}
              />
            </div>
            <div>
              <button 
                className="btn btn-secondary me-2"
                onClick={() => navigate("/feed")}
              >
                {t("İptal")}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleShare}
                disabled={shareApiProgress || (!content && selectedFiles.length === 0)}
              >
                {shareApiProgress ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    {t("Paylaşılıyor...")}
                  </>
                ) : (
                  t("Paylaş")
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 