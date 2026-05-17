'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app';
import { useNotifications, useMarkNotificationRead } from '@/lib/hooks/use-queries';
import { Bell, Clock, MessageSquare, ClipboardList, CheckCheck } from 'lucide-react';
import { timeAgo, playNotificationSound } from '@/components/pu-helpers';
import { toast } from 'sonner';

function NotificationsPage() {
  const { data: notificationsData, isLoading: loading, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const { setNotificationCount } = useAppStore();

  // Handle both old format (array) and new paginated format (object)
  const notificationList = Array.isArray(notificationsData)
    ? notificationsData
    : notificationsData?.notifications || [];

  const unreadCount = Array.isArray(notificationsData)
    ? notificationList.filter(n => !n.isRead).length
    : notificationsData?.unreadCount || 0;

  const initialLoad = useRef(true);

  useEffect(() => {
    // Only play sound on subsequent loads (new notifications), not on initial mount
    if (!initialLoad.current && notificationList.length > 0) {
      const unread = notificationList.filter(n => !n.isRead);
      if (unread.length > 0) {
        playNotificationSound();
      }
    }
    initialLoad.current = false;
  }, [notificationList.length]);

  // Sync unread count to store whenever notification data changes
  useEffect(() => {
    setNotificationCount(unreadCount);
  }, [unreadCount, setNotificationCount]);

  const markAsRead = (id: string) => {
    markRead.mutate(id);
  };

  const markAllAsRead = async () => {
    try {
      const { apiFetch } = await import('@/lib/api');
      const result = await apiFetch<{ success: boolean; markedCount: number }>('/api/notifications', {
        method: 'POST',
      });
      if (result.success) {
        toast.success(`${result.markedCount} notification${result.markedCount !== 1 ? 's' : ''} marked as read`);
        refetch();
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT': return <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'DEADLINE': return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'FEEDBACK': return <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-2 text-xs font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}</div>
      ) : notificationList.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-8 sm:py-12 text-center text-gray-400 dark:text-gray-500"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notifications yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notificationList.map((n: any) => (
            <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <Card className={`border dark:border-gray-800 cursor-pointer transition-all hover:shadow-md ${!n.isRead ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500 dark:bg-emerald-950/10 dark:border-l-emerald-400' : ''}`} onClick={() => !n.isRead && markAsRead(n.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">{getNotifIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold dark:text-gray-100 truncate">{n.title}</p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
