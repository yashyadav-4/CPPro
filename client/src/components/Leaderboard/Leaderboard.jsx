import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, AlertTriangle, RefreshCw, Award } from 'lucide-react';

export default function LeaderBoard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = { withCredentials: true };
      const response = await axios.get('/api/leaderboard', config);
      if (response.data.success) {
        setLeaderboard(response.data.data);
      } else {
        setError("Failed to fetch leaderboard data.");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err.response?.data?.message || "An error occurred while fetching the leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-500 mx-auto"><Trophy size={18} /></div>;
    if (rank === 2) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 mx-auto"><Medal size={18} /></div>;
    if (rank === 3) return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-500 mx-auto"><Award size={18} /></div>;
    return <span className="text-gray-500 font-semibold">{rank}</span>;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return "bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400 dark:border-l-yellow-500";
    if (rank === 2) return "bg-gray-50/50 dark:bg-gray-800/50 border-l-4 border-l-gray-300 dark:border-l-gray-500";
    if (rank === 3) return "bg-orange-50/50 dark:bg-orange-900/10 border-l-4 border-l-orange-400 dark:border-l-orange-500";
    return "border-l-4 border-l-transparent hover:bg-gray-50 transition-colors";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="max-w-6xl w-full space-y-4">
          <div className="h-10 bg-gray-200 animate-pulse rounded w-1/4 mb-8"></div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-gray-200 animate-pulse rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white border text-center border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Trophy className="text-indigo-600" size={32} />
            Global Leaderboard
          </h1>
          <p className="text-gray-500 mt-2">Top performers ranked by CPPro Score — combining Codeforces &amp; LeetCode stats</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4 font-semibold text-center w-20">Rank</th>
                  <th className="px-5 py-4 font-semibold text-left">User</th>
                  <th className="px-5 py-4 font-semibold text-right">CP Score</th>
                  <th className="px-5 py-4 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>CF Rating
                    </span>
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>CF Solved
                    </span>
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>LC Rating
                    </span>
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>LC Solved
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.length > 0 ? (
                  leaderboard.map((user) => (
                    <tr key={user._id} className={`${getRankClass(user.rank)}`}>
                      <td className="px-5 py-4 text-center">
                        {getRankBadge(user.rank)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profilePic ? (
                              <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={user.profilePic} alt={user.username} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name || user.username}</div>
                            <div className="text-sm text-gray-500">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 inline-block px-3 py-1 rounded-lg">
                          {user.cpScore}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">{user.cfRating || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm text-gray-600">{user.cfSolved || 0}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">{user.lcRating || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="text-sm text-gray-600">{user.lcSolved || 0}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No users found on the leaderboard yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score formula explanation */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            <strong>Score Formula:</strong> (CF Rating × 1.5) + (LC Rating × 1.2) + Difficulty Weighting + Contest Bonus + Max Rating Bonus + Streak Bonus
          </p>
        </div>
      </div>
    </div>
  );
}