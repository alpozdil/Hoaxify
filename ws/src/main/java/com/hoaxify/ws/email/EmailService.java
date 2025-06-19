package com.hoaxify.ws.email;

import java.util.Properties;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.hoaxify.ws.configuration.HoaxifyProperties;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    JavaMailSenderImpl mailSender;

    @Autowired
    HoaxifyProperties hoaxifyProperties;

    @Autowired
    MessageSource messageSource;

    @PostConstruct
    public void initialize(){
        this.mailSender = new JavaMailSenderImpl();
        
        // Gmail SMTP ayarlarını logla
        System.out.println("=== Gmail SMTP Konfigürasyonu ===");
        System.out.println("Host: " + hoaxifyProperties.getEmail().getHost());
        System.out.println("Port: " + hoaxifyProperties.getEmail().getPort());
        System.out.println("Username: " + hoaxifyProperties.getEmail().getUsername());
        System.out.println("From: " + hoaxifyProperties.getEmail().getFrom());
        System.out.println("Password length: " + (hoaxifyProperties.getEmail().getPassword() != null ? hoaxifyProperties.getEmail().getPassword().length() : "null"));
        
        mailSender.setHost(hoaxifyProperties.getEmail().getHost());
        mailSender.setPort(hoaxifyProperties.getEmail().getPort());
        mailSender.setUsername(hoaxifyProperties.getEmail().getUsername());
        mailSender.setPassword(hoaxifyProperties.getEmail().getPassword());

        // Gmail SMTP için port'a göre ayarlar
        Properties properties = mailSender.getJavaMailProperties();
        
        // Temel SMTP ayarları
        properties.put("mail.transport.protocol", "smtp");
        properties.put("mail.smtp.auth", "true");
        
        int port = hoaxifyProperties.getEmail().getPort();
        if (port == 587) {
            // Port 587 için STARTTLS konfigürasyonu
            System.out.println("Port 587 kullanılıyor - STARTTLS konfigürasyonu");
            properties.put("mail.smtp.starttls.enable", "true");
            properties.put("mail.smtp.starttls.required", "true");
            properties.put("mail.smtp.ssl.trust", "smtp.gmail.com");
            properties.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            
        } else if (port == 465) {
            // Port 465 için SSL konfigürasyonu
            System.out.println("Port 465 kullanılıyor - SSL konfigürasyonu");
            properties.put("mail.smtp.ssl.enable", "true");
            properties.put("mail.smtp.ssl.required", "true");
            properties.put("mail.smtp.ssl.trust", "smtp.gmail.com");
            properties.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            properties.put("mail.smtp.socketFactory.port", "465");
            properties.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            properties.put("mail.smtp.socketFactory.fallback", "false");
        }
        
        // Bağlantı timeout ayarları
        properties.put("mail.smtp.connectiontimeout", "30000");
        properties.put("mail.smtp.timeout", "30000");
        properties.put("mail.smtp.writetimeout", "30000");
        
        // Debug ayarları
        properties.put("mail.debug", "true");
        
        System.out.println("Gmail SMTP özellikleri ayarlandı:");
        properties.forEach((key, value) -> System.out.println(key + ": " + value));
        System.out.println("=== Konfigürasyon Tamamlandı ===");
    }

    String activationEmail = """
            <html>
                <body>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="color: #343a40; margin-bottom: 20px;">${title}</h1>
                            <p style="color: #6c757d; margin-bottom: 30px;">Hesabınızı aktifleştirmek için aşağıdaki bağlantıya tıklayın:</p>
                            <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">${clickHere}</a>
                            <p style="color: #6c757d; margin-top: 30px; font-size: 14px;">Bu e-posta Hoaxify uygulaması tarafından gönderilmiştir.</p>
                        </div>
                    </div>
                </body>
            </html>
            """;

    public void sendActivationEmail(String email, String activationToken) {
        System.out.println("=== E-posta Gönderimi Başlıyor ===");
        System.out.println("Alıcı: " + email);
        System.out.println("Token: " + activationToken);
        
        String activationUrl = hoaxifyProperties.getClientHost() + "/activation/" + activationToken;
        String title = messageSource.getMessage("hoaxify.mail.user.created.title", null, LocaleContextHolder.getLocale());
        String clickHere = messageSource.getMessage("hoaxify.mail.click.here", null, LocaleContextHolder.getLocale());

        String mailBody = activationEmail
            .replace("${url}", activationUrl)
            .replace("${title}", title)
            .replace("${clickHere}", clickHere);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper message = new MimeMessageHelper(mimeMessage, "UTF-8");
        try {
            message.setFrom(hoaxifyProperties.getEmail().getFrom());
            message.setTo(email);
            message.setSubject(title);
            message.setText(mailBody, true);
            
            System.out.println("E-posta hazırlandı, gönderiliyor...");
            System.out.println("From: " + hoaxifyProperties.getEmail().getFrom());
            System.out.println("To: " + email);
            System.out.println("Subject: " + title);
            
            this.mailSender.send(mimeMessage);
            System.out.println("✅ Aktivasyon e-postası başarıyla gönderildi: " + email);
            
        } catch (MessagingException e) {
            System.err.println("❌ E-posta gönderilirken MessagingException oluştu:");
            System.err.println("Hata Mesajı: " + e.getMessage());
            System.err.println("Hata Nedeni: " + e.getCause());
            e.printStackTrace();
            throw new RuntimeException("Gmail SMTP ile e-posta gönderilemedi: " + e.getMessage(), e);
        } catch (Exception e) {
            System.err.println("❌ E-posta gönderilirken genel hata oluştu:");
            System.err.println("Hata Mesajı: " + e.getMessage());
            System.err.println("Hata Sınıfı: " + e.getClass().getName());
            e.printStackTrace();
            throw new RuntimeException("E-posta gönderim hatası: " + e.getMessage(), e);
        }
    }

    public void sendPasswordResetEmail(String email, String passwordResetToken) {
        System.out.println("=== Şifre Sıfırlama E-postası Gönderimi ===");
        System.out.println("Alıcı: " + email);
        
        String passwordResetUrl = hoaxifyProperties.getClientHost() + "/password-reset/set?tk=" + passwordResetToken;
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper message = new MimeMessageHelper(mimeMessage, "UTF-8");
        String title = "Şifrenizi Sıfırlayın";
        String clickHere = messageSource.getMessage("hoaxify.mail.click.here", null, LocaleContextHolder.getLocale());
        
        String passwordResetEmailTemplate = """
            <html>
                <body>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                            <h1 style="color: #dc3545; margin-bottom: 20px;">${title}</h1>
                            <p style="color: #6c757d; margin-bottom: 30px;">Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
                            <a href="${url}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">${clickHere}</a>
                            <p style="color: #6c757d; margin-top: 30px; font-size: 14px;">Bu e-posta Hoaxify uygulaması tarafından gönderilmiştir.</p>
                            <p style="color: #dc3545; margin-top: 15px; font-size: 12px;">Bu işlemi siz yapmadıysanız bu e-postayı göz ardı edebilirsiniz.</p>
                        </div>
                    </div>
                </body>
            </html>
            """;
            
        String mailBody = passwordResetEmailTemplate
            .replace("${url}", passwordResetUrl)
            .replace("${title}", title)
            .replace("${clickHere}", clickHere);
            
        try {
            message.setFrom(hoaxifyProperties.getEmail().getFrom());
            message.setTo(email); 
            message.setSubject(title); 
            message.setText(mailBody, true);
            
            System.out.println("Şifre sıfırlama e-postası gönderiliyor...");
            this.mailSender.send(mimeMessage);
            System.out.println("✅ Şifre sıfırlama e-postası başarıyla gönderildi: " + email);
            
        } catch (MessagingException e) {
            System.err.println("❌ Şifre sıfırlama e-postası gönderilirken hata oluştu:");
            System.err.println("Hata Mesajı: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Şifre sıfırlama e-postası gönderilemedi: " + e.getMessage(), e);
        }
    }
}
