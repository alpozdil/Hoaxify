import { useState, useEffect } from "react";
import { Alert } from "@/shared/components/Alert";
import { Spinner } from "@/shared/components/Spinner";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { getFollowers, getFollowing } from "../api";
import { useParams, Link } from "react-router-dom";

export function FollowList({ type }) {
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [id, type]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiFunction = type === 'followers' ? getFollowers : getFollowing;
      const response = await apiFunction(id);
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Liste yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const title = type === 'followers' ? 'Takipçiler' : 'Takip Edilenler';

  if (loading) {
    return (
      <div className="container mt-3">
        <Alert styleType="secondary" center>
          <Spinner />
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-3">
        <Alert styleType="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">{title} ({users.length})</h5>
        </div>
        <div className="card-body">
          {users.length === 0 ? (
            <div className="text-center text-muted py-4">
              {type === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimseyi takip etmiyor'}
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {users.map(user => (
                <Link 
                  key={user.id} 
                  to={`/users/${user.id}`}
                  className="list-group-item list-group-item-action d-flex align-items-center text-decoration-none"
                >
                  <ProfileImage width={50} image={user.image} />
                  <div className="ms-3">
                    <div className="fw-bold">{user.username}</div>
                    <div className="text-muted small">{user.email}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 