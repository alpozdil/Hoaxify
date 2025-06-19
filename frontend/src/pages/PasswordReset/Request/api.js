import http from "@/lib/http";

export function passwordResetRequest(body) {
  return http.post('/users/password-reset', body);
}