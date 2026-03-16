import { useState } from "react";
import { X, MessageSquarePlus } from "lucide-react";

export default function NewPostModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("discussion");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      types: type,
      tags: tagsArray,
      createdAt: new Date().toISOString(),
      upVotes: [],
      downVotes: [],
      commentCount: 0,
    });
    
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex flex-shrink-0 items-center justify-center">
                  <MessageSquarePlus size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">New Discussion</h2>
           </div>
           <button 
               className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none" 
               onClick={onClose}
           >
              <X size={20} />
           </button>
        </div>

        <div className="p-6 overflow-y-auto hidden-scrollbar">
          <form id="new-post-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 focus-within:text-indigo-600">
              <label className="text-sm font-semibold text-gray-700">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5 focus-within:text-indigo-600">
              <label className="text-sm font-semibold text-gray-700">Type</label>
              <div className="relative">
                  <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer capitalize"
                  >
                      <option value="discussion">Discussion</option>
                      <option value="blog">Blog</option>
                      <option value="help">Help</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
            </div>

            <div className="space-y-1.5 focus-within:text-indigo-600">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                <span>Content <span className="text-red-500">*</span></span>
              </label>
              <textarea
                placeholder="Provide details, code snippets, etc."
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm leading-relaxed bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 custom-scrollbar resize-none placeholder:text-gray-400"
              ></textarea>
            </div>

            <div className="space-y-1.5 focus-within:text-indigo-600">
              <label className="text-sm font-semibold text-gray-700">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. dp, graphs, codeforces"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl mt-auto">
          <button 
             type="button" 
             className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors" 
             onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-post-form"
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
            disabled={isSubmitting || !title.trim() || !content.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Discussion"}
          </button>
        </div>
      </div>
    </div>
  );
}
