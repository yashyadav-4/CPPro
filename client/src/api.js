export const API_BASE = import.meta.env.VITE_API_BASE || '';

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, { credentials: 'include', ...options });
}
