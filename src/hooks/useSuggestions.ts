import { useCallback, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

interface Suggestion {
  id: string
  text: string
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization'
  alternatives: string[]
  start: number
  end: number
  status: 'pending' | 'accepted' | 'ignored'
}

export function useSuggestions() {
  // We only need the setSuggestions updater; read content dynamically to avoid stale values
  const setSuggestions = useEditorStore(s => s.setSuggestions)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch
  const fetchSuggestions = useCallback(() => {
    const { content, showDemonetizationSuggestions, showStyleSuggestions } = useEditorStore.getState();
    
    if (!content.trim()) {
      setSuggestions([])
      return
    }

    const safeText = content;
    
    // Use environment variable or fallback to localhost for development
    const apiUrl = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:3001';
    
    fetch(`${apiUrl}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: safeText }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        const suggestions = data.suggestions || []
        
        // Filter suggestions based on user preferences
        const filteredSuggestions = suggestions.filter((suggestion: any) => {
          if (suggestion.type === 'demonetization') {
            return showDemonetizationSuggestions
          }
          if (suggestion.type === 'style') {
            return showStyleSuggestions
          }
          return true
        })
        
        setSuggestions(filteredSuggestions)
      })
      .catch(error => {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      })
  }, [setSuggestions])

  // Call this after typing pauses
  const requestSuggestions = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(fetchSuggestions, 800)
  }, [fetchSuggestions])

  return { requestSuggestions }
}
