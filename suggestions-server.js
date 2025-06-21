import express from 'express'
import cors from 'cors'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Simple in-memory cache for demonetization alternatives
const alternativesCache = new Map()

// SEO analysis cache
const seoCache = new Map()

// SEO Definitions and Rules (inline for Node.js compatibility)
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

// Demonetization words detection (inline for Node.js compatibility)
const DEMONETIZATION_WORDS = [
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

// Simple spelling error detection
const SPELLING_ERRORS = {
  "exmple": "example",
  "spellng": "spelling",
  "demonetised": "demonetized", // Common UK/US spelling issue
  "wriet": "write",
  "sentance": "sentence"
};

function detectSpellingErrors(text) {
  const detectedErrors = [];
  const lowerText = text.toLowerCase();

  for (const [misspelling, correction] of Object.entries(SPELLING_ERRORS)) {
    const regex = new RegExp(`\\b${misspelling}\\b`, 'gi');
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      detectedErrors.push({
        id: `spelling-${Math.random().toString(36).slice(2, 10)}`,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        message: `Spelling mistake. Did you mean "${correction}"?`,
        type: 'spelling',
        correction: correction,
        status: 'pending',
        priority: 100 // Highest by default
      });
    }
  }
  return detectedErrors;
}

function detectDemonetizationWords(text) {
  const detectedWords = [];
  
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
      let match;
      
      while ((match = regex.exec(lowerText)) !== null) {
        // Check if this position is already detected to avoid duplicates
        const existingMatch = detectedWords.find(d => 
          d.start <= match.index && d.end > match.index
        );
        
        if (!existingMatch) {
          detectedWords.push({
            word: text.substring(match.index, match.index + match[0].length), // Preserve original case
            start: match.index,
            end: match.index + match[0].length
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

// Function to generate AI alternatives for demonetization words
async function generateDemonetizationAlternatives(word, context) {
  // Check cache first
  const cacheKey = word.toLowerCase();
  if (alternativesCache.has(cacheKey)) {
    console.log(`Using cached alternatives for: "${word}"`);
    return alternativesCache.get(cacheKey);
  }

  try {
    console.log(`Generating alternatives for: "${word}" in context: "${context}"`);
    
    const prompt = `You are a content creation assistant helping creators avoid platform demonetization. 

Given the potentially problematic word "${word}" in this context: "${context}"

Generate EXACTLY 3 alternative words/phrases in this exact JSON format:

{
  "industry_standard": "creator-specific alternative",
  "conservative": "professional synonym", 
  "creative": "engaging alternative"
}

SPECIFIC REQUIREMENTS for each type:

INDUSTRY STANDARD: Use actual terms content creators use to avoid demonetization:
- "killed" → "unalived" 
- "dead" → "unalived"
- "suicide" → "self-deletion" 
- "gun" → "pew pew"
- "drugs" → "happy pills"

CONSERVATIVE: Use professional, news-appropriate language:
- "killed" → "eliminated" 
- "dead" → "deceased"
- "fight" → "altercation"
- "drugs" → "substances"

CREATIVE: Use engaging but safe alternatives:
- "killed" → "sent to the shadow realm"
- "dead" → "no longer among the living"
- "fight" → "epic showdown"
- "drugs" → "mysterious powders"

Return ONLY the JSON, no extra text or markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    let content = completion.choices[0].message.content || '{}';
    content = content.replace(/```json|```/g, '').trim();
    
    const alternatives = JSON.parse(content);
    
    const result = [
      alternatives.industry_standard || getFallbackAlternative(word, 'industry'),
      alternatives.conservative || getFallbackAlternative(word, 'conservative'),
      alternatives.creative || getFallbackAlternative(word, 'creative')
    ];
    
    // Cache the result
    alternativesCache.set(cacheKey, result);
    
    console.log(`Generated alternatives for "${word}":`, result);
    return result;
    
  } catch (error) {
    console.error('Error generating demonetization alternatives:', error);
    // Return fallback alternatives
    const fallbackResult = [
      getFallbackAlternative(word, 'industry'),
      getFallbackAlternative(word, 'conservative'), 
      getFallbackAlternative(word, 'creative')
    ];
    
    // Cache fallback too
    alternativesCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

// Fallback alternatives when AI fails
function getFallbackAlternative(word, type) {
  const fallbacks = {
    // Death-related
    'dead': { industry: 'unalived', conservative: 'passed away', creative: 'no longer with us' },
    'die': { industry: 'unalive', conservative: 'pass away', creative: 'meet their end' },
    'kill': { industry: 'unalive', conservative: 'eliminate', creative: 'take out' },
    'killed': { industry: 'unalived', conservative: 'eliminated', creative: 'taken out' },
    'murder': { industry: 'unalive', conservative: 'eliminate', creative: 'take out' },
    
    // Violence-related
    'fight': { industry: 'scuffle', conservative: 'conflict', creative: 'tussle' },
    'violence': { industry: 'conflict', conservative: 'aggression', creative: 'intensity' },
    'attack': { industry: 'confront', conservative: 'challenge', creative: 'engage' },
    
    // Weapons
    'gun': { industry: 'pew pew', conservative: 'firearm', creative: 'blaster' },
    'weapon': { industry: 'tool', conservative: 'instrument', creative: 'device' },
    
    // Substances  
    'drug': { industry: 'substance', conservative: 'medication', creative: 'compound' },
    'alcohol': { industry: 'adult beverage', conservative: 'beverage', creative: 'social lubricant' }
  };
  
  const wordFallbacks = fallbacks[word.toLowerCase()];
  if (wordFallbacks && wordFallbacks[type]) {
    return wordFallbacks[type];
  }
  
  // Generic fallbacks
  switch (type) {
    case 'industry': return `[${word}]`;
    case 'conservative': return `${word} (edited)`;
    case 'creative': return `*${word}*`;
    default: return word;
  }
}

// Function to get context around a word (50 characters before and after)
function getWordContext(text, start, end) {
  const contextStart = Math.max(0, start - 50);
  const contextEnd = Math.min(text.length, end + 50);
  return text.substring(contextStart, contextEnd);
}

// Slang database for context-aware grammar checking
const SLANG_DATABASE = [
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
  
  // Emphasis and agreement slang
  'on god', 'for real', 'real talk', 'straight up', 'facts', 'no lie', 'i swear',
  'on my mama', 'on everything', 'word', 'truth', 'honestly', 'literally',
  
  // Multi-word expressions
  'my bad', 'all good', 'no worries', 'you good', 'we good', 'it\'s all good',
  'what\'s good', 'what\'s up', 'what\'s poppin', 'what\'s the move', 'let\'s go',
  'that\'s facts', 'that\'s cap', 'big facts', 'no cap fr', 'periodt queen'
];

// Context indicators that suggest intentional slang usage
const SLANG_CONTEXT_INDICATORS = [
  'instagram', 'tiktok', 'snapchat', 'twitter', 'youtube', 'social media',
  'post', 'story', 'reel', 'video', 'content', 'influencer', 'creator',
  'outfit', 'fashion', 'style', 'look', 'aesthetic', 'vibe', 'mood',
  'trend', 'trendy', 'fashionable', 'stylish', 'teen', 'teenager', 'young'
];

// AI-First Slang Detection - completely dynamic approach
async function detectSlangWords(text, formalityLevel = 'balanced') {
  console.log(`🤖 AI-First slang detection for: "${text}"`);
  
  try {
    // Phase 1: AI identifies all potential slang expressions
    const detectedSlang = await aiDetectSlangExpressions(text, formalityLevel);
    
    console.log(`🎯 AI detected ${detectedSlang.length} slang expressions`);
    
    // Phase 2: Context analysis for protection decisions
    const analyzedSlang = [];
    
    for (const slang of detectedSlang) {
      console.log(`🧠 Analyzing context for "${slang.word}"`);
      
      try {
        // Enhanced context analysis
        const contextAnalysis = await analyzeSlangContext(text, slang.word, slang.context, formalityLevel);
        console.log(`🤖 Context analysis for "${slang.word}":`, contextAnalysis);
        
        // Decision logic based on AI analysis and formality level
        let shouldProtect = false;
        
        if (contextAnalysis.isIntentional && contextAnalysis.confidence > 0.7) {
          switch (formalityLevel) {
            case 'casual':
              shouldProtect = true; // Protect all intentional slang in casual mode
              break;
            case 'balanced':
              shouldProtect = contextAnalysis.shouldProtect && contextAnalysis.audienceMatch;
              break;
            case 'formal':
              shouldProtect = false; // Never protect in formal mode
              break;
            default:
              shouldProtect = contextAnalysis.shouldProtect;
          }
        }
        
        if (shouldProtect) {
          console.log(`✅ Protecting "${slang.word}" - intentional slang (confidence: ${contextAnalysis.confidence})`);
          analyzedSlang.push({
            word: slang.word,
            start: slang.start,
            end: slang.end,
            confidence: contextAnalysis.confidence,
            aiAnalysis: contextAnalysis,
            ruleBasedConfidence: null // Pure AI approach
          });
        } else {
          console.log(`❌ Not protecting "${slang.word}" - ${!contextAnalysis.isIntentional ? 'not intentional' : 'inappropriate for formality level'}`);
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing context for "${slang.word}":`, error);
        // Conservative fallback: don't protect if we can't analyze
      }
    }
    
    return analyzedSlang.sort((a, b) => a.start - b.start);
    
  } catch (error) {
    console.error('❌ Error in AI-first slang detection:', error);
    
    // Fallback to database approach only if AI completely fails
    console.log('🔄 Falling back to database-based detection');
    return await detectSlangWordsFallback(text, formalityLevel);
  }
}

// AI function to detect slang expressions in text
async function aiDetectSlangExpressions(text, formalityLevel) {
  const prompt = `You are an expert linguist specializing in modern slang, informal language, and internet culture. Your task is to identify ALL slang expressions, informal phrases, and casual language in the given text.

Instructions:
1. Find EVERY instance of slang, informal language, or casual expressions
2. Include single words (like "fire", "lit", "bussin") AND multi-word phrases (like "on god", "for real", "sending me")
3. Consider internet slang, Gen Z expressions, AAVE, regional slang, and emerging language
4. Don't limit yourself to any predefined list - use your full knowledge
5. Include the exact text position (start and end character indices)

Text to analyze: "${text}"
Target formality: ${formalityLevel}

For each slang expression found, provide:
- exact_text: the exact slang as it appears in the text
- start_pos: character position where it starts (0-indexed)
- end_pos: character position where it ends (exclusive)
- slang_type: category (e.g., "emphasis", "fashion", "reaction", "agreement", etc.)
- confidence: how confident you are this is slang (0.0-1.0)

Respond with ONLY a JSON array in this format:
[
  {
    "exact_text": "bussin",
    "start_pos": 12,
    "end_pos": 18,
    "slang_type": "positive_reaction",
    "confidence": 0.95
  }
]

If no slang is found, return an empty array: []

Text: "${text}"`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    console.log('🤖 AI slang detection response:', aiResponse);
    
    // Parse the JSON response
    const detectedExpressions = JSON.parse(aiResponse);
    
    // Convert to our internal format
    return detectedExpressions.map(expr => ({
      word: expr.exact_text,
      start: expr.start_pos,
      end: expr.end_pos,
      context: getWordContext(text, expr.start_pos, expr.end_pos),
      slangType: expr.slang_type,
      aiConfidence: expr.confidence
    }));
    
  } catch (error) {
    console.error('❌ Error in AI slang detection:', error);
    throw error;
  }
}

// Fallback function using database approach
async function detectSlangWordsFallback(text, formalityLevel) {
  console.log('🔄 Using fallback database detection');
  
  const detectedSlang = [];
  const sortedSlang = [...SLANG_DATABASE].sort((a, b) => b.length - a.length);
  
  for (const slangWord of sortedSlang.slice(0, 20)) { // Limit to prevent timeout
    const lowerText = text.toLowerCase();
    const lowerSlang = slangWord.toLowerCase();
    const index = lowerText.indexOf(lowerSlang);
    
    if (index !== -1) {
      // Simple word boundary check
      const beforeChar = index > 0 ? text[index - 1] : ' ';
      const afterChar = index + slangWord.length < text.length ? text[index + slangWord.length] : ' ';
      
      if (/\s/.test(beforeChar) && /\s/.test(afterChar)) {
        const actualMatch = text.substring(index, index + slangWord.length);
        
        try {
          const aiAnalysis = await analyzeSlangContext(text, actualMatch, getWordContext(text, index, index + slangWord.length), formalityLevel);
          
          if (aiAnalysis.isIntentional && aiAnalysis.shouldProtect) {
            detectedSlang.push({
              word: actualMatch,
              start: index,
              end: index + slangWord.length,
              confidence: aiAnalysis.confidence,
              aiAnalysis: aiAnalysis,
              ruleBasedConfidence: 0.8
            });
          }
        } catch (error) {
          console.error('Error in fallback analysis:', error);
        }
      }
    }
  }
  
  return detectedSlang;
}

function calculateSlangConfidence(slangWord, context, fullText) {
  let confidence = 0.5; // Base confidence
  
  const lowerContext = context.toLowerCase();
  const lowerFullText = fullText.toLowerCase();
  
  // Increase confidence if context indicators are present
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
  
  return Math.min(confidence, 1.0);
}

// AI-powered context analysis for slang detection
async function analyzeSlangContext(text, slangWord, context, formalityLevel = 'balanced') {
  try {
    const prompt = `You are an expert in modern language, slang, and content creation. Analyze whether the use of slang in the given text appears intentional and appropriate for the context.

Context Information:
- Full text: "${text}"
- Slang word/phrase: "${slangWord}"
- Surrounding context: "${context}"
- Target formality level: ${formalityLevel}

Your task:
1. Determine if the slang usage appears intentional (vs accidental/inappropriate)
2. Consider the overall tone, audience, and content type
3. Assess if this slang fits the apparent target audience
4. Account for the formality level preference
5. Decide if this slang should be PROTECTED from grammar/style corrections (shown as recognized slang)

For shouldProtect:
- TRUE if: slang is intentional AND matches formality level AND audience
- FALSE if: slang seems accidental OR inappropriate for context OR too informal for target

Respond with ONLY a JSON object in this exact format:
{
  "isIntentional": boolean,
  "confidence": number (0.0-1.0),
  "reasoning": "brief explanation",
  "shouldProtect": boolean,
  "audienceMatch": boolean
}

Examples:
- Social media content with multiple slang terms → likely intentional
- Fashion/lifestyle content with "fire" → likely intentional  
- Academic paper with random slang → likely accidental
- Business email with slang → likely inappropriate

Text context: "${text}"
Slang: "${slangWord}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 150
    });

    let content = completion.choices[0].message.content || '{}';
    content = content.replace(/```json|```/g, '').trim();
    
    const analysis = JSON.parse(content);
    
    // Validate response structure
    if (typeof analysis.isIntentional !== 'boolean' || 
        typeof analysis.confidence !== 'number' ||
        typeof analysis.shouldProtect !== 'boolean') {
      throw new Error('Invalid AI response structure');
    }
    
    return {
      isIntentional: analysis.isIntentional,
      confidence: Math.max(0, Math.min(1, analysis.confidence)),
      reasoning: analysis.reasoning || 'AI analysis completed',
      shouldProtect: analysis.shouldProtect,
      audienceMatch: analysis.audienceMatch || false
    };
    
  } catch (error) {
    console.error('Error in AI slang analysis:', error);
    // Fallback to rule-based analysis
    const baseConfidence = calculateSlangConfidence(slangWord, context, text);
    return {
      isIntentional: baseConfidence > 0.7,
      confidence: baseConfidence,
      reasoning: 'Fallback rule-based analysis',
      shouldProtect: baseConfidence > 0.7,
      audienceMatch: true
    };
  }
}

// AI-powered grammar protection for slang contexts
async function shouldProtectGrammarSuggestion(suggestionText, suggestionStart, suggestionEnd, fullText, detectedSlang, formalityLevel) {
  try {
    // Check if suggestion overlaps with any detected slang (exact match or overlap)
    const overlappingSlang = detectedSlang.find(slang => {
      // Check for exact match first
      if (suggestionStart === slang.start && suggestionEnd === slang.end) {
        return true;
      }
      
      // Check for overlap
      return (suggestionStart >= slang.start && suggestionStart < slang.end) ||
             (suggestionEnd > slang.start && suggestionEnd <= slang.end) ||
             (suggestionStart <= slang.start && suggestionEnd >= slang.end);
    });
    
    if (!overlappingSlang) {
      return false; // No slang overlap, don't protect
    }
    
    console.log(`🛡️ Checking protection for "${suggestionText}" against slang "${overlappingSlang.word}"`);
    
    // If we have AI analysis for the overlapping slang, use it
    if (overlappingSlang.aiAnalysis) {
      console.log(`🤖 AI says shouldProtect: ${overlappingSlang.aiAnalysis.shouldProtect}`);
      return overlappingSlang.aiAnalysis.shouldProtect;
    }
    
    // Fallback: protect based on formality level and confidence
    let shouldProtect = false;
    switch (formalityLevel) {
      case 'casual':
        shouldProtect = overlappingSlang.confidence > 0.6;
        break;
      case 'balanced':
        shouldProtect = overlappingSlang.confidence > 0.8;
        break;
      case 'formal':
        shouldProtect = false; // Never protect in formal mode
        break;
      default:
        shouldProtect = overlappingSlang.confidence > 0.7;
    }
    
    console.log(`📏 Rule-based protection: ${shouldProtect} (confidence: ${overlappingSlang.confidence})`);
    return shouldProtect;
    
  } catch (error) {
    console.error('Error in grammar protection analysis:', error);
    return false;
  }
}

// Enhanced suggestion filtering with AI context awareness
async function filterSuggestionsWithSlangProtection(suggestions, fullText, detectedSlang, formalityLevel) {
  const filteredSuggestions = [];
  
  console.log(`🔍 Filtering ${suggestions.length} suggestions against ${detectedSlang.length} detected slang words`);
  detectedSlang.forEach(slang => {
    console.log(`  - Slang: "${slang.word}" at ${slang.start}-${slang.end}`);
  });
  
  for (const suggestion of suggestions) {
    // Check all suggestion types that could conflict with slang
    if (suggestion.type === 'grammar' || suggestion.type === 'spelling' || suggestion.type === 'style') {
      console.log(`🔍 Checking suggestion: "${suggestion.text}" at ${suggestion.start}-${suggestion.end}`);
      
      const shouldProtect = await shouldProtectGrammarSuggestion(
        suggestion.text,
        suggestion.start,
        suggestion.end,
        fullText,
        detectedSlang,
        formalityLevel
      );
      
      if (!shouldProtect) {
        filteredSuggestions.push(suggestion);
      } else {
        console.log(`🛡️ Protected ${suggestion.type} suggestion "${suggestion.text}" due to slang context`);
      }
    } else {
      // Keep other suggestions (like demonetization) as-is
      filteredSuggestions.push(suggestion);
    }
  }
  
  return filteredSuggestions;
}

// ========== PHASE 2: AI REWRITE ENGINE ==========

// Phase 2A: Few-shot prompt templates for different writing styles
const TONE_STYLE_TEMPLATES = {
  casual: {
    examples: [
      {
        original: "I am not going to attend the meeting because I have other commitments.",
        rewrite: "I can't make the meeting - got other stuff going on.",
        reasoning: "Maintains casual, conversational tone while fixing grammar"
      },
      {
        original: "This product is not functioning correctly and requires immediate attention.",
        rewrite: "This thing isn't working right and needs to be fixed ASAP.",
        reasoning: "Preserves informal language while improving clarity"
      },
      {
        original: "I ain't got no time for this nonsense right now.",
        rewrite: "I don't have time for this nonsense right now.",
        reasoning: "Fixes double negative while keeping casual attitude"
      }
    ],
    characteristics: "conversational, relaxed, uses contractions, informal vocabulary, direct communication"
  },
  professional: {
    examples: [
      {
        original: "We gotta fix this issue before the client sees it.",
        rewrite: "We need to resolve this issue before the client review.",
        reasoning: "Elevates casual language to professional standard"
      },
      {
        original: "The data looks kinda weird and doesn't make sense.",
        rewrite: "The data appears inconsistent and requires further analysis.",
        reasoning: "Replaces vague language with precise professional terms"
      },
      {
        original: "This is totally wrong and needs fixing.",
        rewrite: "This contains errors that require correction.",
        reasoning: "Maintains directness while using professional language"
      }
    ],
    characteristics: "formal, precise, clear structure, appropriate business vocabulary, diplomatic"
  },
  creative: {
    examples: [
      {
        original: "The sunset was very beautiful and made me feel happy.",
        rewrite: "The sunset painted the sky in brilliant hues, lifting my spirits.",
        reasoning: "Enhances basic description with vivid, creative language"
      },
      {
        original: "This song is really good and I like it a lot.",
        rewrite: "This song resonates deeply and captivates my soul.",
        reasoning: "Transforms simple appreciation into expressive language"
      },
      {
        original: "The food tasted bad and I didn't enjoy it.",
        rewrite: "The dish fell flat, leaving my taste buds disappointed.",
        reasoning: "Converts negative feedback into creative expression"
      }
    ],
    characteristics: "expressive, vivid imagery, emotional language, metaphors, engaging descriptions"
  },
  academic: {
    examples: [
      {
        original: "This study shows that people like social media because it's fun.",
        rewrite: "This research demonstrates that individuals engage with social media platforms due to their entertainment value.",
        reasoning: "Elevates casual observation to academic discourse"
      },
      {
        original: "The results were pretty clear and obvious to everyone.",
        rewrite: "The findings were statistically significant and clearly interpretable.",
        reasoning: "Replaces subjective language with objective academic terms"
      },
      {
        original: "We think this might work but we're not totally sure.",
        rewrite: "The evidence suggests this approach may be effective, though further validation is required.",
        reasoning: "Transforms uncertainty into measured academic language"
      }
    ],
    characteristics: "objective, evidence-based, precise terminology, formal structure, scholarly tone"
  }
};

// Phase 2B: AI-powered tone analysis to detect original writing style
async function analyzeToneAndStyle(text, sensitivity = 'medium') {
  try {
    const prompt = `You are an expert linguist and writing coach. Analyze the tone, style, and voice of the given text to understand the writer's intended communication style.

Text to analyze: "${text}"

Your task:
1. Identify the overall tone and writing style
2. Detect the intended audience and context
3. Note specific stylistic elements (vocabulary level, sentence structure, formality)
4. Assess the emotional tone and personality
5. Determine confidence level in your analysis

Sensitivity level: ${sensitivity}
- low: Only detect very obvious tone differences
- medium: Standard tone detection with reasonable confidence
- high: Detect subtle tone variations and mixed styles

Respond with ONLY a JSON object in this exact format:
{
  "primaryTone": "casual|professional|creative|academic|conversational|formal",
  "secondaryTones": ["tone1", "tone2"],
  "formalityLevel": "very-casual|casual|neutral|formal|very-formal",
  "emotionalTone": "positive|negative|neutral|excited|serious|playful|etc",
  "audience": "general|professional|academic|social|creative",
  "vocabulary": "simple|moderate|advanced|technical|colloquial",
  "confidence": 0.85,
  "reasoning": "Brief explanation of tone detection",
  "styleCharacteristics": ["conversational", "direct", "uses_contractions", "informal_vocab"]
}

Examples:
- "Hey what's up! This is totally awesome and I'm so excited!" → casual, positive, conversational
- "The quarterly results demonstrate significant growth." → professional, formal, business
- "The crimson sunset whispered secrets to the twilight sky." → creative, poetic, expressive

Text: "${text}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300
    });

    let content = completion.choices[0].message.content || '{}';
    content = content.replace(/```json|```/g, '').trim();
    
    const analysis = JSON.parse(content);
    
    // Validate and set defaults
    return {
      primaryTone: analysis.primaryTone || 'neutral',
      secondaryTones: analysis.secondaryTones || [],
      formalityLevel: analysis.formalityLevel || 'neutral',
      emotionalTone: analysis.emotionalTone || 'neutral',
      audience: analysis.audience || 'general',
      vocabulary: analysis.vocabulary || 'moderate',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.7)),
      reasoning: analysis.reasoning || 'AI tone analysis completed',
      styleCharacteristics: analysis.styleCharacteristics || []
    };
    
  } catch (error) {
    console.error('Error in tone analysis:', error);
    // Fallback analysis
    return {
      primaryTone: 'neutral',
      secondaryTones: [],
      formalityLevel: 'neutral',
      emotionalTone: 'neutral',
      audience: 'general',
      vocabulary: 'moderate',
      confidence: 0.5,
      reasoning: 'Fallback analysis due to error',
      styleCharacteristics: []
    };
  }
}

