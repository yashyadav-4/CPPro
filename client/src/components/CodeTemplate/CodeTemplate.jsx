import { useState, useEffect, useCallback } from "react"
import { Search, Plus } from "lucide-react"
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
    const [loading, setLoading] = useState(true)

    const fetchSnippets = useCallback(async () => {
        setLoading(true)
        try {
            // First try to load from API, if fail, fallback to localStorage
            const res = await fetch("/api/codeTemplate", { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setSnippets(data)
                // sync to localStorage for persistence as requested
                localStorage.setItem('snippets', JSON.stringify(data));
            } else {
                throw new Error("API failed");
            }
        } catch (err) {
            console.log("Using localStorage fallback for snippets");
            const localSnippets = JSON.parse(localStorage.getItem('snippets') || '[]');
            setSnippets(localSnippets);
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSnippets()
    }, [fetchSnippets])

    async function handleDelete(id) {
        try {
            // Try API
            const res = await fetch(`/api/codeTemplate/${id}`, {
                method: "DELETE",
                credentials: "include",
            })
            if (res.ok) {
                const updated = snippets.filter(s => s._id !== id);
                setSnippets(updated);
                localStorage.setItem('snippets', JSON.stringify(updated));
            } else {
                throw new Error("API failed");
            }
        } catch (err) {
            // Fallback to localStorage deletion
            const updated = snippets.filter(s => s._id !== id);
            setSnippets(updated);
            localStorage.setItem('snippets', JSON.stringify(updated));
        }
    }

    const handleAddSnippetLocal = (newSnippet) => {
        const snippetWithId = {
            ...newSnippet,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updated = [snippetWithId, ...snippets];
        setSnippets(updated);
        localStorage.setItem('snippets', JSON.stringify(updated));
        setShowAddModal(false);
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
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Code Snippets</h1>
                        <p className="mt-2 text-gray-600">Save, organize, and quickly access your frequently used algorithms and templates.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors flex-shrink-0"
                    >
                        <Plus size={18} />
                        New Snippet
                    </button>
                </div>

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
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-colors"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {LANGUAGE_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setActiveFilter(f.value)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                                    activeFilter === f.value 
                                    ? "bg-indigo-600 text-white border-indigo-600" 
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
                                    ? "bg-indigo-600 text-white border-indigo-600" 
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
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
                        onAddLocal={handleAddSnippetLocal}
                    />
                )}

                {/* Detail Modal */}
                {selectedSnippet && (
                    <SnippetDetailModal 
                        snippet={selectedSnippet}
                        onClose={() => setSelectedSnippet(null)}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    )
}