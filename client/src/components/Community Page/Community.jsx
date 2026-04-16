import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import axios from "axios";
import NewPostModal from "./NewPostModal";
import PostDetailModal from "./PostDetailModal";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

const FILTERS = [
  "All",
  "Codeforces Discussion",
  "LeetCode Help",
  "General CP",
  "Algorithms",
  "Contest Recap",
];

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
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);

  useEffect(() => {
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
        setTotalPages(res.data.length === limit ? page + 1 : page);
        localStorage.setItem('community_posts', JSON.stringify(res.data));
      }
    } catch (error) {
      console.log("Using localStorage fallback for fetching posts");
      const localPosts = JSON.parse(localStorage.getItem('community_posts') || '[]');
      
      // Basic local filtering
      let filtered = [...localPosts];
      if (activeFilter !== "All") {
          filtered = filtered.filter(p => 
             Array.isArray(p.tags) ? p.tags.includes(activeFilter.toLowerCase()) : 
             (p.types === activeFilter.toLowerCase())
          );
      }
      if (debouncedSearch) {
          filtered = filtered.filter(p => 
              p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
              p.content.toLowerCase().includes(debouncedSearch.toLowerCase())
          );
      }

      setPosts(filtered);
      setTotalPages(1); // Simple fallback pagination
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (postId, type) => {
    const currentUserId = currentUser?._id || "localUser";
    
    // Optimistic Update
    setPosts(currentPosts => currentPosts.map(p => {
      if (p._id === postId) {
        const isUpvote = type === "upvote";
        let newUpvotes = [...(p.upVotes || [])];
        let newDownvotes = [...(p.downVotes || [])];
        
        if (isUpvote) {
            if (newUpvotes.includes(currentUserId)) {
                newUpvotes = newUpvotes.filter(id => id !== currentUserId);
            } else {
                newUpvotes.push(currentUserId);
                newDownvotes = newDownvotes.filter(id => id !== currentUserId);
            }
        } else {
            if (newDownvotes.includes(currentUserId)) {
                newDownvotes = newDownvotes.filter(id => id !== currentUserId);
            } else {
                newDownvotes.push(currentUserId);
                newUpvotes = newUpvotes.filter(id => id !== currentUserId);
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

    try {
      await axios.patch(`/api/posts/${postId}/${type}`, {}, { withCredentials: true });
      fetchPosts();
    } catch (error) {
      console.log("Fallback to localStorage voting");
      
      // Update local storage as well
      const localPosts = JSON.parse(localStorage.getItem('community_posts') || '[]');
      const updatedLocal = localPosts.map(p => {
          if (p._id === postId) {
              const isUpvote = type === "upvote";
              let newUpvotes = [...(p.upVotes || [])];
              let newDownvotes = [...(p.downVotes || [])];
              if (isUpvote) {
                  if (newUpvotes.includes(currentUserId)) newUpvotes = newUpvotes.filter(id => id !== currentUserId);
                  else { newUpvotes.push(currentUserId); newDownvotes = newDownvotes.filter(id => id !== currentUserId); }
              } else {
                  if (newDownvotes.includes(currentUserId)) newDownvotes = newDownvotes.filter(id => id !== currentUserId);
                  else { newDownvotes.push(currentUserId); newUpvotes = newUpvotes.filter(id => id !== currentUserId); }
              }
              return { ...p, upVotes: newUpvotes, downVotes: newDownvotes };
          }
          return p;
      });
      localStorage.setItem('community_posts', JSON.stringify(updatedLocal));
      
      // Update selectedPost if open
      if (selectedPost && selectedPost._id === postId) {
         setSelectedPost(updatedLocal.find(p => p._id === postId));
      }
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      await axios.post("/api/posts", postData, {
        withCredentials: true,
      });
      setIsNewModalOpen(false);
      setActiveFilter("All");
      setPage(1);
      fetchPosts();
    } catch (error) {
      console.log("Fallback to localStorage creation");
      const newPost = {
          ...postData,
          _id: Date.now().toString(),
          authorName: currentUser?.name || "CurrentUser",
          authorId: currentUser?._id || "localUser",
      };
      const localPosts = JSON.parse(localStorage.getItem('community_posts') || '[]');
      const updated = [newPost, ...localPosts];
      localStorage.setItem('community_posts', JSON.stringify(updated));
      setIsNewModalOpen(false);
      fetchPosts();
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    const postId = postToDelete;
    try {
      await axios.delete(`/api/posts/${postId}`, {
        withCredentials: true,
      });
      fetchPosts();
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(null);
      }
    } catch (error) {
      console.log("Fallback to localStorage deletion");
      const localPosts = JSON.parse(localStorage.getItem('community_posts') || '[]');
      const updated = localPosts.filter(p => p._id !== postId);
      localStorage.setItem('community_posts', JSON.stringify(updated));
      if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(null);
      }
      fetchPosts();
    } finally {
      setPostToDelete(null);
    }
  };

  const handleDeletePost = (postId) => {
    setPostToDelete(postId);
  };

  const currentUserId = currentUser?._id || "localUser";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Global CPPro Community</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Discuss, share insights, and find help on competitive programming problems, contests, and algorithms.</p>
          </div>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors flex-shrink-0"
          >
            <Plus size={18} /> New Discussion
          </button>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search discussions, questions, or tags..."
              value={search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/[0.12] rounded-lg leading-5 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeFilter === f 
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                  : "bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-200 border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/10"
                }`}
                onClick={() => {
                  setActiveFilter(f);
                  setPage(1);
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Area */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-2xl h-64 p-6 flex flex-col justify-between">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-200 dark:bg-[#0a0a0a] rounded-full" />
                         <div className="w-24 h-4 bg-gray-200 dark:bg-[#0a0a0a] rounded" />
                     </div>
                     <div className="space-y-3 mt-4">
                         <div className="w-3/4 h-6 bg-gray-200 dark:bg-[#0a0a0a] rounded" />
                         <div className="w-full h-4 bg-gray-200 dark:bg-[#0a0a0a] rounded" />
                         <div className="w-5/6 h-4 bg-gray-200 dark:bg-[#0a0a0a] rounded" />
                     </div>
                    <div className="w-full h-8 bg-gray-200 dark:bg-[#0a0a0a] rounded mt-6" />
                  </div>
              ))}
          </div>
        ) : posts.length === 0 ? (
           <div className="bg-white dark:bg-[#111111] border text-center border-gray-200 dark:border-white/[0.08] rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-gray-100 dark:bg-[#0a0a0a] rounded-full flex items-center justify-center text-gray-400 mb-4">
                <MessageCircle size={32} />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No discussions found</h3>
             <p className="text-gray-500 dark:text-gray-400 max-w-sm">We couldn't find any discussions matching your criteria. Try adjusting your filters or search term, or start a new discussion!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {posts.map((post) => {
               const upvoted = post.upVotes?.includes(currentUserId);
               const downvoted = post.downVotes?.includes(currentUserId);
               const voteScore = (post.upVotes?.length || 0) - (post.downVotes?.length || 0);

               return (
                <div 
                   className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer" 
                   key={post._id}
                   onClick={() => setSelectedPost(post)}
                >
                  <div>
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {/* Initials avatar or mock image */}
                            {post.authorPic ? (
                                <img src={post.authorPic} alt={post.authorName} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-white border border-emerald-200" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-purple-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 text-sm shadow-sm ring-2 ring-white">
                                    {(post.authorName || "?")[0].toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{post.authorName || "Anonymous"}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{timeAgo(post.createdAt)}</div>
                            </div>
                          </div>
                      </div>

                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {post.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {post.types && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                              {Array.isArray(post.types) ? post.types[0] : post.types}
                            </span>
                        )}
                        {post.tags && post.tags.slice(0, 3).map((t) => (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08] uppercase tracking-wide" key={t}>
                              #{t}
                          </span>
                        ))}
                        {post.tags && post.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08]">
                                +{post.tags.length - 3}
                            </span>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 line-clamp-3">
                        {post.content}
                      </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/[0.08] mt-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] rounded-full p-1">
                            <button 
                               className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${upvoted ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200'}`}
                               onClick={(e) => { e.stopPropagation(); handleVote(post._id, 'upvote'); }}
                               title="Upvote"
                            >
                              <ArrowUp size={14} /> 
                            </button>
                            <span className={`text-xs font-bold min-w-[20px] text-center ${upvoted ? 'text-emerald-600 dark:text-emerald-400' : downvoted ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {voteScore}
                            </span>
                            <button 
                               className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${downvoted ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200'}`}
                               onClick={(e) => { e.stopPropagation(); handleVote(post._id, 'downvote'); }}
                               title="Downvote"
                            >
                              <ArrowDown size={14} /> 
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium text-xs px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-white/10">
                          <MessageCircle size={15} /> 
                          {post.commentCount || 0}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {currentUserId === post.authorId && (
                          <button 
                            className="text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-md transition-colors" 
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post._id); }}
                          >
                            Delete
                          </button>
                        )}
                        <button 
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:text-emerald-800 transition-colors bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md"
                          onClick={() => setSelectedPost(post)}
                        >
                          Join <TrendingUp size={12} className="ml-1 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </button>
                    </div>
                  </div>
                </div>
            )})}
          </div>
        )}

        {/* Pagination placeholder, visible only if multiple pages exist */}
        {!loading && posts.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={18} />
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button 
                 key={i+1}
                 className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                     page === i + 1 
                     ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm' 
                     : 'bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/10'
                 }`}
                 onClick={() => setPage(i+1)}
              >
                 {i + 1}
              </button>
            ))}
            
            <button 
               className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page === totalPages}
            >
              <ChevronRight size={18} />
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

        <DeleteConfirmModal 
          isOpen={!!postToDelete}
          onClose={() => setPostToDelete(null)}
          onConfirm={confirmDeletePost}
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
        />
      </div>
    </div>
  );
}