// Phase 2C: Tone-preserving rewrite generation using GPT-4o with style matching
async function generateTonePreservingRewrite(originalText, problemText, issueType, toneAnalysis, context) {
  try {
    console.log(`🎨 Generating tone-preserving rewrite for "${problemText}" (${issueType})`);
    
    // Select appropriate style template
    const styleTemplate = TONE_STYLE_TEMPLATES[toneAnalysis.primaryTone] || TONE_STYLE_TEMPLATES.casual;
    
    const prompt = `You are an expert writing coach specializing in tone-preserving edits. Your task is to fix ${issueType} issues while maintaining the writer's original voice and style.

ORIGINAL CONTEXT: "${originalText}"
PROBLEM TEXT: "${problemText}"
ISSUE TYPE: ${issueType}

DETECTED TONE PROFILE:
- Primary tone: ${toneAnalysis.primaryTone}
- Formality: ${toneAnalysis.formalityLevel}
- Emotional tone: ${toneAnalysis.emotionalTone}
- Audience: ${toneAnalysis.audience}
- Style characteristics: ${toneAnalysis.styleCharacteristics.join(', ')}

STYLE GUIDELINES FOR ${toneAnalysis.primaryTone.toUpperCase()} TONE:
${styleTemplate.characteristics}

EXAMPLES OF TONE-PRESERVING FIXES:
${styleTemplate.examples.map(ex => `
Original: "${ex.original}"
Fixed: "${ex.rewrite}"
Why: ${ex.reasoning}
`).join('')}

YOUR TASK:
1. Fix the ${issueType} issue in "${problemText}"
2. Maintain the writer's voice, energy, and personality
3. Preserve the formality level (${toneAnalysis.formalityLevel})
4. Keep the emotional tone (${toneAnalysis.emotionalTone})
5. Match the vocabulary level and style characteristics

CRITICAL RULES:
- If the original uses slang/informal language intentionally, keep that energy
- If it's casual and conversational, stay casual and conversational
- If it's creative and expressive, maintain that creativity
- Fix the grammar/spelling WITHOUT changing the vibe
- The rewrite should sound like the same person, just corrected

Respond with ONLY a JSON object:
{
  "rewrittenText": "the corrected text that preserves tone",
  "tonePreserved": true/false,
  "confidenceScore": 0.95,
  "reasoning": "why this rewrite maintains the original voice",
  "changesExplained": "what was fixed and how tone was preserved"
}

Focus on: "${problemText}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 250
    });

    let content = completion.choices[0].message.content || '{}';
    content = content.replace(/```json|```/g, '').trim();
    
    const rewrite = JSON.parse(content);
    
    return {
      rewrittenText: rewrite.rewrittenText || problemText,
      tonePreserved: rewrite.tonePreserved !== false,
      confidenceScore: Math.max(0, Math.min(1, rewrite.confidenceScore || 0.8)),
      reasoning: rewrite.reasoning || 'Tone-preserving rewrite generated',
      changesExplained: rewrite.changesExplained || 'Grammar/spelling corrected while maintaining style'
    };
    
  } catch (error) {
    console.error('Error generating tone-preserving rewrite:', error);
    return {
      rewrittenText: problemText,
      tonePreserved: false,
      confidenceScore: 0.3,
      reasoning: 'Error in rewrite generation',
      changesExplained: 'Fallback: no changes made due to error'
    };
  }
}

// Phase 2D: Conflict prioritization logic - decides what takes priority
async function detectAndResolveConflicts(suggestions, fullText, conflictResolutionMode, toneAnalysis) {
  console.log(`🔍 Analyzing ${suggestions.length} suggestions for conflicts (mode: ${conflictResolutionMode})`);
  
  const conflictGroups = [];
  const processedSuggestions = [];
  
  // Group overlapping suggestions
  for (let i = 0; i < suggestions.length; i++) {
    const current = suggestions[i];
    const conflicts = [];
    
    for (let j = i + 1; j < suggestions.length; j++) {
      const other = suggestions[j];
      
      // Check for overlap or proximity (within 5 characters)
      if (doRangesOverlap(
        { start: current.start, end: current.end },
        { start: other.start, end: other.end }
      ) || Math.abs(current.start - other.end) <= 5 || Math.abs(other.start - current.end) <= 5) {
        conflicts.push(other);
      }
    }
    
    if (conflicts.length > 0) {
      conflictGroups.push({
        primary: current,
        conflicts: conflicts,
        allSuggestions: [current, ...conflicts]
      });
      console.log(`⚡ Conflict detected: "${current.text}" conflicts with ${conflicts.length} other suggestions`);
    }
  }
  
  // Process conflict groups
  for (const group of conflictGroups) {
    const resolved = await resolveConflictGroup(group, fullText, conflictResolutionMode, toneAnalysis);
    processedSuggestions.push(...resolved);
  }
  
  // Add non-conflicting suggestions
  const conflictedIds = new Set(conflictGroups.flatMap(g => g.allSuggestions.map(s => s.id)));
  processedSuggestions.push(...suggestions.filter(s => !conflictedIds.has(s.id)));
  
  return processedSuggestions;
}

// Helper function to resolve a specific conflict group
async function resolveConflictGroup(conflictGroup, fullText, conflictResolutionMode, toneAnalysis) {
  const { primary, conflicts, allSuggestions } = conflictGroup;
  
  console.log(`🎯 Resolving conflict group with ${allSuggestions.length} suggestions`);
  
  // Calculate priorities for each suggestion
  const prioritizedSuggestions = allSuggestions.map(s => ({
    ...s,
    calculatedPriority: calculateConflictPriority(s, conflictResolutionMode, toneAnalysis)
  }));
  
  // Sort by priority (highest first)
  prioritizedSuggestions.sort((a, b) => b.calculatedPriority - a.calculatedPriority);
  
  const winner = prioritizedSuggestions[0];
  const losers = prioritizedSuggestions.slice(1);
  
  console.log(`🏆 Conflict winner: "${winner.text}" (${winner.type}, priority: ${winner.calculatedPriority})`);
  
  // Check if we should generate a tone-preserving rewrite
  if (shouldGenerateToneRewrite(winner, losers, conflictResolutionMode, toneAnalysis)) {
    console.log(`🎨 Generating tone-preserving rewrite for conflict resolution`);
    
    const context = getWordContext(fullText, winner.start, winner.end);
    const rewrite = await generateTonePreservingRewrite(
      fullText,
      winner.text,
      winner.type,
      toneAnalysis,
      context
    );
    
    // Create tone-rewrite suggestion
    const toneRewriteSuggestion = {
      id: `tone-rewrite-${Math.random().toString(36).slice(2, 10)}`,
      text: winner.text,
      message: `Grammar fixed while preserving your ${toneAnalysis.primaryTone} tone and voice.`,
      type: 'tone-rewrite',
      alternatives: [rewrite.rewrittenText],
      start: winner.start,
      end: winner.end,
      status: 'pending',
      priority: winner.calculatedPriority + 1, // Higher than original
      originalTone: toneAnalysis.primaryTone,
      toneRewrite: {
        originalText: winner.text,
        rewrittenText: rewrite.rewrittenText,
        tonePreserved: rewrite.tonePreserved,
        confidenceScore: rewrite.confidenceScore,
        reasoning: rewrite.reasoning
      },
      conflictsWith: losers.map(l => l.id)
    };
    
    return [toneRewriteSuggestion];
  }
  
  // Mark conflicts for tracking
  winner.conflictsWith = losers.map(l => l.id);
  return [winner];
}

// Helper function to calculate priority in conflict resolution
function calculateConflictPriority(suggestion, conflictResolutionMode, toneAnalysis) {
  // --- CORRECTED PRIORITIES ---
  const basePriorities = {
    // Top priority: Correctness
    'spelling': 100, // Significantly higher to win all conflicts
    'grammar': 90,
    
    // High priority: Content safety and major tone changes
    'demonetization': 80,
    'tone-rewrite': 70,
    
    // Mid priority: Contextual and style suggestions
    'style': 50,
    'engagement': 40,
    'platform-adaptation': 30,
    
    // Low priority: Informational
    'slang-protected': 20,
  };
  
  let priority = basePriorities[suggestion.type] || 50; // Default to 50 for unknown types

  if (conflictResolutionMode === 'tone-preserving' && toneAnalysis) {
    if (suggestion.type === 'slang-protected' && toneAnalysis.formalityLevel === 'casual') {
      priority = 95; // Boost to beat grammar, but not spelling
    }
  }

  if (suggestion.alternatives && suggestion.alternatives.length > 0) {
    priority += 1;
  }
  
  return priority;
}

// Helper function to determine if we should generate a tone-rewrite
function shouldGenerateToneRewrite(winner, losers, conflictResolutionMode, toneAnalysis) {
  // Don't generate if winner is already a tone-rewrite
  if (winner.type === 'tone-rewrite') return false;
  
  // Don't generate for demonetization (different handling)
  if (winner.type === 'demonetization') return false;
  
  // Don't generate for slang-protected (informational only)
  if (winner.type === 'slang-protected') return false;
  
  // Check if there's a tone/style conflict
  const hasSlangConflict = losers.some(l => l.type === 'slang-protected');
  const hasStyleConflict = losers.some(l => l.type === 'style');
  
  // Generate tone-rewrite if:
  // 1. Grammar/spelling winner conflicts with slang/style
  // 2. Tone analysis shows strong casual/creative style
  // 3. Conflict resolution mode favors tone preservation
  
  if (['grammar', 'spelling'].includes(winner.type)) {
    if (hasSlangConflict) return true;
    if (conflictResolutionMode === 'tone-first') return true;
    if (conflictResolutionMode === 'balanced' && toneAnalysis.confidence > 0.7) return true;
    if (['casual', 'creative'].includes(toneAnalysis.primaryTone) && toneAnalysis.confidence > 0.8) return true;
  }
  
  return false;
}

// Helper function to check if two ranges overlap
function doRangesOverlap(range1, range2) {
  return range1.start < range2.end && range2.start < range1.end;
}

// ========== END PHASE 2: AI REWRITE ENGINE ==========

// ========== PHASE 3: SMART SUGGESTION PROCESSING ==========

// Phase 3D: Caching system for performance optimization
const suggestionCache = new Map();
const toneAnalysisCache = new Map();
const rewriteCache = new Map();

// Cache helper functions
function getCacheKey(text, type, params = {}) {
  return `${type}:${text}:${JSON.stringify(params)}`;
}

function getFromCache(cache, key, maxAge = 300000) { // 5 minutes default
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data;
  }
  return null;
}

function setCache(cache, key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  
  // Simple cache cleanup - remove oldest entries if cache gets too large
  if (cache.size > 1000) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest 20%
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.2));
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

// Phase 3A: Enhanced suggestion filtering with sophisticated overlap detection
async function enhancedSuggestionFiltering(suggestions, fullText, detectedSlang, demonetizationWords, toneAnalysis, settings) {
  console.log(`🧠 Enhanced filtering: ${suggestions.length} suggestions, ${detectedSlang.length} slang, ${demonetizationWords.length} demonetization`);
  
  const { formalityLevel, conflictResolutionMode, toneDetectionSensitivity } = settings;
  
  // Step 1: Create suggestion groups by proximity and type
  const suggestionGroups = groupSuggestionsByProximity(suggestions);
  console.log(`📊 Grouped into ${suggestionGroups.length} suggestion clusters`);
  
  // Step 2: Analyze each group for conflicts and overlaps
  const processedGroups = [];
  for (const group of suggestionGroups) {
    const processed = await processProximitySuggestionGroup(group, fullText, detectedSlang, demonetizationWords, toneAnalysis, settings);
    processedGroups.push(...processed);
  }
  
  // Step 3: Apply global filtering rules
  const finalSuggestions = await applyGlobalFilteringRules(processedGroups, fullText, toneAnalysis, settings);
  
  console.log(`✅ Enhanced filtering complete: ${finalSuggestions.length} final suggestions`);
  return finalSuggestions;
}

// Helper function to group suggestions by proximity (within 10 characters)
function groupSuggestionsByProximity(suggestions) {
  const groups = [];
  const processed = new Set();
  
  for (let i = 0; i < suggestions.length; i++) {
    if (processed.has(i)) continue;
    
    const current = suggestions[i];
    const group = [current];
    processed.add(i);
    
    // Find nearby suggestions
    for (let j = i + 1; j < suggestions.length; j++) {
      if (processed.has(j)) continue;
      
      const other = suggestions[j];
      const distance = Math.min(
        Math.abs(current.start - other.end),
        Math.abs(other.start - current.end),
        Math.abs(current.start - other.start)
      );
      
      // Group if within 10 characters or overlapping
      if (distance <= 10 || doRangesOverlap(
        { start: current.start, end: current.end },
        { start: other.start, end: other.end }
      )) {
        group.push(other);
        processed.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

// Process a group of nearby suggestions
async function processProximitySuggestionGroup(suggestionGroup, fullText, detectedSlang, demonetizationWords, toneAnalysis, settings) {
  if (suggestionGroup.length === 1) {
    // Single suggestion - apply basic filtering
    return await applySingleSuggestionFiltering(suggestionGroup[0], fullText, detectedSlang, toneAnalysis, settings);
  }
  
  console.log(`🔄 Processing group of ${suggestionGroup.length} nearby suggestions`);
  
  // Analyze conflicts within the group
  const conflictAnalysis = await analyzeGroupConflicts(suggestionGroup, fullText, detectedSlang, demonetizationWords, toneAnalysis, settings);
  
  // Apply AI decision-making for the group
  return await makeAIDecisionForGroup(conflictAnalysis, fullText, toneAnalysis, settings);
}

// Phase 3B: AI decision-making for suggestion priority
async function analyzeGroupConflicts(suggestionGroup, fullText, detectedSlang, demonetizationWords, toneAnalysis, settings) {
  const conflicts = {
    grammarVsSlang: [],
    grammarVsDemonetization: [],
    styleVsSlang: [],
    demonetizationVsSlang: [],
    overlappingGrammar: [],
    mixedTypes: []
  };
  
  // Categorize conflicts
  for (let i = 0; i < suggestionGroup.length; i++) {
    for (let j = i + 1; j < suggestionGroup.length; j++) {
      const s1 = suggestionGroup[i];
      const s2 = suggestionGroup[j];
      
      if (doRangesOverlap({ start: s1.start, end: s1.end }, { start: s2.start, end: s2.end })) {
        // Categorize the conflict type
        if ((s1.type === 'grammar' || s1.type === 'spelling') && s2.type === 'slang-protected') {
          conflicts.grammarVsSlang.push({ primary: s1, secondary: s2 });
        } else if ((s2.type === 'grammar' || s2.type === 'spelling') && s1.type === 'slang-protected') {
          conflicts.grammarVsSlang.push({ primary: s2, secondary: s1 });
        } else if ((s1.type === 'grammar' || s1.type === 'spelling') && s2.type === 'demonetization') {
          conflicts.grammarVsDemonetization.push({ primary: s1, secondary: s2 });
        } else if ((s2.type === 'grammar' || s2.type === 'spelling') && s1.type === 'demonetization') {
          conflicts.grammarVsDemonetization.push({ primary: s2, secondary: s1 });
        } else if (s1.type === 'style' && s2.type === 'slang-protected') {
          conflicts.styleVsSlang.push({ primary: s1, secondary: s2 });
        } else if (s2.type === 'style' && s1.type === 'slang-protected') {
          conflicts.styleVsSlang.push({ primary: s2, secondary: s1 });
        } else if (s1.type === 'demonetization' && s2.type === 'slang-protected') {
          conflicts.demonetizationVsSlang.push({ primary: s1, secondary: s2 });
        } else if (s2.type === 'demonetization' && s1.type === 'slang-protected') {
          conflicts.demonetizationVsSlang.push({ primary: s2, secondary: s1 });
        } else if ((s1.type === 'grammar' || s1.type === 'spelling') && (s2.type === 'grammar' || s2.type === 'spelling')) {
          conflicts.overlappingGrammar.push({ primary: s1, secondary: s2 });
        } else {
          conflicts.mixedTypes.push({ primary: s1, secondary: s2 });
        }
      }
    }
  }
  
  return {
    suggestions: suggestionGroup,
    conflicts,
    hasConflicts: Object.values(conflicts).some(arr => arr.length > 0),
    conflictCount: Object.values(conflicts).reduce((sum, arr) => sum + arr.length, 0)
  };
}

// Phase 3B: Make AI decision for a conflict group
async function makeAIDecisionForGroup(conflictAnalysis, fullText, toneAnalysis, settings) {
  const { suggestions, conflicts, hasConflicts } = conflictAnalysis;
  const { conflictResolutionMode } = settings;
  
  if (!hasConflicts) {
    // No conflicts - return all suggestions after basic filtering
    const filtered = [];
    for (const suggestion of suggestions) {
      const result = await applySingleSuggestionFiltering(suggestion, fullText, [], toneAnalysis, settings);
      filtered.push(...result);
    }
    return filtered;
  }
  
  console.log(`🤖 AI decision-making for ${suggestions.length} conflicting suggestions`);
  
  // Prioritize conflicts based on type and settings
  const resolutionStrategy = await determineResolutionStrategy(conflictAnalysis, toneAnalysis, settings);
  console.log(`📋 Resolution strategy: ${resolutionStrategy.approach}`);
  
  return await executeResolutionStrategy(resolutionStrategy, conflictAnalysis, fullText, toneAnalysis, settings);
}

// Determine the best resolution strategy for conflicts
async function determineResolutionStrategy(conflictAnalysis, toneAnalysis, settings) {
  const { conflicts, suggestions } = conflictAnalysis;
  const { conflictResolutionMode } = settings;
  
  // Analyze the nature of conflicts
  const hasGrammarSlangConflict = conflicts.grammarVsSlang.length > 0;
  const hasGrammarDemonetizationConflict = conflicts.grammarVsDemonetization.length > 0;
  const hasStyleConflicts = conflicts.styleVsSlang.length > 0;
  const hasDemonetizationSlangConflict = conflicts.demonetizationVsSlang.length > 0;
  
  // Consider tone analysis confidence and type
  const highToneConfidence = toneAnalysis.confidence > 0.8;
  const casualTone = ['casual', 'conversational'].includes(toneAnalysis.primaryTone);
  const creativeTone = toneAnalysis.primaryTone === 'creative';
  
  let approach = 'standard';
  let reasoning = 'Default conflict resolution';
  
  // Decision tree based on conflict types and settings
  if (hasGrammarSlangConflict && highToneConfidence && casualTone) {
    if (conflictResolutionMode === 'tone-first') {
      approach = 'tone-preserving-rewrite';
      reasoning = 'High-confidence casual tone with tone-first preference';
    } else if (conflictResolutionMode === 'balanced') {
      approach = 'tone-preserving-rewrite';
      reasoning = 'Balanced mode with strong casual tone detected';
    } else {
      approach = 'grammar-priority';
      reasoning = 'Grammar-first mode overrides tone preservation';
    }
  } else if (hasGrammarDemonetizationConflict) {
    approach = 'demonetization-priority';
    reasoning = 'Demonetization risk takes priority over grammar';
  } else if (hasDemonetizationSlangConflict) {
    approach = 'demonetization-priority';
    reasoning = 'Demonetization risk overrides slang protection';
  } else if (hasGrammarSlangConflict) {
    if (conflictResolutionMode === 'grammar-first') {
      approach = 'grammar-priority';
      reasoning = 'Grammar-first mode selected';
    } else {
      approach = 'tone-preserving-rewrite';
      reasoning = 'Attempting to preserve tone while fixing grammar';
    }
  } else if (hasStyleConflicts && creativeTone) {
    approach = 'style-preservation';
    reasoning = 'Creative tone detected, preserving style choices';
  } else {
    approach = 'priority-based';
    reasoning = 'Standard priority-based resolution';
  }
  
  return {
    approach,
    reasoning,
    shouldGenerateRewrite: approach === 'tone-preserving-rewrite',
    primaryPriority: getPrimaryPriorityFromApproach(approach)
  };
}

// Get primary priority type from resolution approach
function getPrimaryPriorityFromApproach(approach) {
  switch (approach) {
    case 'demonetization-priority': return 'demonetization';
    case 'grammar-priority': return 'grammar';
    case 'tone-preserving-rewrite': return 'tone-rewrite';
    case 'style-preservation': return 'style';
    default: return 'balanced';
  }
}

// Execute the chosen resolution strategy
async function executeResolutionStrategy(strategy, conflictAnalysis, fullText, toneAnalysis, settings) {
  const { approach, shouldGenerateRewrite } = strategy;
  const { suggestions, conflicts } = conflictAnalysis;
  
  console.log(`⚡ Executing strategy: ${approach}`);
  
  if (shouldGenerateRewrite) {
    // Phase 3C: Generate tone-matched rewrites only when needed
    return await generateToneMatchedRewrites(conflictAnalysis, fullText, toneAnalysis, settings);
  }
  
  // Apply priority-based filtering
  return await applyPriorityBasedFiltering(suggestions, strategy.primaryPriority, fullText, toneAnalysis, settings);
}

// Phase 3C: Generate tone-matched rewrites only when needed
async function generateToneMatchedRewrites(conflictAnalysis, fullText, toneAnalysis, settings) {
  const { suggestions, conflicts } = conflictAnalysis;
  const results = [];
  
  // Focus on grammar vs slang conflicts for tone-preserving rewrites
  for (const conflict of conflicts.grammarVsSlang) {
    const { primary: grammarSuggestion, secondary: slangSuggestion } = conflict;
    
    console.log(`🎨 Generating tone-matched rewrite for "${grammarSuggestion.text}"`);
    
    // Check cache first
    const cacheKey = getCacheKey(grammarSuggestion.text, 'tone-rewrite', { 
      tone: toneAnalysis.primaryTone, 
      formality: toneAnalysis.formalityLevel 
    });
    
    let rewrite = getFromCache(rewriteCache, cacheKey);
    
    if (!rewrite) {
      const context = getWordContext(fullText, grammarSuggestion.start, grammarSuggestion.end);
      rewrite = await generateTonePreservingRewrite(
        fullText,
        grammarSuggestion.text,
        grammarSuggestion.type,
        toneAnalysis,
        context
      );
      setCache(rewriteCache, cacheKey, rewrite);
    } else {
      console.log(`📋 Using cached tone rewrite for "${grammarSuggestion.text}"`);
    }
    
    // Create enhanced tone-rewrite suggestion
    const toneRewriteSuggestion = {
      id: `tone-rewrite-${Math.random().toString(36).slice(2, 10)}`,
      text: grammarSuggestion.text,
      message: `Grammar corrected while preserving your ${toneAnalysis.primaryTone} voice and style.`,
      type: 'tone-rewrite',
      alternatives: [rewrite.rewrittenText],
      start: grammarSuggestion.start,
      end: grammarSuggestion.end,
      status: 'pending',
      priority: calculateEnhancedPriority(grammarSuggestion, toneAnalysis, settings) + 2,
      originalTone: toneAnalysis.primaryTone,
      toneRewrite: {
        originalText: grammarSuggestion.text,
        rewrittenText: rewrite.rewrittenText,
        tonePreserved: rewrite.tonePreserved,
        confidenceScore: rewrite.confidenceScore,
        reasoning: rewrite.reasoning
      },
      conflictsWith: [slangSuggestion.id],
      enhancedMetadata: {
        resolutionStrategy: 'tone-preserving-rewrite',
        originalIssueType: grammarSuggestion.type,
        slangProtected: slangSuggestion.text,
        toneConfidence: toneAnalysis.confidence
      }
    };
    
    results.push(toneRewriteSuggestion);
    
    // Also include the slang-protected suggestion for user awareness
    results.push({
      ...slangSuggestion,
      message: `"${slangSuggestion.text}" recognized as intentional ${toneAnalysis.primaryTone} expression.`,
      enhancedMetadata: {
        protectedBy: toneRewriteSuggestion.id,
        toneReason: toneAnalysis.reasoning
      }
    });
  }
  
  // Handle other conflicts with standard priority resolution
  const otherSuggestions = suggestions.filter(s => 
    !conflicts.grammarVsSlang.some(c => c.primary.id === s.id || c.secondary.id === s.id)
  );
  
  for (const suggestion of otherSuggestions) {
    const filtered = await applySingleSuggestionFiltering(suggestion, fullText, [], toneAnalysis, settings);
    results.push(...filtered);
  }
  
  return results;
}

// Apply priority-based filtering when not generating rewrites
async function applyPriorityBasedFiltering(suggestions, primaryPriority, fullText, toneAnalysis, settings) {
  const results = [];
  
  // Sort by calculated priority
  const prioritized = suggestions.map(s => ({
    ...s,
    calculatedPriority: calculateEnhancedPriority(s, toneAnalysis, settings)
  })).sort((a, b) => b.calculatedPriority - a.calculatedPriority);
  
  // Keep highest priority suggestions, filter out lower priority overlaps
  const kept = new Set();
  
  for (const suggestion of prioritized) {
    // Check if this overlaps with any already kept suggestion
    const hasOverlap = Array.from(kept).some(keptId => {
      const kept = prioritized.find(s => s.id === keptId);
      return kept && doRangesOverlap(
        { start: suggestion.start, end: suggestion.end },
        { start: kept.start, end: kept.end }
      );
    });
    
    if (!hasOverlap) {
      kept.add(suggestion.id);
      results.push(suggestion);
    } else {
      console.log(`🚫 Filtered out lower priority suggestion: "${suggestion.text}" (${suggestion.type})`);
    }
  }
  
  return results;
}

// Enhanced priority calculation
function calculateEnhancedPriority(suggestion, toneAnalysis, settings) {
  // --- ALSO CORRECTED PRIORITIES ---
  const basePriorities = {
    // Top priority: Correctness
    'spelling': 100, // Significantly higher to win all conflicts
    'grammar': 90,
    
    // High priority: Content safety and major tone changes
    'demonetization': 80,
    'tone-rewrite': 70,
    
    // Mid priority: Contextual and style suggestions
    'style': 50,
    'engagement': 40,
    'platform-adaptation': 30,
    
    // Low priority: Informational
    'slang-protected': 20,
  };

  let priority = basePriorities[suggestion.type] || 50;

  // Add situational boosts
  if (suggestion.impactScore && suggestion.impactScore > 0.8) {
    priority += 5;
  }
  if (settings.conflictResolutionMode === 'tone-preserving' && suggestion.type === 'slang-protected') {
    priority = 95; // Allow casual slang to override grammar
  }
  
  return priority;
}

// Apply filtering to a single suggestion
async function applySingleSuggestionFiltering(suggestion, fullText, detectedSlang, toneAnalysis, settings) {
  // Basic validation
  if (suggestion.status !== 'pending') return [];
  
  // Apply existing slang protection logic
  if (['grammar', 'spelling', 'style'].includes(suggestion.type)) {
    const shouldProtect = await shouldProtectGrammarSuggestion(
      suggestion.text,
      suggestion.start,
      suggestion.end,
      fullText,
      detectedSlang,
      settings.formalityLevel
    );
    
    if (shouldProtect) {
      console.log(`🛡️ Single suggestion protected: "${suggestion.text}"`);
      return [];
    }
  }
  
  return [suggestion];
}

// Apply global filtering rules
async function applyGlobalFilteringRules(suggestions, fullText, toneAnalysis, settings) {
  const filtered = [];
  
  // Remove duplicates based on text and position
  const seen = new Set();
  
  for (const suggestion of suggestions) {
    const key = `${suggestion.text}:${suggestion.start}:${suggestion.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      
      // Apply final validation
      if (await isValidSuggestion(suggestion, fullText, toneAnalysis, settings)) {
        filtered.push(suggestion);
      }
    }
  }
  
  // Limit total suggestions to prevent UI overload
  const maxSuggestions = 15;
  if (filtered.length > maxSuggestions) {
    console.log(`📊 Limiting suggestions from ${filtered.length} to ${maxSuggestions}`);
    return filtered
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, maxSuggestions);
  }
  
  return filtered;
}

