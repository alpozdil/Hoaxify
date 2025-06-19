package com.hoaxify.ws.configuration;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.net.URI;

@Configuration
public class CloudinaryConfig {

    @Value("${CLOUDINARY_URL:}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        if (cloudinaryUrl != null && !cloudinaryUrl.trim().isEmpty()) {
            System.out.println("Cloudinary URL ile konfigüre ediliyor...");
            return new Cloudinary(cloudinaryUrl);
        } else {
            System.out.println("Cloudinary URL bulunamadı - manuel konfigürasyon deneniyor...");
            // Fallback: Ayrı environment variable'lar
            return new Cloudinary();
        }
    }

    /**
     * CLOUDINARY_URL'den cloud name'i çıkarır
     * Format: cloudinary://<api_key>:<api_secret>@<cloud_name>
     */
    public String getCloudName() {
        if (cloudinaryUrl != null && !cloudinaryUrl.trim().isEmpty()) {
            try {
                URI uri = new URI(cloudinaryUrl);
                return uri.getHost(); // Cloud name host kısmında
            } catch (Exception e) {
                System.err.println("Cloud name çıkarılırken hata: " + e.getMessage());
            }
        }
        return "your-cloud-name"; // Fallback
    }
} 