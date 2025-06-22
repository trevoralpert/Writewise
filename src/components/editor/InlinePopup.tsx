import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../../store/editorStore'

type Props = {
  rect: DOMRect
  suggestion: any
  onClose: () => void
}

const InlinePopup: React.FC<Props> = ({ rect, suggestion, onClose }) => {
  const { setContent, content, updateSuggestionStatus } = useEditorStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Check if this is a multi-layer suggestion
  const isMultiLayer = suggestion._multiLayer
  const allSuggestions = suggestion._allSuggestions || [suggestion]

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const acceptAlternative = async (replacement: string) => {
    setIsReplacing(true)
    
    // Add a brief delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 150))
    
    const newContent = content.slice(0, suggestion.start) + replacement + content.slice(suggestion.end)
    setContent(newContent)
    updateSuggestionStatus(suggestion.id, 'accepted')
    onClose()
  }

  const ignore = () => {
    updateSuggestionStatus(suggestion.id, 'ignored')
    onClose()
  }

  // Handle mouse enter/leave for the popup
  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    // Let the Editor component handle closing with its delay logic
  }

  // Calculate optimal popup position with enhanced logic
  const getPopupPosition = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Dynamic popup sizing based on content
    let popupWidth = 200 // default
    let popupHeight = 120 // default
    
    if (suggestion.type === 'demonetization') {
      popupWidth = 320
      popupHeight = 350
    } else if (suggestion.type === 'slang-protected') {
      popupWidth = suggestion.aiAnalysis ? 380 : 300 // Larger for AI analysis
      popupHeight = suggestion.aiAnalysis ? 450 : 250
    } else if (suggestion.type === 'engagement') {
      popupWidth = 350
      popupHeight = 300
    } else if (suggestion.type === 'platform-adaptation') {
      popupWidth = 380
      popupHeight = 350
    } else if (suggestion.type === 'seo') {
      popupWidth = 400
      popupHeight = 380
    } else if (suggestion.type === 'tone-rewrite') {
      popupWidth = 400
      popupHeight = 380
    }
    
    let left = rect.left
    let top = rect.bottom + 12 // More spacing for better visual
    
    // Smart horizontal positioning
    if (left + popupWidth > viewportWidth - 20) {
      left = Math.max(20, viewportWidth - popupWidth - 20)
    }
    if (left < 20) {
      left = 20
    }
    
    // Smart vertical positioning with preference for below
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    if (spaceBelow < popupHeight + 20 && spaceAbove > popupHeight + 20) {
      // Show above if more space available
      top = rect.top - popupHeight - 12
    } else if (spaceBelow < popupHeight + 20) {
      // Constrain height if necessary
      top = Math.max(20, viewportHeight - popupHeight - 20)
    }
    
    return { 
      left, 
      top, 
      isAbove: top < rect.top,
      constrainedHeight: Math.min(popupHeight, viewportHeight - 40)
    }
  }

  const renderLoadingState = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="loading loading-spinner loading-xs text-orange-500"></div>
        <div className="text-xs text-gray-600">Generating alternatives...</div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
        <button className="btn btn-xs btn-ghost" onClick={ignore}>
          Dismiss
        </button>
      </div>
    </div>
  )

  const renderSlangAnalysisLoading = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="popup-header">
        <div className="popup-title flex items-center gap-2">
          <span className="text-blue-600 text-lg">🧠</span>
          <span className="text-blue-800">Analyzing Slang</span>
        </div>
        <div className="ai-analysis-loading">
          AI Working...
        </div>
      </div>
      
      {/* Loading content */}
      <div className="space-y-3">
        <div className="text-sm text-gray-700">
          Analyzing "<span className="font-mono bg-blue-100 px-2 py-1 rounded font-semibold text-blue-800">{suggestion.text}</span>" for context and intent...
        </div>
        
        {/* Animated loading bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">Context:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">Intent:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded animate-pulse" style={{width: '80%'}}></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20">Audience:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded animate-pulse" style={{width: '45%'}}></div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-center text-gray-500 italic">
          This may take a few seconds...
        </div>
      </div>
    </div>
  )

  const renderErrorState = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-red-600">
        <span>⚠️</span>
        <div className="text-xs">Failed to generate alternatives</div>
      </div>
      <div className="text-xs text-gray-500">
        This word may still cause demonetization issues.
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
        <button className="btn btn-xs btn-ghost" onClick={ignore}>
          Dismiss
        </button>
      </div>
    </div>
  )

  const renderDemonetizationButtons = () => {
    if (!suggestion.alternatives) {
      return renderLoadingState()
    }
    
    if (suggestion.alternatives.length < 3) {
      return renderErrorState()
    }

    const [industryStandard, conservative, creative] = suggestion.alternatives
    
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Choose an alternative:</div>
        
        <div className="space-y-2">
          <button
            className="btn btn-sm w-full text-left justify-start bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => acceptAlternative(industryStandard)}
            disabled={isReplacing}
          >
            <div className="flex flex-col items-start w-full">
              <span className="font-medium text-xs flex items-center gap-1">
                🔥 Industry Standard
              </span>
              <span className="text-sm font-mono bg-orange-100 px-1 rounded text-orange-900">
                "{industryStandard}"
              </span>
            </div>
          </button>
          
          <button
            className="btn btn-sm w-full text-left justify-start bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => acceptAlternative(conservative)}
            disabled={isReplacing}
          >
            <div className="flex flex-col items-start w-full">
              <span className="font-medium text-xs flex items-center gap-1">
                🛡️ Conservative
              </span>
              <span className="text-sm font-mono bg-blue-100 px-1 rounded text-blue-900">
                "{conservative}"
              </span>
            </div>
          </button>
          
          <button
            className="btn btn-sm w-full text-left justify-start bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => acceptAlternative(creative)}
            disabled={isReplacing}
          >
            <div className="flex flex-col items-start w-full">
              <span className="font-medium text-xs flex items-center gap-1">
                ✨ Creative
              </span>
              <span className="text-sm font-mono bg-purple-100 px-1 rounded text-purple-900">
                "{creative}"
              </span>
            </div>
          </button>
        </div>
        
        <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
          <button 
            className="btn btn-xs btn-ghost hover:bg-gray-100 transition-colors" 
            onClick={ignore}
            disabled={isReplacing}
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  const renderRegularButtons = () => (
    <div className="flex gap-2 justify-end">
      <button 
        className="btn btn-success btn-xs hover:scale-105 transition-transform" 
        onClick={() => acceptAlternative(suggestion.alternatives?.[0] || '')}
        disabled={isReplacing}
      >
        Accept
      </button>
      <button 
        className="btn btn-xs hover:scale-105 transition-transform" 
        onClick={ignore}
        disabled={isReplacing}
      >
        Ignore
      </button>
    </div>
  )

  const renderToneRewriteButtons = () => (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="popup-header">
        <div className="popup-title flex items-center gap-2">
          <span className="text-purple-600 text-lg">🎨</span>
          <span className="text-purple-800">Tone-Preserving Fix</span>
        </div>
        <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium border border-purple-200">
          AI Enhanced
        </div>
      </div>
      
      {/* Original vs Rewrite Comparison */}
      <div className="space-y-3">
        <div className="text-sm text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600">ORIGINAL:</span>
          </div>
          <div className="font-mono tone-comparison-original px-3 py-2 rounded-md text-sm">
            "{suggestion.toneRewrite?.originalText || suggestion.text}"
          </div>
        </div>
        
        <div className="text-sm text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600">TONE-PRESERVING FIX:</span>
          </div>
          <div className="font-mono tone-comparison-rewrite px-3 py-2 rounded-md text-sm font-medium">
            "{suggestion.toneRewrite?.rewrittenText || suggestion.alternatives?.[0]}"
          </div>
        </div>
      </div>

      {/* Tone Analysis Info */}
      {suggestion.originalTone && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-700">🎯 DETECTED TONE:</span>
            <span className="tone-detection-badge">
              {suggestion.originalTone}
            </span>
          </div>
          {suggestion.toneRewrite?.reasoning && (
            <div className="text-xs text-gray-700 leading-relaxed">
              {suggestion.toneRewrite.reasoning}
            </div>
          )}
        </div>
      )}

      {/* Confidence and Metadata */}
      <div className="flex items-center justify-between">
        {suggestion.toneRewrite?.confidenceScore && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">Tone Preserved:</span>
            <div className="confidence-bar w-16">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${suggestion.toneRewrite.confidenceScore * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-purple-600">
              {Math.round(suggestion.toneRewrite.confidenceScore * 100)}%
            </span>
          </div>
        )}
        
        {suggestion.toneRewrite?.tonePreserved && (
          <div className="flex items-center gap-1">
            <span className="text-green-500 text-sm">✓</span>
            <span className="text-xs text-green-700 font-medium">Voice Maintained</span>
          </div>
        )}
      </div>

      {/* Enhanced Metadata */}
      {suggestion.enhancedMetadata && (
        <div className="text-xs space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
              Strategy: {suggestion.enhancedMetadata.resolutionStrategy?.replace(/-/g, ' ') || 'AI Resolution'}
            </div>
            {suggestion.enhancedMetadata.originalIssueType && (
              <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                Fixed: {suggestion.enhancedMetadata.originalIssueType}
              </div>
            )}
            {suggestion.enhancedMetadata.toneConfidence && (
              <div className="bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                Tone Confidence: {Math.round(suggestion.enhancedMetadata.toneConfidence * 100)}%
              </div>
            )}
          </div>
          
          {suggestion.enhancedMetadata.slangProtected && (
            <div className="text-gray-600 bg-gray-50 p-2 rounded border">
              <span className="font-medium">Protected slang:</span> "{suggestion.enhancedMetadata.slangProtected}"
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-2 border-t border-gray-200">
        <button 
          className="btn-enhanced px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center gap-2 font-medium"
          onClick={() => acceptAlternative(suggestion.toneRewrite?.rewrittenText || suggestion.alternatives?.[0] || '')}
          disabled={isReplacing}
        >
          <span>Accept Fix</span>
          <span className="text-purple-200 text-lg">🎨</span>
        </button>
        <button 
          className="btn btn-xs btn-ghost hover:bg-gray-100 transition-colors" 
          onClick={ignore}
          disabled={isReplacing}
        >
          Keep Original
        </button>
      </div>
    </div>
  )

  const renderSlangProtectedButtons = () => (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="popup-header">
        <div className="popup-title flex items-center gap-2">
          <span className="text-green-600 text-lg">🛡️</span>
          <span className="text-green-800">Slang Protected</span>
        </div>
        <div className="slang-protection-badge badge-pulse">
          <span className="gradient-text">AI ✓</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="text-sm text-gray-700 leading-relaxed">
        "<span className="font-mono bg-green-100 px-2 py-1 rounded-md font-semibold text-green-800 border border-green-200">{suggestion.text}</span>" is recognized as intentional slang.
      </div>

      {/* Confidence Indicator */}
      {suggestion.confidence && (
        <div className="confidence-indicator">
          <span className="text-xs text-gray-600 font-medium">Confidence:</span>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ width: `${suggestion.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-green-600">
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </div>
      )}

      {/* Analysis Source Tags */}
      {suggestion.confidenceSource && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium">
            {suggestion.confidenceSource === 'AI + Rules' ? '🤖 AI Enhanced' : '📋 Rule-based'}
          </div>
          {suggestion.aiAnalysis && (
            <div className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 font-medium">
              ✨ Context-Aware
            </div>
          )}
        </div>
      )}

      {/* AI Reasoning Section */}
      {suggestion.reasoning && (
        <div className="popup-ai-reasoning">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-600">🧠 AI Analysis:</span>
          </div>
          <div className="text-xs leading-relaxed">
            "{suggestion.reasoning}"
          </div>
        </div>
      )}

      {/* Detailed AI Analysis */}
      {suggestion.aiAnalysis && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>🔍</span>
            <span>Detailed Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-600 font-medium">Intentional:</span>
              </div>
              <span className="font-bold text-green-600">
                {suggestion.aiAnalysis.isIntentional ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-gray-600 font-medium">Audience:</span>
              </div>
              <span className="font-bold text-blue-600">
                {suggestion.aiAnalysis.audienceMatch ? 'Match' : 'Mismatch'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="text-gray-600 font-medium">AI Confidence:</span>
              </div>
              <span className="font-bold text-purple-600">
                {Math.round((suggestion.aiAnalysis.confidence || 0) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-gray-600 font-medium">Protected:</span>
              </div>
              <span className="font-bold text-orange-600">
                {suggestion.aiAnalysis.shouldProtect ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <button
          className="btn-enhanced px-6 py-2 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center gap-2 font-medium relative z-10"
          onClick={() => updateSuggestionStatus(suggestion.id, 'accepted')}
          disabled={isReplacing}
        >
          <span>Got it</span>
          <span className="text-green-200 text-lg">✓</span>
        </button>
      </div>
    </div>
  )

  const renderPlatformAdaptationButtons = () => (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="popup-header">
        <div className="popup-title flex items-center gap-2">
          <span className="text-green-600 text-lg">📱</span>
          <span className="text-green-800">Platform Optimization</span>
        </div>
        <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 font-medium">
          {suggestion.platformName || 'Multi-Platform'}
        </div>
      </div>
      
      {/* Platform Score */}
      {suggestion.platformScore !== undefined && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">Platform Score:</span>
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-bold ${
                suggestion.platformScore >= 7 ? 'text-green-700' : 
                suggestion.platformScore >= 4 ? 'text-yellow-600' : 'text-red-600'
              }`}>{suggestion.platformScore}</span>
              <span className="text-sm text-green-600">/10</span>
            </div>
          </div>
          <div className="flex-1 bg-green-200 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                suggestion.platformScore >= 7 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                suggestion.platformScore >= 4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{ width: `${(suggestion.platformScore || 0) * 10}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="text-sm text-gray-700 leading-relaxed">
        "<span className="font-mono bg-green-100 px-2 py-1 rounded-md font-semibold text-green-800 border border-green-200">{suggestion.text}</span>" can be optimized for {suggestion.platformName || 'this platform'}.
      </div>

      {/* Platform Category Badge */}
      {suggestion.platformCategory && (
        <div className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="capitalize">{suggestion.platformCategory}</span>
        </div>
      )}

      {/* Recommendation Details */}
      {suggestion.recommendation && (
        <div className="popup-ai-reasoning">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-green-600">💡 Platform Insight:</span>
          </div>
          <div className="text-xs leading-relaxed">
            {suggestion.recommendation.description}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Platform-optimized alternatives:</div>
          {suggestion.alternatives.map((alternative: string, index: number) => (
            <button
              key={index}
              className="btn btn-sm w-full text-left justify-start bg-green-50 hover:bg-green-100 text-green-800 border-green-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              onClick={() => acceptAlternative(alternative)}
              disabled={isReplacing}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-green-500">📱</span>
                <span className="flex-1 text-sm font-medium">{alternative}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <button
          className="btn btn-sm btn-ghost text-gray-600 hover:text-gray-800"
          onClick={ignore}
          disabled={isReplacing}
        >
          Skip
        </button>
      </div>
    </div>
  )

  const renderSeoButtons = () => (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="popup-header">
        <div className="popup-title flex items-center gap-2">
          <span className="text-purple-600 text-lg">🔍</span>
          <span className="text-purple-800">SEO Optimization</span>
        </div>
        <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200 font-medium">
          {suggestion.seoCategory || 'General'}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="text-sm text-gray-700 leading-relaxed">
        "<span className="font-mono bg-purple-100 px-2 py-1 rounded-md font-semibold text-purple-800 border border-purple-200">{suggestion.text}</span>" can be optimized for better search visibility.
      </div>

      {/* SEO Type Badge */}
      {suggestion.seoType && (
        <div className="text-xs bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 px-3 py-2 rounded-lg border border-purple-200 font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          <span className="capitalize">{suggestion.seoType}</span>
        </div>
      )}

      {/* SEO Score */}
      {suggestion.seoScore && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700">SEO Impact Score</span>
            <span className="text-xs font-bold text-purple-800">{suggestion.seoScore}/10</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(suggestion.seoScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* AI Reasoning Section */}
      {suggestion.reasoning && (
        <div className="popup-ai-reasoning">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-purple-600">💡 SEO Insight:</span>
          </div>
          <div className="text-xs leading-relaxed">
            {suggestion.reasoning}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">SEO-optimized alternatives:</div>
          {suggestion.alternatives.map((alternative: string, index: number) => (
            <button
              key={index}
              className="btn btn-sm w-full text-left justify-start bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              onClick={() => acceptAlternative(alternative)}
              disabled={isReplacing}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-purple-500">🔍</span>
                <span className="flex-1 text-sm font-medium">{alternative}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <button
          className="btn btn-sm btn-ghost text-gray-600 hover:text-gray-800"
          onClick={ignore}
          disabled={isReplacing}
        >
          Skip
        </button>
      </div>
    </div>
  )

  const renderEngagementButtons = () => (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="popup-header">
        <div className="popup-title flex items-center gap-2">
          <span className="text-pink-600 text-lg">🎯</span>
          <span className="text-pink-800">Engagement Boost</span>
        </div>
        <div className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full border border-pink-200 font-medium">
          {suggestion.engagementCategory || 'General'}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="text-sm text-gray-700 leading-relaxed">
        "<span className="font-mono bg-pink-100 px-2 py-1 rounded-md font-semibold text-pink-800 border border-pink-200">{suggestion.text}</span>" could be more engaging.
      </div>

      {/* Engagement Type Badge */}
      {suggestion.engagementType && (
        <div className="text-xs bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 px-3 py-2 rounded-lg border border-pink-200 font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
          <span className="capitalize">{suggestion.engagementType}</span>
        </div>
      )}

      {/* AI Reasoning Section */}
      {suggestion.reasoning && (
        <div className="popup-ai-reasoning">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-pink-600">💡 Why this helps:</span>
          </div>
          <div className="text-xs leading-relaxed">
            {suggestion.reasoning}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Choose an engaging alternative:</div>
          {suggestion.alternatives.map((alternative: string, index: number) => (
            <button
              key={index}
              className="btn btn-sm w-full text-left justify-start bg-pink-50 hover:bg-pink-100 text-pink-800 border-pink-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
              onClick={() => acceptAlternative(alternative)}
              disabled={isReplacing}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-pink-500">✨</span>
                <span className="flex-1 text-sm font-medium">{alternative}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <button
          className="btn btn-sm btn-ghost text-gray-600 hover:text-gray-800"
          onClick={ignore}
          disabled={isReplacing}
        >
          Skip
        </button>
      </div>
    </div>
  )

  const position = getPopupPosition()

  return createPortal(
    <div
      className={`inline-popup bg-white border border-gray-200 shadow-2xl text-sm rounded-xl p-5 z-[9999] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
      } ${
        isReplacing ? 'pointer-events-none opacity-75' : ''
      }`}
      style={{ 
        position: 'fixed', 
        top: position.top, 
        left: position.left,
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: position.constrainedHeight ? `${position.constrainedHeight}px` : 'none',
        overflowY: position.constrainedHeight ? 'auto' : 'visible',
        width: suggestion.type === 'slang-protected' && suggestion.aiAnalysis ? '380px' : 
               suggestion.type === 'demonetization' ? '320px' : 
               suggestion.type === 'slang-protected' ? '300px' :
               suggestion.type === 'engagement' ? '350px' :
               suggestion.type === 'platform-adaptation' ? '380px' :
               suggestion.type === 'seo' ? '400px' :
               suggestion.type === 'tone-rewrite' ? '400px' : 'auto',
        backdropFilter: 'blur(8px)',
        background: 'rgba(255, 255, 255, 0.95)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Multi-layer Header */}
      {isMultiLayer && allSuggestions.length > 1 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-sm">🔄</span>
            <span className="text-sm font-semibold text-blue-800">Multiple Issues Found</span>
          </div>
                     <div className="flex flex-wrap gap-1">
             {allSuggestions.map((sugg: any, index: number) => (
               <span
                 key={sugg.id}
                 className={`text-xs px-2 py-1 rounded-full border font-medium ${
                   sugg.id === suggestion.id
                     ? 'bg-blue-100 text-blue-800 border-blue-300'
                     : 'bg-gray-100 text-gray-600 border-gray-300'
                 }`}
               >
                 {sugg.type.charAt(0).toUpperCase() + sugg.type.slice(1)}
               </span>
             ))}
          </div>
          <div className="text-xs text-blue-700 mt-2">
            Showing: <strong>{suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}</strong> (highest priority)
          </div>
        </div>
      )}

      {/* Enhanced Header - Only for non-slang-protected, non-tone-rewrite, non-engagement, and non-seo types */}
      {suggestion.type !== 'slang-protected' && !suggestion.toneRewrite && suggestion.type !== 'engagement' && suggestion.type !== 'seo' && (
        <div className="flex items-start gap-3 mb-4">
          {suggestion.type === 'demonetization' && (
            <span className="text-orange-500 text-xl mt-0.5 drop-shadow-sm">⚠️</span>
          )}
          <div className="flex-1">
            <div className="font-semibold text-gray-800 leading-tight text-base">
              {suggestion.message}
            </div>
            {suggestion.type === 'demonetization' && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-orange-400 rounded-full"></span>
                Platform-safe alternatives available
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      {isReplacing ? (
        <div className="flex items-center gap-3 py-6 justify-center">
          <div className="ai-analysis-loading">
            Applying change...
          </div>
        </div>
      ) : (
        <>
          {suggestion.type === 'demonetization' 
            ? renderDemonetizationButtons() 
            : suggestion.type === 'slang-protected'
            ? renderSlangProtectedButtons()
            : suggestion.type === 'engagement'
            ? renderEngagementButtons()
            : suggestion.type === 'platform-adaptation'
            ? renderPlatformAdaptationButtons()
            : suggestion.type === 'seo'
            ? renderSeoButtons()
            : suggestion.type === 'tone-rewrite'
            ? renderToneRewriteButtons()
            : renderRegularButtons()
          }
        </>
      )}
      
      {/* Enhanced Arrow pointer with dynamic positioning */}
      <div 
        className={`absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45 shadow-sm ${
          position.isAbove ? 'top-full -translate-y-1/2' : '-top-1.5 translate-y-1/2'
        }`}
        style={{
          left: Math.min(24, Math.max(12, rect.left - position.left + rect.width / 2 - 6)),
          borderBottomColor: 'transparent',
          borderRightColor: 'transparent',
          ...(position.isAbove && {
            transform: 'rotate(225deg)',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            borderBottomColor: '#e5e7eb',
            borderRightColor: '#e5e7eb'
          })
        }}
      />
    </div>,
    document.body
  )
}

export default InlinePopup 