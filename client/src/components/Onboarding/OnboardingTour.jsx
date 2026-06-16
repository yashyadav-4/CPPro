import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, ArrowLeft, CheckCircle2, Link2, LayoutDashboard,
  Trophy, Brain, CalendarCheck, Users, Code2, Swords, Sparkles
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// ─── localStorage key ────────────────────────────────────────────────────────
const FIRST_DAY_KEY = 'first_day';

function checkAndMarkFirstDay() {
  const stored = localStorage.getItem(FIRST_DAY_KEY);
  if (stored === null) {
    localStorage.setItem(FIRST_DAY_KEY, new Date().toISOString());
    return true;
  }
  const signupDate = new Date(stored);
  const today = new Date();
  return (
    signupDate.getFullYear() === today.getFullYear() &&
    signupDate.getMonth() === today.getMonth() &&
    signupDate.getDate() === today.getDate()
  );
}

// ─── Tour steps ───────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    targetSelector: null,
    Icon: Sparkles,
    iconColor: '#22c55e',
    title: 'Welcome to CPPro 🎉',
    body: "You're joining a unified analytics platform that pulls your Codeforces, LeetCode, and CodeChef data into one place — ratings, heatmaps, skill gaps, daily problems, leaderboards, and more. Let's take 60 seconds to show you around.",
    cta: "Let's go",
    isCenter: true,
  },
  {
    id: 'link-accounts',
    targetSelector: '[data-tour="nav-settings"]',
    Icon: Link2,
    iconColor: '#f97316',
    title: 'Step 1 — Link Your Accounts',
    body: "Head to Settings first. A verification code appears — drop it in your CF / LC / CC profile name for a moment. Once we confirm it's you, every sync, daily problem, and leaderboard rank is personalised to your actual data.",
    cta: 'Got it',
  },
  {
    id: 'dashboard',
    targetSelector: '[data-tour="nav-dashboard"]',
    Icon: LayoutDashboard,
    iconColor: '#3b82f6',
    title: 'Your Analytics Dashboard',
    body: "After linking, hit Sync. Your dashboard populates with ratings over time, activity heatmaps, difficulty breakdown, skill gaps, recent submissions, and weekly streaks — all three platforms unified.",
    cta: 'Next',
  },
  {
    id: 'daily',
    targetSelector: '[data-tour="nav-daily"]',
    Icon: CalendarCheck,
    iconColor: '#8b5cf6',
    title: 'Daily Problems',
    body: "Each day you get a Workout (comfort zone, consistency) and a Challenger (just above your level, targeting your weakest tag). Solve both to grow your streak. A bonus problem from a third platform shows up when available.",
    cta: 'Next',
  },
  {
    id: 'leaderboard',
    targetSelector: '[data-tour="nav-leaderboard"]',
    Icon: Trophy,
    iconColor: '#f59e0b',
    title: 'Leaderboard',
    body: "CPScore combines ratings, problems solved, and contest counts across all platforms into one number. Filter by global, country, or college. Your rank auto-updates after every sync.",
    cta: 'Next',
  },
  {
    id: 'learning',
    targetSelector: '[data-tour="nav-learning"]',
    Icon: Brain,
    iconColor: '#06b6d4',
    title: 'Learning Tree',
    body: "A 3D interactive curriculum covering CP algorithms and DSA fundamentals. Mark topics Theory → Implemented → Mastered. Your progress feeds into the skill analysis engine and influences your daily Challenger picks.",
    cta: 'Next',
  },
  {
    id: 'contests',
    targetSelector: '[data-tour="nav-contests"]',
    Icon: Swords,
    iconColor: '#ec4899',
    title: 'Contest Tracker',
    body: "Upcoming and past contests from all three platforms in one clean timeline — synced every 6 hours automatically. Never miss a round again.",
    cta: 'Next',
  },
  {
    id: 'community',
    targetSelector: '[data-tour="nav-community"]',
    Icon: Users,
    iconColor: '#10b981',
    title: 'Community',
    body: "Post blogs, ask for help, or start a discussion. Threaded comments and upvotes help the right people find your content — great for sharing editorial approaches or that weird edge case you finally cracked.",
    cta: 'Next',
  },
  {
    id: 'snippets',
    targetSelector: '[data-tour="nav-snippets"]',
    Icon: Code2,
    iconColor: '#a78bfa',
    title: 'Code Snippets',
    body: "Save your contest templates — segment tree, DSU, modular arithmetic, whatever you rely on. Four languages, tags, and instant copy. One click during a live contest.",
    cta: 'Finish tour',
    isLast: true,
  },
];