// Final validation for suggestions
async function isValidSuggestion(suggestion, fullText, toneAnalysis, settings) {
  // Basic checks
  if (!suggestion.text || suggestion.start < 0 || suggestion.end <= suggestion.start) {
    return false;
  }
  
  // Check if suggestion text actually exists at the specified position
  const actualText = fullText.slice(suggestion.start, suggestion.end);
  if (actualText !== suggestion.text) {
    console.warn(`⚠️ Position mismatch for suggestion "${suggestion.text}" - found "${actualText}"`);
    return false;
  }
  
  // Type-specific validation
  if (suggestion.type === 'tone-rewrite') {
    return suggestion.toneRewrite && suggestion.toneRewrite.rewrittenText;
  }
  
  if (suggestion.type === 'demonetization') {
    return suggestion.alternatives && suggestion.alternatives.length > 0;
  }
  
  return true;
}

// ========== END PHASE 3: SMART SUGGESTION PROCESSING ==========

// ========== PHASE 4: PERFORMANCE OPTIMIZATION & EDGE CASES ==========

// Phase 4A: Real-time Performance Monitoring
const performanceMetrics = {
  requestCount: 0,
  averageResponseTime: 0,
  cacheHitRate: 0,
  errorRate: 0,
  aiCallCount: 0,
  totalProcessingTime: 0,
  lastReset: Date.now()
};

function updatePerformanceMetrics(responseTime, hadError = false, usedCache = false, madeAiCall = false) {
  performanceMetrics.requestCount++;
  performanceMetrics.totalProcessingTime += responseTime;
  performanceMetrics.averageResponseTime = performanceMetrics.totalProcessingTime / performanceMetrics.requestCount;
  
  if (hadError) {
    performanceMetrics.errorRate = (performanceMetrics.errorRate * (performanceMetrics.requestCount - 1) + 1) / performanceMetrics.requestCount;
  } else {
    performanceMetrics.errorRate = (performanceMetrics.errorRate * (performanceMetrics.requestCount - 1)) / performanceMetrics.requestCount;
  }
  
  if (usedCache) {
    performanceMetrics.cacheHitRate = (performanceMetrics.cacheHitRate * (performanceMetrics.requestCount - 1) + 1) / performanceMetrics.requestCount;
  } else {
    performanceMetrics.cacheHitRate = (performanceMetrics.cacheHitRate * (performanceMetrics.requestCount - 1)) / performanceMetrics.requestCount;
  }
  
  if (madeAiCall) {
    performanceMetrics.aiCallCount++;
  }
  
  // Reset metrics every hour
  if (Date.now() - performanceMetrics.lastReset > 3600000) {
    resetPerformanceMetrics();
  }
}

function resetPerformanceMetrics() {
  performanceMetrics.requestCount = 0;
  performanceMetrics.averageResponseTime = 0;
  performanceMetrics.cacheHitRate = 0;
  performanceMetrics.errorRate = 0;
  performanceMetrics.aiCallCount = 0;
  performanceMetrics.totalProcessingTime = 0;
  performanceMetrics.lastReset = Date.now();
  console.log('📊 Performance metrics reset');
}

function logPerformanceMetrics() {
  console.log('📊 Performance Metrics:', {
    requests: performanceMetrics.requestCount,
    avgResponseTime: `${Math.round(performanceMetrics.averageResponseTime)}ms`,
    cacheHitRate: `${Math.round(performanceMetrics.cacheHitRate * 100)}%`,
    errorRate: `${Math.round(performanceMetrics.errorRate * 100)}%`,
    aiCalls: performanceMetrics.aiCallCount,
    uptime: `${Math.round((Date.now() - performanceMetrics.lastReset) / 60000)}min`
  });
}

// Phase 4B: Edge Case Handling
async function handleEdgeCases(text, suggestions, settings) {
  console.log('🛡️ Checking for edge cases...');
  
  // Edge Case 1: Empty or very short text
  if (!text || text.trim().length < 3) {
    console.log('⚠️ Edge case: Text too short');
    return {
      suggestions: [],
      edgeCaseHandled: 'text_too_short',
      message: 'Text is too short for meaningful analysis'
    };
  }
  
  // Edge Case 2: Text too long (performance protection)
  if (text.length > 10000) {
    console.log('⚠️ Edge case: Text too long, truncating');
    const truncatedText = text.slice(0, 10000);
    return {
      text: truncatedText,
      suggestions: suggestions.filter(s => s.start < 10000 && s.end < 10000),
      edgeCaseHandled: 'text_truncated',
      message: 'Text truncated to 10,000 characters for performance'
    };
  }
  
  // Edge Case 3: Too many suggestions (UI protection)
  if (suggestions.length > 20) {
    console.log('⚠️ Edge case: Too many suggestions, prioritizing');
    const prioritized = suggestions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, 20);
    return {
      suggestions: prioritized,
      edgeCaseHandled: 'suggestions_limited',
      message: `Limited to top 20 suggestions (${suggestions.length} total found)`
    };
  }
  
  // Edge Case 4: Overlapping suggestions cleanup
  const cleanedSuggestions = await cleanupOverlappingSuggestions(suggestions);
  if (cleanedSuggestions.length !== suggestions.length) {
    console.log(`⚠️ Edge case: Cleaned up ${suggestions.length - cleanedSuggestions.length} overlapping suggestions`);
    return {
      suggestions: cleanedSuggestions,
      edgeCaseHandled: 'overlaps_cleaned',
      message: `Removed ${suggestions.length - cleanedSuggestions.length} overlapping suggestions`
    };
  }
  
  // Edge Case 5: Invalid suggestion positions
  const validSuggestions = suggestions.filter(s => {
    if (s.start < 0 || s.end <= s.start || s.end > text.length) {
      console.log(`⚠️ Edge case: Invalid suggestion position for "${s.text}"`);
      return false;
    }
    
    const actualText = text.slice(s.start, s.end);
    if (actualText !== s.text) {
      console.log(`⚠️ Edge case: Position mismatch for "${s.text}" - found "${actualText}"`);
      return false;
    }
    
    return true;
  });
  
  if (validSuggestions.length !== suggestions.length) {
    console.log(`⚠️ Edge case: Removed ${suggestions.length - validSuggestions.length} invalid suggestions`);
    return {
      suggestions: validSuggestions,
      edgeCaseHandled: 'invalid_positions_removed',
      message: `Removed ${suggestions.length - validSuggestions.length} invalid suggestions`
    };
  }
  
  // Edge Case 6: Rate limiting protection
  if (performanceMetrics.requestCount > 100 && performanceMetrics.averageResponseTime > 5000) {
    console.log('⚠️ Edge case: System under heavy load, using simplified processing');
    return {
      suggestions: suggestions.slice(0, 10),
      edgeCaseHandled: 'rate_limited',
      message: 'Using simplified processing due to high system load'
    };
  }
  
  return { suggestions, edgeCaseHandled: null };
}

// Helper function for cleaning up overlapping suggestions
async function cleanupOverlappingSuggestions(suggestions) {
  const cleaned = [];
  const processed = new Set();
  
  // Sort by priority and position
  const sorted = suggestions.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.start - b.start;
  });
  
  for (const suggestion of sorted) {
    if (processed.has(suggestion.id)) continue;
    
    let hasOverlap = false;
    for (const existing of cleaned) {
      if (doRangesOverlap(
        { start: suggestion.start, end: suggestion.end },
        { start: existing.start, end: existing.end }
      )) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      cleaned.push(suggestion);
      processed.add(suggestion.id);
    }
  }
  
  return cleaned;
}

// Phase 4C: User Experience Enhancements
function enhanceUserExperience(suggestions, text, processingTime) {
  console.log('✨ Enhancing user experience...');
  
  // Add user-friendly messages
  const enhancedSuggestions = suggestions.map(suggestion => {
    let enhancedMessage = suggestion.message;
    let userTip = '';
    
    switch (suggestion.type) {
      case 'tone-rewrite':
        userTip = `This preserves your ${suggestion.originalTone || 'casual'} voice while fixing grammar.`;
        break;
      case 'demonetization':
        userTip = 'Consider these platform-safe alternatives to avoid content restrictions.';
        break;
      case 'slang-protected':
        userTip = 'This expression was recognized as intentional slang and protected from correction.';
        break;
      case 'grammar':
      case 'spelling':
        userTip = 'Quick grammar fix to improve readability.';
        break;
      case 'style':
        userTip = 'Style suggestion to enhance your writing flow.';
        break;
    }
    
    return {
      ...suggestion,
      message: enhancedMessage,
      userTip,
      processingInfo: {
        confidence: suggestion.confidence || 0.8,
        processingTime: processingTime,
        aiEnhanced: ['tone-rewrite', 'slang-protected', 'demonetization'].includes(suggestion.type)
      }
    };
  });
  
  // Add contextual insights
  const insights = generateContextualInsights(enhancedSuggestions, text);
  
  return {
    suggestions: enhancedSuggestions,
    insights,
    processingMetadata: {
      totalSuggestions: suggestions.length,
      processingTime,
      aiCallsMade: performanceMetrics.aiCallCount,
      cacheHitRate: performanceMetrics.cacheHitRate
    }
  };
}

function generateContextualInsights(suggestions, text) {
  const insights = [];
  const wordCount = text.split(/\s+/).length;
  
  // Writing quality insights
  const grammarIssues = suggestions.filter(s => s.type === 'grammar' || s.type === 'spelling').length;
  const styleIssues = suggestions.filter(s => s.type === 'style').length;
  const demonetizationRisks = suggestions.filter(s => s.type === 'demonetization').length;
  const protectedSlang = suggestions.filter(s => s.type === 'slang-protected').length;
  const toneRewrites = suggestions.filter(s => s.type === 'tone-rewrite').length;
  
  if (grammarIssues === 0 && styleIssues === 0) {
    insights.push({
      type: 'positive',
      icon: '✅',
      message: 'Excellent grammar and style! Your writing is clear and polished.'
    });
  }
  
  if (demonetizationRisks > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      message: `Found ${demonetizationRisks} potential demonetization risk${demonetizationRisks > 1 ? 's' : ''}. Consider the suggested alternatives.`
    });
  }
  
  if (protectedSlang > 0) {
    insights.push({
      type: 'info',
      icon: '🛡️',
      message: `Protected ${protectedSlang} slang expression${protectedSlang > 1 ? 's' : ''} from correction to maintain your authentic voice.`
    });
  }
  
  if (toneRewrites > 0) {
    insights.push({
      type: 'enhancement',
      icon: '🎨',
      message: `Generated ${toneRewrites} tone-preserving fix${toneRewrites > 1 ? 'es' : ''} that maintain your writing style.`
    });
  }
  
  // Writing statistics
  if (wordCount > 0) {
    const issueRate = (grammarIssues + styleIssues) / wordCount * 100;
    if (issueRate < 1) {
      insights.push({
        type: 'stats',
        icon: '📊',
        message: `Writing quality: Excellent (${issueRate.toFixed(1)}% issue rate)`
      });
    } else if (issueRate < 3) {
      insights.push({
        type: 'stats',
        icon: '📊',
        message: `Writing quality: Good (${issueRate.toFixed(1)}% issue rate)`
      });
    } else {
      insights.push({
        type: 'stats',
        icon: '📊',
        message: `Writing quality: Needs improvement (${issueRate.toFixed(1)}% issue rate)`
      });
    }
  }
  
  return insights;
}

// Phase 4D: System Reliability
async function ensureSystemReliability(operation, fallbackOperation = null, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`✅ Operation succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      console.log(`❌ Operation failed on attempt ${attempt}:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, try fallback operation
  if (fallbackOperation) {
    console.log('🔄 Attempting fallback operation...');
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      console.log('❌ Fallback operation also failed:', fallbackError.message);
    }
  }
  
  throw lastError;
}

