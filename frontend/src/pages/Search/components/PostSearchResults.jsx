import { Link } from "react-router-dom";
import { ProfileImage } from "@/shared/components/ProfileImage";

export function PostSearchResults({ posts, keyword }) {
  if (!posts || !posts.content || posts.content.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-chat-square-text-fill display-4 text-muted"></i>
          <h5 className="mt-3 text-muted">Gönderi Bulunamadı</h5>
          <p className="text-muted">
            "<strong>{keyword}</strong>" için gönderi sonucu bulunamadı
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightKeyword = (text, keyword) => {
    if (!keyword || !text) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-warning bg-opacity-50">{part}</mark> : 
        part
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="bi bi-chat-square-text me-2"></i>
          Gönderiler ({posts.totalElements})
        </h6>
      </div>
      <div className="card-body p-0">
        {posts.content.map(post => (
          <div key={post.id} className="border-bottom p-3">
            <div className="d-flex align-items-start">
              <Link to={`/users/${post.user.id}`} className="text-decoration-none">
                <ProfileImage width={40} image={post.user.image} />
              </Link>
              <div className="ms-3 flex-grow-1">
                <div className="d-flex align-items-center mb-2">
                  <Link 
                    to={`/users/${post.user.id}`} 
                    className="fw-bold text-decoration-none me-2"
                  >
                    {post.user.username}
                  </Link>
                  <span className="text-muted small">
                    {formatDate(post.createdAt)}
                  </span>
                </div>
                <div className="mb-2">
                  {highlightKeyword(post.content, keyword)}
                </div>
                <div className="d-flex text-muted small">
                  <span className="me-3">
                    <i className="bi bi-heart me-1"></i>
                    {post.likeCount}
                  </span>
                  <span>
                    <i className="bi bi-chat me-1"></i>
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {posts.totalPages > 1 && (
        <div className="card-footer text-center">
          <small className="text-muted">
            Sayfa {posts.number + 1} / {posts.totalPages}
          </small>
          {/* Sayfalama butonları buraya eklenebilir */}
        </div>
      )}
    </div>
  );
} 