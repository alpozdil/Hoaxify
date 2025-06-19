import defaultProfileImage from "@/assets/profile.png";
import { getProfileImageUrl } from "@/utils/urlHelper";

export function ProfileImage({ width, height, tempImage = null, image }) {
  // tempImage undefined ise null olarak ayarla
  const safeTempImage = tempImage || null;
  const profileImage = image ? getProfileImageUrl(image) : defaultProfileImage;

  return (
    <img
      src={safeTempImage || profileImage}
      width={width}
      height={height || width}
      className="rounded-full shadow-sm"
      style={{ 
        objectFit: 'cover',
        backgroundColor: '#f3f4f6' 
      }}
      onError={({target}) => {
        // Infinite loop önleme
        if (target.dataset.errorHandled) {
          return;
        }
        target.dataset.errorHandled = 'true';
        
        console.log(`Profile image failed to load: ${target.src}`);
        target.src = defaultProfileImage;
      }}
      onLoad={() => {
        // Error handling flag'ini temizle
        if (safeTempImage || image) {
          console.log(`Profile image loaded successfully: ${safeTempImage || profileImage}`);
        }
      }}
    />
  );
}