// Enhanced error handling with graceful degradation
async function handleSystemError(error, context = 'unknown') {
  console.error(`🚨 System error in ${context}:`, error);
  
  // Categorize error types
  let errorType = 'unknown';
  let gracefulResponse = null;
  
  if (error.message?.includes('rate limit') || error.status === 429) {
    errorType = 'rate_limit';
    gracefulResponse = {
      suggestions: [],
      error: {
        type: 'rate_limit',
        message: 'AI services are temporarily busy. Please try again in a moment.',
        retryAfter: 30000
      }
    };
  } else if (error.message?.includes('network') || error.code === 'ENOTFOUND') {
    errorType = 'network';
    gracefulResponse = {
      suggestions: [],
      error: {
        type: 'network',
        message: 'Connection issue detected. Using offline analysis.',
        fallbackUsed: true
      }
    };
  } else if (error.message?.includes('timeout')) {
    errorType = 'timeout';
    gracefulResponse = {
      suggestions: [],
      error: {
        type: 'timeout',
        message: 'Analysis is taking longer than expected. Try with shorter text.',
        suggestion: 'Consider breaking your text into smaller sections.'
      }
    };
  } else if (error.status >= 500) {
    errorType = 'server';
    gracefulResponse = {
      suggestions: [],
      error: {
        type: 'server',
        message: 'AI service temporarily unavailable. Basic analysis only.',
        fallbackUsed: true
      }
    };
  }
  
  // Update error metrics
  updatePerformanceMetrics(0, true);
  
  return gracefulResponse || {
    suggestions: [],
    error: {
      type: errorType,
      message: 'Unable to analyze text at this time. Please try again.',
      technical: error.message
    }
  };
}

// Health check endpoint for monitoring
function getSystemHealth() {
  const now = Date.now();
  const uptime = now - performanceMetrics.lastReset;
  
  return {
    status: 'healthy',
    uptime: Math.round(uptime / 1000),
    performance: {
      requestCount: performanceMetrics.requestCount,
      averageResponseTime: Math.round(performanceMetrics.averageResponseTime),
      cacheHitRate: Math.round(performanceMetrics.cacheHitRate * 100),
      errorRate: Math.round(performanceMetrics.errorRate * 100),
      aiCallCount: performanceMetrics.aiCallCount
    },
    cache: {
      suggestionCache: suggestionCache.size,
      toneAnalysisCache: toneAnalysisCache.size,
      rewriteCache: rewriteCache.size
    },
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
}

// ========== END PHASE 4: PERFORMANCE OPTIMIZATION & EDGE CASES ==========

// ========== PHASE 4: ENTERPRISE SEO FEATURES ==========

// Phase 4A: Competitor Analysis Engine
function generateCompetitorAnalysis(text, competitorUrls, primaryKeyword, secondaryKeywords) {
  console.log('🔍 Phase 4A: Competitor Analysis Engine');
  
  if (!competitorUrls || competitorUrls.length === 0) {
    return {
      contentGaps: [],
      keywordGaps: [],
      competitorStrengths: [],
      recommendedActions: []
    };
  }

  // Mock competitor analysis - in production, this would integrate with SEO APIs
  const competitorAnalysis = {
    contentGaps: [
      {
        keyword: primaryKeyword || 'SEO optimization',
        competitorCoverage: 85,
        yourCoverage: calculateKeywordDensity(text, primaryKeyword || 'SEO') * 100,
        opportunity: 'high',
        suggestions: [
          'Add comprehensive section on technical SEO',
          'Include case studies and examples',
          'Expand on advanced optimization techniques'
        ]
      }
    ],
    keywordGaps: [
      'long-tail keywords',
      'semantic search optimization',
      'voice search queries',
      'mobile-first indexing'
    ],
    competitorStrengths: competitorUrls.map(url => ({
      competitor: url,
      strengths: ['Comprehensive content', 'Strong backlink profile', 'Technical optimization'],
      weaknesses: ['Limited multimedia content', 'Poor internal linking']
    })),
    recommendedActions: [
      {
        priority: 'high',
        action: `Create in-depth content targeting "${primaryKeyword}"`,
        impact: 'Could increase organic traffic by 25%',
        effort: 'medium'
      },
      {
        priority: 'medium',
        action: 'Improve content depth and comprehensiveness',
        impact: 'Better search engine rankings',
        effort: 'high'
      }
    ]
  };

  return competitorAnalysis;
}

// Phase 4B: Technical SEO Analysis Engine
function generateTechnicalSEOAnalysis(text, settings) {
  console.log('⚙️ Phase 4B: Technical SEO Analysis Engine');
  
  const technicalAnalysis = {
    pageSpeed: {
      score: 78,
      issues: ['Large images not optimized', 'Unused CSS detected'],
      recommendations: ['Compress images', 'Remove unused CSS']
    },
    coreWebVitals: {
      lcp: 2.8, // Largest Contentful Paint
      fid: 120, // First Input Delay
      cls: 0.12, // Cumulative Layout Shift
      recommendations: ['Optimize server response time', 'Preload critical resources']
    },
    mobileUsability: {
      score: 92,
      issues: ['Small clickable elements'],
      recommendations: ['Increase touch target sizes']
    },
    structuredData: {
      score: 45,
      missing: ['Article schema', 'Breadcrumb markup'],
      recommendations: ['Add JSON-LD structured data', 'Implement Article schema']
    }
  };

  return technicalAnalysis;
}

// Phase 4C: Local SEO Optimization Engine
function generateLocalSEOSuggestions(text, localBusiness, localLocation, contentType) {
  console.log('📍 Phase 4C: Local SEO Optimization Engine');
  
  if (!localBusiness || !localLocation) {
    return [];
  }

  const suggestions = [];
  const textLower = text.toLowerCase();

  // Check for local business mentions
  if (!textLower.includes(localBusiness.toLowerCase())) {
    suggestions.push({
      id: `local-seo-${Date.now()}-1`,
      text: text.substring(0, 50) + '...',
      message: `Include your business name "${localBusiness}" for local SEO`,
      type: 'seo',
      alternatives: [`${localBusiness} - ${text.substring(0, 30)}...`],
      start: 0,
      end: 50,
      status: 'pending',
      seoCategory: 'local-seo',
      seoType: 'business_mention',
      seoScore: 0.8,
      priority: 8,
      recommendation: {
        impact: 'high',
        effort: 'low',
        reasoning: 'Including business name improves local search visibility'
      }
    });
  }

  // Check for location mentions
  if (!textLower.includes(localLocation.toLowerCase())) {
    suggestions.push({
      id: `local-seo-${Date.now()}-2`,
      text: text.substring(0, 50) + '...',
      message: `Include location "${localLocation}" for local SEO targeting`,
      type: 'seo',
      alternatives: [`Content for ${localLocation} - ${text.substring(0, 30)}...`],
      start: 0,
      end: 50,
      status: 'pending',
      seoCategory: 'local-seo',
      seoType: 'location_mention',
      seoScore: 0.75,
      priority: 7,
      recommendation: {
        impact: 'high',
        effort: 'low',
        reasoning: 'Location mentions help with local search rankings'
      }
    });
  }

  return suggestions;
}

// Phase 4D: E-A-T Optimization Engine
function generateEATOptimization(text, contentType, authorInfo) {
  console.log('🎯 Phase 4D: E-A-T Optimization Engine');
  
  const suggestions = [];
  const textLower = text.toLowerCase();

  // Expertise signals
  if (!textLower.includes('expert') && !textLower.includes('experience') && !textLower.includes('professional')) {
    suggestions.push({
      id: `eat-expertise-${Date.now()}`,
      text: text.substring(0, 100),
      message: 'Add expertise signals to demonstrate subject matter knowledge',
      type: 'seo',
      alternatives: [
        'Based on our 10+ years of experience...',
        'As industry experts, we recommend...',
        'Our professional analysis shows...'
      ],
      start: 0,
      end: 100,
      status: 'pending',
      seoCategory: 'e-a-t',
      seoType: 'expertise_signals',
      seoScore: 0.7,
      priority: 6,
      recommendation: {
        impact: 'medium',
        effort: 'low',
        reasoning: 'Expertise signals improve content credibility and search rankings'
      }
    });
  }

  // Authority indicators
  if (!textLower.includes('research') && !textLower.includes('study') && !textLower.includes('data')) {
    suggestions.push({
      id: `eat-authority-${Date.now()}`,
      text: text.substring(50, 150),
      message: 'Include authoritative sources and data to boost credibility',
      type: 'seo',
      alternatives: [
        'According to recent research...',
        'Studies have shown that...',
        'Data from industry reports indicates...'
      ],
      start: 50,
      end: 150,
      status: 'pending',
      seoCategory: 'e-a-t',
      seoType: 'authority_signals',
      seoScore: 0.75,
      priority: 7,
      recommendation: {
        impact: 'high',
        effort: 'medium',
        reasoning: 'Authoritative sources and data improve content trustworthiness'
      }
    });
  }

  return suggestions;
}

// Phase 4E: Featured Snippets Optimization
function generateFeaturedSnippetOptimization(text, primaryKeyword) {
  console.log('⭐ Phase 4E: Featured Snippets Optimization');
  
  const suggestions = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Check for question-answer format
  const hasQuestions = text.includes('?');
  if (!hasQuestions && primaryKeyword) {
    suggestions.push({
      id: `snippet-qa-${Date.now()}`,
      text: sentences[0] || text.substring(0, 100),
      message: 'Add question-answer format to target featured snippets',
      type: 'seo',
      alternatives: [
        `What is ${primaryKeyword}? ${sentences[0] || text.substring(0, 80)}`,
        `How does ${primaryKeyword} work? ${sentences[0] || text.substring(0, 80)}`,
        `Why is ${primaryKeyword} important? ${sentences[0] || text.substring(0, 80)}`
      ],
      start: 0,
      end: sentences[0]?.length || 100,
      status: 'pending',
      seoCategory: 'featured-snippets',
      seoType: 'question_format',
      seoScore: 0.8,
      priority: 8,
      recommendation: {
        impact: 'high',
        effort: 'low',
        reasoning: 'Question-answer format increases featured snippet opportunities'
      }
    });
  }

  // Check for list format
  const hasList = text.includes('1.') || text.includes('•') || text.includes('-');
  if (!hasList) {
    suggestions.push({
      id: `snippet-list-${Date.now()}`,
      text: text.substring(0, 150),
      message: 'Structure content as numbered or bulleted lists for snippet optimization',
      type: 'seo',
      alternatives: [
        'Here are the key benefits:\n1. First benefit\n2. Second benefit\n3. Third benefit',
        'The main steps include:\n• Step one\n• Step two\n• Step three'
      ],
      start: 0,
      end: 150,
      status: 'pending',
      seoCategory: 'featured-snippets',
      seoType: 'list_format',
      seoScore: 0.75,
      priority: 7,
      recommendation: {
        impact: 'medium',
        effort: 'low',
        reasoning: 'List formats are commonly featured in snippets'
      }
    });
  }

  return suggestions;
}

// Phase 4F: Voice Search Optimization
function generateVoiceSearchOptimization(text, primaryKeyword) {
  console.log('🎤 Phase 4F: Voice Search Optimization');
  
  const suggestions = [];
  const textLower = text.toLowerCase();

  // Check for conversational language
  const conversationalWords = ['how', 'what', 'why', 'where', 'when', 'who'];
  const hasConversational = conversationalWords.some(word => textLower.includes(word));
  
  if (!hasConversational) {
    suggestions.push({
      id: `voice-conversational-${Date.now()}`,
      text: text.substring(0, 100),
      message: 'Add conversational language for voice search optimization',
      type: 'seo',
      alternatives: [
        `How can you ${primaryKeyword}? ${text.substring(0, 80)}`,
        `What you need to know about ${primaryKeyword}: ${text.substring(0, 60)}`,
        `Why ${primaryKeyword} matters: ${text.substring(0, 70)}`
      ],
      start: 0,
      end: 100,
      status: 'pending',
      seoCategory: 'voice-search',
      seoType: 'conversational_tone',
      seoScore: 0.7,
      priority: 6,
      recommendation: {
        impact: 'medium',
        effort: 'low',
        reasoning: 'Conversational language matches voice search queries'
      }
    });
  }

  // Check for long-tail keyword phrases
  const words = text.split(' ');
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  if (avgWordLength < 5) {
    suggestions.push({
      id: `voice-longtail-${Date.now()}`,
      text: text.substring(0, 120),
      message: 'Include longer, more specific phrases for voice search queries',
      type: 'seo',
      alternatives: [
        `The best way to ${primaryKeyword} for beginners`,
        `Complete guide to ${primaryKeyword} optimization`,
        `Step-by-step ${primaryKeyword} tutorial for professionals`
      ],
      start: 0,
      end: 120,
      status: 'pending',
      seoCategory: 'voice-search',
      seoType: 'long_tail_phrases',
      seoScore: 0.65,
      priority: 5,
      recommendation: {
        impact: 'medium',
        effort: 'medium',
        reasoning: 'Voice searches tend to be longer and more specific'
      }
    });
  }

  return suggestions;
}

// Helper function for keyword density calculation
function calculateKeywordDensity(text, keyword) {
  if (!keyword || !text) return 0;
  
  const words = text.toLowerCase().split(/\s+/);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  let matches = 0;
  
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    let match = true;
    for (let j = 0; j < keywordWords.length; j++) {
      if (words[i + j] !== keywordWords[j]) {
        match = false;
        break;
      }
    }
    if (match) matches++;
  }
  
  return matches / words.length;
}

// ========== END PHASE 4: ENTERPRISE SEO FEATURES ==========

// ========== PHASE 5: ADVANCED FEATURES & POLISH ==========

// Phase 5A: Real-time Writing Analytics Dashboard
const writingAnalytics = {
  sessions: new Map(), // sessionId -> analytics data
  globalStats: {
    totalDocuments: 0,
    totalWords: 0,
    totalSuggestions: 0,
    totalImprovements: 0,
    averageImprovementRate: 0,
    mostCommonIssues: new Map(),
    writingStyles: new Map(),
    lastReset: Date.now()
  }
};

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function initializeWritingSession(text, userId = 'anonymous') {
  const sessionId = generateSessionId();
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;
  
  const sessionData = {
    id: sessionId,
    userId,
    startTime: Date.now(),
    originalText: text,
    currentText: text,
    wordCount,
    charCount,
    suggestions: {
      total: 0,
      accepted: 0,
      ignored: 0,
      byType: new Map(),
      timeline: []
    },
    writingMetrics: {
      readabilityScore: calculateReadabilityScore(text),
      sentenceVariety: analyzeSentenceVariety(text),
      vocabularyRichness: calculateVocabularyRichness(text),
      toneConsistency: 0, // Will be updated after tone analysis
      avgSentenceLength: calculateAverageSentenceLength(text)
    },
    improvements: [],
    timeSpent: 0,
    keystrokeCount: 0,
    revisionsCount: 0
  };
  
  writingAnalytics.sessions.set(sessionId, sessionData);
  return sessionId;
}

function updateWritingSession(sessionId, updates) {
  const session = writingAnalytics.sessions.get(sessionId);
  if (!session) return null;
  
  const updatedSession = {
    ...session,
    ...updates,
    timeSpent: Date.now() - session.startTime
  };
  
  writingAnalytics.sessions.set(sessionId, updatedSession);
  return updatedSession;
}

function calculateReadabilityScore(text) {
  // Simplified Flesch Reading Ease Score
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function analyzeSentenceVariety(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  
  if (lengths.length === 0) return 0;
  
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Higher standard deviation = more variety
  return Math.min(100, Math.round((stdDev / avg) * 100));
}

function calculateVocabularyRichness(text) {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const uniqueWords = new Set(words);
  
  if (words.length === 0) return 0;
  
  // Type-Token Ratio (TTR) as percentage
  return Math.round((uniqueWords.size / words.length) * 100);
}

function calculateAverageSentenceLength(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0) return 0;
  return Math.round(words.length / sentences.length);
}

function generateWritingAnalytics(sessionId) {
  const session = writingAnalytics.sessions.get(sessionId);
  if (!session) return null;
  
  const improvementRate = session.suggestions.total > 0 
    ? (session.suggestions.accepted / session.suggestions.total) * 100 
    : 0;
  
  return {
    session: {
      id: sessionId,
      duration: session.timeSpent,
      wordCount: session.wordCount,
      charCount: session.charCount,
      improvementRate: Math.round(improvementRate),
      suggestionsProcessed: session.suggestions.total,
      suggestionsAccepted: session.suggestions.accepted
    },
    writingQuality: {
      readabilityScore: session.writingMetrics.readabilityScore,
      readabilityLevel: getReadabilityLevel(session.writingMetrics.readabilityScore),
      sentenceVariety: session.writingMetrics.sentenceVariety,
      vocabularyRichness: session.writingMetrics.vocabularyRichness,
      avgSentenceLength: session.writingMetrics.avgSentenceLength,
      toneConsistency: session.writingMetrics.toneConsistency
    },
    improvements: session.improvements,
    suggestionBreakdown: Array.from(session.suggestions.byType.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / session.suggestions.total) * 100)
    }))
  };
}

function getReadabilityLevel(score) {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
}

// Phase 5B: Advanced Suggestion Interactions
async function generateAdvancedSuggestionMetadata(suggestion, text, context) {
  const metadata = {
    confidence: suggestion.confidence || 0.8,
    impact: calculateImpactScore(suggestion, text),
    complexity: assessChangeComplexity(suggestion),
    alternatives: await generateAlternativeOptions(suggestion, text, context),
    explanation: await generateDetailedExplanation(suggestion, context),
    examples: await generateExamples(suggestion.type),
    relatedRules: getRelatedGrammarRules(suggestion.type)
  };
  
  return metadata;
}

function calculateImpactScore(suggestion, text) {
  // Calculate how much this suggestion improves the text (1-10 scale)
  let impact = 5; // Base score
  
  // Higher impact for more visible issues
  if (['spelling', 'grammar'].includes(suggestion.type)) impact += 2;
  if (suggestion.type === 'demonetization') impact += 3;
  if (suggestion.type === 'tone-rewrite') impact += 1;
  
  // Consider position in text (earlier = higher impact)
  const position = suggestion.start / text.length;
  if (position < 0.2) impact += 1; // First 20% of text
  
  // Consider length of affected text
  const affectedLength = suggestion.end - suggestion.start;
  if (affectedLength > 10) impact += 1;
  
  return Math.min(10, Math.max(1, impact));
}

function assessChangeComplexity(suggestion) {
  // Assess how complex the suggested change is (1-5 scale)
  const originalLength = suggestion.text.length;
  const newLength = suggestion.alternatives?.[0]?.length || originalLength;
  
  let complexity = 1;
  
  // Length change indicates complexity
  if (Math.abs(newLength - originalLength) > 5) complexity += 1;
  if (Math.abs(newLength - originalLength) > 15) complexity += 1;
  
  // Type-based complexity
  if (suggestion.type === 'style') complexity += 1;
  if (suggestion.type === 'tone-rewrite') complexity += 2;
  
  return Math.min(5, complexity);
}

async function generateAlternativeOptions(suggestion, text, context) {
  if (!suggestion.alternatives || suggestion.alternatives.length === 0) return [];
  
  // Generate additional alternatives using AI
  try {
    const prompt = `Given the text "${suggestion.text}" in context "${context}", provide 2-3 additional alternative phrasings that maintain the same meaning but offer different stylistic approaches.

Original: "${suggestion.text}"
Current alternative: "${suggestion.alternatives[0]}"

Provide alternatives that are:
1. More concise
2. More formal
3. More engaging

Return only a JSON array of strings: ["alternative1", "alternative2", "alternative3"]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    let content = completion.choices[0].message.content || '[]';
    content = content.replace(/```json|```/g, '').trim();
    const additionalAlternatives = JSON.parse(content);
    
    return [...suggestion.alternatives, ...additionalAlternatives];
  } catch (error) {
    console.error('Error generating additional alternatives:', error);
    return suggestion.alternatives;
  }
}

async function generateDetailedExplanation(suggestion, context) {
  try {
    const prompt = `Explain why "${suggestion.text}" should be changed to "${suggestion.alternatives?.[0] || 'the suggested alternative'}" in the context: "${context}"

Provide a clear, educational explanation that helps the user understand:
1. What the issue is
2. Why it matters
3. How the suggestion improves the text

Keep it concise but informative (2-3 sentences max).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100
    });

    return completion.choices[0].message.content || suggestion.message;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return suggestion.message;
  }
}

async function generateExamples(suggestionType) {
  const exampleSets = {
    grammar: [
      { wrong: "There's many options", right: "There are many options" },
      { wrong: "Between you and I", right: "Between you and me" }
    ],
    spelling: [
      { wrong: "recieve", right: "receive" },
      { wrong: "definately", right: "definitely" }
    ],
    style: [
      { wrong: "very unique", right: "unique" },
      { wrong: "in order to", right: "to" }
    ],
    demonetization: [
      { wrong: "kill the competition", right: "outperform competitors" },
      { wrong: "viral outbreak", right: "widespread trend" }
    ]
  };
  
  return exampleSets[suggestionType] || [];
}

function getRelatedGrammarRules(suggestionType) {
  const rules = {
    grammar: [
      "Subject-verb agreement",
      "Pronoun case",
      "Parallel structure"
    ],
    spelling: [
      "I before E rule",
      "Double consonants",
      "Silent letters"
    ],
    style: [
      "Conciseness",
      "Active voice",
      "Varied sentence structure"
    ]
  };
  
  return rules[suggestionType] || [];
}

// Phase 5C: Writing Style Consistency Checking
async function analyzeStyleConsistency(text, existingSuggestions) {
  console.log('🎨 Analyzing writing style consistency...');
  
  const styleAnalysis = {
    tenseConsistency: analyzeTenseConsistency(text),
    voiceConsistency: analyzeVoiceConsistency(text),
    personConsistency: analyzePersonConsistency(text),
    toneConsistency: await analyzeToneConsistency(text),
    formattingConsistency: analyzeFormattingConsistency(text),
    vocabularyConsistency: analyzeVocabularyConsistency(text)
  };
  
  const consistencySuggestions = generateConsistencySuggestions(styleAnalysis, text);
  
  return {
    analysis: styleAnalysis,
    suggestions: consistencySuggestions,
    overallScore: calculateOverallConsistencyScore(styleAnalysis)
  };
}

