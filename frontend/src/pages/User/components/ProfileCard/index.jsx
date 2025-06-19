import { Button } from "@/shared/components/Button";
import { useAuthState } from "@/shared/state/context";
import { useState, useEffect } from "react";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { UserEditForm } from "./UserEditForm";
import { UserDeleteButton } from "./UserDeleteButton";
import { followUser, unfollowUser, getFollowStatus } from "../../api";
import { Link } from "react-router-dom";

export function ProfileCard({ user }) {
  const authState = useAuthState();
  const [editMode, setEditMode] = useState(false);
  const [tempImage, setTempImage] = useState();
  const [followingState, setFollowingState] = useState({
    isFollowing: false,
    followersCount: 0,
    followingCount: 0,
    loading: false
  });
  
  // AuthState kontrolü ekle
  if (!authState) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p className="text-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  const isLoggedInUser = !editMode && authState.id === user.id;
  const canFollow = authState.id && authState.id !== user.id;

  const visibleUsername = authState.id === user.id ? (authState.username || user.username) : user.username;

  // Takip durumunu yükle
  useEffect(() => {
    if (user && user.id) {
      loadFollowStatus();
    }
  }, [user]);

  const loadFollowStatus = async () => {
    try {
      const response = await getFollowStatus(user.id);
      setFollowingState(prev => ({
        ...prev,
        isFollowing: response.data.isFollowing || false,
        followersCount: response.data.followersCount || 0,
        followingCount: response.data.followingCount || 0
      }));
    } catch (error) {
      console.error("Takip durumu yüklenirken hata:", error);
    }
  };

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
      } else {
        await followUser(user.id);
        setFollowingState(prev => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1
        }));
      }
    } catch (error) {
      console.error("Takip işlemi başarısız:", error);
      // Hata durumunda kullanıcıyı bilgilendir
      alert(error.response?.data?.message || "Takip işlemi başarısız oldu");
    } finally {
      setFollowingState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="card">
      <div className="card-header text-center">
        <ProfileImage width={200} tempImage={tempImage} image={user.image}/>
      </div>
      <div className="card-body text-center">
        {!editMode && (
          <>
            <span className="fs-3 d-block mb-3">{visibleUsername}</span>
            
            {/* Takip İstatistikleri */}
            <div className="row mb-3">
              <div className="col-4">
                <Link 
                  to={`/users/${user.id}/followers`}
                  className="text-decoration-none text-dark"
                >
                  <div className="text-center">
                    <div className="fs-5 fw-bold">{followingState.followersCount}</div>
                    <small className="text-muted">Takipçi</small>
                  </div>
                </Link>
              </div>
              <div className="col-4">
                <Link 
                  to={`/users/${user.id}/following`}
                  className="text-decoration-none text-dark"
                >
                  <div className="text-center">
                    <div className="fs-5 fw-bold">{followingState.followingCount}</div>
                    <small className="text-muted">Takip</small>
                  </div>
                </Link>
              </div>
              <div className="col-4">
                <div className="text-center">
                  <div className="fs-5 fw-bold">0</div>
                  <small className="text-muted">Gönderi</small>
                </div>
              </div>
            </div>
          </>
        )}
        
        {isLoggedInUser && (
          <>
            <Button onClick={() => setEditMode(true)}>Düzenle</Button>
            <div className="d-inline m-1"></div>
            <UserDeleteButton />
          </>
        )}
        
        {canFollow && !editMode && (
          <Button 
            onClick={handleFollowToggle}
            disabled={followingState.loading}
            styleType={followingState.isFollowing ? "outline-primary" : "primary"}
          >
            {followingState.loading 
              ? "Yükleniyor..." 
              : followingState.isFollowing ? "Takipten Çık" : "Takip Et"
            }
          </Button>
        )}
        
        {editMode && <UserEditForm setEditMode={setEditMode} setTempImage={setTempImage}/>}
      </div>
    </div>
  );
}
