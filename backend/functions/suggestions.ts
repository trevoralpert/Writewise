import { OpenAI } from 'openai' // or 'openai-edge' if using edge functions
import type { VercelRequest, VercelResponse } from '@vercel/node'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { text } = req.body

  // Compose a prompt for grammar and style suggestions
  const prompt = `
  Please analyze the following text for grammar, spelling, and style issues.
  Return a JSON array of suggestions, each with:
    - start: character index of the issue
    - end: character index of the issue
    - message: suggestion message
    - type: grammar | spelling | style
    - alternatives: [optional corrections]
  Text: """${text}"""
  `

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  })

  // Parse the LLM's response as JSON
  const suggestions = JSON.parse(completion.choices[0].message.content || '[]')
  res.status(200).json({ suggestions })
}
