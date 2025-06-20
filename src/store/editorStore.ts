// src/store/editorStore.ts
import { create } from 'zustand'
import { updateDocument } from '../services/documents'

interface Suggestion {
  id: string
  start: number
  end: number
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization'
  alternatives?: string[]
  confidence?: number
  status: 'pending' | 'accepted' | 'ignored'
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
  setSuggestions: (suggestions: Suggestion[]) => void
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void

  currentDocument: Document | null
  setCurrentDocument: (doc: Document | null) => void
  saveCurrentDocument: () => Promise<boolean>

  showStyleSuggestions: boolean
  setShowStyleSuggestions: (val: boolean) => void

  showDemonetizationSuggestions: boolean
  setShowDemonetizationSuggestions: (val: boolean) => void

  // Feature toggles for settings page
  demonetizationEnabled: boolean
  setDemonetizationEnabled: (val: boolean) => void
  grammarEnabled: boolean
  setGrammarEnabled: (val: boolean) => void
  styleEnabled: boolean
  setStyleEnabled: (val: boolean) => void

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

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  setContent: (content) => {
    set({ content, hasUnsavedChanges: true })
  },

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
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

  showStyleSuggestions: true,
  setShowStyleSuggestions: (val) => set({ showStyleSuggestions: val }),

  showDemonetizationSuggestions: true,
  setShowDemonetizationSuggestions: (val) => set({ showDemonetizationSuggestions: val }),

  // Feature toggles for settings page
  demonetizationEnabled: true,
  setDemonetizationEnabled: (val) => set({ demonetizationEnabled: val }),
  grammarEnabled: true,
  setGrammarEnabled: (val) => set({ grammarEnabled: val }),
  styleEnabled: true,
  setStyleEnabled: (val) => set({ styleEnabled: val }),

  // Save state
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
}))