import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, MapPin, GraduationCap, Eye, EyeOff,
  Save, RefreshCw, CheckCircle, AlertTriangle, Link2, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const INPUT_CLASS = "w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50";
const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const CARD_CLASS = "bg-white dark:bg-[#242424] border border-gray-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', gender: '', age: '', profilePic: '',
    country: '', state: '', city: '', college: '', public: true,
  });
  const [linked, setLinked] = useState({ codeforces: '', leetcode: '' });
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/settings/profile', { withCredentials: true });
        if (res.data.success) {
          const u = res.data.data;
          setForm({
            name: u.name || '',
            gender: u.gender || '',
            age: u.age || '',
            profilePic: u.profilePic || '',
            country: u.location?.country || '',
            state: u.location?.state || '',
            city: u.location?.city || '',
            college: u.college || '',
            public: u.preferences?.public ?? true,
          });
          setLinked(u.linkedAccounts || { codeforces: '', leetcode: '' });
          setEmail(u.email || '');
          setUsername(u.username || '');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.patch('/api/settings/profile', form, { withCredentials: true });
      if (res.data.success) {
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.data.message || 'Update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] flex justify-center items-center">
        <RefreshCw size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <SettingsIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile information and preferences</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">

          {/* ── Section 1: Personal Info ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={CARD_CLASS}>
            <div className="flex items-center gap-2 mb-5">
              <User size={18} className="text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Personal Information</h2>
            </div>

            {/* Avatar Preview */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-200 dark:border-indigo-500/30 flex-shrink-0">
                {form.profilePic ? (
                  <img src={form.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
                    {(form.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{form.name || 'Your Name'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">@{username}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Display Name</label>
                <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)}
                  placeholder="Your name" className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Profile Picture URL</label>
                <input type="url" value={form.profilePic} onChange={e => handleChange('profilePic', e.target.value)}
                  placeholder="https://example.com/avatar.jpg" className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Gender</label>
                <select value={form.gender} onChange={e => handleChange('gender', e.target.value)}
                  className={INPUT_CLASS}>
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Age</label>
                <input type="number" min="1" max="100" value={form.age} onChange={e => handleChange('age', e.target.value)}
                  placeholder="e.g. 21" className={INPUT_CLASS} />
              </div>
            </div>
          </motion.div>

          {/* ── Section 2: Location & Education ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={CARD_CLASS}>
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={18} className="text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Location & Education</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Country</label>
                <input type="text" value={form.country} onChange={e => handleChange('country', e.target.value)}
                  placeholder="e.g. India" className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>State / Province</label>
                <input type="text" value={form.state} onChange={e => handleChange('state', e.target.value)}
                  placeholder="e.g. Maharashtra" className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>City</label>
                <input type="text" value={form.city} onChange={e => handleChange('city', e.target.value)}
                  placeholder="e.g. Mumbai" className={INPUT_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  <span className="flex items-center gap-1"><GraduationCap size={14} /> College / University</span>
                </label>
                <input type="text" value={form.college} onChange={e => handleChange('college', e.target.value)}
                  placeholder="e.g. IIT Bombay" className={INPUT_CLASS} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Country and college are used for filtered leaderboard rankings.
            </p>
          </motion.div>

          {/* ── Section 3: Linked Accounts ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={CARD_CLASS}>
            <div className="flex items-center gap-2 mb-5">
              <Link2 size={18} className="text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Linked Accounts</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-black">CF</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Codeforces</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {linked.codeforces ? linked.codeforces : 'Not linked'}
                    </p>
                  </div>
                </div>
                {linked.codeforces ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <Link to="/verify-codeforces"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">
                    <Shield size={12} /> Link
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-lg border border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center">
                    <span className="text-white text-xs font-black">LC</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">LeetCode</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {linked.leetcode ? linked.leetcode : 'Not linked'}
                    </p>
                  </div>
                </div>
                {linked.leetcode ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <Link to="/verify-codeforces"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors">
                    <Shield size={12} /> Link
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── Section 4: Privacy ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={CARD_CLASS}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {form.public ? <Eye size={18} className="text-indigo-500" /> : <EyeOff size={18} className="text-gray-400" />}
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile Visibility</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {form.public
                      ? 'Your name and avatar are visible on leaderboards'
                      : 'You appear as "Anonymous" on leaderboards'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleChange('public', !form.public)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${form.public ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${form.public ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </motion.div>

          {/* ── Save Bar ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="flex items-center justify-between gap-4 pt-2 pb-8">
            <div className="flex-1">
              {success && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle size={14} /> {success}
                </motion.p>
              )}
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-red-600 font-medium">
                  <AlertTriangle size={14} /> {error}
                </motion.p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
