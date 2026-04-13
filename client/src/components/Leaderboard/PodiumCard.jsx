import React from 'react';
import { Medal, Award, Crown } from 'lucide-react';

export default function PodiumCard({ user, category, position, getPrimaryValue, getPrimaryLabel }) {
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
            <div className={`${c.size} rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl ring-2 ${c.ring}`}>
              {(user.name || user.username || 'A').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{user.name || user.username}</p>
        <p className="text-gray-400 text-xs truncate">@{user.username}</p>

        {/* Score */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>{label}</span>
          <span className="text-right text-xs text-gray-500">Rank</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          <span className="text-lg font-bold text-gray-300">#{user.rank}</span>
        </div>
      </div>
    </div>
  );
}
