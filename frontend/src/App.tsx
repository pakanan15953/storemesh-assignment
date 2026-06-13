import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle } from "lucide-react"

import type { User, Product, Cart, Order } from "./types"
import { Navbar } from "./components/pages/Navbar"
import { AuthCard } from "./components/pages/AuthCard"
import { ProductCatalog } from "./components/pages/ProductCatalog"
import { ProductDetailModal } from "./components/pages/ProductDetailModal"
import { CartDrawer } from "./components/pages/CartDrawer"
import { SellerProducts } from "./components/pages/SellerProducts"
import { OrderHistory } from "./components/pages/OrderHistory"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const getImageUrl = (url: string | null | undefined) => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
  }

  // Handle case where Django ImageField prefixes seeded external URLs with /media/ (e.g. /media/https://...)
  let cleanUrl = url
  try {
    cleanUrl = decodeURIComponent(url)
  } catch (e) {
    // fallback
  }

  // Check for http:/ or https:/ (even with a single slash due to Django path normalization)
  if (cleanUrl.includes('http:/') || cleanUrl.includes('https:/')) {
    const httpIndex = cleanUrl.indexOf('http:/')
    const httpsIndex = cleanUrl.indexOf('https:/')
    let index = -1
    let isHttps = false

    if (httpIndex !== -1 && (httpsIndex === -1 || httpIndex < httpsIndex)) {
      index = httpIndex
      isHttps = false
    } else if (httpsIndex !== -1) {
      index = httpsIndex
      isHttps = true
    }

    if (index !== -1) {
      let extracted = cleanUrl.substring(index)
      // Normalize single slash to double slash if needed
      if (isHttps && !extracted.startsWith('https://')) {
        extracted = extracted.replace('https:/', 'https://')
      } else if (!isHttps && !extracted.startsWith('http://')) {
        extracted = extracted.replace('http:/', 'http://')
      }
      return extracted
    }
  }

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl
  }

  // Determine host dynamically from API_BASE_URL to avoid hardcoding localhost
  let host = 'http://localhost:8000'
  try {
    const urlObj = new URL(API_BASE_URL)
    host = `${urlObj.protocol}//${urlObj.host}`
  } catch (e) {
    // fallback
  }

  if (cleanUrl.startsWith('/')) {
    return `${host}${cleanUrl}`
  }
  return `${host}/${cleanUrl}`
}

