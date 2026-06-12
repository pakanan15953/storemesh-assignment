import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import type { Order, User } from "../../types"

interface OrderHistoryProps {
  orders: Order[]
  user: User
  getImageUrl: (url: string | null | undefined) => string
  formatPrice: (price: number) => string
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  user,
  getImageUrl,
  formatPrice
}) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200 text-xs'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 text-xs'
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto animate-fade-in text-left">
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
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-neutral-200 rounded-lg p-5 bg-white space-y-4">
              {/* Order header */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Order #{order.id}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  {user.role === 'SELLER' && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Customer: <span className="font-medium text-neutral-700">{order.buyer_username}</span>
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={getStatusStyle(order.status)}>
                  {order.status}
                </Badge>
              </div>

              {/* Order items */}
              <div className="divide-y divide-neutral-50">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={getImageUrl(item.product_image)}
                        className="w-full h-full object-cover"
                        alt={item.product_title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'
                        }}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-medium text-neutral-900 truncate">{item.product_title}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Qty: {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-neutral-900 flex-shrink-0">
                      {formatPrice(item.unit_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order total */}
              <div className="flex justify-between items-center pt-4 border-t border-neutral-100 font-semibold text-neutral-900 text-sm">
                <span>Total</span>
                <span className="text-base">{formatPrice(order.total_price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
