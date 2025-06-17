// src/App.tsx
import React from 'react'
import Layout from './components/layout/Layout'
import Editor from './components/editor/Editor'
import { useEffect } from 'react'
// import { supabase } from './services/supabaseClient'

function App() {
  useEffect(() => {
    // This is just a test; you can remove or comment it out if you don't have a table yet
    // supabase
    //   .from('test_table')
    //   .select('*')
    //   .then(console.log)
  }, [])

  return (
    <Layout>
      <Editor />
    </Layout>
  )
}

export default App