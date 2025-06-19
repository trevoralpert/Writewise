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
  <div className="min-h-screen bg-gray-50 flex flex-col items-center py-1">
      <header className="mb-2 flex flex-col items-center gap-1">
      <img src="/app_logo.jpg" alt="Writewise" className="w-128 h-64 object-cover rounded-2xl overflow-hidden" />
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