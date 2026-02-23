import { FileCode2, ChevronLeft, ChevronRight } from "lucide-react"
import CodeTemplateCard from "./CodeTemplateCard"

export default function CodeTemplateList({ snippets, onDelete, loading, currentPage, totalPages, onPageChange }) {
    if (loading) {
        return (
            <div className="ct-grid">
                {[1, 2, 3].map(i => (
                    <div key={i} className="ct-skeleton" />
                ))}
            </div>
        )
    }

    if (!snippets || snippets.length === 0) {
        return (
            <div className="ct-grid">
                <div className="ct-empty">
                    <div className="ct-empty-icon">
                        <FileCode2 size={48} />
                    </div>
                    <h3>No snippets found</h3>
                    <p>Create your first code snippet to get started.</p>
                </div>
            </div>
        )
    }

    // Build page numbers: 1 2 3 ... last
    function getPageNumbers() {
        const pages = []
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1, 2, 3)
            if (currentPage > 3 && currentPage < totalPages) {
                pages.push(currentPage)
            }
            pages.push(totalPages)
            // Remove duplicates and sort
            return [...new Set(pages)].sort((a, b) => a - b)
        }
        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <>
            <div className="ct-grid">
                {snippets.map(snippet => (
                    <CodeTemplateCard
                        key={snippet._id}
                        snippet={snippet}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="ct-pagination">
                    <button
                        className="ct-page-btn"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {pageNumbers.map((page, i) => {
                        // Show ellipsis if gap > 1
                        const prev = pageNumbers[i - 1]
                        const showEllipsis = prev && page - prev > 1

                        return (
                            <span key={page} style={{ display: "contents" }}>
                                {showEllipsis && <span className="ct-page-ellipsis">...</span>}
                                <button
                                    className={`ct-page-btn ${currentPage === page ? "active" : ""}`}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            </span>
                        )
                    })}

                    <button
                        className="ct-page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </>
    )
}