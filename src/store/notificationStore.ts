import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchNotifications: async (userId: string) => {
      set({ isLoading: true });
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const unreadCount = data?.filter((n) => !n.is_read).length || 0;
        set({ notifications: data || [], unreadCount, isLoading: false });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        set({ isLoading: false });
      }
    },
    markAsRead: async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);

        if (error) throw error;

        const updatedNotifications = get().notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        const unreadCount = updatedNotifications.filter((n) => !n.is_read).length;
        set({ notifications: updatedNotifications, unreadCount });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    },
    markAllAsRead: async (userId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) throw error;

        const updatedNotifications = get().notifications.map((n) => ({
          ...n,
          is_read: true,
        }));
        set({ notifications: updatedNotifications, unreadCount: 0 });
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    },
    subscribeToNotifications: (userId: string) => {
      const channel = supabase
        .channel(`notifications:user_id=eq.${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            set((state) => {
              if (state.notifications.some(n => n.id === newNotification.id)) return state;
              
              const updatedNotifications = [newNotification, ...state.notifications];
              return {
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter(n => !n.is_read).length
              };
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  })
);
