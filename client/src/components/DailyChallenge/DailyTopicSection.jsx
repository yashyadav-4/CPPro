import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Loader2, Code2,
    GitBranch, Copy, Check, ChevronRight, Play,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

// ── Strip LaTeX $...$ and convert common commands to Unicode ─────────
function cleanLatex(text) {
    if (!text) return '';
    return text
        // Convert $$...$$ (display math) and $...$ (inline math)
        .replace(/\$\$([^$]+?)\$\$/g, (_, inner) => latexToText(inner))
        .replace(/\$([^$]+?)\$/g, (_, inner) => latexToText(inner));
}

function latexToText(expr) {
    return expr
        .replace(/\\times/g, '×')
        .replace(/\\cdot/g, '·')
        .replace(/\\leq/g, '≤')
        .replace(/\\geq/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\approx/g, '≈')
        .replace(/\\infty/g, '∞')
        .replace(/\\sum/g, 'Σ')
        .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
        .replace(/\\log/g, 'log')
        .replace(/\\ln/g, 'ln')
        .replace(/\\left/g, '')
        .replace(/\\right/g, '')
        .replace(/\\[a-zA-Z]+/g, '')  // strip remaining unknown commands
        .replace(/[{}]/g, '')          // strip remaining braces
        .trim();
}

// ── Mermaid init ─────────────────────────────────────────────────────
function ensureMermaid(isDark) {
    mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: "'DM Sans', sans-serif",
        suppressErrorRendering: true,
    });
}

// ── Mermaid diagram renderer ─────────────────────────────────────────
function MermaidDiagram({ chart }) {
    const uniqueId = useId().replace(/:/g, '_');
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!chart) return;
        let cancelled = false;
        async function render() {
            try {
                let cleanChart = chart.trim();
                if (cleanChart.startsWith('```')) {
                    cleanChart = cleanChart.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/, '').trim();
                }
                ensureMermaid(document.documentElement.classList.contains('dark'));
                const { svg: rendered } = await mermaid.render(`mermaid_${uniqueId}`, cleanChart);
                if (!cancelled) setSvg(rendered);
            } catch {
                if (!cancelled) setError(true);
            }
        }
        render();
        return () => { cancelled = true; };
    }, [chart, uniqueId]);

    if (error) return null;
    if (!svg) return (
        <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );
    return <div className="overflow-x-auto [&_svg]:mx-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Syntax highlighted code block (always dark) ──────────────────────
