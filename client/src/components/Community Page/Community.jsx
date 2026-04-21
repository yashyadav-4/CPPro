import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Pin,
  ShieldCheck,
  Globe,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Trophy,
  TrendingUp,
  Flame,
  Users,
} from "lucide-react";
import axios from "axios";
import NewPostModal from "./NewPostModal";
import PostDetailModal from "./PostDetailModal";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { key: "All",        label: "Global Feed",  icon: Globe },
  { key: "discussion", label: "Discussions",  icon: MessageSquare },
  { key: "blog",       label: "Blogs",        icon: BookOpen },
  { key: "help",       label: "Help",         icon: HelpCircle },
];

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

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
}

/* ─── Avatar ────────────────────────────────────────────────────────────────── */
function Avatar({ pic, name, size = "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  if (pic)
    return (
      <img
        src={pic}
        alt={name}
        className={`${sz} rounded-full object-cover ring-1 ring-white/10`}
      />
    );
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-emerald-600/30 to-emerald-400/20 flex items-center justify-center text-emerald-400 font-bold ring-1 ring-emerald-500/20`}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
function PostSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/[0.06]" />
        <div className="space-y-1.5">
          <div className="w-24 h-3 rounded bg-gray-200 dark:bg-white/[0.06]" />
          <div className="w-16 h-2.5 rounded bg-gray-200 dark:bg-white/[0.04]" />
        </div>
      </div>
      <div className="w-3/4 h-5 rounded bg-gray-200 dark:bg-white/[0.06] mb-3" />
      <div className="space-y-1.5 mb-4">
        <div className="w-full h-3 rounded bg-gray-200 dark:bg-white/[0.04]" />
        <div className="w-5/6 h-3 rounded bg-gray-200 dark:bg-white/[0.04]" />
      </div>
      <div className="flex gap-2">
        <div className="w-14 h-5 rounded-full bg-gray-200 dark:bg-white/[0.04]" />
        <div className="w-14 h-5 rounded-full bg-gray-200 dark:bg-white/[0.04]" />
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function Community() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // for sidebar computations
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  /* ── auth ── */
  useEffect(() => {
    axios
      .get("/api/auth/verify", { withCredentials: true })
      .then((r) => { if (r.data.authenticated) setCurrentUser(r.data.user); })
      .catch(() => {});
  }, []);

  /* ── sidebar data: all posts (large limit, no filter) ── */
  const fetchAllPosts = useCallback(async () => {
    try {
      const res = await axios.get("/api/posts?page=1&limit=50", { withCredentials: true });
      if (Array.isArray(res.data)) setAllPosts(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAllPosts(); }, [fetchAllPosts]);

  /* ── main feed ── */
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const limit = 8;
      let url = `/api/posts?page=${page}&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (activeFilter !== "All") url += `&tag=${encodeURIComponent(activeFilter)}`;

      const res = await axios.get(url, { withCredentials: true });
      if (Array.isArray(res.data)) {
        // If filtering by type, client-side filter (backend filters by tag, not type)
        let filtered = res.data;
        if (activeFilter !== "All") {
          filtered = res.data.filter(
            (p) => (Array.isArray(p.types) ? p.types[0] : p.types)?.toLowerCase() === activeFilter.toLowerCase()
          );
        }
        setPosts(filtered);
        setTotalPages(res.data.length === limit ? page + 1 : page);
      }
    } catch {
      setFetchError("Could not connect to server. Please try again.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  /* when filter changes for type-based categories, re-fetch without type in URL */
  const fetchPostsByType = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const limit = 50;
      let url = `/api/posts?page=1&limit=${limit}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

      const res = await axios.get(url, { withCredentials: true });
      if (Array.isArray(res.data)) {
        let filtered = res.data;
        if (activeFilter !== "All") {
          filtered = res.data.filter(
            (p) => (Array.isArray(p.types) ? p.types[0] : p.types)?.toLowerCase() === activeFilter.toLowerCase()
          );
        }
        const perPage = 8;
        const start = (page - 1) * perPage;
        const pageSlice = filtered.slice(start, start + perPage);
        setPosts(pageSlice);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / perPage)));
      }
    } catch {
      setFetchError("Could not connect to server. Please try again.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchPostsByType();
  }, [fetchPostsByType]);

  /* ── sidebar computations ── */
  const pinnedPost = useMemo(
    () => allPosts.find((p) => p.isPinned) || null,
    [allPosts]
  );

  const topUpvoted = useMemo(
    () =>
      [...allPosts]
        .filter((p) => !p.isPinned)
        .sort((a, b) => (b.upVotes?.length || 0) - (a.upVotes?.length || 0))
        .slice(0, 5),
    [allPosts]
  );

  const topContributors = useMemo(() => {
    const map = {};
    allPosts.forEach((p) => {
      const id = p.authorId || p.authorName;
      if (!id) return;
      if (!map[id]) map[id] = { name: p.authorName, pic: p.authorPic, posts: 0, votes: 0 };
      map[id].posts += 1;
      map[id].votes += (p.upVotes?.length || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
  }, [allPosts]);

  /* ── actions ── */
  const handleVote = async (postId, type) => {
    const uid = currentUser?._id || "localUser";
    setPosts((cur) =>
      cur.map((p) => {
        if (p._id !== postId) return p;
        const isUp = type === "upvote";
        let up = [...(p.upVotes || [])];
        let dn = [...(p.downVotes || [])];
        if (isUp) {
          up = up.includes(uid) ? up.filter((x) => x !== uid) : [...up.filter((x) => x !== uid), uid];
          dn = dn.filter((x) => x !== uid);
        } else {
          dn = dn.includes(uid) ? dn.filter((x) => x !== uid) : [...dn.filter((x) => x !== uid), uid];
          up = up.filter((x) => x !== uid);
        }
        return { ...p, upVotes: up, downVotes: dn };
      })
    );
    try {
      await axios.patch(`/api/posts/${postId}/${type}`, {}, { withCredentials: true });
    } catch { /* ignore */ }
    fetchAllPosts();
  };

  const handleCreatePost = async (postData) => {
    try {
      await axios.post("/api/posts", postData, { withCredentials: true });
      setIsNewModalOpen(false);
      setActiveFilter("All");
      setPage(1);
      fetchAllPosts();
    } catch {
      setIsNewModalOpen(false);
      setFetchError("Could not save your post — server is unreachable. Please try again.");
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await axios.delete(`/api/posts/${postToDelete}`, { withCredentials: true });
      if (selectedPost?._id === postToDelete) setSelectedPost(null);
      fetchAllPosts();
    } catch {
      setFetchError("Could not delete post.");
    } finally {
      setPostToDelete(null);
    }
  };

  const handleTogglePin = async (postId) => {
    try {
      setAllPosts((cur) => cur.map((p) => (p._id === postId ? { ...p, isPinned: !p.isPinned } : p)));
      await axios.patch(`/api/posts/${postId}/pin`, {}, { withCredentials: true });
      fetchAllPosts();
    } catch { fetchAllPosts(); }
  };

  const currentUserId = currentUser?._id || "localUser";
  const activeNav = NAV_ITEMS.find((n) => n.key === activeFilter) || NAV_ITEMS[0];

  /* ─────────────────────────────── RENDER ──────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-[1380px] mx-auto flex gap-0 min-h-screen">

        {/* ───────────── LEFT SIDEBAR ───────────── */}
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-white/[0.07] px-3 py-8 flex flex-col gap-2 sticky top-0 h-screen overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center gap-2 px-3 mb-6">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Users size={14} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">Community</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">CPPro Forums</div>
            </div>
          </div>

          {/* New Post */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm mb-4"
          >
            <Plus size={16} />
            New Post
          </button>

          {/* Nav */}
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveFilter(key); setPage(1); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeFilter === key
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon size={16} className={activeFilter === key ? "text-emerald-600 dark:text-emerald-400" : ""} />
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/[0.06]">
            <p className="text-[10px] text-gray-400 dark:text-gray-600 px-3 leading-relaxed">
              A place to discuss competitive programming, share knowledge, and get help.
            </p>
          </div>
        </aside>

        {/* ───────────── MIDDLE: FEED ───────────── */}
        <main className="flex-1 min-w-0 px-6 py-8">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              {(() => { const Icon = activeNav.icon; return <Icon size={18} className="text-emerald-500" />; })()}
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{activeNav.label}</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {activeFilter === "All"
                ? "Everything from the CPPro community — blogs, discussions and help requests."
                : activeFilter === "discussion"
                ? "Start or join conversations about CP topics, contests and strategies."
                : activeFilter === "blog"
                ? "In-depth articles and write-ups from the community."
                : "Stuck on a problem? Get help from fellow competitive programmers."}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, tags, authors…"
              value={search}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
            />
          </div>

          {/* Error */}
          {fetchError && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-500 text-sm flex-1">{fetchError}</span>
              <button
                onClick={() => { setFetchError(null); fetchPostsByType(); }}
                className="text-xs text-red-500 hover:text-red-700 underline font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Posts */}
          <div className="space-y-3">
            {loading
              ? [1, 2, 3, 4].map((i) => <PostSkeleton key={i} />)
              : posts.length === 0
              ? (
                <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center text-gray-400 mb-4">
                    <MessageCircle size={28} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No posts found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs">
                    Nothing here yet. Be the first to start a conversation!
                  </p>
                </div>
              )
              : posts.map((post) => {
                  const upvoted = post.upVotes?.includes(currentUserId);
                  const downvoted = post.downVotes?.includes(currentUserId);
                  const score = (post.upVotes?.length || 0) - (post.downVotes?.length || 0);
                  const typeKey = (Array.isArray(post.types) ? post.types[0] : post.types)?.toLowerCase();

                  return (
                    <article
                      key={post._id}
                      onClick={() => setSelectedPost(post)}
                      className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-5 cursor-pointer hover:border-emerald-500/30 dark:hover:border-emerald-500/20 hover:shadow-md dark:hover:shadow-emerald-500/5 transition-all duration-200 group"
                    >
                      {/* Author row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar pic={post.authorPic} name={post.authorName} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <Pin size={10} className="fill-current" /> Pinned
                            </span>
                          )}
                          {typeKey && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${TYPE_COLORS[typeKey] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-transparent"}`}>
                              {typeKey}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-1.5 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
                        {post.content}
                      </p>

                      {/* Tags */}
                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.06]"
                            >
                              #{t}
                            </span>
                          ))}
                          {post.tags.length > 4 && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                              +{post.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div
                        className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Vote pill */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.07] rounded-full p-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVote(post._id, "upvote"); }}
                              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${upvoted ? "bg-emerald-500/20 text-emerald-500" : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10"}`}
                            >
                              <ArrowUp size={13} />
                            </button>
                            <span className={`text-xs font-bold min-w-[18px] text-center ${upvoted ? "text-emerald-500" : downvoted ? "text-orange-500" : "text-gray-600 dark:text-gray-400"}`}>
                              {score}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVote(post._id, "downvote"); }}
                              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${downvoted ? "bg-orange-500/20 text-orange-500" : "text-gray-400 hover:text-orange-500 hover:bg-orange-500/10"}`}
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-medium">
                            <MessageCircle size={13} />
                            {post.commentCount || 0} comments
                          </div>
                        </div>

                        {/* Admin controls */}
                        <div className="flex items-center gap-1.5">
                          {currentUser?.role === "admin" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTogglePin(post._id); }}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${post.isPinned ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20" : "text-gray-400 hover:text-amber-500 hover:bg-amber-500/10"}`}
                            >
                              <Pin size={11} className={post.isPinned ? "fill-current" : ""} />
                              {post.isPinned ? "Unpin" : "Pin"}
                            </button>
                          )}
                          {(currentUserId === post.authorId || currentUser?.role === "admin") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPostToDelete(post._id); }}
                              className="text-[11px] font-semibold text-red-400 hover:text-red-600 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                          >
                            View <TrendingUp size={11} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>

          {/* Pagination */}
          {!loading && posts.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    page === i + 1
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>

        {/* ───────────── RIGHT SIDEBAR ───────────── */}
        <aside className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-white/[0.07] px-4 py-8 flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto">

          {/* Pinned Post */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pin size={14} className="text-emerald-500 fill-emerald-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Pinned Post</span>
            </div>
            {pinnedPost ? (
              <div
                onClick={() => setSelectedPost(pinnedPost)}
                className="cursor-pointer bg-white dark:bg-[#111111] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar pic={pinnedPost.authorPic} name={pinnedPost.authorName} size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">{pinnedPost.authorName}</div>
                    <div className="text-[10px] text-gray-400">{timeAgo(pinnedPost.createdAt)}</div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {pinnedPost.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 leading-relaxed">
                  {pinnedPost.content}
                </p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ArrowUp size={11} /> {pinnedPost.upVotes?.length || 0}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    <MessageCircle size={11} /> {pinnedPost.commentCount || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-4 text-center">
                <Pin size={22} className="text-gray-300 dark:text-gray-700 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 dark:text-gray-600">No pinned post</p>
              </div>
            )}
          </div>

          {/* Top Upvoted */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} className="text-orange-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Most Upvoted</span>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl overflow-hidden">
              {topUpvoted.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-600">No posts yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {topUpvoted.map((post, i) => {
                    const typeKey = (Array.isArray(post.types) ? post.types[0] : post.types)?.toLowerCase();
                    return (
                      <div
                        key={post._id}
                        onClick={() => setSelectedPost(post)}
                        className="flex items-start gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <div className="w-5 h-5 rounded-md bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-200 leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold">
                              <ArrowUp size={10} /> {post.upVotes?.length || 0}
                            </span>
                            {typeKey && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${TYPE_COLORS[typeKey] || "bg-gray-100 text-gray-500 border-transparent"}`}>
                                {typeKey}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Top Contributors */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Top Contributors</span>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl overflow-hidden">
              {topContributors.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-600">No data yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {topContributors.map((c, i) => (
                    <div key={c.name + i} className="flex items-center gap-3 p-3.5">
                      {/* Rank badge */}
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        i === 0 ? "bg-amber-400/20 text-amber-500" :
                        i === 1 ? "bg-gray-300/30 text-gray-500 dark:text-gray-400" :
                        i === 2 ? "bg-orange-400/20 text-orange-500" :
                        "bg-gray-100 dark:bg-white/[0.06] text-gray-400"
                      }`}>
                        {i + 1}
                      </div>
                      <Avatar pic={c.pic} name={c.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate">{c.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{c.posts} post{c.posts !== 1 ? "s" : ""}</span>
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold">
                            <ArrowUp size={9} /> {c.votes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Modals ── */}
      {isNewModalOpen && (
        <NewPostModal onClose={() => setIsNewModalOpen(false)} onSubmit={handleCreatePost} />
      )}
      {selectedPost && (
        <PostDetailModal
          post={posts.find((p) => p._id === selectedPost._id) || selectedPost}
          onClose={() => setSelectedPost(null)}
          onVoteToggle={handleVote}
          onPinToggle={handleTogglePin}
          currentUser={currentUser}
        />
      )}
      <DeleteConfirmModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={confirmDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
}
