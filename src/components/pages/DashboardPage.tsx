'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/app';
import { dashboardApi, assignmentApi, submissionApi } from '@/lib/api';
import {
  Clock, CheckCircle2, Calendar, TrendingUp, Users, FileText,
  ClipboardList, Upload, AlertTriangle, Star, Sparkles, MessageSquare,
  Bell, Trophy, BookOpen, Plus, ArrowRight, Target, Zap,
  BarChart3, GraduationCap, ChevronRight, Flame, Award,
  CircleDot, Megaphone, Timer, Eye, Hash,
} from 'lucide-react';
import { AnimatedCounter, safeFormat, safeIsPast, getStatusColor, DashboardSkeleton, getInitials, timeAgo } from '@/components/pu-helpers';

// ─── Color Helpers ──────────────────────────────────────
function getGradeColor(marks: number) {
  if (marks >= 80) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500' };
  if (marks >= 60) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', bar: 'bg-blue-500' };
  if (marks >= 40) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500' };
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500' };
}

function DashboardPage() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

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
        setAllAssignments(Array.isArray(assignData) ? assignData : []);
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

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const role = user?.role || 'STUDENT';
  const roleColor = role === 'ADMIN' ? 'from-red-500 to-orange-500' : role === 'TEACHER' || role === 'CR' ? 'from-emerald-500 to-teal-500' : 'from-violet-500 to-purple-500';
  const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'TEACHER' ? 'Teacher' : role === 'CR' ? 'Class Representative' : 'Student';

  // Upcoming deadlines (shared across roles)
  const upcoming = role === 'STUDENT' || role === 'CR'
    ? (stats?.upcomingDeadlines || [])
    : (stats?.recentAssignments || []).filter((a: any) => a.status === 'ACTIVE').slice(0, 5);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* ─── Welcome Banner ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-5 sm:p-6 text-white shadow-lg"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-white/30 shadow-lg">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-white/20 text-white text-lg font-bold">{getInitials(user?.name || 'U')}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{greeting}, {firstName}!</h1>
              <p className="text-emerald-100 text-sm mt-0.5">
                {role === 'STUDENT' && "Here's your academic overview"}
                {role === 'TEACHER' && "Here's your teaching overview"}
                {role === 'CR' && "Class Representative Dashboard"}
                {role === 'ADMIN' && "System overview and analytics"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 text-xs px-3 py-1 backdrop-blur-sm">
              {roleLabel}
            </Badge>
            {user?.batch && (
              <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1 backdrop-blur-sm">
                {user.batch}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {(role === 'STUDENT' || role === 'CR' ? [
          { label: 'Pending', value: stats?.pendingAssignments || 0, icon: <Clock className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Assignments due' },
          { label: 'Submitted', value: stats?.submittedCount || 0, icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total submissions' },
          { label: 'Avg. Grade', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: `${stats?.gradedCount || 0} graded`, isText: true },
          { label: 'Completion', value: stats?.completionRate || 0, icon: <Target className="w-5 h-5" />, gradient: 'from-cyan-500 to-blue-500', desc: 'Overall rate', isPercent: true },
        ] : role === 'TEACHER' ? [
          { label: 'Created', value: stats?.createdAssignments || 0, icon: <FileText className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Assignments' },
          { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500', desc: 'Total received' },
          { label: 'To Grade', value: stats?.pendingGrading || 0, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Needs attention' },
          { label: 'Avg Marks', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <Star className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Student avg', isText: true },
        ] : [
          { label: 'Users', value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total registered' },
          { label: 'Assignments', value: stats?.totalAssignments || 0, icon: <ClipboardList className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500', desc: 'All active' },
          { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Total submitted' },
          { label: 'Ungraded', value: stats?.ungradedCount || 0, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Needs grading' },
        ]).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35 }}>
            <Card className="border dark:border-gray-800 hover:shadow-md transition-all hover:-translate-y-0.5 group overflow-hidden relative">
              <CardContent className="p-4">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br opacity-[0.07] dark:opacity-[0.1] rounded-bl-3xl -translate-y-0 translate-x-0">
                  <div className={`w-full h-full bg-gradient-to-br ${stat.gradient}`} />
                </div>
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.isText ? stat.value : stat.isPercent ? (
                        <span className="flex items-center gap-1.5">
                          <AnimatedCounter target={typeof stat.value === 'number' ? stat.value : 0} />
                          <span className="text-lg text-gray-400">%</span>
                        </span>
                      ) : (
                        <AnimatedCounter target={typeof stat.value === 'number' ? stat.value : 0} />
                      )}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Main Content Grid ───────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ─── Left Column (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Performance Chart / Weekly Trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border dark:border-gray-800">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {role === 'STUDENT' || role === 'CR' ? 'Weekly Performance' : role === 'TEACHER' ? 'Submission Trend' : 'Activity Trend'}
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-gray-400">Last 6 weeks</Badge>
              </CardHeader>
              <CardContent>
                <SimpleChart
                  data={
                    role === 'STUDENT' || role === 'CR'
                      ? (stats?.weeklyPerformance || []).map((w: any) => ({ label: w.week, value: w.avgMarks, sub: w.count }))
                      : role === 'TEACHER'
                        ? (stats?.weeklyTrend || []).map((w: any) => ({ label: w.week, value: w.submitted, sub: w.graded }))
                        : (stats?.weeklyTrend || []).map((w: any) => ({ label: w.week, value: w.total, sub: w.graded }))
                  }
                  maxValue={role === 'STUDENT' || role === 'CR' ? 100 : undefined}
                  label={role === 'STUDENT' || role === 'CR' ? 'Avg Marks' : role === 'TEACHER' ? 'Submissions' : 'Total'}
                  subLabel={role === 'STUDENT' || role === 'CR' ? 'Graded' : 'Graded'}
                  color={role === 'STUDENT' || role === 'CR' ? 'emerald' : role === 'TEACHER' ? 'blue' : 'violet'}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <Card className="border dark:border-gray-800">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {role === 'TEACHER' ? 'Recent Assignments' : 'Upcoming Deadlines'}
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-emerald-600 h-7" onClick={() => useAppStore.getState().setPage('assignments')}>
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-300 dark:text-emerald-700" />
                    <p className="text-sm">All caught up! No pending deadlines</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((a: any, i: number) => {
                      const daysLeft = differenceInDays(new Date(a.deadline), new Date());
                      const isUrgent = daysLeft <= 2 && daysLeft >= 0;
                      const isPast = daysLeft < 0;
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all group"
                          onClick={() => useAppStore.getState().setAssignmentId(a.id)}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-sm ${
                            isPast ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
                            isUrgent ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {isPast ? <CheckCircle2 className="w-5 h-5" /> : daysLeft}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{a.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">{a.subject?.name || a.subject?.code}</span>
                              {a._count?.submissions !== undefined && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">&middot; {a._count.submissions} submissions</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-medium ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {safeFormat(new Date(a.deadline), 'MMM d, yyyy')}
                            </p>
                            {!isPast && (
                              <p className={`text-[10px] ${isUrgent ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Recent Submissions ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="border dark:border-gray-800">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {role === 'TEACHER' ? 'Pending Grading' : role === 'ADMIN' ? 'Recent Submissions' : 'Recent Submissions'}
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-blue-600 h-7" onClick={() => useAppStore.getState().setPage('submissions')}>
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {(role === 'STUDENT' || role === 'CR' ? stats?.recentSubmissions : role === 'TEACHER' ? stats?.recentSubmissions : stats?.recentSubmissions)?.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <Upload className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(role === 'STUDENT' || role === 'CR' ? stats?.recentSubmissions : role === 'TEACHER' ? stats?.recentSubmissions : stats?.recentSubmissions)?.map((s: any, i: number) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.04 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all group"
                        onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getStatusColor(s.status)}`}>
                          {s.status === 'GRADED' ? <Star className="w-5 h-5" /> :
                           s.status === 'SUBMITTED' ? <CheckCircle2 className="w-5 h-5" /> :
                           s.status === 'LATE' ? <AlertTriangle className="w-5 h-5" /> :
                           <Clock className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{s.assignment?.title || s.fileName}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {role === 'TEACHER' && s.student?.name ? `by ${s.student.name} ${s.student?.batch ? `· ${s.student.batch}` : ''} · ` : ''}
                            {timeAgo(s.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {s.marks != null && (
                            <span className={`text-sm font-bold ${getGradeColor(s.marks).color}`}>{s.marks.toFixed(1)}%</span>
                          )}
                          <Badge variant="outline" className={`text-[10px] ${getStatusColor(s.status)}`}>
                            {s.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Right Column (1/3) ──────────────────────────── */}
        <div className="space-y-5">

          {/* ─── Quick Actions ─────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {role === 'STUDENT' && [
                  { icon: <ClipboardList className="w-4 h-4" />, label: 'Assignments', page: 'assignments', color: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: <Upload className="w-4 h-4" />, label: 'Submit Work', page: 'submissions', color: 'text-blue-600 dark:text-blue-400' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI Assistant', page: 'ai-chat', color: 'text-purple-600 dark:text-purple-400' },
                  { icon: <MessageSquare className="w-4 h-4" />, label: 'Community', page: 'student-community', color: 'text-amber-600 dark:text-amber-400' },
                ].map((action, i) => (
                  <motion.button key={action.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => useAppStore.getState().setPage(action.page as any)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                    <div className={action.color}>{action.icon}</div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{action.label}</span>
                  </motion.button>
                ))}
                {(role === 'TEACHER' || role === 'CR') && [
                  { icon: <Plus className="w-4 h-4" />, label: 'Create', page: 'create-assignment', color: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: <FileText className="w-4 h-4" />, label: 'Grade', page: 'submissions', color: 'text-blue-600 dark:text-blue-400' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI', page: 'ai-chat', color: 'text-purple-600 dark:text-purple-400' },
                  { icon: <Megaphone className="w-4 h-4" />, label: 'Announce', page: 'announcements', color: 'text-amber-600 dark:text-amber-400' },
                ].map((action, i) => (
                  <motion.button key={action.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => useAppStore.getState().setPage(action.page as any)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                    <div className={action.color}>{action.icon}</div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{action.label}</span>
                  </motion.button>
                ))}
                {role === 'ADMIN' && [
                  { icon: <ClipboardList className="w-4 h-4" />, label: 'Assignments', page: 'assignments', color: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', page: 'leaderboard', color: 'text-amber-600 dark:text-amber-400' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI', page: 'ai-chat', color: 'text-purple-600 dark:text-purple-400' },
                  { icon: <Users className="w-4 h-4" />, label: 'Users', page: 'profile', color: 'text-blue-600 dark:text-blue-400' },
                ].map((action, i) => (
                  <motion.button key={action.label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => useAppStore.getState().setPage(action.page as any)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group">
                    <div className={action.color}>{action.icon}</div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{action.label}</span>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Subject Performance (Student) ──────────────── */}
          {(role === 'STUDENT' || role === 'CR') && stats?.subjectPerformance?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    Subject Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.subjectPerformance.map((subj: any) => {
                    const rate = subj.total > 0 ? Math.round(subj.submitted / subj.total * 100) : 0;
                    const gc = getGradeColor(subj.avg);
                    return (
                      <div key={subj.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{subj.code}</p>
                            <p className="text-[10px] text-gray-400">{subj.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-gray-400">{subj.submitted}/{subj.total}</span>
                            {subj.avg > 0 && (
                              <span className={`text-[11px] font-bold ${gc.color}`}>{subj.avg}%</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                              transition={{ duration: 0.8, delay: 0.5 }}
                              className={`h-full rounded-full ${rate === 100 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Teacher: My Subjects ────────────────────────── */}
          {role === 'TEACHER' && stats?.subjects?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    My Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {stats.subjects.map((subj: any) => (
                    <div key={subj.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {subj.code.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{subj.name}</p>
                        <p className="text-[10px] text-gray-400">{subj.code}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-gray-400">{subj._count.assignments} tasks</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Admin: Top Students ─────────────────────────── */}
          {role === 'ADMIN' && stats?.topStudents?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Top Students
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-amber-600 h-7" onClick={() => useAppStore.getState().setPage('leaderboard')}>
                    All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.topStudents.map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                        i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                        i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.batch || 'No batch'} &middot; {s.totalSubs} subs</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.avgMarks}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Admin: Subjects Overview ────────────────────── */}
          {role === 'ADMIN' && stats?.activeSubjects?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {stats.activeSubjects.map((subj: any) => (
                    <div key={subj.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {subj.code.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{subj.name}</p>
                        <p className="text-[10px] text-gray-400">{subj.teacherName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-gray-400">{subj.assignmentCount} tasks</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Admin: User Distribution ────────────────────── */}
          {role === 'ADMIN' && stats?.usersByRole && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    User Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.usersByRole.map((r: any) => {
                    const total = stats.usersByRole.reduce((a: any, b: any) => a + b.count, 0);
                    const pct = Math.round(r.count / total * 100);
                    const colorMap: Record<string, string> = {
                      STUDENT: 'bg-amber-500',
                      TEACHER: 'bg-emerald-500',
                      CR: 'bg-violet-500',
                      ADMIN: 'bg-red-500',
                    };
                    return (
                      <div key={r.role} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.role}</span>
                          <span className="text-xs text-gray-400">{r.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5 }}
                            className={`h-full rounded-full ${colorMap[r.role] || 'bg-gray-400'}`} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Announcements ────────────────────────────────── */}
          {stats?.recentAnnouncements?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Announcements
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-rose-600 h-7" onClick={() => useAppStore.getState().setPage('announcements')}>
                    All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {stats.recentAnnouncements.map((a: any) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] ${a.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800' : a.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200' : 'border-gray-200 dark:border-gray-700'}`}>
                          {a.priority || 'NORMAL'}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{a.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{a.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Unread Notifications (Student) ──────────────── */}
          {(role === 'STUDENT' || role === 'CR') && stats?.recentNotifications?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Notifications
                    <Badge className="bg-red-500 text-white text-[10px] px-1.5 h-4">{stats.recentNotifications.length}</Badge>
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-amber-600 h-7" onClick={() => useAppStore.getState().setPage('notifications')}>
                    All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.recentNotifications.map((n: any) => (
                    <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{n.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Performance Highlights (Student) ────────────── */}
          {(role === 'STUDENT' || role === 'CR') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                    <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Completion Rate</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{stats?.completionRate || 0}% of all assignments submitted</p>
                    </div>
                  </div>
                  {stats?.maxMarks > 0 && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/10">
                      <Star className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Best Grade</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{stats.maxMarks.toFixed(1)}% — Keep it up!</p>
                      </div>
                    </div>
                  )}
                  {stats?.averageMarks > 70 && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                      <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Top Performer</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Average above 70% — Great work!</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

// ═══════════════════════════════════════════════════════════
// Simple Bar Chart (no external library needed)
// ═══════════════════════════════════════════════════════════
function SimpleChart({ data, maxValue, label, subLabel, color }: {
  data: { label: string; value: number; sub: number }[];
  maxValue?: number;
  label: string;
  subLabel: string;
  color: string;
}) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const colorMap: Record<string, { bar: string; sub: string }> = {
    emerald: { bar: 'bg-gradient-to-t from-emerald-600 to-emerald-400', sub: 'bg-gradient-to-t from-teal-600 to-teal-400' },
    blue: { bar: 'bg-gradient-to-t from-blue-600 to-blue-400', sub: 'bg-gradient-to-t from-cyan-600 to-cyan-400' },
    violet: { bar: 'bg-gradient-to-t from-violet-600 to-violet-400', sub: 'bg-gradient-to-t from-purple-600 to-purple-400' },
    amber: { bar: 'bg-gradient-to-t from-amber-600 to-amber-400', sub: 'bg-gradient-to-t from-orange-600 to-orange-400' },
  };
  const colors = colorMap[color] || colorMap.emerald;

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${colors.bar}`} />
          <span className="text-[10px] text-gray-500">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${colors.sub}`} />
          <span className="text-[10px] text-gray-500">{subLabel}</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 w-full h-24">
              {d.sub > 0 && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${Math.max((d.sub / max) * 100, 4)}%` }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                  className={`flex-1 rounded-t-sm ${colors.sub} opacity-60 min-h-[4px]`}
                  title={`${subLabel}: ${d.sub}`}
                />
              )}
              {d.value > 0 && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.08 }}
                  className={`flex-1 rounded-t-sm ${colors.bar} min-h-[4px]`}
                  title={`${label}: ${d.value}`}
                />
              )}
              {d.value === 0 && d.sub === 0 && (
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-sm" />
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-semibold">
              {d.value > 0 ? (maxValue ? `${d.value}` : d.value) : '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