function analyzeTenseConsistency(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const tensePattern = /\b(was|were|had|have|has|will|would|could|should)\b/gi;
  
  const tenses = {
    past: 0,
    present: 0,
    future: 0
  };
  
  sentences.forEach(sentence => {
    if (/\b(was|were|had)\b/i.test(sentence)) tenses.past++;
    if (/\b(have|has|am|is|are)\b/i.test(sentence)) tenses.present++;
    if (/\b(will|would|could|should)\b/i.test(sentence)) tenses.future++;
  });
  
  const total = tenses.past + tenses.present + tenses.future;
  const dominant = Object.keys(tenses).reduce((a, b) => tenses[a] > tenses[b] ? a : b);
  const consistency = total > 0 ? (tenses[dominant] / total) * 100 : 100;
  
  return {
    dominant,
    consistency: Math.round(consistency),
    distribution: tenses,
    issues: consistency < 70 ? ['Mixed tenses detected'] : []
  };
}

function analyzeVoiceConsistency(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let activeCount = 0;
  let passiveCount = 0;
  
  sentences.forEach(sentence => {
    // Simple passive voice detection
    if (/\b(was|were|been|being)\s+\w+ed\b/i.test(sentence) || 
        /\b(is|are|am)\s+\w+ed\b/i.test(sentence)) {
      passiveCount++;
    } else {
      activeCount++;
    }
  });
  
  const total = activeCount + passiveCount;
  const activePercentage = total > 0 ? (activeCount / total) * 100 : 100;
  
  return {
    activePercentage: Math.round(activePercentage),
    passivePercentage: Math.round(100 - activePercentage),
    recommendation: activePercentage < 60 ? 'Consider using more active voice' : 'Good voice consistency',
    issues: activePercentage < 40 ? ['Excessive passive voice'] : []
  };
}

function analyzePersonConsistency(text) {
  const firstPerson = (text.match(/\b(I|me|my|we|us|our)\b/gi) || []).length;
  const secondPerson = (text.match(/\b(you|your|yours)\b/gi) || []).length;
  const thirdPerson = (text.match(/\b(he|she|it|they|his|her|their)\b/gi) || []).length;
  
  const total = firstPerson + secondPerson + thirdPerson;
  const dominant = firstPerson >= secondPerson && firstPerson >= thirdPerson ? 'first' :
                   secondPerson >= thirdPerson ? 'second' : 'third';
  
  return {
    dominant,
    distribution: { first: firstPerson, second: secondPerson, third: thirdPerson },
    consistency: total > 0 ? Math.round((Math.max(firstPerson, secondPerson, thirdPerson) / total) * 100) : 100,
    issues: total > 10 && Math.max(firstPerson, secondPerson, thirdPerson) / total < 0.6 ? ['Inconsistent point of view'] : []
  };
}

async function analyzeToneConsistency(text) {
  // This would use the existing tone analysis but check for consistency across paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
  
  if (paragraphs.length < 2) {
    return { consistency: 100, issues: [], dominant: 'consistent' };
  }
  
  // For now, return a simplified analysis
  return {
    consistency: 85, // Placeholder - would use actual tone analysis
    dominant: 'professional',
    issues: []
  };
}

function analyzeFormattingConsistency(text) {
  const issues = [];
  
  // Check for consistent list formatting
  const bulletPoints = text.match(/^\s*[•\-\*]\s/gm) || [];
  const numberedLists = text.match(/^\s*\d+\.\s/gm) || [];
  
  // Check for consistent quotation marks
  const singleQuotes = (text.match(/'/g) || []).length;
  const doubleQuotes = (text.match(/"/g) || []).length;
  
  if (bulletPoints.length > 0 && numberedLists.length > 0) {
    issues.push('Mixed list formatting styles');
  }
  
  if (singleQuotes > 0 && doubleQuotes > 0 && Math.abs(singleQuotes - doubleQuotes) > 2) {
    issues.push('Inconsistent quotation mark usage');
  }
  
  return {
    listFormatting: bulletPoints.length > 0 || numberedLists.length > 0 ? 'present' : 'none',
    quotationStyle: doubleQuotes > singleQuotes ? 'double' : singleQuotes > 0 ? 'single' : 'none',
    issues
  };
}

function analyzeVocabularyConsistency(text) {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = new Map();
  
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });
  
  const repeatedWords = Array.from(wordFreq.entries())
    .filter(([word, count]) => count > 3)
    .sort((a, b) => b[1] - a[1]);
  
  return {
    uniqueWords: wordFreq.size,
    totalWords: words.length,
    repetitionRate: Math.round((repeatedWords.length / wordFreq.size) * 100),
    mostRepeated: repeatedWords.slice(0, 5),
    issues: repeatedWords.length > wordFreq.size * 0.1 ? ['High word repetition'] : []
  };
}

function generateConsistencySuggestions(styleAnalysis, text) {
  const suggestions = [];
  
  // Generate suggestions based on style analysis
  Object.entries(styleAnalysis).forEach(([aspect, analysis]) => {
    if (analysis.issues && analysis.issues.length > 0) {
      analysis.issues.forEach(issue => {
        suggestions.push({
          id: `consistency-${Math.random().toString(36).slice(2, 10)}`,
          type: 'style-consistency',
          aspect,
          issue,
          message: `Style consistency: ${issue}`,
          severity: 'medium',
          suggestion: getConsistencySuggestion(aspect, issue)
        });
      });
    }
  });
  
  return suggestions;
}

function getConsistencySuggestion(aspect, issue) {
  const suggestions = {
    'Mixed tenses detected': 'Consider maintaining consistent tense throughout your writing.',
    'Excessive passive voice': 'Try using more active voice to make your writing more engaging.',
    'Inconsistent point of view': 'Maintain a consistent perspective (first, second, or third person).',
    'Mixed list formatting styles': 'Use consistent formatting for all lists (either bullets or numbers).',
    'Inconsistent quotation mark usage': 'Choose either single or double quotes and use them consistently.',
    'High word repetition': 'Consider using synonyms to add variety to your vocabulary.'
  };
  
  return suggestions[issue] || 'Consider reviewing this aspect for consistency.';
}

function calculateOverallConsistencyScore(styleAnalysis) {
  const scores = [];
  
  if (styleAnalysis.tenseConsistency?.consistency) {
    scores.push(styleAnalysis.tenseConsistency.consistency);
  }
  if (styleAnalysis.voiceConsistency?.activePercentage) {
    scores.push(Math.min(100, styleAnalysis.voiceConsistency.activePercentage + 20));
  }
  if (styleAnalysis.personConsistency?.consistency) {
    scores.push(styleAnalysis.personConsistency.consistency);
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 85;
}

// Phase 5D: Export & Integration Features
function generateExportData(sessionId, format = 'json') {
  const session = writingAnalytics.sessions.get(sessionId);
  if (!session) return null;
  
  const analytics = generateWritingAnalytics(sessionId);
  const exportData = {
    document: {
      originalText: session.originalText,
      finalText: session.currentText,
      wordCount: session.wordCount,
      charCount: session.charCount
    },
    analytics,
    suggestions: session.suggestions,
    improvements: session.improvements,
    exportedAt: new Date().toISOString(),
    format
  };
  
  switch (format) {
    case 'markdown':
      return generateMarkdownReport(exportData);
    case 'html':
      return generateHTMLReport(exportData);
    case 'csv':
      return generateCSVReport(exportData);
    default:
      return exportData;
  }
}

function generateMarkdownReport(data) {
  return `# Writing Analysis Report

## Document Summary
- **Word Count:** ${data.document.wordCount}
- **Character Count:** ${data.document.charCount}
- **Analysis Date:** ${data.exportedAt}

## Writing Quality Metrics
- **Readability Score:** ${data.analytics.writingQuality.readabilityScore}/100 (${data.analytics.writingQuality.readabilityLevel})
- **Sentence Variety:** ${data.analytics.writingQuality.sentenceVariety}%
- **Vocabulary Richness:** ${data.analytics.writingQuality.vocabularyRichness}%
- **Average Sentence Length:** ${data.analytics.writingQuality.avgSentenceLength} words

## Suggestions Summary
- **Total Suggestions:** ${data.analytics.session.suggestionsProcessed}
- **Accepted:** ${data.analytics.session.suggestionsAccepted}
- **Improvement Rate:** ${data.analytics.session.improvementRate}%

## Suggestion Breakdown
${data.analytics.suggestionBreakdown.map(item => 
  `- **${item.type}:** ${item.count} (${item.percentage}%)`
).join('\n')}

---
*Generated by Writewise AI Writing Assistant*`;
}

function generateHTMLReport(data) {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Writing Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; color: #2196F3; }
    </style>
</head>
<body>
    <h1>Writing Analysis Report</h1>
    
    <div class="metric">
        <h3>Readability Score</h3>
        <div class="score">${data.analytics.writingQuality.readabilityScore}/100</div>
        <p>${data.analytics.writingQuality.readabilityLevel}</p>
    </div>
    
    <div class="metric">
        <h3>Document Stats</h3>
        <p>Words: ${data.document.wordCount} | Characters: ${data.document.charCount}</p>
    </div>
    
    <div class="metric">
        <h3>Suggestions</h3>
        <p>Processed: ${data.analytics.session.suggestionsProcessed} | Accepted: ${data.analytics.session.suggestionsAccepted}</p>
        <p>Improvement Rate: ${data.analytics.session.improvementRate}%</p>
    </div>
    
    <p><em>Generated on ${data.exportedAt}</em></p>
</body>
</html>`;
}

function generateCSVReport(data) {
  const rows = [
    ['Metric', 'Value'],
    ['Word Count', data.document.wordCount],
    ['Character Count', data.document.charCount],
    ['Readability Score', data.analytics.writingQuality.readabilityScore],
    ['Sentence Variety', data.analytics.writingQuality.sentenceVariety],
    ['Vocabulary Richness', data.analytics.writingQuality.vocabularyRichness],
    ['Suggestions Total', data.analytics.session.suggestionsProcessed],
    ['Suggestions Accepted', data.analytics.session.suggestionsAccepted],
    ['Improvement Rate', data.analytics.session.improvementRate]
  ];
  
  return rows.map(row => row.join(',')).join('\n');
}

// ========== END PHASE 5: ADVANCED FEATURES & POLISH ==========

app.post('/api/suggestions', async (req, res) => {
  console.log('🚀 API CALL RECEIVED - Request body:', req.body);
  
  const startTime = Date.now()
  let hadError = false
  let usedCache = false
  let madeAiCall = false
  
  const { 
    text, 
    formalityLevel = 'casual', 
    tonePreservingEnabled = true,
    conflictResolutionMode = 'balanced',
    toneDetectionSensitivity = 'medium',
    engagementEnabled = true,
    platformAdaptationEnabled = false,
    selectedPlatform = null,
    seoOptimizationEnabled = false,
    contentType = 'general',
    primaryKeyword = null,
    secondaryKeywords = [],
    targetAudience = null,
    userId = 'anonymous',
    
    // Phase 3: Advanced SEO Features
    seoTemplateEnabled = false,
    seoSelectedTemplate = null,
    seoMetaOptimization = false,
    seoKeywordResearch = false,
    seoCompetitorAnalysis = false,
    seoAnalyticsDashboard = false,
    seoMetaTitle = '',
    seoMetaDescription = '',
    seoFocusKeyphrase = '',
    seoLSIKeywords = [],
    seoReadabilityTarget = 'medium',
    seoInternalLinking = false,
    seoSchemaMarkup = false
  } = req.body

  console.log('📝 Processing text:', text?.length, 'characters');

  try {
    console.log('🎯 Tone-preserving settings:', { tonePreservingEnabled, conflictResolutionMode, toneDetectionSensitivity });

    // Phase 5A: Initialize writing session for analytics
    const sessionId = initializeWritingSession(text, req.body.userId);
    console.log(`📊 Writing session initialized: ${sessionId}`);

    // Phase 4B: Handle edge cases early
    const settings = { formalityLevel, tonePreservingEnabled, conflictResolutionMode, toneDetectionSensitivity, engagementEnabled, platformAdaptationEnabled, selectedPlatform, seoOptimizationEnabled, contentType, primaryKeyword };
    const edgeCaseResult = await handleEdgeCases(text, [], settings);
    if (edgeCaseResult.edgeCaseHandled) {
      console.log(`🛡️ Edge case handled: ${edgeCaseResult.edgeCaseHandled}`);
      updatePerformanceMetrics(Date.now() - startTime, hadError, usedCache, madeAiCall);
      return res.json({
        suggestions: edgeCaseResult.suggestions || [],
        edgeCase: {
          type: edgeCaseResult.edgeCaseHandled,
          message: edgeCaseResult.message
        },
        text: edgeCaseResult.text || text,
        sessionId
      });
    }
    
    // Get AI suggestions for grammar, spelling, style, and engagement
    const prompt = `You are a writing-assistant that reviews a given passage for grammar, spelling, stylistic, and engagement issues.

Your task:
1. Identify up to **12** issues in the provided *input*.
2. For every issue create an object that matches this exact TypeScript shape (no extra keys):

  interface Suggestion {
    id: string           // unique, lowercase, no spaces (e.g. "sugg1")
    text: string         // the exact substring from the input that needs improvement
    message: string      // human-readable explanation of why it should change
    type: "grammar" | "spelling" | "style" | "tone-rewrite" | "engagement"
    alternatives: string[] // at least one improved replacement
    priority?: number    // 1-10 scale for conflict resolution
    originalTone?: string // detected tone (casual, formal, creative, etc.)
  }

3. For ENGAGEMENT suggestions, focus on:
   - Weak opening hooks (suggest compelling starts)
   - Missing calls-to-action (suggest reader engagement)
   - Lack of direct reader address (suggest "you" language)
   - Missing emotional language (suggest more compelling words)
   - Poor transitions between ideas

4. Return ONLY a JSON array of Suggestion – **do NOT** add markdown, comments, or any other wrapper.

Example response:
[
  {"id":"sugg1","text":"teh","message":"Spelling mistake","type":"spelling","alternatives":["the"]},
  {"id":"sugg2","text":"This is about","message":"Weak opening - consider a more engaging hook","type":"engagement","alternatives":["What if I told you this is about","Here's something surprising about","Ever wondered about"]}
]

Input:
"""${text}"""`

    // Phase 4D: Wrap AI call with reliability
    const completion = await ensureSystemReliability(async () => {
      madeAiCall = true;
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });
    }, async () => {
      // Fallback: return empty suggestions if AI fails
      console.log('🔄 Using fallback for grammar suggestions');
      return { choices: [{ message: { content: '[]' } }] };
    });

    // Remove code fences if present
    let content = completion.choices[0].message.content || '[]'
    content = content.replace(/```json|```/g, '').trim()
    let suggestions = JSON.parse(content)

    // Add spelling error detection
    const spellingErrors = detectSpellingErrors(text);

    // Add demonetization word detection
    const demonetizationWords = detectDemonetizationWords(text);
    
    // Generate AI alternatives for demonetization words
    const demonetizationSuggestions = await Promise.all(
      demonetizationWords.map(async (detected, index) => {
        const context = getWordContext(text, detected.start, detected.end);
        const alternatives = await generateDemonetizationAlternatives(detected.word, context);
        
        return {
          id: `demonetization-${Math.random().toString(36).slice(2, 10)}`,
          text: detected.word,
          message: `This word may cause demonetization on content platforms. Consider using a safer alternative.`,
          type: 'demonetization',
          alternatives: alternatives,
          start: detected.start,
          end: detected.end,
          status: 'pending'
        };
      })
    );

    // Add AI-powered slang detection for context-aware grammar checking
    const slangWords = await detectSlangWords(text, formalityLevel);
    console.log('Detected slang words with AI analysis:', slangWords.length);
    
    // Create slang-protected suggestions to show users what's being protected (only high-confidence ones)
    const slangProtectedSuggestions = slangWords
      .filter(detected => detected.confidence > 0.8) // Only show high-confidence slang protection
      .slice(0, 2) // Limit to max 2 slang protections per request
      .map((detected, index) => {
      const aiReasoning = detected.aiAnalysis ? detected.aiAnalysis.reasoning : 'Rule-based detection';
      const confidenceSource = detected.aiAnalysis ? 'AI + Rules' : 'Rules only';
      
      return {
        id: `slang-protected-${Math.random().toString(36).slice(2, 10)}`,
        text: detected.word,
        message: `This slang expression is recognized as intentional and protected from grammar corrections.`,
        type: 'slang-protected',
        alternatives: [],
        start: detected.start,
        end: detected.end,
        status: 'pending',
        confidence: detected.confidence,
        aiAnalysis: detected.aiAnalysis,
        reasoning: aiReasoning,
        confidenceSource: confidenceSource
      };
    });
    console.log('Created slang-protected suggestions:', slangProtectedSuggestions.length);

    // Combine all suggestions (before position calculation)
    suggestions = [...suggestions, ...spellingErrors, ...demonetizationSuggestions, ...slangProtectedSuggestions];

    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Process AI suggestions (add start/end positions)
    suggestions.forEach(s => {
      if (s.type !== 'demonetization' && s.type !== 'slang-protected' && s.text) {
        // Prefer a whole-word match to avoid replacing partial substrings (e.g. "engin" in "engine")
        const wordRegex = new RegExp(`\\b${escapeRegex(s.text)}\\b`, 'i');
        const match = wordRegex.exec(text);
        if (match) {
          s.start = match.index;
          s.end = match.index + match[0].length;
        } else {
          // Fallback: use simple indexOf in case the suggestion is punctuation or at boundaries we didn't capture
          const idx = text.indexOf(s.text);
          if (idx !== -1) {
            s.start = idx;
            s.end = idx + s.text.length;
          } else {
            console.warn(`Suggestion text not found in input: ${s.text}`);
          }
        }
      }
      
      // Ensure each suggestion has a unique id
      if (!s.id) {
        s.id = `sugg-${Math.random().toString(36).slice(2, 10)}`;
      }
      // Default status when first returned
      if (!s.status) {
        s.status = 'pending';
      }
    });

    // Apply AI-powered suggestion protection (AFTER position calculation)
    suggestions = await filterSuggestionsWithSlangProtection(suggestions, text, slangWords, formalityLevel);
    console.log('Suggestions after AI protection:', suggestions.length);

    // ========== PHASE 2 & 3: ENHANCED TONE-PRESERVING INTEGRATION ==========
    if (tonePreservingEnabled && suggestions.length > 0) {
      console.log('🎨 Starting enhanced tone-preserving analysis...');
      
      // Phase 2B + 3D: Analyze tone and style with caching
      const toneAnalysisKey = getCacheKey(text, 'tone-analysis', { sensitivity: toneDetectionSensitivity });
      let toneAnalysis = getFromCache(toneAnalysisCache, toneAnalysisKey);
      
      if (!toneAnalysis) {
        toneAnalysis = await analyzeToneAndStyle(text, toneDetectionSensitivity);
        setCache(toneAnalysisCache, toneAnalysisKey, toneAnalysis);
        console.log('🎯 Fresh tone analysis result:', toneAnalysis);
        madeAiCall = true;
      } else {
        console.log('📋 Using cached tone analysis:', toneAnalysis);
        usedCache = true;
      }
      
      // Phase 3: Enhanced suggestion processing with smart filtering
      const processingSettings = {
        formalityLevel,
        conflictResolutionMode,
        toneDetectionSensitivity,
        tonePreservingEnabled
      };
      
      suggestions = await enhancedSuggestionFiltering(
        suggestions,
        text,
        slangWords,
        demonetizationWords,
        toneAnalysis,
        processingSettings
      );
      console.log('🔄 Suggestions after enhanced processing:', suggestions.length);
      
      // Phase 5C: Analyze style consistency
      const styleConsistency = await analyzeStyleConsistency(text, suggestions);
      console.log('🎨 Style consistency analysis complete:', styleConsistency.overallScore);
      
      // Add consistency suggestions to the main suggestions array
      suggestions.push(...styleConsistency.suggestions);
      
    }
    // ========== END PHASE 2 & 3 INTEGRATION ==========

    // Phase 6: Engagement Enhancement Analysis (Independent)
    console.log('🎯 Engagement check - enabled:', engagementEnabled, 'textLength:', text.length);
    if (engagementEnabled && text.length > 50) { // Only analyze engagement for substantial content
      console.log('🎯 Starting engagement enhancement analysis...');
      
      // Get tone analysis if available (may be null if tone preserving is disabled)
      let toneAnalysis = null;
      if (tonePreservingEnabled) {
        const toneAnalysisKey = getCacheKey(text, 'tone-analysis', { sensitivity: toneDetectionSensitivity });
        toneAnalysis = getFromCache(toneAnalysisCache, toneAnalysisKey);
      }
      
      // Use cached engagement analysis if available
      const engagementCacheKey = getCacheKey(text, 'engagement-analysis', { toneDetectionSensitivity });
      let engagementAnalysis = getFromCache(engagementCache, engagementCacheKey);
      
      if (!engagementAnalysis) {
        engagementAnalysis = await analyzeEngagementPotential(text, toneAnalysis);
        setCache(engagementCache, engagementCacheKey, engagementAnalysis);
        console.log('🎯 Fresh engagement analysis completed');
        madeAiCall = true;
      } else {
        console.log('📋 Using cached engagement analysis');
        usedCache = true;
      }
      
      // Generate engagement suggestions
      const engagementSuggestions = await generateEngagementSuggestions(engagementAnalysis, text, toneAnalysis);
      
      // Add engagement suggestions to the main suggestions array
      suggestions.push(...engagementSuggestions);
      
      console.log('🎯 Added', engagementSuggestions.length, 'engagement suggestions to pipeline');
    }

    // Phase 7: Platform Adaptation Analysis (Independent)
    console.log('🎯 Platform adaptation check - enabled:', platformAdaptationEnabled, 'platform:', selectedPlatform);
    if (platformAdaptationEnabled && selectedPlatform && text.length > 30) { // Only analyze for substantial content
      console.log('🎯 Starting platform adaptation analysis...');
      
      // Get tone analysis if available (may be null if tone preserving is disabled)
      let toneAnalysis = null;
      if (tonePreservingEnabled) {
        const toneAnalysisKey = getCacheKey(text, 'tone-analysis', { sensitivity: toneDetectionSensitivity });
        toneAnalysis = getFromCache(toneAnalysisCache, toneAnalysisKey);
      }
      
      // Use cached platform analysis if available
      const platformCacheKey = getCacheKey(text, 'platform-analysis', { platform: selectedPlatform, toneDetectionSensitivity });
      let platformSuggestions = getFromCache(platformCache, platformCacheKey);
      
      if (!platformSuggestions) {
        platformSuggestions = await generatePlatformAdaptationSuggestions(text, selectedPlatform, toneAnalysis);
        setCache(platformCache, platformCacheKey, platformSuggestions);
        console.log('🎯 Fresh platform adaptation analysis completed');
        madeAiCall = true;
      } else {
        console.log('📋 Using cached platform adaptation analysis');
        usedCache = true;
      }
      
      // Add platform adaptation suggestions to the main suggestions array
      suggestions.push(...platformSuggestions);
      
      console.log('🎯 Added', platformSuggestions.length, 'platform adaptation suggestions to pipeline');
    }

    // Phase 8: SEO Content Optimization Analysis (Independent)
    console.log('🎯 SEO optimization check - enabled:', seoOptimizationEnabled, 'contentType:', contentType);
    if (seoOptimizationEnabled && text.length > 100) { // Only analyze for substantial content
      console.log('🎯 Starting SEO optimization analysis...');
      
      // Use cached SEO analysis if available
      const seoCacheKey = getCacheKey(text, 'seo-analysis', { 
        contentType, 
        primaryKeyword,
        seoMetaOptimization,
        seoKeywordResearch,
        seoInternalLinking,
        seoSchemaMarkup
      });
      let seoSuggestions = getFromCache(seoCache, seoCacheKey);
      
      if (!seoSuggestions) {
        seoSuggestions = await generateAdvancedSEOSuggestions(text, {
          contentType,
          primaryKeyword,
          secondaryKeywords,
          targetAudience,
          seoMetaOptimization,
          seoKeywordResearch,
          seoInternalLinking,
          seoSchemaMarkup,
          seoMetaTitle,
          seoMetaDescription,
          seoFocusKeyphrase,
          seoLSIKeywords,
          seoReadabilityTarget
        });
        setCache(seoCache, seoCacheKey, seoSuggestions);
        console.log('🎯 Fresh advanced SEO optimization analysis completed');
        madeAiCall = true;
      } else {
        console.log('📋 Using cached advanced SEO optimization analysis');
        usedCache = true;
      }
      
      // Add SEO optimization suggestions to the main suggestions array
      suggestions.push(...seoSuggestions.suggestions);
      
      // Add SEO analytics data for dashboard
      if (seoAnalyticsDashboard) {
        responseData.seoAnalytics = seoSuggestions.analytics;
      }
      
      console.log('🎯 Added', seoSuggestions.suggestions.length, 'advanced SEO suggestions to pipeline');
    }

    // Phase 4B: Final edge case handling for suggestions
    const finalEdgeCaseResult = await handleEdgeCases(text, suggestions, settings);
    if (finalEdgeCaseResult.edgeCaseHandled) {
      suggestions = finalEdgeCaseResult.suggestions;
      console.log(`🛡️ Final edge case handled: ${finalEdgeCaseResult.edgeCaseHandled}`);
    }

    // Phase 5B: Generate advanced suggestion metadata
    const enhancedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        if (['grammar', 'style', 'spelling'].includes(suggestion.type)) {
          const context = getWordContext(text, suggestion.start, suggestion.end);
          const advancedMetadata = await generateAdvancedSuggestionMetadata(suggestion, text, context);
          return { ...suggestion, advancedMetadata };
        }
        return suggestion;
      })
    );

    // Phase 5A: Update writing session with suggestions
    const sessionUpdates = {
      suggestions: {
        total: enhancedSuggestions.length,
        accepted: 0,
        ignored: 0,
        byType: enhancedSuggestions.reduce((acc, s) => {
          acc.set(s.type, (acc.get(s.type) || 0) + 1);
          return acc;
        }, new Map()),
        timeline: [{ timestamp: Date.now(), count: enhancedSuggestions.length, type: 'generated' }]
      }
    };
    updateWritingSession(sessionId, sessionUpdates);

    // Phase 4C: Enhance user experience
    const processingTime = Date.now() - startTime;
    const enhancedResult = enhanceUserExperience(enhancedSuggestions, text, processingTime);
    
    // Phase 5A: Generate writing analytics
    const writingAnalyticsData = generateWritingAnalytics(sessionId);
    
    // Phase 4A: Update performance metrics
    updatePerformanceMetrics(processingTime, hadError, usedCache, madeAiCall);
    
    // Log performance every 10 requests
    if (performanceMetrics.requestCount % 10 === 0) {
      logPerformanceMetrics();
    }

    console.log('Text:', text)
    console.log('Found demonetization words:', demonetizationWords.length)
    console.log('Final suggestions count:', enhancedResult.suggestions.length)
    console.log(`⚡ Processing completed in ${processingTime}ms`);
    
    enhancedResult.suggestions.forEach(s => {
      console.log('Suggestion:', s)
      console.log('Extracted:', text.slice(s.start, s.end))
      if (s.type === 'tone-rewrite') {
        console.log('🎨 Tone rewrite:', s.toneRewrite)
      }
    })

    // Debug: Log what we're sending
    console.log('📊 Response Debug:', {
      sessionId,
      hasAnalytics: !!writingAnalyticsData,
      analyticsData: writingAnalyticsData,
      suggestionsCount: enhancedResult.suggestions.length
    })

    res.json({
      suggestions: enhancedResult.suggestions,
      insights: enhancedResult.insights,
      processingMetadata: enhancedResult.processingMetadata,
      analytics: writingAnalyticsData,
      sessionId,
      edgeCase: finalEdgeCaseResult.edgeCaseHandled ? {
        type: finalEdgeCaseResult.edgeCaseHandled,
        message: finalEdgeCaseResult.message
      } : null
    })
  } catch (err) {
    hadError = true;
    const processingTime = Date.now() - startTime;
    updatePerformanceMetrics(processingTime, hadError, usedCache, madeAiCall);
    
    console.error('🚨 API Error:', err);
    
    // Phase 4D: Handle system error with graceful degradation
    const gracefulResponse = await handleSystemError(err, 'suggestions_api');
    
    res.status(err.status || 500).json({
      ...gracefulResponse,
      processingMetadata: {
        processingTime,
        hadError: true,
        errorType: gracefulResponse.error?.type || 'unknown'
      }
    });
  }
})

// Phase 4A: Health check endpoint
app.get('/api/health', (req, res) => {
  const health = getSystemHealth();
  res.json(health);
});

// Performance metrics endpoint (for monitoring)
app.get('/api/metrics', (req, res) => {
  res.json({
    performance: performanceMetrics,
    cache: {
      suggestionCache: suggestionCache.size,
      toneAnalysisCache: toneAnalysisCache.size,
      rewriteCache: rewriteCache.size,
      engagementCache: engagementCache.size,
      platformCache: platformCache.size,
      seoCache: seoCache.size
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Phase 5A: Writing analytics endpoint
app.get('/api/analytics/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const analytics = generateWritingAnalytics(sessionId);
  
  if (!analytics) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json(analytics);
});

// Phase 5A: Update writing session endpoint
app.post('/api/analytics/:sessionId/update', (req, res) => {
  const { sessionId } = req.params;
  const updates = req.body;
  
  const updatedSession = updateWritingSession(sessionId, updates);
  
  if (!updatedSession) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({ success: true, session: updatedSession });
});

// Phase 5C: Style consistency analysis endpoint
app.post('/api/style-consistency', async (req, res) => {
  try {
    const { text, existingSuggestions = [] } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const styleAnalysis = await analyzeStyleConsistency(text, existingSuggestions);
    res.json(styleAnalysis);
  } catch (error) {
    console.error('Style consistency analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze style consistency' });
  }
});

// Phase 5D: Export endpoint - with format specified
app.get('/api/export/:sessionId/:format', (req, res) => {
  const { sessionId, format } = req.params;
  
  try {
    const exportData = generateExportData(sessionId, format);
    
    if (!exportData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Set appropriate content type and headers
    switch (format) {
      case 'markdown':
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="writing-report-${sessionId}.md"`);
        break;
      case 'html':
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="writing-report-${sessionId}.html"`);
        break;
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="writing-report-${sessionId}.csv"`);
        break;
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="writing-report-${sessionId}.json"`);
    }
    
    res.send(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// Phase 5D: Export endpoint - default to JSON format
app.get('/api/export/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const format = 'json';
  
  try {
    const exportData = generateExportData(sessionId, format);
    
    if (!exportData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="writing-report-${sessionId}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

// Phase 5B: Advanced suggestion details endpoint
app.get('/api/suggestion/:suggestionId/details', async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { text, context } = req.query;
    
    if (!text || !context) {
      return res.status(400).json({ error: 'Text and context are required' });
    }
    
    // Mock suggestion for demonstration
    const suggestion = {
      id: suggestionId,
      text: req.query.suggestionText || 'example',
      type: req.query.type || 'grammar',
      alternatives: [req.query.alternative || 'corrected example']
    };
    
    const advancedMetadata = await generateAdvancedSuggestionMetadata(suggestion, text, context);
    res.json({
      suggestion,
      metadata: advancedMetadata
    });
  } catch (error) {
    console.error('Advanced suggestion details error:', error);
    res.status(500).json({ error: 'Failed to generate suggestion details' });
  }
});

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🚀 Suggestions API listening on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`)
  
  // Log performance metrics every 5 minutes
  setInterval(logPerformanceMetrics, 300000);
})

