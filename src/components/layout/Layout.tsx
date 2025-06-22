// src/components/layout/Layout.tsx
import React from 'react'
import type { ReactNode } from 'react'
import DocumentSidebar, { type DocumentSidebarRef } from './DocumentSidebar'
import { useEditorStore } from '../../store/editorStore'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../services/supabaseClient'
import SuggestionSidebar from '../suggestions/SuggestionSidebar'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../services/auth'
import { CogIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const Layout = ({ children, user }: { children: ReactNode, user: any }) => {
  const setCurrentDocument = useEditorStore((s) => s.setCurrentDocument)
  const saveCurrentDocument = useEditorStore((s) => s.saveCurrentDocument)
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges)
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const documentSidebarRef = useRef<DocumentSidebarRef>(null)

  // Periodic save every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (hasUnsavedChanges) {
        await saveCurrentDocument()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, saveCurrentDocument])

  const handleNavigateWithSave = async (path: string) => {
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      // Save current document before navigation
      if (hasUnsavedChanges) {
        const saved = await saveCurrentDocument()
        if (!saved) {
          const proceed = window.confirm(
            'Failed to save current document. Do you want to continue anyway? Unsaved changes will be lost.'
          )
          if (!proceed) {
            setIsNavigating(false)
            return
          }
        }
      }
      
      navigate(path)
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    
    try {
      // Save current document before logout
      if (hasUnsavedChanges) {
        const saved = await saveCurrentDocument()
        if (!saved) {
          const proceed = window.confirm(
            'Failed to save current document. Do you want to logout anyway? Unsaved changes will be lost.'
          )
          if (!proceed) {
            setIsLoggingOut(false)
            return
          }
        }
      }
      
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  // Pass the refresh function to children that need it
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        refreshDocuments: () => documentSidebarRef.current?.refreshDocuments() 
      } as any)
    }
    return child
  })

  return (
  <div className="min-h-screen bg-warm-cream flex flex-col items-center py-6 animate-fade-in-up">
      <header className="mb-6 flex flex-col items-center gap-3 animate-float">
      <img src="/app_logo.jpg" alt="Writewise" className="w-48 h-24 object-cover rounded-creative shadow-lg hover-lift" />
        {user && (
          <div className="flex items-center gap-3">
            <button 
              className="bg-orange-500 text-white px-5 py-2.5 rounded-creative hover:bg-orange-600 flex items-center shadow-lg disabled:opacity-50 font-ui font-medium transition-all duration-200" 
              onClick={() => handleNavigateWithSave('/analytics')}
              disabled={isNavigating}
            >
              📊 {isNavigating ? 'Saving...' : 'Analytics'}
            </button>
            <button 
              className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 flex items-center shadow-lg disabled:opacity-50 font-medium transition-all duration-200" 
              onClick={() => handleNavigateWithSave('/settings')}
              disabled={isNavigating}
            >
              ⚙️ {isNavigating ? 'Saving...' : 'Settings'}
            </button>
            <button 
              className="bg-gray-700 text-white px-5 py-2.5 rounded-creative hover:bg-gray-800 font-ui font-medium shadow-lg transition-all duration-200" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{ animationDelay: '0.2s' }}
            >
              Logout
            </button>
          </div>
        )}
    </header>
      
              <div className="flex w-full max-w-7xl gap-6 px-6">
        {user && (
          <DocumentSidebar ref={documentSidebarRef} user={user} onSelect={setCurrentDocument} />
        )}
        <main className="flex-1">{childrenWithProps}</main>
        {user && <SuggestionSidebar />}
      </div>
  </div>
)
}

export default Layout