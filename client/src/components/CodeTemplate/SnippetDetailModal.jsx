import { useState } from "react"
import { X, Trash2, Copy, Check, Code2 } from "lucide-react"
import DeleteConfirmModal from "../common/DeleteConfirmModal"

export default function SnippetDetailModal({ snippet, onClose, onDelete }) {
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
    
    // Aesthetic badge coloring based on language
    const BG_COLOR = {
        cpp: "bg-blue-50 text-blue-600 border-blue-100",
        python: "bg-green-50 text-green-600 border-green-100",
        java: "bg-orange-50 text-orange-600 border-orange-100",
        javascript: "bg-yellow-50 text-yellow-600 border-yellow-100",
    }

    const codeLines = code ? code.split("\n") : []
    const langBadgeColor = BG_COLOR[language?.toLowerCase()] || "bg-indigo-50 text-indigo-600 border-indigo-100"

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Row */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${langBadgeColor}`}>
                            <Code2 size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900 truncate max-w-[200px] sm:max-w-md" title={title}>
                                {title}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${langBadgeColor}`}>
                                    {langLabel[language?.toLowerCase()] || language}
                                </span>
                                {createdAt && (
                                    <span className="text-xs text-gray-500 font-medium"> • Added {new Date(createdAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-white border border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors shrink-0"
                            title="Delete snippet"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button 
                            className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-lg transition-colors focus:outline-none" 
                            onClick={onClose}
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area - Scrollable */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 hidden-scrollbar bg-white">
                    {description && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {description}
                            </p>
                        </div>
                    )}

                    {tags && tags.length > 0 && (
                        <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Code Block */}
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#1e1e1e] shadow-inner flex flex-col flex-1 min-h-[300px]">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42] shrink-0">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-x-auto overflow-y-auto flex-1 text-sm font-mono text-gray-300 hidden-scrollbar">
                            <table className="w-full border-collapse">
                                <tbody>
                                    {codeLines.map((line, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                                            <td className="pr-4 py-0.5 text-right select-none w-10 text-gray-500 border-r border-[#3e3e42] align-top text-xs group-hover:text-gray-400">
                                                {i + 1}
                                            </td>
                                            <td className="pl-4 py-0.5 whitespace-pre">
                                                {line || " "}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
