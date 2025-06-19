import http from '@/lib/http';

// Ana API fonksiyonları - artık backend hazır
export const getNotifications = async (page = 0, size = 20) => {
    return await http.get(`/notifications?page=${page}&size=${size}`);
};

export const getUnreadNotifications = async () => {
    return await http.get('/notifications/unread');
};

export const getUnreadNotificationCount = async () => {
    return await http.get('/notifications/unread/count');
};

export const markNotificationAsRead = async (notificationId) => {
    return await http.patch(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async () => {
    return await http.patch('/notifications/mark-all-read');
};

export const deleteNotification = async (notificationId) => {
    return await http.delete(`/notifications/${notificationId}`);
};

export const deleteAllNotifications = async () => {
    return await http.delete('/notifications/all');
};

// Bildirim türleri
export const NOTIFICATION_TYPES = {
    LIKE: 'LIKE',
    COMMENT: 'COMMENT',
    FOLLOW: 'FOLLOW',
    MENTION: 'MENTION'
};

// Bildirim durumları
export const NOTIFICATION_STATUS = {
    UNREAD: 'UNREAD',
    read: 'read'
}; 