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
  AlertCircle, Target, Bell, Send, ChevronDown, CalendarX,
  Terminal, Trash2, Brain, Radio, BookOpen, Loader2,
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

// ── Error Terminal ────────────────────────────────────────────────────────────
function ErrorTerminal() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/errors?limit=100`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setLogs(json.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearLogs = async () => {
    try {
      await fetch(`${API_BASE}/api/admin/errors`, { method: 'DELETE', credentials: 'include' });
      setLogs([]);
    } catch {}
  };

  const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const levelColor = { error: 'text-red-400', warn: 'text-amber-400', info: 'text-blue-400' };
  const levelBg = { error: 'bg-red-500/10', warn: 'bg-amber-500/10', info: 'bg-blue-500/10' };

  return (
    <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Terminal header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <Terminal size={13} className="text-gray-500 ml-2" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Error Logs</span>
          {logs.length > 0 && (
            <span className="text-[9px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded ml-1">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-400 transition-colors"
            title="Clear all logs"
          >
            <Trash2 size={11} /> Clear
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div className={`overflow-y-auto font-mono text-[11px] leading-relaxed px-4 py-3 space-y-0.5 transition-all ${
        expanded ? 'max-h-[800px]' : 'max-h-[400px]'
      }`}>
        {loading && logs.length === 0 ? (
          <div className="text-gray-600 py-4 text-center">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-600 py-4 text-center">No errors logged — system is healthy ✓</div>
        ) : (
          logs.map((log, i) => (
            <div key={log._id || i} className="flex gap-2 py-0.5 group hover:bg-white/[0.02] px-1 rounded">
              <span className="text-gray-600 flex-shrink-0 w-[120px]">{fmtTime(log.createdAt)}</span>
              <span className={`flex-shrink-0 px-1.5 py-0 rounded text-[10px] font-medium ${levelBg[log.level] || ''} ${levelColor[log.level] || 'text-gray-400'}`}>
                {(log.level || 'err').toUpperCase()}
              </span>
              <span className="text-cyan-400/70 flex-shrink-0">[{log.source}]</span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </div>
          ))
        )}
        <div className="text-gray-700 pt-1">$ _</div>
      </div>
    </div>
  );
}
// ── Active Users Panel ────────────────────────────────────────────────────────
function UserRow({ u }) {
  return (
    <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
      <td className="py-2.5 pr-2">
        <div className={`w-2 h-2 rounded-full ${u.isOnlineNow ? 'bg-emerald-400' : 'bg-gray-600'}`} />
      </td>
      <td className="py-2.5 pr-4">
        <div>
          <p className="text-white font-medium">{u.name}</p>
          <p className="text-gray-500">@{u.username}</p>
        </div>
      </td>
      <td className="py-2.5 pr-4 text-gray-400">{u.email}</td>
      <td className="py-2.5 pr-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
          u.role === 'admin'       ? 'bg-emerald-500/15 text-emerald-400' :
          u.role === 'moderator'   ? 'bg-blue-500/15 text-blue-400'       :
                                     'bg-white/5 text-gray-400'
        }`}>{u.role}</span>
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
      <td className="py-2.5 pr-4">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${u.ccLinked ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-700'}`}>
          {u.ccLinked ? 'CC' : '—'}
        </span>
      </td>
      <td className="py-2.5 text-gray-500">
        {u.isOnlineNow
          ? <span className="text-emerald-400 font-medium">Online</span>
          : timeAgo(u.lastLogin)
        }
      </td>
    </tr>
  );
}

