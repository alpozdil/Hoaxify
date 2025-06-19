package com.hoaxify.ws.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    @Autowired
    CloudinaryConfig cloudinaryConfig;

    @GetMapping("/cloudinary")
    public Map<String, String> getCloudinaryConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("cloudName", cloudinaryConfig.getCloudName());
        return config;
    }
} 