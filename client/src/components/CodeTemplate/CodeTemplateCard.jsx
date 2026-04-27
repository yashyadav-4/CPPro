import { useState } from "react"
import { Code2, Copy, Check, ExternalLink, Pencil } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

function timeAgo(dateStr) {
    if (!dateStr) return "recently"
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
    ]
    for (const iv of intervals) {
        const count = Math.floor(seconds / iv.seconds)
        if (count >= 1) return `${count} ${iv.label}${count > 1 ? "s" : ""} ago`
    }
    return "just now"
}

const LANG_LABEL = { cpp: "C++", python: "Python", java: "Java", javascript: "JavaScript" }
const LANG_COLOR = { cpp: "#00b4d8", python: "#ffd166", java: "#ef476f", javascript: "#06d6a0" }

export default function CodeTemplateCard({ snippet, onViewSnippet, onEdit }) {
    const [copied, setCopied] = useState(false)
    const { title, language, code, tags, createdAt, updatedAt } = snippet
    const hlLanguage = (language || 'cpp').toLowerCase()
    const langColor = LANG_COLOR[hlLanguage] || "#10b981"

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    const createdDate = createdAt
        ? new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "Unknown"

    return (
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-none hover:border-gray-300 dark:hover:border-white/[0.13] transition-all duration-300 flex flex-col h-full overflow-hidden group">

            {/* Colored top accent bar */}
            <div className="h-[3px] shrink-0" style={{ background: `linear-gradient(90deg, ${langColor}cc, ${langColor}22, transparent)` }} />

            {/* Card header */}
            <div className="p-5 flex items-start gap-3 flex-grow">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
                    style={{ background: `${langColor}15`, borderColor: `${langColor}35`, color: langColor }}
                >
                    <Code2 size={18} />
                </div>
                <div className="flex-grow min-w-0">
                    <h3
                        className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        title={title}
                    >
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                            style={{ background: `${langColor}18`, color: langColor }}
                        >
                            {LANG_LABEL[hlLanguage] || language}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            updated {timeAgo(updatedAt)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={e => { e.stopPropagation(); handleCopy() }}
                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all active:scale-95 shrink-0"
                    title="Copy code"
                >
                    {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
            </div>

            {/* Code preview — always dark, like a mini editor */}
            {code && (
                <div className="mx-5 rounded-xl overflow-hidden border border-gray-900/10 dark:border-white/[0.06] h-32 relative bg-[#1e1e1e]">
                    <div className="absolute top-2 left-3 flex gap-1.5 z-10 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                    <div className="pointer-events-none h-full opacity-90">
                        <SyntaxHighlighter
                            language={hlLanguage}
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                padding: '1.25rem',
                                paddingTop: '1.75rem',
                                background: 'transparent',
                                fontSize: '0.65rem',
                                lineHeight: '1.5',
                                fontFamily: "'JetBrains Mono', monospace",
                                height: '100%',
                                overflow: 'hidden',
                            }}
                        >
                            {code}
                        </SyntaxHighlighter>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none" />
                </div>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
                <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-500 border border-gray-200 dark:border-white/[0.06]">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 mt-auto border-t border-gray-100 dark:border-white/[0.05] flex justify-between items-center">
                <span className="text-[11px] text-gray-400 dark:text-gray-600">{createdDate}</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={e => { e.stopPropagation(); onEdit && onEdit(snippet) }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                    >
                        <Pencil size={11} /> Edit
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); onViewSnippet && onViewSnippet(snippet) }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                    >
                        View <ExternalLink size={11} />
                    </button>
                </div>
            </div>
        </div>
    )
}
