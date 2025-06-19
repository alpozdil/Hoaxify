import { UserSearchResults } from "./UserSearchResults";
import { PostSearchResults } from "./PostSearchResults";

export function AllSearchResults({ results, keyword }) {
  const { users, posts } = results;
  
  const hasUsers = users && users.content && users.content.length > 0;
  const hasPosts = posts && posts.content && posts.content.length > 0;

  if (!hasUsers && !hasPosts) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-search display-4 text-muted"></i>
          <h5 className="mt-3 text-muted">Sonuç Bulunamadı</h5>
          <p className="text-muted">
            "<strong>{keyword}</strong>" için hiçbir sonuç bulunamadı
          </p>
          <p className="text-muted small">
            Farklı anahtar kelimeler deneyebilir veya yazım hatası olmadığından emin olabilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      {/* Sol Kolon - Kullanıcılar */}
      <div className="col-12 col-lg-6 mb-3">
        {hasUsers ? (
          <UserSearchResults users={users} keyword={keyword} />
        ) : (
          <div className="card">
            <div className="card-body text-center py-4">
              <i className="bi bi-person-x display-6 text-muted"></i>
              <h6 className="mt-2 text-muted">Kullanıcı Bulunamadı</h6>
              <p className="text-muted small">
                Bu arama için kullanıcı sonucu yok
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sağ Kolon - Gönderiler */}
      <div className="col-12 col-lg-6 mb-3">
        {hasPosts ? (
          <PostSearchResults posts={posts} keyword={keyword} />
        ) : (
          <div className="card">
            <div className="card-body text-center py-4">
              <i className="bi bi-chat-square-text display-6 text-muted"></i>
              <h6 className="mt-2 text-muted">Gönderi Bulunamadı</h6>
              <p className="text-muted small">
                Bu arama için gönderi sonucu yok
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 