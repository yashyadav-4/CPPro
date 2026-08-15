import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, Minus, Flame, Target, Calendar,
  Zap, Award, AlertCircle, Code2, TerminalSquare, CheckCircle,
  Hash, FileCode, BarChart3, Trophy, Lightbulb, ArrowUp, ArrowDown,
  Info, Rocket, ShieldAlert, Swords, Sparkles,
  Flag, ChevronRight, Medal
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import axios from 'axios';
import { useTheme } from '../../hooks/useTheme';

/* ── constants ───────────────────────────────────────────── */
const VERDICT_COLORS = { AC:'#22c55e', WA:'#ef4444', TLE:'#f59e0b', MLE:'#8b5cf6', RE:'#f97316', CE:'#ec4899', PA:'#3b82f6', OTHER:'#6b7280' };
const VERDICT_LABELS = { AC:'Accepted', WA:'Wrong Answer', TLE:'Time Limit', MLE:'Memory Limit', RE:'Runtime Error', CE:'Compile Error', PA:'Partial', OTHER:'Other' };
const PLATFORM_META = {
  codeforces: { label:'Codeforces', color:'#3b82f6', icon: TerminalSquare },
  leetcode:   { label:'LeetCode',   color:'#f59e0b', icon: Code2 },
  codechef:   { label:'CodeChef',   color:'#0d9488', icon: CheckCircle },
};
const INSIGHT_ICONS = { 'trending-up':TrendingUp, 'trending-down':TrendingDown, rocket:Rocket, target:Target, flame:Flame, calendar:Calendar, 'arrow-up':ArrowUp, info:Info, lightbulb:Lightbulb, trophy:Trophy };
const INSIGHT_STYLES = { positive:'border-emerald-500/30 bg-emerald-500/5 text-emerald-400', warning:'border-amber-500/30 bg-amber-500/5 text-amber-400', info:'border-blue-500/30 bg-blue-500/5 text-blue-400' };

/* ── tiny helpers ─────────────────────────────────────────── */
function DeltaChip({ current, previous, suffix = '' }) {
  const delta = current - previous;
  if (delta === 0) return <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full text-gray-400 bg-gray-500/10"><Minus className="w-3 h-3" />No change</span>;
  const up = delta > 0;
  const pct = previous > 0 ? Math.round(Math.abs(delta) / previous * 100) : 0;
  const label = previous === 0 ? `+${Math.abs(delta)} new` : pct > 500 ? `${up?'+':'-'}${Math.abs(delta)} vs prev` : `${pct}%${suffix} vs prev`;
  return <span className={`inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${up?'text-emerald-400 bg-emerald-500/10':'text-red-500 bg-red-500/10'}`}>{up?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}{label}</span>;
}
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-3 py-2 shadow-xl text-xs text-gray-900 dark:text-white"><p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{label}</p>{payload.map((p,i)=><div key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor:p.color||p.fill}}/><span className="text-gray-500 dark:text-gray-400 capitalize">{p.dataKey}</span><span className="ml-auto font-bold text-gray-900 dark:text-white font-[family-name:'JetBrains_Mono']">{p.value}</span></div>)}</div>;
}
function Card({ children, delay=0, className='' }) {
  return <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay,duration:0.3}} className={`bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl p-4 ${className}`}>{children}</motion.div>;
}
function Title({ icon:Icon, color='text-emerald-500', children }) {
  return <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2"><Icon className={`w-3.5 h-3.5 ${color}`}/>{children}</h3>;
}

