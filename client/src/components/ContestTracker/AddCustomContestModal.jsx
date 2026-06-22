import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Link as LinkIcon, Edit3 } from 'lucide-react';
import axios from 'axios';

export default function AddCustomContestModal({ isOpen, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('custom');
  const [url, setUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!name || !startDate || !startTime) {
        throw new Error('Name, date, and time are required.');
      }

      const startDateTime = new Date(`${startDate}T${startTime}`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error('Invalid date or time.');
      }

      const payload = {
        name,
        platform,
        url,
        startTime: startDateTime.toISOString(),
        duration: duration ? parseInt(duration, 10) : null
      };

      const res = await axios.post('/api/contests/custom', payload, { withCredentials: true });
      onAdded(res.data);
      onClose();
      // Reset form
      setName('');
      setPlatform('custom');
      setUrl('');
      setStartDate('');
      setStartTime('');
      setDuration('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Add Custom Contest
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg p-1.5"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Contest Name *
            </label>
            <div className="relative">
              <Edit3 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Luogu Div 2, VJudge Practice..."
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Start Date *
              </label>
              <div className="relative">
                <CalendarIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                Start Time *
              </label>
              <div className="relative">
                <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all [&::-webkit-calendar-picker-indicator]:dark:invert"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g. 120"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Contest URL
            </label>
            <div className="relative">
              <LinkIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/20"
            >
              {submitting ? 'Adding...' : 'Add Contest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
