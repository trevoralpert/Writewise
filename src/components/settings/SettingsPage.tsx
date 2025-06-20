import React from 'react'
import { useEditorStore } from '../../store/editorStore'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { 
    demonetizationEnabled, 
    setDemonetizationEnabled,
    grammarEnabled,
    setGrammarEnabled,
    styleEnabled,
    setStyleEnabled
  } = useEditorStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Editor
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Writing Features</h2>
            
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

            </div>
          </div>

          {/* Future Features Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
            <div className="space-y-4">
              
              {/* Placeholder for future features */}
              <div className="flex items-center justify-between opacity-50">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">SEO Optimization</h3>
                  <p className="text-gray-600 text-sm">Optimize content for search engines with keyword suggestions and readability analysis.</p>
                </div>
                <div className="ml-6">
                  <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                    <div className="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5"></div>
                  </div>
                </div>
              </div>

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