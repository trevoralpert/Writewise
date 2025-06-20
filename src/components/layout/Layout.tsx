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
  <div className="min-h-screen bg-gray-50 flex flex-col items-center py-1">
      <header className="mb-2 flex flex-col items-center gap-1">
      <img src="/app_logo.jpg" alt="Writewise" className="w-128 h-64 object-cover rounded-2xl overflow-hidden" />
        {user && (
          <div className="flex items-center gap-2">
            <button 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition flex items-center disabled:opacity-50" 
              onClick={() => handleNavigateWithSave('/analytics')}
              disabled={isNavigating}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              {isNavigating ? 'Saving...' : 'Analytics'}
            </button>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center disabled:opacity-50" 
              onClick={() => handleNavigateWithSave('/settings')}
              disabled={isNavigating}
            >
              <CogIcon className="w-4 h-4 mr-2" />
              {isNavigating ? 'Saving...' : 'Settings'}
            </button>
            <button 
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition" 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Saving & Logging out...' : 'Logout'}
            </button>
          </div>
        )}
    </header>
      
      <div className="flex w-full max-w-5xl">
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