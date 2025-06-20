// src/components/editor/Editor.tsx
import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SuggestionHighlight } from '../../extensions/SuggestionHighlight'
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'
import { createDocument } from '../../services/documents'
import InlinePopup from './InlinePopup'

interface EditorProps {
  refreshDocuments?: () => Promise<void>
}

const Editor = ({ refreshDocuments }: EditorProps) => {
  const { 
    content, 
    setContent, 
    currentDocument, 
    suggestions, 
    saveCurrentDocument,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    setCurrentDocument 
  } = useEditorStore()
  const { requestSuggestions } = useSuggestions()
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const [popup, setPopup] = React.useState<{rect: DOMRect, suggestion: any} | null>(null)
  const prevDocId = React.useRef<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = React.useState(false)
  const [titleInput, setTitleInput] = React.useState('')
  const [isCreatingDocument, setIsCreatingDocument] = React.useState(false)

  // Get user from context - we'll need this to create documents
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    // Get user from Supabase auth
    const getUser = async () => {
      const { data: { user } } = await import('../../services/supabaseClient').then(m => m.supabase.auth.getUser())
      setUser(user)
    }
    getUser()
  }, [])

  const debouncedSave = async () => {
    if (currentDocument?.id && hasUnsavedChanges) {
      await saveCurrentDocument()
    }
  }

  const handleCreateDocumentFromUntitled = async () => {
    if (!titleInput.trim() || !user || isCreatingDocument) return
    
    setIsCreatingDocument(true)
    
    try {
      const { data, error } = await createDocument(user.id, titleInput.trim(), content)
      
      if (error) {
        console.error('Failed to create document:', error)
        alert('Failed to create document. Please try again.')
      } else if (data) {
        setCurrentDocument(data)
        setIsEditingTitle(false)
        setTitleInput('')
        
        // Refresh the documents list in the sidebar
        if (refreshDocuments) {
          await refreshDocuments()
        }
      }
    } catch (error) {
      console.error('Failed to create document:', error)
      alert('Failed to create document. Please try again.')
    }
    
    setIsCreatingDocument(false)
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent the parent div's click handler from firing
    if (!currentDocument) {
      setIsEditingTitle(true)
      setTitleInput('')
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateDocumentFromUntitled()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
      setTitleInput('')
    }
  }

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

      // Debounced autosave
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(debouncedSave, 1000) // 1-second debounce
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

  // Save current document before switching to a new one
  useEffect(() => {
    const prevId = prevDocId.current;
    if (prevId && prevId !== currentDocument?.id) {
      // Force save for the previous doc immediately
      if (hasUnsavedChanges) {
        saveCurrentDocument();
      }
    }
    prevDocId.current = currentDocument?.id || null;
  }, [currentDocument, hasUnsavedChanges, saveCurrentDocument]);

  // Save on beforeunload (page refresh/close)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Force immediate save attempt
        saveCurrentDocument();
        
        // Show browser confirmation if there are unsaved changes
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges, saveCurrentDocument]);

  // Force save before visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        // Try to save immediately when tab becomes hidden
        saveCurrentDocument();
      }
    };
    
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [hasUnsavedChanges, saveCurrentDocument]);

  const getSaveStatusColor = () => {
    if (isSaving) return 'text-yellow-600'
    if (hasUnsavedChanges) return 'text-orange-600'
    return 'text-green-600'
  }

  const getSaveStatusText = () => {
    if (isSaving) return 'Saving...'
    if (hasUnsavedChanges) return 'Unsaved changes'
    if (lastSaved) {
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60))
      if (diffMinutes < 1) return 'Saved just now'
      if (diffMinutes < 60) return `Saved ${diffMinutes}m ago`
      const diffHours = Math.floor(diffMinutes / 60)
      return `Saved ${diffHours}h ago`
    }
    return 'All changes saved'
  }

  return (
    <div
      className="card bg-base-100 shadow-lg w-full cursor-text"
      onClick={() => editor?.commands.focus('end')}
    >
      <div className="card-body p-4">
        {/* Save Status Indicator */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={() => {
                    if (!titleInput.trim()) {
                      setIsEditingTitle(false)
                      setTitleInput('')
                    }
                  }}
                  placeholder="Enter document title"
                  className="input input-sm font-semibold text-lg bg-transparent border-dashed border-gray-400 focus:border-blue-500"
                  autoFocus
                  disabled={isCreatingDocument}
                />
                <button
                  onClick={handleCreateDocumentFromUntitled}
                  disabled={!titleInput.trim() || isCreatingDocument}
                  className="btn btn-sm btn-primary"
                >
                  {isCreatingDocument ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false)
                    setTitleInput('')
                  }}
                  disabled={isCreatingDocument}
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
              </>
            ) : (
              <h2 
                className={`text-lg font-semibold ${!currentDocument ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                onClick={handleTitleClick}
                title={!currentDocument ? 'Click to create a new document' : ''}
              >
                {currentDocument?.title || 'Untitled'}
                {!currentDocument && content && (
                  <span className="text-sm text-gray-500 ml-2">(click to save)</span>
                )}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isSaving || isCreatingDocument) && (
              <div className="loading loading-spinner loading-xs"></div>
            )}
            <div className={`text-sm ${getSaveStatusColor()}`}>
              {isCreatingDocument ? 'Creating document...' : getSaveStatusText()}
            </div>
          </div>
        </div>
        
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