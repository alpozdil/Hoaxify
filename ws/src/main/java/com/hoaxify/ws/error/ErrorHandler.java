package com.hoaxify.ws.error;

import java.util.stream.Collectors;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.hoaxify.ws.auth.exception.AuthenticationException;
import com.hoaxify.ws.shared.Messages;
import com.hoaxify.ws.user.exception.ActivationNotificationException;
import com.hoaxify.ws.user.exception.InvalidTokenException;
import com.hoaxify.ws.user.exception.NotFoundException;
import com.hoaxify.ws.user.exception.NotUniqueEmailException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class ErrorHandler {

    @ExceptionHandler({
        MethodArgumentNotValidException.class,
        NotUniqueEmailException.class,
        ActivationNotificationException.class,
        InvalidTokenException.class,
        NotFoundException.class,
        AuthenticationException.class,
        RuntimeException.class,  // Genel runtime exception
        Exception.class          // Tüm diğer exception'lar
    })
    ResponseEntity<ApiError> handleException(Exception exception, HttpServletRequest request){
        ApiError apiError = new ApiError();
        apiError.setPath(request.getRequestURI());
        apiError.setMessage(exception.getMessage());
        
        System.err.println("=== ERROR HANDLER ===");
        System.err.println("Exception type: " + exception.getClass().getSimpleName());
        System.err.println("Exception message: " + exception.getMessage());
        System.err.println("Request URI: " + request.getRequestURI());
        exception.printStackTrace();
        System.err.println("=== ERROR HANDLER END ===");
        
        if(exception instanceof MethodArgumentNotValidException) {
            String message = Messages.getMessageForLocale("hoaxify.error.validation", LocaleContextHolder.getLocale());
            apiError.setMessage(message);
            apiError.setStatus(400);
            var validationErrors = ((MethodArgumentNotValidException)exception).getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (existing, replacing) -> existing));
            apiError.setValidationErrors(validationErrors);
        } else if (exception instanceof NotUniqueEmailException) {
            apiError.setStatus(400);
            apiError.setValidationErrors(((NotUniqueEmailException)exception).getValidationErrors());
        } else if (exception instanceof ActivationNotificationException) {
            apiError.setStatus(502);
        } else if (exception instanceof InvalidTokenException) {
            apiError.setStatus(400);
        } else if (exception instanceof NotFoundException) {
            apiError.setStatus(404);
        } else if (exception instanceof AuthenticationException) {
            apiError.setStatus(401);
        } else if (exception instanceof RuntimeException) {
            // Runtime exception'lar için 500 döndür
            apiError.setStatus(500);
            apiError.setMessage("Sunucu hatası: " + exception.getMessage());
        } else {
            // Diğer tüm exception'lar için 500 döndür
            apiError.setStatus(500);
            apiError.setMessage("Beklenmeyen sunucu hatası: " + exception.getMessage());
        }

        return ResponseEntity.status(apiError.getStatus()).body(apiError);
    }
    
}
