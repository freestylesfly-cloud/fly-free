import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
  variantId?: string;
  hamperId?: string;
  hamperName?: string;
  offerCode?: string;
  offerLabel?: string;
}

interface CartStore {
  items: CartItem[];
  loading: boolean;

  // Cart operations
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;

  // Calculations
  getSubtotal: () => number;
  getTax: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
  getItemCount: () => number;

  // Sync
  syncWithServer: (token: string) => Promise<void>;
}

const CART_KEY = 'flyfree_cart';
const TAX_RATE = 0.18; // 18% GST
const SHIPPING_FEE = 0; // Free shipping

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.size === item.size &&
            i.color === item.color &&
            i.variantId === item.variantId &&
            i.hamperId === item.hamperId &&
            i.offerCode === item.offerCode
        );

        if (existingIndex > -1) {
          // Update quantity if item exists
          items[existingIndex].quantity += item.quantity || 1;
        } else {
          // Add new item
          items.push({ ...item, quantity: item.quantity || 1 });
        }

        set({ items: [...items] });
      },

      removeItem: (productId, size, color) => {
        const items = get().items.filter(
          (i) => !(i.productId === productId && i.size === size && i.color === color)
        );
        set({ items });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }

        const items = get().items.map((item) =>
          item.productId === productId && item.size === size && item.color === color
            ? { ...item, quantity }
            : item
        );

        set({ items });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + item.price * item.quantity;
        }, 0);
      },

      getTax: () => {
        return Math.round(get().getSubtotal() * TAX_RATE);
      },

      getShippingFee: () => {
        return SHIPPING_FEE;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax() + get().getShippingFee();
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      syncWithServer: async (token: string) => {
        set({ loading: true });
        try {
          // TODO: Implement server cart sync
          // This would merge guest cart with user cart
        } catch (error) {
          console.error('Failed to sync cart:', error);
        } finally {
          set({ loading: false });
        }
      }
    }),
    {
      name: CART_KEY,
      partialize: (state) => ({
        items: state.items
      })
    }
  )
);
