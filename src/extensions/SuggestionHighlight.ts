import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export interface SuggestionHighlightOptions {
  getSuggestions: () => { id: string; start: number; end: number; message: string; status: string; type: string; text?: string; priority?: number }[]
}

// Helper interface for grouped suggestions
interface SuggestionGroup {
  start: number;
  end: number;
  suggestions: { id: string; start: number; end: number; message: string; status: string; type: string; text?: string; priority?: number }[];
  combinedClasses: string[];
  combinedMessages: string[];
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

            // Smart suggestion filtering and validation
            const filterAndValidateSuggestions = (inputSuggestions: any[]) => {
              const criticalTypes = ['spelling', 'grammar', 'demonetization']
              const broadTypes = ['style', 'engagement', 'platform-adaptation']
              
              // Separate critical and broad suggestions
              const criticalSuggestions = inputSuggestions.filter((s: any) => criticalTypes.includes(s.type))
              const broadSuggestions = inputSuggestions.filter((s: any) => broadTypes.includes(s.type))
              
              // Filter out overly broad suggestions that would override critical ones
              const filteredBroadSuggestions = broadSuggestions.filter((broadSugg: any) => {
                const broadLength = broadSugg.end - broadSugg.start
                
                // Reject suggestions that span more than 50% of the total text
                if (broadLength > totalTextLength * 0.5) {
                  console.log(`🚫 Rejecting overly broad ${broadSugg.type} suggestion spanning ${broadLength} characters (${Math.round(broadLength/totalTextLength*100)}% of text)`)
                  return false
                }
                
                // Check if this broad suggestion would override any critical suggestions
                const wouldOverrideCritical = criticalSuggestions.some((critSugg: any) => {
                  // Check for overlap
                  return broadSugg.start < critSugg.end && broadSugg.end > critSugg.start
                })
                
                if (wouldOverrideCritical && broadLength > 20) {
                  console.log(`🚫 Rejecting ${broadSugg.type} suggestion that would override critical suggestions (length: ${broadLength})`)
                  return false
                }
                
                return true
              })
              
              // Combine filtered suggestions
              return [...criticalSuggestions, ...filteredBroadSuggestions, ...inputSuggestions.filter((s: any) => !criticalTypes.includes(s.type) && !broadTypes.includes(s.type))]
            }

            // Process and validate suggestions
            const validSuggestions = filterAndValidateSuggestions(suggestions)
              .filter(suggestion => suggestion.status === 'pending')
              .map(suggestion => {
                // Validate suggestion bounds against plain text
                if (suggestion.start < 0 || suggestion.end < 0 || 
                    suggestion.start >= suggestion.end || 
                    suggestion.start >= totalTextLength || 
                    suggestion.end > totalTextLength) {
                  return null
                }

                // If we have expected text, ensure the positions are correct
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
                      return null
                    }
                  }
                }
                
                // Extract the definitive text for the highlight
                const actualText = plainText.slice(suggestion.start, suggestion.end)
                if (!actualText) return null

                return { ...suggestion, actualText }
              })
              .filter(Boolean) as (typeof suggestions[0] & { actualText: string })[]

            // Create individual decorations for each suggestion (no grouping)
            // This allows natural layering of highlights and underlines
            const createIndividualSuggestions = (suggestions: typeof validSuggestions) => {
              return suggestions.map(suggestion => ({
                start: suggestion.start,
                end: suggestion.end,
                suggestion: suggestion,
                className: getSuggestionClassName(suggestion.type),
                message: `${suggestion.type.toUpperCase()}: ${suggestion.message}`
              }))
            }

            // Helper function to get CSS class for suggestion type
            const getSuggestionClassName = (type: string): string => {
              switch (type) {
                case 'grammar':
                  return 'suggestion-multi-grammar'
                case 'spelling':
                  return 'suggestion-multi-spelling'
                case 'style':
                  return 'suggestion-multi-style'
                case 'demonetization':
                  return 'suggestion-multi-demonetization'
                case 'slang-protected':
                  return 'suggestion-multi-slang-protected'
                case 'tone-rewrite':
                  return 'suggestion-multi-tone-rewrite'
                case 'engagement':
                  return 'suggestion-multi-engagement'
                case 'platform-adaptation':
                  return 'suggestion-multi-platform-adaptation'
                case 'seo':
                  return 'suggestion-multi-seo'
                case 'style-consistency':
                  return 'suggestion-multi-style-consistency'
                default:
                  return 'suggestion-multi-default'
              }
            }

            // Create individual decorations for each suggestion
            const individualSuggestions = createIndividualSuggestions(validSuggestions)

            // Create decorations for each individual suggestion
            individualSuggestions.forEach((item) => {
              // Map text positions to ProseMirror positions
              const fromPos = textToProseMirrorPos[item.start]
              
              let toPos: number
              if (item.end >= totalTextLength) {
                toPos = textToProseMirrorPos[totalTextLength - 1] + 1
              } else {
                toPos = textToProseMirrorPos[item.end]
              }
              
              if (fromPos === undefined || toPos === undefined) {
                return
              }

              const from = fromPos
              const to = toPos
              
              // Final validation
              if (from < 1 || to < 1 || from >= to || to > doc.content.size + 1) {
                return
              }

              const finalTo = Math.min(to, doc.content.size)
              if (from >= finalTo) {
                return
              }

              // Create individual class string
              const className = ['suggestion-multi-base', item.className].join(' ')
              
              try {
                decos.push(
                  Decoration.inline(from, finalTo, {
                    class: className,
                    'data-suggestion-id': item.suggestion.id,
                    'data-suggestion-type': item.suggestion.type,
                    'data-from': String(from),
                    'data-to': String(finalTo),
                    'data-text-start': String(item.start),
                    'data-text-end': String(item.end),
                    'data-actual-text': plainText.slice(item.start, item.end),
                    title: item.message,
                  })
                )
              } catch (error) {
                console.warn(`Failed to create individual decoration:`, error)
              }
            })

            return DecorationSet.create(doc, decos)
          },
        },
      }),
    ]
  },
}) 