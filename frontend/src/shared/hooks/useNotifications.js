import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import * as notificationService from '@/shared/api/notification';
import { useToastContext } from '@/App';
import { useAuthState } from '@/shared/state/context';

// Notification Context
const NotificationContext = createContext();

// Bildirim state'i için reducer
const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'LOADING_START':
            return { ...state, loading: true, error: null };
        
        case 'LOADING_END':
            return { ...state, loading: false };
        
        case 'SET_NOTIFICATIONS':
            return {
                ...state,
                notifications: action.payload.content || action.payload,
                totalPages: action.payload.totalPages || 0,
                totalElements: action.payload.totalElements || 0,
                currentPage: action.payload.number || 0,
                loading: false,
                error: null
            };
        
        case 'SET_UNREAD_COUNT':
            return { ...state, unreadCount: action.payload };
        
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [action.payload, ...state.notifications],
                unreadCount: state.unreadCount + 1
            };
        
        case 'MARK_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(notification =>
                    notification.id === action.payload
                        ? { ...notification, status: 'read' }
                        : notification
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            };
        
        case 'MARK_ALL_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(notification => ({
                    ...notification,
                    status: 'read'
                })),
                unreadCount: 0
            };
        
        case 'DELETE_NOTIFICATION':
            const deletedNotification = state.notifications.find(n => n.id === action.payload);
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
                unreadCount: deletedNotification?.status === 'UNREAD' 
                    ? Math.max(0, state.unreadCount - 1) 
                    : state.unreadCount
            };
        
        case 'DELETE_ALL_NOTIFICATIONS':
            return {
                ...state,
                notifications: [],
                unreadCount: 0
            };
        
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        
        default:
            return state;
    }
};

// Initial state
const initialState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    totalPages: 0,
    totalElements: 0,
    currentPage: 0
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);
    const { showSuccess, showError } = useToastContext();
    const authState = useAuthState();

    // Bildirimleri yükle
    const loadNotifications = useCallback(async (page = 0, size = 20) => {
        // Giriş yapmamış kullanıcılar için API çağrısı yapma
        if (!authState.isLoggedIn) {
            return;
        }

        try {
            dispatch({ type: 'LOADING_START' });
            const response = await notificationService.getNotifications(page, size);
            dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
        } catch (error) {
            console.error('Bildirimler yüklenirken hata:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Bildirimler yüklenemedi' });
            // Sadece authentication hataları değilse toast göster
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                showError('Bildirimler yüklenirken bir hata oluştu');
            }
        }
    }, [authState.isLoggedIn, showError]);

    // Okunmamış bildirim sayısını yükle
    const loadUnreadCount = useCallback(async () => {
        // Giriş yapmamış kullanıcılar için API çağrısı yapma
        if (!authState.isLoggedIn) {
            dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
            return;
        }

        try {
            const response = await notificationService.getUnreadNotificationCount();
            dispatch({ type: 'SET_UNREAD_COUNT', payload: response.data });
        } catch (error) {
            console.error('Okunmamış bildirim sayısı yüklenirken hata:', error);
            // Authentication hatası değilse, unread count'u 0 yap
            if (error.response?.status === 401 || error.response?.status === 403) {
                dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
            }
        }
    }, [authState.isLoggedIn]);

    // Bildirimi okundu olarak işaretle
    const markAsRead = useCallback(async (notificationId) => {
        if (!authState.isLoggedIn) {
            return;
        }

        try {
            await notificationService.markNotificationAsRead(notificationId);
            dispatch({ type: 'MARK_AS_READ', payload: notificationId });
        } catch (error) {
            console.error('Bildirim okundu olarak işaretlenirken hata:', error);
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                showError('Bildirim güncellenemedi');
            }
        }
    }, [authState.isLoggedIn, showError]);

    // Tüm bildirimleri okundu olarak işaretle
    const markAllAsRead = useCallback(async () => {
        if (!authState.isLoggedIn) {
            return;
        }

        try {
            await notificationService.markAllNotificationsAsRead();
            dispatch({ type: 'MARK_ALL_AS_READ' });
            showSuccess('Tüm bildirimler okundu olarak işaretlendi');
        } catch (error) {
            console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                showError('Bildirimler güncellenemedi');
            }
        }
    }, [authState.isLoggedIn, showSuccess, showError]);

    // Bildirimi sil
    const deleteNotification = useCallback(async (notificationId) => {
        if (!authState.isLoggedIn) {
            return;
        }

        try {
            await notificationService.deleteNotification(notificationId);
            dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
            showSuccess('Bildirim silindi');
        } catch (error) {
            console.error('Bildirim silinirken hata:', error);
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                showError('Bildirim silinemedi');
            }
        }
    }, [authState.isLoggedIn, showSuccess, showError]);

    // Tüm bildirimleri sil
    const deleteAllNotifications = useCallback(async () => {
        if (!authState.isLoggedIn) {
            return;
        }

        try {
            await notificationService.deleteAllNotifications();
            dispatch({ type: 'DELETE_ALL_NOTIFICATIONS' });
            showSuccess('Tüm bildirimler silindi');
        } catch (error) {
            console.error('Tüm bildirimler silinirken hata:', error);
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                showError('Bildirimler silinemedi');
            }
        }
    }, [authState.isLoggedIn, showSuccess, showError]);

    // Sadece giriş yapmış kullanıcılar için sayfa yüklendiğinde bildirimleri getir
    useEffect(() => {
        if (authState.isLoggedIn) {
            loadNotifications();
            loadUnreadCount();
        } else {
            // Kullanıcı çıkış yaptığında bildirimleri temizle
            dispatch({ type: 'SET_NOTIFICATIONS', payload: { content: [], totalPages: 0, totalElements: 0, number: 0 } });
            dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
        }
    }, [authState.isLoggedIn, loadNotifications, loadUnreadCount]);

    // Sadece giriş yapmış kullanıcılar için her 30 saniyede bir okunmamış bildirim sayısını güncelle
    useEffect(() => {
        if (!authState.isLoggedIn) {
            return;
        }

        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [authState.isLoggedIn, loadUnreadCount]);

    const value = {
        ...state,
        loadNotifications,
        loadUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}; 