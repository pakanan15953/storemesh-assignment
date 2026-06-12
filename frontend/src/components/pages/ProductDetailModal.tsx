import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ShoppingCart } from "lucide-react"
import type { Product, User } from "../../types"

interface ProductDetailModalProps {
  selectedProduct: Product | null
  onClose: () => void
  user: User | null
  onAddToCart: (productId: number) => void
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
  return (
    <Dialog open={selectedProduct !== null} onOpenChange={(open) => { if (!open) onClose() }}>
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

                <h4 className="text-xs text-neutral-400 uppercase tracking-wider mb-1 text-left">Description</h4>
                <DialogDescription className="text-neutral-600 text-sm max-h-[140px] overflow-y-auto text-left">
                  {selectedProduct.description || 'No description available.'}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                <Button variant="outline" className="flex-1 border-neutral-200 h-10 cursor-pointer" onClick={onClose}>
                  Close
                </Button>
                {user?.role !== 'SELLER' && (
                  <Button
                    className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 h-10 cursor-pointer"
                    disabled={selectedProduct.quantity === 0}
                    onClick={() => { onAddToCart(selectedProduct.id); onClose(); }}
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
  )
}
