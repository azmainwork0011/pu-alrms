'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app';
import { dashboardApi } from '@/lib/api';
import { LogOut } from 'lucide-react';
import { getInitials, getRoleBadgeColor } from '@/components/pu-helpers';

function ProfilePage() {
  const { user, logout } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border dark:border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xl">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                <Badge className={`mt-1 ${getRoleBadgeColor(user?.role || '')}`}>{user?.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader><CardTitle className="text-base">Account Statistics</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3"><Skeleton className="h-12 rounded-lg dark:bg-gray-800" /><Skeleton className="h-12 rounded-lg dark:bg-gray-800" /></div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3">
                {user?.role === 'STUDENT' && (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Pending</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.pendingAssignments || 0}</p></div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p><p className="text-xl font-bold text-purple-700 dark:text-purple-400">{stats.submittedCount || 0}</p></div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Average Grade</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A'}</p></div>
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p><p className="text-xl font-bold text-rose-700 dark:text-rose-400">{stats.upcomingDeadlines || 0}</p></div>
                  </>
                )}
                {user?.role === 'TEACHER' && (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Assignments</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.createdAssignments || 0}</p></div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Submissions</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.totalSubmissions || 0}</p></div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">To Grade</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.pendingGrading || 0}</p></div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Avg Marks</p><p className="text-xl font-bold text-purple-700 dark:text-purple-400">{stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A'}</p></div>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Total Users</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.totalUsers || 0}</p></div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Assignments</p><p className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.totalAssignments || 0}</p></div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Submissions</p><p className="text-xl font-bold text-purple-700 dark:text-purple-400">{stats.totalSubmissions || 0}</p></div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20"><p className="text-xs text-gray-500 dark:text-gray-400">Subjects</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.activeSubjects || 0}</p></div>
                  </>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default ProfilePage;
