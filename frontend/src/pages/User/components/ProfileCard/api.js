import http from "@/lib/http";

export function updateUser(id, body){
    console.log('=== API CALL: updateUser ===');
    console.log('User ID:', id);
    console.log('Request body keys:', Object.keys(body));
    console.log('Bio value:', body.bio);
    console.log('Image present:', !!body.image);
    console.log('Banner present:', !!body.banner);
    
    return http.put(`/users/${id}`, body);
}