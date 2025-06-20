import { useCallback, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

interface Suggestion {
  id: string
  text: string
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization' | 'slang-protected'
  alternatives: string[]
  start: number
  end: number
  status: 'pending' | 'accepted' | 'ignored'
}

export function useSuggestions() {
  // Get store methods
  const setAllSuggestionsAndFilter = useEditorStore(s => s.setAllSuggestionsAndFilter)
  const refilterSuggestions = useEditorStore(s => s.refilterSuggestions)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch
  const fetchSuggestions = useCallback(() => {
    const { content, formalityLevel } = useEditorStore.getState();
    
    if (!content.trim()) {
      setAllSuggestionsAndFilter([])
      return
    }

    const safeText = content;
    
    // Debug logging
    console.log('🔍 Sending text to server:', JSON.stringify(safeText))
    console.log('🔍 Text length:', safeText.length)
    console.log('🔍 Formality level:', formalityLevel)
    
    // Use environment variable or fallback to localhost for development
    const apiUrl = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:3001';
    
    fetch(`${apiUrl}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: safeText,
        formalityLevel: formalityLevel 
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        const suggestions = data.suggestions || []
        
        // Debug logging for suggestions
        console.log('🔍 Received suggestions:')
        suggestions.forEach((suggestion: any) => {
          if (suggestion.type === 'demonetization') {
            console.log(`  - ${suggestion.text} (${suggestion.start}-${suggestion.end}): "${safeText.substring(suggestion.start, suggestion.end)}"`)
          }
        })
        
        // Store all suggestions and filter based on current settings
        setAllSuggestionsAndFilter(suggestions)
      })
      .catch(error => {
        console.error('Error fetching suggestions:', error)
        setAllSuggestionsAndFilter([])
      })
  }, [setAllSuggestionsAndFilter])

  // Call this after typing pauses
  const requestSuggestions = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(fetchSuggestions, 800)
  }, [fetchSuggestions])

  return { requestSuggestions, refilterSuggestions }
}
