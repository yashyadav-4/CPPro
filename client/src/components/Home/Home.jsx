import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE } from '../../api';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Link2, Zap, LineChart } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

/* ══════════════════════════════════════════════════════
   THEME TOKENS
   Light: white + slate + emerald (approved design)
   Dark:  pure black + greys + emerald — NO navy/blue bg
══════════════════════════════════════════════════════ */
const LIGHT = {
  bg:"#ffffff",bg2:"#f8fafc",bg3:"#f1f5f9",bgCard:"#ffffff",bgAlt:"#f8fafc",
  border:"#e2e8f0",border2:"#cbd5e1",
  muted:"#94a3b8",subtle:"#64748b",body:"#334155",heading:"#0f172a",
  accent:"#16a34a",accentHov:"#15803d",accentLt:"#22c55e",
  accentBg:"#f0fdf4",accentBdr:"#bbf7d0",
  statsBar:"linear-gradient(to right, #ffffff, #f0fdf4, #ffffff)",statsText:"#0f172a",statsLbl:"#64748b",statsDvdr:"rgba(22,163,74,0.1)",
  ctaBg:"#f8fafc",ctaText:"#0f172a",ctaSub:"#64748b",ctaBdr:"#e2e8f0",
  shadow:"rgba(0,0,0,0.06)",shadowMd:"rgba(0,0,0,0.12)",
  gridLine:"rgba(0,0,0,0.04)",glow:"rgba(22,163,74,0.07)",
  toggleBg:"#f1f5f9",toggleBdr:"#e2e8f0",
  youBg:"#f0fdf4",youBdr:"#bbf7d0",
  stepHover:"#f8fafc",testiBg:"#ffffff",testiBdr:"#e2e8f0",
};

const DARK = {
  bg:"#0a0a0a",bg2:"#111111",bg3:"#1a1a1a",bgCard:"#111111",bgAlt:"#111111",
  border:"#222222",border2:"#333333",
  muted:"#4a4a4a",subtle:"#888888",body:"#b0b0b0",heading:"#f0f0f0",
  accent:"#22c55e",accentHov:"#16a34a",accentLt:"#4ade80",
  accentBg:"rgba(34,197,94,0.07)",accentBdr:"rgba(34,197,94,0.2)",
  statsBar:"#111111",statsText:"#f0f0f0",statsLbl:"#555555",statsDvdr:"#1a1a1a",
  ctaBg:"#111111",ctaText:"#f0f0f0",ctaSub:"#666666",ctaBdr:"#222222",
  shadow:"rgba(0,0,0,0.5)",shadowMd:"rgba(0,0,0,0.7)",
  gridLine:"rgba(255,255,255,0.025)",glow:"rgba(34,197,94,0.05)",
  toggleBg:"#1a1a1a",toggleBdr:"#333333",
  youBg:"rgba(34,197,94,0.06)",youBdr:"rgba(34,197,94,0.18)",
  stepHover:"#1a1a1a",testiBg:"#111111",testiBdr:"#222222",
};

const ease = [0.16,1,0.3,1];
const fadeUp = {
  hidden:{opacity:0,y:22},
  visible:(i=0)=>({opacity:1,y:0,transition:{duration:0.55,delay:i*0.08,ease}}),
};
const stagger = {hidden:{},visible:{transition:{staggerChildren:0.06}}};

/* ── TYPEWRITER ─────────────────────────────────────── */
const TW=["Rating.","Rankings.","Progress.","Consistency.","Mastery."];
function Typewriter({color}){
  const[idx,setIdx]=useState(0);
  const[text,setText]=useState("");
  const[del,setDel]=useState(false);
  const[blink,setBlink]=useState(true);
  useEffect(()=>{
    const w=TW[idx];let t;
    if(!del&&text.length<w.length) t=setTimeout(()=>setText(w.slice(0,text.length+1)),80);
    else if(!del&&text.length===w.length) t=setTimeout(()=>setDel(true),1800);
    else if(del&&text.length>0) t=setTimeout(()=>setText(text.slice(0,-1)),42);
    else{setDel(false);setIdx(i=>(i+1)%TW.length);}
    return()=>clearTimeout(t);
  },[text,del,idx]);
  useEffect(()=>{const iv=setInterval(()=>setBlink(b=>!b),530);return()=>clearInterval(iv);},[]);
  return <span style={{color}}>{text}<span style={{opacity:blink?1:0,transition:"opacity 0.1s",color}}> |</span></span>;
}

