import React, { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ShoppingCart, Minus, Plus, Star } from "lucide-react"
import type { Product, User } from "../../types"

interface ProductDetailModalProps {
  selectedProduct: Product | null
  onClose: () => void
  user: User | null
  onAddToCart: (productId: number, quantity?: number) => void
  getImageUrl: (url: string | null | undefined) => string
  formatPrice: (price: number) => string
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  selectedProduct,
  onClose,
  user,
  onAddToCart,
  getImageUrl,
  formatPrice
}) => {
  const [quantity, setQuantity] = useState(1)

  // Reset quantity to 1 when a new product is selected
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1)
    }
  }, [selectedProduct?.id])

  const getStockBadgeClass = (qty: number) => {
    if (qty === 0) return 'bg-red-50 text-red-600 border-red-200 text-xs'
    if (qty <= 3) return 'bg-amber-50 text-amber-600 border-amber-200 text-xs animate-pulse font-medium'
    return 'bg-emerald-50 text-emerald-600 border-emerald-200 text-xs font-medium'
  }

  const getStockBadgeText = (qty: number) => {
    if (qty === 0) return 'Sold out'
    if (qty <= 3) return `Only ${qty} left - Low stock!`
    return `${qty} in stock`
  }

  return (
    <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl bg-white border-neutral-200 text-neutral-900 p-0 overflow-hidden">
        {selectedProduct && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Product Image */}
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

            {/* Right: Product Details */}
            <div className="p-6 flex flex-col justify-between gap-6">
              <div>
                <div className="flex justify-between items-center gap-2 pr-8">
                  <span className="text-xs text-neutral-400">{selectedProduct.seller_username}</span>
                  <Badge
                    variant="outline"
                    className={getStockBadgeClass(selectedProduct.quantity)}
                  >
                    {getStockBadgeText(selectedProduct.quantity)}
                  </Badge>
                </div>

                <DialogHeader className="p-0 text-left mt-3 pr-8">
                  <DialogTitle className="text-xl font-semibold text-neutral-900 leading-tight">
                    {selectedProduct.title}
                  </DialogTitle>
                </DialogHeader>

                {/* Mock Review Stars for Visual Richness */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current opacity-30" />
                  </div>
                  <span className="text-xs text-neutral-400 font-medium">4.0 (15 reviews)</span>
                </div>

                <div className="text-2xl font-semibold text-neutral-900 mt-4">
                  {formatPrice(selectedProduct.price)}
                </div>

                <hr className="border-neutral-100 my-4" />

                <h4 className="text-xs text-neutral-400 uppercase tracking-wider mb-1 text-left">Description</h4>
                <DialogDescription className="text-neutral-600 text-sm max-h-[120px] overflow-y-auto text-left">
                  {selectedProduct.description || 'No description available.'}
                </DialogDescription>
              </div>

              <div className="space-y-4">
                {/* Quantity Selector - Only for Buyers and if items are in stock */}
                {selectedProduct.quantity > 0 && user?.role !== 'SELLER' && (
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-neutral-100">
                    <span className="text-sm font-medium text-neutral-700">Quantity</span>
                    <div className="flex items-center border border-neutral-200 rounded-md bg-white">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-neutral-400 hover:text-neutral-900 cursor-pointer rounded-r-none"
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold text-neutral-900">{quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-neutral-400 hover:text-neutral-900 cursor-pointer rounded-l-none"
                        onClick={() => setQuantity(prev => Math.min(selectedProduct.quantity, prev + 1))}
                        disabled={quantity >= selectedProduct.quantity}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                  <Button variant="outline" className="flex-1 border-neutral-200 h-10 cursor-pointer text-sm" onClick={onClose}>
                    Close
                  </Button>
                  {user?.role !== 'SELLER' && (
                    <Button
                      className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 h-10 cursor-pointer text-sm"
                      disabled={selectedProduct.quantity === 0}
                      onClick={() => { onAddToCart(selectedProduct.id, quantity); onClose(); }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1.5" /> Add to cart
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
