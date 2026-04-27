import { useState } from "react"
import { X, Trash2, Copy, Check, Code2, Calendar, Pencil, Tag, Clock } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import DeleteConfirmModal from "../common/DeleteConfirmModal"

const LANG_LABEL = {
    cpp: "C++",
    python: "Python",
    java: "Java",
    javascript: "JavaScript",
}

const LANG_COLOR = {
    cpp: "#00b4d8",
    python: "#ffd166",
    java: "#ef476f",
    javascript: "#06d6a0",
}

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

export default function SnippetDetailModal({ snippet, onClose, onDelete, onEdit }) {
    const [copied, setCopied] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    if (!snippet) return null

    const { title, language, description, code, tags, _id, createdAt, updatedAt } = snippet
    const hlLanguage = (language || 'cpp').toLowerCase()
    const langColor = LANG_COLOR[hlLanguage] || "#10b981"

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    async function confirmDelete() {
        if (onDelete) await onDelete(_id)
        onClose()
    }

    const lineCount = (code || "").split("\n").length

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Top bar ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.015] shrink-0">
                    {/* Traffic lights */}
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all" />
                        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        <span className="ml-3 text-[11px] font-mono text-gray-500 tracking-widest">
                            CPPRO_VAULT // {LANG_LABEL[hlLanguage] || language}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                            style={{
                                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                                color: copied ? '#10b981' : '#9ca3af',
                                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? "COPIED" : "COPY"}
                        </button>
                        <button
                            onClick={() => onEdit && onEdit(snippet)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-95"
                        >
                            <Pencil size={12} /> EDIT
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-95"
                        >
                            <Trash2 size={12} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] text-gray-500 hover:text-white border border-white/[0.06] transition-all hover:rotate-90"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* ── Body: two-column layout ───────────────────────────── */}
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    {/* Left panel — metadata */}
                    <div className="w-52 shrink-0 border-r border-white/[0.06] p-5 flex flex-col gap-5 overflow-y-auto bg-white/[0.01]">
                        {/* Title */}
                        <div>
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Snippet</p>
                            <h2 className="text-sm font-bold text-white leading-snug uppercase tracking-tight">{title}</h2>
                        </div>

                        {/* Language badge */}
                        <div>
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Language</p>
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold"
                                style={{ background: `${langColor}18`, color: langColor, border: `1px solid ${langColor}30` }}
                            >
                                <Code2 size={10} />
                                {LANG_LABEL[hlLanguage] || language}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2">
                            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Stats</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <Clock size={10} className="shrink-0" />
                                <span>{lineCount} lines</span>
                            </div>
                            {createdAt && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <Calendar size={10} className="shrink-0" />
                                    <span>{new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )}
                            {updatedAt && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <Clock size={10} className="shrink-0" />
                                    <span>Updated {timeAgo(updatedAt)}</span>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div>
                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Tag size={9} /> Tags
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                                            #{tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {description && (
                            <div>
                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Notes</p>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right panel — code */}
                    <div className="flex-1 min-w-0 overflow-y-auto bg-[#080808]">
                        <SyntaxHighlighter
                            language={hlLanguage}
                            style={vscDarkPlus}
                            showLineNumbers
                            lineNumberStyle={{
                                minWidth: '3em',
                                paddingRight: '1em',
                                color: 'rgba(255,255,255,0.15)',
                                textAlign: 'right',
                                userSelect: 'none',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                marginRight: '1em',
                                fontSize: '0.75rem',
                            }}
                            customStyle={{
                                margin: 0,
                                padding: '1.25rem 1.5rem',
                                background: 'transparent',
                                fontSize: '0.8rem',
                                lineHeight: '1.7',
                                fontFamily: "'JetBrains Mono', monospace",
                                minHeight: '100%',
                            }}
                            wrapLongLines={false}
                        >
                            {code}
                        </SyntaxHighlighter>
                    </div>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Code Snippet"
                message="Are you sure you want to delete this code snippet? This action cannot be undone."
            />
        </div>
    )
}