/* ── COUNT UP ───────────────────────────────────────── */
function useCountUp(target,dur=1200,active=false){
  const[n,setN]=useState(0);
  useEffect(()=>{
    if(!active)return;
    let t0=null;
    const raf=ts=>{
      if(!t0)t0=ts;
      const p=Math.min((ts-t0)/dur,1);
      setN(Math.floor((1-Math.pow(1-p,3))*target));
      if(p<1)requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  },[active,target,dur]);
  return n;
}

/* ── RATING GRAPH ───────────────────────────────────── */
function RatingGraph({t}){
  const ref=useRef(null);
  const inView=useInView(ref,{once:true});
  const[prog,setProg]=useState(0);
  useEffect(()=>{
    if(!inView)return;
    let s=null;
    const raf=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/1800,1);setProg(p);if(p<1)requestAnimationFrame(raf);};
    requestAnimationFrame(raf);
  },[inView]);
  const pts=[[0,78],[60,72],[120,68],[180,75],[240,62],[300,55],[360,48],[420,42],[480,35],[540,28],[600,18],[660,10],[720,4]];
  const pp=pts.map(([x,y])=>`${x},${y}`).join(" ");
  const drawn=prog*760;
  return(
    <div ref={ref}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.45rem"}}>
        {["6 MONTHS AGO","TODAY"].map((l,i)=><span key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:t.muted,letterSpacing:"0.08em"}}>{l}</span>)}
      </div>
      <svg width="100%" viewBox="0 0 720 90" preserveAspectRatio="none" style={{display:"block",height:70}}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={t.accent} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={t.accent} stopOpacity="0"/>
          </linearGradient>
          <clipPath id="rc"><rect x="0" y="0" width={drawn} height="90"/></clipPath>
        </defs>
        {[20,45,70].map(y=><line key={y} x1="0" y1={y} x2="720" y2={y} stroke={t.border} strokeWidth="0.8" strokeDasharray="4,4"/>)}
        <path d={`M ${pp} L 720,90 L 0,90 Z`} fill="url(#rg)" clipPath="url(#rc)"/>
        <polyline points={pp} fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          style={{strokeDasharray:760,strokeDashoffset:760-drawn}}/>
        {prog>0.95&&<motion.circle cx="720" cy="4" r="5" fill={t.accent} initial={{scale:0}} animate={{scale:[0,1.4,1]}} transition={{duration:0.4}}/>}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.35rem"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:t.muted}}>1580</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:t.accent,fontWeight:700}}>1847 ▲</span>
      </div>
    </div>
  );
}

/* ── HEATMAP ────────────────────────────────────────── */
function HeatmapPreview({t}){
  const ref=useRef(null);
  const inView=useInView(ref,{once:true});
  const cells=useRef(Array.from({length:140},()=>Math.random())).current;
  const gc=v=>{
    if(v>0.65)return t.accent;
    if(v>0.45)return t.accentLt+"66";
    if(v>0.3)return t.accentBdr;
    return t.bg3;
  };
  return(
    <div ref={ref}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(20,1fr)",gap:3}}>
        {cells.map((v,i)=>(
          <motion.div key={i}
            initial={{opacity:0,scale:0.3}} animate={inView?{opacity:1,scale:1}:{}}
            transition={{delay:i*0.003,type:"spring",stiffness:300,damping:20}}
            style={{width:"100%",paddingBottom:"100%",borderRadius:2,background:gc(v)}}/>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginTop:"0.7rem",justifyContent:"flex-end"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted}}>Less</span>
        {[t.bg3,t.accentBdr,t.accentLt+"66",t.accent].map((c,i)=>(
          <div key={i} style={{width:9,height:9,borderRadius:2,background:c}}/>
        ))}
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted}}>More</span>
      </div>
    </div>
  );
}

