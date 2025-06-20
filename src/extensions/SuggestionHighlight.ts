import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export interface SuggestionHighlightOptions {
  getSuggestions: () => { id: string; start: number; end: number; message: string; status: string; type: string }[]
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
            if (!suggestions || suggestions.length === 0) return null

            const decos: Decoration[] = []
            const { doc } = state

            // Simple and direct approach: build a character-to-position map
            const buildPositionMap = () => {
              const positionMap: number[] = []
              let textIndex = 0
              
              doc.descendants((node, nodePos) => {
                if (node.isText) {
                  const text = node.text || ''
                  for (let i = 0; i < text.length; i++) {
                    positionMap[textIndex] = nodePos + i
                    textIndex++
                  }
                }
                return true
              })
              
              // Add final position for end of text
              positionMap[textIndex] = doc.content.size - 1
              
              return positionMap
            }

            const positionMap = buildPositionMap()

            suggestions.forEach((s) => {
              if (s.status !== 'pending') return
              
              // Map plain text indices to ProseMirror positions
              const from = positionMap[s.start] || 0
              const to = positionMap[s.end - 1] ? positionMap[s.end - 1] + 1 : positionMap[s.start] + 1
              
              if (from < to && from >= 0 && to <= doc.content.size) {
                let className = 'suggestion-underline'
                if (s.type === 'style') {
                  className = 'suggestion-underline-style'
                } else if (s.type === 'demonetization') {
                  className = 'suggestion-underline-demonetization'
                } else if (s.type === 'slang-protected') {
                  className = 'suggestion-underline-slang-protected'
                } else if (s.type === 'tone-rewrite') {
                  className = 'suggestion-underline-tone-rewrite'
                }
                
                decos.push(
                  Decoration.inline(from, to, {
                    class: className,
                    'data-suggestion-id': s.id,
                    'data-from': String(from),
                    'data-to': String(to),
                    title: s.message,
                  })
                )
              }
            })

            return DecorationSet.create(doc, decos)
          },
        },
      }),
    ]
  },
}) 