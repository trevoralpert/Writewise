// Platform Analysis Service
// Analyzes content against platform-specific best practices and provides optimization recommendations

import { 
  PlatformCharacteristics, 
  getPlatformById, 
  getAllPlatforms,
  isPlatformOptimal,
  getPlatformCharacterLimit 
} from './platformDefinitions';

export interface PlatformAnalysis {
  platformId: string;
  platformName: string;
  overallScore: number; // 1-10 score for platform optimization
  
  // Character Analysis
  characterAnalysis: {
    currentLength: number;
    optimalLength: number | null;
    isOptimal: boolean;
    lengthRecommendation: string;
  };
  
  // Tone Analysis
  toneAnalysis: {
    currentTone: string[];
    preferredTone: string[];
    toneMatch: number; // 0-1 score
    toneRecommendation: string;
  };
  
  // Content Style Analysis
  styleAnalysis: {
    lengthOptimization: string;
    hashtagRecommendation: string;
    emojiRecommendation: string;
    visualImportance: string;
  };
  
  // Engagement Optimization
  engagementAnalysis: {
    hasCallToAction: boolean;
    hasQuestionPrompt: boolean;
    hasUrgencyWords: boolean;
    hasCommunityBuilding: boolean;
    engagementScore: number; // 0-1 score
  };
  
  // Best Practices Check
  bestPracticesAnalysis: {
    hasGoodOpening: boolean;
    followsStructure: boolean;
    hasGoodClosing: boolean;
    avoidsProblematicWords: boolean;
    bestPracticesScore: number; // 0-1 score
  };
  
  // Specific Recommendations
  recommendations: PlatformRecommendation[];
}

export interface PlatformRecommendation {
  type: 'length' | 'tone' | 'engagement' | 'structure' | 'style' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  examples?: string[];
}

export interface MultiPlatformAnalysis {
  originalText: string;
  platforms: PlatformAnalysis[];
  bestPlatforms: string[]; // Platforms where content performs best
  worstPlatforms: string[]; // Platforms needing most optimization
  universalRecommendations: string[]; // Recommendations that help across all platforms
}

// Main analysis function
export const analyzePlatformOptimization = (
  text: string, 
  platformId: string,
  currentTone?: string[]
): PlatformAnalysis => {
  const platform = getPlatformById(platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not found`);
  }

  const analysis: PlatformAnalysis = {
    platformId,
    platformName: platform.displayName,
    overallScore: 0,
    characterAnalysis: analyzeCharacterUsage(text, platform),
    toneAnalysis: analyzeToneMatch(currentTone || [], platform),
    styleAnalysis: analyzeContentStyle(text, platform),
    engagementAnalysis: analyzeEngagementElements(text, platform),
    bestPracticesAnalysis: analyzeBestPractices(text, platform),
    recommendations: []
  };

  // Calculate overall score
  analysis.overallScore = calculateOverallScore(analysis);
  
  // Generate recommendations
  analysis.recommendations = generateRecommendations(text, platform, analysis);

  return analysis;
};

// Character usage analysis
const analyzeCharacterUsage = (text: string, platform: PlatformCharacteristics) => {
  const currentLength = text.length;
  const optimalLength = getPlatformCharacterLimit(platform.id, 'post') || 
                       getPlatformCharacterLimit(platform.id, 'caption');
  
  const isOptimal = optimalLength ? currentLength <= optimalLength : true;
  
  let lengthRecommendation = '';
  if (optimalLength) {
    if (currentLength > optimalLength) {
      const excess = currentLength - optimalLength;
      lengthRecommendation = `Content is ${excess} characters too long for ${platform.displayName}. Consider shortening.`;
    } else if (currentLength < optimalLength * 0.3) {
      lengthRecommendation = `Content might be too short for ${platform.displayName}. Consider expanding.`;
    } else {
      lengthRecommendation = `Character length is optimal for ${platform.displayName}.`;
    }
  } else {
    lengthRecommendation = `No specific character limit for ${platform.displayName}.`;
  }

  return {
    currentLength,
    optimalLength,
    isOptimal,
    lengthRecommendation
  };
};

// Tone matching analysis
const analyzeToneMatch = (currentTone: string[], platform: PlatformCharacteristics) => {
  const preferredTone = platform.preferredTone;
  
  // Calculate tone match score
  const matches = currentTone.filter(tone => 
    preferredTone.some(preferred => 
      preferred.toLowerCase().includes(tone.toLowerCase()) ||
      tone.toLowerCase().includes(preferred.toLowerCase())
    )
  );
  
  const toneMatch = currentTone.length > 0 ? matches.length / currentTone.length : 0;
  
  let toneRecommendation = '';
  if (toneMatch >= 0.7) {
    toneRecommendation = `Tone matches ${platform.displayName} preferences well.`;
  } else if (toneMatch >= 0.4) {
    toneRecommendation = `Tone partially matches ${platform.displayName}. Consider adjusting to be more ${preferredTone.slice(0, 2).join(' and ')}.`;
  } else {
    toneRecommendation = `Tone doesn't match ${platform.displayName} preferences. Consider being more ${preferredTone.slice(0, 2).join(' and ')}.`;
  }

  return {
    currentTone,
    preferredTone,
    toneMatch,
    toneRecommendation
  };
};