/* ── STATS BAR ──────────────────────────────────────── */
function LiveStatsBar({t, stats}){
  const ref=useRef(null);
  const inView=useInView(ref,{once:true});
  const data=[
    {n:stats.syncedToday,suf:"",lbl:"Ratings synced today"},
    {n:stats.problemsTracked,suf:"+",lbl:"Problems tracked"},
    {n:parseFloat(stats.uptime),suf:"%",lbl:"Uptime"},
    {n:stats.activeUsers,suf:"+",lbl:"Active users"}
  ];
  return(
    <div ref={ref} style={{background:t.statsBar,borderTop:`1px solid ${t.statsDvdr}`,borderBottom:`1px solid ${t.statsDvdr}`}}>
      <motion.div initial="hidden" animate={inView?"visible":"hidden"} variants={stagger}
        className="stats-flex" style={{display:"flex",maxWidth:1120,margin:"0 auto",padding:"0 3rem"}}>
        {data.map((s,i)=>{
          const count=useCountUp(s.n,1400,inView);
          return(
            <motion.div key={i} variants={fadeUp}
              style={{flex:1,padding:"1.35rem 1.5rem",borderRight:i<data.length-1?`1px solid ${t.statsDvdr}`:"none"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"1.45rem",color:t.statsText,fontWeight:700,lineHeight:1}}>
                {count.toLocaleString()}{s.suf}
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:t.statsLbl,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:"0.3rem"}}>
                {s.lbl}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ── FEATURE VISUALS ────────────────────────────────── */
function TargetsVisual({t}){
  const ref=useRef(null);const inView=useInView(ref,{once:true});
  const tiers=[
    {lbl:"Master First",rating:"1800–1849",fill:72,color:t.accent},
    {lbl:"Current Bracket",rating:"1850–1899",fill:48,color:"#3b82f6"},
    {lbl:"Stretch Goal",rating:"1900–1949",fill:22,color:"#a855f7"},
  ];
  return(
    <div ref={ref} style={{padding:"0.8rem 0"}}>
      {tiers.map((item,i)=>(
        <div key={i} style={{marginBottom:"1rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.3rem"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:t.body,fontWeight:600}}>{item.lbl}</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:t.muted}}>{item.rating}</span>
          </div>
          <div style={{height:6,background:t.bg3,borderRadius:3,overflow:"hidden"}}>
            <motion.div initial={{width:0}} animate={inView?{width:`${item.fill}%`}:{}}
              transition={{duration:0.9,delay:0.2+i*0.15,ease}}
              style={{height:"100%",background:item.color,borderRadius:3}}/>
          </div>
          <div style={{fontSize:"0.54rem",color:t.muted,fontFamily:"'JetBrains Mono',monospace",marginTop:"0.18rem"}}>{item.fill} problems available</div>
        </div>
      ))}
    </div>
  );
}

function UpsolveVisual({t}){
  const ref=useRef(null);const inView=useInView(ref,{once:true});
  const items=[
    {name:"Div.2 E — Tree DP",contest:"Round 921",diff:"2100",pl:"CF"},
    {name:"Weekly 385 — Q4",contest:"Weekly 385",diff:"Hard",pl:"LC"},
    {name:"Div.2 D — Seg Tree",contest:"Round 918",diff:"1900",pl:"CF"},
  ];
  const plS={CF:{bg:t.accentBg,color:t.accent},LC:{bg:"rgba(168,85,247,0.1)",color:"#a855f7"}};
  return(
    <div ref={ref} style={{padding:"0.4rem 0"}}>
      {items.map((item,i)=>(
        <motion.div key={i} initial={{opacity:0,x:-12}} animate={inView?{opacity:1,x:0}:{}}
          transition={{delay:0.1+i*0.12,ease}}
          style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.6rem 0.75rem",
            background:t.bg2,border:`1px solid ${t.border}`,borderRadius:6,marginBottom:6}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",padding:"0.14rem 0.4rem",
            background:plS[item.pl].bg,color:plS[item.pl].color,borderRadius:3,fontWeight:700}}>{item.pl}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:"0.68rem",color:t.heading,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{item.name}</div>
            <div style={{fontSize:"0.56rem",color:t.muted,marginTop:1}}>{item.contest}</div>
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:"#a855f7",fontWeight:700}}>{item.diff}</span>
        </motion.div>
      ))}
    </div>
  );
}

function LeaderboardVisual({t}){
  const ref=useRef(null);const inView=useInView(ref,{once:true});
  const rows=[
    {rank:1,handle:"tourist",score:"9842",cf:"3979",badge:"👑"},
    {rank:2,handle:"Benq",score:"9210",cf:"3618",badge:"🥈"},
    {rank:3,handle:"ksun48",score:"8876",cf:"3555",badge:"🥉"},
    {rank:4,handle:"you",score:"4821",cf:"1847",you:true},
  ];
  return(
    <div ref={ref}>
      {rows.map((r,i)=>(
        <motion.div key={i} initial={{opacity:0,y:8}} animate={inView?{opacity:1,y:0}:{}}
          transition={{delay:0.1+i*0.1,ease}}
          style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.58rem 0.75rem",
            borderRadius:6,marginBottom:4,
            background:r.you?t.youBg:t.bg2,
            border:`1px solid ${r.you?t.youBdr:t.border}`}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.66rem",color:t.muted,minWidth:20}}>#{r.rank}</span>
          <span style={{fontSize:"0.78rem"}}>{r.badge||""}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.66rem",color:r.you?t.accent:t.heading,fontWeight:r.you?700:500,flex:1}}>{r.handle}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:t.muted}}>{r.cf}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.66rem",color:r.you?t.accent:t.body,fontWeight:700}}>{r.score}</span>
        </motion.div>
      ))}
    </div>
  );
}

