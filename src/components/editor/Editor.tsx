// src/components/editor/Editor.tsx
import React, { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SuggestionHighlight } from '../../extensions/SuggestionHighlight'
import { ClipboardExtension } from '../../extensions/ClipboardExtension'
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'
import { createDocument } from '../../services/documents'
import InlinePopup from './InlinePopup'
import ContextMenu from './ContextMenu'

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
    setCurrentDocument,
    demonetizationEnabled,
    grammarEnabled,
    styleEnabled,
    contextAwareGrammarEnabled,
    tonePreservingEnabled,
    conflictResolutionMode,
    toneDetectionSensitivity
  } = useEditorStore()
  const { requestSuggestions, requestSuggestionsImmediate, requestSuggestionsWithText, refilterSuggestions, isLoading } = useSuggestions()
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null)
  const [popup, setPopup] = React.useState<{rect: DOMRect, suggestion: any} | null>(null)
  const [contextMenu, setContextMenu] = React.useState<{x: number, y: number} | null>(null)
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

  const handleTextChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [setContent])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing here...',
      }),
      SuggestionHighlight.configure({
        getSuggestions: () => {
          const state = useEditorStore.getState()
          return state.suggestions
        },
      }),
      ClipboardExtension, // Minimal version - should work now
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const newText = editor.getText();
      
      // Only update if content actually changed to prevent loops
      if (newText !== content) {
        setContent(newText)
        
        // Only request suggestions if there's meaningful content
        if (newText.trim().length > 0) {
          // Pass the current text directly to avoid race conditions
          requestSuggestionsWithText(newText)
        } else {
          // Clear suggestions for empty content
          useEditorStore.getState().setAllSuggestionsAndFilter([])
        }

        // Debounced autosave
        if (saveTimeout.current) clearTimeout(saveTimeout.current)
        saveTimeout.current = setTimeout(debouncedSave, 1000) // 1-second debounce
      }
    },
  })

  // Sync external content (e.g. after accepting a suggestion) into the editor
  useEffect(() => {
    if (editor && content !== editor?.getText()) {
      // Prevent infinite loops by checking if content actually changed
      const editorText = editor.getText()
      if (content !== editorText) {
        // Update without triggering another onUpdate
        editor.commands.setContent(content, false)
      }
    }
  }, [content, editor])

  // Clear autosave timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [])

  // Refresh decorations when suggestions update (with debounce to prevent flickering)
  // DISABLED: This was causing cursor jumping by dispatching transactions
  // ProseMirror automatically re-renders decorations when they change
  // useEffect(() => {
  //   if (editor) {
  //     // Use a small delay to batch decoration updates and prevent flickering
  //     const timeout = setTimeout(() => {
  //       editor.view.dispatch(editor.state.tr) // empty transaction to force re-render
  //     }, 50) // 50ms delay to batch updates
  //     
  //     return () => clearTimeout(timeout)
  //   }
  // }, [suggestions, editor])

  // Request suggestions immediately when a document is first loaded
  useEffect(() => {
    if (editor && currentDocument && currentDocument.content) {
      console.log('📄 Document loaded, requesting immediate suggestions for:', currentDocument.title)
      requestSuggestionsImmediate()
    }
  }, [currentDocument, editor, requestSuggestionsImmediate])

  // Listen for settings changes and refilter suggestions
  useEffect(() => {
    const { 
      demonetizationEnabled, 
      grammarEnabled, 
      styleEnabled, 
      contextAwareGrammarEnabled,
      tonePreservingEnabled,
      conflictResolutionMode,
      toneDetectionSensitivity
    } = useEditorStore.getState()
    
    console.log('🔧 Editor settings updated:', {
      demonetizationEnabled,
      grammarEnabled, 
      styleEnabled,
      contextAwareGrammarEnabled,
      tonePreservingEnabled,
      conflictResolutionMode,
      toneDetectionSensitivity
    })
    
    refilterSuggestions()
  }, [
    useEditorStore(s => s.demonetizationEnabled),
    useEditorStore(s => s.grammarEnabled),
    useEditorStore(s => s.styleEnabled),
    useEditorStore(s => s.contextAwareGrammarEnabled),
    useEditorStore(s => s.tonePreservingEnabled),
    useEditorStore(s => s.conflictResolutionMode),
    useEditorStore(s => s.toneDetectionSensitivity),
    refilterSuggestions
  ])

  // Hover listeners with delay mechanism
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    let hideTimeout: NodeJS.Timeout | null = null

    const handleMouseOver = (e: MouseEvent) => {
      // Clear any pending hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }

      const el = e.target as HTMLElement
      if (el && el.dataset) {
        // Handle new multi-layer suggestions
        if (el.dataset.suggestionIds) {
          const primaryId = el.dataset.primarySuggestion
          const suggestionIds = el.dataset.suggestionIds.split(',')
          
          // Find the primary suggestion (highest priority) for the popup
          const primarySugg = useEditorStore.getState().suggestions.find(s => s.id === primaryId)
          if (!primarySugg) return
          
          const range = document.createRange()
          range.selectNodeContents(el)
          const rect = range.getBoundingClientRect()
          
          // Add metadata about all suggestions in this group
          const allSuggestions = suggestionIds
            .map(id => useEditorStore.getState().suggestions.find(s => s.id === id))
            .filter(Boolean)
          
          setPopup({ 
            rect, 
            suggestion: { 
              ...primarySugg, 
              _multiLayer: true,
              _allSuggestions: allSuggestions 
            } 
          })
        }
        // Handle legacy single suggestions (for backward compatibility)
        else if (el.dataset.suggestionId) {
          const id = el.dataset.suggestionId
          const sugg = useEditorStore.getState().suggestions.find(s => s.id === id)
          if (!sugg) return
          const range = document.createRange()
          range.selectNodeContents(el)
          const rect = range.getBoundingClientRect()
          setPopup({ rect, suggestion: sugg })
        }
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el && el.dataset && (el.dataset.suggestionIds || el.dataset.suggestionId)) {
        const related = e.relatedTarget as HTMLElement | null
        
        // If moving to the popup, don't hide
        if (related && related.closest('.inline-popup')) {
          return
        }
        
        // Add a small delay before hiding to allow user to move cursor to popup
        hideTimeout = setTimeout(() => {
          setPopup(null)
        }, 100) // 100ms delay
      }
    }

    // Global mouse over handler for popup area
    const handleGlobalMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && target.closest('.inline-popup')) {
        // Clear hide timeout if hovering over popup
        if (hideTimeout) {
          clearTimeout(hideTimeout)
          hideTimeout = null
        }
      }
    }

    // Global click handler to close popup when clicking outside
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Don't close if clicking on the popup itself
      if (target && target.closest('.inline-popup')) {
        return
      }
      
      // Don't close if clicking on a suggestion underline (let hover handle it)
      if (target && target.dataset && (target.dataset.suggestionIds || target.dataset.suggestionId)) {
        return
      }
      
      // CRITICAL FIX: Don't close if clicking inside the editor content area
      if (target && target.closest('.ProseMirror')) {
        return
      }
      
      // Close popup for any other click
      setPopup(null)
    }

    dom.addEventListener('mouseover', handleMouseOver)
    dom.addEventListener('mouseout', handleMouseLeave)
    document.addEventListener('mouseover', handleGlobalMouseOver)
    document.addEventListener('click', handleGlobalClick)
    
    return () => {
      dom.removeEventListener('mouseover', handleMouseOver)
      dom.removeEventListener('mouseout', handleMouseLeave)
      document.removeEventListener('mouseover', handleGlobalMouseOver)
      document.removeEventListener('click', handleGlobalClick)
      if (hideTimeout) clearTimeout(hideTimeout)
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

  // Listen for clipboard paste events and refresh suggestions
  useEffect(() => {
    const handleClipboardPaste = (event: CustomEvent) => {
      console.log('📥 Clipboard paste detected, clearing old suggestions and requesting new ones')
      
      // Clear existing suggestions immediately to avoid conflicts with new content
      useEditorStore.getState().setAllSuggestionsAndFilter([])
      
      // Request fresh suggestions for the new content
      requestSuggestionsImmediate()
    }

    window.addEventListener('clipboard-paste-complete', handleClipboardPaste as EventListener)
    
    return () => {
      window.removeEventListener('clipboard-paste-complete', handleClipboardPaste as EventListener)
    }
  }, [requestSuggestionsImmediate])

  // Context menu handler
  useEffect(() => {
    if (!editor) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY })
      // Close popup if open
      setPopup(null)
    }

    const handleClick = () => {
      setContextMenu(null)
    }

    const dom = editor.view.dom
    dom.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)

    return () => {
      dom.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  const getSaveStatusColor = () => {
    if (isSaving) return 'text-amber-600'
    if (hasUnsavedChanges) return 'text-coral-500'
    return 'text-forest-600'
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
      className="card-warm w-full cursor-text min-h-[600px] shadow-warm-lg"
      // TESTING: Disabled focus handler that forces cursor to end
      // onClick={() => editor?.commands.focus('end')}
    >
      <div className="p-8">
        {/* Enhanced Save Status Indicator */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-forest-100">
          <div className="flex items-center gap-4">
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
                  className="input font-semibold text-2xl bg-transparent border-dashed border-forest-300 focus:border-forest-500 font-writing"
                  autoFocus
                  disabled={isCreatingDocument}
                />
                <button
                  onClick={handleCreateDocumentFromUntitled}
                  disabled={!titleInput.trim() || isCreatingDocument}
                  className="btn text-sm px-6 py-3"
                >
                  {isCreatingDocument ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false)
                    setTitleInput('')
                  }}
                  disabled={isCreatingDocument}
                  className="btn-ghost text-sm px-6 py-3"
                >
                  Cancel
                </button>
              </>
            ) : (
              <h2 
                className={`text-2xl font-bold font-writing text-gray-700 ${!currentDocument ? 'cursor-pointer hover:text-forest-600 transition-colors' : ''}`}
                onClick={handleTitleClick}
                title={!currentDocument ? 'Click to create a new document' : ''}
              >
                {currentDocument?.title || 'Untitled'}
                {!currentDocument && content && (
                  <span className="text-sm text-forest-500 ml-3 font-ui font-normal">(click to save)</span>
                )}
              </h2>
            )}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-coral-600 bg-coral-50 px-3 py-1 rounded-full text-sm font-ui">
                <span className="w-2 h-2 bg-coral-500 rounded-full animate-pulse"></span>
                <span className="font-medium">Unsaved changes</span>
              </div>
            )}
          </div>
           
          {/* Enhanced status indicators */}
          <div className="flex items-center gap-6">
            {/* Save status */}
            <div className="flex items-center gap-2">
              {(isSaving || isCreatingDocument) && (
                <div className="loading loading-spinner loading-xs text-forest-500"></div>
              )}
              <div className={`text-sm font-ui px-3 py-1 rounded-full ${getSaveStatusColor()}`}>
                {isCreatingDocument ? 'Creating document...' : getSaveStatusText()}
              </div>
            </div>

            {/* Suggestion processing status */}
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-forest-600 font-ui bg-forest-50 px-3 py-1 rounded-full">
                <div className="loading loading-spinner loading-xs"></div>
                Analyzing suggestions...
              </div>
            ) : (() => {
              const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
              return pendingSuggestions.length > 0 && (
                <div className="text-sm text-forest-600 font-ui bg-forest-50 px-3 py-1 rounded-full">
                  {pendingSuggestions.length} suggestion{pendingSuggestions.length !== 1 ? 's' : ''}
                </div>
              );
            })()}

            {/* Word count */}
            <div className="text-sm text-forest-600 font-ui">
              <span className="font-medium">{content.length}</span> characters
            </div>
          </div>
        </div>

        <EditorContent
          editor={editor}
          className="prose-writing w-full min-h-[400px] focus:outline-none focus:ring-0 p-6 border border-forest-100 rounded-lg bg-white shadow-inner"
        />
        
        {popup && (
          <InlinePopup rect={popup.rect} suggestion={popup.suggestion} onClose={() => setPopup(null)} />
        )}
        
        <ContextMenu
          editor={editor}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />

        {/* Word count and reading stats */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-forest-100 text-sm text-forest-600 font-ui">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-forest-400 rounded-full"></span>
              <strong>{content.split(' ').filter(word => word.length > 0).length}</strong> words
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-coral-400 rounded-full"></span>
              <strong>{Math.ceil(content.split(' ').filter(word => word.length > 0).length / 200)}</strong> min read
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              <strong>{content.split('\n').filter(line => line.trim().length > 0).length}</strong> paragraphs
            </span>
          </div>
          <div className="text-forest-500">
            {lastSaved ? `Last saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Not saved yet'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor