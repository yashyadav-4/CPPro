import { useState } from "react";
import { X } from "lucide-react";

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
    // Convert comma-separated tags to array
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await onSubmit({
      title,
      content,
      types: type, // Matches Mongoose String enum
      tags: tagsArray,
    });
    
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content new-post-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>New Discussion</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="discussion">Discussion</option>
              <option value="blog">Blog</option>
              <option value="help">Help</option>
            </select>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              placeholder="Provide details, code snippets, etc."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="#dp, #graphs, codeforces"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Discussion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
