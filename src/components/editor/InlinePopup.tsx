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

  // Calculate optimal popup position
  const getPopupPosition = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const popupWidth = suggestion.type === 'demonetization' || suggestion.type === 'slang-protected' ? 288 : 200 // w-72 = 288px
    const popupHeight = suggestion.type === 'demonetization' || suggestion.type === 'slang-protected' ? 300 : 100 // estimated
    
    let left = rect.left
    let top = rect.bottom + 8
    
    // Adjust horizontal position if popup would go off-screen
    if (left + popupWidth > viewportWidth - 16) {
      left = viewportWidth - popupWidth - 16
    }
    if (left < 16) {
      left = 16
    }
    
    // Adjust vertical position if popup would go off-screen
    if (top + popupHeight > viewportHeight - 16) {
      top = rect.top - popupHeight - 8
    }
    
    return { left, top }
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
    <div className="space-y-3">
      <div className="text-xs text-gray-600 mb-2">
        This slang expression has been recognized and protected from grammar corrections.
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600 text-sm">✅</span>
          <span className="font-medium text-green-800 text-sm">Protected Expression</span>
        </div>
        <div className="text-sm text-green-700">
          "<span className="font-mono bg-green-100 px-1 rounded">{suggestion.text}</span>" is recognized as intentional slang.
        </div>
        <div className="space-y-1 mt-2">
          {suggestion.confidence && (
            <div className="text-xs text-green-600">
              Confidence: {Math.round(suggestion.confidence * 100)}%
            </div>
          )}
          {suggestion.confidenceSource && (
            <div className="text-xs text-green-500">
              Analysis: {suggestion.confidenceSource}
            </div>
          )}
          {suggestion.reasoning && (
            <div className="text-xs text-gray-600 italic">
              "{suggestion.reasoning}"
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        <button
          className="btn btn-sm bg-green-500 hover:bg-green-600 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => updateSuggestionStatus(suggestion.id, 'accepted')}
          disabled={isReplacing}
        >
          Got it
        </button>
      </div>
    </div>
  )

  const position = getPopupPosition()

  return createPortal(
    <div
      className={`inline-popup bg-white border border-gray-200 shadow-xl text-sm rounded-lg p-4 z-[9999] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${suggestion.type === 'demonetization' || suggestion.type === 'slang-protected' ? 'w-80' : 'w-auto'} ${
        isReplacing ? 'pointer-events-none opacity-75' : ''
      }`}
      style={{ 
        position: 'fixed', 
        top: position.top, 
        left: position.left,
        maxWidth: 'calc(100vw - 32px)' // Ensure it doesn't go off screen
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        {suggestion.type === 'demonetization' && (
          <span className="text-orange-500 text-lg mt-0.5">⚠️</span>
        )}
        {suggestion.type === 'slang-protected' && (
          <span className="text-green-500 text-lg mt-0.5">✅</span>
        )}
        <div className="flex-1">
          <div className="font-medium text-gray-800 leading-tight">
            {suggestion.message}
          </div>
          {suggestion.type === 'demonetization' && (
            <div className="text-xs text-gray-500 mt-1">
              Platform-safe alternatives available
            </div>
          )}
          {suggestion.type === 'slang-protected' && (
            <div className="text-xs text-gray-500 mt-1">
              This expression is protected from grammar corrections
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      {isReplacing ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="loading loading-spinner loading-sm text-green-500"></div>
          <span className="text-sm text-gray-600">Applying change...</span>
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
      
      {/* Arrow pointer */}
      <div 
        className="absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45 -translate-y-1/2"
        style={{
          top: position.top > rect.bottom ? '100%' : '-6px',
          left: '24px',
          borderBottomColor: 'transparent',
          borderRightColor: 'transparent'
        }}
      />
    </div>,
    document.body
  )
}

export default InlinePopup 