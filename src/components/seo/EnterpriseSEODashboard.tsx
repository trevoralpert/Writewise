import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CompetitorAnalysis } from './CompetitorAnalysis';
import { TechnicalSEO } from './TechnicalSEO';

export const EnterpriseSEODashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    content,
    seoAuthorityScore,
    seoContentScore,
    seoPrimaryKeyword,
    seoSecondaryKeywords,
    seoCompetitorUrls,
    seoLocalBusiness,
    seoTargetLanguages
  } = useEditorStore();

  // Mock enterprise metrics
  const enterpriseMetrics = {
    domainAuthority: 45,
    topicAuthority: 72,
    contentGapScore: 38,
    technicalSEOScore: 81,
    localSEOScore: 65,
    multilingualCoverage: 3,
    featuredSnippetOpportunities: 12,
    voiceSearchOptimization: 58
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'competitor', name: 'Competitor Analysis', icon: '🔍' },
    { id: 'technical', name: 'Technical SEO', icon: '⚙️' },
    { id: 'authority', name: 'Topic Authority', icon: '🏆' },
    { id: 'local', name: 'Local SEO', icon: '📍' },
    { id: 'multilingual', name: 'Multilingual', icon: '🌍' },
    { id: 'advanced', name: 'Advanced Features', icon: '🚀' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Enterprise Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {enterpriseMetrics.domainAuthority}
            </div>
            <p className="text-xs text-gray-600">Domain Authority</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {enterpriseMetrics.topicAuthority}
            </div>
            <p className="text-xs text-gray-600">Topic Authority</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {enterpriseMetrics.technicalSEOScore}
            </div>
            <p className="text-xs text-gray-600">Technical SEO</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {enterpriseMetrics.featuredSnippetOpportunities}
            </div>
            <p className="text-xs text-gray-600">Snippet Opportunities</p>
          </div>
        </div>
      </div>

      {/* Content Analysis Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Content Analysis Overview</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Current Content Stats</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Word Count:</span>
                <span className="font-medium">{content.split(' ').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Primary Keyword:</span>
                <span className="font-medium">{seoPrimaryKeyword || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Secondary Keywords:</span>
                <span className="font-medium">{seoSecondaryKeywords.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Competitors Tracked:</span>
                <span className="font-medium">{seoCompetitorUrls.length}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3">SEO Opportunities</h5>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <span className="text-sm text-yellow-800">Content Gap Analysis</span>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">High Impact</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-sm text-blue-800">Featured Snippets</span>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">12 Opportunities</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm text-green-800">Voice Search</span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Optimize</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Quick Enterprise Actions</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('competitor')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="text-purple-600 text-2xl mb-2">🔍</div>
            <h5 className="font-medium text-gray-900 mb-1">Analyze Competitors</h5>
            <p className="text-xs text-gray-600">Identify content gaps and opportunities</p>
          </button>
          
          <button
            onClick={() => setActiveTab('technical')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="text-purple-600 text-2xl mb-2">⚙️</div>
            <h5 className="font-medium text-gray-900 mb-1">Technical Audit</h5>
            <p className="text-xs text-gray-600">Comprehensive technical SEO analysis</p>
          </button>
          
          <button
            onClick={() => setActiveTab('authority')}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <div className="text-purple-600 text-2xl mb-2">🏆</div>
            <h5 className="font-medium text-gray-900 mb-1">Build Authority</h5>
            <p className="text-xs text-gray-600">Improve topic and domain authority</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTopicAuthority = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏆</span>
          Topic Authority Analysis
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Authority Score</h5>
            <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {enterpriseMetrics.topicAuthority}
              </div>
              <p className="text-sm text-gray-600">Topic Authority Score</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${enterpriseMetrics.topicAuthority}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Authority Building Strategy</h5>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h6 className="font-medium text-gray-900 text-sm">Content Depth</h6>
                <p className="text-xs text-gray-600 mt-1">Create comprehensive, authoritative content</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <h6 className="font-medium text-gray-900 text-sm">Expertise Signals</h6>
                <p className="text-xs text-gray-600 mt-1">Demonstrate subject matter expertise</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-yellow-500 h-1 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <h6 className="font-medium text-gray-900 text-sm">Content Clusters</h6>
                <p className="text-xs text-gray-600 mt-1">Build topic clusters and internal linking</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocalSEO = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📍</span>
          Local SEO Optimization
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Local Business Information</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Business Name</label>
                <p className="text-sm font-medium text-gray-900">
                  {seoLocalBusiness || 'Not configured'}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Local SEO Score</label>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${enterpriseMetrics.localSEOScore}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-orange-600">
                    {enterpriseMetrics.localSEOScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Local SEO Checklist</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-700">Google My Business optimized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="text-sm text-gray-700">Local citations needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">×</span>
                </div>
                <span className="text-sm text-gray-700">Local schema markup missing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMultilingual = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🌍</span>
          Multilingual SEO
        </h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Language Coverage</h5>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {enterpriseMetrics.multilingualCoverage}
              </div>
              <p className="text-sm text-gray-600">Languages Supported</p>
            </div>
            
            <div className="mt-4 space-y-2">
              {seoTargetLanguages.length > 0 ? (
                seoTargetLanguages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{lang}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No target languages configured</p>
              )}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Multilingual Opportunities</h5>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h6 className="font-medium text-gray-900 text-sm">Hreflang Implementation</h6>
                <p className="text-xs text-gray-600 mt-1">Add hreflang tags for language targeting</p>
                <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Needs Setup
                </span>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <h6 className="font-medium text-gray-900 text-sm">Content Translation</h6>
                <p className="text-xs text-gray-600 mt-1">Translate content for target markets</p>
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  In Progress
                </span>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-lg">
                <h6 className="font-medium text-gray-900 text-sm">Regional Keyword Research</h6>
                <p className="text-xs text-gray-600 mt-1">Research keywords for each target region</p>
                <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedFeatures = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Featured Snippets */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⭐</span>
            Featured Snippets
          </h4>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {enterpriseMetrics.featuredSnippetOpportunities}
            </div>
            <p className="text-sm text-gray-600">Optimization Opportunities</p>
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-orange-50 rounded text-sm">
              <span className="font-medium">Paragraph Snippets:</span> 8 opportunities
            </div>
            <div className="p-2 bg-blue-50 rounded text-sm">
              <span className="font-medium">List Snippets:</span> 3 opportunities
            </div>
            <div className="p-2 bg-green-50 rounded text-sm">
              <span className="font-medium">Table Snippets:</span> 1 opportunity
            </div>
          </div>
        </div>

        {/* Voice Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎤</span>
            Voice Search Optimization
          </h4>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {enterpriseMetrics.voiceSearchOptimization}%
            </div>
            <p className="text-sm text-gray-600">Voice Search Readiness</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${enterpriseMetrics.voiceSearchOptimization}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Question-based content:</span>
              <span className="font-medium">Good</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversational tone:</span>
              <span className="font-medium">Needs improvement</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Local intent coverage:</span>
              <span className="font-medium">Excellent</span>
            </div>
          </div>
        </div>
      </div>

      {/* E-A-T Optimization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          E-A-T Optimization (Expertise, Authoritativeness, Trustworthiness)
        </h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">75</div>
            <p className="text-sm text-gray-600">Expertise Score</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">68</div>
            <p className="text-sm text-gray-600">Authority Score</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">82</div>
            <p className="text-sm text-gray-600">Trust Score</p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Recommendation:</strong> Add author bio and credentials to improve expertise signals
            </p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Recommendation:</strong> Include references and citations to boost authoritativeness
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Enterprise SEO Dashboard</h3>
          <p className="text-sm text-gray-600 mt-1">
            Advanced SEO analysis and optimization tools for enterprise-level content strategy
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            Enterprise
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Phase 4
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'competitor' && <CompetitorAnalysis />}
        {activeTab === 'technical' && <TechnicalSEO />}
        {activeTab === 'authority' && renderTopicAuthority()}
        {activeTab === 'local' && renderLocalSEO()}
        {activeTab === 'multilingual' && renderMultilingual()}
        {activeTab === 'advanced' && renderAdvancedFeatures()}
      </div>
    </div>
  );
}; 