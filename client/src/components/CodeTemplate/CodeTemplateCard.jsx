import { useState } from "react"
import { Code2, Copy, Check, ExternalLink } from "lucide-react"

function timeAgo(dateStr) {
    if (!dateStr) return "recently"
    const now = new Date()
    const date = new Date(dateStr)
    const seconds = Math.floor((now - date) / 1000)

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
    ]

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds)
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`
        }
    }
    return "just now"
}

const LANG_LABEL = {
    cpp: "C++",
    python: "Python",
    java: "Java",
    javascript: "JavaScript",
}

const BG_COLOR = {
    cpp: "bg-blue-50 text-blue-600",
    python: "bg-green-50 text-green-600",
    java: "bg-orange-50 text-orange-600",
    javascript: "bg-yellow-50 text-yellow-600",
}

export default function CodeTemplateCard({ snippet, onViewSnippet }) {
    const [copied, setCopied] = useState(false)

    const { _id, title, language, code, tags, createdAt, updatedAt } = snippet

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    function handleViewDetails() {
        if (onViewSnippet) {
            onViewSnippet(snippet)
        }
    }

    const createdDate = createdAt ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }) : "Unknown"

    const langIconColor = BG_COLOR[language?.toLowerCase()] || "bg-indigo-50 text-indigo-600"

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
            
            <div className="p-5 flex items-start gap-4 flex-grow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${langIconColor}`}>
                    <Code2 size={20} />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate pr-2" title={title}>{title}</h3>
                    <div className="text-xs text-gray-500 mt-1">
                        {LANG_LABEL[language?.toLowerCase()] || language} • Updated {timeAgo(updatedAt)}
                    </div>
                </div>
                <button 
                    onClick={handleCopy}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex-shrink-0"
                    title="Copy code"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            </div>

            {code && (
                <div className="bg-gray-50 mx-4 rounded-lg overflow-hidden border border-gray-200 h-28 relative shadow-inner">
                    <pre className="p-3 text-xs font-mono text-gray-700 h-full overflow-hidden">
                        <code>{code}</code>
                    </pre>
                    {/* Fading overlay at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
                </div>
            )}

            <div className="px-5 py-4 pb-2 flex-grow-0 flex flex-wrap gap-1.5">
                {tags && tags.length > 0 && tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        #{tag}
                    </span>
                ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center mt-auto bg-gray-50/50">
                <span className="text-xs text-gray-400 font-medium">Created {createdDate}</span>
                <button 
                    onClick={handleViewDetails}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    View Details <ExternalLink size={12} />
                </button>
            </div>
        </div>
    )
}