function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<'catalog' | 'cart' | 'orders' | 'my-products' | 'login' | 'register'>('catalog')

  // Business states
  const [products, setProducts] = useState<Product[]>([])
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  // Modal / Interaction states
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // API Call helper client
  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {})
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    })

    if (res.status === 401) {
      handleLogout()
      throw new Error('Unauthorized or expired session')
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.detail || 'An error occurred')
    }

    return res.status === 204 ? null : res.json()
  }

  // Fetch initial profile and catalogs
  useEffect(() => {
    fetchProducts()
    if (token) {
      fetchProfile()
    }
  }, [token])

  // Sync profile related assets
  useEffect(() => {
    if (user) {
      if (user.role === 'BUYER') {
        fetchCart()
        setCurrentView('catalog')
      } else if (user.role === 'SELLER') {
        fetchMyProducts()
        setCurrentView('my-products')
      }
      fetchOrders()
    } else {
      setCart(null)
      setOrders([])
      setMyProducts([])
    }
  }, [user])

  // Core API Service calls
  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/profile/')
      setUser(data)
    } catch {
      handleLogout()
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/products/')
      setProducts(data)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyProducts = async () => {
    if (!token || !user) return
    try {
      const data = await apiFetch('/products/')
      const filtered = data.filter((p: Product) => p.seller_username === user.username)
      setMyProducts(filtered)
    } catch (err: any) {
      console.error(err)
    }
  }

  const fetchCart = async () => {
    if (!token || user?.role !== 'BUYER') return
    try {
      const data = await apiFetch('/cart/')
      setCart(data)
    } catch (err: any) {
      console.error(err)
    }
  }

  const fetchOrders = async () => {
    if (!token) return
    try {
      const data = await apiFetch('/orders/')
      setOrders(data)
    } catch (err: any) {
      console.error(err)
    }
  }

  // Auth Operations
  const handleLogin = async (data: { username: string; password: string }) => {
    setLoading(true)
    clearAlerts()
    try {
      const resData = await apiFetch('/token/', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          password: data.password
        })
      })
      
      setToken(resData.access)
      localStorage.setItem('access_token', resData.access)
      
      const userProfile = await apiFetch('/profile/', {
        headers: {
          'Authorization': `Bearer ${resData.access}`
        }
      })
      setUser(userProfile)
      showSuccess(`Welcome back, ${userProfile.username}!`)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: { username: string; password: string; email?: string; role?: 'BUYER' | 'SELLER' }) => {
    setLoading(true)
    clearAlerts()
    try {
      await apiFetch('/register/', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
          role: data.role
        })
      })
      showSuccess('Registration successful! Please sign in.')
      setCurrentView('login')
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('access_token')
    setCurrentView('catalog')
    showSuccess('Successfully signed out.')
  }

  // Buyer Operations
  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    if (!token) {
      setCurrentView('login')
      showError('Please sign in to add products to your cart.')
      return
    }
    clearAlerts()
    try {
      const data = await apiFetch('/cart/add_item/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          quantity
        })
      })
      setCart(data)
      showSuccess('Added item to cart.')
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleUpdateCartQuantity = async (itemId: number, newQty: number) => {
    try {
      const data = await apiFetch(`/cart/update_item/${itemId}/`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: newQty
        })
      })
      setCart(data)
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleRemoveCartItem = async (itemId: number) => {
    try {
      const data = await apiFetch(`/cart/remove_item/${itemId}/`, {
        method: 'DELETE'
      })
      setCart(data)
      showSuccess('Item removed from cart.')
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleCheckout = async () => {
    setLoading(true)
    clearAlerts()
    try {
      await apiFetch('/orders/', {
        method: 'POST'
      })
      showSuccess('Order placed successfully!')
      setCart(null)
      fetchProducts()
      fetchOrders()
      setCurrentView('orders')
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Seller Operations
  const handleSaveProduct = async (formData: FormData) => {
    setLoading(true)
    clearAlerts()
    try {
      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.id}/`, {
          method: 'PATCH',
          body: formData
        })
        showSuccess('Product updated successfully!')
      } else {
        await apiFetch('/products/', {
          method: 'POST',
          body: formData
        })
        showSuccess('Product added successfully!')
      }
      setShowAddModal(false)
      setEditingProduct(null)
      fetchProducts()
      fetchMyProducts()
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return
    try {
      await apiFetch(`/products/${productId}/`, {
        method: 'DELETE'
      })
      showSuccess('Product deleted successfully.')
      fetchProducts()
      fetchMyProducts()
    } catch (err: any) {
      showError(err.message)
    }
  }

  // Utility helpers
  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const clearAlerts = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const getCartCount = () => {
    if (!cart) return 0
    return cart.items.reduce((acc, item) => acc + item.quantity, 0)
  }

  const formatPrice = (price: number) => {
    return `฿${parseFloat(price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 font-sans">
      {/* ── Header ── */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        cartCount={getCartCount()}
        onLogout={handleLogout}
      />

      {/* ── Floating alerts ── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {errorMessage && (
          <div className="bg-white border border-red-200 p-3.5 rounded-lg shadow-lg flex items-center gap-2.5 text-red-700 animate-fade-in text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-white border border-emerald-200 p-3.5 rounded-lg shadow-lg flex items-center gap-2.5 text-emerald-700 animate-fade-in text-left">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">
        {currentView === 'catalog' && (
          <ProductCatalog
            products={products}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            loading={loading}
            user={user}
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            getImageUrl={getImageUrl}
            formatPrice={formatPrice}
          />
        )}

        {(currentView === 'login' || currentView === 'register') && (
          <AuthCard
            currentView={currentView}
            setCurrentView={setCurrentView}
            onSubmit={currentView === 'login' ? handleLogin : handleRegister}
            loading={loading}
          />
        )}

        {currentView === 'cart' && (
          <CartDrawer
            cart={cart}
            loading={loading}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onCheckout={handleCheckout}
            setCurrentView={setCurrentView}
            getImageUrl={getImageUrl}
            formatPrice={formatPrice}
          />
        )}

        {currentView === 'my-products' && (
          <SellerProducts
            myProducts={myProducts}
            loading={loading}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            getImageUrl={getImageUrl}
            formatPrice={formatPrice}
          />
        )}

        {currentView === 'orders' && user && (
          <OrderHistory
            orders={orders}
            user={user}
            getImageUrl={getImageUrl}
            formatPrice={formatPrice}
            onAddToCart={handleAddToCart}
          />
        )}
      </main>

      {/* ── Detail Dialog Modal ── */}
      <ProductDetailModal
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        user={user}
        onAddToCart={handleAddToCart}
        getImageUrl={getImageUrl}
        formatPrice={formatPrice}
      />

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-neutral-100 bg-neutral-50/50 py-12 text-left text-neutral-600">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info & Socials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#863bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <span className="font-serif font-medium text-xl tracking-wider text-neutral-900 uppercase">StoreMesh</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Online premium gaming gear store founded in 2026. StoreMesh focuses on selling only quality and branded items, connecting sellers and buyers.
            </p>
            {/* Social Icons Mockup (Circular Black Background) */}
            <div className="flex items-center gap-2 pt-2">
              <a href="#" className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-[#863bff] transition-colors" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-3.5 h-3.5 fill-current">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-[#863bff] transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-3.5 h-3.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-[#863bff] transition-colors" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-3.5 h-3.5 fill-current">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="font-sans">
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-3 text-xs text-neutral-500 font-medium">
              <li><button onClick={() => setCurrentView('catalog')} className="hover:text-[#863bff] transition-colors cursor-pointer text-left uppercase">Catalog</button></li>
              <li><button onClick={() => { if (user?.role === 'BUYER') setCurrentView('cart'); else setCurrentView('login'); }} className="hover:text-[#863bff] transition-colors cursor-pointer text-left uppercase">Shopping Cart</button></li>
              <li><button onClick={() => { if (user) setCurrentView('orders'); else setCurrentView('login'); }} className="hover:text-[#863bff] transition-colors cursor-pointer text-left uppercase">Order History</button></li>
            </ul>
          </div>

          {/* Customers Links */}
          <div className="font-sans">
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">Customers</h4>
            <ul className="space-y-3 text-xs text-neutral-500 font-medium uppercase">
              <li><a href="#" className="hover:text-[#863bff] transition-colors">Promotions</a></li>
              <li><a href="#" className="hover:text-[#863bff] transition-colors">Delivery</a></li>
              <li><a href="#" className="hover:text-[#863bff] transition-colors">Payment</a></li>
              <li><a href="#" className="hover:text-[#863bff] transition-colors">Gift Card</a></li>
            </ul>
          </div>

          {/* About Links */}
          <div className="font-sans">
            <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">About</h4>
            <ul className="space-y-3 text-xs text-neutral-500 font-medium uppercase">
              <li><a href="#" className="hover:text-[#863bff] transition-colors">News</a></li>
              <li><a href="#" className="hover:text-[#863bff] transition-colors">Public Offer</a></li>
              <li><a href="#" className="hover:text-[#863bff] transition-colors">User Agreement</a></li>
              <li><a href="#" className="hover:text-[#863bff] transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Copyright divider */}
        <div className="max-w-6xl mx-auto px-6 mt-8 pt-6 border-t border-neutral-100/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Digital Storemesh Co., Ltd. Technical Assignment.</p>
          <p>All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
