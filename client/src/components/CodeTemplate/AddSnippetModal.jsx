import { useState } from "react"
import { X, Code2 } from "lucide-react"

export default function AddSnippetModal({ onClose, onAddLocal }) {
    const [form, setForm] = useState({
        title: "",
        language: "cpp",
        description: "",
        code: "",
        tags: "",
    })
    const [submitting, setSubmitting] = useState(false)

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!form.title.trim() || !form.code.trim()) return

        setSubmitting(true)
        const tagsArray = form.tags
                .split(",")
                .map(t => t.trim().toLowerCase())
                .filter(Boolean);

        const payload = {
            title: form.title.trim(),
            language: form.language,
            description: form.description.trim(),
            code: form.code,
            tags: tagsArray,
            isPublic: false,
        }

        try {
            const res = await fetch("/api/codeTemplate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            })
            if (res.ok) {
                // If backend sync succeeds, parent refetches via API (assuming onAdd API prop is passed, but we use onAddLocal)
                onAddLocal(payload)
            } else {
                throw new Error("Failed to sync")
            }
        } catch (err) {
            console.log("Fallback to localStorage save for new snippet");
            onAddLocal(payload);
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex flex-shrink-0 items-center justify-center">
                            <Code2 size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">New Snippet</h2>
                    </div>
                    <button 
                        className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none" 
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto hidden-scrollbar">
                    <form id="snippet-form" className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5 focus-within:text-indigo-600">
                                <label className="text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
                                <input
                                    name="title"
                                    placeholder="e.g. Binary Search"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                                />
                            </div>

                            <div className="space-y-1.5 focus-within:text-indigo-600">
                                <label className="text-sm font-semibold text-gray-700">Language</label>
                                <div className="relative">
                                    <select 
                                        name="language" 
                                        value={form.language} 
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                                    >
                                        <option value="cpp">C++</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="javascript">JavaScript</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5 focus-within:text-indigo-600">
                            <label className="text-sm font-semibold text-gray-700">Description</label>
                            <input
                                name="description"
                                placeholder="Brief description of the snippet"
                                value={form.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                            />
                        </div>

                        <div className="space-y-1.5 focus-within:text-indigo-600">
                            <label className="text-sm font-semibold text-gray-700 flex justify-between">
                                <span>Code <span className="text-red-500">*</span></span>
                                <span className="text-xs font-normal text-gray-400 uppercase tracking-widest font-mono">monospace</span>
                            </label>
                            <textarea
                                name="code"
                                placeholder="Paste your code here..."
                                value={form.code}
                                onChange={handleChange}
                                required
                                rows={8}
                                className="w-full px-4 py-3 text-sm font-mono leading-relaxed bg-gray-900 border border-gray-800 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 custom-scrollbar resize-none placeholder:text-gray-600"
                                spellCheck="false"
                            />
                        </div>

                        <div className="space-y-1.5 focus-within:text-indigo-600">
                            <label className="text-sm font-semibold text-gray-700">Tags (comma-separated)</label>
                            <input
                                name="tags"
                                placeholder="e.g. algorithms, searching, cpp-basics"
                                value={form.tags}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
                    <button 
                        type="button" 
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="snippet-form"
                        disabled={submitting || !form.title.trim() || !form.code.trim()}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {submitting ? "Saving..." : "Save Snippet"}
                    </button>
                </div>
            </div>
        </div>
    )
}
