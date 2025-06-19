package com.hoaxify.ws.configuration;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.hoaxify.ws.auth.token.TokenService;
import com.hoaxify.ws.user.User;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TokenFilter extends OncePerRequestFilter{

    @Autowired
    TokenService tokenService;

    @Autowired
    @Qualifier("handlerExceptionResolver")
    private HandlerExceptionResolver exceptionResolver;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        System.out.println("TokenFilter: İstek - " + method + " " + requestPath);
        
        String tokenWithPrefix = getTokenWithPrefix(request);
        System.out.println("TokenFilter: Token mevcut - " + (tokenWithPrefix != null));
        
        if(tokenWithPrefix != null) {
            User user = tokenService.verifyToken(tokenWithPrefix);
            System.out.println("TokenFilter: Token doğrulandı - " + (user != null));
            
            if(user != null) {
                System.out.println("TokenFilter: Kullanıcı bilgileri - ID: " + user.getId() + ", Username: " + user.getUsername() + ", Active: " + user.isActive());
                
                if(!user.isActive()) {
                    System.out.println("TokenFilter: Kullanıcı aktif değil");
                    exceptionResolver.resolveException(request, response, null, new DisabledException("User is disabled"));
                    return;
                }
                CurrentUser currentUser = new CurrentUser(user);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(currentUser, null, currentUser.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("TokenFilter: SecurityContext'e authentication eklendi");
            }
        } else {
            System.out.println("TokenFilter: Token bulunamadı");
        }
        
        filterChain.doFilter(request, response);
    }

    private String getTokenWithPrefix(HttpServletRequest request) {
        var tokenWithPrefix = request.getHeader("Authorization");
        System.out.println("TokenFilter: Authorization header - " + tokenWithPrefix);
        
        var cookies = request.getCookies();
        if(cookies == null) {
            System.out.println("TokenFilter: Cookie bulunamadı");
            return tokenWithPrefix;
        }
        
        for(var cookie: cookies){
            if(!cookie.getName().equals("hoax-token")) continue;
            if(cookie.getValue() == null || cookie.getValue().isEmpty()) continue;
            System.out.println("TokenFilter: hoax-token cookie bulundu");
            return "AnyPrefix " + cookie.getValue();
        }
        return tokenWithPrefix;
    }
    
}
