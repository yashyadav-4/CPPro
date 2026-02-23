import { useState, useEffect, useCallback } from "react"
import { Search, SlidersHorizontal, Plus } from "lucide-react"
import CodeTemplateList from "./CodeTemplateList"
import AddSnippetModal from "./AddSnippetModal"
import "./CodeTemplate.css"

const LANGUAGE_FILTERS = [
    { label: "All", value: "all" },
    { label: "C++", value: "cpp" },
    { label: "Python", value: "python" },
    { label: "Java", value: "java" },
]

const ITEMS_PER_PAGE = 6

export default function CodeTemplate() {
    const [snippets, setSnippets] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilter, setActiveFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [showAddModal, setShowAddModal] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchSnippets = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/codeTemplate", { credentials: "include" })
            if (res.ok) {
                const data = await res.json()
                setSnippets(data)
            }
        } catch (err) {
            console.error("Failed to fetch snippets:", err)
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
                setSnippets(prev => prev.filter(s => s._id !== id))
            }
        } catch (err) {
            console.error("Failed to delete snippet:", err)
        }
    }

    // Build unique tag-based pills from all snippets
    const tagPills = [...new Set(snippets.flatMap(s => s.tags || []))]

    // Combined filter: search + active pill
    const filtered = snippets.filter(s => {
        // Language / tag pill filter
        if (activeFilter !== "all") {
            const isLangMatch = s.language === activeFilter
            const isTagMatch = s.tags && s.tags.some(t => t.toLowerCase() === activeFilter.toLowerCase())
            if (!isLangMatch && !isTagMatch) return false
        }

        // Search query filter
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

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paginatedSnippets = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, activeFilter])

    return (
        <div className="ct-page">
            {/* Header */}
            <div className="ct-header">
                <div className="ct-header-text">
                    <h1>My Code Snippets</h1>
                    <p>Save, organize, and quickly access your frequently used algorithms and templates.</p>
                </div>
                <button className="ct-add-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    New Snippet
                </button>
            </div>

            {/* Search + Filter */}
            <div className="ct-toolbar">
                <div className="ct-search">
                    <Search size={18} className="ct-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by title, language, or tag..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="ct-filter-btn">
                    <SlidersHorizontal size={16} />
                    Filters
                </button>
            </div>

            {/* Filter Pills */}
            <div className="ct-pills">
                {LANGUAGE_FILTERS.map(f => (
                    <button
                        key={f.value}
                        className={`ct-pill ${activeFilter === f.value ? "active" : ""}`}
                        onClick={() => setActiveFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
                {tagPills.map(tag => (
                    <button
                        key={tag}
                        className={`ct-pill ${activeFilter === tag ? "active" : ""}`}
                        onClick={() => setActiveFilter(activeFilter === tag ? "all" : tag)}
                    >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                ))}
            </div>

            {/* Snippet Grid */}
            <CodeTemplateList
                snippets={paginatedSnippets}
                onDelete={handleDelete}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* Add Modal */}
            {showAddModal && (
                <AddSnippetModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={fetchSnippets}
                />
            )}
        </div>
    )
}