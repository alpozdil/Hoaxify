package com.hoaxify.ws.user.validation;

import org.springframework.beans.factory.annotation.Autowired;

import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserRepository;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {

    @Autowired
    UserRepository userRepository;

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        User inDB = userRepository.findByEmail(value);
        // E-posta yoksa veya inactive kullanıcıya aitse kayıt olabilir
        return inDB == null || !inDB.isActive();
    }
    
}
