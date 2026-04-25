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

const ITEMS_PER_PAGE = 6;

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Code Snippets</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">Save, organize, and quickly access your frequently used algorithms and templates.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors flex-shrink-0"
                    >
                        <Plus size={18} />
                        New Snippet
                    </button>
                </div>

                {/* Error Banner */}
                {fetchError && (
                    <div className="mb-6 flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                        <span className="text-red-600 dark:text-red-400 text-sm flex-1">{fetchError}</span>
                        <button
                            onClick={() => { setFetchError(null); fetchSnippets(); }}
                            className="text-xs text-red-500 hover:text-red-700 underline font-medium flex-shrink-0"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Search & Filter */}
                <div className="mb-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by title, language, or tag..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-white/[0.12] rounded-lg leading-5 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {LANGUAGE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setActiveFilter(f.value)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                    activeFilter === f.value
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-200 border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/10"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                        {tagPills.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveFilter(activeFilter === tag ? "all" : tag)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                    activeFilter === tag
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-200 border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/10"
                                }`}
                            >
                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Snippet Grid */}
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

                {/* Add Modal */}
                {showAddModal && (
                    <AddSnippetModal
                        onClose={() => setShowAddModal(false)}
                        onAddLocal={handleSnippetAdded}
                    />
                )}

                {/* Edit Modal */}
                {editingSnippet && (
                    <AddSnippetModal
                        initialSnippet={editingSnippet}
                        onClose={() => setEditingSnippet(null)}
                        onAddLocal={handleSnippetAdded}
                    />
                )}

                {/* Detail Modal */}
                {selectedSnippet && (
                    <SnippetDetailModal
                        snippet={selectedSnippet}
                        onClose={() => setSelectedSnippet(null)}
                        onDelete={handleDelete}
                        onEdit={handleEditSnippet}
                    />
                )}
            </div>
        </div>
    )
}
