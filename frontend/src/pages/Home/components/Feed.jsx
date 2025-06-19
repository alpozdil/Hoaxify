import { useCallback, useEffect, useState, useRef } from "react";
import { loadPosts } from "./api";
import { Spinner } from "@/shared/components/Spinner";
import { Post } from "./Post";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { postUpdateEvent } from "@/shared/components/CreatePostModal";

// Fonksiyonun her renderda yeniden oluşturulmasını engellemek için
const INITIAL_POST_STATE = {
  content: [],
  last: false,
  first: false,
  number: 0,
};

export function Feed() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [postPage, setPostPage] = useState(INITIAL_POST_STATE);
  const [apiProgress, setApiProgress] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Ref'ler
  const mountedRef = useRef(true);
  const activeRequestRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);

  // Gönderi yükleme fonksiyonu - basitleştirilmiş
  const getPosts = useCallback(async (page = 0, forceRefresh = false) => {
    // Zaten devam eden bir istek varsa çık
    if (activeRequestRef.current && !forceRefresh) {
      return;
    }
    
    activeRequestRef.current = true;
    setApiProgress(true);
    setError(null);
    
    try {
      const response = await loadPosts(page, 10);
      
      if (!mountedRef.current) {
        return;
      }
      
      if (response?.data) {
        setPostPage(response.data);
      } else {
        setPostPage(INITIAL_POST_STATE);
      }
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      
      console.error("Gönderiler yüklenirken hata:", error);
      setError("Gönderiler yüklenirken bir hata oluştu.");
    } finally {
      if (mountedRef.current) {
        activeRequestRef.current = false;
        setApiProgress(false);
        setRefreshing(false);
      }
    }
  }, []);

  // İlk yükleme
  useEffect(() => {
    mountedRef.current = true;
    getPosts(0, true);
    
    return () => {
      mountedRef.current = false;
    };
  }, [getPosts]);

  // Gönderi güncelleme etkinliğini dinle - basitleştirilmiş
  useEffect(() => {
    const handlePostUpdate = () => {
      const now = Date.now();
      // Son 2 saniye içinde başka bir yenileme yapıldıysa atla
      if (now - lastUpdateTimeRef.current < 2000) {
        return;
      }
      
      lastUpdateTimeRef.current = now;
      getPosts(0, true);
    };
    
    window.addEventListener('postUpdated', handlePostUpdate);
    
    return () => {
      window.removeEventListener('postUpdated', handlePostUpdate);
    };
  }, [getPosts]);

  // Manuel yenileme
  const handleRefresh = useCallback(() => {
    if (apiProgress || refreshing) return;
    
    setRefreshing(true);
    getPosts(0, true);
  }, [apiProgress, refreshing, getPosts]);

  // Yeniden deneme
  const handleRetry = () => {
    setError(null);
    getPosts(0, true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Ana Akış</h2>
            <button 
              onClick={handleRefresh}
              disabled={apiProgress || refreshing}
              className="btn btn-outline-primary btn-sm"
            >
              <i className="bi bi-arrow-clockwise mr-1"></i>
              Yenile
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {/* Yenileniyor durumu */}
          {refreshing && (
            <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
              <div className="flex items-center justify-center">
                <div className="spinner w-4 h-4 mr-2"></div>
                <span className="text-blue-600">Yenileniyor...</span>
              </div>
            </div>
          )}
          
          {/* Yükleniyor durumu */}
          {apiProgress && !refreshing && (
            <div className="text-center py-8">
              <Spinner />
              <p className="mt-4 text-gray-500">Gönderiler yükleniyor...</p>
            </div>
          )}
          
          {/* Hata durumu */}
          {error && !apiProgress && (
            <div className="alert alert-danger text-center">
              <i className="bi bi-exclamation-triangle-fill text-2xl mb-3 block"></i>
              <p className="mb-3">{error}</p>
              <button className="btn btn-danger" onClick={handleRetry}>
                <i className="bi bi-arrow-repeat mr-2"></i>
                Tekrar Dene
              </button>
            </div>
          )}
          
          {/* Gönderiler */}
          {!apiProgress && !error && postPage?.content?.length > 0 && (
            <div className="space-y-4">
              {postPage.content.map((post) => (
                <Post key={`post-${post.id}`} post={post} />
              ))}
            </div>
          )}
          
          {/* Boş durum */}
          {!apiProgress && !error && (!postPage?.content || postPage.content.length === 0) && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-chat-square-text text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz gönderi yok</h3>
              <p className="text-gray-500 mb-4">İlk gönderiyi paylaşın!</p>
              <button 
                onClick={() => document.dispatchEvent(new CustomEvent('createPost'))}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-lg mr-2"></i>
                Gönderi Oluştur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 