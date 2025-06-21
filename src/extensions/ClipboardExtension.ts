import { Extension } from '@tiptap/core'

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

export const ClipboardExtension = Extension.create({
  name: 'clipboard',

  addCommands() {
    return {
      copy: () => () => {
        try {
          document.execCommand('copy')
          console.log('📋 Text copied')
          return true
        } catch (error) {
          console.warn('Copy failed:', error)
          return false
        }
      },

      cut: () => () => {
        try {
          document.execCommand('cut')
          console.log('✂️ Text cut')
          return true
        } catch (error) {
          console.warn('Cut failed:', error)
          return false
        }
      },

      paste: () => () => {
        console.log('📥 Paste detected - will request fresh suggestions')
        
        // Dispatch custom event after a short delay to let paste complete
        setTimeout(() => {
          const event = new CustomEvent('clipboard-paste-complete', {
            detail: { timestamp: Date.now() }
          })
          window.dispatchEvent(event)
        }, 100)
        
        return false // Allow default paste behavior
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
      'Mod-v': () => this.editor.commands.paste(),
      'Mod-a': () => this.editor.commands.selectAll(),
    }
  },
}) 