export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
  variant: {
    id: string;
    color: string;
    size: string;
  };
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderId: string;
  items: OrderItem[];
  status: 'PLACED' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: Address;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  variant: {
    color: string;
    size: string;
  };
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  provider: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  amount: number;
}
