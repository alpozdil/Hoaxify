package com.hoaxify.ws.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    
    User findByEmail(String email);

    User findByActivationToken(String token);

    User findByPasswordResetToken(String token);

    Page<User> findByIdNot(long id, Pageable page);

    // Arama sorguları - sadece aktif kullanıcılar
    @Query("SELECT u FROM User u WHERE u.active = true AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
        @Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.active = true AND " +
           "u.id != :currentUserId AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchUsersExcludingCurrent(
        @Param("keyword") String keyword, 
        @Param("currentUserId") long currentUserId, 
        Pageable pageable);
}
