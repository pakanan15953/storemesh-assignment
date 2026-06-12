import React from 'react'
import { Button } from "@/components/ui/button"
import { ShoppingCart, User as UserIcon, LogOut } from "lucide-react"
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
          className="text-lg font-semibold tracking-tight text-neutral-900 hover:opacity-70 transition-opacity cursor-pointer"
        >
          StoreMesh
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`text-sm cursor-pointer ${currentView === 'catalog' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
            onClick={() => setCurrentView('catalog')}
          >
            Catalog
          </Button>

          {user?.role === 'BUYER' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm relative cursor-pointer ${currentView === 'cart' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
                onClick={() => setCurrentView('cart')}
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[10px] font-medium w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm cursor-pointer ${currentView === 'orders' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
                onClick={() => setCurrentView('orders')}
              >
                Orders
              </Button>
            </>
          )}

          {user?.role === 'SELLER' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm cursor-pointer ${currentView === 'my-products' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
                onClick={() => setCurrentView('my-products')}
              >
                Products
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm cursor-pointer ${currentView === 'orders' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
                onClick={() => setCurrentView('orders')}
              >
                Orders
              </Button>
            </>
          )}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">
                <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-700">{user.username}</span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{user.role}</span>
              </div>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-500 w-8 h-8 cursor-pointer" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="text-sm text-neutral-500 cursor-pointer" onClick={() => setCurrentView('login')}>
                Sign in
              </Button>
              <Button size="sm" className="text-sm bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer" onClick={() => setCurrentView('register')}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
