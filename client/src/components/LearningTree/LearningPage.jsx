import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { useLearningTree } from './hooks/useLearningTree';
import { 
  CP_TREE, CP_SUB_LABELS, CP_TIER_LABELS, 
  DSA_TREE, DSA_SUB_LABELS, DSA_TIER_LABELS,
  TIER_COLORS, STATE_COLORS 
} from './data/learningTreeData';

const NW = 118, NH = 52, HGAP = 18, VGAP = 90, TOP_PAD = 40, SIDE_PAD = 40;
const TIERS_ARRAY = [0, 1, 2, 3, 4, 5, 6, 7];

function computeLayout(activeTree) {
  const pos = {};
  for (const t of TIERS_ARRAY) {
    const nodes = activeTree.filter(n => n.tier === t);
    nodes.forEach((n, i) => {
      pos[n.id] = { x: SIDE_PAD + i * (NW + HGAP), y: TOP_PAD + (7 - t) * (NH + VGAP) };
    });
  }
  return pos;
}

function getSvgWidth(pos) {
  return Math.max(...Object.values(pos).map(p => p.x + NW)) + SIDE_PAD;
}

// Brutalist Light Palette
const LIGHT_TIERS = {
  gray:   { bg: '#f4f4f5', border: '#a1a1aa', text: '#52525b', accent: '#d4d4d8' },
  teal:   { bg: '#e6fcf5', border: '#20c997', text: '#087f5b', accent: '#63e6be' },
  blue:   { bg: '#e7f5ff', border: '#339af0', text: '#1864ab', accent: '#74c0fc' },
  purple: { bg: '#f3f0ff', border: '#845ef7', text: '#5f3dc4', accent: '#b197fc' },
  coral:  { bg: '#fff0e6', border: '#ff875f', text: '#d9480f', accent: '#ffc099' },
  amber:  { bg: '#fff9db', border: '#fab005', text: '#b35900', accent: '#ffe066' },
  pink:   { bg: '#fff0f6', border: '#e64980', text: '#a61e4d', accent: '#faa2c1' },
  red:    { bg: '#ffe3e3', border: '#ff6b6b', text: '#c92a2a', accent: '#ffa8a8' },
};

