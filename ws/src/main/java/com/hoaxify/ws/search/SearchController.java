package com.hoaxify.ws.search;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hoaxify.ws.configuration.CurrentUser;
import com.hoaxify.ws.post.Post;
import com.hoaxify.ws.post.PostService;
import com.hoaxify.ws.user.User;
import com.hoaxify.ws.user.UserService;
import com.hoaxify.ws.user.dto.UserDTO;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/search")
public class SearchController {

    @Autowired
    UserService userService;

    @Autowired
    PostService postService;

    @GetMapping("/users")
    public Page<UserDTO> searchUsers(
            @RequestParam(name = "q", defaultValue = "") String keyword,
            @PageableDefault(sort = "username", direction = Direction.ASC) Pageable pageable,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        Page<User> users = userService.searchUsers(keyword, pageable, currentUser);
        return users.map(UserDTO::new);
    }

    @GetMapping("/posts")
    public Page<Post> searchPosts(
            @RequestParam(name = "q", defaultValue = "") String keyword,
            @PageableDefault(sort = "createdAt", direction = Direction.DESC) Pageable pageable) {
        
        return postService.searchPosts(keyword, pageable);
    }

    @GetMapping("/all")
    public Map<String, Object> searchAll(
            @RequestParam(name = "q", defaultValue = "") String keyword,
            @PageableDefault(sort = "username", direction = Direction.ASC) Pageable userPageable,
            @AuthenticationPrincipal CurrentUser currentUser) {
        
        // Kullanıcılar için arama
        Page<User> users = userService.searchUsers(keyword, userPageable, currentUser);
        
        // Gönderiler için arama (ilk 5 sonuç)
        Pageable postPageable = PageRequest.of(0, 5, Direction.DESC, "createdAt");
        Page<Post> posts = postService.searchPosts(keyword, postPageable);
        
        Map<String, Object> result = new HashMap<>();
        result.put("users", users.map(UserDTO::new));
        result.put("posts", posts);
        result.put("keyword", keyword);
        
        return result;
    }
} 