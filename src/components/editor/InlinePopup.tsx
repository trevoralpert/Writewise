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
               suggestion.type === 'slang-protected' ? '300px' : 'auto',
        backdropFilter: 'blur(8px)',
        background: 'rgba(255, 255, 255, 0.95)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Enhanced Header - Only for non-slang-protected types */}
      {suggestion.type !== 'slang-protected' && (
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