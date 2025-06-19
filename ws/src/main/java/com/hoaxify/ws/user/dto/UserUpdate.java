package com.hoaxify.ws.user.dto;

import com.hoaxify.ws.user.validation.FileType;

import jakarta.validation.constraints.Size;

public record UserUpdate(
    @Size(min = 4, max=255, message = "Kullanıcı adı 4-255 karakter arası olmalıdır")
    String username,

    @FileType(types = {"jpeg", "png", "heic", "heif"})
    String image,

    @FileType(types = {"jpeg", "png", "heic", "heif"})
    String banner,

    @Size(max = 500, message = "Bio en fazla 500 karakter olabilir")
    String bio
) {
    
}
