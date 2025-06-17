// src/components/editor/Editor.tsx
import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'

const Editor = () => {
  const { content, setContent } = useEditorStore()
  const { requestSuggestions } = useSuggestions()

  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<p>Start writing here...</p>',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
      requestSuggestions()
    },
  })

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md min-h-[300px]">
      <EditorContent editor={editor} />
    </div>
  )
}

export default Editor