import { useState, useEffect, useCallback } from 'react';
import { getUnreadMessageCount } from '@/shared/api/message';
import { useAuthState } from '@/shared/state/context';

export const useMessageNotifications = () => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const authState = useAuthState();

  // Okunmamış mesaj sayısını yükle
  const loadUnreadMessageCount = useCallback(async () => {
    if (!authState.isLoggedIn) {
      setUnreadMessageCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await getUnreadMessageCount();
      setUnreadMessageCount(response.data || 0);
    } catch (error) {
      console.error('Okunmamış mesaj sayısı yüklenirken hata:', error);
      // Authentication hatası değilse, count'u 0 yap
      if (error.response?.status === 401 || error.response?.status === 403) {
        setUnreadMessageCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [authState.isLoggedIn]);

  // Sayıyı güncelle (WebSocket için)
  const updateUnreadCount = useCallback((count) => {
    setUnreadMessageCount(count);
  }, []);

  // Sayıyı arttır (yeni mesaj geldiğinde)
  const incrementUnreadCount = useCallback(() => {
    setUnreadMessageCount(prev => prev + 1);
  }, []);

  // Sayıyı azalt (mesaj okunduğunda)
  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadMessageCount(prev => Math.max(0, prev - amount));
  }, []);

  // Sayıyı sıfırla
  const resetUnreadCount = useCallback(() => {
    setUnreadMessageCount(0);
  }, []);

  // Sayfa yüklendiğinde ve kullanıcı durumu değiştiğinde
  useEffect(() => {
    if (authState.isLoggedIn) {
      loadUnreadMessageCount();
    } else {
      setUnreadMessageCount(0);
    }
  }, [authState.isLoggedIn, loadUnreadMessageCount]);

  // Her 10 saniyede bir güncelle (daha sık)
  useEffect(() => {
    if (!authState.isLoggedIn) {
      return;
    }

    const interval = setInterval(loadUnreadMessageCount, 10000);
    return () => clearInterval(interval);
  }, [authState.isLoggedIn, loadUnreadMessageCount]);

  return {
    unreadMessageCount,
    loading,
    loadUnreadMessageCount,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    resetUnreadCount
  };
}; 