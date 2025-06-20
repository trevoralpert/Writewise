import React from 'react'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { getDocuments, createDocument, deleteDocument, getDocumentById } from '../../services/documents'
import { supabase } from '../../services/supabaseClient'
import { useEditorStore } from '../../store/editorStore'
import { PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Document as DocxDoc, Packer, Paragraph } from 'docx'

interface DocumentSidebarRef {
  refreshDocuments: () => Promise<void>
}

const DocumentSidebar = forwardRef<DocumentSidebarRef, { onSelect: (doc: any) => void, user: any }>(
  ({ onSelect, user }, ref) => {
    const [documents, setDocuments] = useState<any[]>([])
    const [title, setTitle] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const setCurrentDocument = useEditorStore((s) => s.setCurrentDocument)
    const currentDocument = useEditorStore((s) => s.currentDocument)
    const saveCurrentDocument = useEditorStore((s) => s.saveCurrentDocument)
    const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges)

    const fetchDocuments = async () => {
      if (user) {
        const { data } = await getDocuments(user.id)
        setDocuments(data || [])
      }
    }

    useEffect(() => {
      fetchDocuments()
    }, [user])

    // Expose refresh function to parent components
    useImperativeHandle(ref, () => ({
      refreshDocuments: fetchDocuments
    }))

    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim()) return
      
      setIsLoading(true)
      
      // Save current document before creating new one
      if (hasUnsavedChanges) {
        await saveCurrentDocument()
      }
      
      const { data } = await createDocument(user.id, title, '')
      if (data) {
        setDocuments([data, ...documents])
        setTitle('')
        onSelect(data)
      }
      setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
      if (isLoading) return
      
      setIsLoading(true)
      await deleteDocument(id)
      setDocuments(docs => docs.filter(doc => doc.id !== id))
      if (currentDocument?.id === id) {
        setCurrentDocument(null)
      }
      setIsLoading(false)
    }

    const handleRename = async (id: string) => {
      if (!editTitle.trim() || isLoading) return
      
      setIsLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .update({ title: editTitle })
        .eq('id', id)
        .select()
        .single()
      if (!error && data) {
        setDocuments(docs => docs.map(doc => doc.id === id ? { ...doc, title: data.title } : doc))
        setEditingId(null)
      }
      setIsLoading(false)
    }

    const handleExport = async (id: string, title: string) => {
      if (isLoading) return
      
      setIsLoading(true)
      const { data } = await getDocumentById(id)
      if (!data) {
        setIsLoading(false)
        return
      }
      // Create a simple docx with the content as a single paragraph
      const doc = new DocxDoc({
        sections: [
          {
            properties: {},
            children: [new Paragraph(data.content || '')],
          },
        ],
      })

      const buffer = await Packer.toBlob(doc)
      const url = URL.createObjectURL(buffer)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title || 'document'}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setIsLoading(false)
    }

    const handleDocumentSelect = async (docId: string) => {
      if (isLoading || docId === currentDocument?.id) return
      
      setIsLoading(true)
      
      try {
        // First, save the current document if it has unsaved changes
        if (hasUnsavedChanges) {
          const saved = await saveCurrentDocument()
          if (!saved) {
            // If save failed, ask user if they want to continue
            const proceed = window.confirm(
              'Failed to save current document. Do you want to continue anyway? Unsaved changes will be lost.'
            )
            if (!proceed) {
              setIsLoading(false)
              return
            }
          }
        }
        
        // Then load the new document
        const { data } = await getDocumentById(docId)
        if (data) {
          onSelect(data)
        }
      } catch (error) {
        console.error('Error switching documents:', error)
      }
      
      setIsLoading(false)
    }

    return (
      <aside className="w-64 bg-white border-r p-4">
        <form onSubmit={handleCreate} className="mb-4 flex">
          <input
            className="input flex-1"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="New document title"
            disabled={isLoading}
          />
          <button className="btn ml-2" type="submit" disabled={isLoading}>
            {isLoading ? '...' : '+'}
          </button>
        </form>
        
        {isLoading && (
          <div className="text-center text-sm text-gray-500 mb-2">
            Loading...
          </div>
        )}
        
        <ul>
          {documents.map(doc => (
            <li key={doc.id} className="flex items-center mb-2">
              {editingId === doc.id ? (
                <>
                  <input
                    className="input flex-1"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(doc.id)
                      } else if (e.key === 'Escape') {
                        setEditingId(null)
                      }
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                  <button 
                    className="btn ml-1" 
                    onClick={() => handleRename(doc.id)}
                    disabled={isLoading}
                  >
                    Save
                  </button>
                  <button 
                    className="btn ml-1" 
                    onClick={() => setEditingId(null)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`text-left w-full py-1 px-2 rounded transition-colors ${
                      currentDocument?.id === doc.id 
                        ? 'font-bold bg-blue-100 text-blue-800' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleDocumentSelect(doc.id)}
                    disabled={isLoading}
                  >
                    {doc.title}
                    {currentDocument?.id === doc.id && hasUnsavedChanges && (
                      <span className="ml-1 text-orange-600">•</span>
                    )}
                  </button>
                  <button 
                    className="btn btn-circle btn-ghost btn-xs" 
                    onClick={() => {
                      setEditTitle(doc.title)
                      setEditingId(doc.id)
                    }}
                    disabled={isLoading}
                    title="Rename"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    className="btn btn-circle btn-ghost btn-xs" 
                    onClick={() => handleExport(doc.id, doc.title)} 
                    disabled={isLoading}
                    title="Export"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                  </button>
                  <button 
                    className="ml-2 text-red-500 hover:text-red-700 disabled:text-red-300" 
                    onClick={() => handleDelete(doc.id)}
                    disabled={isLoading}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </aside>
    )
  }
)

DocumentSidebar.displayName = 'DocumentSidebar'

export default DocumentSidebar
export type { DocumentSidebarRef }
