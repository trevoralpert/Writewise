import React, { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getDocumentByShareToken, type SharePermission } from '../../services/documents'
import { EyeIcon, PencilIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

interface SharedDocument {
  id: string
  document_id: string
  share_token: string
  permission: SharePermission
  documents: {
    id: string
    title: string
    content: string
    created_at: string
    updated_at: string
  }
}

export default function SharedDocumentViewer() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [document, setDocument] = useState<SharedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')

  useEffect(() => {
    if (shareToken) {
      fetchSharedDocument()
    }
  }, [shareToken])

  const fetchSharedDocument = async () => {
    if (!shareToken) return

    setLoading(true)
    try {
      const { data, error } = await getDocumentByShareToken(shareToken)
      if (error) throw error
      
      setDocument(data)
      setEditedContent(data?.documents.content || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shared document')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    // This would require implementing document update for shared documents
    // For now, just toggle back to view mode
    setIsEditing(false)
    // TODO: Implement actual save functionality
  }

  const getPermissionIcon = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return <EyeIcon className="w-5 h-5" />
      case 'edit':
        return <PencilIcon className="w-5 h-5" />
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5" />
      default:
        return <EyeIcon className="w-5 h-5" />
    }
  }

  const getPermissionText = (permission: SharePermission) => {
    switch (permission) {
      case 'view':
        return 'View Only'
      case 'edit':
        return 'Can Edit'
      case 'comment':
        return 'Can Comment'
      default:
        return 'View Only'
    }
  }

  if (!shareToken) {
    return <Navigate to="/" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared document...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || 'This shared document link is invalid or has expired.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Writewise
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{document.documents.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Shared document • Last updated {new Date(document.documents.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                {getPermissionIcon(document.permission)}
                <span className="text-sm font-medium text-gray-700">
                  {getPermissionText(document.permission)}
                </span>
              </div>
              
              {document.permission === 'edit' && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isEditing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditing ? 'Save Changes' : 'Edit Document'}
                </button>
              )}
              
              <a
                href="/"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Open Writewise
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border min-h-[600px]">
          {isEditing && document.permission === 'edit' ? (
            <div className="p-6">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Start writing..."
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="prose max-w-none">
                {document.documents.content ? (
                  <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                    {document.documents.content}
                  </pre>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Document</h3>
                    <p className="text-gray-600">This document doesn't have any content yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Comments section for comment permission */}
        {document.permission === 'comment' && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="space-y-4">
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No comments yet</p>
                <p className="text-sm text-gray-500">Comments feature coming soon</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Powered by <span className="font-semibold">Writewise</span>
            </p>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Create your own documents →
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
} 