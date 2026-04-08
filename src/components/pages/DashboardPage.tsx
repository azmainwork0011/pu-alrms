'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app';
import { dashboardApi, assignmentApi, submissionApi } from '@/lib/api';
import {
  Clock, CheckCircle2, Calendar, TrendingUp, Users, FileText,
  ClipboardList, Upload, AlertTriangle, Star, Sparkles, MessageSquare,
  FlaskConical, Beaker, Bell, Trophy, BookOpen, Plus,
} from 'lucide-react';
import { AnimatedCounter, safeFormat, safeIsPast, getStatusColor, DashboardSkeleton } from '@/components/pu-helpers';

function DashboardPage() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dashData, assignData] = await Promise.all([
          dashboardApi.getStats(),
          assignmentApi.list(),
        ]);
        if (cancelled) return;
        setStats(dashData);

        const activeAssignments = Array.isArray(assignData) ? assignData.filter((a: any) => a.status === 'ACTIVE') : [];
        const upcomingAssignments = activeAssignments
          .filter((a: any) => { try { return !safeIsPast(new Date(a.deadline)); } catch { return false; } })
          .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
          .slice(0, 5);
        setUpcoming(upcomingAssignments);

        const subs = await submissionApi.list({});
        if (!cancelled) {
          const subsArray = Array.isArray(subs) ? subs : [];
          if (user?.role === 'STUDENT') {
            setRecentSubs(subsArray.slice(0, 5));
          } else if (user?.role === 'TEACHER') {
            setRecentSubs(subsArray.filter((s: any) => s.status !== 'GRADED').slice(0, 5));
          } else {
            setRecentSubs(subsArray.slice(0, 5));
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return <DashboardSkeleton />;

  const studentStats = [
    { label: 'Pending', value: stats?.pendingAssignments || 0, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Submitted', value: stats?.submittedCount || 0, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Avg. Grade', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Upcoming', value: stats?.upcomingDeadlines || 0, icon: <Calendar className="w-5 h-5" />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  const teacherStats = [
    { label: 'Created', value: stats?.createdAssignments || 0, icon: <FileText className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'To Grade', value: stats?.pendingGrading || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Avg Marks', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <Star className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  const adminStats = [
    { label: 'Users', value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Assignments', value: stats?.totalAssignments || 0, icon: <ClipboardList className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Subjects', value: stats?.activeSubjects || 0, icon: <BookOpen className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  const currentStats = user?.role === 'ADMIN' ? adminStats : user?.role === 'TEACHER' || user?.role === 'CR' ? teacherStats : studentStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {user?.role === 'STUDENT' && "Here's your academic overview"}
          {user?.role === 'TEACHER' && "Here's your teaching dashboard"}
          {user?.role === 'CR' && "Class Representative Dashboard"}
          {user?.role === 'ADMIN' && "System overview and analytics"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
          >
            <Card className="border dark:border-gray-800 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                      {typeof stat.value === 'number' ? <AnimatedCounter target={stat.value} /> : stat.value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => useAppStore.getState().setAssignmentId(a.id)}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{a.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{a.subject?.name} &middot; {a.subject?.code}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{safeFormat(new Date(a.deadline), 'MMM d')}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{differenceInDays(new Date(a.deadline), new Date())}d left</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <Card className="border dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {user?.role === 'TEACHER' ? 'Pending Grading' : 'Recent Submissions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentSubs.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">No submissions yet</p>
              ) : (
                <div className="space-y-3">
                  {recentSubs.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors" onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{s.assignment?.title || s.fileName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.student?.name ? `by ${s.student.name} \u00b7 ` : ''}{s.fileName}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${getStatusColor(s.status)}`}>
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {user?.role === 'STUDENT' && (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('assignments')}><ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><span className="text-xs">View Assignments</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('submissions')}><Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-xs">Submit Work</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /><span className="text-xs">AI Assistant</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('student-community')}><MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" /><span className="text-xs">Community</span></Button></motion.div>
                </>
              )}
              {(user?.role === 'TEACHER' || user?.role === 'CR') && (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('create-assignment')}><Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><span className="text-xs">Create Assignment</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('submissions')}><FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-xs">Grade Submissions</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /><span className="text-xs">Lucky Strick AI</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('lab-reports')}><Beaker className="w-5 h-5 text-amber-600 dark:text-amber-400" /><span className="text-xs">Lab Reports</span></Button></motion.div>
                </>
              )}
              {user?.role === 'ADMIN' && (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('assignments')}><ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><span className="text-xs">All Assignments</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('leaderboard')}><Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" /><span className="text-xs">Leaderboard</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /><span className="text-xs">AI Assistant</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('notifications')}><Bell className="w-5 h-5 text-rose-600 dark:text-rose-400" /><span className="text-xs">Notifications</span></Button></motion.div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default DashboardPage;
