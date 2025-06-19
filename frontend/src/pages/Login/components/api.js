import http from "@/lib/http";

export function login(body) {
  return http.post("/auth", body);
} 