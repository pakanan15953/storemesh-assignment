import React from 'react'
import { Button } from "@/components/ui/button"
import { ShoppingCart, Minus, Plus, Loader2, ArrowRight } from "lucide-react"
import type { Cart } from "../../types"

interface CartDrawerProps {
  cart: Cart | null
  loading: boolean
  onUpdateQuantity: (itemId: number, newQty: number) => void
  onRemoveItem: (itemId: number) => void
  onCheckout: () => void
  setCurrentView: (view: 'catalog' | 'cart' | 'orders' | 'my-products' | 'login' | 'register') => void
  getImageUrl: (url: string | null | undefined) => string
  formatPrice: (price: number) => string
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  cart,
  loading,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  setCurrentView,
  getImageUrl,
  formatPrice
}) => {
  const getCartCount = () => {
    if (!cart) return 0
    return cart.items.reduce((acc, item) => acc + item.quantity, 0)
  }

  return (
    <div className="max-w-4xl w-full mx-auto animate-fade-in text-left">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Shopping cart</h1>
        <p className="text-neutral-500 text-sm mt-1">Review your items before checkout</p>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg space-y-3">
          <ShoppingCart className="w-8 h-8 text-neutral-300 mx-auto" />
          <p className="text-neutral-400">Your cart is empty</p>
          <Button variant="outline" size="sm" className="border-neutral-200 text-sm cursor-pointer" onClick={() => setCurrentView('catalog')}>
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
                  <img
                    src={getImageUrl(item.product.image)}
                    className="w-full h-full object-cover"
                    alt={item.product.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                    }}
                  />
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
                      className="w-7 h-7 text-neutral-400 hover:text-neutral-900 cursor-pointer"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-neutral-400 hover:text-neutral-900 cursor-pointer"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.quantity}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <button
                    className="text-xs text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    onClick={() => onRemoveItem(item.id)}
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
              className="w-full h-10 bg-neutral-900 text-white hover:bg-neutral-800 text-sm cursor-pointer"
              disabled={loading}
              onClick={onCheckout}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <span className="flex items-center justify-center gap-1.5 w-full">
                  Checkout <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
