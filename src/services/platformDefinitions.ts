// Platform Definitions for Audience Adaptation
// Comprehensive platform characteristics and optimization rules

export interface PlatformCharacteristics {
  id: string;
  name: string;
  displayName: string;
  category: 'social' | 'professional' | 'video' | 'blog' | 'email';
  
  // Content Constraints
  characterLimits: {
    post?: number;
    caption?: number;
    title?: number;
    description?: number;
    bio?: number;
  };
  
  // Audience & Tone
  primaryAudience: string[];
  preferredTone: string[];
  formalityLevel: 'casual' | 'balanced' | 'professional' | 'formal';
  
  // Content Style
  contentStyle: {
    preferredLength: 'short' | 'medium' | 'long' | 'variable';
    visualImportance: 'low' | 'medium' | 'high' | 'critical';
    hashtagUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
  };
  
  // Engagement Tactics
  engagementTactics: {
    callToAction: string[];
    questionPrompts: string[];
    urgencyWords: string[];
    communityBuilding: string[];
  };
  
  // Best Practices
  bestPractices: {
    openingHooks: string[];
    contentStructure: string[];
    closingTactics: string[];
    avoidWords: string[];
  };
  
  // Platform-Specific Features
  platformFeatures: {
    supportsThreads: boolean;
    supportsPolls: boolean;
    supportsHashtags: boolean;
    supportsTagging: boolean;
    supportsLinks: boolean;
    algorithmic: boolean;
  };
}

