import { useCallback, useRef, useState, useMemo } from 'react'
import { useEditorStore } from '../store/editorStore'

interface Suggestion {
  id: string
  text: string
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization' | 'slang-protected' | 'tone-rewrite' | 'engagement' | 'seo'
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
      // ULTIMATE TEST DEMO: Use main endpoint for comprehensive suggestions
      if (content.includes('ultimate test')) {
        console.log('🎯 ULTIMATE TEST DETECTED - Using main suggestions endpoint for comprehensive demo');
        
        const mainResponse = await fetch('http://localhost:3001/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content,
            ...requestBody
          }),
        });

        if (!mainResponse.ok) {
          throw new Error(`Main API error! status: ${mainResponse.status}`);
        }

        const mainData = await mainResponse.json();
        const allSuggestions = mainData.suggestions || [];
        
        console.log('🎯 ULTIMATE TEST - Received suggestions:', allSuggestions.length);
        console.log('🎯 ULTIMATE TEST - Suggestion types:', allSuggestions.map((s: any) => s.type));
        
        // Store session info
        if (mainData.sessionId) {
          setCurrentSessionId(mainData.sessionId);
        }
        
        // Store analytics
        if (mainData.analytics) {
          setAnalytics(mainData.analytics);
        }
        
        // Update with all suggestions (no filtering for ultimate test)
        debouncedSuggestionUpdate(allSuggestions);
        return;
      }

      // PHASE 1: Get core suggestions first (grammar, spelling, demonetization)
      // This is fast and gives immediate feedback
      console.log('🚀 Phase 1: Fetching core suggestions (grammar & spelling)');
      
      const coreResponse = await fetch('http://localhost:3001/api/suggestions/core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          formalityLevel: requestBody.formalityLevel,
          userId: 'anonymous'
        }),
      });

      if (!coreResponse.ok) {
        throw new Error(`Core API error! status: ${coreResponse.status}`);
      }

      const coreData = await coreResponse.json();
      const coreSuggestions = coreData.suggestions || [];
      
      console.log('✅ Phase 1 complete:', coreSuggestions.length, 'core suggestions');
      
      // Immediately show core suggestions for fast feedback
      debouncedSuggestionUpdate(coreSuggestions);
      
      // Store session info
      if (coreData.sessionId) {
        setCurrentSessionId(coreData.sessionId);
      }

      // PHASE 2: Get enhanced suggestions in parallel (only if enabled)
      const enhancedPromises = [];
      
      // Style suggestions (if style analysis is wanted)
      if (requestBody.tonePreservingEnabled || requestBody.conflictResolutionMode !== 'grammar-first') {
        console.log('🎨 Phase 2a: Fetching style suggestions');
        enhancedPromises.push(
          fetch('http://localhost:3001/api/suggestions/style', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: content,
              formalityLevel: requestBody.formalityLevel,
              toneDetectionSensitivity: requestBody.toneDetectionSensitivity
            }),
          }).then(res => res.ok ? res.json() : { suggestions: [] })
        );
      }
      
      // Engagement suggestions (if engagement is enabled)
      if (requestBody.engagementEnabled && content.length > 50) {
        console.log('🎯 Phase 2b: Fetching engagement suggestions');
        enhancedPromises.push(
          fetch('http://localhost:3001/api/suggestions/engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: content }),
          }).then(res => res.ok ? res.json() : { suggestions: [] })
        );
      }
      
      // If no enhanced features are enabled, just use core suggestions
      if (enhancedPromises.length === 0) {
        console.log('✅ Using core suggestions only (no enhanced features enabled)');
        return;
      }
      
      // Wait for all enhanced suggestions to complete
      const enhancedResults = await Promise.allSettled(enhancedPromises);
      
      // Combine all suggestions
      let allSuggestions = [...coreSuggestions];
      
      enhancedResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.suggestions) {
          allSuggestions = [...allSuggestions, ...result.value.suggestions];
          console.log(`✅ Phase 2${String.fromCharCode(97 + index)} complete:`, result.value.suggestions.length, 'suggestions');
        } else {
          console.warn(`⚠️ Phase 2${String.fromCharCode(97 + index)} failed:`, result.status === 'rejected' ? result.reason : 'No suggestions');
        }
      });
      
      console.log('🔄 Final combined suggestions:', allSuggestions.length);
      
      // Apply our priority-based filtering (spelling/grammar first)
      const prioritizedSuggestions = allSuggestions.sort((a, b) => {
        const priorityMap = {
          'spelling': 100,
          'grammar': 90,
          'demonetization': 80,
          'style': 50,
          'engagement': 40
        };
        
        const aPriority = priorityMap[a.type as keyof typeof priorityMap] || 25;
        const bPriority = priorityMap[b.type as keyof typeof priorityMap] || 25;
        
        return bPriority - aPriority; // Higher priority first
      });
      
      // Update with final suggestions
      debouncedSuggestionUpdate(prioritizedSuggestions);
      
      // Debug logging for final suggestions
      console.log('🔍 Final suggestions by type:');
      const suggestionsByType = prioritizedSuggestions.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(suggestionsByType);

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
    setCurrentSessionId,
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

  return { requestSuggestions, requestSuggestionsImmediate, refilterSuggestions, isLoading, error }
}
