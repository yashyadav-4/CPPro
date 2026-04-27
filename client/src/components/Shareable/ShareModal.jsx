// ShareModal.jsx — dashboard sharing modal, works in both light and dark theme.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { X, Download, Check, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';

import ShareableCard from './ShareableCard';
import { useTheme } from '../../hooks/useTheme';

const PREVIEW_SCALE = 0.5; // 1200×630 → 600×315 preview

export default function ShareModal({ isOpen, onClose, cardProps, loading = false }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const { isDark } = useTheme();

  const [rankData, setRankData] = useState({
    serverCpScore: null,
    cpScoreRank: null, cpScoreTotal: null,
    totalQRank: null, totalQTotal: null,
    lcRatingRank: null, lcRatingTotal: null,
    cfRatingRank: null, cfRatingTotal: null,
  });
  const [rankLoading, setRankLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setDownloadError(null);
    setDownloaded(false);
    setDownloading(false);

    let cancelled = false;
    setRankLoading(true);
    axios.get('/api/leaderboard/my-rank', { withCredentials: true })
      .then(res => {
        if (!cancelled && res.data?.data) setRankData(res.data.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRankLoading(false); });

    return () => { cancelled = true; };
  }, [isOpen]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    setDownloaded(false);

    let container = null;
    let root = null;

    try {
      // Wait for main document fonts to be ready
      if (document.fonts?.ready) await document.fonts.ready;

      // Create a fresh, isolated container at the viewport origin.
      // z-index:-1 hides it behind the modal while fonts/layout still render normally.
      container = document.createElement('div');
      container.style.cssText =
        'position:fixed;top:0;left:0;width:1200px;height:630px;z-index:-1;pointer-events:none;';
      document.body.appendChild(container);

      // Render ShareableCard into the isolated container synchronously.
      // flushSync ensures the DOM is fully painted before we capture.
      root = createRoot(container);
      const enrichedProps = { ...cardProps, ...rankData, isDark };
      flushSync(() => {
        root.render(<ShareableCard {...enrichedProps} />);
      });

      // Two rAF ticks: first lets React commit, second lets the browser paint.
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const canvas = await html2canvas(container, {
        width: 1200,
        height: 630,
        scale: 2,
        x: 0,
        y: 0,
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (doc, clonedEl) => {
          // Bring the card to the front in the clone so nothing renders over it.
          clonedEl.style.zIndex = '999999';
          // Copy all @font-face rules from the live document so custom fonts render.
          const styleEl = doc.createElement('style');
          let css = '';
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules) css += rule.cssText + '\n';
            } catch (e) { /* skip cross-origin sheets */ }
          }
          styleEl.textContent = css;
          doc.head.appendChild(styleEl);
        },
      });

      const handle = cardProps?.cfHandle || cardProps?.lcHandle || 'cppro';
      const filename = `cppro-${handle}-${new Date().toISOString().slice(0, 10)}.png`;

      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('toBlob returned null')); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = filename;
          a.href = url;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png');
      });

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    } catch (err) {
      console.error('[ShareModal] export failed:', err);
      setDownloadError('Could not generate PNG. Try again.');
    } finally {
      try { root?.unmount(); } catch (_) {}
      if (container?.parentNode) container.parentNode.removeChild(container);
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const previewWidth = Math.round(1200 * PREVIEW_SCALE);
  const previewHeight = Math.round(630 * PREVIEW_SCALE);
  const enrichedCardProps = { ...cardProps, ...rankData };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4
                 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-[720px] overflow-hidden rounded-2xl shadow-2xl
          bg-white border border-gray-200
          dark:bg-[#111111] dark:border-white/[0.08]
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="
          flex items-center justify-between px-5 py-4
          border-b border-gray-100 dark:border-white/[0.06]
        ">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Share your progress
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-normal mt-0.5">
              1200 × 630 card — tuned for LinkedIn, X, and Discord previews.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="
              p-1.5 rounded-lg transition-colors
              text-gray-400 hover:text-gray-700 hover:bg-gray-100
              dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-white/[0.06]
            "
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Preview ── */}
        <div className="px-5 pt-5 pb-4 bg-gray-50 dark:bg-[#0d0d0d]">
          {loading || rankLoading ? (
            <div
              style={{ width: previewWidth, height: previewHeight }}
              className="mx-auto animate-pulse rounded-xl bg-gray-200 dark:bg-white/5"
            />
          ) : (
            <div
              className="mx-auto rounded-xl overflow-hidden
                         shadow-lg border border-gray-200 dark:border-white/[0.08]"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <div
                style={{
                  width: 1200,
                  height: 630,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: 'top left',
                }}
              >
                <ShareableCard {...enrichedCardProps} isDark={isDark} />
              </div>
            </div>
          )}

          <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-600">
            The exported PNG always renders at full 1200 × 630 resolution.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="
          flex items-center justify-between gap-3 px-5 py-4
          border-t border-gray-100 dark:border-white/[0.06]
          bg-white dark:bg-[#111111]
        ">
          <div className="min-h-[18px] flex items-center">
            {downloadError && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
                <AlertTriangle size={13} /> {downloadError}
              </span>
            )}
            {downloaded && !downloadError && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check size={13} /> Saved to downloads
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="
                px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                text-gray-600 hover:bg-gray-100
                dark:text-gray-300 dark:hover:bg-white/[0.06]
              "
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading || loading || rankLoading}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors
                ${downloading || loading || rankLoading
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }
              `}
            >
              <Download size={12} className={downloading ? 'animate-pulse' : ''} />
              {downloading ? 'Rendering…' : 'Download PNG'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
