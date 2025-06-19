package com.hoaxify.ws.user.dto;

import com.hoaxify.ws.user.User;

public class UserDTO {
    
    long id;

    String username;

    String email;

    String image;

    String banner;

    String bio;

    // Default constructor
    public UserDTO() {
    }

    public UserDTO(User user){
        setId(user.getId());
        setUsername(user.getUsername());
        setEmail(user.getEmail());
        setImage(user.getImage());
        setBanner(user.getBanner());
        setBio(user.getBio());
    }

    public String getImage() {
        return this.image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getBanner() {
        return banner;
    }

    public void setBanner(String banner) {
        this.banner = banner;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


}
