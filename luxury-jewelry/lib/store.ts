import { create } from 'zustand';

export interface Product {
  sku: string;
  brand: string;
  name: string;
  price: number;
  denomination?: string;
  type?: 'gift-card';
  stock: number;
  images: string[];
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  publicKey: string | null;
  setPublicKey: (key: string | null) => void;
  addItem: (product: Product) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  publicKey: null,
  setPublicKey: (key) => set({ publicKey: key }),

  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.sku === product.sku);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },

  removeItem: (sku) => {
    set({ items: get().items.filter((item) => item.sku !== sku) });
  },

  updateQuantity: (sku, quantity) => {
    if (quantity <= 0) {
      get().removeItem(sku);
    } else {
      set({
        items: get().items.map((item) =>
          item.sku === sku ? { ...item, quantity } : item
        ),
      });
    }
  },

  clearCart: () => set({ items: [] }),

  toggleCart: () => set({ isOpen: !get().isOpen }),

  openCart: () => set({ isOpen: true }),

  closeCart: () => set({ isOpen: false }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