function CodeBlock({ code, language = 'cpp' }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="relative group rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#111]">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="text-[10px] font-mono text-[#666] ml-2">{language}</span>
                </div>
                <button onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-[#666]
                        hover:text-[#ccc] transition-colors">
                    {copied ? <><Check size={12} className="text-[#27c93f]" /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: '1.25rem',
                    background: '#0a0a0a',
                    fontSize: '13px',
                    lineHeight: '1.7',
                    borderRadius: 0,
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                }}
                showLineNumbers
                lineNumberStyle={{ color: '#333', fontSize: '11px', paddingRight: '1rem' }}
                codeTagProps={{ style: { border: 'none', outline: 'none', background: 'transparent' } }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}

// ── Color palette for varied section headings ───────────────────────
const H2_COLORS = [
    { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/[0.06]' },
    { text: 'text-sky-400',     border: 'border-sky-500/40',     bg: 'bg-sky-500/[0.06]' },
    { text: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-500/[0.06]' },
    { text: 'text-violet-400',  border: 'border-violet-500/40',  bg: 'bg-violet-500/[0.06]' },
    { text: 'text-rose-400',    border: 'border-rose-500/40',    bg: 'bg-rose-500/[0.06]' },
    { text: 'text-cyan-400',    border: 'border-cyan-500/40',    bg: 'bg-cyan-500/[0.06]' },
];
let h2Counter = 0;

// ── Markdown components (theme-aware + colorful) ─────────────────────
const markdownComponents = {
    h1: ({ children }) => (
        <h1 className="text-2xl font-extrabold text-[var(--color-text-main)] mb-4 mt-6">
            {children}
        </h1>
    ),
    h2: ({ children }) => {
        const colors = H2_COLORS[h2Counter++ % H2_COLORS.length];
        return (
            <h2 className={`text-lg font-bold ${colors.text} mb-3 mt-8 pl-3
                border-l-3 ${colors.border} ${colors.bg} rounded-r-lg py-2 pr-3`}>
                {children}
            </h2>
        );
    },
    h3: ({ children }) => (
        <h3 className="text-base font-semibold text-sky-400 mb-2 mt-6">
            {children}
        </h3>
    ),
    p: ({ children }) => (
        <p className="text-[14px] leading-[1.85] text-[var(--color-text-body)] mb-4">
            {children}
        </p>
    ),
    strong: ({ children }) => (
        <strong className="font-bold text-[var(--color-text-main)]">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="text-amber-400 not-italic font-medium">{children}</em>
    ),
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-sky-400 underline decoration-sky-500/40
                hover:decoration-sky-400 transition-colors">
            {children}
        </a>
    ),
    ul: ({ children }) => (
        <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal list-inside space-y-1.5 mb-4 ml-1">{children}</ol>
    ),
    li: ({ children }) => (
        <li className="text-[14px] text-[var(--color-text-body)] leading-relaxed flex gap-2">
            <span className="text-emerald-400 mt-0.5 shrink-0">▸</span>
            <span>{children}</span>
        </li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-3 border-cyan-500/50
            bg-cyan-500/[0.05] rounded-r-lg px-4 py-3 my-4 text-[13px]
            text-[var(--color-text-body)] italic">
            {children}
        </blockquote>
    ),
    code: ({ inline, className, children }) => {
        const match = /language-(\w+)/.exec(className || '');
        const lang = match ? match[1] : 'cpp';
        const codeStr = String(children).replace(/\n$/, '');

        if (!inline && (match || codeStr.includes('\n'))) {
            return <CodeBlock code={codeStr} language={lang} />;
        }
        return (
            <code className="px-1.5 py-0.5 rounded-md text-[12.5px] font-mono
                bg-sky-500/[0.08] text-sky-400">
                {children}
            </code>
        );
    },
    table: ({ children }) => (
        <div className="overflow-x-auto my-4 rounded-lg">
            <table className="w-full text-[13px]">{children}</table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-violet-500/[0.08] border-b border-violet-500/20">
            {children}
        </thead>
    ),
    th: ({ children }) => (
        <th className="px-4 py-2.5 text-left text-violet-400 font-semibold text-[12px]
            uppercase tracking-wider">{children}</th>
    ),
    tr: ({ children }) => (
        <tr className="border-b border-[var(--color-border)] hover:bg-violet-500/[0.04] transition-colors">
            {children}
        </tr>
    ),
    td: ({ children }) => (
        <td className="px-4 py-2.5 text-[var(--color-text-body)]">{children}</td>
    ),
    hr: () => (
        <hr className="border-0 h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent my-6" />
    ),
};

// ── Collapsible Dry Run section ──────────────────────────────────────
function DryRunSection({ content }) {
    const [open, setOpen] = useState(false);

    if (!content) return null;

    return (
        <div className="mb-4 rounded-xl overflow-hidden bg-[var(--color-surface)]">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex items-center gap-3 px-5 py-4
                    bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.05]
                    hover:from-amber-500/[0.12] hover:to-orange-500/[0.08]
                    transition-all group"
            >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center
                    group-hover:bg-amber-500/15 transition-colors">
                    <Play size={14} className="text-amber-400" />
                </div>
                <div className="text-left flex-1">
                    <p className="text-[13px] font-bold text-[var(--color-text-main)]">
                        🔬 Dry Run — Watch It Execute
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                        Step-by-step walkthrough with a concrete example
                    </p>
                </div>
                <ChevronRight
                    size={16}
                    className={`text-amber-400 opacity-60 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
                />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 py-5 bg-[var(--color-bg)]">
                            <article>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={markdownComponents}
                                >
                                    {content}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main section ─────────────────────────────────────────────────────
export default function DailyTopicSection() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const fetchedRef            = useRef(false);

    useEffect(() => { prefetch(); }, []);

    async function prefetch() {
        if (fetchedRef.current) return;
        fetchedRef.current = true;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE}/api/daily/topic`, { withCredentials: true });
            if (res.data.success) setData(res.data.data);
            else setError('Could not load topic');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate topic');
            fetchedRef.current = false;
        } finally {
            setLoading(false);
        }
    }

    const c = data?.content || {};

    if (loading) {
        return (
            <div className="space-y-4 py-2">
                <div className="bg-[var(--color-accent-bg)] rounded-xl p-6">
                    <div className="flex items-center gap-3">
                        <Loader2 size={18} className="text-[var(--color-accent)] animate-spin" />
                        <div>
                            <p className="text-[13px] font-semibold text-[var(--color-text-main)]">
                                Generating your AI based topic…
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                                This may take a moment — please have patience, we'll notify you when it's ready
                            </p>
                        </div>
                    </div>
                </div>
                <div className="h-6 w-2/3 bg-[var(--color-bg2)] rounded-lg animate-pulse" />
                <div className="h-4 w-full bg-[var(--color-bg2)] rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-[var(--color-bg2)] rounded animate-pulse" />
                <div className="h-4 w-full bg-[var(--color-bg2)] rounded animate-pulse" />
                <div className="h-32 bg-[var(--color-bg2)] rounded-xl animate-pulse mt-4" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--color-danger)] text-[13px] mb-2">{error}</p>
                <button
                    onClick={() => { fetchedRef.current = false; prefetch(); }}
                    className="text-[12px] text-[var(--color-accent)] hover:underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { intro, bottom } = splitArticle(cleanLatex(c.article || ''));

    // Map backend language key to display name and syntax highlighter language
    const LANG_MAP = {
        cpp: { name: 'C++', syntax: 'cpp' },
        java: { name: 'Java', syntax: 'java' },
        python: { name: 'Python', syntax: 'python' },
        javascript: { name: 'JavaScript', syntax: 'javascript' },
    };
    const lang = LANG_MAP[data.language] || LANG_MAP.cpp;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Topic header card — gradient */}
            <div className="relative overflow-hidden rounded-xl p-6 mb-6
                bg-gradient-to-br from-emerald-500/[0.1] via-cyan-500/[0.06] to-violet-500/[0.08]">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]
                            bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            AI Based Today's Topic
                        </span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text-main)] leading-tight">
                        {data.topic}
                    </h1>
                </div>
            </div>

            {/* PART 1: Intro article (What + Why) */}
            <div className="px-2 py-4 mb-4">
                <article>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {intro}
                    </ReactMarkdown>
                </article>
            </div>

            {/* Dry Run — collapsible */}
            <DryRunSection content={cleanLatex(c.dry_run)} />

            {/* Code template */}
            {(c.code_template || c.cpp_code_template) && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                        <Code2 size={14} className="text-amber-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest
                            text-amber-400/70">
                            {lang.name} Implementation
                        </span>
                    </div>
                    <CodeBlock code={c.code_template || c.cpp_code_template} language={lang.syntax} />
                </div>
            )}

            {/* Visualization — full viewport */}
            {c.visualization_data && (
                <div className="relative mb-4 rounded-xl overflow-hidden
                    bg-gradient-to-b from-violet-500/[0.04] to-transparent">
                    <div className="flex items-center gap-2 px-2 pt-5 pb-3">
                        <GitBranch size={14} className="text-violet-400" />
                        <span className="text-[11px] font-bold uppercase tracking-widest
                            text-violet-400/70">
                            Algorithm Visualization
                        </span>
                    </div>
                    <div className="min-h-[75vh] flex items-center justify-center
                        px-6 pb-6 [&_svg]:max-w-full [&_svg]:h-auto
                        [&_svg]:min-h-[60vh] [&_svg]:w-full">
                        <MermaidDiagram chart={c.visualization_data} />
                    </div>
                </div>
            )}

            {/* PART 2: Bottom sections (When to Use, Pitfalls, Real-World) */}
            {bottom && (
                <div className="px-2 py-4">
                    <article>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {bottom}
                        </ReactMarkdown>
                    </article>
                </div>
            )}
        </motion.div>
    );
}

// ── Split article into intro vs bottom sections ──────────────────────
function splitArticle(article) {
    if (!article) return { intro: '', bottom: '' };
    const bottomPattern = /^##\s*(?:🔍|⚠️|🌍|When\b|Recogniz|Trap|Pitfall|Common Pitfall|Edge Case|Beyond|Real[- ]World)/im;
    const match = article.match(bottomPattern);
    if (!match) return { intro: article, bottom: '' };
    const idx = article.indexOf(match[0]);
    return {
        intro:  article.slice(0, idx).trim(),
        bottom: article.slice(idx).trim(),
    };
}
