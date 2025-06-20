// src/store/editorStore.ts
import { create } from 'zustand'
import { updateDocument } from '../services/documents'

interface Suggestion {
  id: string
  start: number
  end: number
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization' | 'slang-protected' | 'tone-rewrite'
  alternatives?: string[]
  confidence?: number
  status: 'pending' | 'accepted' | 'ignored'
  
  // New properties for tone-preserving rewrites
  priority?: number // 1-10 scale, higher = more important
  conflictsWith?: string[] // IDs of conflicting suggestions
  originalTone?: string // detected tone (casual, formal, creative, etc.)
  toneRewrite?: {
    originalText: string
    rewrittenText: string
    tonePreserved: boolean
    confidenceScore: number
    reasoning: string
  }
}

interface Document {
  id: string
  title: string
  content: string
  [key: string]: any
}

interface EditorState {
  content: string
  setContent: (content: string) => void

  suggestions: Suggestion[]
  allSuggestions: Suggestion[] // Store all unfiltered suggestions
  setSuggestions: (suggestions: Suggestion[]) => void
  setAllSuggestionsAndFilter: (allSuggestions: Suggestion[]) => void
  refilterSuggestions: () => void
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void

  currentDocument: Document | null
  setCurrentDocument: (doc: Document | null) => void
  saveCurrentDocument: () => Promise<boolean>

  // Phase 4C: Writing insights from enhanced AI response
  writingInsights: Array<{
    type: 'positive' | 'warning' | 'info' | 'enhancement' | 'stats'
    icon: string
    message: string
  }>
  setWritingInsights: (insights: Array<{
    type: 'positive' | 'warning' | 'info' | 'enhancement' | 'stats'
    icon: string
    message: string
  }>) => void

  // Feature toggles for settings page
  demonetizationEnabled: boolean
  setDemonetizationEnabled: (val: boolean) => void
  grammarEnabled: boolean
  setGrammarEnabled: (val: boolean) => void
  styleEnabled: boolean
  setStyleEnabled: (val: boolean) => void
  contextAwareGrammarEnabled: boolean
  setContextAwareGrammarEnabled: (val: boolean) => void
  
  // New: Tone-preserving rewrite settings
  tonePreservingEnabled: boolean
  setTonePreservingEnabled: (val: boolean) => void
  
  // Priority preferences for conflict resolution
  conflictResolutionMode: 'grammar-first' | 'tone-first' | 'balanced' | 'user-choice'
  setConflictResolutionMode: (mode: 'grammar-first' | 'tone-first' | 'balanced' | 'user-choice') => void
  
  // Tone detection sensitivity
  toneDetectionSensitivity: 'low' | 'medium' | 'high'
  setToneDetectionSensitivity: (level: 'low' | 'medium' | 'high') => void

  // Formality spectrum setting
  formalityLevel: 'casual' | 'balanced' | 'formal'
  setFormalityLevel: (level: 'casual' | 'balanced' | 'formal') => void

  // Save state
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (val: boolean) => void
}

// Helper function to check if two text ranges overlap
const doRangesOverlap = (range1: {start: number, end: number}, range2: {start: number, end: number}) => {
  return range1.start < range2.end && range2.start < range1.end;
}

