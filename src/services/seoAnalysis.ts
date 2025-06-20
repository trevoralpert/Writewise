// SEO Content Analysis Service
// Comprehensive SEO analysis and optimization suggestions

export interface SEOAnalysisResult {
  overallScore: number;
  keywordAnalysis: KeywordAnalysis;
  contentStructure: ContentStructureAnalysis;
  readabilityAnalysis: ReadabilityAnalysis;
  recommendations: SEORecommendation[];
  issues: SEOIssue[];
}

export interface KeywordAnalysis {
  primaryKeyword?: string;
  keywordDensity: number;
  keywordPlacement: KeywordPlacement;
  score: number;
}

export interface KeywordPlacement {
  inTitle: boolean;
  inFirstParagraph: boolean;
  inHeadings: number;
  inConclusion: boolean;
}

export interface ContentStructureAnalysis {
  wordCount: number;
  contentType: string;
  headingStructure: HeadingStructure;
  paragraphStructure: ParagraphStructure;
  score: number;
}

export interface HeadingStructure {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  totalHeadings: number;
  keywordInHeadings: number;
}

export interface ParagraphStructure {
  totalParagraphs: number;
  avgWordsPerParagraph: number;
  shortParagraphs: number;
  longParagraphs: number;
}

export interface ReadabilityAnalysis {
  fleschKincaidScore: number;
  readabilityLevel: string;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  complexWords: number;
  score: number;
}

export interface SEORecommendation {
  type: 'keyword' | 'content' | 'structure' | 'readability';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestion: string;
  examples: string[];
  impact: string;
}

export interface SEOIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  solution: string;
  location?: string;
}

// SEO Rules and Standards
const SEO_RULES = {
  keywordDensity: {
    primary: { optimal: 0.015, min: 0.005, max: 0.03, warning: 0.025, critical: 0.035 }
  },
  contentLength: {
    blogPost: { min: 1500, optimal: 2500, max: 4000 },
    article: { min: 800, optimal: 1200, max: 2000 },
    general: { min: 300, optimal: 800, max: 2000 }
  },
  readability: {
    fleschKincaid: { optimal: 70, min: 60, max: 80, warning: 50, critical: 40 },
    avgSentenceLength: { optimal: 15, min: 10, max: 20, warning: 25, critical: 30 }
  }
};

/**
 * Main SEO Analysis Function
 */
export function analyzeSEOOptimization(
  text: string,
  contentType: string = 'general',
  primaryKeyword?: string
): SEOAnalysisResult {
  // Initialize analysis components
  const keywordAnalysis = analyzeKeywords(text, primaryKeyword);
  const contentStructure = analyzeContentStructure(text, contentType);
  const readabilityAnalysis = analyzeReadability(text);

  // Calculate overall score
  const overallScore = calculateOverallSEOScore({
    keywordAnalysis,
    contentStructure,
    readabilityAnalysis
  });

  // Generate recommendations and identify issues
  const recommendations = generateSEORecommendations({
    keywordAnalysis,
    contentStructure,
    readabilityAnalysis,
    contentType,
    primaryKeyword
  });

  const issues = identifySEOIssues({
    keywordAnalysis,
    contentStructure,
    readabilityAnalysis
  });

  return {
    overallScore,
    keywordAnalysis,
    contentStructure,
    readabilityAnalysis,
    recommendations,
    issues
  };
}

/**
 * Keyword Analysis
 */
function analyzeKeywords(text: string, primaryKeyword?: string): KeywordAnalysis {
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  // Auto-detect primary keyword if not provided
  const detectedPrimary = primaryKeyword || detectPrimaryKeyword(text);
  
  // Calculate keyword density
  const primaryCount = detectedPrimary ? countKeywordOccurrences(text, detectedPrimary) : 0;
  const keywordDensity = primaryCount / totalWords;
  
  // Analyze keyword placement
  const keywordPlacement = analyzeKeywordPlacement(text, detectedPrimary);
  
  // Calculate keyword score
  const score = calculateKeywordScore(keywordDensity, keywordPlacement);

  return {
    primaryKeyword: detectedPrimary,
    keywordDensity,
    keywordPlacement,
    score
  };
}

