import React, { useState, useEffect } from 'react'
import { XMarkIcon, ClockIcon, ArrowUturnLeftIcon, EyeIcon } from '@heroicons/react/24/outline'
import { 
  getDocumentVersions, 
  restoreDocumentVersion,
  type DocumentVersion 
} from '../../services/documents'

interface DocumentHistoryModalProps {
  documentId: string
  documentTitle: string
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onDocumentRestore?: () => void
}

export default function DocumentHistoryModal({ 
  documentId, 
  documentTitle, 
  isOpen, 
  onClose, 
  currentUserId,
  onDocumentRestore 
}: DocumentHistoryModalProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
    }
  }, [isOpen, documentId])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const { data, error } = await getDocumentVersions(documentId)
      if (error) throw error
      
      setVersions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Restore document to version ${versionNumber}? This will save the current version before restoring.`)) {
      return
    }

    setRestoring(versionId)
    try {
      const { error } = await restoreDocumentVersion(documentId, versionId, currentUserId)
      if (error) throw error
      
      // Refresh versions and notify parent
      await fetchVersions()
      if (onDocumentRestore) {
        onDocumentRestore()
      }
      
      // Close modal after successful restore
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version')
    } finally {
      setRestoring(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getTimeDifference = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`
    } else {
      return `${diffDays} days ago`
    }
  }

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Version History</h2>
            <p className="text-sm text-gray-600 mt-1">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading version history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No version history</h3>
              <p className="text-gray-600">This document doesn't have any saved versions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Version List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">Versions ({versions.length})</h3>
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      previewVersion?.id === version.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPreviewVersion(version)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          Version {version.version_number}
                        </span>
                        {version.version_number === Math.max(...versions.map(v => v.version_number)) && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewVersion(version)
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Preview"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestore(version.id, version.version_number)
                          }}
                          disabled={restoring === version.id}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Restore this version"
                        >
                          {restoring === version.id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <p>{formatDate(version.created_at)}</p>
                      <p className="text-xs">{getTimeDifference(version.created_at)}</p>
                    </div>
                    
                    {version.change_summary && (
                      <p className="text-sm text-gray-700 mb-2 italic">
                        "{version.change_summary}"
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{version.title}</p>
                      <p className="text-xs mt-1">
                        {getContentPreview(version.content)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview Panel */}
              <div className="border-l pl-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {previewVersion ? `Preview: Version ${previewVersion.version_number}` : 'Select a version to preview'}
                </h3>
                
                {previewVersion ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Document Title</h4>
                      <p className="text-gray-700">{previewVersion.title}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                      <div className="max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                          {previewVersion.content}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Version Info</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Created:</strong> {formatDate(previewVersion.created_at)}</p>
                        <p><strong>Version:</strong> {previewVersion.version_number}</p>
                        {previewVersion.change_summary && (
                          <p><strong>Summary:</strong> {previewVersion.change_summary}</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRestore(previewVersion.id, previewVersion.version_number)}
                      disabled={restoring === previewVersion.id}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {restoring === previewVersion.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <ArrowUturnLeftIcon className="w-4 h-4" />
                          Restore This Version
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Click on a version to see its content</p>
                  </div>
                )}
              </div>
            </div>
          )}
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