// Content style analysis
const analyzeContentStyle = (text: string, platform: PlatformCharacteristics) => {
  const style = platform.contentStyle;
  
  const lengthOptimization = getLengthOptimization(text.length, style.preferredLength);
  const hashtagRecommendation = getHashtagRecommendation(text, style.hashtagUsage);
  const emojiRecommendation = getEmojiRecommendation(text, style.emojiUsage);
  const visualImportance = `Visual content importance: ${style.visualImportance}`;

  return {
    lengthOptimization,
    hashtagRecommendation,
    emojiRecommendation,
    visualImportance
  };
};

// Engagement elements analysis
const analyzeEngagementElements = (text: string, platform: PlatformCharacteristics) => {
  const tactics = platform.engagementTactics;
  
  const hasCallToAction = tactics.callToAction.some(cta => 
    text.toLowerCase().includes(cta.toLowerCase().substring(0, 10))
  );
  
  const hasQuestionPrompt = tactics.questionPrompts.some(prompt => 
    text.toLowerCase().includes(prompt.toLowerCase().substring(0, 8))
  ) || text.includes('?');
  
  const hasUrgencyWords = tactics.urgencyWords.some(word => 
    text.toLowerCase().includes(word.toLowerCase())
  );
  
  const hasCommunityBuilding = tactics.communityBuilding.some(term => 
    text.toLowerCase().includes(term.toLowerCase())
  );

  const engagementScore = [hasCallToAction, hasQuestionPrompt, hasUrgencyWords, hasCommunityBuilding]
    .filter(Boolean).length / 4;

  return {
    hasCallToAction,
    hasQuestionPrompt,
    hasUrgencyWords,
    hasCommunityBuilding,
    engagementScore
  };
};

// Best practices analysis
const analyzeBestPractices = (text: string, platform: PlatformCharacteristics) => {
  const practices = platform.bestPractices;
  
  const hasGoodOpening = practices.openingHooks.some(hook => 
    text.toLowerCase().startsWith(hook.toLowerCase().substring(0, 8))
  );
  
  const hasGoodClosing = practices.closingTactics.some(tactic => 
    text.toLowerCase().includes(tactic.toLowerCase().substring(0, 8))
  );
  
  const avoidsProblematicWords = !practices.avoidWords.some(word => 
    text.toLowerCase().includes(word.toLowerCase())
  );
  
  // Structure analysis (simplified)
  const followsStructure = text.length > 50 && text.includes(' ') && 
    (text.includes('?') || text.includes('!') || text.includes('.'));

  const bestPracticesScore = [hasGoodOpening, followsStructure, hasGoodClosing, avoidsProblematicWords]
    .filter(Boolean).length / 4;

  return {
    hasGoodOpening,
    followsStructure,
    hasGoodClosing,
    avoidsProblematicWords,
    bestPracticesScore
  };
};

// Helper functions
const getLengthOptimization = (currentLength: number, preferredLength: string): string => {
  switch (preferredLength) {
    case 'short':
      return currentLength > 100 ? 'Consider shortening for better engagement' : 'Length is appropriate';
    case 'medium':
      return currentLength < 50 ? 'Consider expanding content' : 
             currentLength > 300 ? 'Consider shortening' : 'Length is appropriate';
    case 'long':
      return currentLength < 200 ? 'Consider expanding for more depth' : 'Length is appropriate';
    default:
      return 'Length is flexible for this platform';
  }
};

const getHashtagRecommendation = (text: string, hashtagUsage: string): string => {
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  
  switch (hashtagUsage) {
    case 'none':
      return hashtagCount > 0 ? 'Remove hashtags for this platform' : 'No hashtags needed';
    case 'minimal':
      return hashtagCount > 2 ? 'Use fewer hashtags (1-2 max)' : 'Hashtag usage is appropriate';
    case 'moderate':
      return hashtagCount < 2 ? 'Consider adding 3-5 relevant hashtags' :
             hashtagCount > 8 ? 'Reduce hashtags (3-5 optimal)' : 'Hashtag usage is good';
    case 'heavy':
      return hashtagCount < 5 ? 'Add more hashtags (8-15 recommended)' : 'Good hashtag usage';
    default:
      return 'Hashtag usage is flexible';
  }
};

const getEmojiRecommendation = (text: string, emojiUsage: string): string => {
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
  
  switch (emojiUsage) {
    case 'none':
      return emojiCount > 0 ? 'Remove emojis for professional tone' : 'No emojis needed';
    case 'minimal':
      return emojiCount > 2 ? 'Use fewer emojis (1-2 max)' : 'Emoji usage is appropriate';
    case 'moderate':
      return emojiCount < 1 ? 'Consider adding 2-4 relevant emojis' :
             emojiCount > 6 ? 'Reduce emojis (2-4 optimal)' : 'Good emoji usage';
    case 'heavy':
      return emojiCount < 3 ? 'Add more emojis for engagement' : 'Great emoji usage';
    default:
      return 'Emoji usage is flexible';
  }
};

