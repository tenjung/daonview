import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string | number;
  title: string;
  imageUrl?: string;
  platform: string;
  type?: string;
  provision?: string | null;
  applicants: number;
  total: number;
  dday: string;
  region?: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string | number) => void;
  clearCart: () => void;
  isInCart: (id: string | number) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const { items } = get();
        if (!items.find((i) => i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },
      
      removeItem: (id) => {
        const { items } = get();
        set({ items: items.filter((i) => i.id !== id) });
      },
      
      clearCart: () => set({ items: [] }),
      
      isInCart: (id) => {
        const { items } = get();
        return !!items.find((i) => String(i.id) === String(id));
      },
    }),
    {
      name: 'daonview-cart-storage',
    }
  )
);