/**
 * Content Structure Analysis
 */
function analyzeContentStructure(text: string, contentType: string): ContentStructureAnalysis {
  const words = text.split(/\s+/);
  const wordCount = words.length;
  
  // Analyze heading structure
  const headingStructure = analyzeHeadingStructure(text);
  
  // Analyze paragraph structure
  const paragraphStructure = analyzeParagraphStructure(text);
  
  // Calculate content structure score
  const score = calculateContentStructureScore({
    wordCount,
    contentType,
    headingStructure,
    paragraphStructure
  });

  return {
    wordCount,
    contentType,
    headingStructure,
    paragraphStructure,
    score
  };
}

/**
 * Readability Analysis
 */
function analyzeReadability(text: string): ReadabilityAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = countTotalSyllables(text);
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Calculate Flesch-Kincaid score
  const fleschKincaidScore = calculateFleschKincaidScore(avgSentenceLength, avgSyllablesPerWord);
  const readabilityLevel = getReadabilityLevel(fleschKincaidScore);
  const complexWords = countComplexWords(words);
  
  // Calculate readability score
  const score = calculateReadabilityScore(fleschKincaidScore, avgSentenceLength, complexWords);

  return {
    fleschKincaidScore,
    readabilityLevel,
    avgSentenceLength,
    avgSyllablesPerWord,
    complexWords,
    score
  };
}

// Helper Functions

function detectPrimaryKeyword(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: Record<string, number> = {};
  
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = words.slice(i, i + 2).join(' ');
    if (phrase.length > 4) {
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  }
  
  const sortedPhrases = Object.entries(phrases)
    .sort(([,a], [,b]) => b - a)
    .filter(([phrase, count]) => count > 1);
  
  return sortedPhrases[0]?.[0] || '';
}

function countKeywordOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(regex) || []).length;
}

function analyzeKeywordPlacement(text: string, primaryKeyword?: string): KeywordPlacement {
  if (!primaryKeyword) {
    return {
      inTitle: false,
      inFirstParagraph: false,
      inHeadings: 0,
      inConclusion: false
    };
  }
  
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const firstParagraph = paragraphs[0] || '';
  const lastParagraph = paragraphs[paragraphs.length - 1] || '';
  
  return {
    inTitle: text.toLowerCase().includes(primaryKeyword.toLowerCase()),
    inFirstParagraph: firstParagraph.toLowerCase().includes(primaryKeyword.toLowerCase()),
    inHeadings: (text.match(new RegExp(`#+.*${primaryKeyword}`, 'gi')) || []).length,
    inConclusion: lastParagraph.toLowerCase().includes(primaryKeyword.toLowerCase())
  };
}