function SnippetsVisual({t}){
  const ref=useRef(null);const inView=useInView(ref,{once:true});
  const snips=[{name:"Dijkstra SSSP",lang:"C++",votes:284},{name:"Segment Tree",lang:"C++",votes:201},{name:"DP on Trees",lang:"C++",votes:178}];
  return(
    <div ref={ref} style={{padding:"0.4rem 0"}}>
      {snips.map((s,i)=>(
        <motion.div key={i} initial={{opacity:0,x:12}} animate={inView?{opacity:1,x:0}:{}}
          transition={{delay:0.1+i*0.1,ease}}
          style={{display:"flex",alignItems:"center",gap:"0.7rem",padding:"0.6rem 0.75rem",
            background:t.bg2,border:`1px solid ${t.border}`,borderRadius:6,marginBottom:6}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",padding:"0.14rem 0.4rem",background:"#fef3c7",color:"#92400e",borderRadius:3,fontWeight:700}}>{s.lang}</span>
          <span style={{flex:1,fontSize:"0.68rem",color:t.heading,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{s.name}</span>
          <span style={{fontSize:"0.6rem",color:t.muted,fontFamily:"'JetBrains Mono',monospace"}}>▲ {s.votes}</span>
        </motion.div>
      ))}
    </div>
  );
}

function TreeVisual({t}){
  const ref=useRef(null);const inView=useInView(ref,{once:true});
  const nodes=[
    {lbl:"Arrays",x:50,y:8,done:true},{lbl:"Sorting",x:22,y:28,done:true},
    {lbl:"Bin Search",x:72,y:28,done:true},{lbl:"Graphs",x:18,y:52,done:true},
    {lbl:"DP",x:72,y:52,done:false},{lbl:"Trees",x:45,y:72,done:false},
    {lbl:"Seg Tree",x:18,y:90,done:false},{lbl:"FFT",x:80,y:90,done:false},
  ];
  const edges=[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[5,6],[5,7]];
  return(
    <div ref={ref} style={{position:"relative",height:160}}>
      <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 100 100" preserveAspectRatio="none">
        {edges.map(([a,b],i)=>(
          <motion.line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke={nodes[a].done&&nodes[b].done?t.accent:t.border2} strokeWidth="0.6"
            initial={{pathLength:0}} animate={inView?{pathLength:1}:{}} transition={{delay:0.3+i*0.08,duration:0.4}}/>
        ))}
      </svg>
      {nodes.map((n,i)=>(
        <motion.div key={i} initial={{opacity:0,scale:0}} animate={inView?{opacity:1,scale:1}:{}}
          transition={{delay:0.1+i*0.08,type:"spring",stiffness:300,damping:20}}
          style={{position:"absolute",left:`${n.x}%`,top:`${n.y}%`,transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <motion.div
            animate={n.done?{boxShadow:[`0 0 0px ${t.accent}00`,`0 0 8px ${t.accent}99`,`0 0 0px ${t.accent}00`]}:{}}
            transition={{duration:2.5,repeat:Infinity,delay:i*0.3}}
            style={{width:10,height:10,borderRadius:"50%",background:n.done?t.accent:t.bg3,
              border:`2px solid ${n.done?t.accent:t.border2}`,margin:"0 auto 3px"}}/>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.46rem",color:n.done?t.accent:t.muted,whiteSpace:"nowrap",fontWeight:n.done?700:400}}>{n.lbl}</div>
        </motion.div>
      ))}
    </div>
  );
}

function CardWindow({t,children}){
  return(
    <div style={{background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:12,padding:"1.4rem",boxShadow:`0 4px 16px ${t.shadow}`}}>
      <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"1rem",paddingBottom:"0.8rem",borderBottom:`1px solid ${t.border}`}}>
        <div style={{display:"flex",gap:5}}>
          {["#ff5f57","#febc2e","#28c840"].map((c,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:c}}/>)}
        </div>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted,marginLeft:"auto"}}>cppro.app</span>
      </div>
      {children}
    </div>
  );
}

const FEATURES=[
  {tag:"ANALYTICS",title:"Unified Activity Heatmap",badge:"14-day streak 🔥",badgeClr:"#16a34a",visual:"heatmap",desc:"Your Codeforces and LeetCode submission history merged into a single GitHub-style contribution grid. Spot inactive weeks instantly. No more excuses."},
  {tag:"GROWTH",title:"NextTarget Rating Engine",badge:"Next: +50 pts",badgeClr:"#3b82f6",visual:"targets",desc:"Break your goal into 50-point sprints. Three problem tiers — Master First, Current Bracket, and Stretch Goals — updated as you progress."},
  {tag:"PRACTICE",title:"Upsolve Bucket",badge:"8 queued",badgeClr:"#a855f7",visual:"upsolve",desc:"Every contest problem you attempted but couldn't solve gets automatically queued. Highest-ROI practice habit in CP — fully automated."},
  {tag:"CURRICULUM",title:"3D Learning Tree",badge:"42% mastered",badgeClr:"#f97316",visual:"tree",desc:"An interactive Three.js visualization of your algorithmic mastery. Nodes glow as you solve problems. See the full path to grandmaster."},
  {tag:"RANKINGS",title:"CPScore Leaderboard",badge:"#1,204 Global",badgeClr:"#16a34a",visual:"leaderboard",desc:"A weighted composite score synthesizing CF/LC ratings, difficulty solves, contest count, and streaks. Global, College, and Country views."},
  {tag:"TOOLING",title:"Snippet Manager",badge:"340+ templates",badgeClr:"#64748b",visual:"snippets",desc:"Personal + community C++/Java/Python template library. Public templates ranked by upvotes. Best algorithms always at the top."},
];

