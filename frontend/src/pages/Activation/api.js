import http from "@/lib/http";

export function activateUser(token){
    return http.patch(`/users/${token}/active`)
}