// ─── SVG Spotlight ────────────────────────────────────────────────────────────
function SpotlightOverlay({ rect, isDark }) {
  const FILL = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)';
  if (!rect) {
    return <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: FILL, pointerEvents: 'none' }} />;
  }
  const PAD = 10;
  const x = rect.left - PAD, y = rect.top - PAD;
  const w = rect.width + PAD * 2, h = rect.height + PAD * 2;
  const vw = window.innerWidth, vh = window.innerHeight;
  return (
    <svg style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none', width: vw, height: vh, overflow: 'visible' }}>
      <defs>
        <mask id="cppro-mask">
          <rect width={vw} height={vh} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={10} fill="black" />
        </mask>
      </defs>
      <rect width={vw} height={vh} fill={FILL} mask="url(#cppro-mask)" />
      <rect x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx={11}
        fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.95"
        style={{ filter: 'drop-shadow(0 0 10px rgba(34,197,94,0.7))' }}
      />
    </svg>
  );
}

// ─── Position: below target, or screen-center ─────────────────────────────────
function calcPos(rect, isCenter) {
  if (isCenter || !rect) return null; // null = centered via CSS
  const W = 420, MARGIN = 18;
  const vw = window.innerWidth, vh = window.innerHeight;
  let top = rect.bottom + MARGIN;
  let left = rect.left + rect.width / 2 - W / 2;
  left = Math.max(12, Math.min(left, vw - W - 12));
  top  = Math.max(80, Math.min(top, vh - 380));
  return { top, left };
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export default function OnboardingTour() {
  const { isDark } = useTheme();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    if (!checkAndMarkFirstDay()) return;
    const t = setTimeout(() => setVisible(true), 1100);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const step = STEPS[stepIdx];

  const measure = useCallback(() => {
    if (!step?.targetSelector) { setRect(null); return; }
    const el = document.querySelector(step.targetSelector);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step?.targetSelector]);

  useEffect(() => {
    if (!visible) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [visible, measure]);

  useEffect(() => {
    if (!visible || !step?.targetSelector) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const t = setTimeout(measure, 380);
      return () => clearTimeout(t);
    }
  }, [visible, stepIdx, step?.targetSelector, measure]);

  const goNext = () => stepIdx < STEPS.length - 1 ? setStepIdx(i => i + 1) : close();
  const goBack = () => stepIdx > 0 && setStepIdx(i => i - 1);
  const close  = () => setVisible(false);

  if (!visible) return null;

  // Tokens
  const BG     = isDark ? '#111111' : '#ffffff';
  const BORDER = isDark ? '#252525' : '#e5e7eb';
  const MAIN   = isDark ? '#f0f0f0' : '#111827';
  const BODY_C = isDark ? '#999999' : '#4b5563';
  const MUTED  = isDark ? '#505050' : '#9ca3af';
  const DOTOFF = isDark ? '#2a2a2a' : '#d1d5db';
  const GREEN  = '#22c55e';
  const BTN    = '#16a34a';
  const BTNH   = '#15803d';

  const { Icon } = step;
  const isCenterStep = !!step.isCenter;
  const xyPos = calcPos(rect, isCenterStep);
  const isCenter = isCenterStep || !xyPos;

  // Card width: bigger for welcome, standard for others
  const CARD_W = isCenter ? 520 : 420;

  // Build position style
  const posStyle = isCenter
    ? { position: 'fixed', top: '50%', left: '50%' }
    : { position: 'fixed', top: xyPos.top, left: xyPos.left };

  return createPortal(
    <>
      {/* Backdrop dismiss */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9989 }} onClick={close} />

      {/* Spotlight */}
      <AnimatePresence>
        <motion.div key="spot"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none' }}
        >
          <SpotlightOverlay rect={rect} isDark={isDark} />
        </motion.div>
      </AnimatePresence>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.92, x: isCenter ? "-50%" : 0, y: isCenter ? "-40%" : -10 }}
          animate={{ opacity: 1, scale: 1, x: isCenter ? "-50%" : 0, y: isCenter ? "-50%" : 0 }}
          exit={{ opacity: 0, scale: 0.96, x: isCenter ? "-50%" : 0, y: isCenter ? "-45%" : -6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            ...posStyle,
            zIndex: 9999,
            width: CARD_W,
            maxWidth: 'calc(100vw - 24px)',
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: isDark
              ? `0 32px 72px rgba(0,0,0,0.85), 0 0 0 1px rgba(34,197,94,0.1), 0 0 50px rgba(34,197,94,0.05)`
              : `0 24px 56px rgba(0,0,0,0.13)`,
            fontFamily: "'DM Sans', -apple-system, sans-serif",
          }}
        >
          {/* Top accent */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${BTN}, ${GREEN}, ${BTN})` }} />

          {/* Welcome hero section (only for center card) */}
          {isCenter && (
            <div style={{
              padding: '32px 32px 0',
              textAlign: 'center',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 64, height: 64, borderRadius: 18,
                background: `${GREEN}15`, border: `1px solid ${GREEN}25`,
                color: GREEN, marginBottom: 20,
              }}>
                <Icon size={30} strokeWidth={2} />
              </div>
              <h2 style={{
                margin: '0 0 10px',
                fontSize: 26, fontWeight: 800, color: MAIN,
                letterSpacing: '-0.03em', lineHeight: 1.2,
              }}>
                {step.title}
              </h2>
              <p style={{
                margin: 0, fontSize: 15, lineHeight: 1.7,
                color: BODY_C, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
              }}>
                {step.body}
              </p>
            </div>
          )}

          {/* Standard header (non-center steps) */}
          {!isCenter && (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 22px 0', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${step.iconColor}13`, border: `1px solid ${step.iconColor}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.iconColor,
                }}>
                  <Icon size={21} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 15.5, fontWeight: 700, color: MAIN, lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                  {step.title}
                </span>
              </div>
              <button onClick={close} aria-label="Close tour"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = BODY_C)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Body for non-center steps */}
          {!isCenter && (
            <p style={{ margin: 0, padding: '12px 22px 0', fontSize: 14, lineHeight: 1.7, color: BODY_C }}>
              {step.body}
            </p>
          )}

          {/* Footer */}
          <div style={{
            margin: isCenter ? '24px 32px 0' : '16px 22px 0',
            paddingTop: 14, paddingBottom: isCenter ? 28 : 16,
            borderTop: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center',
            justifyContent: isCenter ? 'center' : 'space-between',
            gap: 12,
            flexDirection: isCenter ? 'column' : 'row',
          }}>

            {/* Center step: big CTA then dots */}
            {isCenter ? (
              <>
                <button onClick={goNext}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 32px', borderRadius: 12,
                    border: 'none',
                    background: `linear-gradient(135deg, ${BTN}, ${GREEN})`,
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: `0 6px 20px rgba(34,197,94,0.42)`,
                    letterSpacing: '0.01em',
                    width: '100%', justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${BTNH}, #16a34a)`;
                    e.currentTarget.style.boxShadow = `0 8px 28px rgba(34,197,94,0.55)`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${BTN}, ${GREEN})`;
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(34,197,94,0.42)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {step.cta} <ArrowRight size={16} />
                </button>
                <button onClick={close}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: MUTED, fontSize: 12,
                    textDecoration: 'underline', textUnderlineOffset: 2,
                    transition: 'color 0.15s', fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = BODY_C)}
                  onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                >
                  Skip tour
                </button>
              </>
            ) : (
              <>
                {/* Step dots */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {STEPS.map((_, i) => (
                    <button key={i} onClick={() => setStepIdx(i)} aria-label={`Step ${i + 1}`}
                      style={{
                        width: i === stepIdx ? 20 : 6, height: 6, borderRadius: 3,
                        border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
                        background: i === stepIdx ? GREEN : DOTOFF,
                        transition: 'all 0.22s ease',
                      }}
                    />
                  ))}
                </div>

                {/* Nav buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {stepIdx > 0 && (
                    <button onClick={goBack}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '8px 14px', borderRadius: 9,
                        border: `1px solid ${BORDER}`, background: 'transparent',
                        color: BODY_C, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${GREEN}55`; e.currentTarget.style.color = GREEN; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = BODY_C; }}
                    >
                      <ArrowLeft size={13} /> Back
                    </button>
                  )}
                  <button onClick={goNext}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 18px', borderRadius: 9,
                      border: 'none',
                      background: `linear-gradient(135deg, ${BTN}, ${GREEN})`,
                      color: '#fff', fontSize: 13.5, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: `0 4px 14px rgba(34,197,94,0.38)`,
                      letterSpacing: '0.01em', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${BTNH}, #16a34a)`;
                      e.currentTarget.style.boxShadow = `0 6px 20px rgba(34,197,94,0.5)`;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${BTN}, ${GREEN})`;
                      e.currentTarget.style.boxShadow = `0 4px 14px rgba(34,197,94,0.38)`;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {step.isLast ? <><CheckCircle2 size={14} /> {step.cta}</> : <>{step.cta} <ArrowRight size={14} /></>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Skip (non-center only) */}
          {!isCenter && (
            <div style={{ textAlign: 'center', paddingBottom: 14, marginTop: -4 }}>
              <button onClick={close}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: MUTED, fontSize: 11.5,
                  textDecoration: 'underline', textUnderlineOffset: 2,
                  transition: 'color 0.15s', fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = BODY_C)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
              >
                Skip tour
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>,
    document.body
  );
}
