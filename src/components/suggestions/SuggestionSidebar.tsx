import * as React from 'react';
import { useEditorStore } from '../../store/editorStore'

function replaceAt(content: string, start: number, end: number, replacement: string) {
  return content.slice(0, start) + replacement + content.slice(end)
}

export default function SuggestionSidebar() {
  const suggestions = useEditorStore(s => s.suggestions)
  const updateSuggestionStatus = useEditorStore(s => s.updateSuggestionStatus)
  const content = useEditorStore(s => s.content)
  const setContent = useEditorStore(s => s.setContent)

  const acceptSuggestion = (s: any) => {
    if (!content) return
    const replacement = s.alternatives?.[0] || ''
    const newContent = replaceAt(content, s.start, s.end, replacement)
    setContent(newContent)
    updateSuggestionStatus(s.id, 'accepted')
  }

  return (
    <aside className="w-64 bg-gray-100 border-l p-4">
      <h2 className="font-bold mb-2">Suggestions</h2>
      {suggestions.length === 0 && <p className="text-gray-500">No suggestions yet.</p>}
      <ul className="space-y-2">
        {suggestions.filter(s => s.status !== 'accepted' && s.status !== 'ignored').map(s => (
          <li key={s.id} className="bg-white p-2 rounded shadow flex flex-col gap-1">
            <span className="text-sm font-medium">{s.message}</span>
            <span className="text-xs text-gray-500">Type: {s.type}</span>
            <div className="flex gap-2 mt-1">
              <button className="btn" onClick={() => acceptSuggestion(s)}>Accept</button>
              <button className="btn" onClick={() => updateSuggestionStatus(s.id, 'ignored')}>Ignore</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
} 