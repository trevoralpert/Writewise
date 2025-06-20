import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface TechnicalSEOScore {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  issues: string[];
  recommendations: string[];
}

export const TechnicalSEO: React.FC = () => {
  const {
    content,
    seoMobileFirst,
    seoPageSpeed,
    seoCoreWebVitals,
    seoAdvancedSchema,
    seoSchemaTypes
  } = useEditorStore();

  const [technicalScores, setTechnicalScores] = useState<TechnicalSEOScore[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeTechnicalSEO = () => {
    setIsAnalyzing(true);
    
    // Mock technical SEO analysis
    setTimeout(() => {
      const mockScores: TechnicalSEOScore[] = [
        {
          category: 'Page Speed',
          score: 78,
          status: 'good',
          issues: [
            'Large images not optimized',
            'Unused CSS detected',
            'JavaScript blocking render'
          ],
          recommendations: [
            'Compress images using WebP format',
            'Remove unused CSS rules',
            'Defer non-critical JavaScript',
            'Enable browser caching'
          ]
        },
        {
          category: 'Core Web Vitals',
          score: 65,
          status: 'needs-improvement',
          issues: [
            'Largest Contentful Paint: 3.2s (should be < 2.5s)',
            'First Input Delay: 150ms (should be < 100ms)',
            'Cumulative Layout Shift: 0.15 (should be < 0.1)'
          ],
          recommendations: [
            'Optimize server response time',
            'Preload critical resources',
            'Reserve space for dynamic content',
            'Optimize third-party scripts'
          ]
        },
        {
          category: 'Mobile Usability',
          score: 92,
          status: 'excellent',
          issues: [
            'Small clickable elements detected'
          ],
          recommendations: [
            'Increase touch target sizes to 44px minimum',
            'Test on various mobile devices'
          ]
        },
        {
          category: 'Structured Data',
          score: 45,
          status: 'poor',
          issues: [
            'No schema markup detected',
            'Missing breadcrumb markup',
            'Article schema incomplete'
          ],
          recommendations: [
            'Add JSON-LD structured data',
            'Implement Article schema',
            'Add breadcrumb navigation markup',
            'Include organization schema'
          ]
        },
        {
          category: 'Crawlability',
          score: 88,
          status: 'excellent',
          issues: [
            'Some internal links have no anchor text'
          ],
          recommendations: [
            'Add descriptive anchor text to all internal links',
            'Create XML sitemap',
            'Optimize robots.txt'
          ]
        },
        {
          category: 'Security',
          score: 95,
          status: 'excellent',
          issues: [],
          recommendations: [
            'Maintain HTTPS certificate',
            'Keep security headers updated'
          ]
        }
      ];

      setTechnicalScores(mockScores);
      setIsAnalyzing(false);
    }, 1500);
  };

  useEffect(() => {
    if (content) {
      analyzeTechnicalSEO();
    }
  }, [content]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const overallScore = technicalScores.length > 0 
    ? Math.round(technicalScores.reduce((sum, score) => sum + score.score, 0) / technicalScores.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Technical SEO Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive technical SEO audit and optimization recommendations
          </p>
        </div>
        <button
          onClick={analyzeTechnicalSEO}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Re-analyze</span>
            </>
          )}
        </button>
      </div>

      {/* Overall Score */}
      {technicalScores.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <p className="text-gray-600 text-sm">Overall Technical SEO Score</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(overallScore)}`}
                style={{ width: `${overallScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Technical SEO Categories */}
      {technicalScores.length > 0 ? (
        <div className="grid gap-6">
          {technicalScores.map((category, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">{category.category}</h4>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(category.status)}`}>
                    {category.status.replace('-', ' ')}
                  </span>
                  <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                    {category.score}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(category.score)}`}
                  style={{ width: `${category.score}%` }}
                ></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Issues */}
                {category.issues.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-700 mb-2 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Issues Found
                    </h5>
                    <ul className="space-y-1">
                      {category.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <span className="text-red-500 mr-2 flex-shrink-0">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h5 className="font-medium text-green-700 mb-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Recommendations
                  </h5>
                  <ul className="space-y-1">
                    {category.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2 flex-shrink-0">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">🔍</div>
            <p>Analyzing technical SEO factors...</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {technicalScores.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-purple-600 text-2xl mb-2">🚀</div>
              <h5 className="font-medium text-gray-900 mb-1">Optimize Images</h5>
              <p className="text-xs text-gray-600">Compress and convert images to WebP format</p>
            </button>
            
            <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-purple-600 text-2xl mb-2">📱</div>
              <h5 className="font-medium text-gray-900 mb-1">Mobile Optimization</h5>
              <p className="text-xs text-gray-600">Test and optimize mobile experience</p>
            </button>
            
            <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-purple-600 text-2xl mb-2">🏗️</div>
              <h5 className="font-medium text-gray-900 mb-1">Add Schema Markup</h5>
              <p className="text-xs text-gray-600">Implement structured data for better visibility</p>
            </button>
            
            <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-purple-600 text-2xl mb-2">⚡</div>
              <h5 className="font-medium text-gray-900 mb-1">Speed Optimization</h5>
              <p className="text-xs text-gray-600">Improve Core Web Vitals scores</p>
            </button>
            
            <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-purple-600 text-2xl mb-2">🔗</div>
              <h5 className="font-medium text-gray-900 mb-1">Internal Linking</h5>
              <p className="text-xs text-gray-600">Optimize internal link structure</p>
            </button>
            
            <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
              <div className="text-purple-600 text-2xl mb-2">🛡️</div>
              <h5 className="font-medium text-gray-900 mb-1">Security Check</h5>
              <p className="text-xs text-gray-600">Verify HTTPS and security headers</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 