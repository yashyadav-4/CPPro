import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, AlertTriangle, RefreshCw, ChevronDown, Crown, Eye, EyeOff } from 'lucide-react';

const CATEGORIES = [
  { key: 'cpscore', label: 'CPScore', icon: '🏆' },
  { key: 'totalQuestions', label: 'Total Questions', icon: '📝' },
  { key: 'leetcodeRating', label: 'Leetcode Rating', icon: '💡' },
  { key: 'codeforcesRating', label: 'Codeforces Rating', icon: '⚡' },
];

const SCOPES = [
  { key: 'global', label: 'Global' },
  { key: 'country', label: 'Country' },
  { key: 'college', label: 'College' },
];

const CATEGORY_VALUE_MAP = {
  cpscore: 'cpScore',
  totalQuestions: 'totalSolved',
  leetcodeRating: 'lcRating',
  codeforcesRating: 'cfRating',
};

function getPrimaryValue(user, category) {
  const field = CATEGORY_VALUE_MAP[category] || 'cpScore';
  return user[field] ?? 0;
}

function getPrimaryLabel(category) {
  return CATEGORIES.find(c => c.key === category)?.label || 'CPScore';
}

// ── Podium Card ──
function PodiumCard({ user, category, position }) {
  if (!user) return null;

  const value = getPrimaryValue(user, category);
  const label = getPrimaryLabel(category);

  const configs = {
    1: {
      border: 'border-yellow-500/60',
      bg: 'bg-gradient-to-b from-yellow-500/10 to-transparent',
      badge: 'bg-yellow-500 text-black',
      size: 'w-20 h-20',
      ring: 'ring-yellow-500/50',
      order: 'order-2',
      mt: '-mt-4',
      medalIcon: <Crown size={24} className="text-yellow-400" />,
    },
    2: {
      border: 'border-gray-400/40',
      bg: 'bg-gradient-to-b from-gray-400/10 to-transparent',
      badge: 'bg-gray-400 text-black',
      size: 'w-16 h-16',
      ring: 'ring-gray-400/50',
      order: 'order-1',
      mt: 'mt-4',
      medalIcon: <Medal size={20} className="text-gray-300" />,
    },
    3: {
      border: 'border-orange-500/40',
      bg: 'bg-gradient-to-b from-orange-500/10 to-transparent',
      badge: 'bg-orange-600 text-white',
      size: 'w-16 h-16',
      ring: 'ring-orange-500/50',
      order: 'order-3',
      mt: 'mt-4',
      medalIcon: <Award size={20} className="text-orange-400" />,
    },
  };

  const c = configs[position] || configs[3];

  return (
    <div className={`${c.order} ${c.mt} flex flex-col items-center px-4`}>
      <div className={`relative rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm p-6 w-52 text-center transition-all hover:scale-105 duration-300`}>
        {/* Rank badge */}
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${c.badge} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
          {c.medalIcon} #{user.rank}
        </div>

        {/* Avatar */}
        <div className="flex justify-center mt-2 mb-3">
          {user.profilePic ? (
            <img
              className={`${c.size} rounded-full object-cover ring-2 ${c.ring}`}
              src={user.profilePic}
              alt={user.username}
            />
          ) : (
            <div className={`${c.size} rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-2xl ring-2 ${c.ring}`}>
              {(user.name || user.username || 'A').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <p className="text-white font-semibold text-sm truncate">{user.name || user.username}</p>
        <p className="text-gray-400 text-xs truncate">@{user.username}</p>

        {/* Score */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>{label}</span>
          <span className="text-right text-xs text-gray-500">Rank</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          <span className="text-lg font-bold text-gray-300">#{user.rank}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function LeaderBoard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [category, setCategory] = useState('cpscore');
  const [scope, setScope] = useState('global');
  const [scopeOpen, setScopeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/leaderboard?scope=${scope}&category=${category}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setLeaderboard(response.data.data.leaderboard || []);
        setCurrentUser(response.data.data.currentUser || null);
      } else {
        setError(response.data.message || "Failed to fetch leaderboard data.");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.response?.data?.message || "An error occurred while fetching the leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [scope, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Top 3 for podium
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="max-w-5xl w-full space-y-4">
          <div className="h-10 bg-[#1a1a1a] animate-pulse rounded w-1/3 mb-8"></div>
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 w-48 bg-[#1a1a1a] animate-pulse rounded-2xl"></div>
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#1a1a1a] animate-pulse rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col justify-center items-center p-6">
        <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl p-8 max-w-md w-full shadow-sm text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            onClick={fetchLeaderboard}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Leaderboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-16">
          {/* ── Category Tabs ── */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  category === cat.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#242424] hover:text-gray-200 border border-white/[0.06]'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* ── Scope Dropdown ── */}
          <div className="relative inline-block">
            <button
              onClick={() => setScopeOpen(!scopeOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-sm text-gray-300 hover:bg-[#242424] transition-colors"
            >
              {SCOPES.find(s => s.key === scope)?.label || 'Global'}
              <ChevronDown size={14} className={`transition-transform ${scopeOpen ? 'rotate-180' : ''}`} />
            </button>
            {scopeOpen && (
              <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-white/[0.08] rounded-lg shadow-xl z-50 min-w-[120px] overflow-hidden">
                {SCOPES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setScope(s.key);
                      setScopeOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      scope === s.key
                        ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                        : 'text-gray-400 hover:bg-[#242424] hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Top 3 Podium ── */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end mb-10 gap-2">
            {/* Render in order: #2, #1, #3 */}
            {top3[1] && <PodiumCard user={top3[1]} category={category} position={2} />}
            {top3[0] && <PodiumCard user={top3[0]} category={category} position={1} />}
            {top3[2] && <PodiumCard user={top3[2]} category={category} position={3} />}
          </div>
        )}

        {/* ── My Rank Banner (Privacy Notice) ── */}
        {currentUser && (
          <div className="mb-6">
            <div className="text-center text-xs text-gray-500 mb-2 flex items-center justify-center gap-1">
              {currentUser.isPublic ? (
                <><Eye size={12} /> Your profile is public</>
              ) : (
                <><EyeOff size={12} /> Your profile is private — Others can see you as <strong className="text-white">Anonymous</strong> on leaderboard</>
              )}
            </div>
            <div className="relative bg-gradient-to-r from-indigo-600/20 via-[#1a1a1a] to-indigo-600/20 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-4 overflow-hidden">
              {/* Corner Ribbon */}
              <div className="absolute top-0 left-0 bg-indigo-600 text-[10px] font-bold px-3 py-1 text-white uppercase tracking-wider rounded-br-lg z-10">
                My Rank
              </div>
              <div className="flex-shrink-0 relative z-20 mt-2">
                {currentUser.profilePic ? (
                  <img className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-500/50" src={currentUser.profilePic} alt="" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl ring-2 ring-indigo-500/50">
                    {(currentUser.name || currentUser.username || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{currentUser.name || currentUser.username}</p>
                <p className="text-gray-400 text-sm truncate">@{currentUser.username}</p>
              </div>
              <div className="text-right flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500">{getPrimaryLabel(category)}</p>
                  <p className="text-xl font-black text-white">{getPrimaryValue(currentUser, category).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{scope === 'global' ? 'Global Rank' : 'Rank'}</p>
                  <p className="text-xl font-black text-indigo-400">#{currentUser.rank}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Leaderboard Table (ranks 4+) ── */}
        {rest.length > 0 && (
          <div className="bg-[#141414] rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-[#0D0D0D] border-b border-white/[0.06] text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center w-16">#</th>
                  <th className="px-4 py-3 font-semibold text-left">User</th>
                  <th className="px-4 py-3 font-semibold text-right">CP Score</th>
                  <th className="px-4 py-3 font-semibold text-right">CF Rating</th>
                  <th className="px-4 py-3 font-semibold text-right">LC Rating</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Solved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rest.map((user) => (
                  <tr key={user._id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500 font-semibold text-sm">{user.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-9 w-9">
                          {user.profilePic ? (
                            <img className="h-9 w-9 rounded-full object-cover border border-white/[0.1]" src={user.profilePic} alt={user.username} />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-400/30">
                              {(user.name || user.username || 'A').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-100">{user.name || user.username}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold ${category === 'cpscore' ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {user.cpScore?.toLocaleString() || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${category === 'codeforcesRating' ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {user.cfRating || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${category === 'leetcodeRating' ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {user.lcRating || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${category === 'totalQuestions' ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {user.totalSolved || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {leaderboard.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Trophy size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No users found</p>
            <p className="text-sm">No one has made it to the {SCOPES.find(s => s.key === scope)?.label || 'Global'} leaderboard yet.</p>
          </div>
        )}

        {/* Score formula */}
        <div className="mt-6 p-4 bg-[#141414] rounded-lg border border-white/[0.06]">
          <p className="text-xs text-gray-500 text-center">
            <strong>Score Formula:</strong> (CF Rating × 1.5) + (LC Rating × 1.2) + Difficulty Weighting + Contest Bonus + Max Rating Bonus + Streak Bonus
          </p>
        </div>
      </div>
    </div>
  );
}