import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({
  value,
  options = [],
  onChange,
  placeholder = 'Select...',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hlIndex, setHlIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
        setHlIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input & scroll to selected when dropdown opens
  useEffect(() => {
    if (open) {
      setHlIndex(-1);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (hlIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[hlIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [hlIndex]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHlIndex(-1);
  }, [filtered]);

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
    setQuery('');
    setHlIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setOpen((prev) => !prev);
      setQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (!open || filtered.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHlIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHlIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (hlIndex >= 0 && hlIndex < filtered.length) {
          handleSelect(filtered[hlIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setQuery('');
        setHlIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`w-full bg-white dark:bg-[#0a0a0a] border text-sm rounded-lg py-3 px-4 text-left flex items-center justify-between outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          open
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.15]'
        }`}
      >
        <span
          className={
            value
              ? 'text-gray-900 dark:text-white truncate'
              : 'text-gray-400 dark:text-gray-500 truncate'
          }
        >
          {value || placeholder}
        </span>

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <X size={12} className="text-gray-400" />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.06] rounded-md text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Options list */}
          <div ref={listRef} className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400 text-center italic">
                No results found
              </p>
            ) : (
              filtered.map((opt, i) => (
                <button
                  key={opt}
                  data-option
                  type="button"
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHlIndex(i)}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    i === hlIndex
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : opt === value
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
