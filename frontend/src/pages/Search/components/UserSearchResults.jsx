import { Link } from "react-router-dom";
import { ProfileImage } from "@/shared/components/ProfileImage";

export function UserSearchResults({ users, keyword }) {
  if (!users || !users.content || users.content.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-person-x display-4 text-muted"></i>
          <h5 className="mt-3 text-muted">Kullanıcı Bulunamadı</h5>
          <p className="text-muted">
            "<strong>{keyword}</strong>" için kullanıcı sonucu bulunamadı
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="bi bi-people me-2"></i>
          Kullanıcılar ({users.totalElements})
        </h6>
      </div>
      <div className="list-group list-group-flush">
        {users.content.map(user => (
          <Link
            key={user.id}
            to={`/users/${user.id}`}
            className="list-group-item list-group-item-action d-flex align-items-center text-decoration-none"
          >
            <ProfileImage width={50} image={user.image} />
            <div className="ms-3 flex-grow-1">
              <div className="fw-bold">{user.username}</div>
              <div className="text-muted small">{user.email}</div>
            </div>
            <div className="text-muted">
              <i className="bi bi-chevron-right"></i>
            </div>
          </Link>
        ))}
      </div>
      
      {users.totalPages > 1 && (
        <div className="card-footer text-center">
          <small className="text-muted">
            Sayfa {users.number + 1} / {users.totalPages}
          </small>
          {/* Sayfalama butonları buraya eklenebilir */}
        </div>
      )}
    </div>
  );
} 