// Overall score calculation
const calculateOverallScore = (analysis: PlatformAnalysis): number => {
  const characterScore = analysis.characterAnalysis.isOptimal ? 1 : 0.5;
  const toneScore = analysis.toneAnalysis.toneMatch;
  const engagementScore = analysis.engagementAnalysis.engagementScore;
  const bestPracticesScore = analysis.bestPracticesAnalysis.bestPracticesScore;
  
  const overallScore = (characterScore + toneScore + engagementScore + bestPracticesScore) / 4;
  return Math.round(overallScore * 10);
};

// Recommendation generation
const generateRecommendations = (
  text: string, 
  platform: PlatformCharacteristics, 
  analysis: PlatformAnalysis
): PlatformRecommendation[] => {
  const recommendations: PlatformRecommendation[] = [];
  
  // Character length recommendations
  if (!analysis.characterAnalysis.isOptimal) {
    recommendations.push({
      type: 'length',
      priority: 'high',
      title: 'Optimize Content Length',
      description: analysis.characterAnalysis.lengthRecommendation,
      suggestion: analysis.characterAnalysis.currentLength > (analysis.characterAnalysis.optimalLength || 0) 
        ? 'Shorten your content to fit platform limits'
        : 'Expand your content for better engagement'
    });
  }
  
  // Tone recommendations
  if (analysis.toneAnalysis.toneMatch < 0.5) {
    recommendations.push({
      type: 'tone',
      priority: 'medium',
      title: 'Adjust Tone for Platform',
      description: analysis.toneAnalysis.toneRecommendation,
      suggestion: `Try being more ${platform.preferredTone.slice(0, 2).join(' and ')}`,
      examples: platform.bestPractices.openingHooks.slice(0, 2)
    });
  }
  
  // Engagement recommendations
  if (analysis.engagementAnalysis.engagementScore < 0.5) {
    if (!analysis.engagementAnalysis.hasCallToAction) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        title: 'Add Call-to-Action',
        description: 'Your content lacks engagement prompts',
        suggestion: 'Add a call-to-action to encourage interaction',
        examples: platform.engagementTactics.callToAction.slice(0, 3)
      });
    }
    
    if (!analysis.engagementAnalysis.hasQuestionPrompt) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Include Question Prompts',
        description: 'Questions increase engagement',
        suggestion: 'Add questions to encourage responses',
        examples: platform.engagementTactics.questionPrompts.slice(0, 3)
      });
    }
  }
  
  // Best practices recommendations
  if (analysis.bestPracticesAnalysis.bestPracticesScore < 0.6) {
    if (!analysis.bestPracticesAnalysis.hasGoodOpening) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        title: 'Improve Opening Hook',
        description: 'Your opening could be more engaging',
        suggestion: 'Start with a compelling hook',
        examples: platform.bestPractices.openingHooks.slice(0, 3)
      });
    }
    
    if (!analysis.bestPracticesAnalysis.avoidsProblematicWords) {
      recommendations.push({
        type: 'warning',
        priority: 'critical',
        title: 'Avoid Problematic Words',
        description: 'Content contains words that may hurt performance',
        suggestion: 'Remove or replace flagged words',
        examples: [`Avoid: ${platform.bestPractices.avoidWords.join(', ')}`]
      });
    }
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Multi-platform analysis
export const analyzeMultiPlatform = (
  text: string, 
  platformIds: string[],
  currentTone?: string[]
): MultiPlatformAnalysis => {
  const platforms = platformIds.map(id => analyzePlatformOptimization(text, id, currentTone));
  
  const sortedByScore = [...platforms].sort((a, b) => b.overallScore - a.overallScore);
  const bestPlatforms = sortedByScore.slice(0, 3).map(p => p.platformName);
  const worstPlatforms = sortedByScore.slice(-2).map(p => p.platformName);
  
  // Generate universal recommendations
  const universalRecommendations = generateUniversalRecommendations(platforms);
  
  return {
    originalText: text,
    platforms,
    bestPlatforms,
    worstPlatforms,
    universalRecommendations
  };
};

const generateUniversalRecommendations = (platforms: PlatformAnalysis[]): string[] => {
  const recommendations: string[] = [];
  
  // Check if length is problematic across platforms
  const lengthIssues = platforms.filter(p => !p.characterAnalysis.isOptimal).length;
  if (lengthIssues > platforms.length / 2) {
    recommendations.push('Consider optimizing content length for better cross-platform compatibility');
  }
  
  // Check engagement across platforms
  const lowEngagement = platforms.filter(p => p.engagementAnalysis.engagementScore < 0.5).length;
  if (lowEngagement > platforms.length / 2) {
    recommendations.push('Add more engagement elements (questions, calls-to-action) to improve performance across platforms');
  }
  
  // Check tone consistency
  const toneMismatches = platforms.filter(p => p.toneAnalysis.toneMatch < 0.5).length;
  if (toneMismatches > platforms.length / 2) {
    recommendations.push('Consider adjusting tone to better match platform expectations');
  }
  
  return recommendations;
}; 