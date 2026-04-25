import { useState } from "react"
import { X, Code2, Pencil } from "lucide-react"
import { API_BASE } from '../../api'

export default function AddSnippetModal({ onClose, onAddLocal, initialSnippet }) {
    const isEdit = !!initialSnippet

    const [form, setForm] = useState({
        title:       initialSnippet?.title       ?? "",
        language:    initialSnippet?.language    ?? "cpp",
        description: initialSnippet?.description ?? "",
        code:        initialSnippet?.code        ?? "",
        tags:        initialSnippet?.tags?.join(", ") ?? "",
    })
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.title.trim() || !form.code.trim()) return

        setSubmitting(true)
        setSubmitError(null)

        const tagsArray = form.tags
            .split(",")
            .map(t => t.trim().toLowerCase())
            .filter(Boolean)

        const payload = {
            title:       form.title.trim(),
            language:    form.language,
            description: form.description.trim(),
            code:        form.code,
            tags:        tagsArray,
            isPublic:    false,
        }

        try {
            const url = isEdit
                ? `${API_BASE}/api/codeTemplate/${initialSnippet._id}`
                : `${API_BASE}/api/codeTemplate`
            const method = isEdit ? "PATCH" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                onAddLocal()
            } else {
                throw new Error("Failed to save")
            }
        } catch {
            setSubmitError("Could not save snippet — server is unreachable. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#111111] border border-white/[0.12] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[86vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#111111]">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex flex-shrink-0 items-center justify-center ${isEdit ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                            {isEdit ? <Pencil size={16} /> : <Code2 size={16} />}
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {isEdit ? "Edit Snippet" : "New Snippet"}
                        </h2>
                        {isEdit && (
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                {initialSnippet.title}
                            </span>
                        )}
                    </div>
                    <button
                        className="text-gray-400 hover:text-gray-200 hover:bg-white/10 p-2 rounded-full transition-colors focus:outline-none"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto hidden-scrollbar">
                    <form id="snippet-form" className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-300">Title <span className="text-red-500">*</span></label>
                                <input
                                    name="title"
                                    placeholder="e.g. Binary Search"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.12] rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/55 transition-colors placeholder:text-gray-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-300">Language</label>
                                <div className="relative">
                                    <select
                                        name="language"
                                        value={form.language}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.12] rounded-lg text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/55 transition-colors cursor-pointer"
                                    >
                                        <option value="cpp">C++</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="javascript">JavaScript</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-300">Description</label>
                            <input
                                name="description"
                                placeholder="Brief description of the snippet"
                                value={form.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.12] rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/55 transition-colors placeholder:text-gray-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-300 flex justify-between">
                                <span>Code <span className="text-red-500">*</span></span>
                                <span className="text-xs font-normal text-gray-500 uppercase tracking-widest font-mono">monospace</span>
                            </label>
                            <textarea
                                name="code"
                                placeholder="Paste your code here..."
                                value={form.code}
                                onChange={handleChange}
                                required
                                rows={9}
                                className="w-full px-4 py-3 text-sm font-mono leading-relaxed bg-[#0a0a0a] border border-white/[0.12] rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/70 custom-scrollbar resize-y placeholder:text-gray-500"
                                spellCheck="false"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-300">Tags <span className="text-gray-500 font-normal">(comma-separated)</span></label>
                            <input
                                name="tags"
                                placeholder="e.g. algorithms, searching, cpp-basics"
                                value={form.tags}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 text-sm bg-[#0a0a0a] border border-white/[0.12] rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/55 transition-colors placeholder:text-gray-500"
                            />
                        </div>
                    </form>
                </div>

                {submitError && (
                    <div className="px-6 pb-2">
                        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{submitError}</p>
                    </div>
                )}

                <div className="px-6 py-4 border-t border-white/[0.08] bg-[#111111] flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        className="px-5 py-2.5 text-sm font-medium text-gray-200 bg-[#0a0a0a] border border-white/[0.14] rounded-lg hover:bg-white/10 focus:outline-none transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="snippet-form"
                        disabled={submitting || !form.title.trim() || !form.code.trim()}
                        className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${
                            isEdit
                                ? 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500'
                                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                        }`}
                    >
                        {submitting ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Save Snippet")}
                    </button>
                </div>
            </div>
        </div>
    )
}
