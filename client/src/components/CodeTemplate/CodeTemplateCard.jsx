import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Code2, Copy, Check, ExternalLink } from "lucide-react"

// Relative time helper (e.g. "2 days ago", "3 weeks ago")
function timeAgo(dateStr) {
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

export default function CodeTemplateCard({ snippet }) {
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)

    const { _id, title, language, code, tags, createdAt, updatedAt } = snippet

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }

    function handleViewDetails() {
        navigate(`/CodeTemplate/${_id}`, { state: { snippet } })
    }

    const createdDate = new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })

    return (
        <div className="ct-card">
            {/* Header: icon + title + copy */}
            <div className="ct-card-header">
                <div className={`ct-card-icon lang-${language}`}>
                    <Code2 size={18} />
                </div>
                <div className="ct-card-title-area">
                    <h3 className="ct-card-title">{title}</h3>
                    <div className="ct-card-subtitle">
                        {LANG_LABEL[language] || language} • Updated {timeAgo(updatedAt)}
                    </div>
                </div>
                <button className="ct-card-copy" title="Copy code" onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            </div>

            {/* Code preview */}
            {code && (
                <div className="ct-card-code">
                    <pre>{code}</pre>
                </div>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
                <div className="ct-card-tags">
                    {tags.map((tag, i) => (
                        <span key={i} className="ct-tag">#{tag}</span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="ct-card-footer">
                <span className="ct-card-date">Created {createdDate}</span>
                <span className="ct-card-link" onClick={handleViewDetails}>
                    View Details <ExternalLink size={12} />
                </span>
            </div>
        </div>
    )
}
