// SEO Content Optimization Definitions
// Comprehensive rules and standards for SEO analysis

export interface SEORule {
  optimal: number;
  min?: number;
  max?: number;
  warning?: number;
  critical?: number;
}

export interface ContentTypeRules {
  min: number;
  optimal: number;
  max?: number;
}

export interface HeadingRules {
  count?: number;
  min?: number;
  max?: number;
  keywordRequired?: boolean;
  keywordRecommended?: boolean;
  keywordOptional?: boolean;
}

// Core SEO Rules and Standards
export const SEO_RULES = {
  // Keyword Density Rules (industry standards)
  keywordDensity: {
    primary: { optimal: 0.015, min: 0.005, max: 0.03, warning: 0.025, critical: 0.035 }, // 0.5-3%, warn at 2.5%, critical at 3.5%
    secondary: { optimal: 0.01, min: 0.003, max: 0.02, warning: 0.015, critical: 0.025 }, // 0.3-2%, warn at 1.5%, critical at 2.5%
    total: { optimal: 0.03, min: 0.01, max: 0.05, warning: 0.04, critical: 0.06 } // Total keyword density
  } as Record<string, SEORule>,

  // Content Length Guidelines (based on content type)
  contentLength: {
    blogPost: { min: 1500, optimal: 2500, max: 4000 },
    article: { min: 800, optimal: 1200, max: 2000 },
    productPage: { min: 300, optimal: 500, max: 800 },
    landingPage: { min: 500, optimal: 1000, max: 1500 },
    categoryPage: { min: 200, optimal: 400, max: 600 },
    general: { min: 300, optimal: 800, max: 2000 }
  } as Record<string, ContentTypeRules>,

  // Heading Structure Rules (SEO hierarchy)
  headingStructure: {
    h1: { count: 1, keywordRequired: true },
    h2: { min: 2, max: 6, keywordRecommended: true },
    h3: { min: 1, max: 10, keywordOptional: true },
    h4: { min: 0, max: 15, keywordOptional: true },
    h5: { min: 0, max: 20, keywordOptional: true },
    h6: { min: 0, max: 25, keywordOptional: true }
  } as Record<string, HeadingRules>,

  // Readability Standards (SEO-focused)
  readability: {
    fleschKincaid: { optimal: 70, min: 60, max: 80, warning: 50, critical: 40 },
    avgSentenceLength: { optimal: 15, min: 10, max: 20, warning: 25, critical: 30 },
    avgWordsPerParagraph: { optimal: 100, min: 50, max: 150, warning: 200, critical: 250 },
    syllablesPerWord: { optimal: 1.5, min: 1.2, max: 2.0, warning: 2.5, critical: 3.0 }
  } as Record<string, SEORule>,

  // Meta Content Rules
  metaContent: {
    title: { optimal: 60, min: 30, max: 60, warning: 65, critical: 70 }, // characters
    description: { optimal: 155, min: 120, max: 160, warning: 165, critical: 170 }, // characters
    keywords: { optimal: 10, min: 5, max: 15, warning: 20, critical: 25 } // number of keywords
  } as Record<string, SEORule>,

  // Internal Linking Guidelines
  internalLinking: {
    linksPerPage: { optimal: 3, min: 1, max: 5, warning: 7, critical: 10 },
    anchorTextVariation: { optimal: 0.8, min: 0.6, max: 1.0, warning: 0.4, critical: 0.2 }, // percentage of varied anchor text
    linkDensity: { optimal: 0.02, min: 0.01, max: 0.03, warning: 0.04, critical: 0.05 } // links per 100 words
  } as Record<string, SEORule>
};

