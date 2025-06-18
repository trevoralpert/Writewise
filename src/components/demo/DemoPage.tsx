import React from 'react'
import Editor from '../editor/Editor'
import SuggestionSidebar from '../suggestions/SuggestionSidebar'
import { Link } from 'react-router-dom'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary">WriteWise Demo</h1>
        <p className="text-sm text-gray-500 text-center">Try the editor instantly—no account needed</p>
        <Link to="/login" className="btn btn-outline btn-primary mt-4">Back to Login</Link>
      </header>
      <div className="flex w-full max-w-4xl">
        <main className="flex-1">
          <Editor />
        </main>
        <SuggestionSidebar />
      </div>
    </div>
  )
} 