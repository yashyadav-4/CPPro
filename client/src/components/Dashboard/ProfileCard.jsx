import { User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileCard({ profile }) {
  const user = profile?.user;
  const platform = profile?.platforms?.[0];

  const currentRating = platform?.currentRating || 0;
  const maxRating = platform?.maxRating || 0;
  const currentRank = platform?.currentRank || 'Unrated';
  const upvotes = profile?.upvotes || 0;

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0 }}
    >
      <div className="flex items-center gap-4 mb-4 mt-2">
        {user?.profilePic ? (
          <img src={user.profilePic} alt="avatar" className="w-14 h-14 rounded-full border border-gray-200 object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400">
            <User size={28} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">
            {user?.name || 'User'}
          </h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {currentRank}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Current Rating</p>
          <p className="text-2xl font-bold text-gray-900">{currentRating}</p>
        </div>
        <div className="w-px bg-gray-200"></div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Max Rating</p>
          <p className="text-2xl font-bold text-green-600">{maxRating}</p>
        </div>
        <div className="w-px bg-gray-200"></div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Upvotes</p>
          <p className={`text-2xl font-bold ${upvotes > 0 ? 'text-green-600' : upvotes < 0 ? 'text-red-600' : 'text-gray-900'}`}>{upvotes > 0 ? `+${upvotes}` : upvotes}</p>
        </div>
      </div>
    </motion.div>
  );
}
