import React from 'react';
import { useEditorStore } from '../../store/editorStore';

interface SEOMetric {
  label: string;
  value: number;
  maxValue: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  description: string;
}

interface KeywordMetric {
  keyword: string;
  density: number;
  frequency: number;
  placement: string[];
  score: number;
}

export const SEOAnalyticsDashboard: React.FC = () => {
  const {
    content,
    seoContentScore,
    seoPrimaryKeyword,
    seoSecondaryKeywords,
    seoLSIKeywords,
    seoAnalyticsDashboard,
    setSeoAnalyticsDashboard
  } = useEditorStore();

  // Calculate SEO metrics from content
  const calculateSEOMetrics = (): SEOMetric[] => {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = content.length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const headings = (content.match(/^#+\s+.+$/gm) || []).length;
    
    // Calculate readability (simplified Flesch-Kincaid)
    const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
    const readabilityScore = Math.max(0, Math.min(100, 206.835 - (1.015 * avgWordsPerSentence)));
    
    // Calculate keyword density
    const primaryKeywordDensity = seoPrimaryKeyword ? 
      (content.toLowerCase().split(seoPrimaryKeyword.toLowerCase()).length - 1) / wordCount * 100 : 0;
    
    return [
      {
        label: 'Content Score',
        value: seoContentScore,
        maxValue: 100,
        status: seoContentScore >= 80 ? 'excellent' : seoContentScore >= 60 ? 'good' : seoContentScore >= 40 ? 'needs-improvement' : 'poor',
        description: 'Overall SEO optimization score based on multiple factors'
      },
      {
        label: 'Word Count',
        value: wordCount,
        maxValue: 2500,
        status: wordCount >= 1500 ? 'excellent' : wordCount >= 800 ? 'good' : wordCount >= 300 ? 'needs-improvement' : 'poor',
        description: 'Optimal word count for search engine visibility'
      },
      {
        label: 'Readability Score',
        value: Math.round(readabilityScore),
        maxValue: 100,
        status: readabilityScore >= 70 ? 'excellent' : readabilityScore >= 60 ? 'good' : readabilityScore >= 40 ? 'needs-improvement' : 'poor',
        description: 'How easy your content is to read and understand'
      },
      {
        label: 'Heading Structure',
        value: headings,
        maxValue: 10,
        status: headings >= 5 ? 'excellent' : headings >= 3 ? 'good' : headings >= 1 ? 'needs-improvement' : 'poor',
        description: 'Number of headings for better content structure'
      },
      {
        label: 'Keyword Density',
        value: Math.round(primaryKeywordDensity * 10) / 10,
        maxValue: 3,
        status: primaryKeywordDensity >= 1 && primaryKeywordDensity <= 2.5 ? 'excellent' : 
                primaryKeywordDensity >= 0.5 && primaryKeywordDensity <= 3 ? 'good' : 
                primaryKeywordDensity > 3 ? 'needs-improvement' : 'poor',
        description: 'Primary keyword density (1-2.5% is optimal)'
      },
      {
        label: 'Paragraph Count',
        value: paragraphs,
        maxValue: 15,
        status: paragraphs >= 5 ? 'excellent' : paragraphs >= 3 ? 'good' : paragraphs >= 2 ? 'needs-improvement' : 'poor',
        description: 'Number of paragraphs for better readability'
      }
    ];
  };

  const calculateKeywordMetrics = (): KeywordMetric[] => {
    const allKeywords = [seoPrimaryKeyword, ...seoSecondaryKeywords, ...seoLSIKeywords].filter(Boolean);
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    return allKeywords.map(keyword => {
      const frequency = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
      const density = wordCount > 0 ? (frequency / wordCount) * 100 : 0;
      
      // Check keyword placement
      const placement = [];
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        const firstParagraph = content.split('\n\n')[0] || '';
        const lastParagraph = content.split('\n\n').slice(-1)[0] || '';
        
        if (firstParagraph.toLowerCase().includes(keyword.toLowerCase())) placement.push('introduction');
        if (lastParagraph.toLowerCase().includes(keyword.toLowerCase())) placement.push('conclusion');
        if ((content.match(/^#+.*$/gm) || []).some(h => h.toLowerCase().includes(keyword.toLowerCase()))) {
          placement.push('headings');
        }
      }
      
      // Calculate score based on density and placement
      let score = 0;
      if (density >= 0.5 && density <= 2.5) score += 40;
      else if (density > 0) score += 20;
      
      score += placement.length * 20;
      
      return {
        keyword,
        density: Math.round(density * 10) / 10,
        frequency,
        placement,
        score: Math.min(100, score)
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!seoAnalyticsDashboard) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Analytics Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Get detailed insights into your content's SEO performance and optimization opportunities.
          </p>
          <button
            onClick={() => setSeoAnalyticsDashboard(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable Analytics
          </button>
        </div>
      </div>
    );
  }

  const seoMetrics = calculateSEOMetrics();
  const keywordMetrics = calculateKeywordMetrics();
  const overallScore = seoMetrics.reduce((sum, metric) => sum + (metric.value / metric.maxValue * 100), 0) / seoMetrics.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SEO Analytics Dashboard</h3>
          <p className="text-sm text-gray-600">Real-time analysis of your content's SEO performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{Math.round(overallScore)}%</div>
            <div className="text-sm text-gray-500">Overall Score</div>
          </div>
          <button
            onClick={() => setSeoAnalyticsDashboard(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Hide Analytics
          </button>
        </div>
      </div>

      {/* SEO Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seoMetrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{metric.label}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.status)}`}>
                {metric.status.replace('-', ' ')}
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{metric.value}</span>
                <span className="text-gray-500">/ {metric.maxValue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(metric.status)}`}
                  style={{ width: `${Math.min(100, (metric.value / metric.maxValue) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-xs text-gray-600">{metric.description}</p>
          </div>
        ))}
      </div>

      {/* Keyword Analysis */}
      {keywordMetrics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Keyword Analysis</h4>
          
          <div className="space-y-4">
            {keywordMetrics.map((keyword, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{keyword.keyword}</span>
                    {index === 0 && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">{keyword.score}%</div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Density:</span>
                    <span className="ml-1 font-medium">{keyword.density}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-1 font-medium">{keyword.frequency} times</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Placement:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {keyword.placement.length > 0 ? (
                        keyword.placement.map((place, i) => (
                          <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {place}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">SEO Recommendations</h4>
        
        <div className="space-y-3">
          {seoMetrics
            .filter(metric => metric.status === 'poor' || metric.status === 'needs-improvement')
            .map((metric, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Improve {metric.label}</h5>
                  <p className="text-sm text-gray-600 mt-1">{metric.description}</p>
                  <div className="text-sm text-yellow-800 mt-2">
                    Current: {metric.value} | Target: {Math.round(metric.maxValue * 0.7)}+
                  </div>
                </div>
              </div>
            ))}
          
          {seoMetrics.every(metric => metric.status === 'excellent' || metric.status === 'good') && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Great SEO Performance!</h5>
                <p className="text-sm text-gray-600">Your content is well-optimized for search engines.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Structure Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Content Structure</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Document Stats</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Words:</span>
                <span className="font-medium">{content.split(/\s+/).filter(w => w.length > 0).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Characters:</span>
                <span className="font-medium">{content.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sentences:</span>
                <span className="font-medium">{content.split(/[.!?]+/).filter(s => s.trim().length > 0).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paragraphs:</span>
                <span className="font-medium">{content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Heading Structure</h5>
            <div className="space-y-2 text-sm">
              {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((level, index) => {
                const count = (content.match(new RegExp(`^#{${index + 1}}\\s+.+$`, 'gm')) || []).length;
                return (
                  <div key={level} className="flex justify-between">
                    <span className="text-gray-600">{level} Headings:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SEOAnalyticsDashboard; 