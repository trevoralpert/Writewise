// src/components/layout/Layout.tsx
import React from 'react'
import type { ReactNode } from 'react'
import DocumentSidebar from './DocumentSidebar'
import { useEditorStore } from '../../store/editorStore'
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import SuggestionSidebar from '../suggestions/SuggestionSidebar'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../services/auth'

const Layout = ({ children, user }: { children: ReactNode, user: any }) => {
  const setCurrentDocument = useEditorStore((s) => s.setCurrentDocument)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <header className="mb-8 flex items-center gap-4">
      <h1 className="text-3xl font-bold text-primary">Writewise</h1>
        {user && (
          <button className="btn ml-4" onClick={handleLogout}>Logout</button>
        )}
    </header>
      
      <div className="flex w-full max-w-5xl">
        {user && (
          <DocumentSidebar user={user} onSelect={setCurrentDocument} />
        )}
        <main className="flex-1">{children}</main>
        {user && <SuggestionSidebar />}
      </div>
  </div>
)
}

export default Layout