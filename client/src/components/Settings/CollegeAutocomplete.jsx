import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, GraduationCap } from 'lucide-react';
import axios from 'axios';

export default function CollegeAutocomplete({ value, onChange, placeholder = 'e.g. IIT Bombay' }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hlIndex, setHlIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const listRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHlIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (hlIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[hlIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [hlIndex]);

  // Compute visible suggestions (excluding exact match)
  const visibleSuggestions = suggestions.filter(
    (s) => s.toLowerCase() !== query.toLowerCase()
  );

  // Reset highlight when suggestions change
  useEffect(() => {
    setHlIndex(-1);
  }, [suggestions]);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/settings/colleges?q=${encodeURIComponent(q.trim())}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setSuggestions(res.data.data || []);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    // Debounce API call
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
      setOpen(true);
    }, 300);
  };

  const handleSelect = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
    setSuggestions([]);
    setHlIndex(-1);
  };

  const handleFocus = () => {
    if (query.trim().length >= 2) {
      fetchSuggestions(query);
      setOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (!open || visibleSuggestions.length === 0) {
      if (e.key === 'Escape') { setOpen(false); setHlIndex(-1); }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHlIndex((prev) => (prev < visibleSuggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHlIndex((prev) => (prev > 0 ? prev - 1 : visibleSuggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (hlIndex >= 0 && hlIndex < visibleSuggestions.length) {
          handleSelect(visibleSuggestions[hlIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setHlIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white text-sm rounded-lg py-3 px-4 pr-9 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
        <GraduationCap
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* Suggestions dropdown */}
      {open && (visibleSuggestions.length > 0 || loading) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 flex items-center gap-2 text-xs text-gray-400">
              <Search size={12} className="animate-pulse" />
              Searching...
            </div>
          ) : (
            <div ref={listRef} className="max-h-48 overflow-y-auto overscroll-contain">
              {visibleSuggestions.map((name, i) => (
                <button
                  key={name}
                  data-option
                  type="button"
                  onClick={() => handleSelect(name)}
                  onMouseEnter={() => setHlIndex(i)}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    i === hlIndex
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
