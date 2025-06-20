// Common slang expressions and informal language patterns
export const SLANG_DATABASE = [
  // Fashion and appearance slang
  'fire', 'lit', 'drip', 'fit', 'slay', 'serve', 'lewk', 'ootd', 'periodt', 'no cap',
  
  // General positive slang
  'dope', 'sick', 'tight', 'fresh', 'clean', 'crisp', 'smooth', 'solid', 'legit', 'mad',
  'hella', 'lowkey', 'highkey', 'deadass', 'fr', 'fam', 'bruh', 'bro', 'sis', 'bestie',
  
  // Internet/social media slang
  'stan', 'ship', 'vibe', 'mood', 'same', 'bet', 'say less', 'facts', 'cap', 'slaps',
  'hits different', 'main character', 'side character', 'npc', 'based', 'cringe',
  
  // Gen Z expressions
  'bussin', 'sheesh', 'bet', 'periodt', 'and i oop', 'sksksk', 'vsco', 'ok boomer',
  'cheugy', 'snatched', 'understood the assignment', 'it\'s giving', 'rent free',
  
  // Music/culture slang
  'bop', 'banger', 'slaps', 'goes hard', 'fire track', 'that\'s my jam', 'vibes',
  'lowfi', 'mid', 'trash', 'whack', 'basic', 'extra', 'bougie', 'boujee',
  
  // Reaction slang
  'oop', 'tea', 'spill', 'drag', 'roast', 'ratio', 'L', 'W', 'rip', 'ded',
  'i\'m deceased', 'i can\'t', 'not me', 'why am i', 'pls', 'omg', 'smh',
  
  // Relationship slang
  'ghosted', 'breadcrumbing', 'sliding into dms', 'catch feelings', 'simp',
  'simping', 'thirsty', 'pressed', 'salty', 'bitter', 'toxic', 'red flag',
  
  // Gaming slang
  'noob', 'pwned', 'rekt', 'gg', 'ez', 'clutch', 'camping', 'griefing',
  'speedrun', 'meta', 'op', 'nerf', 'buff', 'lag', 'glitch',
  
  // Work/productivity slang
  'grind', 'hustle', 'side hustle', 'bag', 'secure the bag', 'level up',
  'glow up', 'boss up', 'mindset', 'energy', 'vibe check', 'main character energy'
];

// Slang patterns that might appear in different forms
export const SLANG_PATTERNS = [
  // Pattern variations
  { base: 'fire', variations: ['fire', 'that fire', 'straight fire', 'pure fire'] },
  { base: 'lit', variations: ['lit', 'straight lit', 'lowkey lit', 'actually lit'] },
  { base: 'slaps', variations: ['slaps', 'absolutely slaps', 'this slaps', 'it slaps'] },
  { base: 'hits different', variations: ['hits different', 'hit different', 'hitting different'] },
  { base: 'goes hard', variations: ['goes hard', 'go hard', 'going hard', 'went hard'] },
  { base: 'no cap', variations: ['no cap', 'no 🧢', 'nocap', 'fr no cap'] },
  { base: 'deadass', variations: ['deadass', 'dead ass', 'deadass fr', 'im deadass'] },
  { base: 'lowkey', variations: ['lowkey', 'low key', 'lowkey though', 'ngl lowkey'] },
  { base: 'highkey', variations: ['highkey', 'high key', 'highkey though', 'ngl highkey'] }
];

// Context indicators that suggest intentional slang usage
export const SLANG_CONTEXT_INDICATORS = [
  // Social media context
  'instagram', 'tiktok', 'snapchat', 'twitter', 'youtube', 'social media',
  'post', 'story', 'reel', 'video', 'content', 'influencer', 'creator',
  
  // Fashion/lifestyle context
  'outfit', 'fashion', 'style', 'look', 'aesthetic', 'vibe', 'mood',
  'trend', 'trendy', 'fashionable', 'stylish',
  
  // Youth/casual context
  'teen', 'teenager', 'young', 'casual', 'informal', 'friends', 'squad',
  'crew', 'gang', 'group', 'hangout', 'chill', 'relax'
];

export interface SlangDetectionResult {
  word: string
  start: number
  end: number
  confidence: number
  context: string
  isIntentional: boolean
}

