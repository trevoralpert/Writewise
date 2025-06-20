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
  const basePriorities = {
    'demonetization': 9,
    'tone-rewrite': 8,
    'spelling': 7,
    'grammar': 6,
    'style': 4,
    'slang-protected': 2
  };
  
  let priority = basePriorities[suggestion.type] || 5;
  
  // Adjust based on conflict resolution mode
  switch (conflictResolutionMode) {
    case 'grammar-first':
      if (['grammar', 'spelling'].includes(suggestion.type)) priority += 3;
      if (suggestion.type === 'style') priority += 1;
      break;
    case 'tone-first':
      if (suggestion.type === 'tone-rewrite') priority += 3;
      if (suggestion.type === 'slang-protected') priority += 2;
      break;
    case 'balanced':
      // Slight boost for tone-preserving approaches
      if (suggestion.type === 'tone-rewrite') priority += 1;
      break;
    case 'user-choice':
      priority = 5; // Equal priority, let user decide
      break;
  }
  
  // Factor in tone analysis confidence
  if (toneAnalysis.confidence > 0.8) {
    if (suggestion.type === 'tone-rewrite') priority += 1;
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

app.post('/api/suggestions', async (req, res) => {
  const { 
    text, 
    formalityLevel = 'balanced',
    tonePreservingEnabled = true,
    conflictResolutionMode = 'balanced',
    toneDetectionSensitivity = 'medium'
  } = req.body

  try {
    console.log('🎯 Tone-preserving settings:', { tonePreservingEnabled, conflictResolutionMode, toneDetectionSensitivity });
    
    // Get AI suggestions for grammar, spelling, and style
    const prompt = `You are a writing-assistant that reviews a given passage for grammar, spelling, and stylistic issues.

Your task:
1. Identify up to **10** issues in the provided *input*.
2. For every issue create an object that matches this exact TypeScript shape (no extra keys):

  interface Suggestion {
    id: string           // unique, lowercase, no spaces (e.g. "sugg1")
    text: string         // the exact substring from the input that needs improvement
    message: string      // human-readable explanation of why it should change
    type: "grammar" | "spelling" | "style" | "tone-rewrite"
    alternatives: string[] // at least one improved replacement
    priority?: number    // 1-10 scale for conflict resolution
    originalTone?: string // detected tone (casual, formal, creative, etc.)
  }

3. Return ONLY a JSON array of Suggestion – **do NOT** add markdown, comments, or any other wrapper.

Example response:
[
  {"id":"sugg1","text":"teh","message":"Spelling mistake","type":"spelling","alternatives":["the"]}
]

Input:
"""${text}"""`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    })

    // Remove code fences if present
    let content = completion.choices[0].message.content || '[]'
    content = content.replace(/```json|```/g, '').trim()
    let suggestions = JSON.parse(content)

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
    
    // Create slang-protected suggestions to show users what's being protected
    const slangProtectedSuggestions = slangWords.map((detected, index) => {
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
    suggestions = [...suggestions, ...demonetizationSuggestions, ...slangProtectedSuggestions];

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

    // ========== PHASE 2: TONE-PRESERVING INTEGRATION ==========
    if (tonePreservingEnabled && suggestions.length > 0) {
      console.log('🎨 Starting tone-preserving analysis...');
      
      // Phase 2B: Analyze tone and style of the full text
      const toneAnalysis = await analyzeToneAndStyle(text, toneDetectionSensitivity);
      console.log('🎯 Tone analysis result:', toneAnalysis);
      
      // Phase 2D: Detect and resolve conflicts with tone-preserving rewrites
      suggestions = await detectAndResolveConflicts(suggestions, text, conflictResolutionMode, toneAnalysis);
      console.log('🔄 Suggestions after conflict resolution:', suggestions.length);
    }
    // ========== END PHASE 2 INTEGRATION ==========

    console.log('Text:', text)
    console.log('Found demonetization words:', demonetizationWords.length)
    console.log('Final suggestions count:', suggestions.length)
    suggestions.forEach(s => {
      console.log('Suggestion:', s)
      console.log('Extracted:', text.slice(s.start, s.end))
      if (s.type === 'tone-rewrite') {
        console.log('🎨 Tone rewrite:', s.toneRewrite)
      }
    })

    res.json({ suggestions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ suggestions: [] })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Suggestions API listening on port ${PORT}`)
})