/* ── main component ──────────────────────────────────────── */
export default function ProgressTab() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const cacheKey = 'cppro_levelup_stats';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch (e) {
        console.warn('ProgressTab cache parse error', e);
      }
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const res = await axios.get('/api/levelup/performance-stats', { withCredentials: true });
      const newData = res.data?.data || null;
      const newCacheString = JSON.stringify(newData);
      
      if (newCacheString !== cached) {
        setData(newData);
        localStorage.setItem(cacheKey, newCacheString);
      }
    } catch (err) {
      if (!localStorage.getItem(cacheKey)) {
        setError(err.response?.data?.message || err.message || 'Failed to load stats');
      }
    } finally { 
      setLoading(false); 
    }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const last30Days = useMemo(() => {
    const d = [];
    for (let i = 29; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate()-i); d.push(new Date(dt.getTime()+5.5*3600000).toISOString().slice(0,10)); }
    return d;
  }, []);
  const activityMap = useMemo(() => {
    if (!data?.dailyActivity) return {};
    const m = {}; data.dailyActivity.forEach(d => { m[d._id] = d.count; }); return m;
  }, [data]);

  if (loading) return <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl animate-pulse" style={{height:i===0?80:160}}/>)}</motion.div>;

  if (error) return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-[#121212]/50 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-8 backdrop-blur-xl text-center py-16">
      <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4"/><p className="text-gray-700 dark:text-gray-400 mb-1 font-medium">Failed to load performance stats</p>
      <p className="text-sm text-gray-500 mb-6">{error}</p>
      <button onClick={fetchData} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors">Retry</button>
    </motion.div>
  );

  if (!data || (data.overview.solved === 0 && data.overview.submissions === 0)) return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-[#121212]/50 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-8 backdrop-blur-xl">
      <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><Activity className="text-emerald-500 w-5 h-5"/></div><div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Stats</h2><p className="text-sm text-gray-500 dark:text-gray-400">Your coding journey over the last 30 days</p></div></div>
      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl"><BarChart3 className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-3"/><p className="text-gray-500 font-medium">No submissions in the last 30 days</p></div>
    </motion.div>
  );

  const { overview, comparison, weeklyData, verdictDist, platformSplit, languageDist, topTags,
    weaknessTags, strengthTags, difficultyProgression, dayOfWeek, insights,
    recentContests, paceProjection, milestones, difficultyDist,
    ratings, linkedAccounts } = data;

  const verdictData = (verdictDist||[]).map(v=>({name:VERDICT_LABELS[v._id]||v._id,value:v.count,fill:VERDICT_COLORS[v._id]||'#6b7280',key:v._id})).sort((a,b)=>b.value-a.value);
  const totalVerdicts = verdictData.reduce((s,v)=>s+v.value,0);
  const maxLangCount = languageDist?.length ? Math.max(...languageDist.map(l=>l.count)) : 1;
  const hasRatings = (linkedAccounts?.codeforces&&ratings?.codeforces?.current)||(linkedAccounts?.leetcode&&ratings?.leetcode?.current)||(linkedAccounts?.codechef&&ratings?.codechef?.current);
  const dowMax = dayOfWeek?.length ? Math.max(...dayOfWeek.map(d=>d.count),1) : 1;
  const consistencyData = [{name:'score',value:overview.consistencyScore||0,fill:'#22c55e'}];

  const statCards = [
    {l:'Solved',v:overview.solved,icon:Target,c:'emerald',k:'solved'},
    {l:'Submissions',v:overview.submissions,icon:FileCode,c:'blue',k:'submissions'},
    {l:'Acc. Rate',v:`${overview.accRate}%`,icon:Award,c:'violet',k:'accRate'},
    {l:'Active Days',v:overview.activeDays,icon:Calendar,c:'amber',k:'activeDays'},
    {l:'Streak',v:`${overview.streak}d`,icon:Flame,c:'orange',extra:overview.longestStreak>0?`Best: ${overview.longestStreak}d`:null},
    {l:'Avg/Day',v:overview.avgPerDay,icon:Zap,c:'cyan'},
  ];
  const cm = {
    emerald:{t:'text-emerald-600 dark:text-emerald-500',bg:'bg-emerald-500/10',hb:'hover:border-emerald-500/30'},
    blue:{t:'text-blue-600 dark:text-blue-500',bg:'bg-blue-500/10',hb:'hover:border-blue-500/30'},
    violet:{t:'text-violet-600 dark:text-violet-500',bg:'bg-violet-500/10',hb:'hover:border-violet-500/30'},
    amber:{t:'text-amber-600 dark:text-amber-500',bg:'bg-amber-500/10',hb:'hover:border-amber-500/30'},
    orange:{t:'text-orange-600 dark:text-orange-500',bg:'bg-orange-500/10',hb:'hover:border-orange-500/30'},
    cyan:{t:'text-cyan-600 dark:text-cyan-500',bg:'bg-cyan-500/10',hb:'hover:border-cyan-500/30'},
  };

  const chartTickColor = isDark ? '#9ca3af' : '#4b5563';

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="space-y-3">

      {/* ── Row 0: Header + Info ─── */}
      <div className="bg-white dark:bg-[#121212]/50 border border-gray-200 dark:border-gray-800/60 rounded-2xl px-5 py-4 backdrop-blur-xl shadow-xs dark:shadow-none">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><Activity className="text-emerald-500 w-5 h-5"/></div>
          <div><h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Performance Stats</h2><p className="text-xs text-gray-500 dark:text-gray-400">Last 30 days vs previous month</p></div>
        </div>
        <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/15 rounded-lg">
          <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"/>
          <p className="text-[11px] text-blue-700 dark:text-blue-300/80 leading-relaxed">Re-solving old problems counts as separate submissions — revisiting builds pattern recognition and contest speed.</p>
        </div>
      </div>

      {/* ── Row 1: Insights (compact, max 3) + Consistency Score ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {insights?.length > 0 && (
          <Card delay={0.05} className="lg:col-span-3">
            <Title icon={Sparkles} color="text-violet-500">Insights</Title>
            <div className="space-y-1.5">
              {insights.slice(0,3).map((ins,i) => {
                const Ic = INSIGHT_ICONS[ins.icon]||Info;
                const lightStyles = ins.type === 'positive' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : ins.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800';
                return <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${lightStyles} dark:${INSIGHT_STYLES[ins.type]||INSIGHT_STYLES.info}`}><Ic className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"/><p className="leading-relaxed">{ins.text}</p></div>;
              })}
            </div>
          </Card>
        )}
        <Card delay={0.08} className="flex flex-col items-center justify-center">
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={consistencyData} barSize={8}>
                <RadialBar background={{fill: isDark ? '#1a1a1a' : '#e5e7eb'}} dataKey="value" cornerRadius={10}/>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">Consistency</p>
          <p className="text-2xl font-bold font-[family-name:'JetBrains_Mono'] text-gray-900 dark:text-white">{overview.consistencyScore||0}<span className="text-sm text-gray-400 dark:text-gray-500">/100</span></p>
        </Card>
      </div>

      {/* ── Row 2: Stat Cards (compact 2x3 → 3x2 on lg) ─── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
        {statCards.map((s,i) => {
          const Ic=s.icon; const c=cm[s.c]; const comp=s.k?comparison[s.k]:null;
          return (
            <motion.div key={s.l} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.03*i}}
              className={`bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#1a1a1a] rounded-xl p-3 shadow-xs dark:shadow-none ${c.hb} transition-all`}>
              <div className="flex items-center gap-1.5 mb-1.5"><div className={`p-1 rounded-md ${c.bg}`}><Ic className={`w-3 h-3 ${c.t}`}/></div><span className="text-[9px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.l}</span></div>
              <div className="text-xl font-bold font-[family-name:'JetBrains_Mono'] text-gray-900 dark:text-white leading-none">{s.v}</div>
              {comp && <DeltaChip current={comp.current} previous={comp.previous}/>}
              {s.extra && <span className="inline-flex items-center gap-1 text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-full text-amber-600 dark:text-amber-400 bg-amber-500/10"><Trophy className="w-2.5 h-2.5"/>{s.extra}</span>}
            </motion.div>
          );
        })}
      </div>

      {/* ── Row 3: Activity Grid + Day of Week ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card delay={0.15} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <Title icon={Activity}>30-Day Activity</Title>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-[family-name:'JetBrains_Mono']">{overview.activeDays}/30 active</span>
          </div>
          <div className="flex gap-[4px] flex-wrap">
            {last30Days.map(day => {
              const cnt = activityMap[day]||0;
              const int = cnt===0?'bg-gray-100 dark:bg-[#1a1a1a]':cnt<=1?'bg-emerald-200 dark:bg-emerald-900/40':cnt<=3?'bg-emerald-400 dark:bg-emerald-700/60':cnt<=6?'bg-emerald-500 dark:bg-emerald-600/80':'bg-emerald-600 dark:bg-emerald-500';
              const dl = new Date(day+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
              return <div key={day} title={`${dl}: ${cnt}`} className={`w-[26px] h-[26px] md:w-7 md:h-7 rounded-md ${int} hover:scale-110 transition-transform cursor-default`}/>;
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-gray-500 dark:text-gray-400">
            <span>Less</span>
            {['bg-gray-100 dark:bg-[#1a1a1a]','bg-emerald-200 dark:bg-emerald-900/40','bg-emerald-400 dark:bg-emerald-700/60','bg-emerald-500 dark:bg-emerald-600/80','bg-emerald-600 dark:bg-emerald-500'].map((c,i)=><div key={i} className={`w-3 h-3 rounded ${c}`}/>)}
            <span>More</span>
          </div>
        </Card>

        {dayOfWeek?.length > 0 && (
          <Card delay={0.18}>
            <Title icon={Calendar} color="text-amber-500">Weekly Pattern</Title>
            <div className="flex items-end gap-1.5 justify-between h-24">
              {dayOfWeek.map((d,i) => {
                const h = dowMax>0?Math.max((d.count/dowMax)*100,6):6;
                const mx = d.count===dowMax&&d.count>0;
                return <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-bold font-[family-name:'JetBrains_Mono'] ${mx?'text-emerald-600 dark:text-emerald-400':'text-gray-400 dark:text-gray-600'}`}>{d.count}</span>
                  <motion.div initial={{height:0}} animate={{height:`${h}%`}} transition={{delay:0.2+i*0.04,duration:0.4}} className={`w-full rounded-md ${mx?'bg-emerald-500':'bg-emerald-500/20'}`} style={{minHeight:'4px'}}/>
                  <span className={`text-[9px] ${mx?'text-emerald-600 dark:text-emerald-400':'text-gray-500 dark:text-gray-600'}`}>{d.day}</span>
                </div>;
              })}
            </div>
          </Card>
        )}
      </div>

      {/* ── Row 4: Weakness + Strengths + Difficulty Progression ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {weaknessTags?.length > 0 && (
          <Card delay={0.2}>
            <Title icon={ShieldAlert} color="text-red-500 dark:text-red-400">Weak Areas</Title>
            <div className="space-y-2">
              {weaknessTags.slice(0,4).map((t,i) => (
                <div key={t.tag} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-700 dark:text-gray-300 w-24 truncate">{t.tag}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${t.rate}%`}} transition={{delay:0.3+i*0.04,duration:0.5}}
                      className={`h-full rounded-full ${t.rate<30?'bg-red-500':t.rate<60?'bg-amber-500':'bg-emerald-500'}`}/>
                  </div>
                  <span className={`text-[10px] font-bold font-[family-name:'JetBrains_Mono'] w-8 text-right ${t.rate<30?'text-red-600 dark:text-red-400':t.rate<60?'text-amber-600 dark:text-amber-400':'text-emerald-600 dark:text-emerald-400'}`}>{t.rate}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        {strengthTags?.length > 0 && (
          <Card delay={0.22}>
            <Title icon={Swords} color="text-emerald-500">Strengths</Title>
            <div className="space-y-2">
              {strengthTags.slice(0,4).map((t,i) => (
                <div key={t.tag} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-700 dark:text-gray-300 w-24 truncate">{t.tag}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${t.rate}%`}} transition={{delay:0.3+i*0.04,duration:0.5}} className="h-full rounded-full bg-emerald-500"/>
                  </div>
                  <span className="text-[10px] font-bold font-[family-name:'JetBrains_Mono'] w-8 text-right text-emerald-600 dark:text-emerald-400">{t.rate}%</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        {(difficultyProgression?.current > 0 || difficultyProgression?.hardest > 0) && (
          <Card delay={0.24}>
            <Title icon={ArrowUp} color="text-violet-500">Difficulty Level</Title>
            <div className="grid grid-cols-3 gap-2">
              {[{l:'Avg Now',v:difficultyProgression.current,c:'text-gray-900 dark:text-white'},{l:'Avg Prev',v:difficultyProgression.previous||'—',c:'text-gray-500 dark:text-gray-400'},{l:'Hardest',v:difficultyProgression.hardest,c:'text-emerald-600 dark:text-emerald-400'}].map(d=>(
                <div key={d.l} className="text-center p-2 bg-gray-50 dark:bg-[#0c0c0c] rounded-lg border border-gray-200 dark:border-[#1a1a1a]">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">{d.l}</p>
                  <p className={`text-lg font-bold font-[family-name:'JetBrains_Mono'] ${d.c}`}>{d.v}</p>
                </div>
              ))}
            </div>
            {difficultyProgression.current>0 && difficultyProgression.previous>0 && <div className="mt-2"><DeltaChip current={difficultyProgression.current} previous={difficultyProgression.previous}/></div>}
          </Card>
        )}
      </div>

      {/* ── Row 5: Weekly Chart + Verdict Donut + Platform Split ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card delay={0.26}>
          <Title icon={BarChart3} color="text-blue-500">Weekly Progress</Title>
          {weeklyData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={isDark ? 0.06 : 0.1} vertical={false}/>
                <XAxis dataKey="week" tick={{fill:chartTickColor,fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:chartTickColor,fontSize:10}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTooltip/>} cursor={{fill:isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}}/>
                <Bar dataKey="codeforces" stackId="a" fill="#3b82f6" radius={[0,0,0,0]}/>
                <Bar dataKey="leetcode" stackId="a" fill="#f59e0b" radius={[0,0,0,0]}/>
                <Bar dataKey="codechef" stackId="a" fill="#0d9488" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[160px] flex items-center justify-center text-gray-500 dark:text-gray-600 text-sm">No data</div>}
          <div className="flex items-center gap-3 mt-2 justify-center">
            {Object.entries(PLATFORM_META).map(([k,m])=><div key={k} className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-500"><span className="w-2 h-2 rounded-full" style={{backgroundColor:m.color}}/>{m.label}</div>)}
          </div>
        </Card>

        <Card delay={0.28}>
          <Title icon={Award} color="text-violet-500">Verdicts</Title>
          {verdictData.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-[120px] h-[120px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={verdictData} innerRadius={35} outerRadius={55} dataKey="value" nameKey="name" paddingAngle={2} stroke="none">
                    {verdictData.map(v=><Cell key={v.key} fill={v.fill}/>)}
                  </Pie><Tooltip contentStyle={{backgroundColor:isDark ? '#1a1a1a' : '#ffffff',border:isDark ? '1px solid #333' : '1px solid #e5e7eb',borderRadius:'10px',fontSize:'11px',color:isDark ? '#fff' : '#111827'}} itemStyle={{color:isDark ? '#fff' : '#111827'}} formatter={(v,n)=>[`${v} (${Math.round(v/totalVerdicts*100)}%)`,n]}/></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1">
                {verdictData.slice(0,5).map(v=><div key={v.key} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:v.fill}}/><span className="text-[10px] text-gray-600 dark:text-gray-400 truncate flex-1">{v.name}</span><span className="text-[10px] font-bold font-[family-name:'JetBrains_Mono'] text-gray-800 dark:text-gray-300">{v.value}</span></div>)}
              </div>
            </div>
          ) : <div className="h-[120px] flex items-center justify-center text-gray-500 dark:text-gray-600 text-sm">No data</div>}
        </Card>

        {platformSplit?.length > 0 && (
          <Card delay={0.3}>
            <Title icon={Code2} color="text-blue-500">Platforms</Title>
            <div className="space-y-3">
              {['codeforces','leetcode','codechef'].map(p => {
                const meta=PLATFORM_META[p]; const split=platformSplit.find(s=>s._id===p);
                if(!split) return null;
                const Ic=meta.icon; const total=platformSplit.reduce((s,x)=>s+x.count,0); const pct=total>0?Math.round(split.count/total*100):0;
                return <div key={p}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5"><Ic className="w-3 h-3" style={{color:meta.color}}/><span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{meta.label}</span></div>
                    <span className="text-sm font-bold font-[family-name:'JetBrains_Mono'] text-gray-900 dark:text-white">{split.count} <span className="text-[10px] text-gray-500">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:0.4,duration:0.6}} className="h-full rounded-full" style={{backgroundColor:meta.color}}/>
                  </div>
                </div>;
              })}
            </div>
          </Card>
        )}
      </div>

      {/* ── Row 6: Rating + Milestones + Pace ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {hasRatings && (
          <Card delay={0.32}>
            <Title icon={Trophy} color="text-amber-500">Ratings</Title>
            <div className="space-y-2.5">
              {['codeforces','leetcode','codechef'].map(p => {
                if(!linkedAccounts?.[p]||!ratings?.[p]?.current) return null;
                const meta=PLATFORM_META[p]; const Ic=meta.icon; const cur=ratings[p].current; const prev=ratings[p].previous; const d=cur-prev;
                return <div key={p} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-[#0c0c0c] rounded-lg border border-gray-200 dark:border-[#1a1a1a]">
                  <div className="p-1.5 rounded-lg" style={{backgroundColor:meta.color+'15'}}><Ic className="w-4 h-4" style={{color:meta.color}}/></div>
                  <div className="flex-1"><p className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{meta.label}</p><p className="text-lg font-bold font-[family-name:'JetBrains_Mono'] text-gray-900 dark:text-white">{cur}</p></div>
                  {d!==0&&<span className={`text-xs font-semibold ${d>0?'text-emerald-600 dark:text-emerald-500':'text-red-500'}`}>{d>0?'↑':'↓'}{Math.abs(d)}</span>}
                </div>;
              })}
            </div>
          </Card>
        )}

        {milestones && Object.keys(milestones).length > 0 && (
          <Card delay={0.34}>
            <Title icon={Flag} color="text-amber-500">Next Milestone</Title>
            <div className="space-y-2.5">
              {['codeforces','leetcode','codechef'].map(p => {
                const m=milestones[p]; if(!m) return null;
                const meta=PLATFORM_META[p]; const Ic=meta.icon;
                return <div key={p} className="p-2 bg-gray-50 dark:bg-[#0c0c0c] rounded-lg border border-gray-200 dark:border-[#1a1a1a]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5"><Ic className="w-3 h-3" style={{color:meta.color}}/><span className="text-[10px] text-gray-600 dark:text-gray-400">{meta.label}</span></div>
                    <div className="flex items-center gap-1 text-xs font-bold font-[family-name:'JetBrains_Mono']"><span className="text-gray-900 dark:text-white">{m.current}</span><ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500"/><span style={{color:meta.color}}>{m.next}</span></div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${m.progress}%`}} transition={{delay:0.5,duration:0.7}} className="h-full rounded-full" style={{backgroundColor:meta.color}}/>
                  </div>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">{m.remaining} pts to go</p>
                </div>;
              })}
            </div>
          </Card>
        )}

        {paceProjection && paceProjection.projectedMonthly > 0 && (
          <Card delay={0.36}>
            <Title icon={Rocket} color="text-cyan-500">Pace Projection</Title>
            <div className="space-y-2.5">
              {[{l:'Daily',v:paceProjection.dailyRate,u:'/day',c:'text-cyan-600 dark:text-cyan-500'},{l:'Monthly',v:paceProjection.projectedMonthly,u:'/mo',c:'text-emerald-600 dark:text-emerald-500'},{l:'Yearly',v:paceProjection.projectedYearly,u:'/yr',c:'text-violet-600 dark:text-violet-500'}].map(r=>(
                <div key={r.l} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#0c0c0c] rounded-lg border border-gray-200 dark:border-[#1a1a1a]">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{r.l}</span>
                  <div><span className={`text-lg font-bold font-[family-name:'JetBrains_Mono'] ${r.c}`}>{r.v}</span><span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">{r.u}</span></div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Row 7: Tags + Languages + Recent Contests ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card delay={0.38}>
          <Title icon={Hash} color="text-emerald-500">Top Tags</Title>
          {topTags?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topTags.map(t=><span key={t._id} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold">{t._id}<span className="text-emerald-600/60 dark:text-emerald-500/50 font-[family-name:'JetBrains_Mono']">{t.count}</span></span>)}
            </div>
          ) : <p className="text-xs text-gray-500 dark:text-gray-600">No data</p>}
        </Card>

        <Card delay={0.4}>
          <Title icon={Code2} color="text-blue-500">Languages</Title>
          {languageDist?.length > 0 ? (
            <div className="space-y-2">
              {languageDist.slice(0,5).map((l,i)=><div key={l._id}>
                <div className="flex items-center justify-between mb-0.5"><span className="text-[11px] text-gray-700 dark:text-gray-300">{l._id||'Unknown'}</span><span className="text-[10px] font-bold font-[family-name:'JetBrains_Mono'] text-gray-500 dark:text-gray-400">{l.count}</span></div>
                <div className="h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${(l.count/maxLangCount)*100}%`}} transition={{delay:0.4+i*0.04,duration:0.5}} className="h-full bg-blue-500 rounded-full"/></div>
              </div>)}
            </div>
          ) : <p className="text-xs text-gray-500 dark:text-gray-600">No data</p>}
        </Card>

        {recentContests?.length > 0 && (
          <Card delay={0.42}>
            <Title icon={Medal} color="text-amber-500">Recent Contests</Title>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {recentContests.slice(0,6).map((c,i) => {
                const meta=PLATFORM_META[c.platform]||{};
                const ds=c.date?new Date(c.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
                return <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#0c0c0c] rounded-lg border border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] transition-colors">
                  <div className="w-1 h-6 rounded-full flex-shrink-0" style={{backgroundColor:meta.color||'#888'}}/>
                  <div className="flex-1 min-w-0"><p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 truncate">{c.name}</p><p className="text-[9px] text-gray-500">{ds}{c.rank?` · #${c.rank}`:''}</p></div>
                  <div className="text-right flex-shrink-0"><p className="text-xs font-bold font-[family-name:'JetBrains_Mono'] text-gray-900 dark:text-white">{c.rating}</p>
                    {c.delta!==0&&<p className={`text-[9px] font-semibold ${c.delta>0?'text-emerald-600 dark:text-emerald-500':'text-red-500'}`}>{c.delta>0?'+':''}{c.delta}</p>}
                  </div>
                </div>;
              })}
            </div>
          </Card>
        )}
      </div>

      {/* ── Row 8: Difficulty Distribution (compact) ─── */}
      {difficultyDist?.length > 0 && (
        <Card delay={0.44}>
          <Title icon={BarChart3} color="text-violet-500">Difficulty Distribution</Title>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={difficultyDist.filter(d=>d._id&&d._id!=='0'&&d._id!=='').sort((a,b)=>(parseInt(a._id)||0)-(parseInt(b._id)||0))}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={isDark ? 0.06 : 0.1} vertical={false}/>
              <XAxis dataKey="_id" tick={{fill:chartTickColor,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:chartTickColor,fontSize:9}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<ChartTooltip/>} cursor={{fill:isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}}/>
              <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} name="Problems"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </motion.div>
  );
}