// Helper function to calculate suggestion priority based on type and context
const calculateSuggestionPriority = (suggestion: Suggestion, conflictResolutionMode: string): number => {
  const basePriorities = {
    'demonetization': 9, // High priority - affects monetization
    'grammar': 6,        // Medium-high priority - affects correctness
    'spelling': 7,       // High priority - clear errors
    'tone-rewrite': 8,   // High priority - preserves voice while fixing
    'style': 4,          // Medium priority - affects clarity
    'slang-protected': 2 // Low priority - informational only
  }
  
  let priority = basePriorities[suggestion.type] || 5
  
  // Adjust based on conflict resolution mode
  switch (conflictResolutionMode) {
    case 'grammar-first':
      if (['grammar', 'spelling'].includes(suggestion.type)) priority += 2
      if (suggestion.type === 'tone-rewrite') priority -= 1
      break
    case 'tone-first':
      if (suggestion.type === 'tone-rewrite') priority += 2
      if (['grammar', 'spelling'].includes(suggestion.type)) priority -= 1
      break
    case 'balanced':
      // Keep base priorities
      break
    case 'user-choice':
      // All suggestions get equal consideration
      priority = 5
      break
  }
  
  // Factor in confidence score if available
  if (suggestion.confidence) {
    priority += (suggestion.confidence - 0.5) * 2 // -1 to +1 adjustment
  }
  
  return Math.max(1, Math.min(10, priority))
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  setContent: (content) => {
    set({ content, hasUnsavedChanges: true })
  },

  suggestions: [],
  allSuggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  setAllSuggestionsAndFilter: (allSuggestions) => {
    const state = get()
    
    // Calculate priorities for all suggestions
    const suggestionsWithPriority = allSuggestions.map(suggestion => ({
      ...suggestion,
      priority: calculateSuggestionPriority(suggestion, state.conflictResolutionMode)
    }))
    
    const filteredSuggestions = suggestionsWithPriority.filter((suggestion) => {
      // Filter based on feature toggles
      if (suggestion.type === 'demonetization' && !state.demonetizationEnabled) {
        return false
      }
      if ((suggestion.type === 'grammar' || suggestion.type === 'spelling') && !state.grammarEnabled) {
        return false
      }
      if (suggestion.type === 'style' && !state.styleEnabled) {
        return false
      }
      if (suggestion.type === 'slang-protected' && !state.contextAwareGrammarEnabled) {
        return false
      }
      if (suggestion.type === 'tone-rewrite' && !state.tonePreservingEnabled) {
        return false
      }
      return true
    })
    
    set({ allSuggestions: suggestionsWithPriority, suggestions: filteredSuggestions })
  },
  refilterSuggestions: () => {
    const state = get()
    
    // Recalculate priorities when settings change
    const suggestionsWithPriority = state.allSuggestions.map(suggestion => ({
      ...suggestion,
      priority: calculateSuggestionPriority(suggestion, state.conflictResolutionMode)
    }))
    
    const filteredSuggestions = suggestionsWithPriority.filter((suggestion) => {
      // Filter based on feature toggles
      if (suggestion.type === 'demonetization' && !state.demonetizationEnabled) {
        return false
      }
      if ((suggestion.type === 'grammar' || suggestion.type === 'spelling') && !state.grammarEnabled) {
        return false
      }
      if (suggestion.type === 'style' && !state.styleEnabled) {
        return false
      }
      if (suggestion.type === 'slang-protected' && !state.contextAwareGrammarEnabled) {
        return false
      }
      if (suggestion.type === 'tone-rewrite' && !state.tonePreservingEnabled) {
        return false
      }
      return true
    })
    
    set({ allSuggestions: suggestionsWithPriority, suggestions: filteredSuggestions })
  },
  updateSuggestionStatus: (id, status) =>
    set((state) => {
      const targetSuggestion = state.suggestions.find(s => s.id === id);
      if (!targetSuggestion) return state;

      // If the suggestion is being accepted, we need to handle overlapping suggestions
      if (status === 'accepted') {
        return {
          suggestions: state.suggestions.map((s) => {
            if (s.id === id) {
              return { ...s, status };
            }
            
            // Check if this suggestion overlaps with the accepted one
            if (doRangesOverlap(
              { start: s.start, end: s.end },
              { start: targetSuggestion.start, end: targetSuggestion.end }
            )) {
              // Mark overlapping suggestions as resolved to prevent conflicts
              return { ...s, status: 'ignored' };
            }
            
            // Check if this suggestion is marked as conflicting
            if (targetSuggestion.conflictsWith?.includes(s.id) || s.conflictsWith?.includes(id)) {
              return { ...s, status: 'ignored' };
            }
            
            return s;
          })
        };
      }

      // For ignored suggestions, just update that one
      return {
        suggestions: state.suggestions.map((s) =>
          s.id === id ? { ...s, status } : s
        )
      };
    }),

  currentDocument: null,
  setCurrentDocument: (doc) => {
    // Clear suggestions when switching documents
    set({ 
      currentDocument: doc, 
      content: doc?.content || '', 
      suggestions: [],
      allSuggestions: [],
      hasUnsavedChanges: false,
      lastSaved: doc ? new Date() : null
    })
  },

  saveCurrentDocument: async () => {
    const state = get()
    if (!state.currentDocument?.id || !state.hasUnsavedChanges) {
      return true
    }

    set({ isSaving: true })
    
    try {
      const { error } = await updateDocument(state.currentDocument.id, state.content)
      
      if (error) {
        console.error('Failed to save document:', error)
        set({ isSaving: false })
        return false
      }

      set({ 
        isSaving: false, 
        hasUnsavedChanges: false, 
        lastSaved: new Date() 
      })
      return true
    } catch (error) {
      console.error('Failed to save document:', error)
      set({ isSaving: false })
      return false
    }
  },

  // Phase 4C: Writing insights from enhanced AI response
  writingInsights: [],
  setWritingInsights: (insights) => set({ writingInsights: insights }),

  // Feature toggles for settings page
  demonetizationEnabled: true,
  setDemonetizationEnabled: (val) => {
    set({ demonetizationEnabled: val })
    get().refilterSuggestions() // Refilter when settings change
  },
  grammarEnabled: true,
  setGrammarEnabled: (val) => {
    set({ grammarEnabled: val })
    get().refilterSuggestions()
  },
  styleEnabled: true,
  setStyleEnabled: (val) => {
    set({ styleEnabled: val })
    get().refilterSuggestions()
  },
  contextAwareGrammarEnabled: true,
  setContextAwareGrammarEnabled: (val) => {
    set({ contextAwareGrammarEnabled: val })
    get().refilterSuggestions()
  },
  
  // New: Tone-preserving rewrite settings
  tonePreservingEnabled: true,
  setTonePreservingEnabled: (val) => {
    set({ tonePreservingEnabled: val })
    get().refilterSuggestions()
  },
  
  // Priority preferences for conflict resolution
  conflictResolutionMode: 'balanced',
  setConflictResolutionMode: (mode) => {
    set({ conflictResolutionMode: mode })
    get().refilterSuggestions() // Recalculate priorities when mode changes
  },
  
  // Tone detection sensitivity
  toneDetectionSensitivity: 'medium',
  setToneDetectionSensitivity: (level) => set({ toneDetectionSensitivity: level }),

  // Formality spectrum setting
  formalityLevel: 'casual',
  setFormalityLevel: (level) => set({ formalityLevel: level }),

  // Save state
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
}))