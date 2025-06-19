// src/components/editor/Editor.tsx
import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SuggestionHighlight } from '../../extensions/SuggestionHighlight'
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'
import { updateDocument } from '../../services/documents'
import InlinePopup from './InlinePopup'

const Editor = () => {
  const { content, setContent, currentDocument, suggestions } = useEditorStore()
  const { requestSuggestions } = useSuggestions()
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const [popup, setPopup] = React.useState<{rect: DOMRect, suggestion: any} | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing here...',
      }),
      SuggestionHighlight.configure({
        getSuggestions: () => {
          const state = useEditorStore.getState()
          return state.showStyleSuggestions ? state.suggestions : state.suggestions.filter(s => s.type !== 'style')
        },
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const newText = editor.getText();
      setContent(newText)
      requestSuggestions()

      // Debounced autosave to Supabase
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        if (currentDocument?.id) {
          await updateDocument(currentDocument.id, newText)
        }
      }, 1000) // 1-second debounce
    },
  })

  // Sync external content (e.g. after accepting a suggestion) into the editor
  useEffect(() => {
    if (editor && content !== editor?.getText()) {
      // Update without triggering another onUpdate
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  // Clear autosave timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [])

  // Refresh decorations when suggestions update
  useEffect(() => {
    if (editor) {
      editor.view.dispatch(editor.state.tr) // empty transaction to force re-render
    }
  }, [suggestions, editor])

  // Request suggestions once when a document is first loaded
  useEffect(() => {
    if (editor && currentDocument) {
      requestSuggestions()
    }
  }, [currentDocument, editor, requestSuggestions])

  // Hover listeners
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom

    const handleMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el && el.dataset && el.dataset.suggestionId) {
        const id = el.dataset.suggestionId
        const sugg = useEditorStore.getState().suggestions.find(s => s.id === id)
        if (!sugg) return
        const range = document.createRange()
        range.selectNodeContents(el)
        const rect = range.getBoundingClientRect()
        setPopup({ rect, suggestion: sugg })
      }
    }
    const handleMouseLeave = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el && el.dataset && el.dataset.suggestionId) {
        const related = e.relatedTarget as HTMLElement | null
        if (related && related.closest('.inline-popup')) {
          return
        }
        setPopup(null)
      }
    }
    dom.addEventListener('mouseover', handleMouseOver)
    dom.addEventListener('mouseout', handleMouseLeave)
    return () => {
      dom.removeEventListener('mouseover', handleMouseOver)
      dom.removeEventListener('mouseout', handleMouseLeave)
    }
  }, [editor])

  return (
    <div
      className="card bg-base-100 shadow-lg w-full cursor-text"
      onClick={() => editor?.commands.focus('end')}
    >
      <div className="card-body p-4">
        <EditorContent
          editor={editor}
          className="prose w-full min-h-[300px] focus:outline-none focus:ring-0"
        />
        {popup && (
          <InlinePopup rect={popup.rect} suggestion={popup.suggestion} onClose={() => setPopup(null)} />
        )}
      </div>
    </div>
  )
}

export default Editor