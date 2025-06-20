import * as React from 'react';
import { useEditorStore } from '../../store/editorStore'
import { useSuggestions } from '../../hooks/useSuggestions'
import { updateDocument } from '../../services/documents'

function replaceAt(content: string, start: number, end: number, replacement: string) {
  return content.slice(0, start) + replacement + content.slice(end)
}

export default function SuggestionSidebar() {
  const suggestions = useEditorStore(s => s.suggestions)
  const updateSuggestionStatus = useEditorStore(s => s.updateSuggestionStatus)
  const content = useEditorStore(s => s.content)
  const setContent = useEditorStore(s => s.setContent)
  const currentDocument = useEditorStore(s => s.currentDocument)
  const showStyleSuggestions = useEditorStore(s => s.showStyleSuggestions)
  const setShowStyleSuggestions = useEditorStore(s => s.setShowStyleSuggestions)
  const showDemonetizationSuggestions = useEditorStore(s => s.showDemonetizationSuggestions)
  const setShowDemonetizationSuggestions = useEditorStore(s => s.setShowDemonetizationSuggestions)
  const { requestSuggestions } = useSuggestions()

  const acceptSuggestion = (s: any) => {
    if (!content) return
    const replacement = s.alternatives?.[0] || ''
    const newContent = replaceAt(content, s.start, s.end, replacement)
    setContent(newContent)
    updateSuggestionStatus(s.id, 'accepted')

    // Persist change to Supabase
    if (currentDocument?.id) {
      updateDocument(currentDocument.id, newContent)
    }

    // Re-run suggestions to clean up any remaining
    requestSuggestions()
  }

  // Filter suggestions based on user preferences
  const filteredSuggestions = suggestions
    .filter(s => s.status !== 'accepted' && s.status !== 'ignored')
    .filter(s => {
      if (s.type === 'style' && !showStyleSuggestions) return false
      if (s.type === 'demonetization' && !showDemonetizationSuggestions) return false
      return true
    })

  const getSuggestionCardClass = (type: string) => {
    switch (type) {
      case 'style':
        return 'bg-blue-500 text-white'
      case 'demonetization':
        return 'bg-orange-500 text-white'
      default:
        return 'bg-base-100'
    }
  }

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'demonetization':
        return 'Demonetization Risk'
      case 'style':
        return 'Style'
      case 'grammar':
        return 'Grammar'
      case 'spelling':
        return 'Spelling'
      default:
        return type
    }
  }

  return (
    <aside className="w-72 bg-base-200 p-4 space-y-4">
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium">Style suggestions</span>
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-info"
            checked={showStyleSuggestions}
            onChange={e => setShowStyleSuggestions(e.target.checked)}
          />
        </label>
        
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium">Demonetization alerts</span>
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-warning"
            checked={showDemonetizationSuggestions}
            onChange={e => setShowDemonetizationSuggestions(e.target.checked)}
          />
        </label>
      </div>

      <h2 className="font-bold mb-2">Suggestions</h2>
      {filteredSuggestions.length === 0 && <p className="text-gray-500">No suggestions yet.</p>}
      <ul className="space-y-2">
        {filteredSuggestions.map(s => (
          <li key={s.id} className={`card shadow-md p-4 text-sm ${getSuggestionCardClass(s.type)}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-xs badge-outline">
                {getSuggestionTypeLabel(s.type)}
              </span>
              {s.type === 'demonetization' && (
                <span className="text-xs">⚠️</span>
              )}
            </div>
            <h3 className="font-semibold">{s.message}</h3>
            {s.alternatives?.length ? (
              <p className="text-xs opacity-90 mt-1">
                {s.type === 'demonetization' 
                  ? "Alternatives will be suggested in the popup" 
                  : `Change to '${s.alternatives[0]}'`
                }
              </p>
            ) : null}
            <div className="flex gap-2 mt-2">
              {s.type === 'demonetization' ? (
                <button 
                  className="btn btn-warning btn-sm" 
                  onClick={() => updateSuggestionStatus(s.id, 'ignored')}
                >
                  Dismiss
                </button>
              ) : (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => acceptSuggestion(s)}>Accept</button>
                  <button className="btn btn-sm" onClick={() => updateSuggestionStatus(s.id, 'ignored')}>Ignore</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
} 