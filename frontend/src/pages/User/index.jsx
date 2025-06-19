import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUser, getUserPosts } from "./api";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { useRouteParamApiRequest } from "@/shared/hooks/useRouteParamApiRequest";
import { UserProfile } from "./components/User.Profile";

export function User() {
  const { id } = useParams();
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [userRefreshTrigger, setUserRefreshTrigger] = useState(0);
  
  const {
    apiProgress,
    data: response,
    error,
  } = useRouteParamApiRequest("id", getUser, userRefreshTrigger);

  // Backend'den gelen response'u log'layalım
  console.log("User API Response:", response);

  // Backend'den gelen yapıya uygun olarak user'ı ayıklıyoruz
  const user = response?.user || response;

  // Kullanıcının gönderilerini yükle
  useEffect(() => {
    if (user?.id) {
      loadUserPosts();
    }
  }, [user?.id]);

  const loadUserPosts = async () => {
    setPostsLoading(true);
    setPostsError(null);
    
    try {
      const response = await getUserPosts(user.id);
      setUserPosts(response.data.content || []);
    } catch (error) {
      setPostsError("Gönderiler yüklenirken hata oluştu");
      console.error("Gönderiler yüklenirken hata:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  // User verilerini yenileme fonksiyonu
  const refreshUser = () => {
    setUserRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      {apiProgress && (
        <Alert styleType="secondary" center>
          <Spinner />
        </Alert>
      )}
      {user && (
        <UserProfile 
          user={user} 
          userResponse={response}
          posts={userPosts}
          postsLoading={postsLoading}
          postsError={postsError}
          onPostsRefresh={loadUserPosts}
          onUserRefresh={refreshUser}
        />
      )}
      {error && <Alert styleType="danger">{error}</Alert>}
    </>
  );
}
