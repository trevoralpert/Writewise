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
  - start: character index of the issue
  - end: character index of the issue
  - message: suggestion message
  - type: grammar | spelling | style
  - alternatives: [optional corrections]
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
    const suggestions = JSON.parse(content)
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
