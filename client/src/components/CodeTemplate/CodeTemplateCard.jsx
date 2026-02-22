import { useNavigate } from "react-router-dom"
import { Code2, Trash2, ExternalLink } from "lucide-react"

export default function CodeTemplateCard({ snippet, onDelete }) {
    const navigate = useNavigate()
    const { _id, title, language, description, tags, updatedAt } = snippet

    const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })

    const langLabel = {
        cpp: "CPP",
        python: "PYTHON",
        java: "JAVA",
        javascript: "JAVASCRIPT",
    }

    function handleViewDetails() {
        navigate(`/CodeTemplate/${_id}`, { state: { snippet } })
    }

    return (
        <div className="ct-card">
            {/* Delete button */}
            <button
                className="ct-card-delete"
                title="Delete snippet"
                onClick={() => onDelete(_id)}
            >
                <Trash2 size={14} />
            </button>

            {/* Top row: icon + title/lang */}
            <div className="ct-card-top">
                <div className="ct-card-icon">
                    <Code2 size={20} />
                </div>
                <div className="ct-card-info">
                    <h3 className="ct-card-title">{title}</h3>
                    <span className="ct-card-lang">{langLabel[language] || language}</span>
                </div>
            </div>

            {/* Description */}
            {description && <p className="ct-card-desc">{description}</p>}

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
                <span className="ct-card-date">Last updated: {formattedDate}</span>
                <span className="ct-card-link" onClick={handleViewDetails}>
                    View Details <ExternalLink size={12} />
                </span>
            </div>
        </div>
    )
}
