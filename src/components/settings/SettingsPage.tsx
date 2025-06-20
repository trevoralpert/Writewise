import React, { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const SettingsPage = () => {
  const navigate = useNavigate()
  const [isNavigating, setIsNavigating] = useState(false)
  const { 
    demonetizationEnabled, 
    setDemonetizationEnabled,
    grammarEnabled,
    setGrammarEnabled,
    styleEnabled,
    setStyleEnabled,
    contextAwareGrammarEnabled,
    setContextAwareGrammarEnabled,
    engagementEnabled,
    setEngagementEnabled,
    platformAdaptationEnabled,
    setPlatformAdaptationEnabled,
    selectedPlatform,
    setSelectedPlatform,
    formalityLevel,
    setFormalityLevel,
    seoOptimizationEnabled,
    setSeoOptimizationEnabled,
    seoContentType,
    setSeoContentType,
    seoPrimaryKeyword,
    setSeoPrimaryKeyword,
    seoSecondaryKeywords,
    setSeoSecondaryKeywords,
    seoTargetAudience,
    setSeoTargetAudience,
    saveCurrentDocument,
    hasUnsavedChanges,
    seoTemplateEnabled,
    setSeoTemplateEnabled,
    seoSelectedTemplate,
    setSeoSelectedTemplate,
    seoMetaOptimization,
    setSeoMetaOptimization,
    seoKeywordResearch,
    setSeoKeywordResearch,
    seoAnalyticsDashboard,
    setSeoAnalyticsDashboard,
    seoMetaTitle,
    setSeoMetaTitle,
    seoMetaDescription,
    setSeoMetaDescription,
    seoFocusKeyphrase,
    setSeoFocusKeyphrase,
    seoReadabilityTarget,
    setSeoReadabilityTarget,
    seoInternalLinking,
    setSeoInternalLinking,
    seoSchemaMarkup,
    setSeoSchemaMarkup,
    // Phase 4: Enterprise SEO Features
    seoCompetitorTracking,
    setSeoCompetitorTracking,
    seoCompetitorUrls,
    setSeoCompetitorUrls,
    seoContentGapAnalysis,
    setSeoContentGapAnalysis,
    seoTechnicalSEO,
    setSeoTechnicalSEO,
    seoLocalSEO,
    setSeoLocalSEO,
    seoLocalBusiness,
    setSeoLocalBusiness,
    seoLocalLocation,
    setSeoLocalLocation,
    seoMultilingual,
    setSeoMultilingual,
    seoTargetLanguages,
    setSeoTargetLanguages,
    seoAdvancedSchema,
    setSeoAdvancedSchema,
    seoSchemaTypes,
    setSeoSchemaTypes,
    seoContentClusters,
    setSeoContentClusters,
    seoTopicAuthority,
    setSeoTopicAuthority,
    seoE_A_T_Optimization,
    setSeoE_A_T_Optimization,
    seoFeaturedSnippets,
    setSeoFeaturedSnippets,
    seoVoiceSearch,
    setSeoVoiceSearch,
    seoMobileFirst,
    setSeoMobileFirst,
    seoPageSpeed,
    setSeoPageSpeed,
    seoCoreWebVitals,
    setSeoCoreWebVitals,
  } = useEditorStore()

  const handleBackToEditor = async () => {
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      // Save current document before navigation
      if (hasUnsavedChanges) {
        const saved = await saveCurrentDocument()
        if (!saved) {
          const proceed = window.confirm(
            'Failed to save current document. Do you want to continue anyway? Unsaved changes will be lost.'
          )
          if (!proceed) {
            setIsNavigating(false)
            return
          }
        }
      }
      
      navigate('/')
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToEditor}
              disabled={isNavigating}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              {isNavigating ? 'Saving & Returning...' : 'Back to Editor'}
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          
          {/* AI Writing Features Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Writing Features</h2>
              <p className="text-sm text-gray-600">
                Control which AI-powered writing assistance features are enabled. 
                These settings apply to all your documents and control whether suggestions are generated.
              </p>
            </div>
            
            <div className="space-y-6">
              
              {/* Demonetization Word Filter */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Demonetization Word Filter
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Get alerts for words that could cause demonetization on content platforms like YouTube. 
                    Receive AI-generated safer alternatives in three categories: Industry Standard, Conservative, and Creative.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-orange-400 rounded-full"></span>
                    <span>Orange wavy underlines indicate flagged words</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={demonetizationEnabled}
                      onChange={(e) => setDemonetizationEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Grammar & Spelling */}
              <div className="flex items-start justify-between border-t pt-6">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Grammar & Spelling
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Detect and correct grammar mistakes, spelling errors, and punctuation issues.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-red-400 rounded-full"></span>
                    <span>Red underlines indicate grammar and spelling issues</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grammarEnabled}
                      onChange={(e) => setGrammarEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Style & Clarity */}
              <div className="flex items-start justify-between border-t pt-6">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Style & Clarity
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Improve writing style, clarity, and readability with suggestions for better word choice and sentence structure.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-blue-400 rounded-full"></span>
                    <span>Blue underlines indicate style and clarity suggestions</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styleEnabled}
                      onChange={(e) => setStyleEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Context-Aware Grammar Checking */}
              <div className="flex items-start justify-between border-t pt-6">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Context-Aware Grammar Checking
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Smart grammar checking that recognizes intentional slang and informal language choices. 
                    Prevents unnecessary corrections when creators are deliberately using casual language for their target audience.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-green-400 rounded-full"></span>
                    <span>Green dotted underlines show protected slang expressions</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contextAwareGrammarEnabled}
                      onChange={(e) => setContextAwareGrammarEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Engagement Enhancement */}
              <div className="flex items-start justify-between border-t pt-6">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Engagement Enhancement
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Get AI-powered suggestions to make your content more engaging and compelling for readers. 
                    Includes improvements for opening hooks, calls-to-action, emotional language, and reader interaction.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-pink-400 rounded-full"></span>
                    <span>Pink double underlines show engagement opportunities</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={engagementEnabled}
                      onChange={(e) => setEngagementEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Platform Adaptation */}
              <div className="flex items-start justify-between border-t pt-6">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Platform Adaptation
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Optimize your content for specific social media platforms and audiences. 
                    Get suggestions for character limits, tone adjustments, engagement tactics, and platform-specific best practices.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-green-400 rounded-full"></span>
                    <span>Green solid underlines show platform optimization opportunities</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformAdaptationEnabled}
                      onChange={(e) => setPlatformAdaptationEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Platform Selection */}
              {platformAdaptationEnabled && (
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Target Platform
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Choose the platform you're creating content for to get tailored optimization suggestions.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Professional networking' },
                      { id: 'twitter', name: 'Twitter/X', icon: '🐦', description: 'Short-form social' },
                      { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Visual storytelling' },
                      { id: 'youtube', name: 'YouTube', icon: '📺', description: 'Video content' },
                      { id: 'tiktok', name: 'TikTok', icon: '🎵', description: 'Short video content' }
                    ].map((platform) => (
                      <label key={platform.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="platform"
                          value={platform.id}
                          checked={selectedPlatform === platform.id}
                          onChange={(e) => setSelectedPlatform(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg">{platform.icon}</span>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{platform.name}</span>
                            <p className="text-xs text-gray-600">{platform.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                    
                    {/* None option */}
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="platform"
                        value=""
                        checked={selectedPlatform === null || selectedPlatform === ''}
                        onChange={(e) => setSelectedPlatform(null)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">🌐</span>
                        <div>
                          <span className="text-sm font-medium text-gray-900">General Content</span>
                          <p className="text-xs text-gray-600">No specific platform</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Formality Level */}
              {contextAwareGrammarEnabled && (
                <div className="border-t pt-6">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Formality Level for Your Content
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Adjust how strict grammar checking should be based on your target audience. 
                      This controls when slang and informal language is protected from corrections.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="formality"
                        value="casual"
                        checked={formalityLevel === 'casual'}
                        onChange={(e) => setFormalityLevel(e.target.value as 'casual')}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Casual</span>
                        <p className="text-xs text-gray-600">Perfect for social media, vlogs, and content targeting younger audiences. Most slang is protected.</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="formality"
                        value="balanced"
                        checked={formalityLevel === 'balanced'}
                        onChange={(e) => setFormalityLevel(e.target.value as 'balanced')}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Balanced</span>
                        <p className="text-xs text-gray-600">Good for blogs, articles, and mixed audiences. Only well-established slang is protected.</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="formality"
                        value="formal"
                        checked={formalityLevel === 'formal'}
                        onChange={(e) => setFormalityLevel(e.target.value as 'formal')}
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Formal</span>
                        <p className="text-xs text-gray-600">Best for professional content, academic writing, and business communications. No slang protection.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Advanced Features Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Advanced Features</h2>
            
            {/* SEO Content Optimization */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <span className="mr-2">🔍</span>
                    SEO Content Optimization
                  </h3>
                  <p className="text-sm text-gray-600">
                    Optimize your content for search engines with keyword analysis and SEO suggestions
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="seo-optimization"
                    checked={seoOptimizationEnabled}
                    onChange={(e) => setSeoOptimizationEnabled(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="seo-optimization" className="ml-2 text-sm text-gray-700">
                    Enable SEO Optimization
                  </label>
                </div>
              </div>

              {seoOptimizationEnabled && (
                <div className="ml-6 space-y-6 border-l-2 border-purple-100 pl-6">
                  {/* Basic SEO Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Type
                      </label>
                      <select
                        value={seoContentType}
                        onChange={(e) => setSeoContentType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="blogPost">Blog Post</option>
                        <option value="article">Article</option>
                        <option value="socialMedia">Social Media</option>
                        <option value="email">Email</option>
                        <option value="landingPage">Landing Page</option>
                        <option value="productDescription">Product Description</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Keyword
                      </label>
                      <input
                        type="text"
                        value={seoPrimaryKeyword}
                        onChange={(e) => setSeoPrimaryKeyword(e.target.value)}
                        placeholder="Enter your main keyword"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Keywords
                    </label>
                    <input
                      type="text"
                      value={seoSecondaryKeywords.join(', ')}
                      onChange={(e) => setSeoSecondaryKeywords(e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                      placeholder="Enter secondary keywords (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience
                    </label>
                    <input
                      type="text"
                      value={seoTargetAudience}
                      onChange={(e) => setSeoTargetAudience(e.target.value)}
                      placeholder="e.g., digital marketers, small business owners"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Phase 3: Advanced SEO Features */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">⚡</span>
                      Advanced SEO Features
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SEO Templates */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-900">SEO Templates</h5>
                          <p className="text-sm text-gray-600">Pre-built content structures</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={seoTemplateEnabled}
                          onChange={(e) => setSeoTemplateEnabled(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Keyword Research */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-900">Keyword Research</h5>
                          <p className="text-sm text-gray-600">LSI and related keywords</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={seoKeywordResearch}
                          onChange={(e) => setSeoKeywordResearch(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Meta Optimization */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-900">Meta Optimization</h5>
                          <p className="text-sm text-gray-600">Title and description tags</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={seoMetaOptimization}
                          onChange={(e) => setSeoMetaOptimization(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Analytics Dashboard */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-900">Analytics Dashboard</h5>
                          <p className="text-sm text-gray-600">Performance metrics</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={seoAnalyticsDashboard}
                          onChange={(e) => setSeoAnalyticsDashboard(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Internal Linking */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-900">Internal Linking</h5>
                          <p className="text-sm text-gray-600">Link optimization suggestions</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={seoInternalLinking}
                          onChange={(e) => setSeoInternalLinking(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>

                      {/* Schema Markup */}
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                        <div>
                          <h5 className="font-medium text-gray-900">Schema Markup</h5>
                          <p className="text-sm text-gray-600">Structured data suggestions</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={seoSchemaMarkup}
                          onChange={(e) => setSeoSchemaMarkup(e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Meta Optimization Settings */}
                    {seoMetaOptimization && (
                      <div className="mt-6 space-y-4">
                        <h5 className="font-medium text-gray-900">Meta Tag Settings</h5>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Title (50-60 characters)
                          </label>
                          <input
                            type="text"
                            value={seoMetaTitle}
                            onChange={(e) => setSeoMetaTitle(e.target.value)}
                            placeholder="Enter your SEO title"
                            maxLength={60}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {seoMetaTitle.length}/60 characters
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Description (150-160 characters)
                          </label>
                          <textarea
                            value={seoMetaDescription}
                            onChange={(e) => setSeoMetaDescription(e.target.value)}
                            placeholder="Enter your meta description"
                            maxLength={160}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {seoMetaDescription.length}/160 characters
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Focus Keyphrase
                          </label>
                          <input
                            type="text"
                            value={seoFocusKeyphrase}
                            onChange={(e) => setSeoFocusKeyphrase(e.target.value)}
                            placeholder="Main keyphrase for this content"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}

                    {/* Readability Target */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Readability Target
                      </label>
                      <select
                        value={seoReadabilityTarget}
                        onChange={(e) => setSeoReadabilityTarget(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="easy">Easy (General audience)</option>
                        <option value="medium">Medium (Professional audience)</option>
                        <option value="difficult">Difficult (Expert audience)</option>
                      </select>
                    </div>

                    {/* Phase 4: Enterprise SEO Features */}
                    <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🚀</span>
                        Enterprise SEO Features
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Phase 4
                        </span>
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Competitor Analysis */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Competitor Analysis</h5>
                            <p className="text-sm text-gray-600">Track and analyze competitors</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoCompetitorTracking}
                            onChange={(e) => setSeoCompetitorTracking(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Content Gap Analysis */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Content Gap Analysis</h5>
                            <p className="text-sm text-gray-600">Identify content opportunities</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoContentGapAnalysis}
                            onChange={(e) => setSeoContentGapAnalysis(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Technical SEO */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Technical SEO</h5>
                            <p className="text-sm text-gray-600">Page speed and technical analysis</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoTechnicalSEO}
                            onChange={(e) => setSeoTechnicalSEO(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Local SEO */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Local SEO</h5>
                            <p className="text-sm text-gray-600">Location-based optimization</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoLocalSEO}
                            onChange={(e) => setSeoLocalSEO(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Multilingual SEO */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Multilingual SEO</h5>
                            <p className="text-sm text-gray-600">Multi-language optimization</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoMultilingual}
                            onChange={(e) => setSeoMultilingual(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Topic Authority */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Topic Authority</h5>
                            <p className="text-sm text-gray-600">Build domain expertise</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoTopicAuthority}
                            onChange={(e) => setSeoTopicAuthority(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* E-A-T Optimization */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">E-A-T Optimization</h5>
                            <p className="text-sm text-gray-600">Expertise, Authority, Trust</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoE_A_T_Optimization}
                            onChange={(e) => setSeoE_A_T_Optimization(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Featured Snippets */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Featured Snippets</h5>
                            <p className="text-sm text-gray-600">Optimize for position zero</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoFeaturedSnippets}
                            onChange={(e) => setSeoFeaturedSnippets(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>

                        {/* Voice Search */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                          <div>
                            <h5 className="font-medium text-gray-900">Voice Search</h5>
                            <p className="text-sm text-gray-600">Conversational queries</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={seoVoiceSearch}
                            onChange={(e) => setSeoVoiceSearch(e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      {/* Local SEO Settings */}
                      {seoLocalSEO && (
                        <div className="mt-6 space-y-4">
                          <h5 className="font-medium text-gray-900">Local SEO Configuration</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name
                              </label>
                              <input
                                type="text"
                                value={seoLocalBusiness}
                                onChange={(e) => setSeoLocalBusiness(e.target.value)}
                                placeholder="Your business name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Primary Location
                              </label>
                              <input
                                type="text"
                                value={seoLocalLocation}
                                onChange={(e) => setSeoLocalLocation(e.target.value)}
                                placeholder="City, State/Country"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multilingual Settings */}
                      {seoMultilingual && (
                        <div className="mt-6 space-y-4">
                          <h5 className="font-medium text-gray-900">Multilingual Configuration</h5>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Target Languages
                            </label>
                            <input
                              type="text"
                              value={seoTargetLanguages.join(', ')}
                              onChange={(e) => setSeoTargetLanguages(e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
                              placeholder="English, Spanish, French (comma-separated)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Competitor URLs Settings */}
                      {seoCompetitorTracking && (
                        <div className="mt-6 space-y-4">
                          <h5 className="font-medium text-gray-900">Competitor URLs</h5>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Competitor Websites
                            </label>
                            <textarea
                              value={seoCompetitorUrls.join('\n')}
                              onChange={(e) => setSeoCompetitorUrls(e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                              placeholder="https://competitor1.com&#10;https://competitor2.com&#10;(one URL per line)"
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Enter one competitor URL per line for analysis
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-blue-800 text-sm font-medium">
                Settings are automatically saved as you make changes.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SettingsPage 