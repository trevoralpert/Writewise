import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

export const CompetitorAnalysis: React.FC = () => {
  const {
    seoCompetitorUrls,
    setSeoCompetitorUrls,
    seoContentGapAnalysis,
    content
  } = useEditorStore();

  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addCompetitor = () => {
    if (newCompetitorUrl && !seoCompetitorUrls.includes(newCompetitorUrl)) {
      setSeoCompetitorUrls([...seoCompetitorUrls, newCompetitorUrl]);
      setNewCompetitorUrl('');
    }
  };

  const removeCompetitor = (url: string) => {
    setSeoCompetitorUrls(seoCompetitorUrls.filter(u => u !== url));
  };

  const analyzeCompetitors = async () => {
    if (seoCompetitorUrls.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // Mock competitor analysis - in real implementation, this would call external APIs
      const mockResults = {
        contentGaps: [
          {
            keyword: 'SEO best practices',
            competitorCoverage: 85,
            yourCoverage: 45,
            opportunity: 'high',
            suggestions: [
              'Add section on technical SEO fundamentals',
              'Include mobile-first indexing guidelines',
              'Expand on Core Web Vitals optimization'
            ]
          },
          {
            keyword: 'content marketing strategy',
            competitorCoverage: 92,
            yourCoverage: 60,
            opportunity: 'medium',
            suggestions: [
              'Add content calendar planning section',
              'Include social media integration tips',
              'Expand on content distribution strategies'
            ]
          }
        ],
        keywordGaps: [
          'long-tail SEO keywords',
          'voice search optimization',
          'local SEO tactics',
          'e-commerce SEO'
        ],
        competitorStrengths: [
          {
            competitor: seoCompetitorUrls[0],
            strengths: ['High-quality backlinks', 'Comprehensive content', 'Fast loading speed'],
            weaknesses: ['Poor mobile experience', 'Limited internal linking']
          }
        ],
        recommendedActions: [
          {
            priority: 'high',
            action: 'Create content targeting "voice search optimization"',
            impact: 'Could capture 15% more organic traffic',
            effort: 'medium'
          },
          {
            priority: 'medium',
            action: 'Improve internal linking structure',
            impact: 'Better page authority distribution',
            effort: 'low'
          }
        ]
      };

      setTimeout(() => {
        setAnalysisResults(mockResults);
        setIsAnalyzing(false);
      }, 2000);
    } catch (error) {
      console.error('Competitor analysis failed:', error);
      setIsAnalyzing(false);
    }
  };

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Competitor Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track competitors and identify content gaps to improve your SEO strategy
          </p>
        </div>
      </div>

      {/* Competitor URL Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Competitor URLs</h4>
        
        {/* Add Competitor */}
        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={newCompetitorUrl}
            onChange={(e) => setNewCompetitorUrl(e.target.value)}
            placeholder="Enter competitor URL (e.g., https://competitor.com)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={addCompetitor}
            disabled={!newCompetitorUrl}
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>

        {/* Competitor List */}
        {seoCompetitorUrls.length > 0 ? (
          <div className="space-y-2">
            {seoCompetitorUrls.map((url, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-medium text-sm">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-900 font-medium">{url}</span>
                </div>
                <button
                  onClick={() => removeCompetitor(url)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No competitors added yet</p>
            <p className="text-xs mt-1">Add competitor URLs to start analyzing content gaps</p>
          </div>
        )}
      </div>

      {/* Analysis Controls */}
      {seoCompetitorUrls.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={analyzeCompetitors}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Analyze Competitors</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <div className="space-y-6">
          {/* Content Gaps */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Content Gap Analysis
            </h4>
            <div className="space-y-4">
              {analysisResults.contentGaps.map((gap: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">{gap.keyword}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOpportunityColor(gap.opportunity)}`}>
                      {gap.opportunity} opportunity
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Competitor Coverage</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${gap.competitorCoverage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{gap.competitorCoverage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Your Coverage</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${gap.yourCoverage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{gap.yourCoverage}%</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Improvement Suggestions:</p>
                    <ul className="space-y-1">
                      {gap.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-start">
                          <span className="text-purple-500 mr-2">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Gaps */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Missing Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysisResults.keywordGaps.map((keyword: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Recommended Actions
            </h4>
            <div className="space-y-3">
              {analysisResults.recommendedActions.map((action: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    action.priority === 'high' ? 'bg-red-500' : 
                    action.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{action.action}</p>
                    <p className="text-xs text-gray-600 mt-1">{action.impact}</p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className={`text-xs px-2 py-1 rounded ${getOpportunityColor(action.priority)}`}>
                        {action.priority} priority
                      </span>
                      <span className="text-xs text-gray-500">Effort: {action.effort}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 