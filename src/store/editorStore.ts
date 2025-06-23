// src/store/editorStore.ts
import { create } from 'zustand'
import { updateDocument, saveDocumentVersion } from '../services/documents'
import { supabase } from '../services/supabaseClient'

interface Suggestion {
  id: string
  text: string // The actual text that should be highlighted
  start: number
  end: number
  message: string
  type: 'grammar' | 'spelling' | 'style' | 'demonetization' | 'slang-protected' | 'tone-rewrite' | 'engagement' | 'seo'
  alternatives?: string[]
  confidence?: number
  status: 'pending' | 'accepted' | 'ignored'
  
  // New properties for tone-preserving rewrites
  priority?: number // 1-10 scale, higher = more important
  conflictsWith?: string[] // IDs of conflicting suggestions
  originalTone?: string // detected tone (casual, formal, creative, etc.)
  toneRewrite?: {
    originalText: string
    rewrittenText: string
    tonePreserved: boolean
    confidenceScore: number
    reasoning: string
  }
  
  // New properties for engagement suggestions
  engagementCategory?: string // openingHook, callToAction, etc.
  engagementType?: string // specific type within category
  
  // New properties for platform adaptation suggestions
  platformId?: string
  platformName?: string
  platformCategory?: string
  platformScore?: number
  userTip?: string
  
  // New properties for SEO suggestions
  seoCategory?: string
  seoType?: string
  seoScore?: number
  recommendation?: any
}

interface Document {
  id: string
  title: string
  content: string
  [key: string]: any
}

interface EditorState {
  content: string
  setContent: (content: string) => void

  suggestions: Suggestion[]
  allSuggestions: Suggestion[] // Store all unfiltered suggestions
  setSuggestions: (suggestions: Suggestion[]) => void
  setAllSuggestionsAndFilter: (allSuggestions: Suggestion[]) => void
  refilterSuggestions: () => void
  updateSuggestionStatus: (id: string, status: Suggestion['status']) => void

  currentDocument: Document | null
  setCurrentDocument: (doc: Document | null) => void
  saveCurrentDocument: () => Promise<boolean>

  // Phase 4C: Writing insights from enhanced AI response
  writingInsights: Array<{
    type: 'positive' | 'warning' | 'info' | 'enhancement' | 'stats'
    icon: string
    message: string
  }>
  setWritingInsights: (insights: Array<{
    type: 'positive' | 'warning' | 'info' | 'enhancement' | 'stats'
    icon: string
    message: string
  }>) => void

  // Phase 5A: Writing analytics session tracking
  currentSessionId: string | null
  setCurrentSessionId: (sessionId: string | null) => void
  analytics: any | null
  setAnalytics: (analytics: any | null) => void
  generateAnalytics: () => void
  sessionStartTime: number

  // Feature toggles for settings page
  demonetizationEnabled: boolean
  setDemonetizationEnabled: (val: boolean) => void
  grammarEnabled: boolean
  setGrammarEnabled: (val: boolean) => void
  styleEnabled: boolean
  setStyleEnabled: (val: boolean) => void
  contextAwareGrammarEnabled: boolean
  setContextAwareGrammarEnabled: (val: boolean) => void
  
  // New: Tone-preserving rewrite settings
  tonePreservingEnabled: boolean
  setTonePreservingEnabled: (val: boolean) => void
  
  // New: Engagement enhancement settings
  engagementEnabled: boolean
  setEngagementEnabled: (val: boolean) => void
  
  // New: Platform adaptation settings

  selectedPlatform: string | null
  setSelectedPlatform: (platform: string | null) => void
  
  // Priority preferences for conflict resolution
  conflictResolutionMode: 'grammar-first' | 'tone-first' | 'balanced' | 'user-choice'
  setConflictResolutionMode: (mode: 'grammar-first' | 'tone-first' | 'balanced' | 'user-choice') => void
  
  // Tone detection sensitivity
  toneDetectionSensitivity: 'low' | 'medium' | 'high'
  setToneDetectionSensitivity: (level: 'low' | 'medium' | 'high') => void

  // Formality spectrum setting
  formalityLevel: 'casual' | 'balanced' | 'formal'
  setFormalityLevel: (level: 'casual' | 'balanced' | 'formal') => void