function ActiveUsersPanel() {
  const [users, setUsers]           = useState([]);
  const [todayUsers, setTodayUsers] = useState([]);
  const [isLive, setIsLive]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [todayOpen, setTodayOpen]   = useState(false);

  const fetchActive = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/admin/active-users`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
        setTodayUsers(json.todayUsers || []);
        setIsLive(json.isLive);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const tableHeaders = ['', 'User', 'Email', 'Role', 'CF', 'LC', 'CC', 'Last Seen'];

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="relative flex items-center justify-center w-4 h-4">
              <div className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-40" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
          ) : (
            <Radio size={14} className="text-gray-500" />
          )}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {isLive ? `Active Now (${users.length})` : 'Recently Active'}
          </p>
          {isLive && (
            <span className="text-[9px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">LIVE</span>
          )}
        </div>
        <button
          onClick={fetchActive}
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw size={10} /> Refresh
        </button>
      </div>

      {/* ── Live / Recent table ── */}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Sk key={i} className="h-10" />)}</div>
      ) : users.length === 0 ? (
        <p className="text-[12px] text-gray-600 text-center py-4">No user activity recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {tableHeaders.map(h => (
                  <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-4 uppercase tracking-wide text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => <UserRow key={u._id} u={u} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Online Today — expandable ── */}
      {!loading && todayUsers.length > 0 && (
        <div className="border-t border-white/[0.06] pt-3">
          <button
            onClick={() => setTodayOpen(o => !o)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <div className="flex items-center gap-2 flex-1">
              <Clock size={12} className="text-gray-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">
                Last 24 Hours ({todayUsers.length})
              </span>
              <span className="text-[9px] bg-white/[0.05] text-gray-500 px-1.5 py-0.5 rounded font-mono">
                rolling window
              </span>
            </div>
            <ChevronDown
              size={13}
              className={`text-gray-500 transition-transform duration-200 ${todayOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {todayOpen && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {tableHeaders.map(h => (
                      <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-4 uppercase tracking-wide text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayUsers.map(u => <UserRow key={u._id} u={u} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Problem Catalog Sync Panel ────────────────────────────────────────────────
const PLATFORM_META = [
  {
    key: 'cf',
    label: 'Codeforces',
    endpoint: 'cf-problems',
    color: '#3b82f6',
    desc: 'All rated CF problems (~9,000+). Fast — calls CF public API directly.',
  },
  {
    key: 'lc',
    label: 'LeetCode',
    endpoint: 'lc-problems',
    color: '#f59e0b',
    desc: 'All free algorithm problems (~2,700+). Excludes SQL/Shell. Paginates via NexusLC (1–2 min).',
  },
  {
    key: 'cc',
    label: 'CodeChef',
    endpoint: 'cc-problems',
    color: '#10b981',
    desc: 'All CC problems across 8 difficulty bands. May partially fail on Cloudflare blocks (1–3 min).',
  },
];

function StatusBadge({ status }) {
  const cfg = {
    idle:    { text: 'Idle',    cls: 'bg-white/5 text-gray-500' },
    running: { text: 'Running', cls: 'bg-amber-500/15 text-amber-400 animate-pulse' },
    done:    { text: 'Done',    cls: 'bg-emerald-500/15 text-emerald-400' },
    error:   { text: 'Error',   cls: 'bg-red-500/15 text-red-400' },
  }[status] || { text: status, cls: 'bg-white/5 text-gray-500' };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.text}
    </span>
  );
}

function ProblemCatalogPanel() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing]       = useState({ cf: false, lc: false, cc: false, lc_tags: false });
  const [messages, setMessages]     = useState({ cf: null, lc: null, cc: null, lc_tags: null });
  const [polling, setPolling]       = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/admin/sync/catalog-status`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) setSyncStatus(json);
    } catch {}
  }, []);

  // Initial fetch on mount
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Auto-poll every 3s while any sync is running
  useEffect(() => {
    if (!syncStatus) return;
    const anyRunning = ['cf', 'lc', 'cc', 'lc_tags'].some(k => syncStatus[k]?.status === 'running');
    if (!anyRunning) { setPolling(false); return; }
    setPolling(true);
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [syncStatus, fetchStatus]);

  const triggerSync = async (platform) => {
    const meta = PLATFORM_META.find(p => p.key === platform);
    setSyncing(prev => ({ ...prev, [platform]: true }));
    setMessages(prev => ({ ...prev, [platform]: null }));
    try {
      const res  = await fetch(`${API_BASE}/api/admin/sync/${meta.endpoint}`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      setMessages(prev => ({ ...prev, [platform]: { ok: json.success, text: json.message } }));
      // Start polling immediately after trigger
      setTimeout(fetchStatus, 500);
    } catch {
      setMessages(prev => ({ ...prev, [platform]: { ok: false, text: 'Network error — could not start sync.' } }));
    } finally {
      setSyncing(prev => ({ ...prev, [platform]: false }));
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-violet-400" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Problem Catalog Sync</p>
          {polling && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400">
              <Loader2 size={10} className="animate-spin" /> polling…
            </span>
          )}
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-violet-400 transition-colors"
        >
          <RefreshCw size={10} /> Refresh Status
        </button>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLATFORM_META.map(({ key, label, color, desc }) => {
          const st     = syncStatus?.[key] || {};
          const status = st.status || 'idle';
          const isRunning = status === 'running';
          const isDone    = status === 'done';
          const isError   = status === 'error';

          return (
            <div
              key={key}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Glow */}
              <div className="absolute top-0 right-0 w-16 h-16 blur-[30px] opacity-10 pointer-events-none" style={{ background: color }} />

              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-bold text-white">{label}</span>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] rounded-lg px-2.5 py-2">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">In Catalog</p>
                  <p className="text-base font-bold text-white font-mono">
                    {syncStatus ? fmt(st.catalogCount ?? 0) : '—'}
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-lg px-2.5 py-2">
                  <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Last Synced</p>
                  <p className="text-[11px] font-medium text-gray-400">
                    {st.lastSyncedAt ? timeAgo(st.lastSyncedAt) : 'Never'}
                  </p>
                </div>
              </div>

              {/* Last sync result */}
              {isDone && (
                <p className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                  ✓ {fmt(st.total)} problems — {fmt(st.inserted)} new, {fmt(st.updated)} updated
                  {st.cloudflareHits > 0 && ` · ${st.cloudflareHits} CF blocks`}
                </p>
              )}
              {isError && (
                <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg break-all">
                  ✕ {st.error || 'Unknown error'}
                </p>
              )}
              {isRunning && (
                <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" />
                  Syncing… started {timeAgo(st.startedAt)}
                </p>
              )}

              {/* Local message (trigger feedback) */}
              {messages[key] && !isRunning && (
                <p className={`text-[11px] px-2.5 py-1.5 rounded-lg ${
                  messages[key].ok ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'
                }`}>
                  {messages[key].text}
                </p>
              )}

              {/* Sync button */}
              <button
                onClick={() => triggerSync(key)}
                disabled={syncing[key] || isRunning}
                className="mt-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50"
                style={{
                  background: `${color}18`,
                  borderColor: `${color}44`,
                  color,
                }}
              >
                {(syncing[key] || isRunning)
                  ? <><Loader2 size={12} className="animate-spin" /> Syncing…</>
                  : <><RefreshCw size={12} /> Sync {label} Problems</>
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* LC Contest Tags — standalone card */}
      {(() => {
        const st        = syncStatus?.lc_tags || {};
        const status    = st.status || 'idle';
        const isRunning = status === 'running';
        const isDone    = status === 'done';
        const isError   = status === 'error';
        const handleSync = async () => {
          setSyncing(prev => ({ ...prev, lc_tags: true }));
          setMessages(prev => ({ ...prev, lc_tags: null }));
          try {
            const r    = await fetch(`${API_BASE}/api/admin/sync/lc-contest-tags`, { method: 'POST', credentials: 'include' });
            const json = await r.json();
            setMessages(prev => ({ ...prev, lc_tags: { ok: json.success, text: json.message } }));
            setTimeout(fetchStatus, 500);
          } catch {
            setMessages(prev => ({ ...prev, lc_tags: { ok: false, text: 'Network error — could not start sync.' } }));
          } finally {
            setSyncing(prev => ({ ...prev, lc_tags: false }));
          }
        };
        return (
          <div className="mt-3 bg-white/[0.03] border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-20 h-20 blur-[40px] opacity-10 pointer-events-none" style={{ background: '#f59e0b' }} />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-sm font-bold text-white">LC Contest Tags</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400">New</span>
              </div>
              <StatusBadge status={status} />
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Fetches the last 100 LC contests (Weekly + Biweekly) and appends each contest slug
              (e.g. <span className="text-gray-400 font-mono">weekly-contest-507</span>) to the matching
              problem&apos;s tags. Run this after syncing LC Problems to enable upsolve queue support.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] rounded-lg px-2.5 py-2">
                <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Contests</p>
                <p className="text-base font-bold text-white font-mono">{st.contests ?? '—'}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-2.5 py-2">
                <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Last Synced</p>
                <p className="text-[11px] font-medium text-gray-400">{st.lastSyncedAt ? timeAgo(st.lastSyncedAt) : 'Never'}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-2.5 py-2">
                <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Tagged</p>
                <p className="text-base font-bold text-emerald-400 font-mono">{st.tagged ?? '—'}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg px-2.5 py-2">
                <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Skipped</p>
                <p className="text-base font-bold text-gray-500 font-mono">{st.skipped ?? '—'}</p>
              </div>
            </div>

            {/* Status messages */}
            {isDone && (
              <p className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg">
                ✓ {st.contests} contests processed — {st.tagged} problems tagged
              </p>
            )}
            {isError && (
              <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg break-all">
                ✕ {st.error || 'Unknown error'}
              </p>
            )}
            {isRunning && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />
                Syncing… started {timeAgo(st.startedAt)}
              </p>
            )}
            {messages.lc_tags && !isRunning && (
              <p className={`text-[11px] px-2.5 py-1.5 rounded-lg ${
                messages.lc_tags.ok ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'
              }`}>
                {messages.lc_tags.text}
              </p>
            )}

            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing.lc_tags || isRunning}
              className="mt-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: '#f59e0b18', borderColor: '#f59e0b44', color: '#f59e0b' }}
            >
              {(syncing.lc_tags || isRunning)
                ? <><Loader2 size={12} className="animate-spin" /> Syncing…</>
                : <><RefreshCw size={12} /> Sync Contest Tags</>
              }
            </button>
          </div>
        );
      })()}

      {/* Footer note */}
      <p className="text-[10px] text-gray-600 mt-3">
        Syncs run in the background — page stays responsive. Status auto-updates every 3s while running. Run once a week.
      </p>
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
  const [forcing, setForcing] = useState({ contests: false, leaderboard: false, stats: false, daily: false, 'daily-me': false, topics: false, 'daily-topic-me': false, 'training-mode-me': false, all: false });
  const [forceMsg, setForceMsg] = useState({ contests: null, leaderboard: null, stats: null, daily: null, 'daily-me': null, topics: null, 'daily-topic-me': null, 'training-mode-me': null, all: null });

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

  const forceRefreshAll = useCallback(async () => {
    setForcing(prev => ({ ...prev, all: true }));
    setForceMsg(prev => ({ ...prev, all: null }));
    try {
      const results = await Promise.allSettled([
        fetch(`${API_BASE}/api/admin/refresh/contests`,    { method: 'POST', credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/refresh/leaderboard`, { method: 'POST', credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/refresh/stats`,       { method: 'POST', credentials: 'include' }),
      ]);
      const failed = results.filter(r => r.status === 'rejected').length;
      setForceMsg(prev => ({
        ...prev,
        all: failed === 0
          ? { ok: true,  text: 'Contests, leaderboard cache, and home stats all refreshed.' }
          : { ok: false, text: `${failed} of 3 operations failed — check individual panels.` },
      }));
    } catch {
      setForceMsg(prev => ({ ...prev, all: { ok: false, text: 'Network error' } }));
    } finally {
      setForcing(prev => ({ ...prev, all: false }));
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Force Refresh</p>
            <button
              onClick={forceRefreshAll}
              disabled={forcing.all || forcing.contests || forcing.leaderboard || forcing.stats}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw size={11} className={forcing.all ? 'animate-spin' : ''} />
              {forcing.all ? 'Refreshing All…' : 'Refresh All'}
            </button>
          </div>
          {forceMsg.all && (
            <p className={`text-[11px] mb-3 px-2 py-1 rounded ${forceMsg.all.ok ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {forceMsg.all.text}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'contests',    label: 'Sync Contest Data',       icon: RefreshCw,  desc: 'Re-fetches CF + LC contests from APIs (bypasses 6h timer)' },
              { key: 'leaderboard', label: 'Recompute Leaderboard',   icon: RefreshCw,  desc: 'Rebuilds global leaderboard cache for all 4 categories (bypasses 15m timer)' },
              { key: 'stats',       label: 'Clear Home Stats Cache',  icon: Database,   desc: 'Forces home page to re-query user/problem counts from DB' },
              { key: 'daily',       label: 'Reset Daily Problems',    icon: CalendarX,  desc: 'Deletes today\'s daily problems for ALL users — fresh problems generated on next visit', danger: true },
              { key: 'topics',      label: 'Reset Daily Topics',       icon: Brain,      desc: 'Deletes today\'s AI-generated topics for ALL users — fresh topics generated on next visit', danger: true },
            ].map(({ key, label, icon: Icon, desc, danger }) => (
              <div key={key} className="flex-1 min-w-[220px] bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => forceRefresh(key)}
                    disabled={forcing[key]}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex-shrink-0 ${
                      danger
                        ? 'bg-red-600/20 hover:bg-red-600/40 border-red-500/30 text-red-400'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/30 text-emerald-400'
                    }`}
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
                {/* ── Reset for me only — shown on Daily Problems and Daily Topics cards ── */}
                {(key === 'daily' || key === 'topics') && (() => {
                  const meKey = key === 'daily' ? 'daily-me' : 'daily-topic-me';
                  return (
                    <div className="mt-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] text-gray-600">
                          Test mode — only resets <span className="text-amber-500/80">your</span> {key === 'daily' ? 'problems' : 'topic'}
                        </p>
                        <button
                          id={key === 'daily' ? 'btn-reset-daily-me' : 'btn-reset-topic-me'}
                          onClick={() => forceRefresh(meKey)}
                          disabled={forcing[meKey]}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                        >
                          <CalendarX size={10} className={forcing[meKey] ? 'animate-spin' : ''} />
                          {forcing[meKey] ? 'Resetting…' : 'Reset for me'}
                        </button>
                      </div>
                      {forceMsg[meKey] && (
                        <p className={`text-[11px] mt-1.5 px-2 py-1 rounded ${
                          forceMsg[meKey].ok ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          {forceMsg[meKey].text}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

        </div>

        {/* ── Send Notification ── */}
        <SendNotificationPanel />

        {/* ── Problem Catalog Sync ── */}
        <ProblemCatalogPanel />

        {/* ── Error Terminal ── */}
        <ErrorTerminal />

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
          <StatCard icon={Database} label="Platform Links" value={fmt((ov.cfLinkedUsers || 0) + (ov.lcLinkedUsers || 0) + (ov.ccLinkedUsers || 0))}
            sub={`CF: ${fmt(ov.cfLinkedUsers)} · LC: ${fmt(ov.lcLinkedUsers)} · CC: ${fmt(ov.ccLinkedUsers)}`}
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
          {/* New Signups / Day */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">New Signups / Day</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ts.newUsers || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Signups"
                    stroke="#10b981" fill="url(#gUsers)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Syncs / Day */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Syncs / Day</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ts.synced || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSync" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Syncs"
                    stroke="#8b5cf6" fill="url(#gSync)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Daily Active Users / Day */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Active Users</p>
              <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">DAU</span>
            </div>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ts.dailyActiveUsers || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gDAU" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Active Users"
                    stroke="#f59e0b" fill="url(#gDAU)" strokeWidth={2} dot={false} />
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

          {/* CC Rating */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">CC Rating Distribution</p>
            {loading ? <Sk className="h-40" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dist.ccRating || []} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff08' }} />
                  <Bar dataKey="count" name="Users" fill="#10b981" radius={[3, 3, 0, 0]} />
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

        {/* ── Active Users ── */}
        <ActiveUsersPanel />

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
                    {['User', 'Email', 'Role', 'Verified', 'CF', 'LC', 'CC', 'Last Login', 'Joined'].map(h => (
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
                      <td className="py-2.5 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${u.ccLinked ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-700'}`}>
                          {u.ccLinked ? 'CC' : '—'}
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
