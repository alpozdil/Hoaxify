package com.hoaxify.ws.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
@Profile("production")
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() throws URISyntaxException {
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            URI dbUri = new URI(databaseUrl);
            
            String[] userInfo = dbUri.getUserInfo().split(":");
            String username = userInfo[0];
            String password = userInfo.length > 1 ? userInfo[1] : "";
            
            // Default PostgreSQL port if not specified
            int port = dbUri.getPort() == -1 ? 5432 : dbUri.getPort();
            String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' + port + dbUri.getPath();

            System.out.println("Database URL: " + dbUrl);
            System.out.println("Username: " + username);

            return DataSourceBuilder.create()
                    .url(dbUrl)
                    .username(username)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }
        
        // Fallback to default configuration
        return DataSourceBuilder.create().build();
    }
} 