  // SEO Content Optimization settings
  seoOptimizationEnabled: boolean
  setSeoOptimizationEnabled: (val: boolean) => void
  seoContentType: 'blogPost' | 'article' | 'socialMedia' | 'email' | 'landingPage' | 'productDescription'
  setSeoContentType: (type: 'blogPost' | 'article' | 'socialMedia' | 'email' | 'landingPage' | 'productDescription') => void
  seoPrimaryKeyword: string
  setSeoPrimaryKeyword: (keyword: string) => void
  seoSecondaryKeywords: string[]
  setSeoSecondaryKeywords: (keywords: string[]) => void
  seoTargetAudience: string
  setSeoTargetAudience: (audience: string) => void

  // Save state
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (val: boolean) => void

  // Phase 3: Advanced SEO Features
  seoTemplateEnabled: boolean
  setSeoTemplateEnabled: (val: boolean) => void
  seoSelectedTemplate: string
  setSeoSelectedTemplate: (template: string) => void
  seoMetaOptimization: boolean
  setSeoMetaOptimization: (val: boolean) => void
  seoKeywordResearch: boolean
  setSeoKeywordResearch: (val: boolean) => void
  seoCompetitorAnalysis: boolean
  setSeoCompetitorAnalysis: (val: boolean) => void
  seoAnalyticsDashboard: boolean
  setSeoAnalyticsDashboard: (val: boolean) => void
  seoMetaTitle: string
  setSeoMetaTitle: (title: string) => void
  seoMetaDescription: string
  setSeoMetaDescription: (description: string) => void
  seoFocusKeyphrase: string
  setSeoFocusKeyphrase: (keyphrase: string) => void
  seoLSIKeywords: string[]
  setSeoLSIKeywords: (keywords: string[]) => void
  seoContentScore: number
  setSeoContentScore: (score: number) => void
  seoReadabilityTarget: 'easy' | 'medium' | 'difficult'
  setSeoReadabilityTarget: (target: 'easy' | 'medium' | 'difficult') => void
  seoInternalLinking: boolean
  setSeoInternalLinking: (val: boolean) => void
  seoSchemaMarkup: boolean
  setSeoSchemaMarkup: (val: boolean) => void

  // Phase 4: Enterprise SEO Features
  seoCompetitorTracking: boolean
  setSeoCompetitorTracking: (val: boolean) => void
  seoCompetitorUrls: string[]
  setSeoCompetitorUrls: (urls: string[]) => void
  seoContentGapAnalysis: boolean
  setSeoContentGapAnalysis: (val: boolean) => void
  seoTechnicalSEO: boolean
  setSeoTechnicalSEO: (val: boolean) => void
  seoLocalSEO: boolean
  setSeoLocalSEO: (val: boolean) => void
  seoLocalBusiness: string
  setSeoLocalBusiness: (business: string) => void
  seoLocalLocation: string
  setSeoLocalLocation: (location: string) => void
  seoMultilingual: boolean
  setSeoMultilingual: (val: boolean) => void
  seoTargetLanguages: string[]
  setSeoTargetLanguages: (languages: string[]) => void
  seoAdvancedSchema: boolean
  setSeoAdvancedSchema: (val: boolean) => void
  seoSchemaTypes: string[]
  setSeoSchemaTypes: (types: string[]) => void
  seoContentClusters: boolean
  setSeoContentClusters: (val: boolean) => void
  seoTopicAuthority: boolean
  setSeoTopicAuthority: (val: boolean) => void
  seoAuthorityScore: number
  setSeoAuthorityScore: (score: number) => void
  seoE_A_T_Optimization: boolean
  setSeoE_A_T_Optimization: (val: boolean) => void
  seoFeaturedSnippets: boolean
  setSeoFeaturedSnippets: (val: boolean) => void
  seoVoiceSearch: boolean
  setSeoVoiceSearch: (val: boolean) => void
  seoMobileFirst: boolean
  setSeoMobileFirst: (val: boolean) => void
  seoPageSpeed: boolean
  setSeoPageSpeed: (val: boolean) => void
  seoCoreWebVitals: boolean
  setSeoCoreWebVitals: (val: boolean) => void
}

// Helper function to check if two text ranges overlap
const doRangesOverlap = (range1: {start: number, end: number}, range2: {start: number, end: number}) => {
  return range1.start < range2.end && range2.start < range1.end;
}

