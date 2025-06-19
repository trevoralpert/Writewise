// src/components/editor/Editor.tsx
import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SuggestionHighlight } from '../../extensions/SuggestionHighlight'
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'
import { updateDocument } from '../../services/documents'
import tippy, { delegate, hideAll } from 'tippy.js'
import 'tippy.js/dist/tippy.css'

const Editor = () => {
  const { content, setContent, currentDocument, suggestions } = useEditorStore()
  const { requestSuggestions } = useSuggestions()
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null)

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
    // Close any open tooltips when suggestions data changes
    hideAll({ duration: 0 })
  }, [suggestions, editor])

  // Attach Tippy hover cards to suggestion underlines
  useEffect(() => {
    if (!editor) return

    // delegate attaches one tippy instance for all matching targets
    const tip = delegate(editor.view.dom, {
      target: '.suggestion-underline',
      interactive: true,
      appendTo: () => document.body,
      allowHTML: true,
      placement: 'bottom',
      onShow(instance) {
        const id = (instance.reference as HTMLElement).dataset.suggestionId
        const s = useEditorStore.getState().suggestions.find((x) => x.id === id)
        if (!s) return false

        const accept = () => {
          const { content } = useEditorStore.getState()
          const replacement = s.alternatives?.[0] || ''
          const newContent = content.slice(0, s.start) + replacement + content.slice(s.end)
          useEditorStore.getState().setContent(newContent)
          useEditorStore.getState().updateSuggestionStatus(s.id, 'accepted')
          instance.hide()
        }

        const ignore = () => {
          useEditorStore.getState().updateSuggestionStatus(s.id, 'ignored')
          instance.hide()
        }

        const div = document.createElement('div')
        div.className = 'space-y-2'
        const msg = document.createElement('div')
        msg.textContent = s.message
        const btnRow = document.createElement('div')
        btnRow.className = 'flex gap-2'

        const acceptBtn = document.createElement('button')
        acceptBtn.textContent = 'Accept'
        acceptBtn.className = 'btn btn-success btn-xs'
        acceptBtn.onclick = accept

        const ignoreBtn = document.createElement('button')
        ignoreBtn.textContent = 'Ignore'
        ignoreBtn.className = 'btn btn-ghost btn-xs'
        ignoreBtn.onclick = ignore

        btnRow.appendChild(acceptBtn)
        btnRow.appendChild(ignoreBtn)
        div.appendChild(msg)
        div.appendChild(btnRow)
        instance.setContent(div)
      },
      onHidden(instance) {
        // fully remove the popper instance to prevent accumulation
        instance.destroy()
      },
    })

    return () => {
      tip.destroy()
    }
  }, [editor])

  // Request suggestions once when a document is first loaded
  useEffect(() => {
    if (editor && currentDocument) {
      requestSuggestions()
    }
  }, [currentDocument, editor, requestSuggestions])

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
      </div>
    </div>
  )
}

export default Editor