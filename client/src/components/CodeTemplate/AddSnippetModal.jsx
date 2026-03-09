import { useState } from "react"
import { X } from "lucide-react"

export default function AddSnippetModal({ onClose, onAdd }) {
    const [form, setForm] = useState({
        title: "",
        language: "cpp",
        description: "",
        code: "",
        tags: "",
    })
    const [submitting, setSubmitting] = useState(false) // using this to avoid multiple submition we set it on off while processing

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.title.trim() || !form.code.trim()) return

        setSubmitting(true)
        const payload = {
            title: form.title.trim(),
            language: form.language,
            description: form.description.trim(),
            code: form.code,
            tags: form.tags
                .split(",")
                .map(t => t.trim()) // to remove needless whitespace 
                .filter(Boolean),// to remove invalid tags like empty string , null , undefined
            isPublic: false,
        }

        try {
            const res = await fetch("/api/codeTemplate", {
                method: "POST",
                headers: { "Content-Type": "application/json" }, // to tell backend that data is json string
                credentials: "include", // tells browser to include user cookies in headers 
                body: JSON.stringify(payload),
            })
            if (res.ok) {
                onAdd()
                onClose()
            }
        } catch (err) {
            console.error("Failed to add snippet:", err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="ct-modal-overlay" onClick={onClose}> {/* to close the add snippet window when click anywhere outside form */}
            <div className="ct-modal" onClick={e => e.stopPropagation()}> {/* its to stop window from being closed when clicked inside form */}
                <div className="ct-modal-header">
                    <h2>New Snippet</h2>
                    <button className="ct-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form className="ct-form" onSubmit={handleSubmit}>
                    <div className="ct-field">
                        <label>Title</label>
                        <input
                            name="title"
                            placeholder="e.g. Binary Search Implementation"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="ct-field">
                        <label>Language</label>
                        <select name="language" value={form.language} onChange={handleChange}>
                            <option value="cpp">C++</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="javascript">JavaScript</option>
                        </select>
                    </div>

                    <div className="ct-field">
                        <label>Description</label>
                        <input
                            name="description"
                            placeholder="Brief description of the snippet"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="ct-field">
                        <label>Code</label>
                        <textarea
                            name="code"
                            placeholder="Paste your code here..."
                            value={form.code}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="ct-field">
                        <label>Tags (comma-separated)</label>
                        <input
                            name="tags"
                            placeholder="e.g. algorithms, searching, cpp-basics"
                            value={form.tags}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="ct-form-actions">
                        <button type="button" className="ct-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="ct-btn-submit"
                            // disabled atribute to make button inclickable means when the form changes are being submitted or any required field is not filled button will be unclickable
                            disabled={submitting || !form.title.trim() || !form.code.trim()}
                        >
                            {submitting ? "Saving..." : "Save Snippet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
