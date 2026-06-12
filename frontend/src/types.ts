export interface User {
  username: string
  email: string
  role: 'BUYER' | 'SELLER'
}

export interface Product {
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

export interface CartItem {
  id: number
  product: Product
  quantity: number
}

export interface Cart {
  id: number
  buyer: string
  items: CartItem[]
}

export interface OrderItem {
  id: number
  product: number | null
  product_title: string
  product_image: string | null
  quantity: number
  unit_price: number
}

export interface Order {
  id: number
  buyer: number
  buyer_username: string
  total_price: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  items: OrderItem[]
  created_at: string
}
