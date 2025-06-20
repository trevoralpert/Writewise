import { useCallback, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

interface Suggestion {
  id: string
  text: string
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization' | 'slang-protected' | 'tone-rewrite'
  alternatives: string[]
  start: number
  end: number
  status: 'pending' | 'accepted' | 'ignored'
  
  // New properties for tone-preserving rewrites
  priority?: number
  conflictsWith?: string[]
  originalTone?: string
  toneRewrite?: {
    originalText: string
    rewrittenText: string
    tonePreserved: boolean
    confidenceScore: number
    reasoning: string
  }
}

export function useSuggestions() {
  // Get store methods
  const setAllSuggestionsAndFilter = useEditorStore(s => s.setAllSuggestionsAndFilter)
  const refilterSuggestions = useEditorStore(s => s.refilterSuggestions)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced fetch
  const fetchSuggestions = useCallback(() => {
    const { 
      content, 
      formalityLevel, 
      tonePreservingEnabled,
      conflictResolutionMode,
      toneDetectionSensitivity 
    } = useEditorStore.getState();
    
    if (!content.trim()) {
      setAllSuggestionsAndFilter([])
      return
    }

    const safeText = content;
    
    // Debug logging
    console.log('🔍 Sending text to server:', JSON.stringify(safeText))
    console.log('🔍 Text length:', safeText.length)
    console.log('🔍 Formality level:', formalityLevel)
    console.log('🔍 Tone preserving enabled:', tonePreservingEnabled)
    console.log('🔍 Conflict resolution mode:', conflictResolutionMode)
    
    // Use environment variable or fallback to localhost for development
    const apiUrl = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:3001';
    
    fetch(`${apiUrl}/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: safeText,
        formalityLevel: formalityLevel,
        tonePreservingEnabled: tonePreservingEnabled,
        conflictResolutionMode: conflictResolutionMode,
        toneDetectionSensitivity: toneDetectionSensitivity
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
        
        // Phase 4C: Handle enhanced response with insights
        if (data.insights && data.insights.length > 0) {
          console.log('✨ Writing Insights:')
          data.insights.forEach((insight: any) => {
            console.log(`  ${insight.icon} ${insight.message}`)
          })
        }
        
        if (data.processingMetadata) {
          console.log('📊 Processing Metadata:', data.processingMetadata)
        }
        
        if (data.edgeCase) {
          console.log(`🛡️ Edge Case Handled: ${data.edgeCase.type} - ${data.edgeCase.message}`)
        }
        
        // Debug logging for suggestions
        console.log('🔍 Received suggestions:')
        suggestions.forEach((suggestion: any) => {
          if (suggestion.type === 'demonetization') {
            console.log(`  - ${suggestion.text} (${suggestion.start}-${suggestion.end}): "${safeText.substring(suggestion.start, suggestion.end)}"`)
          }
          if (suggestion.type === 'tone-rewrite') {
            console.log(`  - Tone rewrite: "${suggestion.text}" -> "${suggestion.toneRewrite?.rewrittenText}"`)
          }
          if (suggestion.userTip) {
            console.log(`    💡 Tip: ${suggestion.userTip}`)
          }
        })
        
        // Store all suggestions and filter based on current settings
        setAllSuggestionsAndFilter(suggestions)
        
        // Store insights in the editor store for potential UI display
        const { setWritingInsights, setCurrentSessionId, setAnalytics } = useEditorStore.getState()
        if (setWritingInsights && data.insights) {
          setWritingInsights(data.insights)
        }
        
        // Phase 5A: Handle analytics and session data
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId)
        }
        if (data.analytics) {
          setAnalytics(data.analytics)
        }
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
