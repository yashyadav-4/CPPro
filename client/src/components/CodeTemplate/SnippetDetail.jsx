import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ChevronLeft, Star, Share2, Trash2, Copy, Check } from "lucide-react"
import "./CodeTemplate.css"

export default function SnippetDetail() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)

    const snippet = state?.snippet

    if (!snippet) {
        navigate("/CodeTemplate", { replace: true })
        return null
    }

    const { title, language, description, code, tags, _id } = snippet

    const langLabel = {
        cpp: "CPP",
        python: "PYTHON",
        java: "JAVA",
        javascript: "JAVASCRIPT",
    }

    const codeLines = code ? code.split("\n") : []

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    async function handleDelete() {
        try {
            const res = await fetch(`/api/codeTemplate/${_id}`, {
                method: "DELETE",
                credentials: "include",
            })
            if (res.ok) {
                navigate("/CodeTemplate", { replace: true })
            }
        } catch (err) {
            console.error("Failed to delete snippet:", err)
        }
    }

    return (
        <div className="sd-page">
            {/* Back link */}
            <button className="sd-back" onClick={() => navigate("/CodeTemplate")}>
                <ChevronLeft size={18} />
                Back to all snippets
            </button>

            {/* Detail card */}
            <div className="sd-card">
                {/* Header row */}
                <div className="sd-header">
                    <div className="sd-title-row">
                        <h1 className="sd-title">{title}</h1>
                        <span className="sd-lang-badge">{langLabel[language] || language}</span>
                    </div>
                    <div className="sd-actions">
                        <button className="sd-action-btn" title="Favorite">
                            <Star size={18} />
                        </button>
                        <button className="sd-action-btn" title="Share">
                            <Share2 size={18} />
                        </button>
                        <button className="sd-action-btn sd-action-delete" title="Delete" onClick={handleDelete}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Description */}
                {description && <p className="sd-desc">{description}</p>}

                {/* Code block */}
                <div className="sd-code-wrapper">
                    <button className="sd-copy-btn" onClick={handleCopy}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? "Copied!" : "Copy Code"}
                    </button>
                    <pre className="sd-code">
                        <table className="sd-code-table">
                            <tbody>
                                {codeLines.map((line, i) => (
                                    <tr key={i}>
                                        <td className="sd-line-num">{i + 1}</td>
                                        <td className="sd-line-content">{line}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </pre>
                </div>

                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="sd-tags">
                        {tags.map((tag, i) => (
                            <span key={i} className="sd-tag">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
