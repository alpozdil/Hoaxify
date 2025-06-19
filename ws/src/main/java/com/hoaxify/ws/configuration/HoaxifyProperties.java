package com.hoaxify.ws.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@ConfigurationProperties(prefix = "hoaxify")
@Configuration
public class HoaxifyProperties {

    private String clientHost = "http://localhost:5173";
    
    private Email email = new Email();
    
    private Storage storage = new Storage();
    
    private Auth auth = new Auth();
    
    private Cloudinary cloudinary = new Cloudinary();

    public static class Email {
        private String username;
        private String password;
        private String host;
        private int port;
        private String from;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getHost() { return host; }
        public void setHost(String host) { this.host = host; }
        public int getPort() { return port; }
        public void setPort(int port) { this.port = port; }
        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }
    }

    public static class Storage {
        private String root = "uploads";
        private String profile = "profile";
        private String attachment = "attachment";
        private boolean useCloudinary = false;

        public String getRoot() { return root; }
        public void setRoot(String root) { this.root = root; }
        public String getProfile() { return profile; }
        public void setProfile(String profile) { this.profile = profile; }
        public String getAttachment() { return attachment; }
        public void setAttachment(String attachment) { this.attachment = attachment; }
        public boolean isUseCloudinary() { return useCloudinary; }
        public void setUseCloudinary(boolean useCloudinary) { this.useCloudinary = useCloudinary; }
    }
    
    public static class Auth {
        private String tokenSecret = "your-super-secret-key-minimum-32-characters-long";
        private int tokenExpirationDays = 30;

        public String getTokenSecret() { return tokenSecret; }
        public void setTokenSecret(String tokenSecret) { this.tokenSecret = tokenSecret; }
        public int getTokenExpirationDays() { return tokenExpirationDays; }
        public void setTokenExpirationDays(int tokenExpirationDays) { this.tokenExpirationDays = tokenExpirationDays; }
    }
    
    public static class Cloudinary {
        private String cloudName = "your-cloud-name";
        private String apiKey = "your-api-key";
        private String apiSecret = "your-api-secret";

        public String getCloudName() { return cloudName; }
        public void setCloudName(String cloudName) { this.cloudName = cloudName; }
        public String getApiKey() { return apiKey; }
        public void setApiKey(String apiKey) { this.apiKey = apiKey; }
        public String getApiSecret() { return apiSecret; }
        public void setApiSecret(String apiSecret) { this.apiSecret = apiSecret; }
    }

    public String getClientHost() {
        return clientHost;
    }

    public void setClientHost(String clientHost) {
        this.clientHost = clientHost;
    }

    public Email getEmail() {
        return email;
    }

    public void setEmail(Email email) {
        this.email = email;
    }

    public Storage getStorage() {
        return storage;
    }

    public void setStorage(Storage storage) {
        this.storage = storage;
    }
    
    public Auth getAuth() {
        return auth;
    }

    public void setAuth(Auth auth) {
        this.auth = auth;
    }
    
    public Cloudinary getCloudinary() {
        return cloudinary;
    }

    public void setCloudinary(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }
}
