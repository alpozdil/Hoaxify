import http from "@/lib/http";

export function signUp(body){
    return http.post('/users', body);
}

export function resendActivationEmail(email) {
    return http.post('/users/resend-activation', { email });
}