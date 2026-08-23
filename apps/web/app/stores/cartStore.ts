import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiBaseUrl } from '../lib/api';

export interface CartItem {
  productId: string;
  productSlug?: string;
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
  hasHydrated: boolean;
  /** Delivery pricing, managed by admin. Rupees. */
  deliveryFee: number;
  freeDeliveryAbove: number;

  // Cart operations
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, size: string, color: string, variantId?: string, hamperId?: string, offerCode?: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number, variantId?: string, hamperId?: string, offerCode?: string) => void;
  updateProductSlug: (productId: string, productSlug: string) => void;
  clearCart: () => void;
  setHasHydrated: () => void;

  // Calculations — item total plus delivery. There is no tax line.
  getSubtotal: () => number;
  getShippingFee: () => number;
  getAmountToFreeDelivery: () => number;
  getTotal: () => number;
  getItemCount: () => number;

  loadDeliverySettings: () => Promise<void>;
}

const CART_KEY = 'flyfree_cart';
const DEFAULT_DELIVERY_FEE = 60;
const DEFAULT_FREE_ABOVE = 1000;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      hasHydrated: false,
      deliveryFee: DEFAULT_DELIVERY_FEE,
      freeDeliveryAbove: DEFAULT_FREE_ABOVE,

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

      removeItem: (productId, size, color, variantId, hamperId, offerCode) => {
        const items = get().items.filter(
          (i) =>
            !(
              i.productId === productId &&
              i.size === size &&
              i.color === color &&
              i.variantId === variantId &&
              i.hamperId === hamperId &&
              i.offerCode === offerCode
            )
        );
        set({ items });
      },

      updateQuantity: (productId, size, color, quantity, variantId, hamperId, offerCode) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color, variantId, hamperId, offerCode);
          return;
        }

        const items = get().items.map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color &&
          item.variantId === variantId &&
          item.hamperId === hamperId &&
          item.offerCode === offerCode
            ? { ...item, quantity }
            : item
        );

        set({ items });
      },

      updateProductSlug: (productId, productSlug) => {
        if (!productSlug) return;
        const items = get().items.map((item) =>
          item.productId === productId && item.productSlug !== productSlug
            ? { ...item, productSlug }
            : item
        );
        set({ items });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setHasHydrated: () => {
        set({ hasHydrated: true });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + item.price * item.quantity;
        }, 0);
      },

      getShippingFee: () => {
        const { getSubtotal, deliveryFee, freeDeliveryAbove } = get();
        if (getSubtotal() === 0) return 0;
        return getSubtotal() >= freeDeliveryAbove ? 0 : deliveryFee;
      },

      /** How much more the customer must spend to unlock free delivery. */
      getAmountToFreeDelivery: () => {
        const { getSubtotal, freeDeliveryAbove } = get();
        const remaining = freeDeliveryAbove - getSubtotal();
        return remaining > 0 ? remaining : 0;
      },

      getTotal: () => {
        return get().getSubtotal() + get().getShippingFee();
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      loadDeliverySettings: async () => {
        try {
          const response = await fetch(`${getApiBaseUrl()}/cms/settings/delivery`);
          if (!response.ok) return;
          const data = await response.json();
          set({
            deliveryFee: Number(data.deliveryFee ?? DEFAULT_DELIVERY_FEE),
            freeDeliveryAbove: Number(data.freeDeliveryAbove ?? DEFAULT_FREE_ABOVE),
          });
        } catch {
          // keep defaults
        }
      }
    }),
    {
      name: CART_KEY,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated?.();
      },
      partialize: (state) => ({
        items: state.items
      })
    }
  )
);
