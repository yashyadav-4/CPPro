// ShareModal.jsx — dashboard sharing modal, works in both light and dark theme.
import { useEffect, useRef, useState } from 'react';
import { X, Download, Check, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';

import ShareableCard from './ShareableCard';
import { useTheme } from '../../hooks/useTheme';

const PREVIEW_SCALE = 0.5; // 1200×630 → 600×315 preview

export default function ShareModal({ isOpen, onClose, cardProps, loading = false }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const { isDark } = useTheme();

  // Multi-category rank data (fetched per modal open)
  const [rankData, setRankData] = useState({
    serverCpScore: null,
    cpScoreRank: null, cpScoreTotal: null,
    totalQRank: null, totalQTotal: null,
    lcRatingRank: null, lcRatingTotal: null,
    cfRatingRank: null, cfRatingTotal: null,
  });
  const [rankLoading, setRankLoading] = useState(false);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Reset + fetch multi-category ranks when opened
  useEffect(() => {
    if (!isOpen) return;
    setDownloadError(null);
    setDownloaded(false);
    setDownloading(false);

    let cancelled = false;
    setRankLoading(true);
    axios.get('/api/leaderboard/my-rank', { withCredentials: true })
      .then(res => {
        if (!cancelled && res.data?.data) {
          setRankData(res.data.data);
        }
      })
      .catch(() => { /* silently ignore — card renders without rank */ })
      .finally(() => { if (!cancelled) setRankLoading(false); });

    return () => { cancelled = true; };
  }, [isOpen]);

  const handleDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    setDownloaded(false);

    try {
      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = await html2canvas(cardRef.current, {
        width: 1200,
        height: 630,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (doc, clonedEl) => {
          // 1. Remove the 0.5x preview scale so the card renders at full 1200×630.
          clonedEl.style.transform = 'none';
          // 2. Walk up ancestors and strip any CSS property that creates a containing
          //    block (backdrop-filter from the modal backdrop, filter, transform).
          //    Without this, `position:fixed` on clonedEl would still be relative to
          //    the modal rather than the viewport, giving wrong capture coordinates.
          let ancestor = clonedEl.parentElement;
          while (ancestor && ancestor !== doc.body) {
            ancestor.style.backdropFilter = 'none';
            ancestor.style.webkitBackdropFilter = 'none';
            ancestor.style.filter = 'none';
            ancestor.style.transform = 'none';
            ancestor = ancestor.parentElement;
          }
          // 3. Pin the card to viewport origin so html2canvas always renders from (0,0).
          clonedEl.style.position = 'fixed';
          clonedEl.style.top = '0px';
          clonedEl.style.left = '0px';
          clonedEl.style.zIndex = '999999';
          // 4. Inject fonts into the cloned document.
          const link = doc.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap';
          doc.head.appendChild(link);
        },
      });

      const handle = cardProps?.cfHandle || cardProps?.lcHandle || 'cppro';
      const filename = `cppro-${handle}-${new Date().toISOString().slice(0, 10)}.png`;

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    } catch (err) {
      console.error('[ShareModal] html2canvas export failed:', err);
      setDownloadError('Could not generate PNG. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  const previewWidth = Math.round(1200 * PREVIEW_SCALE);
  const previewHeight = Math.round(630 * PREVIEW_SCALE);

  const enrichedCardProps = { ...cardProps, ...rankData };

  return (
    /* Backdrop — neutral in both themes */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4
                 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/*
        Modal shell — light: white card with gray border
                      dark : near-black card with subtle white border
      */}
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
              {/* Capture target: ref here so html2canvas gets the painted element.
                  onclone strips the scale transform before rendering. */}
              <div
                ref={cardRef}
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

          {/* Caption under preview */}
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
          {/* Status message */}
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

          {/* Actions */}
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
