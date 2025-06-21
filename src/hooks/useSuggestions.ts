import { useCallback, useRef, useState, useMemo } from 'react'
import { useEditorStore } from '../store/editorStore'

interface Suggestion {
  id: string
  text: string
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization' | 'slang-protected' | 'tone-rewrite' | 'engagement' | 'platform-adaptation' | 'seo'
  alternatives: string[]
  start: number
  end: number
  status: 'pending' | 'accepted' | 'ignored'
  
  // New properties for tone-preserving rewrites
  priority?: number
  conflictsWith?: string[]
  originalTone?: string
  toneRewrite?: {
    originalText: string
    rewrittenText: string
    tonePreserved: boolean
    confidenceScore: number
    reasoning: string
  }
  
  // New properties for engagement suggestions
  engagementCategory?: string
  engagementType?: string
  
  // New properties for platform adaptation suggestions
  platformId?: string
  platformName?: string
  platformCategory?: string
  platformScore?: number
  userTip?: string
}

export function useSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    content, 
    setAllSuggestionsAndFilter, 
    refilterSuggestions,
    setWritingInsights, 
    setCurrentSessionId, 
    setAnalytics,
    currentSessionId,
    
    // Feature settings
    demonetizationEnabled,
    grammarEnabled,
    styleEnabled,
    contextAwareGrammarEnabled,
    tonePreservingEnabled,
    engagementEnabled,
    platformAdaptationEnabled,
    selectedPlatform,
    conflictResolutionMode,
    toneDetectionSensitivity,
    formalityLevel,
    
    // SEO settings
    seoOptimizationEnabled,
    seoContentType,
    seoPrimaryKeyword,
    seoSecondaryKeywords,
    seoTargetAudience,
    
    // Phase 3: Advanced SEO Features
    seoTemplateEnabled,
    seoSelectedTemplate,
    seoMetaOptimization,
    seoKeywordResearch,
    seoCompetitorAnalysis,
    seoAnalyticsDashboard,
    seoMetaTitle,
    seoMetaDescription,
    seoFocusKeyphrase,
    seoLSIKeywords,
    seoReadabilityTarget,
    seoInternalLinking,
    seoSchemaMarkup,
    setSeoContentScore,
    setSeoLSIKeywords,
    
    // Phase 4: Enterprise SEO Features
    seoCompetitorTracking,
    seoCompetitorUrls,
    seoContentGapAnalysis,
    seoTechnicalSEO,
    seoLocalSEO,
    seoLocalBusiness,
    seoLocalLocation,
    seoMultilingual,
    seoTargetLanguages,
    seoAdvancedSchema,
    seoSchemaTypes,
    seoContentClusters,
    seoTopicAuthority,
    seoE_A_T_Optimization,
    seoFeaturedSnippets,
    seoVoiceSearch,
    seoMobileFirst,
    seoPageSpeed,
    seoCoreWebVitals
  } = useEditorStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoize the request body to prevent unnecessary re-renders
  const requestBody = useMemo(() => ({
    // Feature settings
    demonetizationEnabled,
    grammarEnabled,
    styleEnabled,
    contextAwareGrammarEnabled,
    tonePreservingEnabled,
    engagementEnabled,
    platformAdaptationEnabled,
    selectedPlatform,
    conflictResolutionMode,
    toneDetectionSensitivity,
    formalityLevel,
    
    // SEO settings
    seoOptimizationEnabled,
    contentType: seoContentType,
    primaryKeyword: seoPrimaryKeyword,
    secondaryKeywords: seoSecondaryKeywords,
    targetAudience: seoTargetAudience,
    
    // Phase 3: Advanced SEO Features
    seoTemplateEnabled,
    seoSelectedTemplate,
    seoMetaOptimization,
    seoKeywordResearch,
    seoCompetitorAnalysis,
    seoAnalyticsDashboard,
    seoMetaTitle,
    seoMetaDescription,
    seoFocusKeyphrase,
    seoLSIKeywords,
    seoReadabilityTarget,
    seoInternalLinking,
    seoSchemaMarkup,
    
    // Phase 4: Enterprise SEO Features
    seoCompetitorTracking,
    seoCompetitorUrls,
    seoContentGapAnalysis,
    seoTechnicalSEO,
    seoLocalSEO,
    seoLocalBusiness,
    seoLocalLocation,
    seoMultilingual,
    seoTargetLanguages,
    seoAdvancedSchema,
    seoSchemaTypes,
    seoContentClusters,
    seoTopicAuthority,
    seoE_A_T_Optimization,
    seoFeaturedSnippets,
    seoVoiceSearch,
    seoMobileFirst,
    seoPageSpeed,
    seoCoreWebVitals
  }), [
    demonetizationEnabled,
    grammarEnabled,
    styleEnabled,
    contextAwareGrammarEnabled,
    tonePreservingEnabled,
    engagementEnabled,
    platformAdaptationEnabled,
    selectedPlatform,
    conflictResolutionMode,
    toneDetectionSensitivity,
    formalityLevel,
    seoOptimizationEnabled,
    seoContentType,
    seoPrimaryKeyword,
    seoSecondaryKeywords,
    seoTargetAudience,
    seoTemplateEnabled,
    seoSelectedTemplate,
    seoMetaOptimization,
    seoKeywordResearch,
    seoCompetitorAnalysis,
    seoAnalyticsDashboard,
    seoMetaTitle,
    seoMetaDescription,
    seoFocusKeyphrase,
    seoLSIKeywords,
    seoReadabilityTarget,
    seoInternalLinking,
    seoSchemaMarkup,
    seoCompetitorTracking,
    seoCompetitorUrls,
    seoContentGapAnalysis,
    seoTechnicalSEO,
    seoLocalSEO,
    seoLocalBusiness,
    seoLocalLocation,
    seoMultilingual,
    seoTargetLanguages,
    seoAdvancedSchema,
    seoSchemaTypes,
    seoContentClusters,
    seoTopicAuthority,
    seoE_A_T_Optimization,
    seoFeaturedSnippets,
    seoVoiceSearch,
    seoMobileFirst,
    seoPageSpeed,
    seoCoreWebVitals
  ]);

  // Debounced suggestion update to prevent flickering
  const debouncedSuggestionUpdate = useCallback((suggestions: any[]) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setAllSuggestionsAndFilter(suggestions)
    }, 100) // Small delay to batch updates
  }, [setAllSuggestionsAndFilter])

  const getSuggestions = useCallback(async () => {
    if (!content.trim()) {
      // Clear suggestions immediately for empty content
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      setAllSuggestionsAndFilter([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 SEO Analysis - Making API call with advanced features:', {
        seoOptimizationEnabled: requestBody.seoOptimizationEnabled,
        seoTemplateEnabled: requestBody.seoTemplateEnabled,
        seoMetaOptimization: requestBody.seoMetaOptimization,
        seoKeywordResearch: requestBody.seoKeywordResearch,
        seoCompetitorAnalysis: requestBody.seoCompetitorAnalysis,
        seoInternalLinking: requestBody.seoInternalLinking,
        seoSchemaMarkup: requestBody.seoSchemaMarkup
      });

      const response = await fetch('http://localhost:3001/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
          ...requestBody
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle Phase 3 SEO analytics and insights
      if (data.seoAnalytics && requestBody.seoAnalyticsDashboard) {
        setSeoContentScore(data.seoAnalytics.contentScore || 0);
        
        // Update LSI keywords if keyword research is enabled
        if (requestBody.seoKeywordResearch && data.seoAnalytics.suggestedLSIKeywords) {
          setSeoLSIKeywords(data.seoAnalytics.suggestedLSIKeywords);
        }
      }

      const suggestions = data.suggestions || []
      
      // Phase 4C: Handle enhanced response with insights
      if (data.insights && data.insights.length > 0) {
        console.log('✨ Writing Insights:')
        data.insights.forEach((insight: any) => {
          console.log(`  ${insight.icon} ${insight.message}`)
        })
      }
      
      if (data.processingMetadata) {
        console.log('📊 Processing Metadata:', data.processingMetadata)
      }
      
      if (data.edgeCase) {
        console.log(`🛡️ Edge Case Handled: ${data.edgeCase.type} - ${data.edgeCase.message}`)
      }
      
      // Debug logging for suggestions
      console.log('🔍 Received suggestions:', suggestions.length)
      
      suggestions.forEach((suggestion: any) => {
        const extractedText = content.substring(suggestion.start, suggestion.end)
        const isTextMatch = extractedText === suggestion.text
        
        console.log(`📍 Suggestion ${suggestion.id}:`, {
          type: suggestion.type,
          hasTextProperty: 'text' in suggestion,
          apiText: suggestion.text,
          apiTextLength: suggestion.text ? suggestion.text.length : 'N/A',
          position: `${suggestion.start}-${suggestion.end}`,
          extractedText: extractedText,
          extractedLength: extractedText.length,
          isMatch: isTextMatch
        })
        
        if (!isTextMatch) {
          console.warn(`Text mismatch for suggestion ${suggestion.id}:`, {
            expected: suggestion.text,
            actual: extractedText,
            position: `${suggestion.start}-${suggestion.end}`,
            type: suggestion.type
          })
        }
        
        if (suggestion.type === 'demonetization') {
          console.log(`  - ${suggestion.text} (${suggestion.start}-${suggestion.end}): "${content.substring(suggestion.start, suggestion.end)}"`)
        }
        if (suggestion.type === 'tone-rewrite') {
          console.log(`  - Tone rewrite: "${suggestion.text}" -> "${suggestion.toneRewrite?.rewrittenText}"`)
        }
        if (suggestion.type === 'engagement') {
          console.log(`  - Engagement (${suggestion.engagementCategory}): "${suggestion.text}" -> ${suggestion.alternatives?.[0] || 'N/A'}`)
        }
        if (suggestion.type === 'platform-adaptation') {
          console.log(`  - Platform (${suggestion.platformName}): "${suggestion.text}" -> ${suggestion.alternatives?.[0] || 'N/A'}`)
        }
        if (suggestion.type === 'seo') {
          console.log(`  - SEO: "${suggestion.text}" -> ${suggestion.alternatives?.[0] || 'N/A'}`)
        }
        if (suggestion.userTip) {
          console.log(`    💡 Tip: ${suggestion.userTip}`)
        }
      })
      
      // Use debounced update to prevent flickering
      debouncedSuggestionUpdate(suggestions)
      
      // Store insights in the editor store for potential UI display
      if (setWritingInsights && data.insights) {
        setWritingInsights(data.insights)
      }
      
      // Phase 5A: Handle analytics and session data
      console.log('📊 Analytics Response Debug:', {
        hasSessionId: !!data.sessionId,
        hasAnalytics: !!data.analytics,
        sessionId: data.sessionId,
        analytics: data.analytics
      })
      
      if (data.sessionId) {
        console.log('Setting session ID:', data.sessionId)
        setCurrentSessionId(data.sessionId)
      }
      if (data.analytics) {
        console.log('Setting analytics:', data.analytics)
        setAnalytics(data.analytics)
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [
    content,
    requestBody,
    debouncedSuggestionUpdate,
    setWritingInsights,
    setCurrentSessionId,
    setAnalytics,
    setSeoContentScore,
    setSeoLSIKeywords,
    setAllSuggestionsAndFilter
  ]);

  // Immediate fetch for document loading (no debounce)
  const requestSuggestionsImmediate = useCallback(() => {
    console.log('🚀 Immediate suggestions request (document load)')
    // Clear any pending debounced requests
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }
    getSuggestions()
  }, [getSuggestions])

  // Debounced fetch for typing (500ms delay - optimized for responsiveness)
  const requestSuggestions = useCallback(() => {
    console.log('⏱️ Debounced suggestions request (typing)')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(getSuggestions, 500)
  }, [getSuggestions])

  // Cleanup timeouts on unmount
  useCallback(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    }
  }, [])

  return { requestSuggestions, requestSuggestionsImmediate, refilterSuggestions }
}
