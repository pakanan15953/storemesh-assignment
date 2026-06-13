import React from 'react'
import { Button } from "@/components/ui/button"
import { ShoppingCart, LogOut } from "lucide-react"
import type { User } from "../../types"

interface NavbarProps {
  currentView: 'catalog' | 'cart' | 'orders' | 'my-products' | 'login' | 'register'
  setCurrentView: (view: 'catalog' | 'cart' | 'orders' | 'my-products' | 'login' | 'register') => void
  user: User | null
  cartCount: number
  onLogout: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  cartCount,
  onLogout
}) => {
  return (
    <header className="w-full border-b border-neutral-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => setCurrentView('catalog')}
          className="hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#863bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span className="font-serif font-medium text-lg tracking-wider text-neutral-900 uppercase">StoreMesh</span>
        </button>

        {/* Nav (General Page Links) */}
        <nav className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs font-semibold tracking-wider uppercase cursor-pointer h-8 ${currentView === 'catalog' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
            onClick={() => setCurrentView('catalog')}
          >
            Catalog
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs font-semibold tracking-wider uppercase cursor-pointer h-8 ${
                currentView === 'orders' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'
              }`}
              onClick={() => setCurrentView('orders')}
            >
              Orders
            </Button>
          )}

          {user?.role === 'SELLER' && (
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs font-semibold tracking-wider uppercase cursor-pointer h-8 ${currentView === 'my-products' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
              onClick={() => setCurrentView('my-products')}
            >
              Products
            </Button>
          )}
        </nav>

        {/* User Utilities & Auth Area */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Buyer Cart Icon (Positioned inside User Area) */}
              {user.role === 'BUYER' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative w-8 h-8 rounded-full border border-neutral-200/60 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 cursor-pointer flex items-center justify-center transition-colors ${
                    currentView === 'cart' ? 'bg-neutral-100 text-neutral-950 border-neutral-300' : ''
                  }`}
                  onClick={() => setCurrentView('cart')}
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#863bff] text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-scale-up">
                      {cartCount}
                    </span>
                  )}
                </Button>
              )}

              {/* User Avatar & Info */}
              <div className="flex items-center gap-2.5">
                {/* Circular Initial Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#863bff]/10 border border-[#863bff]/20 flex items-center justify-center select-none cursor-default hover:bg-[#863bff]/20 transition-colors">
                  <span className="text-xs font-bold text-[#863bff] uppercase">
                    {user.username.charAt(0)}
                  </span>
                </div>

                {/* Info Text Stack */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-neutral-800 leading-tight">{user.username}</span>
                  <span className="text-[9px] text-[#863bff] font-bold uppercase tracking-wider mt-0.5">{user.role}</span>
                </div>
              </div>

              {/* Logout Button (Circular hover styling) */}
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-neutral-400 hover:text-red-500 rounded-full cursor-pointer hover:bg-red-50 transition-colors"
                onClick={onLogout}
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="text-xs font-semibold tracking-wider uppercase text-neutral-500 cursor-pointer h-8" onClick={() => setCurrentView('login')}>
                Sign in
              </Button>
              <Button size="sm" className="text-xs font-semibold tracking-wider uppercase bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer h-8" onClick={() => setCurrentView('register')}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
