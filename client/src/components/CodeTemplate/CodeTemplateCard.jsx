import { useState } from "react"
import { Code2, Copy, Check, ExternalLink, Pencil } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

function timeAgo(dateStr) {
    if (!dateStr) return "recently"
    const now = new Date()
    const date = new Date(dateStr)
    const seconds = Math.floor((now - date) / 1000)

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
    ]

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds)
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
        }
    }
    return "just now"
}

const LANG_LABEL = {
    cpp: "C++",
    python: "Python",
    java: "Java",
    javascript: "JavaScript",
}

export default function CodeTemplateCard({ snippet, onViewSnippet, onEdit }) {
    const [copied, setCopied] = useState(false)

    const { _id, title, language, code, tags, createdAt, updatedAt } = snippet

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    function handleViewDetails() {
        if (onViewSnippet) {
            onViewSnippet(snippet)
        }
    }

    const createdDate = createdAt ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }) : "Unknown"

    const hlLanguage = (language || 'cpp').toLowerCase();

    return (
        <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/20 transition-all duration-500 flex flex-col h-full overflow-hidden group">
            
            <div className="p-5 flex items-start gap-4 flex-grow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <Code2 size={20} />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="text-base font-bold text-gray-100 truncate pr-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight" title={title}>{title}</h3>
                    <div className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center gap-2">
                        <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded text-[8px] uppercase">{LANG_LABEL[language?.toLowerCase()] || language}</span>
                        <span className="text-gray-500 font-medium">UPDATED {timeAgo(updatedAt).toUpperCase()}</span>
                    </div>
                </div>
                <button 
                    onClick={handleCopy}
                    className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-95"
                    title="Copy code"
                >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
            </div>

            {code && (
                <div className="bg-[#080808] mx-5 rounded-xl overflow-hidden border border-white/5 h-32 relative group/preview">
                    <div className="absolute top-2 left-3 flex gap-1.5 z-10 opacity-40 group-hover/preview:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full bg-red-500/60"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/60"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/60"></div>
                    </div>
                    <div className="pointer-events-none opacity-80 h-full">
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
                                overflow: 'hidden'
                            }}
                        >
                            {code}
                        </SyntaxHighlighter>
                    </div>
                    {/* Fading overlay at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
                </div>
            )}

            <div className="px-5 py-4 pb-2 flex-grow-0 flex flex-wrap gap-1.5">
                {tags && tags.length > 0 && tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-white/5 text-gray-500 border border-white/5 hover:border-emerald-500/30 hover:text-emerald-400 transition-all">
                        #{tag.toUpperCase()}
                    </span>
                ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center mt-auto bg-white/[0.01]">
                <span className="text-[10px] text-gray-500 font-bold tracking-wider">EST. {createdDate.toUpperCase()}</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={e => { e.stopPropagation(); onEdit && onEdit(snippet); }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-400 p-1 transition-all"
                        title="Edit snippet"
                    >
                        <Pencil size={11} /> EDIT
                    </button>
                    <button
                        onClick={handleViewDetails}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 p-1 group/btn transition-all"
                    >
                        VIEW <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    )
}