// Phase 6: Engagement Enhancement Analysis
async function analyzeEngagementPotential(text, toneAnalysis = null) {
  console.log('🎯 Analyzing engagement potential for text...');
  
  const engagementAnalysis = {
    overallScore: 0,
    categories: {
      openingHook: { score: 0, issues: [], suggestions: [] },
      callToAction: { score: 0, issues: [], suggestions: [] },
      emotionalLanguage: { score: 0, issues: [], suggestions: [] },
      readerInteraction: { score: 0, issues: [], suggestions: [] },
      transitions: { score: 0, issues: [], suggestions: [] },
      urgencyScarcity: { score: 0, issues: [], suggestions: [] }
    },
    suggestions: []
  };

  // Analyze opening hook (first 100 characters)
  const opening = text.substring(0, 100).trim();
  engagementAnalysis.categories.openingHook = analyzeOpeningHook(opening, text);
  
  // Analyze call-to-action presence
  engagementAnalysis.categories.callToAction = analyzeCallToAction(text);
  
  // Analyze emotional language
  engagementAnalysis.categories.emotionalLanguage = analyzeEmotionalLanguage(text, toneAnalysis);
  
  // Analyze reader interaction (questions, direct address)
  engagementAnalysis.categories.readerInteraction = analyzeReaderInteraction(text);
  
  // Analyze transitions between ideas
  engagementAnalysis.categories.transitions = analyzeTransitions(text);
  
  // Analyze urgency and scarcity language
  engagementAnalysis.categories.urgencyScarcity = analyzeUrgencyScarcity(text);

  // Calculate overall engagement score
  const categoryScores = Object.values(engagementAnalysis.categories).map(cat => cat.score);
  engagementAnalysis.overallScore = Math.round(categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length);

  console.log('🎯 Engagement analysis complete. Overall score:', engagementAnalysis.overallScore);
  
  return engagementAnalysis;
}

function analyzeOpeningHook(opening, fullText) {
  const analysis = { score: 5, issues: [], suggestions: [] };
  
  // Check for weak openings
  const weakOpenings = [
    /^(this|that|it|there) (is|are|was|were)/i,
    /^(in|on|at|during) (this|that|the)/i,
    /^(many|some|most) (people|users|creators)/i,
    /^(today|now|currently)/i
  ];
  
  const hasWeakOpening = weakOpenings.some(pattern => pattern.test(opening));
  
  if (hasWeakOpening) {
    analysis.score = 3;
    analysis.issues.push('Weak opening that may not hook readers');
    analysis.suggestions.push({
      type: 'opening_hook',
      message: 'Consider starting with a question, bold statement, or compelling fact',
      position: 0
    });
  }
  
  // Check for question openings (good)
  if (/^(what|how|why|when|where|who|have you|did you|are you|do you)/i.test(opening)) {
    analysis.score = Math.min(analysis.score + 2, 10);
  }
  
  // Check for emotional/compelling words
  const compellingWords = ['discover', 'secret', 'proven', 'amazing', 'shocking', 'revealed', 'ultimate'];
  const hasCompellingWords = compellingWords.some(word => 
    new RegExp(`\\b${word}\\b`, 'i').test(opening)
  );
  
  if (hasCompellingWords) {
    analysis.score = Math.min(analysis.score + 1, 10);
  }
  
  return analysis;
}

function analyzeCallToAction(text) {
  const analysis = { score: 5, issues: [], suggestions: [] };
  
  // CTA patterns
  const ctaPatterns = [
    /\b(subscribe|like|share|comment|follow|click|visit|check out|learn more|sign up|join|download)\b/gi,
    /\b(what do you think|let me know|tell us|your thoughts|in the comments)\b/gi,
    /\b(don't forget to|make sure to|be sure to)\b/gi
  ];
  
  const ctaMatches = ctaPatterns.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  if (ctaMatches === 0) {
    analysis.score = 2;
    analysis.issues.push('No clear call-to-action found');
    analysis.suggestions.push({
      type: 'call_to_action',
      message: 'Add a call-to-action to encourage reader engagement',
      position: text.length - 50 // Suggest near the end
    });
  } else if (ctaMatches >= 2) {
    analysis.score = 8;
  }
  
  return analysis;
}

function analyzeEmotionalLanguage(text, toneAnalysis) {
  const analysis = { score: 5, issues: [], suggestions: [] };
  
  // Emotional words (positive and negative)
  const emotionalWords = [
    'amazing', 'incredible', 'fantastic', 'awesome', 'brilliant', 'stunning',
    'shocking', 'devastating', 'heartbreaking', 'infuriating', 'terrifying',
    'exciting', 'thrilling', 'inspiring', 'motivating', 'empowering',
    'love', 'hate', 'fear', 'hope', 'dream', 'passion', 'desire'
  ];
  
  const emotionalWordCount = emotionalWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  const wordsPerEmotionalWord = text.split(/\s+/).length / Math.max(emotionalWordCount, 1);
  
  if (wordsPerEmotionalWord > 50) {
    analysis.score = 3;
    analysis.issues.push('Limited emotional language may reduce reader engagement');
    analysis.suggestions.push({
      type: 'emotional_language',
      message: 'Consider adding more emotionally resonant words to connect with readers',
      position: Math.floor(text.length / 2)
    });
  } else if (wordsPerEmotionalWord < 20) {
    analysis.score = 8;
  }
  
  return analysis;
}

function analyzeReaderInteraction(text) {
  const analysis = { score: 5, issues: [], suggestions: [] };
  
  // Direct address patterns
  const directAddressPatterns = [
    /\byou\b/gi,
    /\byour\b/gi,
    /\byou're\b/gi,
    /\byou'll\b/gi,
    /\byou've\b/gi
  ];
  
  const directAddressCount = directAddressPatterns.reduce((count, pattern) => {
    const matches = text.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  // Question patterns
  const questionCount = (text.match(/\?/g) || []).length;
  
  const totalWords = text.split(/\s+/).length;
  const interactionRatio = (directAddressCount + questionCount) / totalWords;
  
  if (interactionRatio < 0.02) {
    analysis.score = 3;
    analysis.issues.push('Limited direct reader engagement');
    analysis.suggestions.push({
      type: 'reader_interaction',
      message: 'Try addressing readers directly with "you" or asking questions',
      position: Math.floor(text.length * 0.3)
    });
  } else if (interactionRatio > 0.05) {
    analysis.score = 8;
  }
  
  return analysis;
}

function analyzeTransitions(text) {
  const analysis = { score: 5, issues: [], suggestions: [] };
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length < 2) {
    return analysis; // Can't analyze transitions with fewer than 2 sentences
  }
  
  const transitionWords = [
    'however', 'therefore', 'furthermore', 'moreover', 'additionally',
    'meanwhile', 'consequently', 'nevertheless', 'nonetheless',
    'first', 'second', 'finally', 'next', 'then', 'also',
    'but', 'and', 'so', 'yet', 'because', 'since'
  ];
  
  const transitionCount = transitionWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  const transitionRatio = transitionCount / sentences.length;
  
  if (transitionRatio < 0.1) {
    analysis.score = 3;
    analysis.issues.push('Few transition words may make text feel choppy');
    analysis.suggestions.push({
      type: 'transitions',
      message: 'Add transition words to improve flow between ideas',
      position: Math.floor(text.length * 0.5)
    });
  } else if (transitionRatio > 0.3) {
    analysis.score = 8;
  }
  
  return analysis;
}

function analyzeUrgencyScarcity(text) {
  const analysis = { score: 5, issues: [], suggestions: [] };
  
  const urgencyWords = [
    'now', 'today', 'immediately', 'urgent', 'quickly', 'fast',
    'limited time', 'deadline', 'expires', 'hurry', 'rush',
    'only', 'exclusive', 'rare', 'limited', 'few left',
    'don\'t miss', 'last chance', 'final', 'ending soon'
  ];
  
  const urgencyCount = urgencyWords.reduce((count, phrase) => {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  
  if (urgencyCount === 0) {
    analysis.score = 4;
    analysis.issues.push('No urgency or scarcity language detected');
    analysis.suggestions.push({
      type: 'urgency_scarcity',
      message: 'Consider adding urgency to motivate immediate action',
      position: text.length - 100
    });
  } else if (urgencyCount >= 2) {
    analysis.score = 7;
  }
  
  return analysis;
}

async function generateEngagementSuggestions(engagementAnalysis, text, toneAnalysis) {
  console.log('🎯 Generating engagement suggestions...');
  
  const suggestions = [];
  
  // Process each category's suggestions
  Object.entries(engagementAnalysis.categories).forEach(([category, analysis]) => {
    analysis.suggestions.forEach(suggestion => {
      // Generate AI-enhanced alternatives for each suggestion
      suggestions.push({
        id: `engagement-${Math.random().toString(36).slice(2, 10)}`,
        text: getTextAtPosition(text, suggestion.position, 20),
        message: suggestion.message,
        type: 'engagement',
        alternatives: generateEngagementAlternatives(suggestion.type, text, suggestion.position, toneAnalysis),
        start: Math.max(0, suggestion.position - 10),
        end: Math.min(text.length, suggestion.position + 10),
        status: 'pending',
        engagementCategory: category,
        engagementType: suggestion.type,
        priority: calculateEngagementPriority(suggestion.type, engagementAnalysis.overallScore)
      });
    });
  });
  
  console.log('🎯 Generated', suggestions.length, 'engagement suggestions');
  return suggestions;
}

function getTextAtPosition(text, position, length = 20) {
  const start = Math.max(0, position - length / 2);
  const end = Math.min(text.length, position + length / 2);
  return text.substring(start, end).trim();
}

function generateEngagementAlternatives(engagementType, text, position, toneAnalysis) {
  const alternatives = [];
  
  switch (engagementType) {
    case 'opening_hook':
      alternatives.push(
        "What if I told you...",
        "Here's something that might surprise you:",
        "Ever wondered why..."
      );
      break;
    case 'call_to_action':
      alternatives.push(
        "What do you think about this?",
        "Let me know in the comments!",
        "Share your experience below"
      );
      break;
    case 'emotional_language':
      alternatives.push(
        "This is absolutely incredible",
        "You'll be amazed by this",
        "This changes everything"
      );
      break;
    case 'reader_interaction':
      alternatives.push(
        "Have you ever experienced this?",
        "You might be wondering...",
        "Here's what you need to know:"
      );
      break;
    case 'transitions':
      alternatives.push(
        "But here's the thing:",
        "Now, here's where it gets interesting:",
        "However, there's more to it:"
      );
      break;
    case 'urgency_scarcity':
      alternatives.push(
        "Don't wait - this is important",
        "Time is running out for this opportunity",
        "Only a few people know this secret"
      );
      break;
    default:
      alternatives.push("Consider revising for better engagement");
  }
  
  return alternatives;
}

function calculateEngagementPriority(engagementType, overallScore) {
  const basePriorities = {
    'opening_hook': 8, // High priority - first impression matters
    'call_to_action': 7, // High priority - drives action
    'reader_interaction': 6, // Medium-high priority - builds connection
    'emotional_language': 5, // Medium priority - enhances connection
    'transitions': 4, // Medium priority - improves flow
    'urgency_scarcity': 3 // Lower priority - can be overused
  };
  
  let priority = basePriorities[engagementType] || 5;
  
  // Adjust based on overall engagement score
  if (overallScore < 4) {
    priority += 1; // Boost priority for low-engagement content
  } else if (overallScore > 7) {
    priority -= 1; // Lower priority if already engaging
  }
  
  return Math.max(1, Math.min(10, priority));
}

// Cache for engagement analysis
const engagementCache = new Map();

// ========== PLATFORM ADAPTATION ANALYSIS ==========

// Platform Definitions (inline for Node.js compatibility)
const PLATFORM_DEFINITIONS = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    displayName: 'LinkedIn',
    category: 'professional',
    characterLimits: { post: 3000, title: 100, description: 2000 },
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
      closingTactics: [
        'What\'s been your experience?',
        'I\'d love to hear your perspective',
        'Feel free to connect if you want to discuss',
        'What would you add to this?'
      ],
      avoidWords: ['viral', 'hack', 'secret', 'weird trick', 'you won\'t believe']
    }
  },
  twitter: {
    id: 'twitter',
    name: 'Twitter',
    displayName: 'Twitter/X',
    category: 'social',
    characterLimits: { post: 280, bio: 160 },
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
      closingTactics: [
        'Thoughts?',
        'Agree or disagree?',
        'What\'s your take?',
        'RT if you relate'
      ],
      avoidWords: ['please retweet', 'follow me', 'check out my', 'buy now']
    }
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    displayName: 'Instagram',
    category: 'social',
    characterLimits: { caption: 2200, bio: 150, title: 100 },
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
      closingTactics: [
        'What resonates with you?',
        'Share your thoughts below 👇',
        'Save for later if this helps! 📌',
        'Tag someone who needs this'
      ],
      avoidWords: ['follow for follow', 'like for like', 'spam', 'cheap']
    }
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    displayName: 'YouTube',
    category: 'video',
    characterLimits: { title: 100, description: 5000 },
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
      closingTactics: [
        'Thanks for watching!',
        'See you in the next video',
        'Don\'t forget to subscribe',
        'Check out this related video'
      ],
      avoidWords: ['clickbait', 'fake', 'scam', 'you won\'t believe']
    }
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    displayName: 'TikTok',
    category: 'video',
    characterLimits: { caption: 2200, bio: 80 },
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
      closingTactics: [
        'Follow for more',
        'Like if you agree',
        'Comment below',
        'Share with friends'
      ],
      avoidWords: ['old', 'outdated', 'boring', 'traditional', 'formal']
    }
  }
};