export function detectSlangWords(text: string): SlangDetectionResult[] {
  const detectedSlang: SlangDetectionResult[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for direct slang matches
  SLANG_DATABASE.forEach(slangWord => {
    const regex = new RegExp(`\\b${slangWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const context = getWordContext(text, match.index, match.index + match[0].length);
      const confidence = calculateSlangConfidence(slangWord, context, text);
      
      detectedSlang.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length,
        confidence,
        context,
        isIntentional: confidence > 0.7
      });
    }
  });
  
  // Check for slang patterns
  SLANG_PATTERNS.forEach(pattern => {
    pattern.variations.forEach(variation => {
      const regex = new RegExp(variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(text)) !== null) {
        // Check if this position is already detected to avoid duplicates
        const existingMatch = detectedSlang.find(d => 
          d.start <= match!.index && d.end > match!.index
        );
        
        if (!existingMatch) {
          const context = getWordContext(text, match.index, match.index + match[0].length);
          const confidence = calculateSlangConfidence(variation, context, text);
          
          detectedSlang.push({
            word: match[0],
            start: match.index,
            end: match.index + match[0].length,
            confidence,
            context,
            isIntentional: confidence > 0.7
          });
        }
      }
    });
  });
  
  // Sort by position and remove overlapping matches
  return detectedSlang
    .sort((a, b) => a.start - b.start)
    .filter((slang, index, arr) => {
      if (index === 0) return true;
      const prev = arr[index - 1];
      return slang.start >= prev.end;
    });
}

function getWordContext(text: string, start: number, end: number): string {
  const contextRadius = 50;
  const contextStart = Math.max(0, start - contextRadius);
  const contextEnd = Math.min(text.length, end + contextRadius);
  return text.substring(contextStart, contextEnd);
}

function calculateSlangConfidence(slangWord: string, context: string, fullText: string): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence if context indicators are present
  const lowerContext = context.toLowerCase();
  const lowerFullText = fullText.toLowerCase();
  
  SLANG_CONTEXT_INDICATORS.forEach(indicator => {
    if (lowerContext.includes(indicator) || lowerFullText.includes(indicator)) {
      confidence += 0.1;
    }
  });
  
  // Increase confidence for certain high-confidence slang
  const highConfidenceSlang = ['fire', 'lit', 'slaps', 'bussin', 'no cap', 'deadass'];
  if (highConfidenceSlang.includes(slangWord.toLowerCase())) {
    confidence += 0.2;
  }
  
  // Increase confidence if multiple slang words are present
  const slangCount = SLANG_DATABASE.filter(slang => 
    lowerFullText.includes(slang.toLowerCase())
  ).length;
  
  if (slangCount > 2) {
    confidence += 0.1;
  }
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

// Check if a grammar suggestion should be protected due to slang context
export function shouldProtectFromGrammar(
  suggestionText: string, 
  suggestionStart: number, 
  suggestionEnd: number, 
  fullText: string,
  formalityLevel: 'casual' | 'balanced' | 'formal'
): boolean {
  // Don't protect in formal mode
  if (formalityLevel === 'formal') {
    return false;
  }
  
  // Get context around the suggestion
  const context = getWordContext(fullText, suggestionStart, suggestionEnd);
  
  // Check if the suggestion is part of a known slang expression
  const slangDetections = detectSlangWords(context);
  const isPartOfSlang = slangDetections.some(slang => 
    slang.start <= (suggestionStart - (suggestionStart - context.indexOf(suggestionText))) &&
    slang.end >= (suggestionEnd - (suggestionStart - context.indexOf(suggestionText)))
  );
  
  if (isPartOfSlang) {
    // In casual mode, protect most slang
    if (formalityLevel === 'casual') {
      return true;
    }
    
    // In balanced mode, only protect high-confidence slang
    if (formalityLevel === 'balanced') {
      const relevantSlang = slangDetections.find(slang => 
        slang.start <= (suggestionStart - (suggestionStart - context.indexOf(suggestionText))) &&
        slang.end >= (suggestionEnd - (suggestionStart - context.indexOf(suggestionText)))
      );
      return relevantSlang ? relevantSlang.confidence > 0.8 : false;
    }
  }
  
  return false;
} 