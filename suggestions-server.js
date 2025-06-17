import express from 'express'
import cors from 'cors'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post('/api/suggestions', async (req, res) => {
  const { text } = req.body

  // Compose a prompt for grammar and style suggestions
  const prompt = `
Please analyze the following text for grammar, spelling, and style issues.
Return a JSON array of suggestions, each with:
  - id: unique string
  - text: the exact text in the input that should be replaced (copy it verbatim from the input)
  - message: suggestion message
  - type: grammar | spelling | style
  - alternatives: [array of suggested corrections, always include at least one if possible]
Do not include indices; the backend will compute them by searching for the text.
Text: """${text}"""
  `

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    })

    // Remove code fences if present
    let content = completion.choices[0].message.content || '[]'
    content = content.replace(/```json|```/g, '').trim()
    let suggestions = JSON.parse(content)

    // Compute start/end by searching for s.text in the input
    suggestions.forEach(s => {
      if (s.text) {
        const idx = text.indexOf(s.text);
        if (idx !== -1) {
          s.start = idx;
          s.end = idx + s.text.length;
        } else {
          console.warn(`Suggestion text not found in input: ${s.text}`);
        }
      }
    });

    console.log('Text:', text)
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

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Suggestions API listening on port ${PORT}`)
})
