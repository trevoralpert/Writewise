import React, { useState, useEffect } from 'react'
import { useEditorStore } from '../../store/editorStore'

interface WritingAnalytics {
  session: {
    id: string
    duration: number
    wordCount: number
    charCount: number
    improvementRate: number
    suggestionsProcessed: number
    suggestionsAccepted: number
  }
  writingQuality: {
    readabilityScore: number
    readabilityLevel: string
    sentenceVariety: number
    vocabularyRichness: number
    avgSentenceLength: number
    toneConsistency: number
  }
  improvements: any[]
  suggestionBreakdown: Array<{
    type: string
    count: number
    percentage: number
  }>
}

interface AnalyticsDashboardProps {
  sessionId?: string
  analytics?: WritingAnalytics
}

export default function AnalyticsDashboard({ sessionId, analytics: propAnalytics }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<WritingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'suggestions' | 'export'>('overview')

  const content = useEditorStore(s => s.content)

  useEffect(() => {
    // FIXED: Always try to fetch backend analytics first if we have a sessionId
    // Only fall back to propAnalytics if backend fetch fails
    if (sessionId) {
      fetchAnalytics()
    } else if (propAnalytics) {
      // Use prop analytics as fallback when no sessionId
      setAnalytics(propAnalytics)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [sessionId, propAnalytics])

  const fetchAnalytics = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const apiUrl = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/analytics/${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setAnalytics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      
      // FIXED: Fall back to prop analytics if backend fetch fails
      if (propAnalytics) {
        setAnalytics(propAnalytics)
        setError(null) // Clear error since we have fallback data
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (format: 'json' | 'markdown' | 'html' | 'csv') => {
    if (!sessionId) return

    try {
      const apiUrl = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/export/${sessionId}/${format}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `writing-report-${sessionId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-forest-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-coral-600'
  }

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-forest-50 border-forest-100'
    if (score >= 60) return 'bg-amber-50 border-amber-100'
    return 'bg-coral-50 border-coral-100'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2">Local Analytics Available</h3>
            <p className="text-sm text-yellow-700">
              Showing basic analytics based on current session data while server analytics are unavailable.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-2 rounded">
                <div className="font-medium text-gray-900">{content.split(/\s+/).filter(w => w.length > 0).length}</div>
                <div className="text-gray-600">Words</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="font-medium text-gray-900">{content.length}</div>
                <div className="text-gray-600">Characters</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-gray-500">
          <p>No analytics data available</p>
          <p className="text-sm">Start writing to see your analytics!</p>
          
          {content && content.trim().length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Current Session</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded">
                  <div className="font-medium text-gray-900">{content.split(/\s+/).filter(w => w.length > 0).length}</div>
                  <div className="text-gray-600">Words</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="font-medium text-gray-900">{content.length}</div>
                  <div className="text-gray-600">Characters</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card-warm shadow-warm-lg border border-forest-100">
      {/* Header */}
              <div className="border-b border-forest-100 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-700 font-writing flex items-center">
              📊 Writing Analytics
            </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Session: {analytics.session.id.slice(-8)}</span>
            <button
              onClick={fetchAnalytics}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Refresh analytics"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'quality', label: 'Quality', icon: '⭐' },
            { id: 'suggestions', label: 'Suggestions', icon: '💡' },
            { id: 'export', label: 'Export', icon: '📥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors font-ui ${
                activeTab === tab.id
                  ? 'bg-forest-100 text-forest-700 shadow-warm'
                  : 'text-forest-600 hover:text-forest-800 hover:bg-forest-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-forest-50 rounded-creative p-6 border border-forest-100 shadow-warm">
              <div className="text-2xl font-bold text-forest-700 font-writing">{analytics.session.wordCount}</div>
              <div className="text-sm text-forest-600 font-ui">Words</div>
            </div>
            
            <div className="bg-coral-50 rounded-creative p-6 border border-coral-100 shadow-warm">
              <div className="text-2xl font-bold text-coral-700 font-writing">{analytics.session.improvementRate}%</div>
              <div className="text-sm text-coral-600 font-ui">Improvement Rate</div>
            </div>
            
            <div className="bg-purple-50 rounded-creative p-6 border border-purple-100 shadow-warm">
              <div className="text-2xl font-bold text-purple-700 font-writing">{analytics.session.suggestionsProcessed}</div>
              <div className="text-sm text-purple-600 font-ui">Suggestions</div>
            </div>
            
            <div className="bg-amber-50 rounded-creative p-6 border border-amber-100 shadow-warm">
              <div className="text-2xl font-bold text-amber-700 font-writing">{Math.round(analytics.session.duration / 60000)}m</div>
              <div className="text-sm text-amber-600 font-ui">Time Spent</div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="space-y-6">
            {/* Readability Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Readability Score</h3>
                <span className={`text-2xl font-bold ${getScoreColor(analytics.writingQuality.readabilityScore)}`}>
                  {analytics.writingQuality.readabilityScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    analytics.writingQuality.readabilityScore >= 80 ? 'bg-green-500' :
                    analytics.writingQuality.readabilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${analytics.writingQuality.readabilityScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{analytics.writingQuality.readabilityLevel}</p>
            </div>

            {/* Other Quality Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-lg p-4 ${getScoreBackground(analytics.writingQuality.sentenceVariety)}`}>
                <div className={`text-lg font-bold ${getScoreColor(analytics.writingQuality.sentenceVariety)}`}>
                  {analytics.writingQuality.sentenceVariety}%
                </div>
                <div className="text-sm text-gray-700">Sentence Variety</div>
              </div>
              
              <div className={`rounded-lg p-4 ${getScoreBackground(analytics.writingQuality.vocabularyRichness)}`}>
                <div className={`text-lg font-bold ${getScoreColor(analytics.writingQuality.vocabularyRichness)}`}>
                  {analytics.writingQuality.vocabularyRichness}%
                </div>
                <div className="text-sm text-gray-700">Vocabulary Richness</div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-lg font-bold text-gray-700">
                  {analytics.writingQuality.avgSentenceLength}
                </div>
                <div className="text-sm text-gray-700">Avg Sentence Length</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Suggestion Breakdown</h3>
            <div className="space-y-3">
              {analytics.suggestionBreakdown.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === 'demonetization' ? 'bg-orange-400' :
                      item.type === 'grammar' ? 'bg-red-400' :
                      item.type === 'spelling' ? 'bg-red-400' :
                      item.type === 'style' ? 'bg-blue-400' :
                      item.type === 'slang-protected' ? 'bg-green-400' :
                      item.type === 'tone-rewrite' ? 'bg-purple-400' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium capitalize">{item.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Export Analytics Report</h3>
            <p className="text-sm text-gray-600">
              Download your writing analytics in various formats for sharing or archiving.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { format: 'json', label: 'JSON', icon: '📄', description: 'Raw data format' },
                { format: 'markdown', label: 'Markdown', icon: '📝', description: 'For documentation' },
                { format: 'html', label: 'HTML', icon: '🌐', description: 'Web viewable' },
                { format: 'csv', label: 'CSV', icon: '📊', description: 'Spreadsheet data' }
              ].map((export_option) => (
                <button
                  key={export_option.format}
                  onClick={() => downloadReport(export_option.format as any)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">{export_option.icon}</div>
                  <div className="font-medium text-gray-900">{export_option.label}</div>
                  <div className="text-xs text-gray-500">{export_option.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 