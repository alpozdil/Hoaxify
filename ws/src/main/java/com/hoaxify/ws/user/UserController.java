package com.hoaxify.ws.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.hoaxify.ws.configuration.CurrentUser;
import com.hoaxify.ws.shared.GenericMessage;
import com.hoaxify.ws.shared.Messages;
import com.hoaxify.ws.user.dto.PasswordResetRequest;
import com.hoaxify.ws.user.dto.PasswordUpdate;
import com.hoaxify.ws.user.dto.UserCreate;
import com.hoaxify.ws.user.dto.UserDTO;
import com.hoaxify.ws.user.dto.UserUpdate;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.List;
import java.util.HashMap;

@RestController
public class UserController {

    @Autowired
    UserService userService;

    @PostMapping("/api/v1/users")
    GenericMessage createUser(@Valid @RequestBody UserCreate user){
        userService.save(user.toUser());
        String message = Messages.getMessageForLocale("hoaxify.create.user.success.message", LocaleContextHolder.getLocale());
        return new GenericMessage(message);
    }

    @PatchMapping("/api/v1/users/{token}/active")
    GenericMessage activateUser(@PathVariable String token){
        userService.activateUser(token);
        String message = Messages.getMessageForLocale("hoaxify.activate.user.success.message", LocaleContextHolder.getLocale());
        return new GenericMessage(message);
    }

    @GetMapping("/api/v1/users")
    Page<UserDTO> getUsers(Pageable page, @AuthenticationPrincipal CurrentUser currentUser){
        return userService.getUsers(page, currentUser).map(UserDTO::new);
    }

    @GetMapping("/api/v1/users/{id}")
    Map<String, Object> getUserById(@PathVariable long id, @AuthenticationPrincipal CurrentUser currentUser){
        User user = userService.getUser(id);
        UserDTO userDTO = new UserDTO(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("user", userDTO);
        response.put("followersCount", userService.getFollowersCount(id));
        response.put("followingCount", userService.getFollowingCount(id));
        
        if (currentUser != null && currentUser.getId() != id) {
            response.put("isFollowing", userService.isFollowing(currentUser.getId(), id));
        }
        
        return response;
    }

    @PutMapping("/api/v1/users/{id}")
    @PreAuthorize("#id == principal.id")
    UserDTO updateUser(@PathVariable long id, @Valid @RequestBody UserUpdate userUpdate){
        return new UserDTO(userService.updateUser(id, userUpdate));
    }

    @DeleteMapping("/api/v1/users/{id}")
    @PreAuthorize("#id == principal.id")
    GenericMessage deleteUser(@PathVariable long id){
        userService.deleteUser(id);
        String message = Messages.getMessageForLocale("hoaxify.user.delete.success", LocaleContextHolder.getLocale());
        return new GenericMessage(message);
    }

    @PostMapping("/api/v1/users/password-reset")
    GenericMessage passwordResetRequest(@Valid @RequestBody PasswordResetRequest passwordResetRequest) {
      userService.handleResetRequest(passwordResetRequest);
      return new GenericMessage("Check your email address to reset your password");
    }

    @PatchMapping("/api/v1/users/{token}/password")
    GenericMessage setPassword(@PathVariable String token, @Valid @RequestBody PasswordUpdate passwordUpdate){
        userService.updatePassword(token, passwordUpdate);
        return new GenericMessage("Password updated successfully");

    }
    
    @PostMapping("/api/v1/users/resend-activation")
    GenericMessage resendActivationEmail(@RequestBody Map<String, String> request){
        String email = request.get("email");
        userService.resendActivationEmail(email);
        String message = "Aktivasyon e-postası yeniden gönderildi. Lütfen e-posta kutunuzu kontrol edin.";
        return new GenericMessage(message);
    }

    // Takip API'leri

    @PostMapping("/api/v1/users/{id}/follow")
    @PreAuthorize("principal != null")
    GenericMessage followUser(@PathVariable long id, @AuthenticationPrincipal CurrentUser currentUser) {
        userService.followUser(currentUser.getId(), id);
        return new GenericMessage("Kullanıcı takip edildi");
    }

    @DeleteMapping("/api/v1/users/{id}/follow")
    @PreAuthorize("principal != null")
    GenericMessage unfollowUser(@PathVariable long id, @AuthenticationPrincipal CurrentUser currentUser) {
        userService.unfollowUser(currentUser.getId(), id);
        return new GenericMessage("Kullanıcı takipten çıkarıldı");
    }

    @GetMapping("/api/v1/users/{id}/followers")
    List<UserDTO> getFollowers(@PathVariable long id) {
        return userService.getFollowers(id).stream().map(UserDTO::new).toList();
    }

    @GetMapping("/api/v1/users/{id}/following")
    List<UserDTO> getFollowing(@PathVariable long id) {
        return userService.getFollowing(id).stream().map(UserDTO::new).toList();
    }

    @GetMapping("/api/v1/users/{id}/follow-status")
    Map<String, Object> getFollowStatus(@PathVariable long id, @AuthenticationPrincipal CurrentUser currentUser) {
        Map<String, Object> response = new HashMap<>();
        response.put("followersCount", userService.getFollowersCount(id));
        response.put("followingCount", userService.getFollowingCount(id));
        
        if (currentUser != null && currentUser.getId() != id) {
            response.put("isFollowing", userService.isFollowing(currentUser.getId(), id));
        }
        
        return response;
    }
}
