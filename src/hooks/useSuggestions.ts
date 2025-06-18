import { useCallback, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

export function useSuggestions() {
  const { content, setSuggestions } = useEditorStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch
  const fetchSuggestions = useCallback(() => {
    if (!content) return
    let safeText = content;
    if (safeText && !/[.?!,;: ]$/.test(safeText)) {
      safeText += ' ';
    }
    // Use environment variable or fallback to localhost for development
    const apiUrl = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: safeText }),
    })
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions || []))
      .catch(() => setSuggestions([]))
  }, [content, setSuggestions])

  // Call this after typing pauses
  const requestSuggestions = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(fetchSuggestions, 800)
  }, [fetchSuggestions])

  return { requestSuggestions }
}
