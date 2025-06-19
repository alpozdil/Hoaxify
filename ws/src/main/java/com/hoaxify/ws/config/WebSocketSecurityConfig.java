package com.hoaxify.ws.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.hoaxify.ws.auth.token.TokenService;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;

import java.util.Collections;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketSecurityConfig implements ChannelInterceptor {

    @Autowired
    private TokenService tokenService;

    @Autowired 
    private UserService userService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                
                try {
                    User user = tokenService.verifyToken(token);
                    if (user != null) {
                        Authentication authentication = new UsernamePasswordAuthenticationToken(
                            user.getEmail(), null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
                        
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        accessor.setUser(authentication);
                        
                        // Kullanıcı ID'sini session'a ekle
                        accessor.getSessionAttributes().put("userId", user.getId());
                        accessor.getSessionAttributes().put("username", user.getUsername());
                        
                        System.out.println("WebSocket kullanıcı kimliği doğrulandı: " + user.getUsername());
                    }
                } catch (Exception e) {
                    System.err.println("WebSocket authentication failed: " + e.getMessage());
                }
            }
        }
        
        return message;
    }

    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(this);
    }
} 