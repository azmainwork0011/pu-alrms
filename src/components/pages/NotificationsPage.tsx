'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app';
import { notificationApi } from '@/lib/api';
import { Bell, Clock, MessageSquare, ClipboardList } from 'lucide-react';
import { timeAgo, playNotificationSound } from '@/components/pu-helpers';

function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setNotificationCount } = useAppStore();

  const initialLoad = useRef(true);

  useEffect(() => {
    notificationApi.list().then((data) => {
      setNotifications(Array.isArray(data) ? data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Only play sound on subsequent loads (new notifications), not on initial mount
    if (!initialLoad.current && notifications.length > 0) {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length > 0) {
        playNotificationSound();
      }
    }
    initialLoad.current = false;
  }, [notifications.length]);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setNotificationCount(notifications.filter(n => !n.isRead && n.id !== id).length);
    } catch (err) {
      console.error(err);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}</div>
      ) : notifications.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-8 sm:py-12 text-center text-gray-400 dark:text-gray-500"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notifications yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
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
