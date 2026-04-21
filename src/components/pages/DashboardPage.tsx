'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppStore, type PageView } from '@/store/app';
import { useDashboard } from '@/lib/hooks/use-queries';
import {
  Clock, CheckCircle2, Calendar, TrendingUp, Users, FileText,
  ClipboardList, Upload, AlertTriangle, Star, Sparkles, MessageSquare,
  Trophy, BookOpen, Plus, ArrowRight, Target, BarChart3, GraduationCap,
  ChevronRight, Megaphone, Swords, Library,
} from 'lucide-react';
import {
  AnimatedCounter, safeFormat, getStatusColor,
  DashboardSkeleton, getInitials, timeAgo,
} from '@/components/pu-helpers';

// ═══════════════════════════════════════════════════════════
// HOOKS & HELPERS
// ═══════════════════════════════════════════════════════════

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setIsInView(true); observer.unobserve(el); }
    }, { threshold: 0.1, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, isInView };
}

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isInView } = useInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function getGradeColor(marks: number) {
  if (marks >= 80) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
  if (marks >= 60) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
  if (marks >= 40) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' };
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

function navigateTo(page: PageView) { useAppStore.getState().setPage(page); }

// ═══════════════════════════════════════════════════════════
// SIMPLE CHART (bar chart with useInView)
// ═══════════════════════════════════════════════════════════

function SimpleChart({ data, maxValue, label, subLabel, color }: {
  data: { label: string; value: number; sub: number }[];
  maxValue?: number; label: string; subLabel: string; color: string;
}) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const cm: Record<string, { bar: string; sub: string }> = {
    emerald: { bar: 'bg-gradient-to-t from-emerald-600 to-emerald-300', sub: 'bg-gradient-to-t from-teal-600 to-teal-300' },
    blue: { bar: 'bg-gradient-to-t from-blue-600 to-blue-300', sub: 'bg-gradient-to-t from-cyan-600 to-cyan-300' },
    violet: { bar: 'bg-gradient-to-t from-violet-600 to-violet-300', sub: 'bg-gradient-to-t from-purple-600 to-purple-300' },
  };
  const c = cm[color] || cm.emerald;
  const { ref, isInView } = useInView({ threshold: 0.2 });

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-sm ${c.bar}`} /><span className="text-[10px] text-gray-500">{label}</span></div>
        <div className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-sm ${c.sub}`} /><span className="text-[10px] text-gray-500">{subLabel}</span></div>
      </div>
      <div className="flex items-end gap-2 h-36">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-end gap-0.5 w-full h-28 relative group">
              <motion.div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {d.value > 0 ? (maxValue ? `${d.value}%` : d.value) : '-'}
              </motion.div>
              {d.sub > 0 && (
                <motion.div initial={{ height: 0 }} animate={isInView ? { height: `${Math.max((d.sub / max) * 100, 4)}%` } : {}} transition={{ duration: 0.7, delay: i * 0.08 }} className={`flex-1 rounded-t-md ${c.sub} opacity-50 min-h-[4px]`} />
              )}
              {d.value > 0 && (
                <motion.div initial={{ height: 0 }} animate={isInView ? { height: `${Math.max((d.value / max) * 100, 4)}%` } : {}} transition={{ duration: 0.7, delay: i * 0.08 + 0.04 }} className={`flex-1 rounded-t-md ${c.bar} min-h-[4px]`} />
              )}
              {d.value === 0 && d.sub === 0 && <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded" />}
            </div>
            <span className="text-[10px] text-gray-400 truncate max-w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DEADLINE ROW
// ═══════════════════════════════════════════════════════════

function DeadlineRow({ a, index }: { a: any; index: number }) {
  const daysLeft = differenceInDays(new Date(a.deadline), new Date());
  const isUrgent = daysLeft <= 2 && daysLeft >= 0;
  const isPast = daysLeft < 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      className="flex items-center gap-2 sm:gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
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
          {a.subject && <span className="text-[11px] text-gray-400">{a.subject.name || a.subject.code}</span>}
          {a._count?.submissions !== undefined && <span className="text-[10px] text-gray-400">&middot; {a._count.submissions} subs</span>}
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
      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-gray-400">
      <Icon className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════

function SectionHeader({ icon: Icon, title, iconColor, action }: {
  icon: React.ElementType; title: string; iconColor?: string;
  action?: { label: string; page: PageView };
}) {
  return (
    <CardHeader className="pb-2 flex-row items-center justify-between">
      <CardTitle className="text-sm font-semibold flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor || 'text-gray-500'}`} />
        {title}
      </CardTitle>
      {action && (
        <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-emerald-600 h-8 px-2"
          onClick={() => navigateTo(action.page)}>
          {action.label} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </CardHeader>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════

function DashboardPage() {
  const { user } = useAppStore();
  const { data: stats, isLoading: loading } = useDashboard();
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  if (loading) return <DashboardSkeleton />;

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const role = user?.role || 'STUDENT';
  const isStudent = role === 'STUDENT' || role === 'CR';
  const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'TEACHER' ? 'Teacher' : role === 'CR' ? 'Class Rep' : 'Student';
  const submissions = stats?.recentSubmissions || [];

  // Derive upcoming deadlines
  const upcoming = isStudent
    ? (stats?.upcomingDeadlines || [])
    : (stats?.recentAssignments || []).filter((a: any) => a.status === 'ACTIVE').slice(0, 5);

  // Chart data
  const chartData = isStudent
    ? (stats?.weeklyPerformance || []).map((w: any) => ({ label: w.week, value: w.avgMarks, sub: w.count }))
    : (stats?.weeklyTrend || []).map((w: any) => ({ label: w.week, value: role === 'TEACHER' ? w.submitted : w.total, sub: w.graded }));
  const chartLabel = isStudent ? 'Avg Marks' : role === 'TEACHER' ? 'Submissions' : 'Total';

  // Quick actions per role
  const quickActions: { icon: React.ReactNode; label: string; page: PageView; gradient: string }[] = isStudent
    ? [
        { icon: <GraduationCap className="w-4 h-4" />, label: 'Quiz', page: 'quiz', gradient: 'from-violet-500 to-purple-600' },
        { icon: <Swords className="w-4 h-4" />, label: 'Learn With Game', page: 'code-quest', gradient: 'from-rose-500 to-pink-600' },
        { icon: <Sparkles className="w-4 h-4" />, label: 'AI Assistant', page: 'ai-chat', gradient: 'from-purple-500 to-fuchsia-600' },
        { icon: <Library className="w-4 h-4" />, label: 'Library', page: 'books', gradient: 'from-cyan-500 to-teal-600' },
        { icon: <MessageSquare className="w-4 h-4" />, label: 'Community', page: 'student-community', gradient: 'from-amber-500 to-orange-600' },
        { icon: <FileText className="w-4 h-4" />, label: 'Assignments', page: 'assignments', gradient: 'from-emerald-500 to-green-600' },
      ]
    : role === 'TEACHER'
      ? [
          { icon: <Plus className="w-4 h-4" />, label: 'Create Assignment', page: 'create-assignment', gradient: 'from-emerald-500 to-teal-600' },
          { icon: <FileText className="w-4 h-4" />, label: 'Grade Submissions', page: 'submissions', gradient: 'from-blue-500 to-cyan-600' },
          { icon: <Sparkles className="w-4 h-4" />, label: 'AI Assistant', page: 'ai-chat', gradient: 'from-purple-500 to-fuchsia-600' },
          { icon: <Library className="w-4 h-4" />, label: 'Library', page: 'books', gradient: 'from-cyan-500 to-teal-600' },
          { icon: <Megaphone className="w-4 h-4" />, label: 'Announcements', page: 'announcements', gradient: 'from-amber-500 to-orange-600' },
          { icon: <GraduationCap className="w-4 h-4" />, label: 'Quiz', page: 'quiz', gradient: 'from-violet-500 to-purple-600' },
        ]
      : [
          { icon: <Megaphone className="w-4 h-4" />, label: 'Announcements', page: 'announcements', gradient: 'from-amber-500 to-orange-600' },
          { icon: <Sparkles className="w-4 h-4" />, label: 'AI Assistant', page: 'ai-chat', gradient: 'from-purple-500 to-fuchsia-600' },
          { icon: <Library className="w-4 h-4" />, label: 'Library', page: 'books', gradient: 'from-cyan-500 to-teal-600' },
          { icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', page: 'leaderboard', gradient: 'from-yellow-500 to-amber-600' },
          { icon: <GraduationCap className="w-4 h-4" />, label: 'Quiz', page: 'quiz', gradient: 'from-violet-500 to-purple-600' },
          { icon: <Swords className="w-4 h-4" />, label: 'Learn With Game', page: 'code-quest', gradient: 'from-rose-500 to-pink-600' },
        ];

  // Stats cards per role
  const statCards = isStudent
    ? [
        { label: 'Pending', value: stats?.pendingAssignments || 0, icon: <Clock className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Assignments due' },
        { label: 'Submitted', value: stats?.submittedCount || 0, icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total submissions' },
        { label: 'Avg. Grade', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: `${stats?.gradedCount || 0} graded`, isText: true },
        { label: 'Completion', value: stats?.completionRate || 0, icon: <Target className="w-5 h-5" />, gradient: 'from-cyan-500 to-blue-500', desc: 'Overall rate', isPercent: true },
      ]
    : role === 'TEACHER'
      ? [
          { label: 'Created', value: stats?.createdAssignments || 0, icon: <FileText className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Assignments' },
          { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500', desc: 'Total received' },
          { label: 'To Grade', value: stats?.pendingGrading || 0, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Needs attention' },
          { label: 'Avg Marks', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <Star className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Student avg', isText: true },
        ]
      : [
          { label: 'Users', value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total registered' },
          { label: 'Assignments', value: stats?.totalAssignments || 0, icon: <ClipboardList className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500', desc: 'All active' },
          { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Total submitted' },
          { label: 'Ungraded', value: stats?.ungradedCount || 0, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Needs grading' },
        ];

  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)] min-w-0 overflow-x-hidden">

      {/* ═══ 1. WELCOME BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-4 sm:p-5 text-white shadow-lg shadow-emerald-500/10"
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-12 h-12 border-2 border-white/30 shadow-lg ring-2 ring-white/10 shrink-0">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-white/20 text-white font-bold backdrop-blur-sm">{getInitials(user?.name || 'U')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{greeting}, {firstName}!</h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                {safeFormat(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className="bg-white/20 text-white border-white/30 text-xs px-3 py-1 backdrop-blur-sm">{roleLabel}</Badge>
            {user?.batch && <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1 backdrop-blur-sm">{user.batch}</Badge>}
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. QUICK ACTIONS ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickActions.map((a) => (
            <motion.button key={a.page} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigateTo(a.page)}
              className={`flex items-center gap-2 px-3.5 py-3 rounded-xl bg-gradient-to-r ${a.gradient} text-white shadow-sm hover:shadow-md transition-all shrink-0 text-xs sm:text-sm font-medium`}
            >
              {a.icon} <span className="whitespace-nowrap">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ═══ 3. STATS GRID ═══ */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" variants={stagger} initial="hidden" animate="visible">
        {statCards.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <Card className="hover:-translate-y-1 transition-all duration-300 border dark:border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium truncate">{s.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {s.isText ? s.value : s.isPercent ? (
                        <span className="flex items-center gap-1"><AnimatedCounter target={typeof s.value === 'number' ? s.value : 0} /><span className="text-lg text-gray-400">%</span></span>
                      ) : <AnimatedCounter target={typeof s.value === 'number' ? s.value : 0} />}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${s.gradient} text-white shadow-sm`}>{s.icon}</div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">{s.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ 4. MAIN GRID (60/40 on desktop) ═══ */}
      <div className="grid lg:grid-cols-5 gap-4 md:gap-5 min-w-0">
        {/* Left Column (3/5) */}
        <div className="lg:col-span-3 space-y-4 md:space-y-5 min-w-0">

          {/* Performance Chart */}
          <ScrollReveal>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={BarChart3} title={isStudent ? 'Weekly Performance' : role === 'TEACHER' ? 'Submission Trend' : 'Activity Trend'} iconColor="text-emerald-600 dark:text-emerald-400" />
              <CardContent>
                {chartData.length > 0 ? (
                  <SimpleChart data={chartData} maxValue={isStudent ? 100 : undefined} label={chartLabel} subLabel="Graded" color={isStudent ? 'emerald' : role === 'TEACHER' ? 'blue' : 'violet'} />
                ) : <EmptyState icon={BarChart3} message="No performance data yet" />}
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Upcoming Deadlines / Recent Assignments */}
          <ScrollReveal delay={0.1}>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={Calendar} title={role === 'TEACHER' ? 'Recent Assignments' : 'Upcoming Deadlines'} iconColor="text-amber-600 dark:text-amber-400" action={{ label: 'View All', page: 'assignments' }} />
              <CardContent>
                {upcoming.length === 0 ? <EmptyState icon={CheckCircle2} message="All caught up! No pending deadlines" /> : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">{upcoming.map((a: any, i: number) => <DeadlineRow key={a.id} a={a} index={i} />)}</div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5 min-w-0">

          {/* Announcements */}
          {(stats?.recentAnnouncements?.length || 0) > 0 && (
            <ScrollReveal delay={0.05}>
              <Card className="border dark:border-gray-800">
                <SectionHeader icon={Megaphone} title="Announcements" iconColor="text-rose-600 dark:text-rose-400" action={{ label: 'All', page: 'announcements' }} />
                <CardContent className="space-y-2.5">
                  {stats.recentAnnouncements.slice(0, 3).map((a: any) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${a.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200' : a.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200' : ''}`}>
                          {a.priority || 'NORMAL'}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{a.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{a.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>
          )}

          {/* Recent Submissions */}
          <ScrollReveal delay={0.1}>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={FileText} title="Recent Submissions" iconColor="text-blue-600 dark:text-blue-400" action={{ label: 'All', page: 'submissions' }} />
              <CardContent>
                {submissions.length === 0 ? <EmptyState icon={Upload} message="No submissions yet" /> : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {submissions.slice(0, 5).map((s: any, i: number) => (
                      <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors group"
                        onClick={() => s.assignmentId && useAppStore.getState().setAssignmentId(s.assignmentId)}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getStatusColor(s.status)}`}>
                          {s.status === 'GRADED' ? <Star className="w-4 h-4" /> : s.status === 'SUBMITTED' ? <CheckCircle2 className="w-4 h-4" /> : s.status === 'LATE' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">{s.assignment?.title || s.fileName}</p>
                          <p className="text-[10px] text-gray-400">
                            {role !== 'STUDENT' && s.student?.name && `by ${s.student.name}${s.student?.batch ? ` · ${s.student.batch}` : ''} · `}
                            {timeAgo(s.submittedAt)}
                          </p>
                        </div>
                        {s.marks != null && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${getGradeColor(s.marks).bg} ${getGradeColor(s.marks).color}`}>{s.marks.toFixed(0)}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Admin: Top Students mini-list */}
          {role === 'ADMIN' && (stats?.topStudents?.length || 0) > 0 && (
            <ScrollReveal delay={0.15}>
              <Card className="border dark:border-gray-800">
                <SectionHeader icon={Trophy} title="Top Students" iconColor="text-amber-500" action={{ label: 'All', page: 'leaderboard' }} />
                <CardContent className="space-y-2">
                  {stats.topStudents.slice(0, 5).map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                        i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                      }`}>{i + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.batch || ''}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.avgMarks}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ScrollReveal>
          )}
        </div>
      </div>

      {/* ═══ 5. BOTTOM ROW (full width, 2 cols) ═══ */}
      <div className="grid md:grid-cols-2 gap-4 md:gap-5 min-w-0">

        {/* Student: Subject Progress */}
        {isStudent && (stats?.subjectPerformance?.length || 0) > 0 && (
          <ScrollReveal>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={BookOpen} title="Subject Progress" iconColor="text-violet-600 dark:text-violet-400" />
              <CardContent className="space-y-3">
                {stats.subjectPerformance.map((subj: any) => {
                  const rate = subj.total > 0 ? Math.round(subj.submitted / subj.total * 100) : 0;
                  return (
                    <div key={subj.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{subj.code}</p>
                          <p className="text-[10px] text-gray-400">{subj.name}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-gray-400">{subj.submitted}/{subj.total}</span>
                          {subj.avg > 0 && <span className={`text-[11px] font-bold ${getGradeColor(subj.avg).color}`}>{subj.avg}%</span>}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${rate === 100 ? 'bg-emerald-500' : rate >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Student: Performance Highlights */}
        {isStudent && (
          <ScrollReveal delay={0.1}>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={Trophy} title="Performance Highlights" iconColor="text-amber-500" />
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Completion Rate</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{stats?.completionRate || 0}% of all assignments submitted</p>
                  </div>
                </div>
                {stats?.maxMarks > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10">
                    <Star className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Best Grade</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{stats.maxMarks.toFixed(1)}% — Keep it up!</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Average Grade</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A'} across {stats?.gradedCount || 0} graded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Teacher: My Subjects */}
        {role === 'TEACHER' && (stats?.subjects?.length || 0) > 0 && (
          <ScrollReveal>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={BookOpen} title="My Subjects" iconColor="text-violet-600 dark:text-violet-400" />
              <CardContent className="space-y-2">
                {stats.subjects.map((subj: any) => (
                  <div key={subj.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">{subj.code.slice(0, 2)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{subj.name}</p>
                      <p className="text-[10px] text-gray-400">{subj.code}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-gray-400 shrink-0">{subj._count?.assignments || 0} tasks</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Teacher: Pending Grading CTA */}
        {role === 'TEACHER' && (stats?.pendingGrading || 0) > 0 && (
          <ScrollReveal delay={0.1}>
            <Card className="border dark:border-gray-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.pendingGrading} Submissions to Grade</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Some submissions are waiting for your review</p>
                </div>
                <Button onClick={() => navigateTo('submissions')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm hover:shadow-md">
                  Start Grading <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Admin: User Distribution */}
        {role === 'ADMIN' && stats?.usersByRole && (
          <ScrollReveal>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={Users} title="User Distribution" iconColor="text-blue-600 dark:text-blue-400" />
              <CardContent className="space-y-3">
                {stats.usersByRole.map((r: any) => {
                  const total = stats.usersByRole.reduce((a: any, b: any) => a + b.count, 0);
                  const pct = Math.round(r.count / total * 100);
                  const colors: Record<string, string> = { STUDENT: 'from-amber-400 to-amber-500', TEACHER: 'from-emerald-400 to-emerald-500', CR: 'from-violet-400 to-violet-500', ADMIN: 'from-red-400 to-red-500' };
                  return (
                    <div key={r.role} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.role}</span>
                        <span className="text-xs text-gray-400">{r.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${colors[r.role] || 'from-gray-400 to-gray-500'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}

        {/* Admin: Top Students (full card for bottom) */}
        {role === 'ADMIN' && (stats?.topStudents?.length || 0) > 0 && (
          <ScrollReveal delay={0.1}>
            <Card className="border dark:border-gray-800">
              <SectionHeader icon={Trophy} title="Top Students" iconColor="text-amber-500" action={{ label: 'All', page: 'leaderboard' }} />
              <CardContent className="space-y-2">
                {stats.topStudents.map((s: any, i: number) => (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      i === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                      i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    }`}>{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.batch || 'No batch'} &middot; {s.totalSubs} subs</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.avgMarks}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
