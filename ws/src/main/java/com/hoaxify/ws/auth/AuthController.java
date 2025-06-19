package com.hoaxify.ws.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.hoaxify.ws.auth.dto.AuthResponse;
import com.hoaxify.ws.auth.dto.Credentials;
import com.hoaxify.ws.shared.GenericMessage;

import jakarta.validation.Valid;

@RestController
public class AuthController {

    @Autowired
    AuthService authService;
    
    @PostMapping("/api/v1/auth")
    ResponseEntity<AuthResponse> handleAuthentication(@Valid @RequestBody Credentials creds) {
        System.out.println("=== AUTH CONTROLLER START ===");
        System.out.println("Received authentication request for: " + creds.email());
        
        try {
            var authResponse = authService.authenticate(creds);
            var cookie = ResponseCookie.from("hoax-token", authResponse.getToken().getToken()).path("/").httpOnly(true).build();
            
            System.out.println("Authentication successful, returning response");
            System.out.println("=== AUTH CONTROLLER END ===");
            
            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(authResponse);
        } catch (Exception e) {
            System.err.println("=== AUTH CONTROLLER ERROR ===");
            System.err.println("Authentication error for: " + creds.email());
            System.err.println("Error type: " + e.getClass().getSimpleName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("=== AUTH CONTROLLER ERROR END ===");
            throw e; // Re-throw to let error handler deal with it
        }
    }

    @PostMapping("/api/v1/logout")
    ResponseEntity<GenericMessage> handleLogout(@RequestHeader(name="Authorization", required = false) String authorizationHeader, @CookieValue(name="hoax-token", required = false) String cookieValue){
        var tokenWithPrefix = authorizationHeader;
        if(cookieValue != null){
            tokenWithPrefix = "AnyPrefix " +cookieValue;
        }
        authService.logout(tokenWithPrefix);
        var cookie = ResponseCookie.from("hoax-token", "").path("/").maxAge(0).httpOnly(true).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(new GenericMessage("Logout success"));
    }

}
