import { FileCode2, ChevronLeft, ChevronRight } from "lucide-react"
import CodeTemplateCard from "./CodeTemplateCard"

export default function CodeTemplateList({ snippets, onViewSnippet, onDelete, onEdit, loading, currentPage, totalPages, onPageChange }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="animate-pulse bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl h-64 shadow-sm" />
                ))}
            </div>
        )
    }

    if (!snippets || snippets.length === 0) {
        return (
            <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-16 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto bg-gray-100 dark:bg-white/[0.04] rounded-xl border border-gray-200 dark:border-white/[0.08] flex items-center justify-center text-gray-400 dark:text-gray-600 mb-4">
                    <FileCode2 size={26} />
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-300 mb-1">No snippets found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-600">Create your first code snippet to get started.</p>
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
                        onEdit={onEdit}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm dark:shadow-none"
                        disabled={currentPage === 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <ChevronLeft size={16} />
                    </button>

                    {pageNumbers.map((page, i) => {
                        const prev = pageNumbers[i - 1]
                        const showEllipsis = prev && page - prev > 1

                        return (
                            <span key={page} className="flex items-center gap-2">
                                {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-600 text-sm">...</span>}
                                <button
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all shadow-sm dark:shadow-none ${
                                        currentPage === page
                                            ? "bg-emerald-600 text-white border border-emerald-600"
                                            : "bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/[0.1] hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                                    }`}
                                    onClick={() => onPageChange(page)}
                                >
                                    {page}
                                </button>
                            </span>
                        )
                    })}

                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm dark:shadow-none"
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