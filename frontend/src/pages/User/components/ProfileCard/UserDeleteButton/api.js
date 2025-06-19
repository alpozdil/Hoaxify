import http from "@/lib/http";

export function deleteUser(id){
    return http.delete(`/users/${id}`)
}