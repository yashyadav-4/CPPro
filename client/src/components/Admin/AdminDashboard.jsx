import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Users, UserCheck, Activity, RefreshCw, Server,
  TrendingUp, MessageSquare, Shield, Zap, Database,
  Code2, Globe, GraduationCap, Clock, CheckCircle,
  AlertCircle, Target, Bell, Send, ChevronDown,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n == null) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
};

const timeAgo = (iso) => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/5 rounded ${className}`} />
);

// ── Custom recharts tooltip ───────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden hover:bg-white/[0.05] transition-all">
      <div
        className="absolute top-0 right-0 w-20 h-20 blur-[35px] opacity-10 pointer-events-none"
        style={{ background: color }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
          {loading ? (
            <Sk className="h-8 w-24 mb-1" />
          ) : (
            <p className="text-2xl font-bold text-white font-mono tracking-tight">{value}</p>
          )}
          {sub && !loading && (
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{sub}</p>
          )}
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22` }}
        >
          <Icon size={17} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ── Mini bar list ─────────────────────────────────────────────────────────────
function BarList({ items, color }) {
  if (!items?.length) return <p className="text-gray-600 text-xs py-4 text-center">No data</p>;
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-4 text-right flex-shrink-0 font-mono">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-gray-300 truncate font-medium">{item.label}</span>
              <span className="text-gray-500 ml-2 flex-shrink-0">{item.count}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.count / max) * 100}%`, background: color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Notification type options ─────────────────────────────────────────────────
const NOTIF_TYPES = [
  { value: 'general',          label: 'General' },
  { value: 'rating_milestone', label: 'Rating Milestone' },
  { value: 'streak_milestone', label: 'Streak Milestone' },
  { value: 'daily_problem',    label: 'Daily Problem' },
  { value: 'sync_failed',      label: 'Sync Failed' },
];

// ── Send Notification Panel ───────────────────────────────────────────────────
function SendNotificationPanel() {
  const [targetType, setTargetType] = useState('all');
  const [targetQuery, setTargetQuery]   = useState('');
  const [notifType, setNotifType]   = useState('general');
  const [title, setTitle]           = useState('');
  const [message, setMessage]       = useState('');
  const [actionUrl, setActionUrl]   = useState('');
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({ ok: false, text: 'Title and message are required.' });
      return;
    }
    if (targetType === 'user' && !targetQuery.trim()) {
      setResult({ ok: false, text: 'Enter a username or email for targeted send.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const isEmail = targetQuery.includes('@');
      const body = {
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        actionUrl: actionUrl.trim() || null,
        targetType,
        ...(targetType === 'user' && (isEmail
          ? { targetEmail: targetQuery.trim() }
          : { targetUsername: targetQuery.trim() }
        )),
      };
      const res = await fetch(`${API_BASE}/api/admin/notify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setResult({ ok: json.success, text: json.message });
      if (json.success) {
        setTitle('');
        setMessage('');
        setActionUrl('');
        setTargetQuery('');
      }
    } catch {
      setResult({ ok: false, text: 'Network error — could not send.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={14} className="text-emerald-400" />
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Send Notification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left column — content */}
        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Notification title…"
              maxLength={120}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Notification body…"
              rows={3}
              maxLength={500}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />
          </div>

          {/* Action URL */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Action URL <span className="text-gray-600 normal-case">(optional)</span></label>
            <input
              type="text"
              value={actionUrl}
              onChange={e => setActionUrl(e.target.value)}
              placeholder="/settings, /dashboard, …"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Right column — targeting */}
        <div className="space-y-3">
          {/* Type */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Type</label>
            <div className="relative">
              <select
                value={notifType}
                onChange={e => setNotifType(e.target.value)}
                className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 transition-colors pr-8"
              >
                {NOTIF_TYPES.map(t => (
                  <option key={t.value} value={t.value} className="bg-[#111]">{t.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">Target</label>
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs mb-3">
              {[{ v: 'all', l: 'All Users' }, { v: 'user', l: 'Specific User' }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => { setTargetType(v); setTargetQuery(''); setResult(null); }}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                    targetType === v ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {targetType === 'user' && (
              <input
                type="text"
                value={targetQuery}
                onChange={e => setTargetQuery(e.target.value)}
                placeholder="Username or email address…"
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg transition-all disabled:opacity-50 mt-auto"
          >
            <Send size={13} className={sending ? 'animate-pulse' : ''} />
            {sending ? 'Sending…' : targetType === 'all' ? 'Broadcast to All' : 'Send to User'}
          </button>

          {result && (
            <p className={`text-[11px] px-3 py-2 rounded-lg ${result.ok ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
              {result.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [forcing, setForcing] = useState({ contests: false, stats: false });
  const [forceMsg, setForceMsg] = useState({ contests: null, stats: null });

  const fetchStats = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats?days=${d}`, { credentials: 'include' });
      if (res.status === 403) { setError('Access denied — admin only.'); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Unknown error');
      setData(json);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(days); }, [days, fetchStats]);

  const forceRefresh = useCallback(async (type) => {
    setForcing(prev => ({ ...prev, [type]: true }));
    setForceMsg(prev => ({ ...prev, [type]: null }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/refresh/${type}`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      setForceMsg(prev => ({
        ...prev,
        [type]: { ok: json.success, text: json.message },
      }));
    } catch {
      setForceMsg(prev => ({ ...prev, [type]: { ok: false, text: 'Network error' } }));
    } finally {
      setForcing(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  const ov = data?.overview || {};
  const gr = data?.growth || {};
  const ts = data?.timeSeries || {};
  const dist = data?.distributions || {};
  const meta = data?.serverMeta || {};

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Shield size={18} className="text-emerald-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            </div>
            <p className="text-xs text-gray-500">
              {lastRefresh ? `Last refreshed ${timeAgo(lastRefresh)}` : 'Loading…'}
              {meta.generatedAt && ` · Generated ${fmtDate(meta.generatedAt)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Day toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    days === d
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchStats(days)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-sm flex-1">{error}</span>
            <button
              onClick={() => fetchStats(days)}
              className="text-xs text-red-400 hover:text-red-300 underline flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Force Refresh Panel ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Force Refresh</p>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'contests', label: 'Sync Contest Data', icon: RefreshCw, desc: 'Re-fetches CF + LC contests from APIs (bypasses 6h timer)' },
              { key: 'stats', label: 'Clear Home Stats Cache', icon: Database, desc: 'Forces home page to re-query user/problem counts from DB' },
            ].map(({ key, label, icon: Icon, desc }) => (
              <div key={key} className="flex-1 min-w-[220px] bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => forceRefresh(key)}
                    disabled={forcing[key]}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    <Icon size={11} className={forcing[key] ? 'animate-spin' : ''} />
                    {forcing[key] ? 'Running…' : 'Run'}
                  </button>
                </div>
                {forceMsg[key] && (
                  <p className={`text-[11px] mt-2 px-2 py-1 rounded ${forceMsg[key].ok ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {forceMsg[key].text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Send Notification ── */}
        <SendNotificationPanel />

        {/* ── Overview stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Users" value={fmt(ov.totalUsers)}
            sub={`${fmt(ov.verifiedUsers)} verified · ${fmt(ov.unverifiedUsers)} pending`}
            color="#3b82f6" loading={loading} />
          <StatCard icon={TrendingUp} label="New Today" value={fmt(gr.newUsersToday)}
            sub={`Yesterday: ${fmt(gr.newUsersYesterday)}`}
            color="#10b981" loading={loading} />
          <StatCard icon={Activity} label="Active (7d)" value={fmt(ov.activeUsersLast7Days)}
            sub="Unique submitters"
            color="#f59e0b" loading={loading} />
          <StatCard icon={Zap} label="Synced Today" value={fmt(ov.syncedToday)}
            sub={`CF: ${fmt(ov.syncedTodayCf)} · LC: ${fmt(ov.syncedTodayLc)}`}
            color="#8b5cf6" loading={loading} />
          <StatCard icon={CheckCircle} label="AC Submissions" value={fmt(ov.acSubmissions)}
            sub={`${ov.overallAccRate} acceptance · ${fmt(ov.totalSubmissions)} total`}
            color="#06b6d4" loading={loading} />
          <StatCard icon={Target} label="Retention (30d)" value={ov.retentionRate}
            sub={`${fmt(ov.retainedUsers)} of ${fmt(ov.totalUsers)} users`}
            color="#ec4899" loading={loading} />
          <StatCard icon={Database} label="Platform Links" value={fmt(ov.cfLinkedUsers + ov.lcLinkedUsers)}
            sub={`CF: ${fmt(ov.cfLinkedUsers)} · LC: ${fmt(ov.lcLinkedUsers)} · Both: ${fmt(ov.bothLinked)}`}
            color="#f97316" loading={loading} />
          <StatCard icon={MessageSquare} label="Community" value={fmt(ov.totalPosts)}
            sub={`${fmt(ov.postsThisWeek)} posts this week · ${fmt(ov.totalComments)} comments`}
            color="#a78bfa" loading={loading} />
        </div>

        {/* ── Growth strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Yesterday', value: gr.newUsersYesterday },
            { label: 'This Week', value: gr.newUsersThisWeek },
            { label: 'This Month', value: gr.newUsersThisMonth },
            { label: 'Total Verified', value: ov.verifiedUsers },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
              {loading ? (
                <Sk className="h-6 w-12 mx-auto" />
              ) : (
                <p className="text-xl font-bold text-white font-mono">{fmt(value)}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Time series charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* New Users */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">New Signups / Day</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ts.newUsers || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Signups"
                    stroke="#10b981" fill="url(#gUsers)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Synced per day */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Syncs / Day</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ts.synced || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Syncs"
                    stroke="#8b5cf6" fill="url(#gSync)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* AC submissions per day */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">AC Submissions / Day</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ts.acSubmissions || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="AC Submissions"
                    stroke="#06b6d4" fill="url(#gAC)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Distributions ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CF Rating */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">CF Rating Distribution</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dist.cfRating || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="count" name="Users" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* LC Solved */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">LC Solved Distribution</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dist.lcSolved || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="count" name="Users" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Languages</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={(dist.languages || []).slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} width={60} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="count" name="Submissions" fill="#10b981" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Top Countries + Colleges ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={14} className="text-blue-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Countries</p>
            </div>
            {loading ? <Sk className="h-40" /> : (
              <BarList items={dist.topCountries || []} color="#3b82f6" />
            )}
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={14} className="text-purple-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Colleges</p>
            </div>
            {loading ? <Sk className="h-40" /> : (
              <BarList items={dist.topColleges || []} color="#8b5cf6" />
            )}
          </div>
        </div>

        {/* ── Recent Users ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-emerald-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Signups</p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Sk key={i} className="h-10" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['User', 'Email', 'Role', 'Verified', 'CF', 'LC', 'Last Login', 'Joined'].map(h => (
                      <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-4 uppercase tracking-wide text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentUsers || []).map(u => (
                    <tr key={u._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4">
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-gray-500">@{u.username}</p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-400">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          u.role === 'admin'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : u.role === 'moderator'
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-white/5 text-gray-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {u.isVerified
                          ? <CheckCircle size={13} className="text-emerald-400" />
                          : <AlertCircle size={13} className="text-gray-600" />
                        }
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${u.cfLinked ? 'bg-blue-500/15 text-blue-400' : 'text-gray-700'}`}>
                          {u.cfLinked ? 'CF' : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${u.lcLinked ? 'bg-yellow-500/15 text-yellow-400' : 'text-gray-700'}`}>
                          {u.lcLinked ? 'LC' : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500">{timeAgo(u.lastLogin)}</td>
                      <td className="py-2.5 text-gray-500">{fmtDate(u.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Server meta ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-6 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <Server size={13} className="text-gray-500" />
            <span className="text-gray-500">Server</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${meta.dbStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-500'}`} />
            <span className="text-gray-400">DB {meta.dbStatus || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-gray-600" />
            <span className="text-gray-400">Uptime: {meta.uptime || '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Code2 size={11} className="text-gray-600" />
            <span className="text-gray-400">Generated: {meta.generatedAt ? new Date(meta.generatedAt).toLocaleTimeString() : '—'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
