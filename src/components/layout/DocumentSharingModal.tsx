import React, { useState, useEffect } from 'react'
import { XMarkIcon, LinkIcon, UserPlusIcon, GlobeAltIcon, TrashIcon } from '@heroicons/react/24/outline'
import { 
  shareDocument, 
  createPublicShare, 
  getDocumentShares, 
  removeDocumentShare, 
  deactivatePublicShare,
  type SharePermission,
  type DocumentShare,
  type PublicShare
} from '../../services/documents'

interface DocumentSharingModalProps {
  documentId: string
  documentTitle: string
  isOpen: boolean
  onClose: () => void
  currentUserId: string
}

export default function DocumentSharingModal({ 
  documentId, 
  documentTitle, 
  isOpen, 
  onClose, 
  currentUserId 
}: DocumentSharingModalProps) {
  const [directShares, setDirectShares] = useState<DocumentShare[]>([])
  const [publicShares, setPublicShare] = useState<PublicShare[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Share form state
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState<SharePermission>('view')
  const [shareExpiry, setShareExpiry] = useState('')
  
  // Public share form state
  const [publicPermission, setPublicPermission] = useState<SharePermission>('view')
  const [publicExpiry, setPublicExpiry] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchShares()
    }
  }, [isOpen, documentId])

  const fetchShares = async () => {
    setLoading(true)
    try {
      const { directShares, publicShares, error } = await getDocumentShares(documentId)
      if (error) throw error
      
      setDirectShares(directShares)
      setPublicShare(publicShares)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shares')
    } finally {
      setLoading(false)
    }
  }

  const handleDirectShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shareEmail.trim()) return

    setLoading(true)
    try {
      const expiresAt = shareExpiry ? new Date(shareExpiry).toISOString() : undefined
      const { error } = await shareDocument(
        documentId,
        currentUserId,
        shareEmail.trim(),
        sharePermission,
        expiresAt
      )
      
      if (error) throw error
      
      setShareEmail('')
      setShareExpiry('')
      await fetchShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share document')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePublicShare = async () => {
    setLoading(true)
    try {
      const expiresAt = publicExpiry ? new Date(publicExpiry).toISOString() : undefined
      const { error } = await createPublicShare(documentId, publicPermission, expiresAt)
      
      if (error) throw error
      
      setPublicExpiry('')
      await fetchShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create public share')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDirectShare = async (shareId: string) => {
    if (!confirm('Remove this share? The user will lose access to the document.')) return
    
    setLoading(true)
    try {
      const { error } = await removeDocumentShare(shareId)
      if (error) throw error
      await fetchShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivatePublicShare = async (shareId: string) => {
    if (!confirm('Deactivate this public link? Anyone with the link will lose access.')) return
    
    setLoading(true)
    try {
      const { error } = await deactivatePublicShare(shareId)
      if (error) throw error
      await fetchShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate share')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Document</h2>
            <p className="text-sm text-gray-600 mt-1">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Share with specific people */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Share with specific people</h3>
            </div>
            
            <form onSubmit={handleDirectShare} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value as SharePermission)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="view">Can view</option>
                  <option value="comment">Can comment</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <input
                  type="datetime-local"
                  value={shareExpiry}
                  onChange={(e) => setShareExpiry(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional expiry date"
                />
                <button
                  type="submit"
                  disabled={loading || !shareEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </form>

            {/* Current direct shares */}
            {directShares.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">People with access</h4>
                {directShares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{share.shared_with_email}</p>
                      <p className="text-sm text-gray-600">
                        {share.permission} • 
                        {share.expires_at ? ` Expires ${new Date(share.expires_at).toLocaleDateString()}` : ' No expiry'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveDirectShare(share.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove access"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public sharing */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <GlobeAltIcon className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Public sharing</h3>
            </div>
            
            {publicShares.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Create a link that anyone can use to access this document</p>
                <div className="flex gap-3">
                  <select
                    value={publicPermission}
                    onChange={(e) => setPublicPermission(e.target.value as SharePermission)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="view">Anyone can view</option>
                    <option value="comment">Anyone can comment</option>
                    <option value="edit">Anyone can edit</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={publicExpiry}
                    onChange={(e) => setPublicExpiry(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Optional expiry"
                  />
                  <button
                    onClick={handleCreatePublicShare}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Link'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Active public links</h4>
                {publicShares.map((share) => (
                  <div key={share.id} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">Public Link</p>
                      <button
                        onClick={() => handleDeactivatePublicShare(share.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Deactivate link"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={getShareUrl(share.share_token)}
                        readOnly
                        className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded"
                      />
                      <button
                        onClick={() => copyToClipboard(getShareUrl(share.share_token))}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Copy link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {share.permission} • 
                      {share.expires_at ? ` Expires ${new Date(share.expires_at).toLocaleDateString()}` : ' No expiry'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 