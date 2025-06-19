import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuthState } from "@/shared/state/context";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { Button } from "@/shared/components/Button";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { followUser, unfollowUser, getUserLikedPosts, getUserMediaPosts } from "../api";
import { startConversation } from "@/shared/api/message";
import { UserEditForm } from "./ProfileCard/UserEditForm";
import { UserDeleteButton } from "./ProfileCard/UserDeleteButton";
import { useToastContext } from "@/App";
import { CommentSection } from "@/pages/Home/components/CommentSection";
import { getAttachmentUrl, getProfileImageUrl } from "@/utils/urlHelper";

export function UserProfile({ user, userResponse, posts, postsLoading, postsError, onPostsRefresh, onUserRefresh }) {
  const authState = useAuthState();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToastContext();
  const [activeTab, setActiveTab] = useState('posts');
  const [editMode, setEditMode] = useState(false);
  const [tempImage, setTempImage] = useState();
  const [tempBanner, setTempBanner] = useState();
  const [followingState, setFollowingState] = useState({
    isFollowing: false,
    followersCount: 0,
    followingCount: 0,
    loading: false
  });

  // Beğeniler için state
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [likedPostsError, setLikedPostsError] = useState(null);

  // Medya gönderileri için state
  const [mediaPosts, setMediaPosts] = useState([]);
  const [mediaPostsLoading, setMediaPostsLoading] = useState(false);
  const [mediaPostsError, setMediaPostsError] = useState(null);

  const isLoggedInUser = authState.id === user.id;
  const canFollow = authState.id && authState.id !== user.id;

  // Backend'den gelen takip verilerini kullan
  useEffect(() => {
    if (userResponse) {
      console.log("UserResponse:", userResponse);
      setFollowingState(prev => ({
        ...prev,
        isFollowing: userResponse.isFollowing || false,
        followersCount: userResponse.followersCount || 0,
        followingCount: userResponse.followingCount || 0
      }));
    }
  }, [userResponse]);

  const handleFollowToggle = async () => {
    if (followingState.loading) return;

    setFollowingState(prev => ({ ...prev, loading: true }));
    
    try {
      if (followingState.isFollowing) {
        await unfollowUser(user.id);
        setFollowingState(prev => ({
          ...prev,
          isFollowing: false,
          followersCount: prev.followersCount - 1
        }));
        showSuccess(`${user.username} kullanıcısını takipten çıktınız`);
      } else {
        await followUser(user.id);
        setFollowingState(prev => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1
        }));
        showSuccess(`${user.username} kullanıcısını takip etmeye başladınız`);
      }
    } catch (error) {
      console.error("Takip işlemi başarısız:", error);
      showError("Takip işlemi başarısız oldu");
    } finally {
      setFollowingState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendMessage = async () => {
    try {
      const response = await startConversation(user.id);
      const conversationId = response.data.conversationId;
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      showError("Mesaj gönderilemedi");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Beğenilen gönderileri yükle
  const loadLikedPosts = async () => {
    setLikedPostsLoading(true);
    setLikedPostsError(null);
    
    try {
      const response = await getUserLikedPosts(user.id);
      setLikedPosts(response.data.content || []);
    } catch (error) {
      setLikedPostsError("Beğenilen gönderiler yüklenirken hata oluştu");
      console.error("Beğenilen gönderiler yüklenirken hata:", error);
    } finally {
      setLikedPostsLoading(false);
    }
  };

  // Medya gönderilerini yükle
  const loadMediaPosts = async () => {
    setMediaPostsLoading(true);
    setMediaPostsError(null);
    
    try {
      const response = await getUserMediaPosts(user.id);
      setMediaPosts(response.data.content || []);
    } catch (error) {
      setMediaPostsError("Medya gönderileri yüklenirken hata oluştu");
      console.error("Medya gönderileri yüklenirken hata:", error);
    } finally {
      setMediaPostsLoading(false);
    }
  };

  // Tab değiştirme fonksiyonu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'likes') {
      loadLikedPosts();
    } else if (tab === 'media') {
      loadMediaPosts();
    }
  };

  const getBannerImage = () => {
    if (tempBanner) return tempBanner;
    if (user.banner) return getProfileImageUrl(user.banner);
    return null;
  };

  const bannerImage = getBannerImage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header - Cover Photo */}
      <div className="relative">
        {bannerImage ? (
          <div
            className="h-64 md:h-80 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${bannerImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
          </div>
        )}
        
        {/* Action Buttons - Modern floating style */}
        <div className="absolute top-6 right-6 z-20">
          {isLoggedInUser && !editMode && (
            <div className="flex gap-3">
              <button 
                onClick={() => setEditMode(true)}
                className="glass-button group"
              >
                <i className="bi bi-pencil-square text-white group-hover:scale-110 transition-transform"></i>
                <span className="text-white font-medium">Düzenle</span>
              </button>
              <UserDeleteButton />
            </div>
          )}
          
          {canFollow && !editMode && (
            <div className="flex gap-3">
              <button 
                onClick={handleSendMessage}
                className="glass-button group"
              >
                <i className="bi bi-chat-dots text-white group-hover:scale-110 transition-transform"></i>
                <span className="text-white font-medium">Mesaj</span>
              </button>
              <button 
                onClick={handleFollowToggle}
                disabled={followingState.loading}
                className={`glass-button group ${
                  followingState.isFollowing 
                    ? 'bg-red-500/20 border-red-400/30' 
                    : 'bg-blue-500/20 border-blue-400/30'
                }`}
              >
                {followingState.loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <i className={`bi ${followingState.isFollowing ? 'bi-person-dash' : 'bi-person-plus'} text-white group-hover:scale-110 transition-transform`}></i>
                )}
                <span className="text-white font-medium">
                  {followingState.loading 
                    ? "Yükleniyor..." 
                    : followingState.isFollowing ? "Takipten Çık" : "Takip Et"
                  }
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Card - Modern floating design */}
      <div className="relative -mt-24 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="modern-card p-6 md:p-8">
            {!editMode ? (
              <>
                {/* Profile Image and Basic Info */}
                <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
                      <ProfileImage width={160} height={160} tempImage={tempImage} image={user.image} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{user.username}</h1>
                      <p className="text-lg text-gray-500 mb-3">@{user.username.toLowerCase()}</p>
                      
                      {user.bio ? (
                        <p className="text-gray-700 leading-relaxed max-w-2xl">{user.bio}</p>
                      ) : (
                        <p className="text-gray-500 italic flex items-center">
                          <i className="bi bi-chat-quote mr-2"></i>
                          Bu kullanıcı henüz bir biyografi eklemiş
                        </p>
                      )}
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center text-gray-500 mb-6">
                      <i className="bi bi-calendar3 mr-2"></i>
                      <span>Katılım tarihi {formatDate(user.createdAt || new Date())}</span>
                    </div>

                    {/* Stats - Modern cards */}
                    <div className="flex flex-wrap gap-4">
                      <Link 
                        to={`/users/${user.id}/following`}
                        className="stat-card group"
                      >
                        <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {followingState.followingCount}
                        </div>
                        <div className="text-sm text-gray-500">Takip Edilen</div>
                      </Link>
                      
                      <Link 
                        to={`/users/${user.id}/followers`}
                        className="stat-card group"
                      >
                        <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {followingState.followersCount}
                        </div>
                        <div className="text-sm text-gray-500">Takipçi</div>
                      </Link>
                      
                      <div className="stat-card">
                        <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                        <div className="text-sm text-gray-500">Gönderi</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="pt-20">
                <UserEditForm 
                  setEditMode={setEditMode} 
                  setTempImage={setTempImage}
                  setTempBanner={setTempBanner}
                  tempImage={tempImage}
                  tempBanner={tempBanner}
                  onUserRefresh={onUserRefresh}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Modern design */}
      {!editMode && (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button 
                className={`nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => handleTabChange('posts')}
              >
                <i className="bi bi-grid-3x3 mr-2"></i>
                Gönderiler
              </button>
              <button 
                className={`nav-tab ${activeTab === 'media' ? 'active' : ''}`}
                onClick={() => handleTabChange('media')}
              >
                <i className="bi bi-images mr-2"></i>
                Medya
              </button>
              <button 
                className={`nav-tab ${activeTab === 'likes' ? 'active' : ''}`}
                onClick={() => handleTabChange('likes')}
              >
                <i className="bi bi-heart mr-2"></i>
                Beğeniler
              </button>
              {isLoggedInUser && (
                <button 
                  className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  <i className="bi bi-gear mr-2"></i>
                  Ayarlar
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Content Area - Modern design */}
      {!editMode && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'posts' && (
            <div>
              {postsLoading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Gönderiler yükleniyor...</p>
                </div>
              )}
              
              {postsError && (
                <div className="error-card">
                  <i className="bi bi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                  <p className="text-red-700 font-medium">{postsError}</p>
                </div>
              )}
              
              {!postsLoading && !postsError && posts.length === 0 && (
                <div className="empty-state">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                    <i className="bi bi-chat-square-text text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz gönderi yok</h3>
                  <p className="text-gray-500">
                    {isLoggedInUser ? "İlk gönderinizi paylaşın!" : `${user.username} henüz hiç gönderi paylaşmamış.`}
                  </p>
                </div>
              )}
              
              {!postsLoading && !postsError && posts.length > 0 && (
                <div className="space-y-6">
                  {posts.map(post => (
                    <ModernPost key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'media' && (
            <div>
              {mediaPostsLoading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Medya gönderileri yükleniyor...</p>
                </div>
              )}
              
              {mediaPostsError && (
                <div className="error-card">
                  <i className="bi bi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                  <p className="text-red-700 font-medium">{mediaPostsError}</p>
                </div>
              )}
              
              {!mediaPostsLoading && !mediaPostsError && mediaPosts.length === 0 && (
                <div className="empty-state">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center mb-6">
                    <i className="bi bi-images text-4xl text-purple-500"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Medya bulunamadı</h3>
                  <p className="text-gray-500">
                    {isLoggedInUser ? "Henüz resim veya video paylaşmadınız." : `${user.username} henüz resim veya video paylaşmamış.`}
                  </p>
                </div>
              )}
              
              {!mediaPostsLoading && !mediaPostsError && mediaPosts.length > 0 && (
                <div className="space-y-6">
                  {mediaPosts.map(post => (
                    <ModernPost key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'likes' && (
            <div>
              {likedPostsLoading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-4">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Beğenilen gönderiler yükleniyor...</p>
                </div>
              )}
              
              {likedPostsError && (
                <div className="error-card">
                  <i className="bi bi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                  <p className="text-red-700 font-medium">{likedPostsError}</p>
                </div>
              )}
              
              {!likedPostsLoading && !likedPostsError && likedPosts.length === 0 && (
                <div className="empty-state">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center mb-6">
                    <i className="bi bi-heart text-4xl text-red-500"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Beğenilen gönderi yok</h3>
                  <p className="text-gray-500">
                    {isLoggedInUser ? "Henüz hiç gönderi beğenmediniz." : `${user.username} henüz hiç gönderi beğenmemiş.`}
                  </p>
                </div>
              )}
              
              {!likedPostsLoading && !likedPostsError && likedPosts.length > 0 && (
                <div className="space-y-6">
                  {likedPosts.map(post => (
                    <ModernPost key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && isLoggedInUser && (
            <div className="max-w-2xl">
              <div className="modern-card p-6">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <i className="bi bi-gear text-white text-xl"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Hesap Ayarları</h2>
                    <p className="text-gray-500">Profil ve hesap bilgilerinizi yönetin</p>
                  </div>
                </div>
                
                {/* Profil Düzenleme */}
                <div className="setting-item">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <i className="bi bi-person-gear text-blue-600"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Profil Bilgileri</h4>
                      <p className="text-gray-500 text-sm mb-3">
                        Kullanıcı adınızı, banner, profil resminizi ve biyografinizi güncelleyin
                      </p>
                      <button 
                        onClick={() => setEditMode(true)}
                        className="action-button"
                      >
                        <i className="bi bi-pencil mr-2"></i>
                        Profili Düzenle
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Tehlikeli Bölge */}
                <div className="danger-zone">
                  <div className="flex items-center mb-4">
                    <i className="bi bi-exclamation-triangle text-red-500 text-xl mr-3"></i>
                    <h4 className="font-semibold text-red-700">Tehlikeli Bölge</h4>
                  </div>
                  <p className="text-red-600 text-sm mb-4">
                    Aşağıdaki işlemler geri alınamaz. Lütfen dikkatli olun.
                  </p>
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <h5 className="font-medium text-red-800">Hesabı Kapat</h5>
                      <p className="text-red-600 text-sm">
                        Hesabınızı kalıcı olarak sil - tüm verileriniz silinecek
                      </p>
                    </div>
                    <UserDeleteButton />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Modern Post Component
function ModernPost({ post }) {
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  
  // Post'un liked durumu değiştiğinde state'i güncelle
  useEffect(() => {
    setLiked(post.liked || false);
    setLikeCount(post.likeCount || 0);
  }, [post.liked, post.likeCount]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}d`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}sa`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}g`;
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const toggleComments = () => {
    setCommentsExpanded(!commentsExpanded);
  };

  return (
    <div className="modern-card p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          <Link to={`/users/${post.user.id}`} className="block">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-blue-200 transition-all">
              <ProfileImage width={48} height={48} image={post.user.image} />
            </div>
          </Link>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              to={`/users/${post.user.id}`} 
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {post.user.username}
            </Link>
            <span className="text-gray-500">@{post.user.username.toLowerCase()}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">{formatDate(post.createdAt || post.timestamp)}</span>
          </div>
          
          {/* Post Content */}
          <div className="mb-4">
            <p className="text-gray-800 leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Medya İçeriği - Video ve Resim Desteği */}
          {post.fileAttachments && post.fileAttachments.length > 0 && (
            <div className="mb-4 space-y-3">
              {post.fileAttachments.map((attachment, index) => {
                console.log(`Processing attachment ${index}:`, attachment);
                
                return (
                  <div key={index} className="rounded-xl overflow-hidden">
                    {(attachment.fileType && attachment.fileType.startsWith('image/')) || 
                     attachment.fileType === 'image/heic' || 
                     attachment.fileType === 'image/heif' ? (
                      <img
                        src={getAttachmentUrl(attachment)}
                        alt={`Gönderi ${index + 1}`}
                        className="w-full h-auto object-contain rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-gray-50"
                        style={{ maxHeight: 'none' }}
                        onLoad={(e) => {
                          console.log(`Image loaded successfully: ${e.target.src}`);
                        }}
                        onError={(e) => {
                          console.error(`Image failed to load: ${e.target.src}`);
                          console.error('Attachment object:', attachment);
                          
                          // Infinite loop önleme
                          if (e.target.dataset.errorHandled) {
                            return;
                          }
                          e.target.dataset.errorHandled = 'true';
                          
                          // HEIC/HEIF dosyası yüklenemiyorsa özel placeholder göster
                          if (attachment.fileType === 'image/heic' || attachment.fileType === 'image/heif') {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'heic-placeholder w-full h-auto flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-8';
                            placeholder.innerHTML = `
                              <i class="bi bi-image text-6xl text-yellow-600 mb-4"></i>
                              <span class="text-yellow-800 text-lg font-medium">HEIC Fotoğraf</span>
                              <span class="text-yellow-600 text-sm mt-2">iPhone kamera formatı</span>
                              <span class="text-yellow-500 text-xs mt-1">${attachment.name}</span>
                            `;
                            e.target.parentNode.replaceChild(placeholder, e.target);
                          } else {
                            // Diğer resimler için basit placeholder
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-full h-auto flex flex-col items-center justify-center bg-gray-100 border border-gray-200 rounded-xl p-8';
                            placeholder.innerHTML = `
                              <i class="bi bi-image text-4xl text-gray-400 mb-2"></i>
                              <span class="text-gray-600 text-sm">Resim yüklenemedi</span>
                              <span class="text-gray-400 text-xs mt-1">${attachment.name}</span>
                            `;
                            e.target.parentNode.replaceChild(placeholder, e.target);
                          }
                        }}
                      />
                    ) : attachment.fileType && attachment.fileType.startsWith('video/') ? (
                      <div className="relative bg-black rounded-xl overflow-hidden">
                        <video
                          controls
                          preload="metadata"
                          playsInline
                          webkit-playsinline="true"
                          className="w-full h-auto rounded-xl shadow-md"
                          style={{ maxHeight: 'none' }}
                          onError={(e) => {
                            console.error(`Video failed to load: ${e.target.src}`);
                            console.error('Attachment object:', attachment);
                          }}
                          onLoadedMetadata={(e) => {
                            console.log(`Video metadata loaded: ${e.target.src}`);
                            console.log(`Duration: ${e.target.duration} seconds`);
                          }}
                        >
                          <source src={getAttachmentUrl(attachment)} type={attachment.fileType} />
                          <p className="text-white p-4">
                            Tarayıcınız video oynatmayı desteklemiyor. 
                            <a 
                              href={getAttachmentUrl(attachment)} 
                              className="text-blue-300 hover:text-blue-100 ml-1"
                              download
                            >
                              Videoyu indirin
                            </a>
                          </p>
                        </video>
                        
                        {/* Video overlay bilgileri */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                          <i className="bi bi-camera-video mr-1"></i>
                          Video
                        </div>
                        
                        {/* Video boyutu bilgisi */}
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {attachment.fileType && attachment.fileType.includes('/') ? attachment.fileType.split('/')[1].toUpperCase() : 'DOSYA'}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <a
                          href={getAttachmentUrl(attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full justify-center text-gray-700 hover:text-gray-900"
                        >
                          <i className="bi bi-file-earmark-arrow-down text-xl mr-3"></i>
                          <div className="text-left">
                            <div className="font-medium">Dosyayı İndir</div>
                            <div className="text-sm text-gray-500">
                              {attachment.name} • {attachment.fileType}
                            </div>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Post Actions */}
          <div className="flex items-center space-x-8 text-gray-500 mb-4">
            <button 
              className="post-action-button group"
              onClick={toggleComments}
            >
              <i className="bi bi-chat group-hover:bg-blue-50 group-hover:text-blue-600"></i>
              <span className="group-hover:text-blue-600">{post.commentCount || 0}</span>
            </button>
            
            <button 
              className={`post-action-button group ${liked ? 'text-red-500' : ''}`}
              onClick={() => {
                setLiked(!liked);
                setLikeCount(prev => liked ? prev - 1 : prev + 1);
              }}
            >
              <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} ${
                liked ? 'text-red-500' : 'group-hover:bg-red-50 group-hover:text-red-600'
              }`}></i>
              <span className={liked ? 'text-red-500' : 'group-hover:text-red-600'}>{likeCount}</span>
            </button>
          </div>

          {/* Yorum Sistemi */}
          <CommentSection 
            post={post} 
            isExpanded={commentsExpanded} 
            onToggle={toggleComments}
          />
        </div>
      </div>
    </div>
  );
}