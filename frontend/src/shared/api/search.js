import http from "@/lib/http";

export const searchUsers = (keyword, page = 0, size = 10) => {
  return http.get(`/search/users`, {
    params: { q: keyword, page, size }
  });
};

export const searchPosts = (keyword, page = 0, size = 10) => {
  return http.get(`/search/posts`, {
    params: { q: keyword, page, size }
  });
};

export const searchAll = (keyword, page = 0, size = 10) => {
  return http.get(`/search/all`, {
    params: { q: keyword, page, size }
  });
}; 