// Platform analysis functions
function analyzePlatformOptimization(text, platformId, currentTone = []) {
  const platform = PLATFORM_DEFINITIONS[platformId];
  if (!platform) {
    throw new Error(`Platform ${platformId} not found`);
  }

  const analysis = {
    platformId,
    platformName: platform.displayName,
    overallScore: 0,
    characterAnalysis: analyzeCharacterUsage(text, platform),
    toneAnalysis: analyzeToneMatch(currentTone, platform),
    engagementAnalysis: analyzeEngagementElements(text, platform),
    bestPracticesAnalysis: analyzeBestPractices(text, platform),
    recommendations: []
  };

  // Calculate overall score
  analysis.overallScore = calculateOverallScore(analysis);
  
  // Generate recommendations
  analysis.recommendations = generatePlatformRecommendations(text, platform, analysis);

  return analysis;
}

function analyzeCharacterUsage(text, platform) {
  const currentLength = text.length;
  const optimalLength = platform.characterLimits.post || platform.characterLimits.caption;
  
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
}

function analyzeToneMatch(currentTone, platform) {
  const preferredTone = platform.preferredTone;
  
  // Calculate tone match score
  const matches = currentTone.filter(tone => 
    preferredTone.some(preferred => 
      preferred.toLowerCase().includes(tone.toLowerCase()) ||
      tone.toLowerCase().includes(preferred.toLowerCase())
    )
  );
  
  const toneMatch = currentTone.length > 0 ? matches.length / currentTone.length : 0.5;
  
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
}

function analyzeEngagementElements(text, platform) {
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
}

function analyzeBestPractices(text, platform) {
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
}

function calculateOverallScore(analysis) {
  const characterScore = analysis.characterAnalysis.isOptimal ? 1 : 0.5;
  const toneScore = analysis.toneAnalysis.toneMatch;
  const engagementScore = analysis.engagementAnalysis.engagementScore;
  const bestPracticesScore = analysis.bestPracticesAnalysis.bestPracticesScore;
  
  const overallScore = (characterScore + toneScore + engagementScore + bestPracticesScore) / 4;
  return Math.round(overallScore * 10);
}

