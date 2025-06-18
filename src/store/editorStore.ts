// src/store/editorStore.ts
import { create } from 'zustand'

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
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  setContent: (content) => set({ content }),

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  updateSuggestionStatus: (id, status) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    })),

  currentDocument: null,
  setCurrentDocument: (doc) => set({ currentDocument: doc, content: doc?.content || '', suggestions: [] }),
}))