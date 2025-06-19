package com.hoaxify.ws.file;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hoaxify.ws.configuration.HoaxifyProperties;
import com.hoaxify.ws.post.Post;

@Service
public class FileService {

    @Autowired
    HoaxifyProperties hoaxifyProperties;
    
    @Autowired
    FileAttachmentRepository fileAttachmentRepository;

    @Autowired(required = false)
    Cloudinary cloudinary;

    @Value("${hoaxify.storage.use-cloudinary:false}")
    private boolean useCloudinary;

    Tika tika = new Tika();

    public String saveBase64StringAsFile(String image) {
        System.out.println("=== FileService.saveBase64StringAsFile başlatıldı ===");
        System.out.println("Use Cloudinary: " + useCloudinary);
        
        if (image == null || image.trim().isEmpty()) {
            System.err.println("Base64 string boş veya null!");
            return null;
        }

        try {
            if (useCloudinary && cloudinary != null) {
                return saveToCloudinary(image);
            } else {
                return saveToLocalStorage(image);
            }
        } catch (Exception e) {
            System.err.println("Dosya kaydetme genel hatası: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private String saveToCloudinary(String image) throws Exception {
        System.out.println("Cloudinary'ye kaydetme başlatıldı...");
        
        // Base64 string'i decode et
        byte[] decodedBytes = decodedImage(image);
        System.out.println("Base64 decode edildi, byte sayısı: " + decodedBytes.length);
        
        // Cloudinary'ye upload et
        Map uploadParams = ObjectUtils.asMap(
            "resource_type", "auto",
            "folder", "hoaxify/profiles",
            "public_id", UUID.randomUUID().toString(),
            "overwrite", true,
            "quality", "auto:good",
            "fetch_format", "auto"
        );
        
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(decodedBytes, uploadParams);
        
        String secureUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");
        
        System.out.println("Cloudinary'ye başarıyla yüklendi:");
        System.out.println("Public ID: " + publicId);
        System.out.println("Secure URL: " + secureUrl);
        
        // Public ID'yi döndür (URL'yi değil)
        return publicId;
    }

    private String saveToLocalStorage(String image) throws IOException {
        String filename = UUID.randomUUID().toString();
        System.out.println("Local storage'a kaydetme, dosya adı: " + filename);

        Path path = getProfileImagePath(filename);
        System.out.println("Hedef path: " + path.toString());
        
        // Base64 string'i decode et
        byte[] decodedBytes = decodedImage(image);
        System.out.println("Base64 decode edildi, byte sayısı: " + decodedBytes.length);
        
        // Dosya türünü tespit et
        String detectedType = detectType(image);
        System.out.println("Tespit edilen dosya türü: " + detectedType);
        
        OutputStream outputStream = new FileOutputStream(path.toFile());
        outputStream.write(decodedBytes);
        outputStream.close();
        
        System.out.println("Local storage'a başarıyla kaydedildi: " + filename);
        return filename;
    }

    public List<FileAttachment> savePostAttachments(List<MultipartFile> files, Post post) {
        try {
            System.out.println("FileService.savePostAttachments çağrıldı. Post ID: " + post.getId());
            System.out.println("Use Cloudinary for attachments: " + useCloudinary);
            
            if (files == null || files.isEmpty()) {
                System.out.println("Dosya ekleri boş, hiç dosya eklenmemiş.");
                return List.of();
            }

            System.out.println("Toplam " + files.size() + " adet dosya eklenmek üzere işleniyor.");
            
            // Local storage için klasörlerin var olduğunu kontrol et
            if (!useCloudinary || cloudinary == null) {
                Path attachmentDir = Paths.get(hoaxifyProperties.getStorage().getRoot(), hoaxifyProperties.getStorage().getAttachment());
                if (!Files.exists(attachmentDir)) {
                    System.out.println("Attachment dizini oluşturuluyor: " + attachmentDir);
                    Files.createDirectories(attachmentDir);
                }
            }

            return files.stream().map(file -> {
                String filename = UUID.randomUUID().toString();
                String fileType = file.getContentType();
                String originalFilename = file.getOriginalFilename();
                
                // HEIC/HEIF dosyaları için özel işlem
                if (originalFilename != null) {
                    String lowerName = originalFilename.toLowerCase();
                    if (lowerName.endsWith(".heic")) {
                        fileType = "image/heic";
                        System.out.println("HEIC dosyası tespit edildi, file type 'image/heic' olarak ayarlandı");
                    } else if (lowerName.endsWith(".heif")) {
                        fileType = "image/heif";
                        System.out.println("HEIF dosyası tespit edildi, file type 'image/heif' olarak ayarlandı");
                    }
                    // Diğer iPhone formatları için de kontrol
                    else if (lowerName.endsWith(".mov") && (fileType == null || fileType.equals("application/octet-stream"))) {
                        fileType = "video/quicktime";
                        System.out.println("iPhone MOV dosyası tespit edildi, file type 'video/quicktime' olarak ayarlandı");
                    }
                }
                
                // Eğer file type hala null ise, dosya uzantısından tahmin et
                if (fileType == null || fileType.equals("application/octet-stream")) {
                    if (originalFilename != null) {
                        String ext = originalFilename.toLowerCase();
                        if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) {
                            fileType = "image/jpeg";
                        } else if (ext.endsWith(".png")) {
                            fileType = "image/png";
                        } else if (ext.endsWith(".mp4")) {
                            fileType = "video/mp4";
                        } else if (ext.endsWith(".webm")) {
                            fileType = "video/webm";
                        } else {
                            fileType = "application/octet-stream"; // Fallback
                        }
                        System.out.println("File type dosya uzantısından tahmin edildi: " + fileType);
                    }
                }
                
                System.out.println("Dosya işleniyor: " + originalFilename + ", final file type: " + fileType);
                
                try {
                    String savedIdentifier;
                    
                    if (useCloudinary && cloudinary != null) {
                        // Cloudinary'ye kaydet
                        savedIdentifier = saveAttachmentToCloudinary(file, filename);
                        System.out.println("Attachment Cloudinary'ye kaydedildi: " + savedIdentifier);
                    } else {
                        // Local storage'a kaydet
                        savedIdentifier = saveAttachmentToLocal(file, filename);
                        System.out.println("Attachment local storage'a kaydedildi: " + savedIdentifier);
                    }
                    
                    if (savedIdentifier != null) {
                        FileAttachment attachment = new FileAttachment(savedIdentifier, fileType);
                        attachment.setPost(post);
                        return fileAttachmentRepository.save(attachment);
                    } else {
                        System.err.println("Dosya kaydedilemedi!");
                        return null;
                    }
                } catch (Exception e) {
                    System.err.println("Dosya kaydedilirken hata: " + e.getMessage());
                    e.printStackTrace();
                    return null;
                }
            }).filter(attachment -> attachment != null).toList();
        } catch (Exception e) {
            System.err.println("savePostAttachments metodunda kritik hata: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Dosya ekleri kaydedilirken bir hata oluştu", e);
        }
    }

    private String saveAttachmentToCloudinary(MultipartFile file, String filename) throws Exception {
        System.out.println("Attachment Cloudinary'ye kaydetme başlatıldı...");
        
        byte[] fileBytes = file.getBytes();
        System.out.println("File byte sayısı: " + fileBytes.length);
        
        // Cloudinary'ye upload et
        Map uploadParams = ObjectUtils.asMap(
            "resource_type", "auto",
            "folder", "hoaxify/attachments",
            "public_id", filename,
            "overwrite", true,
            "quality", "auto:good",
            "fetch_format", "auto"
        );
        
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(fileBytes, uploadParams);
        
        String publicId = (String) uploadResult.get("public_id");
        String secureUrl = (String) uploadResult.get("secure_url");
        
        System.out.println("Attachment Cloudinary'ye başarıyla yüklendi:");
        System.out.println("Public ID: " + publicId);
        System.out.println("Secure URL: " + secureUrl);
        
        return publicId;
    }

    private String saveAttachmentToLocal(MultipartFile file, String filename) throws Exception {
        Path path = getPostAttachmentPath(filename);
        byte[] fileBytes = file.getBytes();
        Files.write(path, fileBytes);
        return filename;
    }

    public String detectType(String value) {
        return tika.detect(decodedImage(value));
    }

    private byte[] decodedImage(String encodedImage) {
        return Base64.getDecoder().decode(encodedImage.split(",")[1]);
    }

    public void deleteProfileImage(String imageIdentifier) {
        if(imageIdentifier == null) return;
        
        try {
            if (useCloudinary && cloudinary != null && imageIdentifier.startsWith("hoaxify/")) {
                // Cloudinary'den sil
                System.out.println("Cloudinary'den siliniyor: " + imageIdentifier);
                cloudinary.uploader().destroy(imageIdentifier, ObjectUtils.emptyMap());
                System.out.println("Cloudinary'den silindi: " + imageIdentifier);
            } else {
                // Local storage'dan sil
                Path path = getProfileImagePath(imageIdentifier);
                Files.deleteIfExists(path);
                System.out.println("Local storage'dan silindi: " + imageIdentifier);
            }
        } catch (Exception e) {
            System.err.println("Profil fotoğrafı silinirken hata: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void deleteAttachment(FileAttachment attachment) {
        if(attachment.getName() == null) return;
        
        try {
            if (useCloudinary && cloudinary != null && attachment.getName().startsWith("hoaxify/")) {
                // Cloudinary'den sil
                System.out.println("Attachment Cloudinary'den siliniyor: " + attachment.getName());
                cloudinary.uploader().destroy(attachment.getName(), ObjectUtils.emptyMap());
                System.out.println("Attachment Cloudinary'den silindi: " + attachment.getName());
            } else {
                // Local storage'dan sil
                Path path = getPostAttachmentPath(attachment.getName());
                Files.deleteIfExists(path);
                System.out.println("Attachment local storage'dan silindi: " + attachment.getName());
            }
            
            fileAttachmentRepository.delete(attachment);
        } catch (Exception e) {
            System.err.println("Attachment silinirken hata: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Path getProfileImagePath(String filename){
        Path profileDir = Paths.get(hoaxifyProperties.getStorage().getRoot(), hoaxifyProperties.getStorage().getProfile());
        
        // Dizin yoksa oluştur
        try {
            if (!Files.exists(profileDir)) {
                System.out.println("Profile dizini oluşturuluyor: " + profileDir);
                Files.createDirectories(profileDir);
            }
        } catch (IOException e) {
            System.err.println("Profile dizini oluşturulamadı: " + e.getMessage());
            e.printStackTrace();
        }
        
        return profileDir.resolve(filename);
    }
    
    private Path getPostAttachmentPath(String filename){
        return Paths.get(hoaxifyProperties.getStorage().getRoot(), hoaxifyProperties.getStorage().getAttachment(), filename);
    }
}
