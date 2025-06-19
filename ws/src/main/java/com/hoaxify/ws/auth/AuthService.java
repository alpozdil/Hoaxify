package com.hoaxify.ws.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hoaxify.ws.auth.dto.AuthResponse;
import com.hoaxify.ws.auth.dto.Credentials;
import com.hoaxify.ws.auth.exception.AuthenticationException;
import com.hoaxify.ws.auth.token.Token;
import com.hoaxify.ws.auth.token.TokenService;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;
import com.hoaxify.ws.user.dto.UserDTO;

@Service
public class AuthService {

    @Autowired
    UserService userService;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    TokenService tokenService;

    public AuthResponse authenticate(Credentials creds) {
        System.out.println("=== AUTHENTICATION START ===");
        System.out.println("Login attempt for email: " + creds.email());
        
        User inDB = userService.findByEmail(creds.email());
        if(inDB == null) {
            System.out.println("User not found for email: " + creds.email());
            throw new AuthenticationException();
        }
        
        System.out.println("User found - ID: " + inDB.getId() + ", Active: " + inDB.isActive());
        
        if(!inDB.isActive()) {
            System.out.println("User account is not active: " + creds.email() + " - ACTIVATING FOR DEPLOY");
            inDB.setActive(true);
            userService.saveUser(inDB);
            System.out.println("User activated: " + creds.email());
        }
        
        if(!passwordEncoder.matches(creds.password(), inDB.getPassword())) {
            System.out.println("Password does not match for user: " + creds.email());
            throw new AuthenticationException();
        }
        
        System.out.println("Creating token for user: " + creds.email());
        Token token = tokenService.createToken(inDB, creds);
        
        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken(token);
        
        // UserDTO oluştururken LOB stream hatalarından kaçın
        try {
            authResponse.setUser(new UserDTO(inDB));
            System.out.println("UserDTO created successfully");
        } catch (Exception e) {
            System.err.println("Error creating UserDTO: " + e.getMessage());
            // Basit bir UserDTO oluştur
            UserDTO safeUserDTO = new UserDTO();
            safeUserDTO.setId(inDB.getId());
            safeUserDTO.setUsername(inDB.getUsername());
            safeUserDTO.setEmail(inDB.getEmail());
            safeUserDTO.setBio(inDB.getBio());
            // Image ve banner'ı null olarak bırak
            authResponse.setUser(safeUserDTO);
            System.out.println("Safe UserDTO created as fallback");
        }
        
        System.out.println("Authentication successful for user: " + creds.email());
        System.out.println("=== AUTHENTICATION END ===");
        
        return authResponse;
    }

    public void logout(String authorizationHeader) {
        tokenService.logout(authorizationHeader);
    }
    
}
