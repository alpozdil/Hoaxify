import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { useAuthState } from "@/shared/state/context";
import { loadComments, createComment } from "./api";
import { Comment } from "./Comment";

export function CommentSection({ post, isExpanded, onToggle }) {
  const { t } = useTranslation();
  const authState = useAuthState();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Prop validation
  if (!post) {
    console.warn("CommentSection component: post prop undefined");
    return null;
  }

  useEffect(() => {
    if (isExpanded && post?.id) {
      loadCommentsForPost(0);
    }
  }, [isExpanded, post?.id]);

  const loadCommentsForPost = async (pageNum = 0) => {
    if (!post?.id) {
      setError("Post ID bulunamadı");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await loadComments(post.id, pageNum, 10);
      const newComments = response.data.content || [];
      
      if (pageNum === 0) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      
      setHasMore(!response.data.last);
      setPage(pageNum);
    } catch (error) {
      setError("Yorumlar yüklenirken bir hata oluştu");
      console.error("Yorumlar yüklenirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError("Yorum boş olamaz");
      return;
    }

    if (!authState.id) {
      setError("Yorum yapmak için oturum açmanız gerekiyor");
      return;
    }

    if (!post?.id) {
      setError("Post ID bulunamadı");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("CommentSection: Yorum gönderiliyor...", { postId: post.id, content: newComment });
      const response = await createComment(post.id, newComment);
      console.log("CommentSection: API Response:", response);
      
      const newCommentData = response.data;
      console.log("CommentSection: Yeni yorum verisi:", newCommentData);
      
      // Response validation
      if (!newCommentData) {
        console.error("CommentSection: Response data undefined");
        setError("Yorum oluşturuldu ancak veriler alınamadı");
        return;
      }
      
      if (!newCommentData.user) {
        console.error("CommentSection: Comment user undefined", newCommentData);
        setError("Yorum oluşturuldu ancak kullanıcı bilgileri eksik");
        return;
      }
      
      console.log("CommentSection: Validated comment data:", {
        id: newCommentData.id,
        content: newCommentData.content,
        user: {
          id: newCommentData.user?.id,
          username: newCommentData.user?.username,
          image: newCommentData.user?.image
        },
        createdAt: newCommentData.createdAt
      });
      
      // Yeni yorumu listenin başına ekle
      setComments(prev => {
        console.log("CommentSection: Önceki yorumlar:", prev);
        const newList = [newCommentData, ...prev];
        console.log("CommentSection: Yeni yorum listesi:", newList);
        return newList;
      });
      setNewComment("");
      
      // Post'un yorum sayısını güncelle (eğer parent component'e callback varsa)
      if (onToggle) {
        // Bu callback aracılığıyla parent component'e yorum eklendi bilgisi gönderilebilir
      }
    } catch (error) {
      console.error("CommentSection: Yorum gönderme hatası:", error);
      setError(error.response?.data?.message || "Yorum eklenirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdated = (updatedComment) => {
    if (!updatedComment?.id) {
      console.warn("Updated comment invalid:", updatedComment);
      return;
    }
    
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDeleted = (commentId) => {
    if (!commentId) {
      console.warn("Comment ID undefined for deletion");
      return;
    }
    
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const loadMoreComments = () => {
    if (hasMore && !isLoading) {
      loadCommentsForPost(page + 1);
    }
  };

  if (!isExpanded) {
    return (
      <div className="pt-2 border-t border-gray-100">
        <button 
          className="inline-flex items-center text-gray-500 hover:text-primary-600 transition-colors duration-200 text-sm"
          onClick={onToggle}
        >
          <i className="bi bi-chat mr-2"></i>
          {(post?.commentCount || 0) > 0 
            ? `${post.commentCount} yorumu görüntüle`
            : "Yorum yap"
          }
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-gray-100 mt-4">
      {/* Yorum yazma formu */}
      {authState.id && (
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <ProfileImage 
              width={32} 
              height={32} 
              image={authState.image} 
            />
            <div className="flex-1">
              <form onSubmit={handleSubmitComment} className="flex space-x-2">
                <textarea
                  className="form-control text-sm flex-1"
                  placeholder="Bir yorum yazın..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows="2"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  className="btn btn-primary self-end px-4 py-2"
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? (
                    <span className="spinner w-4 h-4"></span>
                  ) : (
                    <i className="bi bi-send"></i>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger text-sm mb-4">
          {error}
        </div>
      )}

      {/* Yorumlar listesi */}
      <div className="space-y-4">
        {isLoading && comments.length === 0 ? (
          <div className="text-center py-6">
            <div className="spinner w-6 h-6 mx-auto mb-2"></div>
            <div className="text-gray-500 text-sm">Yorumlar yükleniyor...</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <i className="bi bi-chat-square-text text-4xl mb-3 block opacity-50"></i>
            <div className="mb-1">Henüz yorum yapılmamış</div>
            <small className="text-gray-400">İlk yorumu sen yap!</small>
          </div>
        ) : (
          <>
            {comments.map((comment, index) => (
              <Comment
                key={comment?.id || `comment-${index}`}
                comment={comment}
                post={post}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
              />
            ))}
            
            {hasMore && (
              <div className="text-center py-3">
                <button 
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm transition-colors duration-200"
                  onClick={loadMoreComments}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner w-4 h-4 mr-2"></span>
                      Yükleniyor...
                    </>
                  ) : (
                    "Daha fazla yorum yükle"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Yorumları gizle butonu */}
      <div className="text-center pt-4 border-t border-gray-100 mt-4">
        <button 
          className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
          onClick={onToggle}
        >
          <i className="bi bi-chevron-up mr-2"></i>
          Yorumları gizle
        </button>
      </div>
    </div>
  );
} 