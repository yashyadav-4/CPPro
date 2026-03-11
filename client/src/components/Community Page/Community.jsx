import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import "./Community.css";
import NewPostModal from "./NewPostModal";
import PostDetailModal from "./PostDetailModal";

const FILTERS = [
  "All",
  "Codeforces Discussion",
  "LeetCode Help",
  "General CP",
  "Algorithms",
  "Contest Recap",
];

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

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function Community() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Current user state for delete/vote checks
  const [currentUser, setCurrentUser] = useState(null); 

  useEffect(() => {
    // Fetch logged in user to check auth for voting UI
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/verify", {
          withCredentials: true,
        });
        if (res.data.authenticated && res.data.user) {
          setCurrentUser(res.data.user);
        }
      } catch (err) {
        console.error("Not authenticated");
      }
    };
    fetchUser();
  }, []); 

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 10;
      let url = `/api/posts?page=${page}&limit=${limit}`;
      
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }
      
      if (activeFilter !== "All") {
        url += `&tag=${encodeURIComponent(activeFilter)}`;
      }

      const res = await axios.get(url, { withCredentials: true });
      if (Array.isArray(res.data)) {
        setPosts(res.data);
        // Backend API doesn't compute totalPages, simply showing page logic context
        setTotalPages(res.data.length === limit ? page + 1 : page);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (postId, type) => {
    try {
      // Optimistically update
      if (!currentUser) return; // Prevent vote if not logged in visually
      const userId = currentUser._id;
      
      setPosts(currentPosts => currentPosts.map(p => {
        if (p._id === postId) {
          const isUpvote = type === "upvote";
          let newUpvotes = [...(p.upVotes || [])];
          let newDownvotes = [...(p.downVotes || [])];
          
          if (isUpvote) {
             if (newUpvotes.includes(userId)) {
                 newUpvotes = newUpvotes.filter(id => id !== userId);
             } else {
                 newUpvotes.push(userId);
                 newDownvotes = newDownvotes.filter(id => id !== userId);
             }
          } else {
             if (newDownvotes.includes(userId)) {
                 newDownvotes = newDownvotes.filter(id => id !== userId);
             } else {
                 newDownvotes.push(userId);
                 newUpvotes = newUpvotes.filter(id => id !== userId);
             }
          }
          
          return {
             ...p,
             upVotes: newUpvotes,
             downVotes: newDownvotes
          };
        }
        return p;
      }));

      await axios.patch(
        `/api/posts/${postId}/${type}`,
        {},
        { withCredentials: true }
      );
      
      // Refresh to get exact real counts
      fetchPosts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to vote. Check console.";
      console.error(`Failed to ${type}:`, error);
      alert(errorMessage);
      fetchPosts(); // revert on fail
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      await axios.post("/api/posts", postData, {
        withCredentials: true,
      });
      setIsNewModalOpen(false);
      setPage(1);
      fetchPosts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create post. Check console.";
      console.error("Failed to create post:", error);
      alert(errorMessage);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/posts/${postId}`, {
        withCredentials: true,
      });
      fetchPosts();
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  return (
    <div className="community-page">
      {/* ── Section 1: Header ── */}
      <div className="community-header">
        <div className="community-header-text">
          <h1>Global CPTracker Community</h1>
          <p>
            Discuss, share insights, and find help on competitive programming
            problems, contests, and algorithms.
          </p>
        </div>
        <button 
          className="btn-new-discussion" 
          onClick={() => setIsNewModalOpen(true)}
        >
          <Plus size={16} /> New Discussion
        </button>
      </div>

      {/* ── Section 2: Controls ── */}
      <div className="community-controls">
        <div className="community-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search discussions, questions, or tags..."
            value={search}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-pill${activeFilter === f ? " active" : ""}`}
              onClick={() => {
                 setActiveFilter(f);
                 setPage(1); // reset to page 1 on filter
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 3: Post Cards ── */}
      {loading && posts.length === 0 ? (
        <div className="community-loading">Loading discussions...</div>
      ) : posts.length === 0 ? (
        <div className="community-empty">No discussions found matching your criteria.</div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <div className="post-card" key={post._id}>
              {/* Card header */}
              <div className="post-user-info">
                {/* Randomize avatars purely for visual variety if needed, or use default */}
                <div className={`post-avatar av-${(post._id.charCodeAt(post._id.length-1) % 4) + 1}`} />
                <span className="post-username">{post.authorName || "Anonymous"}</span>
                {post.types && (
                    <span className={`post-platform platform-general`} style={{ textTransform: 'capitalize' }}>
                      {Array.isArray(post.types) ? post.types[0] : post.types}
                    </span>
                )}
                
                <span className="post-time">{timeAgo(post.createdAt)}</span>
              </div>

              {/* Card body */}
              <h3 className="post-title">{post.title}</h3>
              <p className="post-snippet">
                {post.content.length > 150 
                  ? post.content.substring(0, 150) + "..." 
                  : post.content}
              </p>
              
              <div className="post-tags">
                {post.tags && post.tags.map((t) => (
                  <span className="post-tag" key={t}>{t}</span>
                ))}
              </div>

              {/* Card footer */}
              <div className="post-footer">
                <button 
                   className={`post-metric vote-btn ${post.upVotes?.includes(currentUser?._id) ? 'active' : ''}`}
                   onClick={() => handleVote(post._id, 'upvote')}
                   title="Upvote"
                >
                  <ArrowUp size={14} /> {post.upVotes?.length || 0}
                </button>
                <button 
                   className={`post-metric vote-btn ${post.downVotes?.includes(currentUser?._id) ? 'active' : ''}`}
                   onClick={() => handleVote(post._id, 'downvote')}
                   title="Downvote"
                >
                  <ArrowDown size={14} /> {post.downVotes?.length || 0}
                </button>
                <span className="post-metric">
                  <MessageCircle size={14} /> {post.commentCount || 0}
                </span>
                {currentUser && post.authorId === currentUser._id && (
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDeletePost(post._id)}
                  >
                    Delete
                  </button>
                )}
                <button 
                  className="post-join" 
                  onClick={() => setSelectedPost(post)}
                >
                  Join Discussion →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section 4: Pagination ── */}
      {!loading && posts.length > 0 && totalPages > 1 && (
        <div className="community-pagination">
          <button 
            className="page-btn page-arrow"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={16} />
          </button>
          
          {/* Simple basic pagination display */}
          {[...Array(totalPages)].map((_, i) => (
            <button 
               key={i+1}
               className={`page-btn ${page === i + 1 ? 'active' : ''}`}
               onClick={() => setPage(i+1)}
            >
               {i + 1}
            </button>
          ))}
          
          <button 
             className="page-btn page-arrow"
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             disabled={page === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      {isNewModalOpen && (
        <NewPostModal 
          onClose={() => setIsNewModalOpen(false)} 
          onSubmit={handleCreatePost} 
        />
      )}

      {selectedPost && (
        <PostDetailModal 
           post={posts.find(p => p._id === selectedPost._id) || selectedPost} 
           onClose={() => setSelectedPost(null)}
           onVoteToggle={handleVote}
           currentUser={currentUser}
        />
      )}
    </div>
  );
}
