import { useCallback, useRef, useState } from 'react'
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

  const getSuggestions = useCallback(async () => {
    if (!content.trim()) {
      setAllSuggestionsAndFilter([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎯 SEO Analysis - Making API call with advanced features:', {
        seoOptimizationEnabled,
        seoTemplateEnabled,
        seoMetaOptimization,
        seoKeywordResearch,
        seoCompetitorAnalysis,
        seoInternalLinking,
        seoSchemaMarkup
      });

      const response = await fetch('http://localhost:3001/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
          
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
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle Phase 3 SEO analytics and insights
      if (data.seoAnalytics && seoAnalyticsDashboard) {
        setSeoContentScore(data.seoAnalytics.contentScore || 0);
        
        // Update LSI keywords if keyword research is enabled
        if (seoKeywordResearch && data.seoAnalytics.suggestedLSIKeywords) {
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
      console.log('🔍 Received suggestions:')
      suggestions.forEach((suggestion: any) => {
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
      
      // Store all suggestions and filter based on current settings
      setAllSuggestionsAndFilter(suggestions)
      
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
    
    // Phase 3: Advanced SEO Features dependencies
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
    setAllSuggestionsAndFilter,
    setWritingInsights,
    setCurrentSessionId,
    setAnalytics,
    
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
  ]);

  // Immediate fetch for document loading (no debounce)
  const requestSuggestionsImmediate = useCallback(() => {
    console.log('🚀 Immediate suggestions request (document load)')
    // Clear any pending debounced requests
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    getSuggestions()
  }, [getSuggestions])

  // Debounced fetch for typing (800ms delay)
  const requestSuggestions = useCallback(() => {
    console.log('⏱️ Debounced suggestions request (typing)')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(getSuggestions, 800)
  }, [getSuggestions])

  return { requestSuggestions, requestSuggestionsImmediate, refilterSuggestions }
}
