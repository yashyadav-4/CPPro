import { useState } from "react"
import { X, Trash2, Copy, Check, Code2, Calendar, Pencil } from "lucide-react"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import DeleteConfirmModal from "../common/DeleteConfirmModal"
import { useTheme } from "../../hooks/useTheme"

export default function SnippetDetailModal({ snippet, onClose, onDelete, onEdit }) {
    const { isDark } = useTheme()
    const [copied, setCopied] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    if (!snippet) return null

    const { title, language, description, code, tags, _id, createdAt } = snippet

    const langLabel = {
        cpp: "C++",
        python: "Python",
        java: "Java",
        javascript: "JavaScript",
    }
    
    // Cleanup language for SyntaxHighlighter
    const hlLanguage = (language || 'cpp').toLowerCase();

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    async function confirmDelete() {
        if (onDelete) {
            await onDelete(_id)
        }
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose}>
            <div 
                className="bg-[#0f0f0f] dark:bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* Header Row */}
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <Code2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight leading-tight uppercase">
                                {title}
                            </h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider">
                                    {langLabel[language?.toLowerCase()] || language}
                                </span>
                                {createdAt && (
                                    <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                        <Calendar size={12} />
                                        {new Date(createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? "COPIED" : "COPY CODE"}
                        </button>
                        <button
                            onClick={() => onEdit && onEdit(snippet)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500 hover:text-white transition-all active:scale-95"
                            title="Edit snippet"
                        >
                            <Pencil size={13} />
                            EDIT
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-0.5" />
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all group"
                            title="Delete snippet"
                        >
                            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:text-white border border-white/10 transition-all hover:rotate-90"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Scrollable */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 hidden-scrollbar bg-transparent">
                    {description && (
                        <div className="mb-8">
                            <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-emerald-500/30" />
                                Description
                            </h3>
                            <p className="text-gray-400 text-sm leading-relaxed font-medium bg-white/[0.03] p-5 rounded-xl border border-white/5">
                                {description}
                            </p>
                        </div>
                    )}

                    {tags && tags.length > 0 && (
                        <div className="mb-8">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 text-gray-400 border border-white/10 transition-all hover:border-emerald-500/40 hover:text-emerald-400">
                                        #{tag.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pro Code Editor Block */}
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#080808] shadow-2xl flex flex-col group/editor">
                        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.04] border-b border-white/5 shrink-0">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_8px_rgba(255,95,87,0.3)]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_8px_rgba(254,188,46,0.3)]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_8px_rgba(40,200,64,0.3)]"></div>
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
                                CPPRO_EDITOR // {langLabel[language?.toLowerCase()] || language}
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto overflow-y-auto flex-1 bg-[#080808] hidden-scrollbar">
                           <SyntaxHighlighter
                                language={hlLanguage}
                                style={vscDarkPlus}
                                showLineNumbers={true}
                                lineNumberStyle={{
                                    minWidth: '3.5em',
                                    paddingRight: '1em',
                                    color: 'rgba(255,255,255,0.2)',
                                    textAlign: 'right',
                                    userSelect: 'none',
                                    borderRight: '1px solid rgba(255,255,255,0.05)',
                                    marginRight: '1em'
                                }}
                                customStyle={{
                                    margin: 0,
                                    padding: '1.5rem',
                                    background: 'transparent',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.7',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}
                           >
                                {code}
                           </SyntaxHighlighter>
                        </div>

                        {/* Corner Accents */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 blur-3xl pointer-events-none" />
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
