import { useState, useEffect } from "react";
import { X, ArrowUp, ArrowDown, MessageCircle, Send } from "lucide-react";
import axios from "axios";

export default function PostDetailModal({ post, onClose, onVoteToggle, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Helper for displaying relative time
  const timeAgo = (date) => {
    if (!date) return "Just now";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  useEffect(() => {
    if (post) {
      fetchComments();
    }
  }, [post]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await axios.get(`/api/comments/${post._id}`, {
        withCredentials: true,
      });
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `/api/comments/${post._id}`,
        { content: newComment },
        { withCredentials: true }
      );
      
      // Add the new comment optimally or re-fetch
      setComments([...comments, res.data]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`/api/comments/${commentId}`, {
        withCredentials: true,
      });
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert(err.response?.data?.message || "Failed to delete comment.");
    }
  };

  if (!post) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content post-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="post-user-info">
             <div className="post-avatar av-1" />
             <span className="post-username">{post.authorName || "Anonymous"}</span>
             <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body post-detail-body">
          <h2 className="post-title-large">{post.title}</h2>
          
          <div className="post-tags-container">
               {post.types && (
                   <span className="post-type-tag" style={{ textTransform: 'capitalize' }}>
                     {Array.isArray(post.types) ? post.types.join(", ") : post.types}
                   </span>
               )}
              {post.tags && post.tags.map((t) => (
                <span className="post-tag modal-tag" key={t}>{t}</span>
              ))}
          </div>

          <div className="post-full-content">
              {/* Splitting content locally to simulate basic paragraphs/code spacing if needed, 
                  or just render raw. */}
              {post.content.split('\n').map((line, i) => (
                 <p key={i}>{line}</p>
              ))}
          </div>
          
          <div className="post-actions-bar">
              <button 
                 className={`action-btn vote-btn ${post.upVotes?.includes(currentUser?._id) ? 'active' : ''}`}
                 onClick={() => onVoteToggle(post._id, 'upvote')}
              >
                  <ArrowUp size={16} /> {post.upVotes?.length || 0}
              </button>
              <button 
                 className={`action-btn vote-btn ${post.downVotes?.includes(currentUser?._id) ? 'active' : ''}`}
                 onClick={() => onVoteToggle(post._id, 'downvote')}
              >
                  <ArrowDown size={16} /> {post.downVotes?.length || 0}
              </button>
              <div className="action-stat">
                  <MessageCircle size={16} /> {post.commentCount || comments.length} Comments
              </div>
          </div>

          <div className="comments-section">
              <h3>Comments</h3>
              
              <form className="add-comment-form" onSubmit={handleAddComment}>
                  <input 
                     type="text" 
                     placeholder="Add a comment..." 
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     disabled={isSubmitting}
                  />
                  <button type="submit" disabled={isSubmitting || !newComment.trim()}>
                      <Send size={16} />
                  </button>
              </form>

              {loadingComments ? (
                  <div className="comments-loading">Loading comments...</div>
              ) : error ? (
                  <div className="comments-error">{error}</div>
              ) : comments.length === 0 ? (
                  <div className="comments-empty">No comments yet. Be the first to start the discussion!</div>
              ) : (
                  <div className="comments-list">
                      {comments.map((comment) => (
                          <div key={comment._id} className="comment-item">
                               <div className="comment-header">
                                   <span className="comment-author">{comment.authorName || "User"}</span>
                                   <div className="comment-meta">
                                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                                      {currentUser && comment.authorId === currentUser._id && (
                                        <button className="comment-delete-btn" onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                                      )}
                                   </div>
                               </div>
                               <div className="comment-body">
                                   {comment.content}
                               </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
