import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  ShoppingCart, 
  User as UserIcon, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  PlusCircle, 
  Edit, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Package,
  ArrowRight
} from "lucide-react"

const API_BASE_URL = 'http://localhost:8000/api'

const getImageUrl = (url: string | null | undefined) => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const host = 'http://localhost:8000'
  if (url.startsWith('/')) {
    return `${host}${url}`
  }
  return `${host}/${url}`
}

interface User {
  username: string
  email: string
  role: 'BUYER' | 'SELLER'
}

interface Product {
  id: number
  seller: number
  seller_username: string
  title: string
  description: string
  price: number
  quantity: number
  image: string
  created_at: string
  updated_at: string
}

interface CartItem {
  id: number
  product: Product
  quantity: number
}

interface Cart {
  id: number
  buyer: string
  items: CartItem[]
}

interface OrderItem {
  id: number
  product: number | null
  product_title: string
  product_image: string | null
  quantity: number
  unit_price: number
}

interface Order {
  id: number
  buyer: number
  buyer_username: string
  total_price: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  items: OrderItem[]
  created_at: string
}

function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [user, setUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<'catalog' | 'cart' | 'orders' | 'my-products' | 'login' | 'register'>('catalog')
  
  // Data states
  const [products, setProducts] = useState<Product[]>([])
  const [myProducts, setMyProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  
  // UI and filters states
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  // Form states
  const [authUsername, setAuthUsername] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authRole, setAuthRole] = useState<'BUYER' | 'SELLER'>('BUYER')
  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    quantity: '',
    image: '',
    description: ''
  })
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string>('')
  
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

  // Context-aware fetching after user is authenticated
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

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/profile/')
      setUser(data)
    } catch (err: any) {
      console.error(err)
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
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    clearAlerts()
    try {
      const data = await apiFetch('/token/', {
        method: 'POST',
        body: JSON.stringify({ username: authUsername, password: authPassword })
      })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      setToken(data.access)
      showSuccess('Logged in successfully!')
    } catch (err: any) {
      showError(err.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearAlerts()
    try {
      await apiFetch('/register/', {
        method: 'POST',
        body: JSON.stringify({
          username: authUsername,
          email: authEmail,
          password: authPassword,
          role: authRole
        })
      })
      showSuccess('Account created successfully!')
      handleLogin()
    } catch (err: any) {
      showError(err.message || 'Registration failed')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setUser(null)
    setCurrentView('catalog')
    clearAlerts()
  }

  // Cart Operations
  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    if (!token) {
      setCurrentView('login')
      return
    }
    if (user?.role !== 'BUYER') {
      showError('Only Buyers can purchase and add items to a cart.')
      return
    }
    try {
      const data = await apiFetch('/cart/add_item/', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity })
      })
      setCart(data)
      showSuccess('Added to cart!')
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleUpdateCartQuantity = async (itemId: number, newQty: number) => {
    try {
      const data = await apiFetch(`/cart/update_item/${itemId}/`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty })
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
      showSuccess('Order placed successfully! Stock updated.')
      fetchCart()
      fetchOrders()
      fetchProducts()
      setCurrentView('orders')
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Seller Operations
  const handleAddOrEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearAlerts()

    const formData = new FormData()
    formData.append('title', productForm.title)
    formData.append('price', parseFloat(productForm.price).toString())
    formData.append('quantity', parseInt(productForm.quantity).toString())
    formData.append('description', productForm.description)

    if (productImageFile) {
      formData.append('image', productImageFile)
    } else if (editingProduct && !productImagePreview) {
      formData.append('image', '')
    }

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
      resetProductForm()
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

  const resetProductForm = () => {
    setProductForm({
      title: '',
      price: '',
      quantity: '',
      image: '',
      description: ''
    })
    setProductImageFile(null)
    setProductImagePreview('')
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setProductForm({
      title: p.title,
      price: p.price.toString(),
      quantity: p.quantity.toString(),
      image: p.image || '',
      description: p.description || ''
    })
    setProductImageFile(null)
    setProductImagePreview(getImageUrl(p.image))
    setShowAddModal(true)
  }

  const getFilteredProducts = () => {
    return products.filter((p) => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      let matchPrice = true
      if (priceFilter === 'under-1000') matchPrice = p.price < 1000
      else if (priceFilter === '1000-3000') matchPrice = p.price >= 1000 && p.price <= 3000
      else if (priceFilter === 'over-3000') matchPrice = p.price > 3000

      return matchSearch && matchPrice
    })
  }

  const getCartCount = () => {
    if (!cart) return 0
    return cart.items.reduce((acc, item) => acc + item.quantity, 0)
  }

  const formatPrice = (price: number) => {
    return `฿${parseFloat(price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-neutral-900 font-sans">

      {/* ── Header ── */}
      <header className="w-full border-b border-neutral-200 sticky top-0 z-40 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <button
            onClick={() => setCurrentView('catalog')}
            className="text-lg font-semibold tracking-tight text-neutral-900 hover:opacity-70 transition-opacity"
          >
            StoreMesh
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`text-sm ${currentView === 'catalog' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
              onClick={() => setCurrentView('catalog')}
            >
              Catalog
            </Button>

            {user?.role === 'BUYER' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm relative ${currentView === 'cart' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
                  onClick={() => setCurrentView('cart')}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  Cart
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[10px] font-medium w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm ${currentView === 'orders' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
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
                  className={`text-sm ${currentView === 'my-products' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
                  onClick={() => setCurrentView('my-products')}
                >
                  Products
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm ${currentView === 'orders' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500'}`}
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
                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-red-500 w-8 h-8" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="text-sm text-neutral-500" onClick={() => setCurrentView('login')}>
                  Sign in
                </Button>
                <Button size="sm" className="text-sm bg-neutral-900 text-white hover:bg-neutral-800" onClick={() => setCurrentView('register')}>
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Floating alerts ── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {errorMessage && (
          <div className="bg-white border border-red-200 p-3.5 rounded-lg shadow-lg flex items-center gap-2.5 text-red-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="bg-white border border-emerald-200 p-3.5 rounded-lg shadow-lg flex items-center gap-2.5 text-emerald-700 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-grow w-full">

        {/* ═══ CATALOG ═══ */}
        {currentView === 'catalog' && (
          <div className="animate-fade-in">
            {/* Header + filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
                <p className="text-neutral-500 text-sm mt-1">Browse all available items</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0 md:min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <Input
                    type="text"
                    className="pl-9 h-9 bg-white border-neutral-200 text-sm"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="h-9 px-3 bg-white border border-neutral-200 rounded-md text-neutral-600 text-sm outline-none focus:border-neutral-400 cursor-pointer"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                >
                  <option value="all">All prices</option>
                  <option value="under-1000">Under ฿1,000</option>
                  <option value="1000-3000">฿1,000 – ฿3,000</option>
                  <option value="over-3000">Over ฿3,000</option>
                </select>
              </div>
            </div>

            {/* Product grid */}
            {loading ? (
              <div className="grid-products">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="skeleton w-full aspect-[4/3]" />
                    <div className="p-4 space-y-3">
                      <div className="skeleton h-4 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="flex justify-between items-center pt-1">
                        <div className="skeleton h-5 w-1/4" />
                        <div className="skeleton h-8 w-16 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : getFilteredProducts().length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg">
                <p className="text-neutral-400">No products found.</p>
              </div>
            ) : (
              <div className="grid-products">
                {getFilteredProducts().map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden flex flex-col group border-neutral-200 hover:border-neutral-300 transition-colors bg-white shadow-none hover:shadow-sm"
                  >
                    <div
                      className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 relative cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                        }}
                      />
                      {product.quantity === 0 && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 font-medium text-xs">Sold out</Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex-grow flex flex-col text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-neutral-400">{product.seller_username}</span>
                        {product.quantity > 0 && (
                          <span className="text-xs text-neutral-400">{product.quantity} left</span>
                        )}
                      </div>
                      <h3
                        className="text-sm font-medium text-neutral-900 mt-1.5 cursor-pointer hover:underline line-clamp-1"
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.title}
                      </h3>
                      <p className="text-neutral-400 text-xs mt-1 line-clamp-2 flex-grow">
                        {product.description || 'No description.'}
                      </p>
                    </CardContent>

                    <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between gap-3">
                      <span className="text-base font-semibold text-neutral-900">{formatPrice(product.price)}</span>
                      {user?.role === 'SELLER' ? (
                        <Button variant="outline" size="sm" className="text-xs h-8 border-neutral-200" onClick={() => setSelectedProduct(product)}>
                          View
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="text-xs h-8 bg-neutral-900 text-white hover:bg-neutral-800"
                          disabled={product.quantity === 0}
                          onClick={() => handleAddToCart(product.id)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ AUTH ═══ */}
        {(currentView === 'login' || currentView === 'register') && (
          <div className="max-w-sm w-full mx-auto mt-16 animate-scale-up">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold tracking-tight">
                {currentView === 'login' ? 'Sign in' : 'Create account'}
              </h2>
              <p className="text-neutral-500 text-sm mt-1">
                {currentView === 'login' ? 'Enter your credentials to continue' : 'Join the marketplace'}
              </p>
            </div>

            <form onSubmit={currentView === 'login' ? handleLogin : handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="form-label">Username</label>
                <Input
                  type="text"
                  required
                  className="h-10 bg-white border-neutral-200"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Username"
                />
              </div>

              {currentView === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="form-label">Email</label>
                    <Input
                      type="email"
                      required
                      className="h-10 bg-white border-neutral-200"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="form-label">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                          authRole === 'BUYER'
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                        }`}
                        onClick={() => setAuthRole('BUYER')}
                      >
                        Buyer
                      </button>
                      <button
                        type="button"
                        className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                          authRole === 'SELLER'
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-300'
                        }`}
                        onClick={() => setAuthRole('SELLER')}
                      >
                        Seller
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="form-label">Password</label>
                <Input
                  type="password"
                  required
                  className="h-10 bg-white border-neutral-200"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-neutral-900 text-white hover:bg-neutral-800 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : currentView === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              {currentView === 'login' ? (
                <p className="text-neutral-400 text-sm">
                  No account?{' '}
                  <button className="text-neutral-900 font-medium underline underline-offset-2" onClick={() => { setCurrentView('register'); clearAlerts(); }}>
                    Register
                  </button>
                </p>
              ) : (
                <p className="text-neutral-400 text-sm">
                  Have an account?{' '}
                  <button className="text-neutral-900 font-medium underline underline-offset-2" onClick={() => { setCurrentView('login'); clearAlerts(); }}>
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ CART ═══ */}
        {currentView === 'cart' && user?.role === 'BUYER' && (
          <div className="max-w-3xl w-full mx-auto animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
              <p className="text-neutral-500 text-sm mt-1">Review your items before checkout</p>
            </div>

            {!cart || cart.items.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg space-y-3">
                <ShoppingCart className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-neutral-400">Your cart is empty</p>
                <Button variant="outline" size="sm" className="border-neutral-200 text-sm" onClick={() => setCurrentView('catalog')}>
                  Browse products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Items */}
                <div className="lg:col-span-2 divide-y divide-neutral-100">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0">
                      <div className="w-16 h-16 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0">
                        <img src={getImageUrl(item.product.image)} className="w-full h-full object-cover" alt={item.product.title} />
                      </div>

                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-medium text-neutral-900 truncate">{item.product.title}</h4>
                        <p className="text-xs text-neutral-400 mt-0.5">{item.product.seller_username}</p>
                        <p className="text-sm font-medium text-neutral-900 mt-1">{formatPrice(item.product.price)}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center border border-neutral-200 rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-neutral-400 hover:text-neutral-900"
                            onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-neutral-400 hover:text-neutral-900"
                            onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.quantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <button
                          className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                          onClick={() => handleRemoveCartItem(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border border-neutral-200 rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-500">
                      <span>Items</span>
                      <span className="text-neutral-900">{getCartCount()}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500">
                      <span>Shipping</span>
                      <span className="text-emerald-600">Free</span>
                    </div>
                    <hr className="border-neutral-100" />
                    <div className="flex justify-between font-semibold text-neutral-900">
                      <span>Total</span>
                      <span>
                        {formatPrice(cart.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0))}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full h-10 bg-neutral-900 text-white hover:bg-neutral-800 text-sm"
                    disabled={loading}
                    onClick={handleCheckout}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>Checkout <ArrowRight className="w-4 h-4 ml-1.5" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ORDERS ═══ */}
        {currentView === 'orders' && user && (
          <div className="max-w-3xl w-full mx-auto animate-fade-in">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">
                {user.role === 'BUYER' ? 'Order history' : 'Customer orders'}
              </h1>
              <p className="text-neutral-500 text-sm mt-1">
                {user.role === 'BUYER' ? 'Track your past purchases' : 'View orders from your store'}
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg">
                <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-400">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                    {/* Order header */}
                    <div className="bg-neutral-50 px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200">
                      <div className="flex items-center gap-5 text-sm">
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Order</span>
                          <span className="font-medium text-neutral-900">#{String(order.id).padStart(4, '0')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Date</span>
                          <span className="text-neutral-600">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                        {user.role === 'SELLER' && (
                          <div>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Customer</span>
                            <span className="text-neutral-600">{order.buyer_username}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-neutral-900">{formatPrice(order.total_price)}</span>
                        <Badge variant="outline" className={`text-[10px] font-medium ${getStatusStyle(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="divide-y divide-neutral-100">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="w-10 h-10 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                            {item.product_image ? (
                              <img src={getImageUrl(item.product_image)} className="w-full h-full object-cover" alt={item.product_title} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-400">N/A</div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-medium text-neutral-900 truncate">{item.product_title}</h4>
                            <span className="text-xs text-neutral-400">Qty: {item.quantity}</span>
                          </div>
                          <span className="text-sm font-medium text-neutral-900 flex-shrink-0">{formatPrice(item.unit_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ SELLER PRODUCTS ═══ */}
        {currentView === 'my-products' && user?.role === 'SELLER' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">My products</h1>
                <p className="text-neutral-500 text-sm mt-1">Manage your listings</p>
              </div>
              <Button
                size="sm"
                className="bg-neutral-900 text-white hover:bg-neutral-800 text-sm h-9"
                onClick={() => { resetProductForm(); setEditingProduct(null); setShowAddModal(true); }}
              >
                <PlusCircle className="w-4 h-4 mr-1.5" /> New product
              </Button>
            </div>

            {myProducts.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg">
                <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-400">No products listed yet</p>
              </div>
            ) : (
              <div className="grid-products">
                {myProducts.map((p) => (
                  <Card key={p.id} className="overflow-hidden flex flex-col border-neutral-200 bg-white shadow-none">
                    <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative group">
                      <img src={getImageUrl(p.image)} className="w-full h-full object-cover" alt={p.title} />
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="w-8 h-8 rounded-md bg-white/90 border border-neutral-200 flex items-center justify-center hover:bg-white text-neutral-600 transition-colors"
                          onClick={() => openEditModal(p)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="w-8 h-8 rounded-md bg-white/90 border border-neutral-200 flex items-center justify-center hover:bg-white text-red-500 transition-colors"
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <CardContent className="p-4 flex-grow flex flex-col text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-400">ID #{p.id}</span>
                        <span className={`text-xs font-medium ${p.quantity === 0 ? 'text-red-500' : p.quantity < 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {p.quantity === 0 ? 'Out of stock' : `${p.quantity} in stock`}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-neutral-900 mt-2 truncate">{p.title}</h3>
                      <p className="text-neutral-400 text-xs mt-1 line-clamp-2">{p.description || 'No description.'}</p>
                    </CardContent>

                    <CardFooter className="px-4 pb-4 pt-0">
                      <span className="text-base font-semibold text-neutral-900">{formatPrice(p.price)}</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ PRODUCT DETAIL MODAL ═══ */}
      <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) setSelectedProduct(null) }}>
        <DialogContent className="max-w-2xl bg-white border-neutral-200 text-neutral-900 p-0 overflow-hidden">
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-neutral-100 aspect-square md:aspect-auto md:h-full overflow-hidden">
                <img
                  src={getImageUrl(selectedProduct.image)}
                  className="w-full h-full object-cover"
                  alt={selectedProduct.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                  }}
                />
              </div>

              <div className="p-6 flex flex-col justify-between gap-6">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs text-neutral-400">{selectedProduct.seller_username}</span>
                    <Badge
                      variant="outline"
                      className={selectedProduct.quantity === 0
                        ? 'bg-red-50 text-red-600 border-red-200 text-xs'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 text-xs'
                      }
                    >
                      {selectedProduct.quantity === 0 ? 'Sold out' : `${selectedProduct.quantity} left`}
                    </Badge>
                  </div>

                  <DialogHeader className="p-0 text-left mt-3">
                    <DialogTitle className="text-xl font-semibold text-neutral-900 leading-tight">{selectedProduct.title}</DialogTitle>
                  </DialogHeader>

                  <div className="text-2xl font-semibold text-neutral-900 mt-3">{formatPrice(selectedProduct.price)}</div>

                  <hr className="border-neutral-100 my-4" />

                  <h4 className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Description</h4>
                  <DialogDescription className="text-neutral-600 text-sm max-h-[140px] overflow-y-auto">
                    {selectedProduct.description || 'No description available.'}
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                  <Button variant="outline" className="flex-1 border-neutral-200 h-10" onClick={() => setSelectedProduct(null)}>
                    Close
                  </Button>
                  {user?.role !== 'SELLER' && (
                    <Button
                      className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 h-10"
                      disabled={selectedProduct.quantity === 0}
                      onClick={() => { handleAddToCart(selectedProduct.id); setSelectedProduct(null); }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1.5" /> Add to cart
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ ADD / EDIT PRODUCT MODAL ═══ */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); setEditingProduct(null); resetProductForm(); } }}>
        <DialogContent className="max-w-md bg-white border-neutral-200 text-neutral-900 p-6">
          <DialogHeader className="text-left mb-4">
            <DialogTitle className="text-lg font-semibold">
              {editingProduct ? 'Edit product' : 'New product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddOrEditProduct} className="space-y-4">
            <div className="space-y-1.5">
              <label className="form-label">Title</label>
              <Input
                type="text"
                required
                className="h-10 bg-white border-neutral-200"
                placeholder="Product name"
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="form-label">Price (฿)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  className="h-10 bg-white border-neutral-200"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="form-label">Stock</label>
                <Input
                  type="number"
                  required
                  min="0"
                  className="h-10 bg-white border-neutral-200"
                  placeholder="0"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Product Image</label>
              {productImagePreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 h-36 flex items-center justify-center">
                  <img
                    src={productImagePreview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center"
                      onClick={() => {
                        setProductImageFile(null)
                        setProductImagePreview('')
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <label className="h-9 w-9 bg-white hover:bg-neutral-100 text-neutral-800 rounded-full flex items-center justify-center cursor-pointer shadow-sm">
                      <Edit className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setProductImageFile(file)
                            setProductImagePreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border border-dashed border-neutral-200 hover:border-neutral-400 rounded-lg p-5 cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 transition-colors h-36">
                  <div className="flex flex-col items-center justify-center space-y-1 text-center">
                    <PlusCircle className="w-8 h-8 text-neutral-400 mb-1" />
                    <span className="text-sm font-medium text-neutral-600">Upload an image</span>
                    <span className="text-xs text-neutral-400">PNG, JPG up to 10MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setProductImageFile(file)
                        setProductImagePreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Description</label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-neutral-200 rounded-md text-neutral-700 text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 resize-none"
                placeholder="Describe your product..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-neutral-200 h-10"
                onClick={() => { setShowAddModal(false); setEditingProduct(null); resetProductForm(); }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 h-10" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-neutral-100 py-6 text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} StoreMesh</p>
        </div>
      </footer>
    </div>
  )
}

export default App
