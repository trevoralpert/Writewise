import React from 'react'
import { useState, useEffect } from 'react'
import { signInWithEmail, signInWithGoogle, signUpWithEmail, signOut } from '../../services/auth.ts'
import { supabase } from '../../services/supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Fetch user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const fn = isSignUp ? signUpWithEmail : signInWithEmail
    const { error } = await fn(email, password)
    if (error) setError(error.message)
  }

  if (user) {
    return (
      <div className="mb-4">
        <p className="mb-2">Signed in as {user.email}</p>
        <button className="btn" onClick={() => signOut()}>Sign Out</button>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleEmailAuth} className="flex flex-col gap-2">
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Have an account? Sign In' : 'No account? Sign Up'}
        </button>
      </form>
      <button className="btn mt-2" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}
