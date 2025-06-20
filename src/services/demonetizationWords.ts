export const DEMONETIZATION_WORDS = [
  // Death-related terms
  'dead', 'die', 'death', 'dying', 'died', 'kill', 'killed', 'killing', 'killer', 'murder', 'murdered', 'murderer',
  'suicide', 'suicidal', 'assassinate', 'execution', 'executed', 'slaughter', 'massacre', 'genocide',
  
  // Violence-related terms
  'violence', 'violent', 'abuse', 'abusive', 'assault', 'attack', 'attacking', 'attacked', 'fight', 'fighting',
  'punch', 'punching', 'hit', 'hitting', 'beat', 'beating', 'torture', 'tortured', 'harm', 'harmful',
  'hurt', 'hurting', 'wound', 'wounded', 'injury', 'injured', 'blood', 'bloody', 'bleeding',
  
  // Weapons
  'gun', 'guns', 'weapon', 'weapons', 'knife', 'knives', 'sword', 'bomb', 'bombs', 'explosive', 'explosives',
  'bullet', 'bullets', 'ammunition', 'pistol', 'rifle', 'shotgun', 'firearm', 'firearms',
  
  // Mental health sensitive terms
  'depression', 'depressed', 'anxiety', 'panic', 'mental illness', 'psycho', 'crazy', 'insane', 'mad',
  'bipolar', 'schizophrenia', 'trauma', 'traumatic', 'ptsd',
  
  // Substance-related
  'drug', 'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'alcohol', 'drunk', 'addiction', 'addicted',
  'overdose', 'high', 'smoking', 'cigarette', 'cigarettes', 'tobacco', 'vape', 'vaping',
  
  // Sexual content
  'sex', 'sexual', 'porn', 'pornography', 'nude', 'naked', 'strip', 'stripper', 'prostitute', 'prostitution',
  'rape', 'raped', 'molest', 'molestation', 'pedophile', 'incest',
  
  // Hate speech and discrimination
  'hate', 'hatred', 'racist', 'racism', 'discrimination', 'discriminate', 'nazi', 'fascist', 'terrorist',
  'terrorism', 'extremist', 'radical', 'supremacist',
  
  // Disaster/tragedy terms
  'disaster', 'tragedy', 'tragic', 'catastrophe', 'crisis', 'pandemic', 'epidemic', 'war', 'warfare',
  'conflict', 'shooting', 'shooter', 'explosion', 'crash', 'accident', 'emergency',
  
  // Other sensitive terms
  'controversial', 'banned', 'illegal', 'crime', 'criminal', 'arrest', 'arrested', 'prison', 'jail',
  'investigation', 'scandal', 'corrupt', 'corruption', 'fraud', 'scam', 'fake', 'hoax'
];

// Function to detect demonetization words in text
export function detectDemonetizationWords(text: string): Array<{
  word: string;
  start: number;
  end: number;
}> {
  const detectedWords: Array<{ word: string; start: number; end: number }> = [];
  
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  DEMONETIZATION_WORDS.forEach(word => {
    // Create patterns for word variations
    const patterns = [
      // Exact word
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      // Plural forms
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s\\b`,
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}es\\b`,
      // Past tense
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}ed\\b`,
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}d\\b`,
      // Present participle/gerund
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}ing\\b`,
      // Other common variations
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}er\\b`,
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}ers\\b`
    ];
    
    // Special handling for words ending in 'y' -> 'ies'
    if (word.endsWith('y')) {
      const stemWord = word.slice(0, -1);
      patterns.push(`\\b${stemWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}ies\\b`);
    }
    
    // Special handling for words ending in 'e' (remove 'e' before adding 'ing', 'ed')
    if (word.endsWith('e')) {
      const stemWord = word.slice(0, -1);
      patterns.push(`\\b${stemWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}ing\\b`);
      patterns.push(`\\b${stemWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}ed\\b`);
    }
    
    // Special handling for double consonant before -ing, -ed (e.g., "hit" -> "hitting")
    if (word.length >= 3 && /[bcdfghjklmnpqrstvwxyz]$/.test(word)) {
      const lastChar = word[word.length - 1];
      const penultimate = word[word.length - 2];
      // Double consonant rule for short words with single vowel
      if (/[aeiou]/.test(penultimate) && !/[aeiou]/.test(word[word.length - 3] || '')) {
        patterns.push(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${lastChar}ing\\b`);
        patterns.push(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${lastChar}ed\\b`);
      }
    }
    
    // Test all patterns
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(lowerText)) !== null) {
        // Check if this position is already detected to avoid duplicates
        const existingMatch = detectedWords.find(d => 
          d.start <= match!.index && d.end > match!.index
        );
        
        if (!existingMatch) {
          detectedWords.push({
            word: text.substring(match!.index, match!.index + match![0].length), // Preserve original case
            start: match!.index,
            end: match!.index + match![0].length
          });
        }
      }
    });
  });
  
  // Sort by position in text and remove overlapping matches
  return detectedWords
    .sort((a, b) => a.start - b.start)
    .filter((word, index, arr) => {
      // Remove overlapping matches, keeping the first one
      if (index === 0) return true;
      const prev = arr[index - 1];
      return word.start >= prev.end;
    });
} 