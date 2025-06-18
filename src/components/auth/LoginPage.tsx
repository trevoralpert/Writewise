import React, { useState, useEffect } from 'react'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../../services/auth'
import { supabase } from '../../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      console.log('Initial user check:', data?.user)
      if (data?.user) {
        console.log('User found, navigating to /')
        navigate('/')
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user)
      if (session?.user && event === 'SIGNED_IN') {
        console.log('User signed in, navigating to /')
        // Add small delay to ensure state is fully updated
        setTimeout(() => navigate('/'), 100)
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const fn = isSignUp ? signUpWithEmail : signInWithEmail
    const { error } = await fn(email, password)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Sign In to Writewise</h2>
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
        <button
          type="button"
          className="btn mt-2 w-full"
          onClick={async (e) => {
            e.preventDefault();
            console.log("Google sign-in clicked");
            try {
              const result = await signInWithGoogle();
              console.log("Google sign-in result:", result);
              if (result.data?.url) {
                console.log("Redirecting to:", result.data.url);
                window.location.href = result.data.url;
              } else {
                console.error("No OAuth URL returned:", result);
              }
            } catch (error) {
              console.error("Google sign-in error:", error);
              alert(`Google sign-in error: ${error instanceof Error ? error.message : String(error)}`);
            }
          }}
        >
          Sign in with Google
        </button>
        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      </div>
    </div>
  )
}
