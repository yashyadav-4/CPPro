import { useState, useEffect } from "react";
import { X, ArrowUp, ArrowDown, MessageCircle, Send, User, Trash2 } from "lucide-react";
import axios from "axios";

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

export default function PostDetailModal({ post, onClose, onVoteToggle, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      console.log("Fallback to local comments reading");
      const localCommentsReqs = JSON.parse(localStorage.getItem('post_comments') || '{}');
      setComments(localCommentsReqs[post._id] || []);
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
      
      setComments([...comments, res.data]);
      setNewComment("");
      
      // Also update local storage for full sync
      const localCommentsReqs = JSON.parse(localStorage.getItem('post_comments') || '{}');
      const postArray = localCommentsReqs[post._id] || [];
      postArray.push(res.data);
      localCommentsReqs[post._id] = postArray;
      localStorage.setItem('post_comments', JSON.stringify(localCommentsReqs));

    } catch (err) {
      console.log("Fallback to localStorage comment creation");
      const fakeNewComment = {
          _id: Date.now().toString(),
          content: newComment,
          authorName: currentUser?.name || "CurrentUser",
          authorId: currentUser?._id || "localUser",
          createdAt: new Date().toISOString(),
      };
      setComments([...comments, fakeNewComment]);
      setNewComment("");

      const localCommentsReqs = JSON.parse(localStorage.getItem('post_comments') || '{}');
      const postArray = localCommentsReqs[post._id] || [];
      postArray.push(fakeNewComment);
      localCommentsReqs[post._id] = postArray;
      localStorage.setItem('post_comments', JSON.stringify(localCommentsReqs));
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
      console.log("Fallback to localStorage comment deletion");
      const updated = comments.filter(c => c._id !== commentId);
      setComments(updated);

      const localCommentsReqs = JSON.parse(localStorage.getItem('post_comments') || '{}');
      localCommentsReqs[post._id] = updated;
      localStorage.setItem('post_comments', JSON.stringify(localCommentsReqs));
    }
  };

  if (!post) return null;

  const currentUserId = currentUser?._id || "localUser";
  const upvoted = post.upVotes?.includes(currentUserId);
  const downvoted = post.downVotes?.includes(currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 object-cover overflow-hidden">
                <User size={20} />
             </div>
             <div>
                <div className="font-bold text-gray-900 text-sm">{post.authorName || "Anonymous"}</div>
                <div className="text-xs text-gray-500 font-medium">{timeAgo(post.createdAt)}</div>
             </div>
          </div>
          <button 
             className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none" 
             onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row overflow-hidden flex-1 overflow-y-auto hidden-scrollbar">
            
            <div className="w-full md:w-3/5 p-6 border-b md:border-b-0 md:border-r border-gray-100 shrink-0 md:shrink overflow-y-auto hidden-scrollbar">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">{post.title}</h2>
              
              <div className="flex flex-wrap gap-2 mb-6">
                   {post.types && (
                       <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                         {Array.isArray(post.types) ? post.types.join(", ") : post.types}
                       </span>
                   )}
                  {post.tags && post.tags.map((t) => (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 capitalize" key={t}>
                        #{t}
                    </span>
                  ))}
              </div>

              <div className="text-gray-800 leading-relaxed text-[15px] space-y-4 whitespace-pre-wrap">
                  {post.content}
              </div>
              
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full p-1">
                      <button 
                         className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${upvoted ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                         onClick={() => onVoteToggle(post._id, 'upvote')}
                         title="Upvote"
                      >
                          <ArrowUp size={16} />
                      </button>
                      <span className={`text-sm font-bold min-w-[20px] text-center ${upvoted ? 'text-indigo-600' : downvoted ? 'text-orange-600' : 'text-gray-700'}`}>
                          {(post.upVotes?.length || 0) - (post.downVotes?.length || 0)}
                      </span>
                      <button 
                         className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${downvoted ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                         onClick={() => onVoteToggle(post._id, 'downvote')}
                         title="Downvote"
                      >
                          <ArrowDown size={16} />
                      </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-sm ml-2">
                      <MessageCircle size={18} /> {post.commentCount || comments.length} Comments
                  </div>
              </div>
            </div>

            <div className="w-full md:w-2/5 p-6 bg-gray-50 flex flex-col shrink-0 md:shrink border-t md:border-t-0 border-gray-100 overflow-y-auto hidden-scrollbar">
                <h3 className="text-lg font-bold text-gray-900 mb-4 shrink-0">Discussions</h3>
                
                <form className="relative mb-6 shrink-0" onSubmit={handleAddComment}>
                    <input 
                       type="text" 
                       className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm placeholder:text-gray-400"
                       placeholder="Add a comment..." 
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       disabled={isSubmitting}
                    />
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !newComment.trim()}
                        className="absolute right-2 top-1.5 bottom-1.5 w-9 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                        <Send size={14} className="ml-0.5" />
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto hidden-scrollbar pr-2">
                    {loadingComments ? (
                        <div className="text-center text-sm text-gray-500 py-4 font-medium animate-pulse">Loading comments...</div>
                    ) : error && comments.length === 0 ? (
                        <div className="text-center text-sm text-red-500 bg-red-50 rounded-lg py-3 font-medium border border-red-100">{error}</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                <MessageCircle size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-900">No comments yet</p>
                            <p className="text-xs text-gray-500 mt-1">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                     <div className="flex items-start justify-between mb-2">
                                         <span className="text-sm font-bold text-gray-900">{comment.authorName || "User"}</span>
                                         <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 font-medium">{timeAgo(comment.createdAt)}</span>
                                            {currentUserId === comment.authorId && (
                                              <button 
                                                className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" 
                                                onClick={() => handleDeleteComment(comment._id)}
                                                title="Delete comment"
                                              >
                                                  <Trash2 size={14} />
                                              </button>
                                            )}
                                         </div>
                                     </div>
                                     <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
    </div>
  );
}
