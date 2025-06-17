import * as React from 'react';
import { useEditorStore } from '../../store/editorStore'

export default function SuggestionSidebar() {
  const suggestions = useEditorStore(s => s.suggestions)
  const updateSuggestionStatus = useEditorStore(s => s.updateSuggestionStatus)

  return (
    <aside className="w-64 bg-gray-100 border-l p-4">
      <h2 className="font-bold mb-2">Suggestions</h2>
      {suggestions.length === 0 && <p className="text-gray-500">No suggestions yet.</p>}
      <ul className="space-y-2">
        {suggestions.map(s => (
          <li key={s.id} className="bg-white p-2 rounded shadow flex flex-col gap-1">
            <span className="text-sm font-medium">{s.message}</span>
            <span className="text-xs text-gray-500">Type: {s.type}</span>
            <div className="flex gap-2 mt-1">
              <button className="btn" onClick={() => updateSuggestionStatus(s.id, 'accepted')}>Accept</button>
              <button className="btn" onClick={() => updateSuggestionStatus(s.id, 'ignored')}>Ignore</button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
} 