function FeatureCard({f,i,t}){
  const ref=useRef(null);
  const inView=useInView(ref,{once:true,margin:"-60px"});
  const isEven=i%2===0;
  const[hov,setHov]=useState(false);
  const visuals={heatmap:<HeatmapPreview t={t}/>,targets:<TargetsVisual t={t}/>,upsolve:<UpsolveVisual t={t}/>,tree:<TreeVisual t={t}/>,leaderboard:<LeaderboardVisual t={t}/>,snippets:<SnippetsVisual t={t}/>};
  return(
    <motion.div ref={ref} initial={{opacity:0,y:32}} animate={inView?{opacity:1,y:0}:{}}
      transition={{duration:0.6,delay:0.05,ease}} className="feat-row"
      style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4rem",alignItems:"center",padding:"5rem 0",borderBottom:`1px solid ${t.border}`}}>
      <div style={{order:isEven?0:1}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.55rem",marginBottom:"1rem"}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",letterSpacing:"0.15em",color:t.accent,fontWeight:700,textTransform:"uppercase"}}>{f.tag}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",padding:"0.16rem 0.55rem",background:t.accentBg,color:f.badgeClr,border:`1px solid ${t.accentBdr}`,borderRadius:20,fontWeight:600}}>{f.badge}</span>
        </div>
        <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(1.35rem,2.2vw,1.85rem)",color:t.heading,fontWeight:800,lineHeight:1.25,marginBottom:"0.9rem",letterSpacing:"-0.02em"}}>{f.title}</h3>
        <p style={{fontSize:"0.88rem",color:t.subtle,lineHeight:1.78,maxWidth:400,fontFamily:"'DM Sans',sans-serif"}}>{f.desc}</p>
        <motion.div whileHover={{x:4}} style={{marginTop:"1.4rem",display:"inline-block"}}>
          <Link to="/dashboard" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:t.accent,textDecoration:"none",letterSpacing:"0.04em",fontWeight:600}}>Try it now →</Link>
        </motion.div>
      </div>
      <motion.div style={{order:isEven?1:0}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        animate={{y:hov?-5:0,boxShadow:hov?`0 24px 56px ${t.shadowMd}`:`0 4px 16px ${t.shadow}`}} transition={{duration:0.3}}>
        <CardWindow t={t}>{visuals[f.visual]}</CardWindow>
      </motion.div>
    </motion.div>
  );
}

const HOME_STEPS=[
  {n:"01",icon:<Link2 size={32} className="text-emerald-500" />,title:"Connect your handles",desc:"Link Codeforces and LeetCode via our secure verification loop. No passwords — just a quick one-time hex token check."},
  {n:"02",icon:<Zap size={32} className="text-emerald-500" />,title:"Data syncs automatically",desc:"The Nexus background engine pulls submissions, ratings, and contest history every 10 minutes. Always fresh."},
  {n:"03",icon:<LineChart size={32} className="text-emerald-500" />,title:"Track, practice, improve",desc:"Work your upsolve queue, follow unified analytics, and let NextTarget guide you to the next rating milestone."},
];

const TESTIMONIALS=[
  {handle:"@cf_grinder_2k",rating:"Expert → Candidate Master",text:"The upsolve bucket changed how I practice entirely. Expert to CM in 3 months just by working through the queued problems.",cf:"1964"},
  {handle:"@lc_weekly",rating:"LC 1800 → 2100",text:"The unified heatmap showed I was barely solving on weekdays. That single insight bumped my weekly solve count by 40%.",cf:"2104"},
  {handle:"@icpc_regional_r",rating:"ICPC Regionalist",text:"The 3D learning tree is the best algorithmic curriculum visualizer I've seen. It shows exactly where I'm weak.",cf:"2318"},
];

function Badge({t,children}){
  return(
    <motion.div variants={fadeUp} style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:t.accentBg,border:`1px solid ${t.accentBdr}`,borderRadius:20,padding:"0.28rem 0.75rem",marginBottom:"1.1rem"}}>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:t.accent,fontWeight:700}}>{children}</span>
    </motion.div>
  );
}

