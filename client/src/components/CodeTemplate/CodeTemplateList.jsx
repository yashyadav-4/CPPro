import { FileCode2 } from "lucide-react"
import CodeTemplateCard from "./CodeTemplateCard"

export default function CodeTemplateList({ snippets, onDelete, loading }) {
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
                    <h3>No snippets yet</h3>
                    <p>Create your first code snippet to get started.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="ct-grid">
            {snippets.map(snippet => (
                <CodeTemplateCard
                    key={snippet._id}
                    snippet={snippet}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}