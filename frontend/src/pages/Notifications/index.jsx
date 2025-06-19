import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { NOTIFICATION_TYPES } from '@/shared/api/notification';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
            className={`flex items-start p-6 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-l-4 ${
                notification.status === 'UNREAD' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'
            }`}
            onClick={handleClick}
        >
            <div className="flex-shrink-0 mr-4">
                <ProfileImage 
                    width={48}
                    image={notification.sourceUser.image}
                    className="border-2 border-white shadow-sm"
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <i className={`${getNotificationIcon(notification.type)} mr-3 text-lg`}></i>
                            <span className={`text-base ${notification.status === 'UNREAD' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {getNotificationText(notification)}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                        </div>
                        {notification.content && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                                {notification.content}
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                            title="Bildirimi sil"
                        >
                            <i className="bi bi-x-lg text-lg"></i>
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

export default function Notifications() {
    const { t } = useTranslation();
    const { 
        notifications, 
        unreadCount, 
        loading, 
        totalPages,
        currentPage,
        loadNotifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification,
        deleteAllNotifications 
    } = useNotifications();
    
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

    // Sayfa yüklendiğinde bildirimleri yenile
    useEffect(() => {
        loadNotifications(0, 50); // İlk sayfa için daha fazla bildirim yükle
    }, []);

    const filteredNotifications = notifications.filter(notification => {
        switch (filter) {
            case 'unread':
                return notification.status === 'UNREAD';
            case 'read':
                return notification.status === 'read';
            default:
                return true;
        }
    });

    const handleLoadMore = () => {
        if (currentPage < totalPages - 1) {
            loadNotifications(currentPage + 1, 50);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-4 sm:mb-0">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                <i className="bi bi-bell mr-3"></i>
                                Bildirimler
                            </h1>
                            <p className="text-gray-600">
                                {unreadCount > 0 
                                    ? `${unreadCount} okunmamış bildirim`
                                    : 'Tüm bildirimler okundu'
                                }
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="btn btn-outline-primary"
                                >
                                    <i className="bi bi-check-all mr-2"></i>
                                    Tümünü okundu işaretle
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={deleteAllNotifications}
                                    className="btn btn-danger"
                                >
                                    <i className="bi bi-trash mr-2"></i>
                                    Tümünü sil
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-gray-200 mt-6">
                        <button
                            className={`nav-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tümü ({notifications.length})
                        </button>
                        <button
                            className={`nav-tab ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Okunmamış ({notifications.filter(n => n.status === 'UNREAD').length})
                        </button>
                        <button
                            className={`nav-tab ${filter === 'read' ? 'active' : ''}`}
                            onClick={() => setFilter('read')}
                        >
                            Okunmuş ({notifications.filter(n => n.status === 'read').length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {loading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="spinner mr-3"></div>
                            <span className="text-gray-600">Bildirimler yükleniyor...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <i className="bi bi-bell text-6xl text-gray-300 mb-4"></i>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {filter === 'unread' ? 'Okunmamış bildirim yok' : 
                                 filter === 'read' ? 'Okunmuş bildirim yok' : 
                                 'Henüz bildirim yok'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {filter === 'all' 
                                    ? 'Gönderilerinize yapılan etkileşimler burada görünecek'
                                    : 'Bu kategoride henüz bildirim bulunmuyor'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100">
                                {filteredNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                        onDelete={deleteNotification}
                                    />
                                ))}
                            </div>

                            {/* Load More Button */}
                            {currentPage < totalPages - 1 && (
                                <div className="p-6 border-t border-gray-100 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="btn btn-outline-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="spinner mr-2"></div>
                                                Yükleniyor...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-arrow-down-circle mr-2"></i>
                                                Daha fazla bildirim yükle
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
} 