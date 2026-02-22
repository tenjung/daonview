import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';

type NotificationEntityType = 'campaign' | 'application' | 'review' | 'system' | 'notice' | null;

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  entity_type?: NotificationEntityType;
  entity_id?: number | null;
  priority?: number | null;
  seen_at?: string | null;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notification: Notification, userId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
}

function extractCampaignIdFromLink(link: string | null): number | null {
  if (!link) return null;

  const pathMatch = link.match(/\/campaigns\/(\d+)/);
  if (pathMatch?.[1]) {
    const id = Number(pathMatch[1]);
    return Number.isFinite(id) ? id : null;
  }

  const queryMatch = link.match(/[?&]id=(\d+)/);
  if (queryMatch?.[1]) {
    const id = Number(queryMatch[1]);
    return Number.isFinite(id) ? id : null;
  }

  return null;
}

function normalizeNotification(raw: Record<string, unknown>): Notification {
  const entityType = typeof raw.entity_type === 'string' ? raw.entity_type as NotificationEntityType : null;
  const entityIdRaw = raw.entity_id;
  const entityId =
    typeof entityIdRaw === 'number'
      ? entityIdRaw
      : typeof entityIdRaw === 'string' && entityIdRaw.trim() !== ''
        ? Number(entityIdRaw)
        : null;
  const priorityRaw = raw.priority;
  const priority =
    typeof priorityRaw === 'number'
      ? priorityRaw
      : typeof priorityRaw === 'string' && priorityRaw.trim() !== ''
        ? Number(priorityRaw)
        : null;

  return {
    id: String(raw.id ?? ''),
    user_id: String(raw.user_id ?? ''),
    type: String(raw.type ?? 'SYSTEM'),
    title: String(raw.title ?? ''),
    content: typeof raw.content === 'string' ? raw.content : null,
    link: typeof raw.link === 'string' ? raw.link : null,
    is_read: Boolean(raw.is_read),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    entity_type: entityType,
    entity_id: Number.isFinite(entityId) ? entityId : null,
    priority: Number.isFinite(priority) ? priority : null,
    seen_at: typeof raw.seen_at === 'string' ? raw.seen_at : null,
  };
}

function getEntityForNotification(notification: Notification): { entityType: NotificationEntityType; entityId: number | null } {
  if (notification.entity_type === 'campaign' && notification.entity_id) {
    return { entityType: 'campaign', entityId: notification.entity_id };
  }

  const campaignId = extractCampaignIdFromLink(notification.link);
  if (campaignId) {
    return { entityType: 'campaign', entityId: campaignId };
  }

  return { entityType: null, entityId: null };
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

        const normalized = (data || []).map((item) => normalizeNotification(item as Record<string, unknown>));
        const unreadCount = normalized.filter((n) => !n.is_read).length;
        set({ notifications: normalized, unreadCount, isLoading: false });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        set({ isLoading: false });
      }
    },
    markAsRead: async (notification: Notification, userId: string) => {
      const now = new Date().toISOString();
      const { entityType, entityId } = getEntityForNotification(notification);

      try {
        if (entityType === 'campaign' && entityId) {
          const updatePayload = { is_read: true, seen_at: now };

          const { error: byEntityError } = await supabase
            .from('notifications')
            .update(updatePayload)
            .eq('user_id', userId)
            .eq('entity_type', 'campaign')
            .eq('entity_id', entityId);

          if (byEntityError) {
            const { error: byLinkError } = await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('user_id', userId)
              .or(`link.ilike.%/campaigns/${entityId}%,link.ilike.%id=${entityId}%`);

            if (byLinkError) throw byLinkError;
          }
        } else {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, seen_at: now })
            .eq('id', notification.id);

          if (error) {
            const { error: fallbackError } = await supabase
              .from('notifications')
              .update({ is_read: true })
              .eq('id', notification.id);

            if (fallbackError) throw fallbackError;
          }
        }

        const updatedNotifications = get().notifications.map((n) => {
          if (entityType === 'campaign' && entityId) {
            const entity = getEntityForNotification(n);
            const sameCampaign = entity.entityType === 'campaign' && entity.entityId === entityId;
            if (sameCampaign) {
              return { ...n, is_read: true, seen_at: now, entity_type: 'campaign', entity_id: entityId };
            }
          }

          if (n.id === notification.id) {
            return { ...n, is_read: true, seen_at: now };
          }

          return n;
        });

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
          .update({ is_read: true, seen_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) {
          const { error: fallbackError } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

          if (fallbackError) throw fallbackError;
        }

        const updatedNotifications = get().notifications.map((n) => ({
          ...n,
          is_read: true,
          seen_at: n.seen_at || new Date().toISOString(),
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
            const newNotification = normalizeNotification(payload.new as Record<string, unknown>);
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