export const PLATFORM_DEFINITIONS: Record<string, PlatformCharacteristics> = {
  // Professional Platforms
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    displayName: 'LinkedIn',
    category: 'professional',
    
    characterLimits: {
      post: 3000,
      title: 100,
      description: 2000,
    },
    
    primaryAudience: ['professionals', 'business owners', 'executives', 'job seekers', 'industry experts'],
    preferredTone: ['professional', 'authoritative', 'educational', 'inspirational'],
    formalityLevel: 'professional',
    
    contentStyle: {
      preferredLength: 'medium',
      visualImportance: 'medium',
      hashtagUsage: 'moderate',
      emojiUsage: 'minimal',
    },
    
    engagementTactics: {
      callToAction: [
        'What\'s your experience with this?',
        'Share your thoughts in the comments',
        'Connect with me to discuss further',
        'What would you add to this list?',
        'How has this worked in your industry?'
      ],
      questionPrompts: [
        'What challenges have you faced?',
        'How do you approach this in your role?',
        'What trends are you seeing?',
        'What advice would you give?'
      ],
      urgencyWords: ['opportunity', 'trending', 'essential', 'critical', 'breakthrough'],
      communityBuilding: ['fellow professionals', 'industry peers', 'network', 'community', 'colleagues']
    },
    
    bestPractices: {
      openingHooks: [
        'In my X years of experience...',
        'Here\'s what I learned from...',
        'The biggest mistake I see professionals make...',
        'After working with 100+ clients...',
        'Industry data shows...'
      ],
      contentStructure: [
        'Start with a compelling professional insight',
        'Use numbered lists or bullet points',
        'Include personal anecdotes or case studies',
        'End with a thought-provoking question',
        'Use line breaks for readability'
      ],
      closingTactics: [
        'What\'s been your experience?',
        'I\'d love to hear your perspective',
        'Feel free to connect if you want to discuss',
        'What would you add to this?'
      ],
      avoidWords: ['viral', 'hack', 'secret', 'weird trick', 'you won\'t believe']
    },
    
    platformFeatures: {
      supportsThreads: false,
      supportsPolls: true,
      supportsHashtags: true,
      supportsTagging: true,
      supportsLinks: true,
      algorithmic: true,
    }
  },

  // Social Media Platforms
  twitter: {
    id: 'twitter',
    name: 'Twitter',
    displayName: 'Twitter/X',
    category: 'social',
    
    characterLimits: {
      post: 280,
      bio: 160,
    },
    
    primaryAudience: ['general public', 'news followers', 'tech enthusiasts', 'thought leaders'],
    preferredTone: ['conversational', 'witty', 'direct', 'opinionated'],
    formalityLevel: 'casual',
    
    contentStyle: {
      preferredLength: 'short',
      visualImportance: 'medium',
      hashtagUsage: 'moderate',
      emojiUsage: 'moderate',
    },
    
    engagementTactics: {
      callToAction: [
        'Retweet if you agree',
        'What do you think?',
        'Drop your thoughts below',
        'Tag someone who needs to see this',
        'Quote tweet with your take'
      ],
      questionPrompts: [
        'Hot take:',
        'Unpopular opinion:',
        'Am I the only one who...',
        'Quick question:',
        'Thoughts?'
      ],
      urgencyWords: ['breaking', 'urgent', 'now', 'live', 'happening'],
      communityBuilding: ['Twitter fam', 'community', 'everyone', 'folks', 'people']
    },
    
    bestPractices: {
      openingHooks: [
        'Hot take:',
        'Unpopular opinion:',
        'PSA:',
        'Fun fact:',
        'Plot twist:'
      ],
      contentStructure: [
        'Lead with the main point',
        'Use threads for longer thoughts',
        'Keep it punchy and direct',
        'Use emojis strategically',
        'End with engagement bait'
      ],
      closingTactics: [
        'Thoughts?',
        'Agree or disagree?',
        'What\'s your take?',
        'RT if you relate'
      ],
      avoidWords: ['please retweet', 'follow me', 'check out my', 'buy now']
    },
    
    platformFeatures: {
      supportsThreads: true,
      supportsPolls: true,
      supportsHashtags: true,
      supportsTagging: true,
      supportsLinks: true,
      algorithmic: true,
    }
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram',
    displayName: 'Instagram',
    category: 'social',
    
    characterLimits: {
      caption: 2200,
      bio: 150,
      title: 100,
    },
    
    primaryAudience: ['millennials', 'gen z', 'lifestyle enthusiasts', 'visual learners'],
    preferredTone: ['inspiring', 'authentic', 'lifestyle', 'aspirational'],
    formalityLevel: 'casual',
    
    contentStyle: {
      preferredLength: 'medium',
      visualImportance: 'critical',
      hashtagUsage: 'heavy',
      emojiUsage: 'heavy',
    },
    
    engagementTactics: {
      callToAction: [
        'Double tap if you agree ❤️',
        'Save this post for later 📌',
        'Share with someone who needs this',
        'Tell me in the comments 👇',
        'Tag a friend who...'
      ],
      questionPrompts: [
        'What\'s your favorite...?',
        'Can you relate?',
        'What would you add?',
        'Share your story below',
        'Who else feels this way?'
      ],
      urgencyWords: ['limited time', 'exclusive', 'don\'t miss', 'last chance', 'trending'],
      communityBuilding: ['beautiful souls', 'amazing community', 'Instagram family', 'lovely humans']
    },
    
    bestPractices: {
      openingHooks: [
        'POV: You\'re...',
        'That moment when...',
        'Can we talk about...',
        'Real talk:',
        'Here\'s your reminder that...'
      ],
      contentStructure: [
        'Start with a relatable hook',
        'Tell a story or share experience',
        'Use emojis and line breaks',
        'Include 5-10 relevant hashtags',
        'End with clear call-to-action'
      ],
      closingTactics: [
        'What resonates with you?',
        'Share your thoughts below 👇',
        'Save for later if this helps! 📌',
        'Tag someone who needs this'
      ],
      avoidWords: ['follow for follow', 'like for like', 'spam', 'cheap']
    },
    
    platformFeatures: {
      supportsThreads: false,
      supportsPolls: true,
      supportsHashtags: true,
      supportsTagging: true,
      supportsLinks: false,
      algorithmic: true,
    }
  },

  // Video Platforms
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    displayName: 'YouTube',
    category: 'video',
    
    characterLimits: {
      title: 100,
      description: 5000,
    },
    
    primaryAudience: ['video learners', 'entertainment seekers', 'tutorial followers', 'all demographics'],
    preferredTone: ['educational', 'entertaining', 'engaging', 'authoritative'],
    formalityLevel: 'balanced',
    
    contentStyle: {
      preferredLength: 'long',
      visualImportance: 'critical',
      hashtagUsage: 'moderate',
      emojiUsage: 'moderate',
    },
    
    engagementTactics: {
      callToAction: [
        'Like this video if it helped',
        'Subscribe for more content like this',
        'Comment your thoughts below',
        'Share with someone who needs this',
        'Hit the notification bell'
      ],
      questionPrompts: [
        'What would you like to see next?',
        'Have you tried this before?',
        'What\'s your experience with...?',
        'Let me know in the comments',
        'What questions do you have?'
      ],
      urgencyWords: ['don\'t miss', 'limited time', 'exclusive', 'breaking', 'urgent'],
      communityBuilding: ['amazing viewers', 'YouTube family', 'community', 'subscribers', 'everyone watching']
    },
    
    bestPractices: {
      openingHooks: [
        'In this video, you\'ll learn...',
        'By the end of this video...',
        'Have you ever wondered...',
        'Today I\'m going to show you...',
        'What if I told you...'
      ],
      contentStructure: [
        'Hook viewers in first 15 seconds',
        'Clearly state what they\'ll learn',
        'Use timestamps for longer videos',
        'Include relevant keywords',
        'End with clear next steps'
      ],
      closingTactics: [
        'Thanks for watching!',
        'See you in the next video',
        'Don\'t forget to subscribe',
        'Check out this related video'
      ],
      avoidWords: ['clickbait', 'fake', 'scam', 'you won\'t believe']
    },
    
    platformFeatures: {
      supportsThreads: false,
      supportsPolls: true,
      supportsHashtags: true,
      supportsTagging: false,
      supportsLinks: true,
      algorithmic: true,
    }
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    displayName: 'TikTok',
    category: 'video',
    
    characterLimits: {
      caption: 2200,
      bio: 80,
    },
    
    primaryAudience: ['gen z', 'millennials', 'trend followers', 'entertainment seekers'],
    preferredTone: ['trendy', 'authentic', 'fun', 'relatable'],
    formalityLevel: 'casual',
    
    contentStyle: {
      preferredLength: 'short',
      visualImportance: 'critical',
      hashtagUsage: 'heavy',
      emojiUsage: 'heavy',
    },
    
    engagementTactics: {
      callToAction: [
        'Like if you can relate',
        'Follow for more tips',
        'Comment your thoughts',
        'Share this with your bestie',
        'Duet this if you agree'
      ],
      questionPrompts: [
        'Who else does this?',
        'Is it just me or...?',
        'Can you relate?',
        'What\'s your take?',
        'Am I right?'
      ],
      urgencyWords: ['viral', 'trending', 'everyone\'s doing', 'don\'t miss', 'right now'],
      communityBuilding: ['besties', 'TikTok fam', 'everyone', 'y\'all', 'friends']
    },
    
    bestPractices: {
      openingHooks: [
        'POV:',
        'Tell me why...',
        'Nobody talks about...',
        'This is your sign to...',
        'Me when...'
      ],
      contentStructure: [
        'Hook in first 3 seconds',
        'Keep it short and snappy',
        'Use trending sounds/hashtags',
        'Be authentic and relatable',
        'End with engagement hook'
      ],
      closingTactics: [
        'Follow for more',
        'Like if you agree',
        'Comment below',
        'Share with friends'
      ],
      avoidWords: ['old', 'outdated', 'boring', 'traditional', 'formal']
    },
    
    platformFeatures: {
      supportsThreads: false,
      supportsPolls: false,
      supportsHashtags: true,
      supportsTagging: true,
      supportsLinks: false,
      algorithmic: true,
    }
  },

  // Blog Platforms
  medium: {
    id: 'medium',
    name: 'Medium',
    displayName: 'Medium',
    category: 'blog',
    
    characterLimits: {
      title: 100,
      description: 140,
    },
    
    primaryAudience: ['thought leaders', 'professionals', 'writers', 'intellectuals'],
    preferredTone: ['thoughtful', 'analytical', 'educational', 'authoritative'],
    formalityLevel: 'professional',
    
    contentStyle: {
      preferredLength: 'long',
      visualImportance: 'low',
      hashtagUsage: 'minimal',
      emojiUsage: 'none',
    },
    
    engagementTactics: {
      callToAction: [
        'What are your thoughts?',
        'I\'d love to hear your perspective',
        'Share your experience in the comments',
        'Follow for more insights',
        'Clap if this resonated with you'
      ],
      questionPrompts: [
        'What has been your experience?',
        'How do you approach this?',
        'What would you add?',
        'Have you encountered this?',
        'What are your thoughts?'
      ],
      urgencyWords: ['essential', 'critical', 'important', 'breakthrough', 'significant'],
      communityBuilding: ['fellow writers', 'readers', 'community', 'audience', 'everyone']
    },
    
    bestPractices: {
      openingHooks: [
        'In my experience...',
        'After years of research...',
        'The data reveals...',
        'Here\'s what most people don\'t know...',
        'I\'ve been thinking about...'
      ],
      contentStructure: [
        'Start with compelling introduction',
        'Use subheadings and sections',
        'Include data and examples',
        'Write in-depth analysis',
        'Conclude with key takeaways'
      ],
      closingTactics: [
        'What are your thoughts?',
        'I\'d love to continue this conversation',
        'Feel free to share your perspective',
        'Thank you for reading'
      ],
      avoidWords: ['clickbait', 'hack', 'secret', 'viral', 'trick']
    },
    
    platformFeatures: {
      supportsThreads: false,
      supportsPolls: false,
      supportsHashtags: true,
      supportsTagging: true,
      supportsLinks: true,
      algorithmic: true,
    }
  },

  // Email Marketing
  email: {
    id: 'email',
    name: 'Email',
    displayName: 'Email Marketing',
    category: 'email',
    
    characterLimits: {
      title: 50,
      description: 90,
    },
    
    primaryAudience: ['subscribers', 'customers', 'prospects', 'community members'],
    preferredTone: ['personal', 'direct', 'valuable', 'trustworthy'],
    formalityLevel: 'balanced',
    
    contentStyle: {
      preferredLength: 'medium',
      visualImportance: 'low',
      hashtagUsage: 'none',
      emojiUsage: 'minimal',
    },
    
    engagementTactics: {
      callToAction: [
        'Reply and let me know',
        'Click here to learn more',
        'Forward this to a friend',
        'What questions do you have?',
        'Hit reply - I read every email'
      ],
      questionPrompts: [
        'What\'s your biggest challenge with...?',
        'Have you tried this approach?',
        'What would be most helpful?',
        'What questions can I answer?',
        'How has this worked for you?'
      ],
      urgencyWords: ['limited time', 'exclusive', 'deadline', 'important', 'don\'t miss'],
      communityBuilding: ['valued subscriber', 'community', 'friend', 'everyone', 'you']
    },
    
    bestPractices: {
      openingHooks: [
        'Quick question...',
        'I wanted to share...',
        'You asked about...',
        'Here\'s what I learned...',
        'Personal note:'
      ],
      contentStructure: [
        'Personal, conversational tone',
        'Clear subject line',
        'Short paragraphs',
        'One main message per email',
        'Clear call-to-action'
      ],
      closingTactics: [
        'Hit reply and let me know',
        'What questions do you have?',
        'Talk soon,',
        'Hope this helps!'
      ],
      avoidWords: ['spam', 'free', 'urgent', 'act now', 'limited time offer']
    },
    
    platformFeatures: {
      supportsThreads: false,
      supportsPolls: false,
      supportsHashtags: false,
      supportsTagging: false,
      supportsLinks: true,
      algorithmic: false,
    }
  }
};

