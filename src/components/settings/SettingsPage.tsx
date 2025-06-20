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
    hasUnsavedChanges
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Features</h2>
            <div className="space-y-4">
              
              {/* SEO Content Optimization */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    SEO Content Optimization
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Optimize your content for search engines with keyword analysis, readability scoring, and SEO best practices. 
                    Get suggestions for better keyword placement, content structure, and meta optimization.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="inline-block w-3 h-3 bg-purple-400 rounded-full"></span>
                    <span>Purple wavy underlines indicate SEO optimization opportunities</span>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seoOptimizationEnabled}
                      onChange={(e) => setSeoOptimizationEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {/* SEO Configuration */}
              {seoOptimizationEnabled && (
                <div className="border-t pt-6 space-y-6">
                  {/* Content Type */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Content Type
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Select the type of content you're creating for tailored SEO recommendations.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'blogPost', name: 'Blog Post', icon: '📝', description: 'Long-form articles' },
                        { id: 'article', name: 'Article', icon: '📰', description: 'News or informational content' },
                        { id: 'socialMedia', name: 'Social Media', icon: '📱', description: 'Social platform posts' },
                        { id: 'email', name: 'Email', icon: '📧', description: 'Email newsletters' },
                        { id: 'landingPage', name: 'Landing Page', icon: '🎯', description: 'Marketing pages' },
                        { id: 'productDescription', name: 'Product Description', icon: '🛍️', description: 'E-commerce content' }
                      ].map((type) => (
                        <label key={type.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                          <input
                            type="radio"
                            name="contentType"
                            value={type.id}
                            checked={seoContentType === type.id}
                            onChange={(e) => setSeoContentType(e.target.value as any)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg">{type.icon}</span>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{type.name}</span>
                              <p className="text-xs text-gray-600">{type.description}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Primary Keyword */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Primary Keyword
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Enter the main keyword you want to optimize for. This will be used for keyword density analysis.
                    </p>
                    <input
                      type="text"
                      value={seoPrimaryKeyword}
                      onChange={(e) => setSeoPrimaryKeyword(e.target.value)}
                      placeholder="e.g., content marketing, SEO optimization"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Secondary Keywords */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Secondary Keywords
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Add related keywords separated by commas. These help with semantic SEO analysis.
                    </p>
                    <input
                      type="text"
                      value={seoSecondaryKeywords.join(', ')}
                      onChange={(e) => setSeoSecondaryKeywords(e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                      placeholder="e.g., digital marketing, search optimization, content strategy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Target Audience
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      Describe your target audience to get more relevant SEO suggestions.
                    </p>
                    <input
                      type="text"
                      value={seoTargetAudience}
                      onChange={(e) => setSeoTargetAudience(e.target.value)}
                      placeholder="e.g., small business owners, digital marketers, beginners"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between opacity-50 border-t pt-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Tone Adjustment</h3>
                  <p className="text-gray-600 text-sm">Adjust writing tone for different audiences (professional, casual, persuasive, etc.).</p>
                </div>
                <div className="ml-6">
                  <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                    <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between opacity-50 border-t pt-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Content Expansion</h3>
                  <p className="text-gray-600 text-sm">AI-powered suggestions to expand and enhance your content with relevant ideas.</p>
                </div>
                <div className="ml-6">
                  <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                    <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5"></div>
                  </div>
                </div>
              </div>

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