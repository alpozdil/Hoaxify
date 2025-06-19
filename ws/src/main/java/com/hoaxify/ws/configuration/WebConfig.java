package com.hoaxify.ws.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.WebContentInterceptor;

import java.util.concurrent.TimeUnit;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Autowired
    HoaxifyProperties hoaxifyProperties;
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Root dizininin path'ini al
        String uploadPath = hoaxifyProperties.getStorage().getRoot();
        
        // Profile resimleri için handler
        registry.addResourceHandler("/assets/profile/**")
                .addResourceLocations("file:./" + uploadPath + "/" + hoaxifyProperties.getStorage().getProfile() + "/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS))
                .resourceChain(true);
        
        // Gönderi eklerini servis et
        registry.addResourceHandler("/assets/attachment/**")
                .addResourceLocations("file:./" + uploadPath + "/" + hoaxifyProperties.getStorage().getAttachment() + "/")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS))
                .resourceChain(true);
        
        System.out.println("Resource handlers configured successfully:");
        System.out.println("Profile images: file:./" + uploadPath + "/" + hoaxifyProperties.getStorage().getProfile() + "/");
        System.out.println("Attachments: file:./" + uploadPath + "/" + hoaxifyProperties.getStorage().getAttachment() + "/");
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // CORS ayarları - Vercel ve Render için güncellenmiş
        registry.addMapping("/**")
                .allowedOriginPatterns(
                    "http://localhost:*", 
                    "https://localhost:*", 
                    "https://hoaxify.vercel.app",
                    "https://*.vercel.app",
                    "https://hoaxify-*.vercel.app",
                    "https://hoaxify.onrender.com",
                    "https://hoaxify-backend.onrender.com"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .exposedHeaders("Authorization", "Content-Type", "X-Requested-With")
                .allowCredentials(true)
                .maxAge(3600);
    }
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // API istekleri için önbellek kontrolü
        WebContentInterceptor webContentInterceptor = new WebContentInterceptor();
        
        // No-cache header'larını ayarla
        webContentInterceptor.setCacheSeconds(0);
        webContentInterceptor.setCacheControl(CacheControl.noCache().mustRevalidate());
        
        registry.addInterceptor(webContentInterceptor)
                .addPathPatterns("/api/v1/posts/**", "/api/v1/users/**");
    }
} 