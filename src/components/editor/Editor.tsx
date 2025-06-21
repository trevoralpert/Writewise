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
  const { requestSuggestions, requestSuggestionsImmediate, refilterSuggestions } = useSuggestions()
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
      // ClipboardExtension, // Temporarily disabled to debug
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const newText = editor.getText();
      
      // Only update if content actually changed to prevent loops
      if (newText !== content) {
        setContent(newText)
        
        // Only request suggestions if there's meaningful content
        if (newText.trim().length > 0) {
          requestSuggestions()
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
  useEffect(() => {
    if (editor) {
      // Use a small delay to batch decoration updates and prevent flickering
      const timeout = setTimeout(() => {
        editor.view.dispatch(editor.state.tr) // empty transaction to force re-render
      }, 50) // 50ms delay to batch updates
      
      return () => clearTimeout(timeout)
    }
  }, [suggestions, editor])

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
      console.log('📥 Clipboard paste detected, refreshing suggestions for:', event.detail.content)
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
        {/* Enhanced Save Status Indicator */}
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
          
          {/* Enhanced status indicators */}
          <div className="flex items-center gap-4">
            {/* Save status */}
            <div className="flex items-center gap-2">
              {(isSaving || isCreatingDocument) && (
                <div className="loading loading-spinner loading-xs"></div>
              )}
              <div className={`text-sm ${getSaveStatusColor()}`}>
                {isCreatingDocument ? 'Creating document...' : getSaveStatusText()}
              </div>
            </div>
            
            {/* Suggestion count */}
            {(() => {
              const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
              return pendingSuggestions.length > 0 && (
                <div className="text-sm text-blue-600">
                  {pendingSuggestions.length} suggestion{pendingSuggestions.length !== 1 ? 's' : ''}
                </div>
              );
            })()}
          </div>
        </div>

        <EditorContent
          editor={editor}
          className="prose w-full min-h-[300px] focus:outline-none focus:ring-0"
        />
        
        {popup && (
          <InlinePopup rect={popup.rect} suggestion={popup.suggestion} onClose={() => setPopup(null)} />
        )}
        
        <ContextMenu
          editor={editor}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      </div>
    </div>
  )
}

export default Editor