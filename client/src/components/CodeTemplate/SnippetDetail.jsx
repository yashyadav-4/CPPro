import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronLeft, Trash2, Copy, Check, Code2 } from "lucide-react"
import DeleteConfirmModal from "../common/DeleteConfirmModal"

export default function SnippetDetail() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const snippet = state?.snippet

    if (!snippet) {
        navigate("/codesnippet", { replace: true })
        return null
    }

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
    const langBadgeColor = BG_COLOR[language?.toLowerCase()] || "bg-emerald-50 text-emerald-600 border-emerald-100"

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    async function confirmDelete() {
        try {
            const res = await fetch(`/api/codeTemplate/${_id}`, {
                method: "DELETE",
                credentials: "include",
            })
            if (res.ok) {
                navigate("/codesnippet", { replace: true })
            }
        } catch (err) {
            console.error("Failed to delete snippet:", err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back button */}
                <button 
                    onClick={() => navigate("/codesnippet")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6"
                >
                    <ChevronLeft size={16} />
                    Back to all snippets
                </button>

                {/* Detail Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${langBadgeColor}`}>
                                    <Code2 size={24} />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${langBadgeColor}`}>
                                    {langLabel[language?.toLowerCase()] || language}
                                </span>
                                {createdAt && (
                                    <span className="text-xs text-gray-500 font-medium">
                                        Added {new Date(createdAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="inline-flex items-center justify-center w-10 h-10 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors shrink-0"
                            title="Delete snippet"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        {description && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {description}
                                </p>
                            </div>
                        )}

                        {tags && tags.length > 0 && (
                            <div className="mb-8">
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, i) => (
                                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Code Block */}
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#1e1e1e] shadow-inner">
                            <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42]">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <button 
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                                >
                                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    {copied ? "Copied!" : "Copy Code"}
                                </button>
                            </div>
                            
                            <div className="p-4 overflow-x-auto text-sm font-mono text-gray-300">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        {codeLines.map((line, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                <td className="pr-4 py-0.5 text-right select-none w-8 text-gray-500 border-r border-[#3e3e42] align-top text-xs group-hover:text-gray-400">
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
