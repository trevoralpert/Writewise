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

  // Only show pending suggestions (filtering by feature toggles is now handled in useSuggestions)
  const filteredSuggestions = suggestions.filter(s => s.status === 'pending')

  const getSuggestionCardClass = (type: string) => {
    switch (type) {
      case 'style':
        return 'bg-blue-500 text-white'
      case 'demonetization':
        return 'bg-orange-500 text-white'
      case 'grammar':
      case 'spelling':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
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

  const getSuggestionCount = (type: string) => {
    return filteredSuggestions.filter(s => s.type === type).length
  }

  return (
    <aside className="w-72 bg-gray-50 border-l border-gray-200 p-4 space-y-4">
      {/* Summary Section */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Writing Insights</h2>
        <div className="space-y-2 text-sm">
          {getSuggestionCount('demonetization') > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-400 rounded-full"></span>
                Demonetization Risks
              </span>
              <span className="font-medium">{getSuggestionCount('demonetization')}</span>
            </div>
          )}
          {getSuggestionCount('grammar') > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                Grammar Issues
              </span>
              <span className="font-medium">{getSuggestionCount('grammar')}</span>
            </div>
          )}
          {getSuggestionCount('spelling') > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                Spelling Issues
              </span>
              <span className="font-medium">{getSuggestionCount('spelling')}</span>
            </div>
          )}
          {getSuggestionCount('style') > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                Style Suggestions
              </span>
              <span className="font-medium">{getSuggestionCount('style')}</span>
            </div>
          )}
          {filteredSuggestions.length === 0 && (
            <p className="text-gray-500 text-center py-2">All clear! 🎉</p>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Suggestions</h3>
        {filteredSuggestions.length === 0 && (
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-gray-500">No suggestions at the moment.</p>
            <p className="text-xs text-gray-400 mt-1">Keep writing to get AI-powered insights!</p>
          </div>
        )}
        <div className="space-y-2">
          {filteredSuggestions.map(s => (
            <div key={s.id} className={`rounded-lg p-4 text-sm ${getSuggestionCardClass(s.type)}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-20 rounded">
                  {getSuggestionTypeLabel(s.type)}
                </span>
                {s.type === 'demonetization' && (
                  <span className="text-xs">⚠️</span>
                )}
              </div>
              <h4 className="font-medium mb-1">{s.message}</h4>
              {s.alternatives?.length ? (
                <p className="text-xs opacity-90 mb-3">
                  {s.type === 'demonetization' 
                    ? "Hover over the highlighted word for AI-generated alternatives" 
                    : `Suggested: "${s.alternatives[0]}"`
                  }
                </p>
              ) : null}
              <div className="flex gap-2">
                {s.type === 'demonetization' ? (
                  <button 
                    className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors" 
                    onClick={() => updateSuggestionStatus(s.id, 'ignored')}
                  >
                    Dismiss
                  </button>
                ) : (
                  <>
                    <button 
                      className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors" 
                      onClick={() => acceptSuggestion(s)}
                    >
                      Accept
                    </button>
                    <button 
                      className="px-3 py-1 bg-white bg-opacity-10 hover:bg-opacity-20 rounded text-xs font-medium transition-colors" 
                      onClick={() => updateSuggestionStatus(s.id, 'ignored')}
                    >
                      Ignore
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
} 