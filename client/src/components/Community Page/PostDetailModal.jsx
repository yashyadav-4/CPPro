import { useState, useEffect } from "react";
import {
  X, ArrowUp, ArrowDown, MessageCircle, Send,
  User, Trash2, ShieldCheck, Pin,
} from "lucide-react";
import axios from "axios";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

const TYPE_COLORS = {
  blog:       "bg-blue-500/10 text-blue-400 border-blue-500/20",
  discussion: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  help:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const timeAgo = (date) => {
  if (!date) return "Just now";
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s / 31536000 > 1) return Math.floor(s / 31536000) + "y ago";
  if (s / 2592000  > 1) return Math.floor(s / 2592000)  + "mo ago";
  if (s / 86400    > 1) return Math.floor(s / 86400)    + "d ago";
  if (s / 3600     > 1) return Math.floor(s / 3600)     + "h ago";
  if (s / 60       > 1) return Math.floor(s / 60)       + "m ago";
  return "Just now";
};

export default function PostDetailModal({ post, onClose, onVoteToggle, onPinToggle, currentUser }) {
  const [comments, setComments]           = useState([]);
  const [newComment, setNewComment]       = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    if (post) fetchComments();
  }, [post]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await axios.get(`/api/comments/${post._id}`, { withCredentials: true });
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      const local = JSON.parse(localStorage.getItem("post_comments") || "{}");
      setComments(local[post._id] || []);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await axios.post(`/api/comments/${post._id}`, { content: newComment }, { withCredentials: true });
      setComments((c) => [...c, res.data]);
      setNewComment("");
      const local = JSON.parse(localStorage.getItem("post_comments") || "{}");
      local[post._id] = [...(local[post._id] || []), res.data];
      localStorage.setItem("post_comments", JSON.stringify(local));
    } catch {
      const fake = {
        _id: Date.now().toString(),
        content: newComment,
        authorName: currentUser?.name || "You",
        authorId: currentUser?._id || "localUser",
        createdAt: new Date().toISOString(),
      };
      setComments((c) => [...c, fake]);
      setNewComment("");
      const local = JSON.parse(localStorage.getItem("post_comments") || "{}");
      local[post._id] = [...(local[post._id] || []), fake];
      localStorage.setItem("post_comments", JSON.stringify(local));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await axios.delete(`/api/comments/${commentToDelete}`, { withCredentials: true });
      setComments((c) => c.filter((x) => x._id !== commentToDelete));
    } catch {
      setComments((c) => c.filter((x) => x._id !== commentToDelete));
    } finally {
      setCommentToDelete(null);
    }
  };

  if (!post) return null;

  const currentUserId = currentUser?._id || "localUser";
  const upvoted  = post.upVotes?.includes(currentUserId);
  const downvoted = post.downVotes?.includes(currentUserId);
  const score    = (post.upVotes?.length || 0) - (post.downVotes?.length || 0);
  const typeKey  = (Array.isArray(post.types) ? post.types[0] : post.types)?.toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            {post.authorPic ? (
              <img src={post.authorPic} alt={post.authorName} className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600/30 to-emerald-400/20 flex items-center justify-center text-emerald-400 ring-1 ring-emerald-500/20">
                <User size={18} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {post.authorName || "Anonymous"}
                </span>
                {post.authorRole === "admin" && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white uppercase tracking-tighter">
                    <ShieldCheck size={8} /> ADMIN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(post.createdAt)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full">
                <Pin size={11} className="fill-current" /> Pinned
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1">
          {/* Post content */}
          <div className="w-full md:w-3/5 p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/[0.07] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
              {post.title}
            </h2>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {typeKey && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${TYPE_COLORS[typeKey] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-transparent"}`}>
                  {typeKey}
                </span>
              )}
              {post.tags?.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.06]"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Content */}
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Vote + pin controls */}
            <div className="flex items-center gap-3 mt-8 pt-5 border-t border-gray-100 dark:border-white/[0.07]">
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] rounded-full p-0.5">
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${upvoted ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10"}`}
                  onClick={() => onVoteToggle(post._id, "upvote")}
                >
                  <ArrowUp size={15} />
                </button>
                <span className={`text-sm font-bold min-w-[22px] text-center ${upvoted ? "text-emerald-500" : downvoted ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}>
                  {score}
                </span>
                <button
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${downvoted ? "bg-orange-500/20 text-orange-500" : "text-gray-400 hover:text-orange-500 hover:bg-orange-500/10"}`}
                  onClick={() => onVoteToggle(post._id, "downvote")}
                >
                  <ArrowDown size={15} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm font-medium">
                <MessageCircle size={16} />
                {post.commentCount || comments.length} Comments
              </div>
              {currentUser?.role === "admin" && (
                <button
                  className={`ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    post.isPinned
                      ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                      : "bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                  onClick={() => onPinToggle(post._id)}
                >
                  <Pin size={14} className={post.isPinned ? "fill-current" : ""} />
                  {post.isPinned ? "Unpin" : "Pin Discussion"}
                </button>
              )}
            </div>
          </div>

          {/* Comments panel */}
          <div className="w-full md:w-2/5 p-5 flex flex-col bg-gray-50/50 dark:bg-[#0a0a0a]/40 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex-shrink-0">
              Comments
            </h3>

            {/* Add comment */}
            <form onSubmit={handleAddComment} className="relative mb-4 flex-shrink-0">
              <input
                type="text"
                className="w-full pl-4 pr-11 py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                placeholder="Add a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="absolute right-2 top-1.5 bottom-1.5 w-8 flex items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors"
              >
                <Send size={13} className="ml-0.5" />
              </button>
            </form>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingComments ? (
                <div className="text-center text-sm text-gray-400 dark:text-gray-600 py-6 animate-pulse">
                  Loading comments…
                </div>
              ) : error && comments.length === 0 ? (
                <div className="text-center text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl py-3 border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center text-gray-300 dark:text-gray-600 mb-3">
                    <MessageCircle size={22} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-400">No comments yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Be the first to reply!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-xl p-3.5 group"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {comment.authorName || "User"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 dark:text-gray-600">
                          {timeAgo(comment.createdAt)}
                        </span>
                        {currentUserId === comment.authorId && (
                          <button
                            className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => setCommentToDelete(comment._id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
      />
    </div>
  );
}
