import { useState, useEffect, useCallback } from "react"
import { Search, Plus, AlertTriangle } from "lucide-react"
import { API_BASE } from '../../api'
import CodeTemplateList from "./CodeTemplateList"
import AddSnippetModal from "./AddSnippetModal"
import SnippetDetailModal from "./SnippetDetailModal"

const LANGUAGE_FILTERS = [
    { label: "All", value: "all" },
    { label: "C++", value: "cpp" },
    { label: "Python", value: "python" },
    { label: "Java", value: "java" },
    { label: "JavaScript", value: "javascript" },
]

const LANG_COLOR = {
    cpp: "#00b4d8",
    python: "#ffd166",
    java: "#ef476f",
    javascript: "#06d6a0",
}

const ITEMS_PER_PAGE = 6

export default function CodeTemplate() {
    const [snippets, setSnippets] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedSnippet, setSelectedSnippet] = useState(null)
    const [editingSnippet, setEditingSnippet] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)

    const fetchSnippets = useCallback(async () => {
        setLoading(true)
        setFetchError(null)
        try {
            const res = await fetch(`${API_BASE}/api/codeTemplate`, { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setSnippets(data)
            } else {
                throw new Error("API failed")
            }
        } catch (err) {
            setFetchError("Could not load snippets — server is unreachable.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSnippets()
    }, [fetchSnippets])

    async function handleDelete(id) {
        try {
            const res = await fetch(`/api/codeTemplate/${id}`, {
                method: "DELETE",
                credentials: "include",
            })
            if (res.ok) {
                setSnippets(prev => prev.filter(s => s._id !== id));
            } else {
                throw new Error("API failed")
            }
        } catch (err) {
            setFetchError("Could not delete snippet — server is unreachable.")
        }
    }

    const handleSnippetAdded = useCallback(() => {
        setShowAddModal(false)
        setEditingSnippet(null)
        fetchSnippets()
    }, [fetchSnippets])

    function handleEditSnippet(snippet) {
        setSelectedSnippet(null)   // close detail modal first
        setEditingSnippet(snippet) // open edit modal
    }

    const tagPills = [...new Set(snippets.flatMap(s => s.tags || []))]

    const filtered = snippets.filter(s => {
        if (activeFilter !== "all") {
            const isLangMatch = s.language === activeFilter
            const isTagMatch = s.tags && s.tags.some(t => t.toLowerCase() === activeFilter.toLowerCase())
            if (!isLangMatch && !isTagMatch) return false
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            return (
                s.title.toLowerCase().includes(q) ||
                s.language.toLowerCase().includes(q) ||
                (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
            )
        }
        return true
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const paginatedSnippets = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, activeFilter])

    // Language distribution stats
    const langCounts = snippets.reduce((acc, s) => {
        const lang = s.language?.toLowerCase() || "other"
        acc[lang] = (acc[lang] || 0) + 1
        return acc
    }, {})

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 py-10">
            <div className="max-w-7xl mx-auto">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                My Code Snippets
                            </h1>
                            {!loading && snippets.length > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
                                    {snippets.length}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Save and organize your frequently used algorithms and code templates.
                        </p>
                        {/* Language breakdown */}
                        {!loading && snippets.length > 0 && (
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                {Object.entries(langCounts).map(([lang, count]) => (
                                    <div key={lang} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: LANG_COLOR[lang] || '#6b7280' }} />
                                        <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                                            {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}{' '}
                                            <span className="text-gray-400 dark:text-gray-600">{count}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex-shrink-0"
                    >
                        <Plus size={17} />
                        New Snippet
                    </button>
                </div>

                {/* Error Banner */}
                {fetchError && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                        <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                        <span className="text-red-600 dark:text-red-400 text-sm flex-1">{fetchError}</span>
                        <button
                            onClick={() => { setFetchError(null); fetchSnippets() }}
                            className="text-xs text-red-500 hover:text-red-700 underline font-medium flex-shrink-0"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Search & Filter ─────────────────────────────────── */}
                <div className="mb-8 space-y-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by title, language, or tag..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-white/[0.1] rounded-xl bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 shadow-sm dark:shadow-none transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {LANGUAGE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setActiveFilter(f.value)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                    activeFilter === f.value
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.1] hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm dark:shadow-none"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                        {tagPills.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveFilter(activeFilter === tag ? "all" : tag)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                    activeFilter === tag
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/[0.1] hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm dark:shadow-none"
                                }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Grid ───────────────────────────────────────────── */}
                <CodeTemplateList
                    snippets={paginatedSnippets}
                    onDelete={handleDelete}
                    onEdit={handleEditSnippet}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onViewSnippet={setSelectedSnippet}
                />
            </div>

            {showAddModal && (
                <AddSnippetModal onClose={() => setShowAddModal(false)} onAddLocal={handleSnippetAdded} />
            )}
            {editingSnippet && (
                <AddSnippetModal initialSnippet={editingSnippet} onClose={() => setEditingSnippet(null)} onAddLocal={handleSnippetAdded} />
            )}
            {selectedSnippet && (
                <SnippetDetailModal snippet={selectedSnippet} onClose={() => setSelectedSnippet(null)} onDelete={handleDelete} onEdit={handleEditSnippet} />
            )}
        </div>
    )
}
