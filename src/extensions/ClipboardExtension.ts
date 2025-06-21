import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { useEditorStore } from '../store/editorStore'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    clipboard: {
      /**
       * Copy selected text to clipboard
       */
      copy: () => ReturnType
      /**
       * Cut selected text to clipboard
       */
      cut: () => ReturnType
      /**
       * Paste text from clipboard (with suggestion preservation)
       */
      paste: () => ReturnType
      /**
       * Select all text
       */
      selectAll: () => ReturnType
    }
  }
}

// Helper functions outside the extension
const recalculateSuggestionPositions = (removedText: string, fromPos: number, toPos: number) => {
  const editorStore = useEditorStore.getState()
  const suggestions = editorStore.suggestions
  const removedLength = toPos - fromPos

  console.log(`🔄 Recalculating suggestion positions after cut/delete: removed "${removedText}" from ${fromPos}-${toPos}`)

  const updatedSuggestions = suggestions.map(suggestion => {
    if (suggestion.status !== 'pending') return suggestion

    // If suggestion is entirely within the removed range, mark it as invalidated
    if (suggestion.start >= fromPos && suggestion.end <= toPos) {
      console.log(`❌ Invalidating suggestion "${suggestion.text}" (was entirely within removed range)`)
      return { ...suggestion, status: 'invalidated' as const }
    }

    // If suggestion starts before removal but ends within it, truncate it
    if (suggestion.start < fromPos && suggestion.end > fromPos && suggestion.end <= toPos) {
      console.log(`✂️ Truncating suggestion "${suggestion.text}" (end was within removed range)`)
      return {
        ...suggestion,
        end: fromPos,
        text: suggestion.text?.substring(0, fromPos - suggestion.start)
      }
    }

    // If suggestion starts within removal but ends after it, adjust start and truncate
    if (suggestion.start >= fromPos && suggestion.start < toPos && suggestion.end > toPos) {
      const newStart = fromPos
      const newText = suggestion.text?.substring(suggestion.start - fromPos)
      console.log(`✂️ Adjusting suggestion "${suggestion.text}" (start was within removed range)`)
      return {
        ...suggestion,
        start: newStart,
        text: newText
      }
    }

    // If suggestion spans across the entire removal, it's complex - mark as invalidated for safety
    if (suggestion.start < fromPos && suggestion.end > toPos) {
      console.log(`❌ Invalidating spanning suggestion "${suggestion.text}" (spanned across removal)`)
      return { ...suggestion, status: 'invalidated' as const }
    }

    // If suggestion is entirely after the removal, shift it left
    if (suggestion.start >= toPos) {
      console.log(`⬅️ Shifting suggestion "${suggestion.text}" left by ${removedLength} positions`)
      return {
        ...suggestion,
        start: suggestion.start - removedLength,
        end: suggestion.end - removedLength
      }
    }

    // If suggestion is entirely before the removal, no change needed
    return suggestion
  }).filter(suggestion => suggestion.status !== 'invalidated')

  // Update the store with recalculated suggestions
  editorStore.setAllSuggestionsAndFilter(updatedSuggestions)
  console.log(`✅ Suggestion recalculation complete: ${updatedSuggestions.length} suggestions remaining`)
}

const handlePostPaste = () => {
  console.log('📥 Post-paste processing: requesting fresh suggestions for updated content')
  
  // After paste, request fresh suggestions for the entire document
  setTimeout(() => {
    const editorStore = useEditorStore.getState()
    if (editorStore.content && editorStore.content.trim().length > 0) {
      // Clear existing suggestions first to avoid conflicts
      editorStore.setAllSuggestionsAndFilter([])
      
      // Request fresh suggestions after a short delay
      setTimeout(() => {
        // Trigger suggestion refresh from the component level
        const event = new CustomEvent('clipboard-paste-complete', {
          detail: { content: editorStore.content }
        })
        window.dispatchEvent(event)
      }, 200)
    }
  }, 100)
}

export const ClipboardExtension = Extension.create({
  name: 'clipboard',

  addCommands() {
    return {
      copy: () => () => {
        try {
          document.execCommand('copy')
          console.log('📋 Text copied to clipboard')
          return true
        } catch (error) {
          console.warn('Failed to copy text:', error)
          return false
        }
      },

      cut: () => ({ editor }) => {
        try {
          // Store the current selection for suggestion recalculation
          const { from, to } = editor.state.selection
          const selectedText = editor.state.doc.textBetween(from, to)
          
          // Execute the cut command
          document.execCommand('cut')
          
          // After cutting, we need to recalculate suggestion positions
          setTimeout(() => {
            recalculateSuggestionPositions(selectedText, from, to)
          }, 100)
          
          console.log('✂️ Text cut to clipboard')
          return true
        } catch (error) {
          console.warn('Failed to cut text:', error)
          return false
        }
      },

      paste: () => () => {
        // Let the default paste behavior handle the actual pasting
        // We'll handle suggestion recalculation in the paste event handler
        return false // Return false to allow default paste behavior
      },

      selectAll: () => ({ commands }) => {
        return commands.selectAll()
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-c': () => this.editor.commands.copy(),
      'Mod-x': () => this.editor.commands.cut(),
      'Mod-v': () => {
        // Let default paste happen, then handle post-paste processing
        setTimeout(handlePostPaste, 100)
        return false
      },
      'Mod-a': () => this.editor.commands.selectAll(),
    }
  },

  addProseMirrorPlugins() {
    return [
      // Plugin to handle paste events and suggestion recalculation
      new Plugin({
        key: new PluginKey('clipboard-handler'),
        props: {
          handlePaste: (view: any, event: any, slice: any) => {
            // Let the default paste happen first
            setTimeout(handlePostPaste, 100)
            return false // Allow default paste behavior
          },
        },
      }),
    ]
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'text'],
        attributes: {
          'data-clipboard-processed': {
            default: null,
          },
        },
      },
    ]
  },
}) 