package com.hoaxify.ws.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserFollowingRepository extends JpaRepository<UserFollowing, Long> {

    Optional<UserFollowing> findByFollowerAndFollowing(User follower, User following);

    @Query("SELECT uf.following FROM UserFollowing uf WHERE uf.follower = :follower")
    List<User> findFollowingByFollower(@Param("follower") User follower);

    @Query("SELECT uf.follower FROM UserFollowing uf WHERE uf.following = :following")
    List<User> findFollowersByFollowing(@Param("following") User following);

    @Query("SELECT COUNT(uf) FROM UserFollowing uf WHERE uf.follower = :follower")
    Long countFollowingByFollower(@Param("follower") User follower);

    @Query("SELECT COUNT(uf) FROM UserFollowing uf WHERE uf.following = :following")
    Long countFollowersByFollowing(@Param("following") User following);

    boolean existsByFollowerAndFollowing(User follower, User following);

    void deleteByFollowerAndFollowing(User follower, User following);
    
    void deleteByFollowerOrFollowing(User follower, User following);
} 