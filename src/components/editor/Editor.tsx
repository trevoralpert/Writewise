// src/components/editor/Editor.tsx
import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'
import { updateDocument } from '../../services/documents'

const Editor = () => {
  const { content, setContent, currentDocument } = useEditorStore()
  const { requestSuggestions } = useSuggestions()
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing here...',
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

  return (
    <div className="card bg-base-100 shadow-lg w-full">
      <div className="card-body p-4">
        <EditorContent
          editor={editor}
          className="prose w-full min-h-[300px] focus:outline-none border border-base-300 rounded-md p-3"
        />
      </div>
    </div>
  )
}

export default Editor