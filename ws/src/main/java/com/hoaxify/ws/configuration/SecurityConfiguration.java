package com.hoaxify.ws.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfiguration {

    @Autowired
    TokenFilter tokenFilter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{

        http.authorizeHttpRequests((authentication) -> 
            authentication.requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.PUT, "/api/v1/users/{id}")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.DELETE, "/api/v1/users/{id}")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/api/v1/posts")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.PUT, "/api/v1/posts/{id}")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.DELETE, "/api/v1/posts/{id}")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/api/v1/posts/{postId}/comments")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.PUT, "/api/v1/comments/{id}")).authenticated()
            .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.DELETE, "/api/v1/comments/{id}")).authenticated()
            .anyRequest().permitAll()
        );
        http.httpBasic(httpBasic -> httpBasic.authenticationEntryPoint(new AuthEntryPoint()));

        http.csrf(csrf -> csrf.disable());
        http.headers(headers -> headers.disable());
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));

        http.addFilterBefore(tokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*", 
            "https://localhost:*", 
            "https://hoaxify.vercel.app",
            "https://*.vercel.app",
            "https://hoaxify-*.vercel.app",
            "https://hoaxify.onrender.com",
            "https://hoaxify-backend.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
