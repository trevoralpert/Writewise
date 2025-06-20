import React from 'react'
import { useEditorStore } from '../../store/editorStore'
import AnalyticsDashboard from './AnalyticsDashboard'

export default function AnalyticsPage() {
  const currentSessionId = useEditorStore(s => s.currentSessionId)
  const analytics = useEditorStore(s => s.analytics)
  const currentDocument = useEditorStore(s => s.currentDocument)

  return (
    <div className="bg-white rounded-lg border p-6 mx-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Writing Analytics</h1>
        <p className="text-gray-600">
          Track your writing progress, quality metrics, and improvement over time.
        </p>
        
        {currentDocument && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-1">Current Document</h2>
            <p className="text-blue-700 text-sm">
              Analyzing: <span className="font-medium">{currentDocument.title}</span>
            </p>
            {currentSessionId && (
              <p className="text-blue-600 text-xs mt-1">
                Session ID: {currentSessionId.slice(-8)}
              </p>
            )}
          </div>
        )}
      </div>

      {currentSessionId || analytics ? (
        <AnalyticsDashboard 
          sessionId={currentSessionId || undefined}
          analytics={analytics}
        />
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-600 mb-4">
            Start writing in a document to see your analytics dashboard with:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-medium text-gray-900">Writing Quality</div>
              <div className="text-sm text-gray-600">Readability, variety, richness</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">💡</div>
              <div className="font-medium text-gray-900">Suggestions</div>
              <div className="text-sm text-gray-600">Grammar, style, tone fixes</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="font-medium text-gray-900">Progress</div>
              <div className="text-sm text-gray-600">Time, words, improvements</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">📥</div>
              <div className="font-medium text-gray-900">Export</div>
              <div className="text-sm text-gray-600">Reports in multiple formats</div>
            </div>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Editor
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 