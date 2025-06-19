import http from "@/lib/http";

export function resetPassword(token, body) {
  return http.patch(`/users/${token}/password`, body);
}