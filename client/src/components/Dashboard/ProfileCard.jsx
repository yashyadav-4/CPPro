import { User } from 'lucide-react';
import { motion } from 'framer-motion';

const RANK_CLASS_MAP = {
  newbie: 'rank-newbie',
  pupil: 'rank-pupil',
  specialist: 'rank-specialist',
  expert: 'rank-expert',
  'candidate master': 'rank-candidate',
  master: 'rank-master',
  'international master': 'rank-international',
  grandmaster: 'rank-grandmaster',
  'international grandmaster': 'rank-grandmaster',
  'legendary grandmaster': 'rank-legendary',
  unrated: 'rank-unrated',
};

function getRankClass(rank) {
  if (!rank) return 'rank-unrated';
  return RANK_CLASS_MAP[rank.toLowerCase()] || 'rank-unrated';
}

export default function ProfileCard({ profile }) {
  const user = profile?.user;
  const platform = profile?.platforms?.[0]; // first linked platform

  const currentRating = platform?.currentRating || 0;
  const maxRating = platform?.maxRating || 0;
  const currentRank = platform?.currentRank || 'unrated';

  return (
    <motion.div
      className="glass-card profile-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0 }}
    >
      <div className="profile-avatar-section">
        {user?.profilePic ? (
          <img src={user.profilePic} alt="avatar" className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            <User size={28} />
          </div>
        )}
        <span className={`rank-badge ${getRankClass(currentRank)}`}>
          {currentRank}
        </span>
      </div>

      <div className="profile-ratings">
        <div className="profile-rating-item">
          <span className="profile-rating-label">Current</span>
          <span className="profile-rating-value current">{currentRating}</span>
        </div>
        <div className="profile-rating-item">
          <span className="profile-rating-label">Max</span>
          <span className="profile-rating-value max">{maxRating}</span>
        </div>
      </div>
    </motion.div>
  );
}
