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
    <div className="min-h-screen flex items-center justify-center bg-warm-cream">
      <div className="card-warm w-full max-w-md">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="WriteWise logo" className="w-24 h-24 rounded-creative" />
            <h1 className="text-2xl font-bold text-gray-700 mt-4 font-writing">Welcome to Writewise</h1>
          </div>
          <p className="text-sm text-forest-600 text-center mb-6 font-ui">Your AI-powered writing companion for creativity and clarity</p>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn w-full" type="submit">
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            className="btn-ghost w-full mt-4 flex items-center justify-center gap-3 px-6 py-3 rounded-creative border border-forest-200 hover:bg-forest-50 transition-all duration-200"
            onClick={googleHandler}
          >
            <img src="/Google.png" alt="" className="w-5 h-5" />
            <span className="font-ui font-medium">Continue with Google</span>
          </button>

          <Link to="/demo" className="btn-secondary w-full mt-4 inline-block text-center">
            Try Demo Without Account
          </Link>

          <button
            className="w-full mt-6 text-sm text-forest-600 hover:text-forest-800 transition-colors font-ui"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </button>

          {error && <p className="text-coral-600 text-center mt-4 text-sm font-ui">{error}</p>}
        </div>
      </div>
    </div>
  )
}
