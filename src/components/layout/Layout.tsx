// src/components/layout/Layout.tsx
import type { ReactNode } from 'react'
import Auth from './Auth'
import DocumentSidebar from './DocumentSidebar'
import { useEditorStore } from '../../store/editorStore'
import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import SuggestionSidebar from '../suggestions/SuggestionSidebar'

const Layout = ({ children }: { children: ReactNode }) => {
  const setCurrentDocument = useEditorStore((s) => s.setCurrentDocument)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Writewise</h1>
      </header>
      <Auth />
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