import React from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store/editorStore'

type Props = {
  rect: DOMRect
  suggestion: any
  onClose: () => void
}

const InlinePopup: React.FC<Props> = ({ rect, suggestion, onClose }) => {
  const { setContent, content, updateSuggestionStatus } = useEditorStore.getState()

  const accept = () => {
    const replacement = suggestion.alternatives?.[0] || ''
    const newContent = content.slice(0, suggestion.start) + replacement + content.slice(suggestion.end)
    setContent(newContent)
    updateSuggestionStatus(suggestion.id, 'accepted')
    onClose()
  }

  const ignore = () => {
    updateSuggestionStatus(suggestion.id, 'ignored')
    onClose()
  }

  return createPortal(
    <div
      className="inline-popup bg-base-300 text-sm rounded shadow-lg p-2 z-[9999]"
      style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left }}
      onMouseLeave={onClose}
    >
      <div className="font-medium mb-1 max-w-xs whitespace-pre-wrap">{suggestion.message}</div>
      <div className="flex gap-2 justify-end">
        <button className="btn btn-success btn-xs" onClick={accept}>Accept</button>
        <button className="btn btn-xs" onClick={ignore}>Ignore</button>
      </div>
    </div>,
    document.body
  )
}

export default InlinePopup 