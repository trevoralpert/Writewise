// src/App.tsx
import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Editor from './components/editor/Editor'
import LoginPage from './components/auth/LoginPage'
import DemoPage from './components/demo/DemoPage'
import { supabase } from './services/supabaseClient'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      console.log('App: Initial user check:', data?.user)
      setUser(data?.user ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('App: Auth state change:', event, session?.user)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/auth/callback" element={user ? <Navigate to="/" /> : <Navigate to="/login" />} />
        <Route path="/*" element={user ? <Layout user={user}><Editor /></Layout> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App