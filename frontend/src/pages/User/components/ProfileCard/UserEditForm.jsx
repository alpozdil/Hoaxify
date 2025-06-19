import { useAuthDispatch, useAuthState } from "@/shared/state/context";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { updateUser } from "@/pages/User/components/ProfileCard/api";
import { Input } from "@/shared/components/Input";
import { Alert } from "@/shared/components/Alert";
import { Button } from "@/shared/components/Button";
import { getProfileImageUrl } from "@/utils/urlHelper";

export function UserEditForm({ setEditMode, setTempImage, setTempBanner, tempImage, tempBanner, onUserRefresh }) {
  const authState = useAuthState();
  const { t } = useTranslation();
  
  // AuthState kontrolü ekle
  if (!authState || !authState.id) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center">
          <p className="text-muted">Kullanıcı bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  const [newUsername, setNewUsername] = useState(authState.username || '');
  const [newBio, setNewBio] = useState(authState.bio || '');
  const [apiProgress, setApiProgress] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState();
  const dispatch = useAuthDispatch();
  const [newImage, setNewImage] = useState();
  const [newBanner, setNewBanner] = useState();

  const onChangeUsername = (event) => {
    setNewUsername(event.target.value);
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        username: undefined,
      };
    });
  };

  const onChangeBio = (event) => {
    setNewBio(event.target.value);
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        bio: undefined,
      };
    });
  };

  const onClickCancel = () => {
    setEditMode(false);
    setNewUsername(authState.username || '');
    setNewBio(authState.bio || '');
    setNewImage();
    setNewBanner();
    if (setTempImage) setTempImage(null);
    if (setTempBanner) setTempBanner(null);
  };

  const onSelectImage = (event) => {
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        image: undefined,
      };
    });
    if(event.target.files.length < 1) return;
    const file = event.target.files[0]
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const data = fileReader.result
      setNewImage(data);
      if (setTempImage) setTempImage(data);
    }
    fileReader.readAsDataURL(file);
  }

  const onSelectBanner = (event) => {
    setErrors(function (lastErrors) {
      return {
        ...lastErrors,
        banner: undefined,
      };
    });
    if(event.target.files.length < 1) return;
    const file = event.target.files[0]
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const data = fileReader.result
      setNewBanner(data);
      if (setTempBanner) setTempBanner(data);
    }
    fileReader.readAsDataURL(file);
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setApiProgress(true);
    setErrors({});
    setGeneralError();
    
    // Frontend validation
    const validationErrors = {};
    
    // Sadece username değişecekse validation yap
    if (newUsername.trim() !== authState.username) {
      if (!newUsername || newUsername.trim().length === 0) {
        validationErrors.username = "Kullanıcı adı boş olamaz";
      } else if (newUsername.trim().length < 4) {
        validationErrors.username = "Kullanıcı adı en az 4 karakter olmalıdır";
      } else if (newUsername.trim().length > 255) {
        validationErrors.username = "Kullanıcı adı en fazla 255 karakter olabilir";
      }
    }
    
    if (newBio && newBio.length > 500) {
      validationErrors.bio = "Bio en fazla 500 karakter olabilir";
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setApiProgress(false);
      return;
    }
    
    console.log('=== PROFIL GÜNCELLEME BAŞLADI ===');
    console.log('Environment Mode:', import.meta.env.MODE);
    console.log('Current User ID:', authState.id);
    console.log('Current Username:', authState.username);
    console.log('Current Bio:', authState.bio);
    console.log('Current Image:', authState.image);
    console.log('Current Banner:', authState.banner);
    console.log('================================');
    
    try {
      // Sadece değiştirilen alanları gönder
      const updateData = {};
      
      // Username değişti mi kontrol et
      if (newUsername.trim() !== authState.username) {
        updateData.username = newUsername.trim();
        console.log('Username güncelleniyor:', authState.username, '->', newUsername.trim());
      }
      
      // Bio değişti mi kontrol et
      const currentBio = authState.bio || '';
      const newBioTrimmed = newBio ? newBio.trim() : '';
      if (newBioTrimmed !== currentBio) {
        updateData.bio = newBioTrimmed || null;
        console.log('Bio güncelleniyor:', currentBio, '->', newBioTrimmed);
      }

      // Profil fotoğrafı - değiştirildi mi kontrol et
      if (newImage !== undefined) {
        updateData.image = newImage === '' ? null : newImage;
        console.log('Image güncelleniyor:', updateData.image ? 'Yeni resim var' : 'Resim siliniyor');
      }

      // Banner fotoğrafı - değiştirildi mi kontrol et
      if (newBanner !== undefined) {
        updateData.banner = newBanner === '' ? null : newBanner;
        console.log('Banner güncelleniyor:', updateData.banner ? 'Yeni banner var' : 'Banner siliniyor');
      }
      
      // Hiçbir alan değişmemişse işlem yapma
      if (Object.keys(updateData).length === 0) {
        console.log('Hiçbir alan değişmedi, güncelleme yapılmıyor');
        setEditMode(false);
        if (setTempImage) setTempImage(null);
        if (setTempBanner) setTempBanner(null);
        return;
      }
      
      console.log('=== FRONTEND: Gönderilen veri ===');
      console.log('Değiştirilen alanlar:', Object.keys(updateData));
      console.log('Username:', updateData.username || 'Değişmedi');
      console.log('Bio:', updateData.bio !== undefined ? updateData.bio : 'Değişmedi');
      console.log('Image:', updateData.image !== undefined ? (updateData.image ? `Base64 data (${updateData.image.length} karakter)` : 'Siliniyor') : 'Değişmedi');
      console.log('Banner:', updateData.banner !== undefined ? (updateData.banner ? `Base64 data (${updateData.banner.length} karakter)` : 'Siliniyor') : 'Değişmedi');
      console.log('Request URL:', `/api/v1/users/${authState.id}`);
      console.log('================================');
      
      const { data } = await updateUser(authState.id, updateData);
      
      console.log('=== BACKEND RESPONSE ===');
      console.log('Response data:', data);
      console.log('Updated username:', data.username);
      console.log('Updated bio:', data.bio);
      console.log('Updated image:', data.image);
      console.log('Updated banner:', data.banner);
      console.log('=======================');
      
      dispatch({
        type: "user-update-success",
        data: { 
          username: data.username, 
          image: data.image,
          banner: data.banner,
          bio: data.bio 
        },
      });
      
      console.log('Auth state güncellendi');
      
      setEditMode(false);
      if (setTempImage) setTempImage(null);
      if (setTempBanner) setTempBanner(null);
      
      // Kullanıcı refresh'i çağır
      if (onUserRefresh) {
        console.log('onUserRefresh çağrılıyor...');
        onUserRefresh();
      }
      
      // Cache'i zorla temizle
      if (data.image && data.image.startsWith('hoaxify/')) {
        console.log('Cloudinary cache temizleniyor...');
        // Yeni URL ile preload et
        const newImageUrl = getProfileImageUrl(data.image);
        const img = new Image();
        img.onload = () => console.log('Yeni profil fotoğrafı preload edildi');
        img.src = newImageUrl;
      }
    } catch (axiosError) {
      console.error('=== PROFIL GÜNCELLEME HATASI ===');
      console.error('Error object:', axiosError);
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
      console.error('Request config:', axiosError.config);
      console.error('Request URL:', axiosError.config?.url);
      console.error('Request method:', axiosError.config?.method);
      console.error('Request headers:', axiosError.config?.headers);
      console.error('===============================');
      
      if (axiosError.response?.data) {
        if (axiosError.response.data.status === 400) {
          setErrors(axiosError.response.data.validationErrors);
        } else {
          setGeneralError(axiosError.response.data.message || "Profil güncellenirken bir hata oluştu");
        }
      } else if (axiosError.response?.status === 404) {
        setGeneralError("Kullanıcı bulunamadı. Lütfen sayfayı yenileyin.");
      } else if (axiosError.response?.status === 403) {
        setGeneralError("Bu işlem için yetkiniz yok.");
      } else {
        setGeneralError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
      }
    } finally {
      setApiProgress(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="card-title mb-0">
          <i className="bi bi-person-gear me-2"></i>
          Profili Düzenle
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={onSubmit}>
          {/* Username */}
          <div className="mb-3">
            <Input
              label="Kullanıcı Adı"
              defaultValue={authState?.username || ''}
              onChange={onChangeUsername}
              error={errors.username}
            />
          </div>

          {/* Bio */}
          <div className="mb-3">
            <label className="form-label">Biyografi</label>
            <textarea
              className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
              rows="3"
              placeholder="Kendinizi tanıtın..."
              value={newBio}
              onChange={onChangeBio}
              maxLength={500}
            />
            {errors.bio && <div className="invalid-feedback">{errors.bio}</div>}
            <div className="form-text">{newBio.length}/500 karakter</div>
          </div>

          {/* Profile Image */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-person-circle me-2"></i>
              Profil Fotoğrafı
            </label>
            
            {/* Mevcut profil fotoğrafını göster */}
            {(tempImage || authState.image) && (
              <div className="mb-3 text-center">
                <img 
                  src={tempImage || getProfileImageUrl(authState.image)} 
                  alt="Profil Fotoğrafı" 
                  className="rounded-circle shadow-sm"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      setNewImage('');
                      if (setTempImage) setTempImage(null);
                    }}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Fotoğrafı Kaldır
                  </button>
                </div>
              </div>
            )}
            
            <input
              type="file"
              className={`form-control ${errors.image ? 'is-invalid' : ''}`}
              onChange={onSelectImage}
              accept="image/jpeg,image/png,image/heic,image/heif"
            />
            {errors.image && <div className="invalid-feedback">{errors.image}</div>}
            <div className="form-text">JPEG, PNG, HEIC formatları desteklenir</div>
          </div>

          {/* Banner Image */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-image me-2"></i>
              Banner Fotoğrafı
            </label>
            
            {/* Mevcut banner fotoğrafını göster */}
            {(tempBanner || authState.banner) && (
              <div className="mb-3 text-center">
                <img 
                  src={tempBanner || getProfileImageUrl(authState.banner)} 
                  alt="Banner Fotoğrafı" 
                  className="rounded shadow-sm"
                  style={{ width: '200px', height: '60px', objectFit: 'cover' }}
                />
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      setNewBanner('');
                      if (setTempBanner) setTempBanner(null);
                    }}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Banner'ı Kaldır
                  </button>
                </div>
              </div>
            )}
            
            <input
              type="file"
              className={`form-control ${errors.banner ? 'is-invalid' : ''}`}
              onChange={onSelectBanner}
              accept="image/jpeg,image/png,image/heic,image/heif"
            />
            {errors.banner && <div className="invalid-feedback">{errors.banner}</div>}
            <div className="form-text">Önerilen boyut: 1500x500 piksel • JPEG, PNG, HEIC formatları desteklenir</div>
          </div>

          {generalError && <Alert styleType="danger">{generalError}</Alert>}

          <div className="d-flex gap-2">
            <Button 
              apiProgress={apiProgress} 
              type="submit"
              className="flex-fill"
            >
              <i className="bi bi-check-lg me-2"></i>
              Kaydet
            </Button>
            <Button 
              styleType="outline-secondary" 
              onClick={onClickCancel} 
              type="button"
              className="flex-fill"
            >
              <i className="bi bi-x-lg me-2"></i>
              İptal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
