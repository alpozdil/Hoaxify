package com.hoaxify.ws.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebMvc
public class WebConfiguration implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:./uploads/");
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Tüm origin'lere izin ver (geliştirme için)
        config.addAllowedOrigin("*");
        
        // Tüm header'lara izin ver
        config.addAllowedHeader("*");
        
        // Tüm HTTP metodlarına izin ver
        config.addAllowedMethod("*");
        
        // Credentials'a izin ver
        config.setAllowCredentials(false);
        
        // Max age
        config.setMaxAge(3600L);
        
        // Tüm path'ler için geçerli
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
} 