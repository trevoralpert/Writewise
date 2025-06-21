import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export interface SuggestionHighlightOptions {
  getSuggestions: () => { id: string; start: number; end: number; message: string; status: string; type: string; text?: string }[]
}

export const SuggestionHighlight = Extension.create<SuggestionHighlightOptions>({
  name: 'suggestionHighlight',

  addOptions() {
    return {
      getSuggestions: () => [],
    }
  },

  addProseMirrorPlugins() {
    const key = new PluginKey('suggestionHighlight')

    return [
      new Plugin({
        key,
        props: {
          decorations: (state) => {
            const suggestions = this.options.getSuggestions()
            if (!suggestions || suggestions.length === 0) return DecorationSet.empty

            const decos: Decoration[] = []
            const { doc } = state

            // Get the complete plain text to validate against
            const plainText = doc.textContent
            
            // Build a comprehensive position mapping
            const buildPositionMap = () => {
              const textToProseMirrorPos: number[] = []
              let textIndex = 0
              
              // Walk through the document and map each character position
              doc.descendants((node, nodePos) => {
                if (node.isText && node.text) {
                  const text = node.text
                  for (let i = 0; i < text.length; i++) {
                    // ProseMirror positions: nodePos is the position before the node
                    // Text content starts at nodePos + 1, so character i is at nodePos + 1 + i
                    textToProseMirrorPos[textIndex] = nodePos + 1 + i
                    textIndex++
                  }
                }
                return true
              })
              
              return { textToProseMirrorPos, totalTextLength: textIndex }
            }

            const { textToProseMirrorPos, totalTextLength } = buildPositionMap()

            // Document analysis available for debugging if needed
            // console.log(`📋 Document analysis:`, { proseMirrorDocSize: doc.content.size, plainTextLength: plainText.length, totalMappedLength: totalTextLength })

            suggestions.forEach((suggestion) => {
              // Only process pending suggestions
              if (suggestion.status !== 'pending') return
              
              // Validate suggestion bounds against plain text
              if (suggestion.start < 0 || suggestion.end < 0 || 
                  suggestion.start >= suggestion.end || 
                  suggestion.start >= totalTextLength || 
                  suggestion.end > totalTextLength) {
                return
              }

              // --- REFACTORED LOGIC ---
              // 1. If we have expected text, ensure the positions are correct before doing anything else.
              if (suggestion.text) {
                const currentSlice = plainText.slice(suggestion.start, suggestion.end)
                if (suggestion.text !== currentSlice) {
                  // The API's positions are wrong. Find the real ones.
                  const exactIndex = plainText.indexOf(suggestion.text)
                  
                  if (exactIndex !== -1) {
                    // We found the text. Update the suggestion with the correct positions.
                    suggestion.start = exactIndex
                    suggestion.end = exactIndex + suggestion.text.length
                  } else {
                    // If we can't find the exact text in the document, we can't highlight it.
                    console.warn(`Could not find suggestion text "${suggestion.text}" in the document. Skipping.`)
                    return
                  }
                }
              }
              
              // 2. Now that the positions are guaranteed to be correct, extract the definitive text for the highlight.
              const actualText = plainText.slice(suggestion.start, suggestion.end)

              // 3. Final validation before creating the decoration.
              if (!actualText) {
                return
              }

              // 4. Map the final, correct text positions to ProseMirror positions.
              const fromPos = textToProseMirrorPos[suggestion.start]
              
              // For the end position, we need to be more careful
              // suggestion.end is exclusive in text positions, so we want the position that comes after suggestion.end-1
              let toPos: number
              if (suggestion.end >= totalTextLength) {
                // If we're at the end of the text, use the last position + 1
                toPos = textToProseMirrorPos[totalTextLength - 1] + 1
              } else {
                // Normal case: use the position at suggestion.end (which is the position after the last character we want to highlight)
                toPos = textToProseMirrorPos[suggestion.end]
              }
              
              if (fromPos === undefined || toPos === undefined) {
                return
              }

              // ProseMirror positions: from is inclusive, to is exclusive
              const from = fromPos
              const to = toPos
              
              // Final validation with more lenient bounds checking
              if (from < 1 || to < 1 || from >= to || to > doc.content.size + 1) {
                return
              }

              // Ensure the to position doesn't exceed document bounds
              const finalTo = Math.min(to, doc.content.size)
              if (from >= finalTo) {
                return
              }

              // Determine CSS class based on suggestion type
              let className = 'suggestion-underline'
              switch (suggestion.type) {
                case 'grammar':
                case 'spelling':
                  className = 'suggestion-underline-grammar'
                  break
                case 'style':
                  className = 'suggestion-underline-style'
                  break
                case 'demonetization':
                  className = 'suggestion-underline-demonetization'
                  break
                case 'slang-protected':
                  className = 'suggestion-underline-slang-protected'
                  break
                case 'tone-rewrite':
                  className = 'suggestion-underline-tone-rewrite'
                  break
                case 'engagement':
                  className = 'suggestion-underline-engagement'
                  break
                case 'platform-adaptation':
                  className = 'suggestion-underline-platform-adaptation'
                  break
                case 'seo':
                  className = 'suggestion-underline-seo'
                  break
                case 'style-consistency':
                  className = 'suggestion-underline-style'
                  break
                default:
                  className = 'suggestion-underline'
              }
              
              try {
                decos.push(
                  Decoration.inline(from, finalTo, {
                    class: className,
                    'data-suggestion-id': suggestion.id,
                    'data-suggestion-type': suggestion.type,
                    'data-from': String(from),
                    'data-to': String(finalTo),
                    'data-text-start': String(suggestion.start),
                    'data-text-end': String(suggestion.end),
                    'data-actual-text': actualText,
                    title: suggestion.message,
                  })
                )
              } catch (error) {
                console.warn(`Failed to create decoration for suggestion ${suggestion.id}:`, error)
              }
            })

            return DecorationSet.create(doc, decos)
          },
        },
      }),
    ]
  },
}) 