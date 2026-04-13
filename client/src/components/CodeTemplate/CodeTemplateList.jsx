import { FileCode2, ChevronLeft, ChevronRight } from "lucide-react"
import CodeTemplateCard from "./CodeTemplateCard"

export default function CodeTemplateList({ snippets, onViewSnippet, onDelete, loading, currentPage, totalPages, onPageChange }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl h-64" />
                ))}
            </div>
        )
    }

    if (!snippets || snippets.length === 0) {
        return (
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-xl p-16 text-center shadow-sm w-full">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-[#0a0a0a] rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <FileCode2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No snippets found</h3>
                <p className="text-gray-500 dark:text-gray-400">Create your first code snippet to get started.</p>
            </div>
        )
    }

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
            return [...new Set(pages)].sort((a, b) => a - b)
        }
        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {snippets.map(snippet => (
                    <CodeTemplateCard
                        key={snippet._id}
                        snippet={snippet}
                        onDelete={onDelete}
                        onViewSnippet={onViewSnippet}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {pageNumbers.map((page, i) => {
                        const prev = pageNumbers[i - 1]
                        const showEllipsis = prev && page - prev > 1

                        return (
                            <span key={page} className="flex items-center">
                                {showEllipsis && <span className="px-2 text-gray-400 dark:text-gray-500">...</span>}
                                <button
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === page 
                                        ? "bg-emerald-600 text-white border border-emerald-600 shadow-sm" 
                                        : "bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/10"
                                    }`}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            </span>
                        )
                    })}

                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={currentPage === totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </>
    )
}