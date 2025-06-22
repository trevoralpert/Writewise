import React from 'react'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { getDocuments, createDocument, deleteDocument, getDocumentById, getSharedDocuments } from '../../services/documents'
import { supabase } from '../../services/supabaseClient'
import { useEditorStore } from '../../store/editorStore'
import { PencilIcon, ArrowDownTrayIcon, ShareIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Document as DocxDoc, Packer, Paragraph } from 'docx'
import DocumentSharingModal from './DocumentSharingModal'
import DocumentHistoryModal from './DocumentHistoryModal'

interface DocumentSidebarRef {
  refreshDocuments: () => Promise<void>
}

const DocumentSidebar = forwardRef<DocumentSidebarRef, { onSelect: (doc: any) => void, user: any }>(
  ({ onSelect, user }, ref) => {
    const [documents, setDocuments] = useState<any[]>([])
    const [sharedDocuments, setSharedDocuments] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'my-docs' | 'shared'>('my-docs')
    const [title, setTitle] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sharingDocId, setSharingDocId] = useState<string | null>(null)
    const [historyDocId, setHistoryDocId] = useState<string | null>(null)
    const setCurrentDocument = useEditorStore((s) => s.setCurrentDocument)
    const currentDocument = useEditorStore((s) => s.currentDocument)
    const saveCurrentDocument = useEditorStore((s) => s.saveCurrentDocument)
    const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges)

    const fetchDocuments = async () => {
      if (user) {
        const [myDocs, sharedDocs] = await Promise.all([
          getDocuments(user.id),
          getSharedDocuments(user.email)
        ])
        setDocuments(myDocs.data || [])
        setSharedDocuments(sharedDocs.data || [])
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
      try {
        const { data, error } = await supabase
          .from('documents')
          .update({ title: editTitle.trim() })
          .eq('id', id)
          .select()
          .single()
        
        if (!error && data) {
          setDocuments(docs => docs.map(doc => doc.id === id ? { ...doc, title: data.title } : doc))
          
          // Update current document title if it's the one being renamed
          if (currentDocument?.id === id) {
            setCurrentDocument({ ...currentDocument, title: data.title })
          }
          
          setEditingId(null)
          setEditTitle('')
        } else {
          console.error('Failed to rename document:', error)
          alert('Failed to rename document. Please try again.')
        }
      } catch (error) {
        console.error('Failed to rename document:', error)
        alert('Failed to rename document. Please try again.')
      }
      setIsLoading(false)
    }

    const handleCancelEdit = () => {
      setEditingId(null)
      setEditTitle('')
    }

    const handleBlurEdit = async (id: string, originalTitle: string) => {
      // If the title hasn't changed, just cancel
      if (editTitle.trim() === originalTitle || !editTitle.trim()) {
        handleCancelEdit()
        return
      }
      
      // Auto-save if the title has changed
      await handleRename(id)
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

    const handleSharedDocumentSelect = async (sharedDoc: any) => {
      if (isLoading) return
      
      setIsLoading(true)
      
      try {
        // Save current document if it has unsaved changes
        if (hasUnsavedChanges) {
          const saved = await saveCurrentDocument()
          if (!saved) {
            const proceed = window.confirm(
              'Failed to save current document. Do you want to continue anyway? Unsaved changes will be lost.'
            )
            if (!proceed) {
              setIsLoading(false)
              return
            }
          }
        }
        
        // Load the shared document
        onSelect(sharedDoc.documents)
      } catch (error) {
        console.error('Error switching to shared document:', error)
      }
      
      setIsLoading(false)
    }

    const handleDocumentRestore = async () => {
      // Refresh the current document after restore
      if (currentDocument?.id) {
        const { data } = await getDocumentById(currentDocument.id)
        if (data) {
          onSelect(data)
        }
      }
      await fetchDocuments()
    }

    return (
      <aside className="w-64 bg-white border-r p-4">
        {/* Tab Navigation */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'my-docs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('my-docs')}
          >
            My Documents
          </button>
          <button
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'shared'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('shared')}
          >
            Shared ({sharedDocuments.length})
          </button>
        </div>

        {/* Create new document form - only show on my-docs tab */}
        {activeTab === 'my-docs' && (
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
        )}
        
        {isLoading && (
          <div className="text-center text-sm text-gray-500 mb-2">
            Loading...
          </div>
        )}
        
        {/* Document Lists */}
        <ul>
          {activeTab === 'my-docs' ? (
            // My Documents
            documents.map(doc => (
              <li key={doc.id} className="flex items-center mb-2">
                {editingId === doc.id ? (
                  <>
                    <input
                      className="input flex-1"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => handleBlurEdit(doc.id, doc.title)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleRename(doc.id)
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          handleCancelEdit()
                        }
                      }}
                      disabled={isLoading}
                      autoFocus
                      placeholder="Enter document title"
                    />
                    <button 
                      className="btn ml-1" 
                      onClick={() => handleRename(doc.id)}
                      disabled={isLoading || !editTitle.trim()}
                    >
                      Save
                    </button>
                    <button 
                      className="btn ml-1" 
                      onClick={handleCancelEdit}
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
                      onClick={() => setSharingDocId(doc.id)} 
                      disabled={isLoading}
                      title="Share"
                    >
                      <ShareIcon className="w-4 h-4" />
                    </button>
                    <button 
                      className="btn btn-circle btn-ghost btn-xs" 
                      onClick={() => setHistoryDocId(doc.id)} 
                      disabled={isLoading}
                      title="Version History"
                    >
                      <ClockIcon className="w-4 h-4" />
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
            ))
          ) : (
            // Shared Documents
            sharedDocuments.length === 0 ? (
              <li className="text-center text-gray-500 py-8">
                <ShareIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No shared documents</p>
                <p className="text-xs">Documents shared with you will appear here</p>
              </li>
            ) : (
              sharedDocuments.map(sharedDoc => (
                <li key={sharedDoc.id} className="mb-2">
                  <button
                    className={`text-left w-full py-2 px-2 rounded transition-colors border-l-4 ${
                      currentDocument?.id === sharedDoc.documents.id
                        ? 'font-bold bg-blue-100 text-blue-800 border-blue-500'
                        : 'hover:bg-gray-100 border-gray-300'
                    }`}
                    onClick={() => handleSharedDocumentSelect(sharedDoc)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{sharedDoc.documents.title}</p>
                        <p className="text-xs text-gray-600">
                          {sharedDoc.permission} access • Shared by {sharedDoc.shared_by_user_id}
                        </p>
                      </div>
                      {currentDocument?.id === sharedDoc.documents.id && hasUnsavedChanges && (
                        <span className="ml-1 text-orange-600">•</span>
                      )}
                    </div>
                  </button>
                </li>
              ))
            )
          )}
        </ul>

        {/* Sharing Modal */}
        {sharingDocId && (
          <DocumentSharingModal
            documentId={sharingDocId}
            documentTitle={documents.find(d => d.id === sharingDocId)?.title || 'Document'}
            isOpen={!!sharingDocId}
            onClose={() => setSharingDocId(null)}
            currentUserId={user?.id}
          />
        )}

        {/* History Modal */}
        {historyDocId && (
          <DocumentHistoryModal
            documentId={historyDocId}
            documentTitle={documents.find(d => d.id === historyDocId)?.title || 'Document'}
            isOpen={!!historyDocId}
            onClose={() => setHistoryDocId(null)}
            currentUserId={user?.id}
            onDocumentRestore={handleDocumentRestore}
          />
        )}
      </aside>
    )
  }
)

DocumentSidebar.displayName = 'DocumentSidebar'

export default DocumentSidebar
export type { DocumentSidebarRef }