// Helper function to calculate suggestion priority based on type and context
const calculateSuggestionPriority = (suggestion: Suggestion, conflictResolutionMode: string): number => {
  const basePriorities = {
    'demonetization': 9,      // High priority - affects monetization
    'grammar': 6,             // Medium-high priority - affects correctness
    'spelling': 7,            // High priority - clear errors
    'tone-rewrite': 8,        // High priority - preserves voice while fixing
    'engagement': 5,          // Medium priority - enhances reader connection
    'seo': 7,                // High priority - affects search visibility
    'style': 4,              // Medium priority - affects clarity
    'slang-protected': 2     // Low priority - informational only
  }
  
  let priority = basePriorities[suggestion.type] || 5
  
  // Adjust based on conflict resolution mode
  switch (conflictResolutionMode) {
    case 'grammar-first':
      if (['grammar', 'spelling'].includes(suggestion.type)) priority += 2
      if (suggestion.type === 'tone-rewrite') priority -= 1
      break
    case 'tone-first':
      if (suggestion.type === 'tone-rewrite') priority += 2
      if (['grammar', 'spelling'].includes(suggestion.type)) priority -= 1
      break
    case 'balanced':
      // Keep base priorities
      break
    case 'user-choice':
      // All suggestions get equal consideration
      priority = 5
      break
  }
  
  // Factor in confidence score if available
  if (suggestion.confidence) {
    priority += (suggestion.confidence - 0.5) * 2 // -1 to +1 adjustment
  }
  
  // SEO suggestions (including advanced features)
  if (suggestion.type === 'seo') {
    if (suggestion.seoCategory === 'meta-optimization') return 9; // Meta tags are critical
    if (suggestion.seoCategory === 'keyword-research') return 8; // Keyword research is high priority
    if (suggestion.seoCategory === 'content-structure') return 7; // Structure is important
    if (suggestion.seoCategory === 'internal-linking') return 6; // Internal links help SEO
    if (suggestion.seoCategory === 'schema-markup') return 5; // Schema is beneficial
    return 7; // Default SEO priority
  }
  
  return Math.max(1, Math.min(10, priority))
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  setContent: (content) => {
    set({ content, hasUnsavedChanges: true })
  },

  suggestions: [],
  allSuggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  setAllSuggestionsAndFilter: (allSuggestions) => {
    const state = get()
    
    // Calculate priorities for all suggestions
    const suggestionsWithPriority = allSuggestions.map(suggestion => ({
      ...suggestion,
      priority: calculateSuggestionPriority(suggestion, state.conflictResolutionMode)
    }))
    
    const filteredSuggestions = suggestionsWithPriority.filter((suggestion) => {
      // Filter based on feature toggles
      if (suggestion.type === 'demonetization' && !state.demonetizationEnabled) {
        return false
      }
      if ((suggestion.type === 'grammar' || suggestion.type === 'spelling') && !state.grammarEnabled) {
        return false
      }
      if (suggestion.type === 'style' && !state.styleEnabled) {
        return false
      }
      if (suggestion.type === 'slang-protected' && !state.contextAwareGrammarEnabled) {
        return false
      }
      if (suggestion.type === 'tone-rewrite' && !state.tonePreservingEnabled) {
        return false
      }
      if (suggestion.type === 'engagement' && !state.engagementEnabled) {
        return false
      }
      // Platform adaptation is now always enabled and integrated into priority system
      if (suggestion.type === 'seo' && !state.seoOptimizationEnabled) {
        return false
      }
      return true
    })
    
    set({ allSuggestions: suggestionsWithPriority, suggestions: filteredSuggestions })
    get().generateAnalytics()
  },
  refilterSuggestions: () => {
    const state = get()
    
    // Recalculate priorities when settings change
    const suggestionsWithPriority = state.allSuggestions.map(suggestion => ({
      ...suggestion,
      priority: calculateSuggestionPriority(suggestion, state.conflictResolutionMode)
    }))
    
    const filteredSuggestions = suggestionsWithPriority.filter((suggestion) => {
      // Filter based on feature toggles
      if (suggestion.type === 'demonetization' && !state.demonetizationEnabled) {
        return false
      }
      if ((suggestion.type === 'grammar' || suggestion.type === 'spelling') && !state.grammarEnabled) {
        return false
      }
      if (suggestion.type === 'style' && !state.styleEnabled) {
        return false
      }
      if (suggestion.type === 'slang-protected' && !state.contextAwareGrammarEnabled) {
        return false
      }
      if (suggestion.type === 'tone-rewrite' && !state.tonePreservingEnabled) {
        return false
      }
      if (suggestion.type === 'engagement' && !state.engagementEnabled) {
        return false
      }
      // Platform adaptation is now always enabled and integrated into priority system
      if (suggestion.type === 'seo' && !state.seoOptimizationEnabled) {
        return false
      }
      return true
    })
    
    set({ allSuggestions: suggestionsWithPriority, suggestions: filteredSuggestions })
    get().generateAnalytics()
  },
  updateSuggestionStatus: (id, status) =>
    set((state) => {
      const targetSuggestion = state.suggestions.find(s => s.id === id);
      if (!targetSuggestion) return state;

      // If the suggestion is being accepted, we need to handle overlapping suggestions
      if (status === 'accepted') {
        return {
          suggestions: state.suggestions.map((s) => {
            if (s.id === id) {
              return { ...s, status };
            }
            
            // Check if this suggestion overlaps with the accepted one
            if (doRangesOverlap(
              { start: s.start, end: s.end },
              { start: targetSuggestion.start, end: targetSuggestion.end }
            )) {
              // Mark overlapping suggestions as resolved to prevent conflicts
              return { ...s, status: 'ignored' };
            }
            
            // Check if this suggestion is marked as conflicting
            if (targetSuggestion.conflictsWith?.includes(s.id) || s.conflictsWith?.includes(id)) {
              return { ...s, status: 'ignored' };
            }
            
            return s;
          })
        };
      }

      // For ignored suggestions, just update that one
      return {
        suggestions: state.suggestions.map((s) =>
          s.id === id ? { ...s, status } : s
        )
      };
    }),

  currentDocument: null,
  setCurrentDocument: (doc) => {
    // Clear suggestions when switching documents
    set({ 
      currentDocument: doc, 
      content: doc?.content || '', 
      suggestions: [],
      allSuggestions: [],
      hasUnsavedChanges: false,
      lastSaved: doc ? new Date() : null
    })
  },

  saveCurrentDocument: async () => {
    const state = get()
    if (!state.currentDocument?.id || !state.hasUnsavedChanges) {
      return true
    }

    set({ isSaving: true })
    
    try {
      // Get current user for version tracking
      const { data: { user } } = await supabase.auth.getUser()
      
      // Check if this is a significant change that warrants a manual version
      const currentContent = state.content
      const originalContent = state.currentDocument.content
      const contentDiff = Math.abs(currentContent.length - originalContent.length)
      const isSignificantChange = contentDiff > 50 || 
        (currentContent !== originalContent && currentContent.split(' ').length !== originalContent.split(' ').length)
      
      // Create a manual version if this is a significant change and we have a user
      if (isSignificantChange && user) {
        try {
          await saveDocumentVersion(
            state.currentDocument.id,
            originalContent,
            state.currentDocument.title,
            user.id,
            'Manual save version'
          )
        } catch (versionError) {
          console.warn('Failed to create version, but continuing with save:', versionError)
        }
      }
      
      // Update the document
      const { error } = await updateDocument(state.currentDocument.id, state.content)
      
      if (error) {
        console.error('Failed to save document:', error)
        set({ isSaving: false })
        return false
      }

      set({ 
        isSaving: false, 
        hasUnsavedChanges: false, 
        lastSaved: new Date(),
        currentDocument: {
          ...state.currentDocument,
          content: state.content
        }
      })
      return true
    } catch (error) {
      console.error('Failed to save document:', error)
      set({ isSaving: false })
      return false
    }
  },

  // Phase 4C: Writing insights from enhanced AI response
  writingInsights: [],
  setWritingInsights: (insights) => set({ writingInsights: insights }),

  // Phase 5A: Writing analytics session tracking
  currentSessionId: null,
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  analytics: null,
  setAnalytics: (analytics) => set({ analytics }),
  sessionStartTime: Date.now(),
  generateAnalytics: () => {
    const state = get()
    const { allSuggestions, currentSessionId, content } = state
    
    // Generate analytics based on current suggestions
    const suggestionBreakdown = allSuggestions.reduce((acc, suggestion) => {
      const existing = acc.find(item => item.type === suggestion.type)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({
          type: suggestion.type,
          count: 1,
          percentage: 0 // Will calculate below
        })
      }
      return acc
    }, [] as any[])
    
    // Calculate percentages
    const total = allSuggestions.length
    suggestionBreakdown.forEach(item => {
      item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
    })
    
    // Calculate word count and other metrics
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    const charCount = content.length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const avgSentenceLength = sentences > 0 ? Math.round(wordCount / sentences) : 0
    
    // Create analytics in the same format as backend
    const analytics = {
      session: {
        id: currentSessionId || 'local-session',
        duration: Date.now() - (state.sessionStartTime || Date.now()),
        wordCount: wordCount, // FIXED: Add wordCount field
        charCount: charCount, // FIXED: Add charCount field
        improvementRate: 0, // Could calculate based on accepted suggestions
        suggestionsProcessed: allSuggestions.length,
        suggestionsAccepted: 0 // Could track this in the future
      },
      writingQuality: {
        readabilityScore: Math.max(0, Math.min(100, 206.835 - (1.015 * avgSentenceLength))), // Simplified Flesch-Kincaid
        readabilityLevel: avgSentenceLength < 12 ? 'Very Easy' : avgSentenceLength < 15 ? 'Easy' : avgSentenceLength < 18 ? 'Standard' : 'Difficult',
        sentenceVariety: Math.min(100, Math.max(0, 100 - Math.abs(avgSentenceLength - 15) * 5)), // Variety based on sentence length consistency
        vocabularyRichness: Math.min(100, Math.round((new Set(content.toLowerCase().split(/\s+/)).size / wordCount) * 100)), // Unique words ratio
        avgSentenceLength: avgSentenceLength,
        toneConsistency: 75 // Default value
      },
      improvements: [], // Could track improvements in the future
      suggestionBreakdown
    }
    
    set({ analytics })
  },

  // Feature toggles for settings page
  demonetizationEnabled: true,
  setDemonetizationEnabled: (val) => {
    set({ demonetizationEnabled: val })
    get().refilterSuggestions() // Refilter when settings change
  },
  grammarEnabled: true,
  setGrammarEnabled: (val) => {
    set({ grammarEnabled: val })
    get().refilterSuggestions()
  },
  styleEnabled: true,
  setStyleEnabled: (val) => {
    set({ styleEnabled: val })
    get().refilterSuggestions()
  },
  contextAwareGrammarEnabled: true,
  setContextAwareGrammarEnabled: (val) => {
    set({ contextAwareGrammarEnabled: val })
    get().refilterSuggestions()
  },
  
  // New: Tone-preserving rewrite settings
  tonePreservingEnabled: true,
  setTonePreservingEnabled: (val) => {
    set({ tonePreservingEnabled: val })
    get().refilterSuggestions()
  },
  
  // New: Engagement enhancement settings
  engagementEnabled: true,
  setEngagementEnabled: (val) => {
    set({ engagementEnabled: val })
    get().refilterSuggestions()
  },
  
  // New: Platform adaptation settings
  selectedPlatform: null,
  setSelectedPlatform: (platform) => {
    set({ selectedPlatform: platform })
    // Platform change requires full re-analysis for slang protection
    const state = get()
    if (state.content && state.content.trim().length > 0) {
      // Import and call requestSuggestionsImmediate from useSuggestions hook
      // This will be handled by the Editor component listening to this change
      state.setAllSuggestionsAndFilter([]) // Clear old suggestions immediately
    }
  },
  
  // Priority preferences for conflict resolution
  conflictResolutionMode: 'balanced',
  setConflictResolutionMode: (mode) => {
    set({ conflictResolutionMode: mode })
    get().refilterSuggestions() // Recalculate priorities when mode changes
  },
  
  // Tone detection sensitivity
  toneDetectionSensitivity: 'medium',
  setToneDetectionSensitivity: (level) => set({ toneDetectionSensitivity: level }),

  // Formality spectrum setting
  formalityLevel: 'balanced',
  setFormalityLevel: (level) => {
    set({ formalityLevel: level })
    // Formality change requires full re-analysis for slang protection
    const state = get()
    if (state.content && state.content.trim().length > 0) {
      state.setAllSuggestionsAndFilter([]) // Clear old suggestions immediately
    }
  },

  // SEO Content Optimization settings
  seoOptimizationEnabled: false,
  setSeoOptimizationEnabled: (val) => {
    set({ seoOptimizationEnabled: val })
    get().refilterSuggestions()
  },
  seoContentType: 'blogPost',
  setSeoContentType: (type) => set({ seoContentType: type }),
  seoPrimaryKeyword: '',
  setSeoPrimaryKeyword: (keyword) => set({ seoPrimaryKeyword: keyword }),
  seoSecondaryKeywords: [],
  setSeoSecondaryKeywords: (keywords) => set({ seoSecondaryKeywords: keywords }),
  seoTargetAudience: '',
  setSeoTargetAudience: (audience) => set({ seoTargetAudience: audience }),

  // Save state
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),

  // Phase 3: Advanced SEO Features
  seoTemplateEnabled: false,
  setSeoTemplateEnabled: (val) => {
    set({ seoTemplateEnabled: val })
    get().refilterSuggestions()
  },
  seoSelectedTemplate: 'blog-post-template',
  setSeoSelectedTemplate: (template) => set({ seoSelectedTemplate: template }),
  seoMetaOptimization: false,
  setSeoMetaOptimization: (val) => {
    set({ seoMetaOptimization: val })
    get().refilterSuggestions()
  },
  seoKeywordResearch: false,
  setSeoKeywordResearch: (val) => {
    set({ seoKeywordResearch: val })
    get().refilterSuggestions()
  },
  seoCompetitorAnalysis: false,
  setSeoCompetitorAnalysis: (val) => {
    set({ seoCompetitorAnalysis: val })
    get().refilterSuggestions()
  },
  seoAnalyticsDashboard: false,
  setSeoAnalyticsDashboard: (val) => set({ seoAnalyticsDashboard: val }),
  seoMetaTitle: '',
  setSeoMetaTitle: (title) => set({ seoMetaTitle: title }),
  seoMetaDescription: '',
  setSeoMetaDescription: (description) => set({ seoMetaDescription: description }),
  seoFocusKeyphrase: '',
  setSeoFocusKeyphrase: (keyphrase) => set({ seoFocusKeyphrase: keyphrase }),
  seoLSIKeywords: [],
  setSeoLSIKeywords: (keywords) => set({ seoLSIKeywords: keywords }),
  seoContentScore: 0,
  setSeoContentScore: (score) => set({ seoContentScore: score }),
  seoReadabilityTarget: 'medium',
  setSeoReadabilityTarget: (target) => set({ seoReadabilityTarget: target }),
  seoInternalLinking: false,
  setSeoInternalLinking: (val) => {
    set({ seoInternalLinking: val })
    get().refilterSuggestions()
  },
  seoSchemaMarkup: false,
  setSeoSchemaMarkup: (val) => {
    set({ seoSchemaMarkup: val })
    get().refilterSuggestions()
  },

  // Phase 4: Enterprise SEO Features
  seoCompetitorTracking: false,
  setSeoCompetitorTracking: (val) => set({ seoCompetitorTracking: val }),
  seoCompetitorUrls: [],
  setSeoCompetitorUrls: (urls) => set({ seoCompetitorUrls: urls }),
  seoContentGapAnalysis: false,
  setSeoContentGapAnalysis: (val) => set({ seoContentGapAnalysis: val }),
  seoTechnicalSEO: false,
  setSeoTechnicalSEO: (val) => set({ seoTechnicalSEO: val }),
  seoLocalSEO: false,
  setSeoLocalSEO: (val) => set({ seoLocalSEO: val }),
  seoLocalBusiness: '',
  setSeoLocalBusiness: (business) => set({ seoLocalBusiness: business }),
  seoLocalLocation: '',
  setSeoLocalLocation: (location) => set({ seoLocalLocation: location }),
  seoMultilingual: false,
  setSeoMultilingual: (val) => set({ seoMultilingual: val }),
  seoTargetLanguages: [],
  setSeoTargetLanguages: (languages) => set({ seoTargetLanguages: languages }),
  seoAdvancedSchema: false,
  setSeoAdvancedSchema: (val) => set({ seoAdvancedSchema: val }),
  seoSchemaTypes: [],
  setSeoSchemaTypes: (types) => set({ seoSchemaTypes: types }),
  seoContentClusters: false,
  setSeoContentClusters: (val) => set({ seoContentClusters: val }),
  seoTopicAuthority: false,
  setSeoTopicAuthority: (val) => set({ seoTopicAuthority: val }),
  seoAuthorityScore: 0,
  setSeoAuthorityScore: (score) => set({ seoAuthorityScore: score }),
  seoE_A_T_Optimization: false,
  setSeoE_A_T_Optimization: (val) => set({ seoE_A_T_Optimization: val }),
  seoFeaturedSnippets: false,
  setSeoFeaturedSnippets: (val) => set({ seoFeaturedSnippets: val }),
  seoVoiceSearch: false,
  setSeoVoiceSearch: (val) => set({ seoVoiceSearch: val }),
  seoMobileFirst: false,
  setSeoMobileFirst: (val) => set({ seoMobileFirst: val }),
  seoPageSpeed: false,
  setSeoPageSpeed: (val) => set({ seoPageSpeed: val }),
  seoCoreWebVitals: false,
  setSeoCoreWebVitals: (val) => set({ seoCoreWebVitals: val }),
}))