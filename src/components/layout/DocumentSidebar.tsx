import React from 'react'
import { useEffect, useState } from 'react'
import { getDocuments, createDocument, deleteDocument, getDocumentById } from '../../services/documents'
import { supabase } from '../../services/supabaseClient'
import { useEditorStore } from '../../store/editorStore'
import { PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Document as DocxDoc, Packer, Paragraph } from 'docx'

export default function DocumentSidebar({ onSelect, user }: { onSelect: (doc: any) => void, user: any }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const setCurrentDocument = useEditorStore((s) => s.setCurrentDocument)
  const currentDocument = useEditorStore((s) => s.currentDocument)

  useEffect(() => {
    if (user) {
      getDocuments(user.id).then(({ data }) => setDocuments(data || []))
    }
  }, [user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const { data } = await createDocument(user.id, title, '')
    if (data) {
      setDocuments([data, ...documents])
      setTitle('')
      onSelect(data)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteDocument(id)
    setDocuments(docs => docs.filter(doc => doc.id !== id))
    if (currentDocument?.id === id) {
      setCurrentDocument(null)
    }
  }

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return
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
  }

  const handleExport = async (id: string, title: string) => {
    const { data } = await getDocumentById(id)
    if (!data) return
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
  }

  return (
    <aside className="w-64 bg-white border-r p-4">
      <form onSubmit={handleCreate} className="mb-4 flex">
        <input
          className="input flex-1"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="New document title"
        />
        <button className="btn ml-2" type="submit">+</button>
      </form>
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
                  autoFocus
                />
                <button className="btn ml-1" onClick={() => handleRename(doc.id)}>Save</button>
                <button className="btn ml-1" onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <button
                  className={`text-left w-full py-1 ${currentDocument?.id === doc.id ? 'font-bold' : ''}`}
                  onClick={async () => {
                    const { data } = await getDocumentById(doc.id)
                    onSelect(data || doc)
                  }}
                >
                  {doc.title}
                </button>
                <button className="btn btn-circle btn-ghost btn-xs" onClick={() => setEditingId(doc.id)}>
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button className="btn btn-circle btn-ghost btn-xs" onClick={() => handleExport(doc.id, doc.title)} title="Export">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
                <button className="ml-2 text-red-500" onClick={() => handleDelete(doc.id)}>🗑️</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
