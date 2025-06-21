import React, { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'

interface ContextMenuProps {
  editor: Editor | null
  position: { x: number; y: number } | null
  onClose: () => void
}

const ContextMenu: React.FC<ContextMenuProps> = ({ editor, position, onClose }) => {
  const [hasSelection, setHasSelection] = useState(false)

  useEffect(() => {
    if (editor) {
      const { from, to } = editor.state.selection
      setHasSelection(from !== to)
    }
  }, [editor, position])

  if (!position || !editor) return null

  const handleCopy = () => {
    editor.commands.copy()
    onClose()
  }

  const handleCut = () => {
    editor.commands.cut()
    onClose()
  }

  const handlePaste = async () => {
    try {
      // Try to use the Clipboard API first (modern browsers)
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        if (text) {
          editor.commands.insertContent(text)
        }
      } else {
        // Fallback: Show instructions for manual paste
        alert('Please use Ctrl+V (or Cmd+V on Mac) to paste')
      }
    } catch (error) {
      // Clipboard API failed, show instructions
      alert('Please use Ctrl+V (or Cmd+V on Mac) to paste')
    }
    onClose()
  }

  const handleSelectAll = () => {
    editor.commands.selectAll()
    onClose()
  }

  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <button
          onClick={handleCopy}
          disabled={!hasSelection}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
            !hasSelection ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
          }`}
        >
          <span className="text-xs">📋</span>
          Copy
          <span className="ml-auto text-xs text-gray-400">⌘C</span>
        </button>

        <button
          onClick={handleCut}
          disabled={!hasSelection}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
            !hasSelection ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
          }`}
        >
          <span className="text-xs">✂️</span>
          Cut
          <span className="ml-auto text-xs text-gray-400">⌘X</span>
        </button>

        <button
          onClick={handlePaste}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
        >
          <span className="text-xs">📥</span>
          Paste
          <span className="ml-auto text-xs text-gray-400">⌘V</span>
        </button>

        <hr className="my-1 border-gray-200" />

        <button
          onClick={handleSelectAll}
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
        >
          <span className="text-xs">🔘</span>
          Select All
          <span className="ml-auto text-xs text-gray-400">⌘A</span>
        </button>
      </div>
    </>
  )
}

export default ContextMenu 