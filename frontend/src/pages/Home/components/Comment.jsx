import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ProfileImage } from "@/shared/components/ProfileImage";
import { useAuthState } from "@/shared/state/context";
import { updateComment, deleteComment, likeComment, createReply, getReplies } from "./api";
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function Comment({ comment, post, onCommentUpdated, onCommentDeleted }) {
  const { t } = useTranslation();
  const authState = useAuthState();
  
  // Component mount olduğunda durumu logla
  useEffect(() => {
    console.log("Comment component mount:", {
      commentId: comment?.id,
      hasComment: !!comment,
      hasUser: !!comment?.user,
      authState: {
        isLoggedIn: authState.isLoggedIn,
        userId: authState.id
      }
    });
  }, []);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || "");
  const [replyContent, setReplyContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [likeCount, setLikeCount] = useState(comment?.likeCount || 0);
  const [liked, setLiked] = useState(comment?.liked || false);

  // Comment prop değiştiğinde liked ve likeCount state'lerini güncelle
  useEffect(() => {
    setLiked(comment?.liked || false);
    setLikeCount(comment?.likeCount || 0);
  }, [comment?.liked, comment?.likeCount]);

  // Prop validation - comment undefined ise early return
  if (!comment || !comment.user) {
    console.warn("Comment component: comment prop undefined veya incomplete", {
      comment,
      hasUser: !!comment?.user
    });
    return null;
  }

  // Yetki kontrolü
  const isCommentOwner = authState.id === comment.user.id;
  const isPostOwner = post && authState.id === post.user?.id;
  const canEdit = isCommentOwner; // Sadece yorum sahibi düzenleyebilir
  const canDelete = isCommentOwner || isPostOwner; // Yorum sahibi veya gönderi sahibi silebilir

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
    setError("");
    setShowDropdown(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    setError("");
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError("Yorum boş olamaz");
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const response = await updateComment(comment.id, editContent);
      if (onCommentUpdated) {
        onCommentUpdated(response.data);
      }
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || "Yorum güncellenirken bir hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu yorumu silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setShowDropdown(false);

    try {
      await deleteComment(comment.id);
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Yorum silinirken bir hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!authState.isLoggedIn) {
      setError("Beğenmek için oturum açmanız gerekiyor");
      return;
    }

    setIsLiking(true);
    setError("");

    try {
      const response = await likeComment(comment.id);
      const isNowLiked = response.data; // Backend'den boolean dönüyor
      setLiked(isNowLiked);
      setLikeCount(prev => isNowLiked ? prev + 1 : prev - 1);
    } catch (error) {
      setError("Beğeni işlemi başarısız oldu");
      console.error("Beğeni hatası:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      setError("Yanıt boş olamaz");
      return;
    }

    if (!authState.isLoggedIn) {
      setError("Yanıt vermek için oturum açmanız gerekiyor");
      return;
    }

    console.log("Comment.jsx: handleReply başlatılıyor", {
      commentId: comment.id,
      replyContent: replyContent.trim(),
      authState: authState.isLoggedIn
    });

    setIsSubmittingReply(true);
    setError("");

    try {
      console.log("Comment.jsx: createReply API çağrısı yapılıyor...");
      const response = await createReply(comment.id, replyContent);
      console.log("Comment.jsx: createReply başarılı", response.data);
      
      setReplies(prev => [response.data, ...prev]);
      setReplyContent("");
      setIsReplying(false);
      
      console.log("Comment.jsx: Yanıt başarıyla eklendi");
    } catch (error) {
      console.error("Comment.jsx: Yanıt gönderme hatası:", error);
      console.error("Comment.jsx: Hata detayları:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      if (error.response?.status === 403) {
        setError("Bu işlem için yetkiniz yok");
      } else if (error.response?.status === 401) {
        setError("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Yanıt gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const toggleReplies = async () => {
    if (!showReplies && replies.length === 0) {
      // İlk kez yanıtları yüklüyoruz
      try {
        const response = await getReplies(comment.id);
        setReplies(response.data.content || []);
      } catch (error) {
        setError("Yanıtlar yüklenemedi");
        console.error("Yanıt yükleme hatası:", error);
        return;
      }
    }
    setShowReplies(!showReplies);
  };

  return (
    <div className="comment-item group">
      <div className="flex items-start space-x-3">
        <ProfileImage 
          width={32} 
          height={32} 
          image={comment.user?.image} 
        />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl p-3 mb-1 relative">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {comment.user?.username || "Bilinmeyen kullanıcı"}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}
                </span>
              </div>
              
              {(canEdit || canDelete) && !isEditing && (
                <div className="relative">
                  <button
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors duration-200 opacity-0 group-hover:opacity-100"
                    onClick={() => setShowDropdown(!showDropdown)}
                    type="button"
                  >
                    <i className="bi bi-three-dots text-sm"></i>
                  </button>
                  
                  {showDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                      ></div>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                        {canEdit && (
                          <button 
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200" 
                            onClick={handleEdit}
                            disabled={isDeleting}
                          >
                            <i className="bi bi-pencil mr-3 text-gray-500"></i>
                            Düzenle
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200" 
                            onClick={handleDelete}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <span className="spinner w-4 h-4 mr-3"></span>
                                Siliniyor...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-trash mr-3"></i>
                                {isPostOwner && !isCommentOwner ? "Yorumu Sil (Gönderi Sahibi)" : "Sil"}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  className="form-control text-sm"
                  rows="2"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={isUpdating}
                  placeholder="Yorumunuzu yazın..."
                />
                <div className="flex justify-end space-x-2">
                  <button
                    className="btn btn-outline-secondary text-xs px-3 py-1"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    İptal
                  </button>
                  <button
                    className="btn btn-primary text-xs px-3 py-1"
                    onClick={handleSaveEdit}
                    disabled={isUpdating || !editContent.trim()}
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner w-3 h-3 mr-1"></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      "Kaydet"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-800 text-sm leading-relaxed">
                {comment.content || "İçerik bulunamadı"}
              </div>
            )}
          </div>

          {/* Yorum aksiyonları */}
          <div className="flex items-center space-x-4 mt-2">
            <button
              className={`comment-like-btn inline-flex items-center text-sm transition-all duration-200 ${
                liked 
                  ? 'text-red-500 hover:text-red-600 font-semibold liked' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
              onClick={handleLike}
              disabled={isLiking || !authState.isLoggedIn}
            >
              <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'} mr-1 ${
                liked ? 'animate-pulse' : ''
              }`}></i>
              <span className={liked ? 'font-semibold' : ''}>{likeCount}</span>
            </button>

            <button
              className="text-sm text-gray-500 hover:text-primary-600"
              onClick={() => setIsReplying(!isReplying)}
              disabled={!authState.isLoggedIn}
            >
              <i className="bi bi-reply mr-1"></i>
              Yanıtla
            </button>

            {comment.replyCount > 0 && (
              <button
                className="text-sm text-gray-500 hover:text-primary-600"
                onClick={toggleReplies}
              >
                <i className={`bi ${showReplies ? 'bi-chevron-up' : 'bi-chevron-down'} mr-1`}></i>
                {showReplies ? 'Yanıtları Gizle' : `${comment.replyCount} Yanıt`}
              </button>
            )}
          </div>

          {/* Yanıt formu */}
          {isReplying && (
            <div className="mt-3">
              <form onSubmit={handleReply} className="space-y-2">
                <textarea
                  className="form-control text-sm"
                  rows="2"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={isSubmittingReply}
                  placeholder="Yanıtınızı yazın..."
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary text-xs px-3 py-1"
                    onClick={() => setIsReplying(false)}
                    disabled={isSubmittingReply}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs px-3 py-1"
                    disabled={isSubmittingReply || !replyContent.trim()}
                  >
                    {isSubmittingReply ? (
                      <>
                        <span className="spinner w-3 h-3 mr-1"></span>
                        Gönderiliyor...
                      </>
                    ) : (
                      "Yanıtla"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Yanıtlar listesi */}
          {showReplies && replies.length > 0 && (
            <div className="comment-replies">
              {replies.map((reply) => (
                <div key={reply.id} className="comment-reply">
                  <Comment
                    comment={reply}
                    post={post}
                    onCommentUpdated={onCommentUpdated}
                    onCommentDeleted={onCommentDeleted}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Yükleniyor durumu */}
          {showReplies && replies.length === 0 && (
            <div className="mt-3 pl-8">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="spinner w-4 h-4"></div>
                <span>Yanıtlar yükleniyor...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger text-xs mt-2">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 