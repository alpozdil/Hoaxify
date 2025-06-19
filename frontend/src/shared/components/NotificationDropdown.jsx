import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { NOTIFICATION_TYPES } from '@/shared/api/notification';
import { Link } from 'react-router-dom';
import { ProfileImage } from '@/shared/components/ProfileImage';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
    const getNotificationIcon = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.LIKE:
                return 'bi-heart-fill text-red-500';
            case NOTIFICATION_TYPES.COMMENT:
                return 'bi-chat-dots-fill text-blue-500';
            case NOTIFICATION_TYPES.FOLLOW:
                return 'bi-person-plus-fill text-green-500';
            case NOTIFICATION_TYPES.MENTION:
                return 'bi-at text-purple-500';
            default:
                return 'bi-bell-fill text-gray-500';
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case NOTIFICATION_TYPES.LIKE:
                return `${notification.sourceUser.username} gönderinizi beğendi`;
            case NOTIFICATION_TYPES.COMMENT:
                return `${notification.sourceUser.username} gönderinize yorum yaptı`;
            case NOTIFICATION_TYPES.FOLLOW:
                return `${notification.sourceUser.username} sizi takip etmeye başladı`;
            case NOTIFICATION_TYPES.MENTION:
                return `${notification.sourceUser.username} sizi bir gönderide etiketledi`;
            default:
                return notification.message || 'Yeni bildirim';
        }
    };

    const getNotificationLink = (notification) => {
        switch (notification.type) {
            case NOTIFICATION_TYPES.LIKE:
            case NOTIFICATION_TYPES.COMMENT:
            case NOTIFICATION_TYPES.MENTION:
                return notification.postId ? `/posts/${notification.postId}` : null;
            case NOTIFICATION_TYPES.FOLLOW:
                return `/users/${notification.sourceUser.id}`;
            default:
                return null;
        }
    };

    const handleClick = () => {
        if (notification.status === 'UNREAD') {
            onMarkAsRead(notification.id);
        }
    };

    const link = getNotificationLink(notification);
    const content = (
        <div
            className={`flex items-start p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-l-4 ${
                notification.status === 'UNREAD' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'
            }`}
            onClick={handleClick}
        >
            <div className="flex-shrink-0 mr-3">
                <ProfileImage 
                    width={40}
                    image={notification.sourceUser.image}
                    className="border-2 border-white shadow-sm"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center mb-1">
                            <i className={`${getNotificationIcon(notification.type)} mr-2 text-sm`}></i>
                            <span className={`text-sm ${notification.status === 'UNREAD' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {getNotificationText(notification)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                        </div>
                        {notification.content && (
                            <div className="mt-1 text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                                {notification.content.length > 50 
                                    ? `${notification.content.substring(0, 50)}...`
                                    : notification.content
                                }
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                            title="Bildirimi sil"
                        >
                            <i className="bi bi-x-lg text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return link ? (
        <Link to={link} className="block">
            {content}
        </Link>
    ) : content;
};

export const NotificationDropdown = ({ isOpen, onClose }) => {
    const { 
        notifications, 
        unreadCount, 
        loading, 
        loadNotifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        deleteAllNotifications 
    } = useNotifications();
    
    const dropdownRef = useRef(null);

    // Dropdown dışında tıklamayı handle et
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            ref={dropdownRef}
            className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-scale-in max-h-96 overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Bildirimler</h3>
                    {unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="flex items-center justify-between mt-2 text-sm">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Tümünü okundu işaretle
                            </button>
                        )}
                        <button
                            onClick={deleteAllNotifications}
                            className="text-red-600 hover:text-red-800 font-medium ml-auto"
                        >
                            Tümünü sil
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="spinner"></div>
                        <span className="ml-2 text-gray-600">Yükleniyor...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-8 px-4">
                        <i className="bi bi-bell text-4xl text-gray-300 mb-2"></i>
                        <p className="text-gray-500">Henüz bildirim yok</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Gönderilerinize yapılan etkileşimler burada görünecek
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <Link
                        to="/notifications"
                        className="block text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                        onClick={onClose}
                    >
                        Tüm bildirimleri görüntüle
                    </Link>
                </div>
            )}
        </div>
    );
}; 