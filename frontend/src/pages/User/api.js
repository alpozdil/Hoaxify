import http from "@/lib/http";

export const getUser = (id) => {
  return http.get(`/users/${id}`);
};

export const getUserPosts = (userId, page = 0, size = 10) => {
  return http.get(`/users/${userId}/posts`, {
    params: { page, size }
  });
};

export const followUser = (id) => {
  return http.post(`/users/${id}/follow`);
};

export const unfollowUser = (id) => {
  return http.delete(`/users/${id}/follow`);
};

export const getFollowers = (id) => {
  return http.get(`/users/${id}/followers`);
};

export const getFollowing = (id) => {
  return http.get(`/users/${id}/following`);
};

export const getFollowStatus = (id) => {
  return http.get(`/users/${id}/follow-status`);
};

export const getUserLikedPosts = (userId, page = 0, size = 10) => {
  return http.get(`/users/${userId}/liked-posts`, {
    params: { page, size }
  });
};

export const getUserMediaPosts = (userId, page = 0, size = 10) => {
  return http.get(`/users/${userId}/media-posts`, {
    params: { page, size }
  });
};
