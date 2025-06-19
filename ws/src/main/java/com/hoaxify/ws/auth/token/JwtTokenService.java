package com.hoaxify.ws.auth.token;

import javax.crypto.SecretKey;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoaxify.ws.auth.dto.Credentials;
import com.hoaxify.ws.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
@ConditionalOnProperty(name = "hoaxify.token-type", havingValue = "jwt")
public class JwtTokenService implements TokenService{

    SecretKey key = Keys.hmacShaKeyFor("secret-must-be-at-least-32-chars".getBytes());

    ObjectMapper mapper = new ObjectMapper();

    @Override
    public Token createToken(User user, Credentials creds) {
        System.out.println("=== JWT TOKEN CREATION START ===");
        System.out.println("Creating token for user ID: " + user.getId() + ", Active: " + user.isActive());
        
        try {
            TokenSubject tokenSubject = new TokenSubject(user.getId(), user.isActive());
            String subject = mapper.writeValueAsString(tokenSubject);
            System.out.println("Token subject created: " + subject);
            
            String token = Jwts.builder().setSubject(subject).signWith(key).compact();
            System.out.println("JWT token created successfully");
            System.out.println("=== JWT TOKEN CREATION END ===");
            
            return new Token("Bearer", token);
        } catch (JsonProcessingException e) {
            System.err.println("=== JWT TOKEN CREATION ERROR ===");
            System.err.println("JsonProcessingException occurred: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Token oluşturulamadı: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("=== JWT TOKEN CREATION UNEXPECTED ERROR ===");
            System.err.println("Unexpected exception occurred: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Token oluşturulurken beklenmeyen hata: " + e.getMessage(), e);
        }
    }

    @Override
    public User verifyToken(String authorizationHeader) {
        if(authorizationHeader == null) return null;
        var token = authorizationHeader.split(" ")[1];
        JwtParser parser = Jwts.parserBuilder().setSigningKey(key).build();
        try {
            Jws<Claims> claims = parser.parseClaimsJws(token);
            var subject = claims.getBody().getSubject();
            var tokenSubject = mapper.readValue(subject, TokenSubject.class);
            User user = new User();
            user.setId(tokenSubject.id());
            user.setActive(tokenSubject.active());
            return user;
        } catch (JwtException | JsonProcessingException e) {
            e.printStackTrace();
        }
        return null;
    }

    

    public static record TokenSubject(long id, boolean active) {}



    @Override
    public void logout(String authorizationHeader) {
    }
    
}
