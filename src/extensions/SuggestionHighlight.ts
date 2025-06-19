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

            // helper to convert plain-text index to prosemirror pos
            const mapIndexToPos = (idx: number) => {
              let pos = 0 // current PM position (starts at 0 which is before first char)
              let plainCount = 0
              let result = 0

              doc.descendants((node, nodePos) => {
                if (result) return false // already found
                if (node.isText) {
                  const text = node.text || ''
                  const nextPlain = plainCount + text.length
                  if (idx >= plainCount && idx < nextPlain) {
                    result = nodePos + (idx - plainCount)
                    return false
                  }
                  plainCount = nextPlain
                }
                return true
              })
              // fallback to end of doc if not found (should not happen)
              return result || doc.content.size
            }

            suggestions.forEach((s) => {
              if (s.status !== 'pending') return
              const from = mapIndexToPos(s.start)
              const to = mapIndexToPos(s.end)
              if (from < to) {
                const className = s.type === 'style' ? 'suggestion-underline-style' : 'suggestion-underline'
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