function analyzeHeadingStructure(text: string): HeadingStructure {
  const headingMatches = text.match(/^#+\s+.+$/gm) || [];
  const structure: HeadingStructure = {
    h1Count: 0,
    h2Count: 0,
    h3Count: 0,
    totalHeadings: headingMatches.length,
    keywordInHeadings: 0
  };
  
  headingMatches.forEach(heading => {
    const level = heading.match(/^#+/)?.[0].length || 0;
    
    switch (level) {
      case 1: structure.h1Count++; break;
      case 2: structure.h2Count++; break;
      case 3: structure.h3Count++; break;
    }
  });
  
  return structure;
}

function analyzeParagraphStructure(text: string): ParagraphStructure {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const wordCounts = paragraphs.map(p => p.split(/\s+/).length);
  
  return {
    totalParagraphs: paragraphs.length,
    avgWordsPerParagraph: wordCounts.reduce((sum, count) => sum + count, 0) / paragraphs.length,
    shortParagraphs: wordCounts.filter(count => count < 50).length,
    longParagraphs: wordCounts.filter(count => count > 150).length
  };
}

function countTotalSyllables(text: string): number {
  const words = text.split(/\s+/);
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function calculateFleschKincaidScore(avgSentenceLength: number, avgSyllablesPerWord: number): number {
  return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
}

function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

function countComplexWords(words: string[]): number {
  return words.filter(word => countSyllables(word) >= 3).length;
}

// Scoring Functions

function calculateKeywordScore(density: number, placement: KeywordPlacement): number {
  let score = 0;
  const densityRule = SEO_RULES.keywordDensity.primary;
  
  // Density score (0-40 points)
  if (density >= densityRule.min && density <= densityRule.max) {
    score += 40;
  } else if (density < densityRule.min) {
    score += (density / densityRule.min) * 40;
  } else {
    score += Math.max(0, 40 - (density - densityRule.max) * 1000);
  }
  
  // Placement score (0-60 points)
  if (placement.inTitle) score += 15;
  if (placement.inFirstParagraph) score += 15;
  if (placement.inHeadings > 0) score += 15;
  if (placement.inConclusion) score += 15;
  
  return Math.min(100, score);
}

function calculateContentStructureScore(data: {
  wordCount: number;
  contentType: string;
  headingStructure: HeadingStructure;
  paragraphStructure: ParagraphStructure;
}): number {
  let score = 0;
  
  // Word count score (0-40 points)
  const lengthRule = SEO_RULES.contentLength[data.contentType as keyof typeof SEO_RULES.contentLength] || SEO_RULES.contentLength.general;
  if (data.wordCount >= lengthRule.min && data.wordCount <= (lengthRule.max || Infinity)) {
    score += 40;
  } else if (data.wordCount < lengthRule.min) {
    score += (data.wordCount / lengthRule.min) * 40;
  }
  
  // Heading structure score (0-30 points)
  if (data.headingStructure.h1Count === 1) score += 15;
  if (data.headingStructure.h2Count >= 2) score += 15;
  
  // Paragraph structure score (0-30 points)
  if (data.paragraphStructure.avgWordsPerParagraph >= 50 && data.paragraphStructure.avgWordsPerParagraph <= 150) {
    score += 20;
  }
  if (data.paragraphStructure.shortParagraphs / data.paragraphStructure.totalParagraphs < 0.3) {
    score += 10;
  }
  
  return Math.min(100, score);
}

function calculateReadabilityScore(fleschKincaid: number, avgSentenceLength: number, complexWords: number): number {
  let score = 0;
  
  // Flesch-Kincaid score (0-50 points)
  const readabilityRule = SEO_RULES.readability.fleschKincaid;
  if (fleschKincaid >= readabilityRule.min && fleschKincaid <= readabilityRule.max) {
    score += 50;
  } else {
    score += Math.max(0, 50 - Math.abs(fleschKincaid - readabilityRule.optimal));
  }
  
  // Sentence length score (0-30 points)
  const sentenceRule = SEO_RULES.readability.avgSentenceLength;
  if (avgSentenceLength >= sentenceRule.min && avgSentenceLength <= sentenceRule.max) {
    score += 30;
  } else {
    score += Math.max(0, 30 - Math.abs(avgSentenceLength - sentenceRule.optimal) * 2);
  }
  
  // Complex words score (0-20 points)
  const complexWordRatio = complexWords / 100;
  if (complexWordRatio <= 0.1) score += 20;
  else score += Math.max(0, 20 - complexWordRatio * 100);
  
  return Math.min(100, score);
}

function calculateOverallSEOScore(data: {
  keywordAnalysis: KeywordAnalysis;
  contentStructure: ContentStructureAnalysis;
  readabilityAnalysis: ReadabilityAnalysis;
}): number {
  const keywordWeight = 0.4;
  const contentWeight = 0.35;
  const readabilityWeight = 0.25;
  
  const weightedScore = 
    (data.keywordAnalysis.score * keywordWeight) +
    (data.contentStructure.score * contentWeight) +
    (data.readabilityAnalysis.score * readabilityWeight);
  
  return Math.round(weightedScore);
}

function generateSEORecommendations(data: {
  keywordAnalysis: KeywordAnalysis;
  contentStructure: ContentStructureAnalysis;
  readabilityAnalysis: ReadabilityAnalysis;
  contentType: string;
  primaryKeyword?: string;
}): SEORecommendation[] {
  const recommendations: SEORecommendation[] = [];
  
  // Keyword recommendations
  if (data.keywordAnalysis.score < 70) {
    recommendations.push({
      type: 'keyword',
      priority: 'high',
      title: 'Improve Keyword Optimization',
      description: 'Your keyword usage needs optimization for better SEO performance',
      suggestion: 'Optimize keyword density and placement throughout your content',
      examples: [
        'Include primary keyword in title and first paragraph',
        'Use keyword in 2-3 headings naturally',
        'Maintain 1-2% keyword density'
      ],
      impact: 'High - Better keyword optimization can significantly improve search rankings'
    });
  }
  
  // Content structure recommendations
  if (data.contentStructure.score < 70) {
    recommendations.push({
      type: 'structure',
      priority: 'high',
      title: 'Improve Content Structure',
      description: 'Your content structure needs improvement for better SEO',
      suggestion: 'Optimize heading hierarchy and content organization',
      examples: [
        'Add more H2 and H3 headings to break up content',
        'Ensure proper heading hierarchy (H1 → H2 → H3)',
        'Use descriptive headings that include keywords'
      ],
      impact: 'High - Better structure improves user experience and search rankings'
    });
  }
  
  // Readability recommendations
  if (data.readabilityAnalysis.score < 70) {
    recommendations.push({
      type: 'readability',
      priority: 'medium',
      title: 'Improve Content Readability',
      description: 'Your content readability can be improved for better user engagement',
      suggestion: 'Simplify sentences and improve paragraph structure',
      examples: [
        'Break up long sentences (aim for 15-20 words)',
        'Use shorter paragraphs (50-150 words)',
        'Replace complex words with simpler alternatives'
      ],
      impact: 'Medium - Better readability improves user engagement and time on page'
    });
  }
  
  return recommendations;
}

function identifySEOIssues(data: {
  keywordAnalysis: KeywordAnalysis;
  contentStructure: ContentStructureAnalysis;
  readabilityAnalysis: ReadabilityAnalysis;
}): SEOIssue[] {
  const issues: SEOIssue[] = [];
  
  // Keyword stuffing check
  if (data.keywordAnalysis.keywordDensity > 0.03) {
    issues.push({
      type: 'keywordStuffing',
      severity: 'critical',
      description: 'Keyword density is too high, which may hurt SEO performance',
      solution: 'Reduce keyword usage and focus on natural language',
      location: 'Throughout content'
    });
  }
  
  // Thin content check
  if (data.contentStructure.wordCount < 300) {
    issues.push({
      type: 'thinContent',
      severity: 'high',
      description: 'Content is too short to provide comprehensive value',
      solution: 'Expand content with more detailed, valuable information',
      location: 'Overall content length'
    });
  }
  
  // Missing H1 check
  if (data.contentStructure.headingStructure.h1Count === 0) {
    issues.push({
      type: 'missingH1',
      severity: 'high',
      description: 'No H1 heading found in content',
      solution: 'Add a descriptive H1 heading with your primary keyword',
      location: 'Content structure'
    });
  }
  
  // Poor readability check
  if (data.readabilityAnalysis.fleschKincaidScore < 40) {
    issues.push({
      type: 'poorReadability',
      severity: 'medium',
      description: 'Content is difficult to read and understand',
      solution: 'Simplify language and sentence structure',
      location: 'Throughout content'
    });
  }
  
  return issues;
}

export default {
  analyzeSEOOptimization
}; 