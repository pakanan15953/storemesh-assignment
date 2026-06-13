import React, { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Package, Receipt, ShoppingCart, Printer } from "lucide-react"
import type { Order, User } from "../../types"

interface OrderHistoryProps {
  orders: Order[]
  user: User
  getImageUrl: (url: string | null | undefined) => string
  formatPrice: (price: number) => string
  onAddToCart: (productId: number, quantity?: number) => void
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  user,
  getImageUrl,
  formatPrice,
  onAddToCart
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL')
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null)

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200 text-xs font-medium'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium'
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true
    return o.status === activeTab
  })

  return (
    <div className="animate-fade-in text-left">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {user.role === 'BUYER' ? 'Order history' : 'Customer orders'}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {user.role === 'BUYER' ? 'Track and manage your past purchases' : 'View and manage orders from your store'}
        </p>
      </div>

      {/* Tabs for Order Status */}
      <div className="flex border-b border-neutral-200 mb-6 gap-2">
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            className={`pb-2.5 px-3 text-xs font-semibold tracking-wider uppercase border-b-2 cursor-pointer transition-all -mb-[1px] ${
              activeTab === tab
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-lg">
          <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-neutral-400">No {activeTab.toLowerCase()} orders found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border border-neutral-200 rounded-lg p-5 bg-white space-y-4 shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-sm font-medium text-neutral-900">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
                      {user.role === 'BUYER' && item.product && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[10px] uppercase tracking-wider font-semibold border-neutral-200 cursor-pointer flex items-center gap-1 hover:bg-neutral-50"
                          onClick={() => onAddToCart(item.product!, item.quantity)}
                        >
                          <ShoppingCart className="w-3 h-3" /> Buy Again
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order total & Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
                <div className="text-sm">
                  <span className="text-neutral-500 font-medium mr-1">Total:</span>
                  <span className="text-base font-semibold text-neutral-900">{formatPrice(order.total_price)}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 border-neutral-200 cursor-pointer flex items-center gap-1.5"
                    onClick={() => setSelectedInvoice(order)}
                  >
                    <Receipt className="w-3.5 h-3.5 text-neutral-500" /> View Invoice
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Invoice Modal Dialog ── */}
      <Dialog open={selectedInvoice !== null} onOpenChange={(open) => { if (!open) setSelectedInvoice(null) }}>
        <DialogContent className="max-w-md bg-white border-neutral-200 text-neutral-900 p-6 overflow-hidden">
          {selectedInvoice && (
            <div className="space-y-6 text-left" id="print-area">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#863bff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <h3 className="font-serif font-bold text-lg tracking-wider text-neutral-900 uppercase">StoreMesh</h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Digital Storemesh Co., Ltd.<br />
                    INC1-217 Klong Luang, Pathum Thani
                  </p>
                </div>
                <div className="text-right pr-8">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">E-Receipt</h2>
                  <p className="text-[10px] font-mono text-neutral-400 mt-1">#ORD-2026-{selectedInvoice.id}</p>
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-400 block">Billed To:</span>
                  <span className="font-semibold text-neutral-800">
                    {user.role === 'BUYER' ? user.username : selectedInvoice.buyer_username}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 block">Date & Time:</span>
                  <span className="font-medium text-neutral-800">
                    {new Date(selectedInvoice.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-neutral-100 rounded-md overflow-hidden bg-neutral-50/50">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100/70 border-b border-neutral-100 text-neutral-700">
                      <th className="p-2.5 font-semibold">Item</th>
                      <th className="p-2.5 font-semibold text-center">Qty</th>
                      <th className="p-2.5 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-600">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium text-neutral-900 truncate max-w-[150px]">
                          {item.product_title}
                        </td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right font-semibold text-neutral-900">
                          {formatPrice(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Details */}
              <div className="space-y-1.5 text-xs border-t border-neutral-100 pt-4">
                <div className="flex justify-between text-neutral-400">
                  <span>Shipping & Handling</span>
                  <span className="text-emerald-600 font-semibold uppercase">Free</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Payment Method</span>
                  <span className="font-medium">Mock Wallet Balance</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-100/60">
                  <span>Total Amount Paid</span>
                  <span className="text-base text-[#863bff]">{formatPrice(selectedInvoice.total_price)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                <Button
                  variant="outline"
                  className="flex-1 border-neutral-200 h-9 cursor-pointer text-xs flex items-center gap-1.5"
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5 text-neutral-500" /> Print
                </Button>
                <Button
                  className="flex-grow bg-neutral-900 text-white hover:bg-neutral-800 h-9 cursor-pointer text-xs"
                  onClick={() => setSelectedInvoice(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
