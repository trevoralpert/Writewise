// src/store/editorStore.ts
import { create } from 'zustand'
import { updateDocument } from '../services/documents'

interface Suggestion {
  id: string
  start: number
  end: number
  message: string
  type: 'grammar' | 'spelling' | 'style'
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

  // Save state
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (val: boolean) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  setContent: (content) => {
    set({ content, hasUnsavedChanges: true })
  },

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  updateSuggestionStatus: (id, status) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    })),

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

  // Save state
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
}))