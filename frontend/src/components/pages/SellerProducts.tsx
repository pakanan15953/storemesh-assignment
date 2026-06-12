import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, PlusCircle, Loader2 } from "lucide-react"
import type { Product } from "../../types"

interface SellerProductsProps {
  myProducts: Product[]
  loading: boolean
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  editingProduct: Product | null
  setEditingProduct: (product: Product | null) => void
  onSaveProduct: (formData: FormData) => Promise<void>
  onDeleteProduct: (productId: number) => void
  getImageUrl: (url: string | null | undefined) => string
  formatPrice: (price: number) => string
}

export const SellerProducts: React.FC<SellerProductsProps> = ({
  myProducts,
  loading,
  showAddModal,
  setShowAddModal,
  editingProduct,
  setEditingProduct,
  onSaveProduct,
  onDeleteProduct,
  getImageUrl,
  formatPrice
}) => {
  const [formTitle, setFormTitle] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formQuantity, setFormQuantity] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  // Sync form state when modal opens/closes or editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setFormTitle(editingProduct.title)
      setFormPrice(editingProduct.price.toString())
      setFormQuantity(editingProduct.quantity.toString())
      setFormDescription(editingProduct.description || '')
      setImageFile(null)
      setImagePreview(getImageUrl(editingProduct.image))
    } else {
      setFormTitle('')
      setFormPrice('')
      setFormQuantity('')
      setFormDescription('')
      setImageFile(null)
      setImagePreview('')
    }
  }, [editingProduct, showAddModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('title', formTitle)
    formData.append('price', parseFloat(formPrice).toString())
    formData.append('quantity', parseInt(formQuantity).toString())
    formData.append('description', formDescription)

    if (imageFile) {
      formData.append('image', imageFile)
    } else if (editingProduct && !imagePreview) {
      formData.append('image', '')
    }

    await onSaveProduct(formData)
  }

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setShowAddModal(true)
  }

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setShowAddModal(true)
  }

  const handleClose = () => {
    setShowAddModal(false)
    setEditingProduct(null)
  }

  return (
    <div className="animate-fade-in text-left">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Products</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your storefront listings</p>
        </div>
        <Button
          size="sm"
          className="bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
          onClick={handleOpenAdd}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {myProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg">
          <p className="text-neutral-400">You haven't listed any products yet.</p>
        </div>
      ) : (
        <div className="grid-products">
          {myProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden flex flex-col group border-neutral-200 hover:border-neutral-300 transition-colors bg-white shadow-none hover:shadow-sm"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 relative">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                  }}
                />
              </div>

              <CardContent className="p-4 flex-grow flex flex-col text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-400">{product.seller_username}</span>
                  <span className="text-xs text-neutral-400">{product.quantity} in stock</span>
                </div>
                <h3 className="text-sm font-medium text-neutral-900 mt-1.5 line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-neutral-400 text-xs mt-1 line-clamp-2 flex-grow">
                  {product.description || 'No description.'}
                </p>
              </CardContent>

              <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-neutral-900">{formatPrice(product.price)}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-neutral-200 cursor-pointer"
                    onClick={() => handleOpenEdit(product)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={() => onDeleteProduct(product.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent className="max-w-md bg-white border-neutral-200 text-neutral-900 p-6">
          <DialogHeader className="p-0 text-left mb-4">
            <DialogTitle className="text-lg font-semibold text-neutral-900">
              {editingProduct ? 'Edit Product Listing' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-sm font-medium text-neutral-700 block">Title</label>
              <Input
                type="text"
                required
                className="h-10 bg-white border-neutral-200"
                placeholder="Product name"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 block">Price (฿)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  className="h-10 bg-white border-neutral-200"
                  placeholder="0.00"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 block">Stock</label>
                <Input
                  type="number"
                  required
                  min="0"
                  className="h-10 bg-white border-neutral-200"
                  placeholder="0"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-sm font-medium text-neutral-700 block">Product Image</label>
              {imagePreview ? (
                <div className="relative group rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 h-36 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
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
                            setImageFile(file)
                            setImagePreview(URL.createObjectURL(file))
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
                        setImageFile(file)
                        setImagePreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-sm font-medium text-neutral-700 block">Description</label>
              <textarea
                className="w-full min-h-[80px] p-3 bg-white border border-neutral-200 rounded-md text-neutral-700 text-sm outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 resize-none"
                placeholder="Describe your product..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-neutral-200 h-10 cursor-pointer"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 h-10 cursor-pointer" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingProduct ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
