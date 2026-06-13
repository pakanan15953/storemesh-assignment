import React, { useState } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Product, User } from "../../types"

interface ProductCatalogProps {
  products: Product[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  priceFilter: string
  setPriceFilter: (filter: string) => void
  loading: boolean
  user: User | null
  onSelectProduct: (product: Product) => void
  onAddToCart: (productId: number) => void
  getImageUrl: (url: string | null | undefined) => string
  formatPrice: (price: number) => string
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  searchQuery,
  setSearchQuery,
  priceFilter,
  setPriceFilter,
  loading,
  user,
  onSelectProduct,
  onAddToCart,
  getImageUrl,
  formatPrice
}) => {
  const [sortBy, setSortBy] = useState('default')

  const getFilteredProducts = () => {
    let result = products.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())

      let matchPrice = true
      if (priceFilter === 'under-1000') matchPrice = p.price < 1000
      else if (priceFilter === '1000-3000') matchPrice = p.price >= 1000 && p.price <= 3000
      else if (priceFilter === 'over-3000') matchPrice = p.price > 3000

      return matchSearch && matchPrice
    })

    // Apply sorting
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price)
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => b.id - a.id)
    }

    return result
  }

  const filtered = getFilteredProducts()

  return (
    <div className="animate-fade-in">
      {/* Header + filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
        <div className="text-left">
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-neutral-500 text-sm mt-1">Browse all available items</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
          <select
            className="h-9 px-3 bg-white border border-neutral-200 rounded-md text-neutral-600 text-sm outline-none focus:border-neutral-400 cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg space-y-3">
          <p className="text-neutral-400">No products found.</p>
          {(searchQuery || priceFilter !== 'all' || sortBy !== 'default') && (
            <Button
              variant="outline"
              size="sm"
              className="border-neutral-200 text-sm cursor-pointer"
              onClick={() => {
                setSearchQuery('')
                setPriceFilter('all')
                setSortBy('default')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid-products">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden flex flex-col group border-neutral-200 hover:border-neutral-300 transition-colors bg-white shadow-none hover:shadow-sm"
            >
              <div
                className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 relative cursor-pointer"
                onClick={() => onSelectProduct(product)}
              >
                <img
                  src={getImageUrl(product.image)}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                  }}
                />
                {product.quantity === 0 && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-500 font-medium text-xs">
                      Sold out
                    </Badge>
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
                  onClick={() => onSelectProduct(product)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-neutral-200 cursor-pointer"
                    onClick={() => onSelectProduct(product)}
                  >
                    View
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="text-xs h-8 bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
                    disabled={product.quantity === 0}
                    onClick={() => onAddToCart(product.id)}
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
  )
}
