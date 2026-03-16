import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/client';
import { mapCampaignToCard } from '@/lib/campaignUtils';

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
  fetchItems: (userId: string) => Promise<void>;
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

      fetchItems: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('*, campaigns(*, applications(count))')
            .eq('user_id', userId);

          if (error) throw error;

          if (data) {
            // 삭제되었거나 RLS로 인해 조회되지 않은 캠페인(favorites) 필터링 처리
            const validFavorites = data.filter((fav: any) => fav.campaigns);
            const formattedItems = validFavorites.map((fav: any) => mapCampaignToCard(fav.campaigns));
            set({ items: formattedItems });
          }
        } catch (error) {
          console.error('Error fetching favorites for cartStore:', error instanceof Error ? error.message : error);
        }
      },
    }),
    {
      name: 'daonview-cart-storage',
    }
  )
);
