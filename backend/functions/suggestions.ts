// @ts-ignore
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { OpenAI } from 'openai' // or 'openai-edge' if using edge functions

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { text } = req.body

  // Build a strict prompt that instructs the model to ONLY return raw JSON (no markdown fences)
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

  // Parse the LLM's response as JSON
  const suggestions = JSON.parse(completion.choices[0].message.content || '[]')

  // Compute start & end indices for each suggestion based on the returned text snippet
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')

  suggestions.forEach((s: any) => {
    if (s.text) {
      const wordRegex = new RegExp(`\\b${escapeRegex(s.text)}\\b`, 'i')
      const match = wordRegex.exec(text)
      if (match) {
        s.start = match.index
        s.end = match.index + match[0].length
      } else {
        const idx = text.indexOf(s.text)
        if (idx !== -1) {
          s.start = idx
          s.end = idx + s.text.length
        }
      }
    }
    if (!s.id) {
      s.id = `sugg-${Math.random().toString(36).slice(2, 10)}`
    }
    if (!s.status) {
      s.status = 'pending'
    }
  })

  res.status(200).json({ suggestions })
}