export default function Home(){
  const { isDark } = useTheme();
  const dark = isDark;
  const t=dark?DARK:LIGHT;
  const{scrollYProgress, scrollY}=useScroll();
  const bar=useTransform(scrollYProgress,[0,1],["0%","100%"]);
  const heroY=useTransform(scrollY,[0,500],[0,48]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [stats, setStats] = useState({
    activeUsers: 3200,
    problemsTracked: 12400,
    syncedToday: 847,
    uptime: "99.9%",
    topAvatars: []
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/stats/public/summary`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .catch(err => console.error("Stats fetch failed:", err));
  }, []);

  return(
    <motion.div animate={{backgroundColor:t.bg,color:t.body}} transition={{duration:0.35,ease:"easeInOut"}} style={{minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${t.accent};border-radius:2px;}
        .container{max-width:1120px;margin:0 auto;padding:0 3rem;}
        @media(max-width:900px){
          .feat-row{grid-template-columns:1fr!important;gap:2rem!important;}
          .feat-row>div{order:0!important;}
          .g3{grid-template-columns:1fr!important;}
          .stats-flex>div{border-right:none!important;border-bottom:1px solid ${t.statsDvdr}!important;}
          .container{padding:0 1.4rem;}
          .hero-dash{grid-template-columns:1fr!important;}
        }
      `}</style>

      <motion.div style={{position:"fixed",top:0,left:0,height:2,background:t.accent,width:bar,zIndex:999,transformOrigin:"left"}}/>

      {/* ── HERO ── */}
      <motion.section animate={{backgroundColor:t.bg}} transition={{duration:0.35}}
        style={{minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",paddingTop:"5rem",position:"relative",overflow:"hidden"}}>
        {/* Base Grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${t.gridLine} 1px,transparent 1px),linear-gradient(90deg,${t.gridLine} 1px,transparent 1px)`,backgroundSize:"48px 48px",pointerEvents:"none",zIndex:0}}/>
        
        {/* Interactive Emerald Grid Layer */}
        <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: `linear-gradient(${t.accent}33 1px,transparent 1px),linear-gradient(90deg,${t.accent}33 1px,transparent 1px)`, 
            backgroundSize: '48px 48px',
            zIndex: 1,
            WebkitMaskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
            maskImage: `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
            pointerEvents: 'none'
        }} />

        <div style={{position:"absolute",top:"5%",right:"2%",width:640,height:640,borderRadius:"50%",background:`radial-gradient(circle,${t.glow} 0%,transparent 68%)`,pointerEvents:"none",zIndex:0}}/>

        <div className="container" style={{position:"relative",zIndex:2}}>
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:t.accentBg,border:`1px solid ${t.accentBdr}`,borderRadius:20,padding:"0.32rem 0.85rem",marginBottom:"1.8rem"}}>
              <motion.span animate={{scale:[1,1.35,1]}} transition={{duration:2,repeat:Infinity}} style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:t.accent}}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:t.accent,fontWeight:600,letterSpacing:"0.04em"}}>Codeforces + LeetCode + CodeChef unified</span>
            </motion.div>

            <motion.h1 style={{y:heroY,fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(2.9rem,7vw,6.5rem)",fontWeight:800,lineHeight:1.05,color:t.heading,letterSpacing:"-0.03em",marginBottom:"1.5rem",maxWidth:780}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{overflow:"hidden"}}>
                  <motion.div variants={fadeUp} custom={i+1} style={{display:"block"}}>
                    {i===0&&"Track Your"}
                    {i===1&&<Typewriter color={t.accent}/>}
                    {i===2&&<span style={{color:t.heading}}>Not Just Your Code.</span>}
                  </motion.div>
                </div>
              ))}
            </motion.h1>

            <motion.p variants={fadeUp} custom={4} style={{maxWidth:520,fontSize:"1rem",lineHeight:1.78,color:t.subtle,marginBottom:"2.4rem",fontFamily:"'DM Sans',sans-serif"}}>
              CPPro unifies your Codeforces and LeetCode data into one analytics engine — rating sprints, upsolve queues, topic mastery, and a leaderboard that actually makes sense.
            </motion.p>

            <motion.div variants={fadeUp} custom={5} style={{display:"flex",gap:"0.85rem",flexWrap:"wrap",marginBottom:"3.5rem"}}>
              <motion.div whileHover={{scale:1.025,boxShadow:`0 8px 28px ${t.accent}44`}} whileTap={{scale:0.97}}>
                <Link to="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.85rem 2rem",background:t.accent,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.72rem",letterSpacing:"0.05em",textDecoration:"none",borderRadius:8,fontWeight:700}}>Start for free →</Link>
              </motion.div>
              <motion.div whileHover={{scale:1.025}} whileTap={{scale:0.97}}>
                <Link to="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.85rem 2rem",background:"transparent",color:t.heading,fontFamily:"'JetBrains Mono',monospace",fontSize:"0.72rem",letterSpacing:"0.05em",textDecoration:"none",border:`1px solid ${t.border2}`,borderRadius:8,fontWeight:600}}>View demo</Link>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} custom={6} style={{display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
              <div style={{display:"flex"}}>
                {stats.topAvatars.length > 0 ? (
                  stats.topAvatars.map((url, i) => (
                    <div key={i} style={{width:28,height:28,borderRadius:"50%",background:t.bg3,backgroundImage:url?`url(${url})`:'none',backgroundSize:'cover',border:`2px solid ${t.bg}`,marginLeft:i===0?0:-8,zIndex:5-i}}/>
                  ))
                ) : (
                  (dark?["#2a2a2a","#333","#444","#555","#666"]:["#94a3b8","#64748b","#475569","#334155","#1e293b"]).map((c,i)=>(
                    <div key={i} style={{width:28,height:28,borderRadius:"50%",background:c,border:`2px solid ${t.bg}`,marginLeft:i===0?0:-8,zIndex:5-i}}/>
                  ))
                )}
              </div>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem",color:t.subtle}}>
                Trusted by <span style={{color:t.heading,fontWeight:700}}>{stats.activeUsers.toLocaleString()}+</span> competitive programmers
              </span>
            </motion.div>
          </motion.div>

          {/* Hero dashboard */}
          <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} transition={{duration:0.9,delay:0.5,ease}} style={{marginTop:"4rem",position:"relative"}}>
            <div style={{position:"absolute",inset:-24,background:`radial-gradient(ellipse at 50% 0%,${t.accentBg} 0%,transparent 55%)`,pointerEvents:"none",zIndex:0}}/>
            <div style={{position:"relative",zIndex:1,background:t.bgCard,border:`1px solid ${t.border}`,borderRadius:12,overflow:"hidden",boxShadow:`0 32px 80px ${t.shadowMd},0 2px 0 ${t.border}`}}>
              <div style={{background:t.bg3,borderBottom:`1px solid ${t.border}`,padding:"0.65rem 1.2rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                {["#ff5f57","#febc2e","#28c840"].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:c}}/>)}
                <div style={{flex:1,background:t.bg2,borderRadius:5,height:22,maxWidth:240,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${t.border}`}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.52rem",color:t.muted}}>cppro.app/dashboard</span>
                </div>
              </div>
              <div className="hero-dash" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1px",background:t.border}}>
                <div style={{background:t.bgCard,padding:"1.4rem"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"0.5rem"}}>Codeforces</div>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.9}} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"2.2rem",color:t.heading,lineHeight:1,fontWeight:800}}>1847</motion.div>
                  <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginTop:"0.3rem"}}>
                    <span style={{fontSize:"0.62rem",color:t.accent,fontWeight:700}}>▲ +82</span>
                    <span style={{fontSize:"0.56rem",color:t.muted,fontFamily:"'JetBrains Mono',monospace"}}>this month</span>
                  </div>
                  <div style={{marginTop:"0.9rem"}}><RatingGraph t={t}/></div>
                </div>
                <div style={{background:t.bgCard,padding:"1.4rem"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"0.5rem"}}>LeetCode</div>
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.0}} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"2.2rem",color:t.heading,lineHeight:1,fontWeight:800}}>2104</motion.div>
                  <div style={{display:"flex",alignItems:"center",gap:"0.4rem",marginTop:"0.3rem"}}>
                    <span style={{fontSize:"0.62rem",color:t.accent,fontWeight:700}}>▲ +134</span>
                    <span style={{fontSize:"0.56rem",color:t.muted,fontFamily:"'JetBrains Mono',monospace"}}>this month</span>
                  </div>
                  <div style={{marginTop:"0.8rem"}}><HeatmapPreview t={t}/></div>
                </div>
                <div style={{background:t.bgCard,padding:"1.4rem"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"0.8rem"}}>Next Target</div>
                  {[{l:"Master First",f:72},{l:"Current",f:48},{l:"Stretch",f:20}].map((item,i)=>(
                    <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.1+i*0.08}} style={{marginBottom:"0.65rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.22rem"}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:t.body}}>{item.l}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.52rem",color:t.muted}}>{item.f}%</span>
                      </div>
                      <div style={{height:4,background:t.bg3,borderRadius:2,overflow:"hidden"}}>
                        <motion.div initial={{width:0}} animate={{width:`${item.f}%`}} transition={{duration:0.8,delay:1.2+i*0.1,ease}} style={{height:"100%",background:t.accent,borderRadius:2}}/>
                      </div>
                    </motion.div>
                  ))}
                  <div style={{marginTop:"1.1rem",paddingTop:"1rem",borderTop:`1px solid ${t.border}`}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.5rem",color:t.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.55rem"}}>Upsolve Queue</div>
                    {["Div2 E — Tree DP","Weekly Q4 — Hard","Div2 D — Segment"].map((name,i)=>(
                      <motion.div key={i} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{delay:1.3+i*0.07}}
                        style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:t.subtle,padding:"0.26rem 0",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        <span style={{width:5,height:5,borderRadius:"50%",background:"#a855f7",display:"inline-block",flexShrink:0}}/>
                        {name}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

       <LiveStatsBar t={t} stats={stats}/>

      {/* ── FEATURES ── */}
      <motion.section animate={{backgroundColor:t.bg}} transition={{duration:0.35}} style={{padding:"7rem 0"}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}} variants={stagger}>
            <Badge t={t}>FEATURES</Badge>
            <motion.h2 variants={fadeUp} custom={1} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(1.85rem,3.6vw,2.8rem)",fontWeight:800,color:t.heading,lineHeight:1.15,marginBottom:"1rem",letterSpacing:"-0.02em"}}>
              Every tool a competitive<br/>programmer actually needs.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} style={{fontSize:"0.92rem",color:t.subtle,maxWidth:500,lineHeight:1.72,fontFamily:"'DM Sans',sans-serif"}}>
              Not a profile aggregator. A full analytics and practice engine built around how top programmers actually improve.
            </motion.p>
          </motion.div>
          <div style={{marginTop:"0.5rem"}}>
            {FEATURES.map((f,i)=><FeatureCard key={i} f={f} i={i} t={t}/>)}
          </div>
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ── */}
      <motion.section animate={{backgroundColor:t.bg2}} transition={{duration:0.35}}
        style={{padding:"7rem 0",borderTop:`1px solid ${t.border}`,borderBottom:`1px solid ${t.border}`}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}} variants={stagger}>
            <Badge t={t}>HOW IT WORKS</Badge>
            <motion.h2 variants={fadeUp} custom={1} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(1.85rem,3.6vw,2.8rem)",fontWeight:800,color:t.heading,lineHeight:1.15,marginBottom:"3.5rem",letterSpacing:"-0.02em"}}>
              Up and running in 60 seconds.
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:"-60px"}} variants={stagger}
            className="g3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.5rem"}}>
            {HOME_STEPS.map((step,i)=>(
              <motion.div key={i} variants={fadeUp} custom={i} whileHover={{y:-8,boxShadow:t.shadowMd}}
                style={{
                  background:dark ? "#111111" : "#ffffff",
                  padding:"2.8rem 2.2rem",
                  borderRadius:16,
                  border:`1px solid ${t.border}`,
                  position:"relative",
                  transition:"transform 0.3s ease, box-shadow 0.3s ease",
                  cursor:"default"
                }}>
                <div style={{marginBottom:"1.8rem"}}>{step.icon}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:t.accent,letterSpacing:"0.18em",marginBottom:"1rem",fontWeight:800}}>STEP {step.n}</div>
                <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:"1.35rem",color:t.heading,fontWeight:800,marginBottom:"1rem",letterSpacing:"-0.02em"}}>{step.title}</h3>
                <p style={{fontSize:"0.92rem",color:t.subtle,lineHeight:1.75,fontFamily:"'DM Sans',sans-serif"}}>{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── TESTIMONIALS ── */}
      <motion.section animate={{backgroundColor:t.bg}} transition={{duration:0.35}} style={{padding:"7rem 0"}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}} variants={stagger}>
            <Badge t={t}>FROM USERS</Badge>
            <motion.h2 variants={fadeUp} custom={1} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(1.85rem,3.6vw,2.8rem)",fontWeight:800,color:t.heading,lineHeight:1.15,marginBottom:"3.5rem",letterSpacing:"-0.02em"}}>
              Rated up by real programmers.
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:"-60px"}} variants={stagger}
            className="g3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1.5rem"}}>
            {TESTIMONIALS.map((item,i)=>(
              <motion.div key={i} variants={fadeUp} custom={i} whileHover={{y:-5,boxShadow:`0 16px 40px ${t.shadowMd}`}}
                style={{background:t.testiBg,border:`1px solid ${t.testiBdr}`,borderRadius:12,padding:"1.75rem",boxShadow:`0 2px 8px ${t.shadow}`,transition:"box-shadow 0.3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
                  <div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:t.heading,fontWeight:700}}>{item.handle}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.56rem",color:t.accent,marginTop:"0.2rem"}}>{item.rating}</div>
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"1rem",fontWeight:800,color:t.heading,background:t.accentBg,border:`1px solid ${t.accentBdr}`,borderRadius:6,padding:"0.26rem 0.52rem",lineHeight:1}}>{item.cf}</div>
                </div>
                <p style={{fontSize:"0.83rem",color:t.subtle,lineHeight:1.75,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic"}}>"{item.text}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── CTA ── */}
      <motion.section animate={{backgroundColor:t.ctaBg}} transition={{duration:0.35}} style={{paddingTop:"7rem", paddingBottom:"12rem", position:"relative",overflow:"hidden"}}>
        {/* Base Grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,backgroundSize:"48px 48px",pointerEvents:"none",zIndex:0}}/>
        
        {/* Interactive Emerald Grid Layer */}
        <div style={{ 
            position: 'absolute', inset: 0, 
            backgroundImage: `linear-gradient(${t.accent}33 1px,transparent 1px),linear-gradient(90deg,${t.accent}33 1px,transparent 1px)`, 
            backgroundSize: '48px 48px',
            zIndex: 1,
            WebkitMaskImage: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
            maskImage: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
            pointerEvents: 'none'
        }} />

        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:600,height:300,borderRadius:"50%",background:`radial-gradient(ellipse,${t.accent}10 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
        <div className="container" style={{position:"relative",zIndex:1}}>
          <motion.div initial="hidden" whileInView="visible" viewport={{once:true,margin:"-80px"}} variants={stagger}
            style={{textAlign:"center",maxWidth:680,margin:"0 auto"}}>
            <motion.div variants={fadeUp} style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.22)",borderRadius:20,padding:"0.28rem 0.75rem",marginBottom:"1.5rem"}}>
              <motion.span animate={{scale:[1,1.4,1]}} transition={{duration:2,repeat:Infinity}} style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:t.accentLt}}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:t.accentLt,fontWeight:700}}>Free to use · No credit card</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(2.4rem,5vw,3.8rem)",fontWeight:800,color:t.ctaText,lineHeight:1.1,letterSpacing:"-0.03em",marginBottom:"1.1rem"}}>
              Start tracking what<br/>actually matters.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} style={{fontSize:"0.97rem",color:t.ctaSub,lineHeight:1.75,marginBottom:"2.5rem",fontFamily:"'DM Sans',sans-serif"}}>
              Connect your handles in 60 seconds. Your first upsolve queue fills itself. Your dashboard is already waiting.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} style={{display:"flex",justifyContent:"center",gap:"1rem",flexWrap:"wrap"}}>
              <motion.div whileHover={{scale:1.03,boxShadow:`0 8px 32px ${t.accent}55`}} whileTap={{scale:0.97}}>
                <Link to="/dashboard" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.95rem 2.3rem",background:t.accent,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:"0.76rem",letterSpacing:"0.05em",textDecoration:"none",borderRadius:8,fontWeight:700}}>Launch CPPro free →</Link>
              </motion.div>
              <motion.div whileHover={{scale:1.03}} whileTap={{scale:0.97}}>
                <Link to="/leaderboard" style={{display:"inline-flex",alignItems:"center",gap:"0.5rem",padding:"0.95rem 2.3rem",background:"transparent",color:t.ctaSub,fontFamily:"'JetBrains Mono',monospace",fontSize:"0.76rem",letterSpacing:"0.05em",textDecoration:"none",border:`1px solid ${t.ctaBdr}`,borderRadius:8}}>View leaderboard</Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

    </motion.div>
  );
}