export default function LearningPage() {
  const location = useLocation();
  const isDsa = location.pathname.includes('/dsa');
  
  const activeTree = isDsa ? DSA_TREE : CP_TREE;
  const activeSubLabels = isDsa ? DSA_SUB_LABELS : CP_SUB_LABELS;
  const activeTierLabels = isDsa ? DSA_TIER_LABELS : CP_TIER_LABELS;

  const { progress, getState, toggleState, stats } = useLearningTree(activeTree);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [popNode, setPopNode] = useState(null);
  const [markPop, setMarkPop] = useState(null);
  const svgRef = useRef(null);
  const popTimeoutRef = useRef(null);

  // Theme Sync
  const [isDark, setIsDark] = useState(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const themeVars = isDark 
    ? { bg: '#0e0e0f', text: '#e8e8ec', border: '#2a2a2e', gridLine: '#1a1a1d', edgeOff: '#222228', popBg: '#141416', popBorder: '#333338' }
    : { bg: '#fafafa', text: '#18181b', border: '#e4e4e7', gridLine: '#e4e4e7', edgeOff: '#d4d4d8', popBg: '#ffffff', popBorder: '#e4e4e7' };

  const currentTiers = isDark ? TIER_COLORS : LIGHT_TIERS;

  const pos = useMemo(() => {
    const p = computeLayout(activeTree);
    const W = getSvgWidth(p);
    for (const t of TIERS_ARRAY) {
      const nodes = activeTree.filter(n => n.tier === t);
      const rowW = nodes.length * (NW + HGAP) - HGAP;
      const offsetX = (W - rowW) / 2;
      nodes.forEach((n, i) => { p[n.id].x = offsetX + i * (NW + HGAP); });
    }
    return p;
  }, [activeTree]);

  const W = useMemo(() => getSvgWidth(pos), [pos]);
  const H = TOP_PAD + 8 * (NH + VGAP) + 40;

  useEffect(() => {
    const handleClickOutside = () => { if (markPop) setMarkPop(null); };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [markPop]);

  const handleSubOver = (node, e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = rect.width / W;
    const scaleY = rect.height / H;
    const p = pos[node.id];
    const nx = (p.x + NW / 2) * scaleX + rect.left;
    const ny = p.y * scaleY + rect.top;
    setPopNode({ node, nx, ny, scaleY });
  };

  const openMark = (id, label, e) => {
    e.stopPropagation();
    setMarkPop({
      id, label,
      x: Math.min(e.clientX + 10, window.innerWidth - 215),
      y: Math.max(8, e.clientY - 60)
    });
  };

  return (
    <div className="w-full overflow-x-hidden font-mono" style={{ backgroundColor: themeVars.bg, color: themeVars.text }}>
      {/* Selection Header */}
      <div className="px-6 pt-10 pb-4 max-w-[1200px] mx-auto flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">Skill Acquisition</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tighter">
             {isDsa ? 'Data Structures' : 'Competitive Programming'}
           </h1>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
             {isDsa 
               ? 'Master the fundamental building blocks of efficient software and ace technical interviews.' 
               : 'Climb the ranks of competitive platforms with advanced algorithmic strategies and patterns.'}
           </p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
           <NavLink 
             to="/learning/cp" 
             className={({ isActive }) => `px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
           >
             CP Tree
           </NavLink>
           <NavLink 
             to="/learning/dsa" 
             className={({ isActive }) => `px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
           >
             DSA Tree
           </NavLink>
        </div>
      </div>

      <div className="px-4 pt-6 pb-24 overflow-x-auto">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block mx-auto overflow-visible">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M1 2L8 5L1 8" fill="none" stroke={themeVars.popBorder} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            {/* Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Lines & Labels */}
          {TIERS_ARRAY.map(t => {
            const y = TOP_PAD + (7 - t) * (NH + VGAP) + NH + VGAP / 2;
            const lblY = TOP_PAD + (7 - t) * (NH + VGAP) + 4;
            return (
              <g key={`tier-${t}`}>
                <text x="8" y={lblY} fontSize="8" fontWeight="600" fill={isDark ? "#2a2a2e" : "#a1a1aa"} fontFamily="JetBrains Mono, monospace">
                  {activeTierLabels[t]}
                </text>
                {t < 7 && <line x1="0" y1={y} x2={W} y2={y} stroke={themeVars.gridLine} strokeWidth="1" strokeDasharray="2 8" />}
              </g>
            );
          })}

          {/* Edges */}
          {activeTree.map(node => {
            if (!node.deps) return null;
            const bp = pos[node.id];
            const sourceTier = node.tier > 0 ? node.tier - 1 : 0;
            const tierProgress = stats?.tierCompletion?.[sourceTier]?.ratio || 0;

            return node.deps.map(dep => {
              const ap = pos[dep];
              if (!ap || !bp) return null;
              const x1 = ap.x + NW / 2, y1 = ap.y;
              const x2 = bp.x + NW / 2, y2 = bp.y + NH;
              const my = (y1 + y2) / 2;
              const s = Math.min(getState(dep), getState(node.id));
              
              // Base Edge Color
              const baseStroke = s > 0 ? STATE_COLORS[s] + '66' : themeVars.edgeOff;
              const pathD = `M${x2},${y2} C${x2},${my} ${x1},${my} ${x1},${y1}`;
              
              // Color for the progressive glow (from source tier theme)
              const depNode = activeTree.find(n => n.id === dep);
              const tierTheme = currentTiers[depNode?.color] || currentTiers.gray;
              const glowColor = tierTheme.border;

              return (
                <g key={`${dep}->${node.id}`}>
                  {/* Base Inactive Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={baseStroke}
                    strokeWidth={s > 0 ? '1.5' : (isDark ? '0.8' : '1')}
                    markerEnd="url(#arr)"
                  />
                  
                  {/* Progressive Glow Path */}
                  {tierProgress > 0 && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={glowColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      style={{
                        strokeDasharray: '1000',
                        strokeDashoffset: (1 - tierProgress) * 1000,
                        transition: 'stroke-dashoffset 1s ease-out',
                        opacity: 0.6 + (tierProgress * 0.4)
                      }}
                    />
                  )}
                  {/* Subtle highlight core */}
                  {tierProgress > 0.1 && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '1000',
                        strokeDashoffset: (1 - tierProgress) * 1000,
                        transition: 'stroke-dashoffset 1s ease-out',
                        opacity: 0.3
                      }}
                    />
                  )}
                </g>
              );
            });
          })}

          {/* Nodes */}
          {activeTree.map(node => {
            const p = pos[node.id];
            if (!p) return null;
            const s = getState(node.id);
            const c = currentTiers[node.color] || currentTiers.gray;
            const hasSubs = node.subs && node.subs.length > 0;
            const isGod = node.tier === 7 && node.id.includes('mastery'); // Updated for DSA

            const bg = isGod ? STATE_COLORS[s] + '22' : (s > 0 ? STATE_COLORS[s] + (isDark?'18':'22') : c.bg);
            const border = s > 0 ? STATE_COLORS[s] : c.border;
            const lines = node.label.split('\n');
            const cy = p.y + NH / 2 - (lines.length - 1) * 8;
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredNode(node.id);
                  if(hasSubs) {
                    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
                    handleSubOver(node, e);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredNode(null);
                  if(hasSubs) popTimeoutRef.current = setTimeout(() => setPopNode(null), 250);
                }}
                onClick={(e) => !hasSubs && openMark(node.id, node.label.replace('\n', ' '), e)}
              >
                {s === 3 && (
                  <rect x={p.x - 4} y={p.y - 4} width={NW + 8} height={NH + 8} rx="11" fill={STATE_COLORS[3] + '15'} stroke={STATE_COLORS[3] + '40'} strokeWidth="1" />
                )}
                <rect
                  x={p.x} y={p.y} width={NW} height={NH} rx="8"
                  fill={bg} stroke={border} strokeWidth={s > 0 ? '1.5' : '1'}
                  strokeDasharray={hasSubs ? '6 3' : 'none'}
                  style={{ filter: isHovered ? (isDark ? 'brightness(1.15)' : 'brightness(0.95)') : 'none', transition: 'filter 0.2s' }}
                />
                {(s > 0 || isGod) && (
                  <rect x={p.x + 8} y={p.y} width={NW - 16} height="2" rx="1" fill={s > 0 ? STATE_COLORS[s] : c.accent} />
                )}
                <circle cx={p.x + NW - 10} cy={p.y + 10} r="4" fill={STATE_COLORS[s]} opacity={s === 0 ? '0.3' : '1'} />
                {hasSubs && (
                  <text x={p.x + 8} y={p.y + NH - 7} fontSize="8" fill={c.text} opacity="0.5" fontFamily="JetBrains Mono, monospace">
                    ⊞ {node.subs.length}
                  </text>
                )}
                {lines.map((line, i) => (
                  <text
                    key={i}
                    x={p.x + NW / 2} y={cy + i * 15}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={isGod ? '11' : '10'}
                    fontWeight={(s === 3 || isGod) ? '600' : '500'}
                    fill={s > 0 ? (isDark ? STATE_COLORS[s] : '#000000') : c.text}
                    fontFamily="JetBrains Mono, monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {popNode && (
        <div
          className="fixed z-50 p-3 rounded-lg pointer-events-auto border min-w-[280px] max-w-[540px] shadow-2xl"
          style={{
            backgroundColor: themeVars.popBg, borderColor: themeVars.popBorder,
            left: Math.max(8, Math.min(popNode.nx - 140, window.innerWidth - 288)),
            top: popNode.ny - 60 > 8 ? popNode.ny - 60 : popNode.ny + NH * popNode.scaleY + 10
          }}
          onMouseEnter={() => { if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current); }}
          onMouseLeave={() => { popTimeoutRef.current = setTimeout(() => setPopNode(null), 250); }}
        >
          <h4 className="text-[10px] font-medium uppercase tracking-wide mb-2 pb-2 border-b" style={{ color: isDark ? '#606068' : '#a1a1aa', borderColor: themeVars.border }}>
            {popNode.node.label.replace('\n', ' ')} — subtopics
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {popNode.node.subs.map(sid => {
              const s = getState(sid);
              const label = activeSubLabels[sid] || sid;
              return (
                <div
                  key={sid}
                  onClick={(e) => openMark(sid, label, e)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] border cursor-pointer transition-colors whitespace-nowrap text-[10px]"
                  style={{
                    backgroundColor: s === 1 ? 'rgba(29,185,122,.08)' : s === 2 ? 'rgba(61,142,240,.08)' : s === 3 ? 'rgba(224,123,42,.08)' : (isDark ? '#1a1a1d' : '#f4f4f5'),
                    borderColor: s > 0 ? STATE_COLORS[s] : themeVars.popBorder,
                    color: s > 0 ? STATE_COLORS[s] : (isDark ? '#a0a0ac' : '#52525b')
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-[2px]" style={{ backgroundColor: 'currentColor' }}></span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {markPop && (
        <div
          className="fixed z-[60] p-3 rounded-lg border w-[200px] shadow-2xl"
          style={{ backgroundColor: themeVars.popBg, borderColor: themeVars.popBorder, left: markPop.x, top: markPop.y }}
          onClick={e => e.stopPropagation()}
        >
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 text-sm" onClick={() => setMarkPop(null)}>×</button>
          <h4 className="text-[11px] font-medium mb-2.5 leading-tight pr-4" style={{ color: themeVars.text }}>{markPop.label}</h4>
          
          {[
            { v: 1, c: '#1db97a', bg: 'rgba(29,185,122,.1)', text: 'theory learned' },
            { v: 2, c: '#3d8ef0', bg: 'rgba(61,142,240,.1)', text: 'know implementation' },
            { v: 3, c: '#e07b2a', bg: 'rgba(224,123,42,.1)', text: 'mastery' }
          ].map((btn) => {
            const s = getState(markPop.id);
            const isOn = s >= btn.v;
            return (
              <button
                key={btn.v}
                onClick={() => toggleState(markPop.id, btn.v)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md border mb-1 transition-colors text-[10px]"
                style={{
                  backgroundColor: isOn ? btn.bg : (isDark ? '#1a1a1d' : '#f4f4f5'),
                  borderColor: isOn ? btn.c : themeVars.popBorder,
                  color: isOn ? btn.c : (isDark ? '#a0a0ac' : '#52525b')
                }}
              >
                <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: 'currentColor' }}></span>
                {btn.text}
              </button>
            );
          })}
          
          <div className="h-[2px] rounded-sm mt-2.5" style={{ backgroundColor: themeVars.popBorder }}>
            <div className="h-full rounded-sm transition-all duration-300" style={{
              width: `${(getState(markPop.id) / 3) * 100}%`,
              background: 'linear-gradient(90deg, #1db97a, #3d8ef0, #e07b2a)'
            }}></div>
          </div>
        </div>
      )}

      {/* Modern Stats Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-[40]">
        <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-6">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Progress</span>
                <div className="flex items-center gap-2">
                   <span className="text-lg font-black tracking-tighter">{Math.round((stats.mastered / (stats.total || 1)) * 100)}%</span>
                   <div className="w-24 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(stats.mastered / (stats.total || 1)) * 100}%` }} />
                   </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 border-l border-gray-200 dark:border-white/10 pl-6">
                 {[
                   { label: 'Mastered', val: stats.mastered, color: 'text-emerald-500' },
                   { label: 'Implementation', val: stats.inProgress, color: 'text-blue-500' },
                   { label: 'Touched', val: stats.touched, color: 'text-amber-500' }
                 ].map(s => (
                   <div key={s.label} className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-gray-500">{s.label}</span>
                      <span className={`text-sm font-black ${s.color}`}>{s.val}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDsa ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {isDsa ? 'DSA Track' : 'CP Track'}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
