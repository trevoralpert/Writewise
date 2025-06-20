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

app.post('/api/suggestions', async (req, res) => {
  const { text } = req.body

  try {
    // Get AI suggestions for grammar, spelling, and style
    const prompt = `You are a writing-assistant that reviews a given passage for grammar, spelling, and stylistic issues.

Your task:
1. Identify up to **10** issues in the provided *input*.
2. For every issue create an object that matches this exact TypeScript shape (no extra keys):

  interface Suggestion {
    id: string           // unique, lowercase, no spaces (e.g. "sugg1")
    text: string         // the exact substring from the input that needs improvement
    message: string      // human-readable explanation of why it should change
    type: "grammar" | "spelling" | "style"
    alternatives: string[] // at least one improved replacement
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

    // Combine AI suggestions with demonetization suggestions
    suggestions = [...suggestions, ...demonetizationSuggestions];

    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Process AI suggestions (add start/end positions)
    suggestions.forEach(s => {
      if (s.type !== 'demonetization' && s.text) {
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

    console.log('Text:', text)
    console.log('Found demonetization words:', demonetizationWords.length)
    suggestions.forEach(s => {
      console.log('Suggestion:', s)
      console.log('Extracted:', text.slice(s.start, s.end))
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