// SEO Content Templates
export const SEO_TEMPLATES = {
  blogPost: {
    structure: ['title', 'introduction', 'h2-section', 'h2-section', 'h2-section', 'conclusion'],
    keywordPlacement: ['title', 'first-paragraph', 'headings', 'conclusion', 'meta-description'],
    optimalLength: 2500,
    requiredElements: ['h1', 'meta-description', 'internal-links'],
    recommendedElements: ['h2-headings', 'bullet-points', 'images-with-alt']
  },
  article: {
    structure: ['title', 'introduction', 'h2-section', 'h2-section', 'conclusion'],
    keywordPlacement: ['title', 'first-paragraph', 'headings', 'conclusion'],
    optimalLength: 1200,
    requiredElements: ['h1', 'meta-description'],
    recommendedElements: ['h2-headings', 'internal-links']
  },
  productPage: {
    structure: ['title', 'description', 'features', 'benefits', 'specifications', 'cta'],
    keywordPlacement: ['title', 'description', 'features', 'meta-description'],
    optimalLength: 500,
    requiredElements: ['h1', 'meta-description', 'product-description'],
    recommendedElements: ['bullet-points', 'internal-links', 'reviews']
  },
  landingPage: {
    structure: ['headline', 'value-proposition', 'benefits', 'social-proof', 'cta'],
    keywordPlacement: ['headline', 'value-proposition', 'meta-description'],
    optimalLength: 1000,
    requiredElements: ['h1', 'meta-description', 'cta'],
    recommendedElements: ['bullet-points', 'testimonials', 'internal-links']
  }
};

// Featured Snippet Optimization Patterns
export const FEATURED_SNIPPET_PATTERNS = {
  paragraph: {
    structure: 'question + direct-answer + supporting-details',
    optimalLength: { min: 40, max: 160 },
    format: 'What is X? X is...',
    examples: ['What is SEO?', 'How does SEO work?', 'Why is SEO important?']
  },
  list: {
    structure: 'introduction + numbered/bulleted-list',
    optimalItems: { min: 3, max: 8 },
    format: 'Steps to X: 1. Step one 2. Step two...',
    examples: ['How to optimize for SEO', 'Best SEO practices', 'SEO checklist']
  },
  table: {
    structure: 'comparison-table + context',
    optimalColumns: { min: 2, max: 4 },
    optimalRows: { min: 3, max: 10 },
    format: 'Comparison table with headers and data',
    examples: ['SEO tools comparison', 'Pricing table', 'Feature comparison']
  }
};

// Keyword Research Patterns
export const KEYWORD_PATTERNS = {
  primary: {
    placement: ['title', 'h1', 'first-paragraph', 'meta-description', 'url'],
    density: { min: 0.005, optimal: 0.015, max: 0.03 },
    variations: ['exact-match', 'partial-match', 'synonyms']
  },
  secondary: {
    placement: ['headings', 'content-body', 'alt-text', 'internal-links'],
    density: { min: 0.003, optimal: 0.01, max: 0.02 },
    variations: ['related-terms', 'long-tail', 'semantic-keywords']
  },
  longTail: {
    placement: ['content-body', 'headings', 'faq-sections'],
    density: { min: 0.001, optimal: 0.005, max: 0.015 },
    variations: ['question-based', 'location-based', 'intent-based']
  }
};

// SEO Scoring Weights
export const SEO_SCORING_WEIGHTS = {
  keywordOptimization: 25, // 25% of total score
  contentQuality: 20,      // 20% of total score
  technicalSEO: 15,        // 15% of total score
  readability: 15,         // 15% of total score
  contentLength: 10,       // 10% of total score
  headingStructure: 10,    // 10% of total score
  internalLinking: 5       // 5% of total score
};

// Common SEO Issues and Solutions
export const SEO_ISSUES = {
  keywordStuffing: {
    description: 'Excessive use of keywords that hurts readability',
    impact: 'high',
    solution: 'Reduce keyword density and use natural language',
    priority: 'critical'
  },
  thinContent: {
    description: 'Content is too short to provide comprehensive value',
    impact: 'high',
    solution: 'Expand content with relevant, valuable information',
    priority: 'high'
  },
  missingH1: {
    description: 'No H1 heading found in content',
    impact: 'high',
    solution: 'Add a descriptive H1 heading with primary keyword',
    priority: 'high'
  },
  poorReadability: {
    description: 'Content is difficult to read and understand',
    impact: 'medium',
    solution: 'Simplify sentences and improve paragraph structure',
    priority: 'medium'
  },
  noInternalLinks: {
    description: 'Missing internal links to other relevant pages',
    impact: 'medium',
    solution: 'Add relevant internal links to improve site structure',
    priority: 'medium'
  }
};

export default {
  SEO_RULES,
  SEO_TEMPLATES,
  FEATURED_SNIPPET_PATTERNS,
  KEYWORD_PATTERNS,
  SEO_SCORING_WEIGHTS,
  SEO_ISSUES
}; 