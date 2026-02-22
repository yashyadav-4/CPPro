import { useState, useEffect, useCallback } from "react"
import { Search, SlidersHorizontal, Plus } from "lucide-react"
import CodeTemplateList from "./CodeTemplateList"
import AddSnippetModal from "./AddSnippetModal"
import "./CodeTemplate.css"

export default function CodeTemplate() {
    const [snippets, setSnippets] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
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

    // Filter snippets by search query (title, language, tags)
    const filtered = snippets.filter(s => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.toLowerCase()
        return (
            s.title.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q) ||
            (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
        )
    })

    return (
        <div className="ct-page">
            {/* Header */}
            <div className="ct-header">
                <div className="ct-header-text">
                    <h1>My Code Snippets</h1>
                    <p>Save, organize, and quickly access your frequently used code blocks.</p>
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

            {/* Snippet Grid */}
            <CodeTemplateList
                snippets={filtered}
                onDelete={handleDelete}
                loading={loading}
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