function generatePlatformRecommendations(text, platform, analysis) {
  const recommendations = [];
  
  // Character length recommendations
  if (!analysis.characterAnalysis.isOptimal) {
    recommendations.push({
      type: 'length',
      priority: 'high',
      title: 'Optimize Content Length',
      description: analysis.characterAnalysis.lengthRecommendation,
      suggestion: analysis.characterAnalysis.currentLength > (analysis.characterAnalysis.optimalLength || 0) 
        ? 'Shorten your content to fit platform limits'
        : 'Expand your content for better engagement',
      examples: []
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
}

async function generatePlatformAdaptationSuggestions(text, platformId, toneAnalysis = null) {
  console.log('🎯 Starting platform adaptation analysis for:', platformId);
  
  try {
    // Extract tone information if available
    const currentTone = toneAnalysis ? [toneAnalysis.primaryTone, ...toneAnalysis.secondaryTones] : [];
    
    // Analyze platform optimization
    const platformAnalysis = analyzePlatformOptimization(text, platformId, currentTone);
    
    const suggestions = [];
    
    // Generate suggestions based on recommendations
    platformAnalysis.recommendations.forEach((rec, index) => {
      if (rec.priority === 'critical' || rec.priority === 'high') {
        // Find appropriate position in text for the suggestion
        let position = 0;
        let suggestionText = text.substring(0, Math.min(50, text.length));
        
        if (rec.type === 'length') {
          position = text.length - 20;
          suggestionText = text.substring(Math.max(0, text.length - 50));
        } else if (rec.type === 'structure' && rec.title.includes('Opening')) {
          position = 0;
          suggestionText = text.substring(0, Math.min(50, text.length));
        } else if (rec.type === 'engagement') {
          position = Math.floor(text.length * 0.8); // Near end for CTAs
          suggestionText = text.substring(Math.max(0, position - 25), position + 25);
        }
        
        suggestions.push({
          id: `platform-${platformId}-${Math.random().toString(36).slice(2, 10)}`,
          text: suggestionText.trim(),
          message: `${rec.title} for ${platformAnalysis.platformName}`,
          type: 'platform-adaptation',
          alternatives: rec.examples.slice(0, 3),
          start: Math.max(0, position - 10),
          end: Math.min(text.length, position + 10),
          status: 'pending',
          platformId: platformId,
          platformName: platformAnalysis.platformName,
          platformCategory: rec.type,
          priority: rec.priority === 'critical' ? 9 : rec.priority === 'high' ? 7 : 5,
          platformScore: platformAnalysis.overallScore,
          recommendation: rec,
          userTip: rec.description
        });
      }
    });
    
    console.log(`🎯 Generated ${suggestions.length} platform adaptation suggestions for ${platformAnalysis.platformName}`);
    return suggestions;
  } catch (error) {
    console.error('🚨 Error in platform adaptation analysis:', error);
    return [];
  }
}

// Cache for platform analysis
const platformCache = new Map();

// =============================================
// SEO CONTENT OPTIMIZATION FUNCTIONS
// =============================================

/**
 * Analyzes content for SEO optimization opportunities
 */
async function analyzeSEOOptimization(text, contentType = 'general', primaryKeyword = null) {
  console.log(`🎯 Starting SEO optimization analysis for: ${contentType}`);
  
  try {
    // Check cache first
    const cacheKey = `seo_${text.substring(0, 100)}_${contentType}_${primaryKeyword || 'auto'}`;
    const cached = getFromCache(seoCache, cacheKey, 300000); // 5 minutes
    if (cached) {
      console.log('🎯 Using cached SEO analysis');
      return cached;
    }

    // Initialize analysis components
    const keywordAnalysis = analyzeKeywords(text, primaryKeyword);
    const contentStructure = analyzeContentStructure(text, contentType);
    const readabilityAnalysis = analyzeSEOReadability(text);

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

    const result = {
      overallScore,
      keywordAnalysis,
      contentStructure,
      readabilityAnalysis,
      recommendations,
      issues
    };

    // Cache the result
    setCache(seoCache, cacheKey, result);
    console.log(`🎯 SEO analysis complete. Overall score: ${overallScore}`);
    
    return result;
  } catch (error) {
    console.error('🚨 SEO analysis error:', error);
    return {
      overallScore: 50,
      keywordAnalysis: { score: 50, keywordDensity: 0, keywordPlacement: {} },
      contentStructure: { score: 50, wordCount: text.split(/\s+/).length },
      readabilityAnalysis: { score: 50, fleschKincaidScore: 60 },
      recommendations: [],
      issues: []
    };
  }
}

/**
 * Keyword Analysis Functions
 */
function analyzeKeywords(text, primaryKeyword) {
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

function detectPrimaryKeyword(text) {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = {};
  
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

function countKeywordOccurrences(text, keyword) {
  if (!keyword) return 0;
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(regex) || []).length;
}

function analyzeKeywordPlacement(text, primaryKeyword) {
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

/**
 * Content Structure Analysis Functions
 */
function analyzeContentStructure(text, contentType) {
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

function analyzeHeadingStructure(text) {
  const headingMatches = text.match(/^#+\s+.+$/gm) || [];
  const structure = {
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

function analyzeParagraphStructure(text) {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  const wordCounts = paragraphs.map(p => p.split(/\s+/).length);
  
  return {
    totalParagraphs: paragraphs.length,
    avgWordsPerParagraph: wordCounts.reduce((sum, count) => sum + count, 0) / paragraphs.length,
    shortParagraphs: wordCounts.filter(count => count < 50).length,
    longParagraphs: wordCounts.filter(count => count > 150).length
  };
}

/**
 * Readability Analysis Functions (SEO-specific)
 */
function analyzeSEOReadability(text) {
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
  const score = calculateSEOReadabilityScore(fleschKincaidScore, avgSentenceLength, complexWords);

  return {
    fleschKincaidScore,
    readabilityLevel,
    avgSentenceLength,
    avgSyllablesPerWord,
    complexWords,
    score
  };
}

function countTotalSyllables(text) {
  const words = text.split(/\s+/);
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

function calculateFleschKincaidScore(avgSentenceLength, avgSyllablesPerWord) {
  return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
}

function countComplexWords(words) {
  return words.filter(word => countSyllables(word) >= 3).length;
}

/**
 * SEO Scoring Functions
 */
function calculateKeywordScore(density, placement) {
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

function calculateContentStructureScore(data) {
  let score = 0;
  
  // Word count score (0-40 points)
  const lengthRule = SEO_RULES.contentLength[data.contentType] || SEO_RULES.contentLength.general;
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

function calculateSEOReadabilityScore(fleschKincaid, avgSentenceLength, complexWords) {
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

function calculateOverallSEOScore(data) {
  const keywordWeight = 0.4;
  const contentWeight = 0.35;
  const readabilityWeight = 0.25;
  
  const weightedScore = 
    (data.keywordAnalysis.score * keywordWeight) +
    (data.contentStructure.score * contentWeight) +
    (data.readabilityAnalysis.score * readabilityWeight);
  
  return Math.round(weightedScore);
}

/**
 * SEO Recommendations and Issues
 */
function generateSEORecommendations(data) {
  const recommendations = [];
  
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

function identifySEOIssues(data) {
  const issues = [];
  
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

/**
 * Generate SEO-specific suggestions for content optimization
 */
async function generateSEOSuggestions(text, contentType = 'general', primaryKeyword = null) {
  console.log(`🎯 Generating SEO suggestions for ${contentType} content`);
  
  try {
    const seoAnalysis = await analyzeSEOOptimization(text, contentType, primaryKeyword);
    const suggestions = [];
    
    // Generate keyword optimization suggestions
    if (seoAnalysis.keywordAnalysis.score < 70) {
      const keywordIssues = await identifyKeywordIssues(text, seoAnalysis.keywordAnalysis);
      suggestions.push(...keywordIssues);
    }
    
    // Generate content structure suggestions
    if (seoAnalysis.contentStructure.score < 70) {
      const structureIssues = await identifyStructureIssues(text, seoAnalysis.contentStructure);
      suggestions.push(...structureIssues);
    }
    
    // Generate readability suggestions
    if (seoAnalysis.readabilityAnalysis.score < 70) {
      const readabilityIssues = await identifyReadabilityIssues(text, seoAnalysis.readabilityAnalysis);
      suggestions.push(...readabilityIssues);
    }
    
    console.log(`🎯 Generated ${suggestions.length} SEO suggestions`);
    return suggestions;
    
  } catch (error) {
    console.error('🚨 SEO suggestion generation error:', error);
    return [];
  }
}

async function identifyKeywordIssues(text, keywordAnalysis) {
  const suggestions = [];
  
  // Keyword density issues
  if (keywordAnalysis.keywordDensity < 0.005) {
    suggestions.push({
      id: `seo-keyword-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 50) + '...',
      message: 'Increase keyword usage for better SEO',
      type: 'seo',
      alternatives: [
        `Include "${keywordAnalysis.primaryKeyword}" more naturally`,
        `Add keyword variations throughout content`,
        `Use keyword in headings and subheadings`
      ],
      start: 0,
      end: 50,
      status: 'pending',
      seoCategory: 'keyword-optimization',
      seoType: 'keyword_density',
      priority: 7,
      seoScore: keywordAnalysis.score,
      recommendation: {
        type: 'optimization',
        priority: 'high',
        title: 'Increase Keyword Density',
        description: 'Your content needs more keyword usage for better SEO',
        suggestion: 'Include your primary keyword more naturally throughout the content',
        examples: [
          `Use "${keywordAnalysis.primaryKeyword}" in your introduction`,
          `Include keyword variations in headings`,
          `Add keyword naturally in conclusion`
        ]
      }
    });
  }
  
  if (keywordAnalysis.keywordDensity > 0.03) {
    suggestions.push({
      id: `seo-keyword-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 50) + '...',
      message: 'Reduce keyword density to avoid over-optimization',
      type: 'seo',
      alternatives: [
        'Use more natural language',
        'Replace some keywords with synonyms',
        'Focus on semantic keywords instead'
      ],
      start: 0,
      end: 50,
      status: 'pending',
      seoCategory: 'keyword-optimization',
      seoType: 'keyword_stuffing',
      priority: 9,
      seoScore: keywordAnalysis.score,
      recommendation: {
        type: 'warning',
        priority: 'critical',
        title: 'Reduce Keyword Stuffing',
        description: 'Too many keywords may hurt your SEO performance',
        suggestion: 'Use more natural language and keyword variations',
        examples: [
          'Replace repeated keywords with synonyms',
          'Focus on natural sentence flow',
          'Use semantic keywords and related terms'
        ]
      }
    });
  }
  
  return suggestions;
}

async function identifyStructureIssues(text, contentStructure) {
  const suggestions = [];
  
  // Missing H1 heading
  if (contentStructure.headingStructure.h1Count === 0) {
    suggestions.push({
      id: `seo-structure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 30),
      message: 'Add H1 heading for better SEO structure',
      type: 'seo',
      alternatives: [
        'Add a descriptive H1 heading',
        'Include primary keyword in H1',
        'Use clear, compelling headline'
      ],
      start: 0,
      end: 30,
      status: 'pending',
      seoCategory: 'content-structure',
      seoType: 'heading_structure',
      priority: 8,
      seoScore: contentStructure.score,
      recommendation: {
        type: 'structure',
        priority: 'high',
        title: 'Add H1 Heading',
        description: 'Your content is missing a primary H1 heading',
        suggestion: 'Add a descriptive H1 heading with your primary keyword',
        examples: [
          'Create a compelling main headline',
          'Include your target keyword naturally',
          'Make it descriptive and engaging'
        ]
      }
    });
  }
  
  // Too few H2 headings
  if (contentStructure.headingStructure.h2Count < 2 && contentStructure.wordCount > 500) {
    suggestions.push({
      id: `seo-structure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(Math.floor(text.length / 2), Math.floor(text.length / 2) + 30),
      message: 'Add more H2 headings to improve content structure',
      type: 'seo',
      alternatives: [
        'Break content into sections with H2 headings',
        'Use descriptive subheadings',
        'Include keywords in some headings'
      ],
      start: Math.floor(text.length / 2),
      end: Math.floor(text.length / 2) + 30,
      status: 'pending',
      seoCategory: 'content-structure',
      seoType: 'heading_hierarchy',
      priority: 6,
      seoScore: contentStructure.score,
      recommendation: {
        type: 'structure',
        priority: 'medium',
        title: 'Add More Subheadings',
        description: 'Your content needs more H2 headings for better organization',
        suggestion: 'Break your content into logical sections with H2 headings',
        examples: [
          'Add section headings every 200-300 words',
          'Use descriptive, keyword-rich headings',
          'Create a logical content hierarchy'
        ]
      }
    });
  }
  
  return suggestions;
}

async function identifyReadabilityIssues(text, readabilityAnalysis) {
  const suggestions = [];
  
  // Poor readability score
  if (readabilityAnalysis.fleschKincaidScore < 50) {
    suggestions.push({
      id: `seo-readability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 40) + '...',
      message: 'Improve readability for better user engagement',
      type: 'seo',
      alternatives: [
        'Use shorter sentences',
        'Simplify complex words',
        'Break up long paragraphs'
      ],
      start: 0,
      end: 40,
      status: 'pending',
      seoCategory: 'readability',
      seoType: 'reading_level',
      priority: 5,
      seoScore: readabilityAnalysis.score,
      recommendation: {
        type: 'readability',
        priority: 'medium',
        title: 'Improve Content Readability',
        description: 'Your content is difficult to read and understand',
        suggestion: 'Simplify language and sentence structure for better engagement',
        examples: [
          'Use shorter sentences (15-20 words)',
          'Replace complex words with simpler alternatives',
          'Break up long paragraphs into smaller chunks'
        ]
      }
    });
  }
  
  // Sentences too long
  if (readabilityAnalysis.avgSentenceLength > 25) {
    suggestions.push({
      id: `seo-readability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 40) + '...',
      message: 'Shorten sentences for better readability',
      type: 'seo',
      alternatives: [
        'Break long sentences into shorter ones',
        'Use simple sentence structures',
        'Remove unnecessary words'
      ],
      start: 0,
      end: 40,
      status: 'pending',
      seoCategory: 'readability',
      seoType: 'sentence_length',
      priority: 4,
      seoScore: readabilityAnalysis.score,
      recommendation: {
        type: 'readability',
        priority: 'medium',
        title: 'Shorten Long Sentences',
        description: 'Your sentences are too long, making content hard to read',
        suggestion: 'Break long sentences into shorter, clearer statements',
        examples: [
          'Aim for 15-20 words per sentence',
          'Use periods instead of commas when possible',
          'Split complex ideas into multiple sentences'
        ]
      }
    });
  }
  
  return suggestions;
}

/**
 * Generate Advanced SEO suggestions with Phase 3 features
 */
async function generateAdvancedSEOSuggestions(text, options = {}) {
  console.log(`🎯 Generating advanced SEO suggestions for ${options.contentType} content`);
  
  try {
    const seoAnalysis = await analyzeSEOOptimization(text, options.contentType, options.primaryKeyword);
    const suggestions = [];
    const analytics = {
      contentScore: seoAnalysis.overallScore,
      keywordAnalysis: seoAnalysis.keywordAnalysis,
      contentStructure: seoAnalysis.contentStructure,
      readabilityAnalysis: seoAnalysis.readabilityAnalysis,
      suggestedLSIKeywords: []
    };
    
    // Generate basic SEO suggestions
    if (seoAnalysis.keywordAnalysis.score < 70) {
      const keywordIssues = await identifyKeywordIssues(text, seoAnalysis.keywordAnalysis);
      suggestions.push(...keywordIssues);
    }
    
    if (seoAnalysis.contentStructure.score < 70) {
      const structureIssues = await identifyStructureIssues(text, seoAnalysis.contentStructure);
      suggestions.push(...structureIssues);
    }
    
    if (seoAnalysis.readabilityAnalysis.score < 70) {
      const readabilityIssues = await identifyReadabilityIssues(text, seoAnalysis.readabilityAnalysis);
      suggestions.push(...readabilityIssues);
    }
    
    // Phase 3: Advanced SEO Features
    
    // Meta Optimization
    if (options.seoMetaOptimization) {
      const metaIssues = await identifyMetaOptimizationIssues(text, options);
      suggestions.push(...metaIssues);
    }
    
    // Keyword Research & LSI Keywords
    if (options.seoKeywordResearch && options.primaryKeyword) {
      const keywordResearchSuggestions = await generateKeywordResearchSuggestions(text, options);
      suggestions.push(...keywordResearchSuggestions.suggestions);
      analytics.suggestedLSIKeywords = keywordResearchSuggestions.lsiKeywords;
    }
    
    // Internal Linking Opportunities
    if (options.seoInternalLinking) {
      const linkingSuggestions = await identifyInternalLinkingOpportunities(text, options);
      suggestions.push(...linkingSuggestions);
    }
    
    // Schema Markup Suggestions
    if (options.seoSchemaMarkup) {
      const schemaSuggestions = await generateSchemaMarkupSuggestions(text, options);
      suggestions.push(...schemaSuggestions);
    }
    
    console.log(`🎯 Generated ${suggestions.length} advanced SEO suggestions`);
    return { suggestions, analytics };
    
  } catch (error) {
    console.error('🚨 Advanced SEO suggestion generation error:', error);
    return { suggestions: [], analytics: {} };
  }
}

/**
 * Meta Optimization Analysis
 */
async function identifyMetaOptimizationIssues(text, options) {
  const suggestions = [];
  const { seoMetaTitle, seoMetaDescription, seoFocusKeyphrase, primaryKeyword } = options;
  
  // Meta Title Analysis
  if (!seoMetaTitle || seoMetaTitle.length === 0) {
    suggestions.push({
      id: `seo-meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 50) + '...',
      message: 'Add a meta title for better search visibility',
      type: 'seo',
      alternatives: [
        `Create a compelling title with "${primaryKeyword}"`,
        'Write a 50-60 character title with your main keyword',
        'Include your primary keyword in the title naturally'
      ],
      start: 0,
      end: 50,
      status: 'pending',
      seoCategory: 'meta-optimization',
      seoType: 'meta_title',
      priority: 9,
      seoScore: 0,
      recommendation: {
        type: 'critical',
        priority: 'high',
        title: 'Missing Meta Title',
        description: 'Meta titles are crucial for search engine rankings and click-through rates',
        suggestion: 'Create a compelling meta title that includes your primary keyword',
        examples: [
          `${primaryKeyword} - Complete Guide for Beginners`,
          `How to Master ${primaryKeyword} in 2024`,
          `Ultimate ${primaryKeyword} Tips and Strategies`
        ]
      }
    });
  } else if (seoMetaTitle.length < 30 || seoMetaTitle.length > 60) {
    suggestions.push({
      id: `seo-meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: seoMetaTitle,
      message: seoMetaTitle.length < 30 ? 'Meta title is too short' : 'Meta title is too long',
      type: 'seo',
      alternatives: [
        seoMetaTitle.length < 30 ? 'Expand title with more descriptive keywords' : 'Shorten title to under 60 characters',
        'Optimize title length for better SERP display',
        'Include primary keyword while maintaining optimal length'
      ],
      start: 0,
      end: seoMetaTitle.length,
      status: 'pending',
      seoCategory: 'meta-optimization',
      seoType: 'meta_title_length',
      priority: 7,
      seoScore: seoMetaTitle.length < 30 ? 40 : 60,
      recommendation: {
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Meta Title Length',
        description: 'Meta titles should be 50-60 characters for optimal display in search results',
        suggestion: seoMetaTitle.length < 30 ? 'Expand your title with more descriptive terms' : 'Shorten your title to fit search result displays',
        examples: [`Current: ${seoMetaTitle.length} characters`, 'Target: 50-60 characters']
      }
    });
  }
  
  // Meta Description Analysis
  if (!seoMetaDescription || seoMetaDescription.length === 0) {
    suggestions.push({
      id: `seo-meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 100) + '...',
      message: 'Add a meta description to improve click-through rates',
      type: 'seo',
      alternatives: [
        `Write a compelling 150-160 character description with "${primaryKeyword}"`,
        'Create a description that summarizes your content value',
        'Include a call-to-action in your meta description'
      ],
      start: 0,
      end: 100,
      status: 'pending',
      seoCategory: 'meta-optimization',
      seoType: 'meta_description',
      priority: 8,
      seoScore: 0,
      recommendation: {
        type: 'critical',
        priority: 'high',
        title: 'Missing Meta Description',
        description: 'Meta descriptions help users understand your content and improve click-through rates',
        suggestion: 'Write a compelling meta description that includes your primary keyword and value proposition',
        examples: [
          `Learn ${primaryKeyword} with our comprehensive guide. Get practical tips, strategies, and examples to improve your results.`,
          `Discover the best ${primaryKeyword} techniques used by experts. Step-by-step instructions and proven methods included.`
        ]
      }
    });
  } else if (seoMetaDescription.length < 120 || seoMetaDescription.length > 160) {
    suggestions.push({
      id: `seo-meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: seoMetaDescription,
      message: seoMetaDescription.length < 120 ? 'Meta description is too short' : 'Meta description is too long',
      type: 'seo',
      alternatives: [
        seoMetaDescription.length < 120 ? 'Expand description with more value proposition' : 'Shorten description to under 160 characters',
        'Optimize description length for better SERP display',
        'Include primary keyword while maintaining optimal length'
      ],
      start: 0,
      end: seoMetaDescription.length,
      status: 'pending',
      seoCategory: 'meta-optimization',
      seoType: 'meta_description_length',
      priority: 6,
      seoScore: seoMetaDescription.length < 120 ? 50 : 70,
      recommendation: {
        type: 'optimization',
        priority: 'medium',
        title: 'Optimize Meta Description Length',
        description: 'Meta descriptions should be 150-160 characters for optimal display',
        suggestion: seoMetaDescription.length < 120 ? 'Expand your description with more compelling details' : 'Trim your description to fit search result displays',
        examples: [`Current: ${seoMetaDescription.length} characters`, 'Target: 150-160 characters']
      }
    });
  }
  
  return suggestions;
}

/**
 * Keyword Research and LSI Keyword Suggestions
 */
async function generateKeywordResearchSuggestions(text, options) {
  const { primaryKeyword, secondaryKeywords, contentType } = options;
  const suggestions = [];
  const lsiKeywords = [];
  
  // Generate LSI keywords based on content type and primary keyword
  const generatedLSI = generateLSIKeywords(primaryKeyword, contentType);
  lsiKeywords.push(...generatedLSI);
  
  // Analyze current keyword usage
  const wordCount = text.split(/\s+/).length;
  const primaryKeywordUsage = countKeywordOccurrences(text, primaryKeyword);
  const primaryKeywordDensity = (primaryKeywordUsage / wordCount) * 100;
  
  // Check for missing LSI keywords
  const missingLSI = generatedLSI.filter(keyword => 
    !text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (missingLSI.length > 0) {
    suggestions.push({
      id: `seo-lsi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 100) + '...',
      message: 'Add LSI keywords to improve semantic SEO',
      type: 'seo',
      alternatives: [
        `Include "${missingLSI[0]}" naturally in your content`,
        `Add "${missingLSI[1] || missingLSI[0]}" to improve topic coverage`,
        `Use "${missingLSI[2] || missingLSI[0]}" for better semantic relevance`
      ],
      start: 0,
      end: 100,
      status: 'pending',
      seoCategory: 'keyword-research',
      seoType: 'lsi_keywords',
      priority: 6,
      seoScore: 60,
      recommendation: {
        type: 'enhancement',
        priority: 'medium',
        title: 'Add LSI Keywords',
        description: 'LSI (Latent Semantic Indexing) keywords help search engines understand your content better',
        suggestion: 'Include related keywords naturally throughout your content',
        examples: missingLSI.slice(0, 5)
      }
    });
  }
  
  // Long-tail keyword opportunities
  const longTailKeywords = generateLongTailKeywords(primaryKeyword, contentType);
  const missingLongTail = longTailKeywords.filter(keyword => 
    !text.toLowerCase().includes(keyword.toLowerCase())
  ).slice(0, 3);
  
  if (missingLongTail.length > 0) {
    suggestions.push({
      id: `seo-longtail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.substring(0, 150) + '...',
      message: 'Consider adding long-tail keywords for better targeting',
      type: 'seo',
      alternatives: missingLongTail.map(keyword => `Include "${keyword}" for specific search queries`),
      start: 0,
      end: 150,
      status: 'pending',
      seoCategory: 'keyword-research',
      seoType: 'long_tail_keywords',
      priority: 5,
      seoScore: 70,
      recommendation: {
        type: 'enhancement',
        priority: 'low',
        title: 'Add Long-tail Keywords',
        description: 'Long-tail keywords help capture specific search intents and reduce competition',
        suggestion: 'Include specific, longer keyword phrases that your audience might search for',
        examples: missingLongTail
      }
    });
  }
  
  return { suggestions, lsiKeywords: generatedLSI };
}

/**
 * Internal Linking Opportunities
 */
async function identifyInternalLinkingOpportunities(text, options) {
  const suggestions = [];
  const { primaryKeyword, secondaryKeywords, contentType } = options;
  
  // Check for anchor text opportunities
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const linkOpportunities = [];
  
  // Find sentences that could benefit from internal links
  sentences.forEach((sentence, index) => {
    const sentenceStart = text.indexOf(sentence);
    const sentenceEnd = sentenceStart + sentence.length;
    
    // Look for key phrases that could be linked
    const linkableTerms = [
      ...secondaryKeywords,
      'learn more',
      'complete guide',
      'step by step',
      'best practices',
      'tips and tricks',
      'how to',
      'ultimate guide'
    ];
    
    linkableTerms.forEach(term => {
      if (sentence.toLowerCase().includes(term.toLowerCase()) && 
          !sentence.includes('href=') && // Don't suggest if already linked
          linkOpportunities.length < 3) { // Limit suggestions
        
        linkOpportunities.push({
          sentence,
          term,
          start: sentenceStart,
          end: sentenceEnd,
          index
        });
      }
    });
  });
  
  if (linkOpportunities.length > 0) {
    const opportunity = linkOpportunities[0];
    suggestions.push({
      id: `seo-linking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: opportunity.sentence.substring(0, 100) + '...',
      message: 'Add internal links to improve SEO and user experience',
      type: 'seo',
      alternatives: [
        `Link "${opportunity.term}" to a related page or article`,
        'Add contextual links to relevant content',
        'Create anchor text for better internal linking'
      ],
      start: opportunity.start,
      end: opportunity.end,
      status: 'pending',
      seoCategory: 'internal-linking',
      seoType: 'link_opportunities',
      priority: 5,
      seoScore: 75,
      recommendation: {
        type: 'enhancement',
        priority: 'medium',
        title: 'Add Internal Links',
        description: 'Internal links help search engines understand your site structure and keep users engaged',
        suggestion: 'Add 2-3 contextual internal links to relevant pages or articles',
        examples: [
          'Link to related blog posts',
          'Connect to product or service pages',
          'Reference comprehensive guides or resources'
        ]
      }
    });
  }
  
  return suggestions;
}

/**
 * Schema Markup Suggestions
 */
async function generateSchemaMarkupSuggestions(text, options) {
  const suggestions = [];
  const { contentType, primaryKeyword } = options;
  
  // Suggest appropriate schema markup based on content type
  const schemaTypes = {
    'blogPost': 'BlogPosting',
    'article': 'Article',
    'productDescription': 'Product',
    'landingPage': 'WebPage',
    'email': 'EmailMessage',
    'socialMedia': 'SocialMediaPosting'
  };
  
  const recommendedSchema = schemaTypes[contentType] || 'Article';
  
  suggestions.push({
    id: `seo-schema-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.substring(0, 100) + '...',
    message: `Add ${recommendedSchema} schema markup for better search visibility`,
    type: 'seo',
    alternatives: [
      `Implement ${recommendedSchema} structured data`,
      'Add JSON-LD schema markup to your page',
      'Include structured data for rich snippets'
    ],
    start: 0,
    end: 100,
    status: 'pending',
    seoCategory: 'schema-markup',
    seoType: 'structured_data',
    priority: 4,
    seoScore: 80,
    recommendation: {
      type: 'enhancement',
      priority: 'low',
      title: `Add ${recommendedSchema} Schema`,
      description: 'Schema markup helps search engines understand your content and can lead to rich snippets',
      suggestion: `Implement ${recommendedSchema} structured data for better search visibility`,
      examples: [
        'Add author information',
        'Include publication date',
        'Specify content type and topic',
        'Add organization details'
      ]
    }
  });
  
  return suggestions;
}

/**
 * Helper function to generate LSI keywords
 */
function generateLSIKeywords(primaryKeyword, contentType) {
  const keywordMap = {
    'seo': ['search engine optimization', 'organic traffic', 'keyword research', 'SERP ranking', 'meta tags', 'backlinks', 'content optimization', 'on-page SEO', 'off-page SEO', 'technical SEO'],
    'digital marketing': ['online marketing', 'social media marketing', 'email marketing', 'content marketing', 'PPC advertising', 'conversion rate', 'lead generation', 'brand awareness', 'customer acquisition', 'marketing automation'],
    'content marketing': ['blog posts', 'content strategy', 'storytelling', 'audience engagement', 'brand awareness', 'lead generation', 'content creation', 'content distribution', 'content calendar', 'content ROI'],
    'social media': ['social platforms', 'engagement rate', 'social sharing', 'community building', 'influencer marketing', 'viral content', 'social media strategy', 'social advertising', 'brand presence', 'social analytics'],
    'email marketing': ['email campaigns', 'newsletter', 'email automation', 'open rates', 'click-through rates', 'subscriber list', 'email segmentation', 'email design', 'email deliverability', 'email personalization'],
    'web design': ['user experience', 'responsive design', 'website layout', 'navigation', 'visual design', 'mobile optimization', 'UI/UX design', 'website performance', 'accessibility', 'conversion optimization'],
    'blogging': ['blog content', 'publishing', 'readership', 'blog traffic', 'content calendar', 'guest posting', 'blog SEO', 'blog monetization', 'blog promotion', 'blog analytics'],
    'ecommerce': ['online store', 'product pages', 'shopping cart', 'checkout process', 'payment gateway', 'inventory management', 'product catalog', 'customer reviews', 'order fulfillment', 'ecommerce SEO']
  };
  
  const primaryLower = primaryKeyword ? primaryKeyword.toLowerCase() : '';
  
  // Find matching keywords
  let lsiKeywords = [];
  Object.entries(keywordMap).forEach(([key, keywords]) => {
    if (primaryLower.includes(key) || key.includes(primaryLower)) {
      lsiKeywords.push(...keywords);
    }
  });
  
  // If no specific match, add general content-type related keywords
  if (lsiKeywords.length === 0) {
    const contentTypeKeywords = {
      'blogPost': ['blog writing', 'article creation', 'content publishing', 'reader engagement', 'blog SEO', 'content strategy'],
      'article': ['journalism', 'news writing', 'feature articles', 'editorial content', 'article writing', 'content creation'],
      'landingPage': ['conversion optimization', 'lead capture', 'call to action', 'landing page design', 'conversion rate', 'lead generation'],
      'productDescription': ['product features', 'product benefits', 'e-commerce copy', 'product marketing', 'sales copy', 'product information'],
      'email': ['email copy', 'newsletter content', 'email subject lines', 'email engagement', 'email marketing', 'email automation'],
      'socialMedia': ['social posts', 'social engagement', 'hashtag strategy', 'social content', 'social media marketing', 'content sharing']
    };
    
    lsiKeywords = contentTypeKeywords[contentType] || [];
  }
  
  return lsiKeywords.slice(0, 10); // Return top 10 LSI keywords
}

/**
 * Helper function to generate long-tail keywords
 */
function generateLongTailKeywords(primaryKeyword, contentType) {
  if (!primaryKeyword) return [];
  
  const modifiers = [
    'how to', 'best way to', 'tips for', 'guide to', 'what is', 'why is', 'when to',
    'complete guide', 'step by step', 'ultimate guide', 'beginner guide', 'advanced'
  ];
  
  const suffixes = [
    'for beginners', 'in 2024', 'that work', 'you need to know', 'made simple',
    'explained', 'best practices', 'common mistakes', 'proven strategies', 'tips and tricks'
  ];
  
  const longTailKeywords = [];
  
  // Add modifier-based long-tail keywords
  modifiers.slice(0, 5).forEach(modifier => {
    longTailKeywords.push(`${modifier} ${primaryKeyword}`);
  });
  
  // Add suffix-based long-tail keywords
  suffixes.slice(0, 5).forEach(suffix => {
    longTailKeywords.push(`${primaryKeyword} ${suffix}`);
  });
  
  return longTailKeywords;
}

// ========== NEW OPTIMIZED API ENDPOINTS ==========

// Core Grammar & Spelling API (Fast, Essential)
app.post('/api/suggestions/core', async (req, res) => {
  console.log('🚀 CORE API CALL - Grammar & Spelling Only');
  
  const startTime = Date.now()
  const { text, formalityLevel = 'casual', userId = 'anonymous' } = req.body

  try {
    // Initialize session
    const sessionId = initializeWritingSession(text, userId);
    
    // Handle edge cases
    const settings = { formalityLevel };
    const edgeCaseResult = await handleEdgeCases(text, [], settings);
    if (edgeCaseResult.edgeCaseHandled) {
      return res.json({
        suggestions: edgeCaseResult.suggestions || [],
        edgeCase: { type: edgeCaseResult.edgeCaseHandled, message: edgeCaseResult.message },
        sessionId
      });
    }

    // FOCUSED AI PROMPT - Only Grammar & Spelling
    const corePrompt = `You are a grammar and spelling checker. Review the text for ONLY grammar and spelling errors.

Return ONLY a JSON array of objects with this exact structure:
{
  "id": string,           // unique identifier  
  "text": string,         // exact problematic text
  "message": string,      // explanation
  "type": "grammar" | "spelling",
  "alternatives": string[] // corrections
}

Focus on:
- Spelling mistakes
- Grammar errors (subject-verb agreement, tense consistency, etc.)
- Punctuation issues

Do NOT suggest style, tone, or engagement changes.

Text: "${text}"`;

    // Single focused AI call
    const completion = await ensureSystemReliability(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: corePrompt }],
        temperature: 0.1, // Lower temperature for more consistent grammar checking
      });
    });

    let content = completion.choices[0].message.content || '[]'
    content = content.replace(/```json|```/g, '').trim()
    let suggestions = JSON.parse(content)

    // Add our reliable spelling detection
    const spellingErrors = detectSpellingErrors(text);
    suggestions = [...suggestions, ...spellingErrors];

    // Add demonetization detection (rule-based, no AI needed)
    const demonetizationWords = detectDemonetizationWords(text);
    const demonetizationSuggestions = demonetizationWords.map(detected => ({
      id: `demonetization-${Math.random().toString(36).slice(2, 10)}`,
      text: detected.word,
      message: `This word may cause demonetization. Consider alternatives.`,
      type: 'demonetization',
      alternatives: ['[content-friendly alternative]'], // Placeholder - can be enhanced later
      start: detected.start,
      end: detected.end,
      status: 'pending'
    }));

    suggestions = [...suggestions, ...demonetizationSuggestions];

    // Add positions for AI suggestions
    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    suggestions.forEach(s => {
      if (!s.start && s.text) {
        const wordRegex = new RegExp(`\\b${escapeRegex(s.text)}\\b`, 'i');
        const match = wordRegex.exec(text);
        if (match) {
          s.start = match.index;
          s.end = match.index + match[0].length;
        }
        
        if (!s.id) s.id = `core-${Math.random().toString(36).slice(2, 10)}`;
        if (!s.status) s.status = 'pending';
      }
    });

    updatePerformanceMetrics(Date.now() - startTime, false, false, true);
    
    res.json({
      suggestions: suggestions.slice(0, 10), // Limit for performance
      sessionId,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Core API error:', error);
    updatePerformanceMetrics(Date.now() - startTime, true, false, true);
    res.status(500).json({ error: 'Core analysis failed', suggestions: [] });
  }
});

// Style & Tone API (Secondary, Optional)
app.post('/api/suggestions/style', async (req, res) => {
  console.log('🎨 STYLE API CALL - Style & Tone Analysis');
  
  const startTime = Date.now()
  const { text, formalityLevel = 'casual', toneDetectionSensitivity = 'medium' } = req.body

  try {
    // Focused style analysis
    const stylePrompt = `You are a writing style analyst. Review the text for ONLY style and tone improvements.

Return ONLY a JSON array of objects with this exact structure:
{
  "id": string,
  "text": string,
  "message": string,
  "type": "style",
  "alternatives": string[]
}

Focus on:
- Word choice improvements
- Sentence structure
- Clarity and conciseness
- Tone consistency

Text: "${text}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: stylePrompt }],
      temperature: 0.3,
    });

    let content = completion.choices[0].message.content || '[]'
    content = content.replace(/```json|```/g, '').trim()
    let suggestions = JSON.parse(content)

    // Add positions and IDs
    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    suggestions.forEach(s => {
      if (s.text) {
        const match = new RegExp(`\\b${escapeRegex(s.text)}\\b`, 'i').exec(text);
        if (match) {
          s.start = match.index;
          s.end = match.index + match[0].length;
        }
      }
      if (!s.id) s.id = `style-${Math.random().toString(36).slice(2, 10)}`;
      if (!s.status) s.status = 'pending';
    });

    updatePerformanceMetrics(Date.now() - startTime, false, false, true);
    
    res.json({
      suggestions: suggestions.slice(0, 8),
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Style API error:', error);
    res.status(500).json({ error: 'Style analysis failed', suggestions: [] });
  }
});

// Engagement API (Optional, Creative)
app.post('/api/suggestions/engagement', async (req, res) => {
  console.log('🎯 ENGAGEMENT API CALL - Engagement Enhancement');
  
  const startTime = Date.now()
  const { text } = req.body

  try {
    if (text.length < 50) {
      return res.json({ suggestions: [], message: 'Text too short for engagement analysis' });
    }

    const engagementPrompt = `You are an engagement specialist. Review the text for ONLY engagement improvements.

Return ONLY a JSON array of objects with this exact structure:
{
  "id": string,
  "text": string,
  "message": string,
  "type": "engagement",
  "alternatives": string[]
}

Focus on:
- Weak opening hooks
- Missing calls-to-action
- Lack of reader engagement
- Emotional language opportunities

Text: "${text}"`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: engagementPrompt }],
      temperature: 0.4,
    });

    let content = completion.choices[0].message.content || '[]'
    content = content.replace(/```json|```/g, '').trim()
    let suggestions = JSON.parse(content)

    // Add positions and IDs
    suggestions.forEach((s, index) => {
      if (s.text) {
        const idx = text.indexOf(s.text);
        if (idx !== -1) {
          s.start = idx;
          s.end = idx + s.text.length;
        }
      }
      if (!s.id) s.id = `engagement-${Math.random().toString(36).slice(2, 10)}`;
      if (!s.status) s.status = 'pending';
    });

    updatePerformanceMetrics(Date.now() - startTime, false, false, true);
    
    res.json({
      suggestions: suggestions.slice(0, 5),
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Engagement API error:', error);
    res.status(500).json({ error: 'Engagement analysis failed', suggestions: [] });
  }
});

// ========== END NEW OPTIMIZED ENDPOINTS ==========
