import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface AuthCardProps {
  currentView: 'login' | 'register'
  setCurrentView: (view: 'catalog' | 'cart' | 'orders' | 'my-products' | 'login' | 'register') => void
  onSubmit: (data: { username: string; password: string; email?: string; role?: 'BUYER' | 'SELLER' }) => void
  loading: boolean
}

export const AuthCard: React.FC<AuthCardProps> = ({
  currentView,
  setCurrentView,
  onSubmit,
  loading
}) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentView === 'login') {
      onSubmit({ username, password })
    } else {
      onSubmit({ username, password, email, role })
    }
  }

  return (
    <div className="max-w-sm w-full mx-auto mt-16 animate-scale-up">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold tracking-tight">
          {currentView === 'login' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="text-neutral-500 text-sm mt-1">
          {currentView === 'login' ? 'Enter your credentials to continue' : 'Join the marketplace'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="form-label text-sm font-medium text-neutral-700 block text-left">Username</label>
          <Input
            type="text"
            required
            className="h-10 bg-white border-neutral-200"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
        </div>

        {currentView === 'register' && (
          <>
            <div className="space-y-1.5">
              <label className="form-label text-sm font-medium text-neutral-700 block text-left">Email</label>
              <Input
                type="email"
                required
                className="h-10 bg-white border-neutral-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="form-label text-sm font-medium text-neutral-700 block text-left">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-2.5 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
                    role === 'BUYER'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setRole('BUYER')}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  className={`py-2.5 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
                    role === 'SELLER'
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                  }`}
                  onClick={() => setRole('SELLER')}
                >
                  Seller
                </button>
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="form-label text-sm font-medium text-neutral-700 block text-left">Password</label>
          <Input
            type="password"
            required
            className="h-10 bg-white border-neutral-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 mt-2 bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            currentView === 'login' ? 'Sign in' : 'Create account'
          )}
        </Button>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline transition-colors cursor-pointer"
          onClick={() => {
            setCurrentView(currentView === 'login' ? 'register' : 'login')
            setUsername('')
            setEmail('')
            setPassword('')
          }}
        >
          {currentView === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