// Helper functions for platform analysis
export const getPlatformById = (platformId: string): PlatformCharacteristics | null => {
  return PLATFORM_DEFINITIONS[platformId] || null;
};

export const getAllPlatforms = (): PlatformCharacteristics[] => {
  return Object.values(PLATFORM_DEFINITIONS);
};

export const getPlatformsByCategory = (category: string): PlatformCharacteristics[] => {
  return Object.values(PLATFORM_DEFINITIONS).filter(platform => platform.category === category);
};

export const getPlatformCharacterLimit = (platformId: string, type: string): number | null => {
  const platform = getPlatformById(platformId);
  if (!platform) return null;
  
  return platform.characterLimits[type as keyof typeof platform.characterLimits] || null;
};

export const isPlatformOptimal = (platformId: string, textLength: number, contentType: string = 'post'): boolean => {
  const limit = getPlatformCharacterLimit(platformId, contentType);
  if (!limit) return true;
  
  return textLength <= limit;
};

export const getPlatformRecommendations = (platformId: string): string[] => {
  const platform = getPlatformById(platformId);
  if (!platform) return [];
  
  return [
    ...platform.bestPractices.openingHooks.slice(0, 2),
    ...platform.engagementTactics.callToAction.slice(0, 2),
    ...platform.bestPractices.closingTactics.slice(0, 2)
  ];
}; 