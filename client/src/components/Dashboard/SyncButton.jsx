import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function SyncButton({ lastSyncedAt, onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const [error, setError] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSync = useCallback(async () => {
    if (syncing || cooldown > 0) return;

    setSyncing(true);
    setError(null);

    try {
      // Auth is cookie-based — just include credentials (no Bearer header needed)
      const res = await axios.post(
        '/api/sync/refresh',
        {},
        { withCredentials: true }
      );
      onSyncComplete?.(res.data);
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.data?.retryAfterSeconds || 300;
        setCooldown(retryAfter);
      } else {
        setError(err.response?.data?.message || 'Sync failed');
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing, cooldown, onSyncComplete]);

  const formatCooldown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatSyncTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="dashboard-topbar">
      <div className="last-synced">
        <span className="last-synced-label">Last Synced</span>
        <span className="last-synced-value">{formatSyncTime(lastSyncedAt)}</span>
      </div>

      <button
        className={`sync-btn ${syncing ? 'syncing' : ''}`}
        onClick={handleSync}
        disabled={syncing || cooldown > 0}
      >
        <RefreshCw size={16} className="sync-icon" />
        {cooldown > 0
          ? `Cooldown ${formatCooldown(cooldown)}`
          : syncing
          ? 'Syncing...'
          : 'Sync Codeforces'}
      </button>

      {cooldown > 0 && (
        <span className="sync-cooldown-text">
          Try again in {formatCooldown(cooldown)}
        </span>
      )}

      {error && (
        <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>
      )}
    </div>
  );
}
