import React, { useState, useEffect } from 'react'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../../services/auth'
import { supabase } from '../../services/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

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

  const googleHandler = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Google sign-in clicked")
    try {
      const result = await signInWithGoogle()
      console.log("Google sign-in result:", result)
      if (result.data?.url) {
        console.log("Redirecting to:", result.data.url)
        window.location.href = result.data.url
      } else {
        console.error("No OAuth URL returned:", result)
      }
    } catch (error) {
      console.error("Google sign-in error:", error)
      alert(`Google sign-in error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl">
        <div className="card-body">
          <h2 className="text-3xl font-bold mb-6 text-primary text-center">WriteWise</h2>
          <p className="text-sm text-gray-500 text-center mb-4">Your AI-powered writing assistant</p>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn btn-primary w-full" type="submit">
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            className="btn btn-outline btn-primary w-full mt-2 flex gap-2 normal-case"
            onClick={googleHandler}
          >
            <img src="/Google.png" alt="" className="w-5 h-5" />
            Continue with Google
          </button>

          <Link to="/demo" className="btn btn-secondary w-full normal-case mt-2">
            Try Demo Without Account
          </Link>

          <button
            className="btn btn-link btn-xs mt-2"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'New here? Create one'}
          </button>

          {error && <p className="text-error text-center">{error}</p>}
        </div>
      </div>
    </div>
  )
}
