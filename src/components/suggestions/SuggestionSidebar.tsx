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
    
    // For tone-rewrite suggestions, use the rewritten text
    const replacement = s.type === 'tone-rewrite' && s.toneRewrite?.rewrittenText 
      ? s.toneRewrite.rewrittenText 
      : s.alternatives?.[0] || ''
      
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
        return 'bg-blue-500 text-white border-blue-200'
      case 'demonetization':
        return 'bg-amber-500 text-white border-amber-200'
      case 'slang-protected':
        return 'bg-green-500 text-white border-green-200'
      case 'tone-rewrite':
        return 'bg-purple-500 text-white border-purple-200'
      case 'grammar':
      case 'spelling':
        return 'bg-red-500 text-white border-red-200'
      default:
        return 'bg-gray-700 text-white border-gray-200'
    }
  }

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'demonetization':
        return 'Demonetization Risk'
      case 'slang-protected':
        return 'Protected Slang'
      case 'tone-rewrite':
        return 'Tone-Preserving Fix'
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
    <aside className="w-80 xl:w-96 2xl:w-[28rem] bg-white border-l border-blue-100 p-8 space-y-6 rounded-lg shadow-lg min-h-screen">
      {/* Summary Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold text-gray-700 mb-4 font-writing text-lg flex items-center">
          ✨ Writing Insights
        </h2>
        <div className="space-y-3 text-sm font-ui">
          {getSuggestionCount('demonetization') > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-amber-400 rounded-full"></span>
                <span className="text-amber-800 font-medium">Demonetization Risks</span>
              </span>
              <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs">
                {getSuggestionCount('demonetization')}
              </span>
            </div>
          )}
          {getSuggestionCount('grammar') > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                <span className="text-red-800 font-medium">Grammar Issues</span>
              </span>
              <span className="font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs">
                {getSuggestionCount('grammar')}
              </span>
            </div>
          )}
          {getSuggestionCount('spelling') > 0 && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                <span className="text-red-800 font-medium">Spelling Issues</span>
              </span>
              <span className="font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs">
                {getSuggestionCount('spelling')}
              </span>
            </div>
          )}
          {getSuggestionCount('style') > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                <span className="text-blue-800 font-medium">Style Suggestions</span>
              </span>
              <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs">
                {getSuggestionCount('style')}
              </span>
            </div>
          )}
          {getSuggestionCount('slang-protected') > 0 && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                <span className="text-green-800 font-medium">Protected Slang</span>
              </span>
              <span className="font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs">
                {getSuggestionCount('slang-protected')}
              </span>
            </div>
          )}
          {getSuggestionCount('tone-rewrite') > 0 && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
                <span className="text-purple-800 font-medium">Tone-Preserving Fixes</span>
              </span>
              <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full text-xs">
                {getSuggestionCount('tone-rewrite')}
              </span>
            </div>
          )}
          {filteredSuggestions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-blue-600 font-medium font-ui">All clear!</p>
              <p className="text-blue-500 text-xs mt-1 font-ui">Keep writing to get AI-powered insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700 font-writing text-lg flex items-center">
          💡 Suggestions
        </h3>
        {filteredSuggestions.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-blue-600 font-medium font-ui">No suggestions at the moment</p>
            <p className="text-xs text-blue-500 mt-2 font-ui">Keep writing to get AI-powered insights!</p>
          </div>
        )}
        <div className="space-y-3">
          {filteredSuggestions.map(s => (
            <div key={s.id} className={`rounded-lg p-5 text-sm font-ui shadow-lg border ${getSuggestionCardClass(s.type)}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold px-3 py-1 bg-white bg-opacity-90 text-gray-800 rounded-full">
                  {getSuggestionTypeLabel(s.type)}
                </span>
                {s.type === 'demonetization' && (
                  <span className="text-lg">⚠️</span>
                )}
                {s.type === 'slang-protected' && (
                  <span className="text-lg">✅</span>
                )}
                {s.type === 'tone-rewrite' && (
                  <span className="text-lg">🎨</span>
                )}
              </div>
              <h4 className="font-semibold mb-2 text-base">{s.message}</h4>
              {(s.alternatives?.length || s.toneRewrite?.rewrittenText) ? (
                <p className="text-sm opacity-90 mb-4 bg-white bg-opacity-20 p-3 rounded-lg">
                  {s.type === 'demonetization' 
                    ? "💡 Hover over the highlighted word for AI-generated alternatives"
                    : s.type === 'tone-rewrite'
                    ? `🎨 Tone-preserving fix: "${s.toneRewrite?.rewrittenText}"`
                    : `✨ Suggested: "${s.alternatives?.[0]}"`
                  }
                </p>
              ) : null}
              <div className="flex gap-3">
                {s.type === 'demonetization' ? (
                  <button 
                    className="px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all duration-200 text-gray-800 shadow-lg hover:shadow-xl" 
                    onClick={() => updateSuggestionStatus(s.id, 'ignored')}
                  >
                    Dismiss
                  </button>
                ) : s.type === 'slang-protected' ? (
                  <button 
                    className="px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all duration-200 text-gray-800 shadow-lg hover:shadow-xl" 
                    onClick={() => updateSuggestionStatus(s.id, 'accepted')}
                  >
                    Got it
                  </button>
                ) : (
                  <>
                    <button 
                      className="px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg text-sm font-medium transition-all duration-200 text-gray-800 shadow-lg hover:shadow-xl" 
                      onClick={() => acceptSuggestion(s)}
                    >
                      Accept
                    </button>
                    <button 
                      className="px-4 py-2 bg-white bg-opacity-60 hover:bg-opacity-80 rounded-lg text-sm font-medium transition-all duration-200 text-gray-700" 
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