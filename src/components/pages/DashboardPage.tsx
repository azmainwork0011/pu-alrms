'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  CircleDot, Megaphone, Timer, Eye, Hash, Quote, Library,
} from 'lucide-react';
import { AnimatedCounter, safeFormat, safeIsPast, getStatusColor, DashboardSkeleton, getInitials, timeAgo } from '@/components/pu-helpers';

// ─── Motivational Quotes ──────────────────────────────────
const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Education is the most powerful weapon you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Hard work beats talent when talent doesn\'t work hard.', author: 'Tim Notke' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
];

// ─── useInView Hook (IntersectionObserver) ─────────────────
function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

// ─── Shimmer Overlay Component ────────────────────────────
function ShimmerOverlay() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)',
          animation: 'shimmerSlide 3s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50% { transform: translateX(100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </motion.div>
  );
}

// ─── Glow Card Wrapper ────────────────────────────────────
function GlowCard({ children, className = '', glowColor = 'emerald' }: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const glowMap: Record<string, string> = {
    emerald: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)] dark:hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]',
    amber: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)] dark:hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]',
    violet: 'hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.25)] dark:hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]',
    blue: 'hover:shadow-[0_0_25px_-5px_rgba(59,130,246,0.25)] dark:hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]',
    rose: 'hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)] dark:hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]',
    cyan: 'hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)] dark:hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  };

  return (
    <Card className={`border dark:border-gray-800 hover:-translate-y-1 transition-all duration-300 ease-out group ${glowMap[glowColor] || glowMap.emerald} ${className}`}>
      {children}
    </Card>
  );
}

// ─── Tap Ripple Effect ────────────────────────────────────
function useRipple() {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, []);

  return { ripples, createRipple };
}

function RippleEffect({ ripples }: { ripples: Array<{ id: number; x: number; y: number }> }) {
  return (
    <>
      {ripples.map(r => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

// ─── Motivational Quote Ticker ────────────────────────────
function QuoteTicker() {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const interval = setInterval(() => {
      if (mountedRef.current) {
        setQuoteIndex(prev => (prev + 1) % QUOTES.length);
      }
    }, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative h-10 overflow-hidden mt-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={quoteIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center gap-2"
        >
          <Quote className="w-4 h-4 text-white/60 shrink-0" />
          <p className="text-sm text-white/80 italic truncate">
            {QUOTES[quoteIndex].text}
          </p>
          <span className="text-xs text-white/50 shrink-0 hidden sm:inline">— {QUOTES[quoteIndex].author}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Deadline Row (separate component for hooks) ──────────
function DeadlineRow({ a, index }: { a: any; index: number }) {
  const { ripples, createRipple } = useRipple();
  const daysLeft = differenceInDays(new Date(a.deadline), new Date());
  const isUrgent = daysLeft <= 2 && daysLeft >= 0;
  const isPast = daysLeft < 0;

  return (
    <motion.div
      variants={slideInLeft}
      custom={index}
      initial="hidden"
      animate="visible"
      transition={{ delay: 0.4 + index * 0.06 }}
      className="relative flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all group overflow-hidden"
      onClick={(e) => {
        createRipple(e);
        useAppStore.getState().setAssignmentId(a.id);
      }}
    >
      <RippleEffect ripples={ripples} />
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-sm ${
          isPast ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
          isUrgent ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
          'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
        }`}
      >
        {isPast ? <CheckCircle2 className="w-5 h-5" /> : daysLeft}
      </motion.div>
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
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        whileHover={{ opacity: 1, x: 0 }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
      </motion.div>
    </motion.div>
  );
}

// ─── Color Helpers ──────────────────────────────────────
function getGradeColor(marks: number) {
  if (marks >= 80) return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500' };
  if (marks >= 60) return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', bar: 'bg-blue-500' };
  if (marks >= 40) return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500' };
  return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500' };
}

// ─── Animation Variants ─────────────────────────────────
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const slideUpFade = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 22, mass: 0.8 },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: 'spring', stiffness: 200, damping: 20, mass: 0.6 },
  },
};

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
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-5 sm:p-6 text-white shadow-lg shadow-emerald-500/10"
      >
        {/* Animated background circles */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full"
          animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: 'translateY(-50%) translateX(25%)' }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full"
          animate={{ x: [0, -10, 0], y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: 'translateY(50%)' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/[0.03] rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              <Avatar className="w-14 h-14 border-2 border-white/30 shadow-lg ring-2 ring-white/10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-white/20 text-white text-lg font-bold backdrop-blur-sm">{getInitials(user?.name || 'U')}</AvatarFallback>
              </Avatar>
            </motion.div>
            <div>
              <motion.h1
                className="text-xl sm:text-2xl font-bold"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              >
                {greeting}, {firstName}!
              </motion.h1>
              <motion.p
                className="text-emerald-100 text-sm mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {role === 'STUDENT' && "Here's your academic overview"}
                {role === 'TEACHER' && "Here's your teaching overview"}
                {role === 'CR' && "Class Representative Dashboard"}
                {role === 'ADMIN' && "System overview and analytics"}
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Badge className="bg-white/20 text-white border-white/30 text-xs px-3 py-1 backdrop-blur-sm">
              {roleLabel}
            </Badge>
            {user?.batch && (
              <Badge className="bg-white/15 text-white border-white/20 text-xs px-3 py-1 backdrop-blur-sm">
                {user.batch}
              </Badge>
            )}
          </motion.div>
        </div>

        {/* ─── Motivational Quote Ticker ──────────────────── */}
        <QuoteTicker />
      </motion.div>

      {/* ─── Stats Grid ──────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {(role === 'STUDENT' || role === 'CR' ? [
          { label: 'Pending', value: stats?.pendingAssignments || 0, icon: <Clock className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Assignments due', glow: 'amber' },
          { label: 'Submitted', value: stats?.submittedCount || 0, icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total submissions', glow: 'emerald' },
          { label: 'Avg. Grade', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: `${stats?.gradedCount || 0} graded`, isText: true, glow: 'violet' },
          { label: 'Completion', value: stats?.completionRate || 0, icon: <Target className="w-5 h-5" />, gradient: 'from-cyan-500 to-blue-500', desc: 'Overall rate', isPercent: true, glow: 'cyan' },
        ] : role === 'TEACHER' ? [
          { label: 'Created', value: stats?.createdAssignments || 0, icon: <FileText className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Assignments', glow: 'emerald' },
          { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500', desc: 'Total received', glow: 'blue' },
          { label: 'To Grade', value: stats?.pendingGrading || 0, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Needs attention', glow: 'amber' },
          { label: 'Avg Marks', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <Star className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Student avg', isText: true, glow: 'violet' },
        ] : [
          { label: 'Users', value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total registered', glow: 'emerald' },
          { label: 'Assignments', value: stats?.totalAssignments || 0, icon: <ClipboardList className="w-5 h-5" />, gradient: 'from-blue-500 to-cyan-500', desc: 'All active', glow: 'blue' },
          { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Total submitted', glow: 'violet' },
          { label: 'Ungraded', value: stats?.ungradedCount || 0, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Needs grading', glow: 'amber' },
        ]).map((stat, i) => (
          <motion.div key={stat.label} variants={slideUpFade}>
            <GlowCard glowColor={stat.glow || 'emerald'}>
              <CardContent className="p-4 relative overflow-hidden">
                {/* Glass effect gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent dark:from-white/[0.03] dark:via-transparent dark:to-transparent pointer-events-none" />
                {/* Shimmer effect (bKash-inspired) */}
                <ShimmerOverlay />
                {/* Large watermark icon */}
                <motion.div
                  className="absolute -bottom-3 -right-3 opacity-[0.04] dark:opacity-[0.06]"
                  animate={{ rotate: [0, 5, 0, -5, 0] }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                </motion.div>
                {/* Content */}
                <div className="relative flex items-start justify-between">
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
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm cursor-pointer`}
                  >
                    {stat.icon}
                  </motion.div>
                </div>
                <p className="relative text-[10px] text-gray-400 dark:text-gray-500 mt-2">{stat.desc}</p>
              </CardContent>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Main Content Grid ───────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ─── Left Column (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Performance Chart / Weekly Trend */}
          <ScrollRevealSection>
            <GlowCard glowColor="emerald">
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
            </GlowCard>
          </ScrollRevealSection>

          {/* Upcoming Deadlines */}
          <ScrollRevealSection delay={0.1}>
            <GlowCard glowColor="amber">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {role === 'TEACHER' ? 'Recent Assignments' : 'Upcoming Deadlines'}
                </CardTitle>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-emerald-600 h-11 px-3" onClick={() => useAppStore.getState().setPage('assignments')}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8 text-gray-400"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    >
                      <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-300 dark:text-emerald-700" />
                    </motion.div>
                    <p className="text-sm">All caught up! No pending deadlines</p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((a: any, i: number) => (
                      <DeadlineRow key={a.id} a={a} index={i} />
                    ))}
                  </div>
                )}
              </CardContent>
            </GlowCard>
          </ScrollRevealSection>

          {/* ─── Recent Submissions ─────────────────────────── */}
          <ScrollRevealSection delay={0.2}>
            <GlowCard glowColor="blue">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {role === 'TEACHER' ? 'Pending Grading' : role === 'ADMIN' ? 'Recent Submissions' : 'Recent Submissions'}
                </CardTitle>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-blue-600 h-11 px-3" onClick={() => useAppStore.getState().setPage('submissions')}>
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              </CardHeader>
              <CardContent>
                {(role === 'STUDENT' || role === 'CR' ? stats?.recentSubmissions : role === 'TEACHER' ? stats?.recentSubmissions : stats?.recentSubmissions)?.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-8 text-gray-400"
                  >
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Upload className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
                    </motion.div>
                    <p className="text-sm">No submissions yet</p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {(role === 'STUDENT' || role === 'CR' ? stats?.recentSubmissions : role === 'TEACHER' ? stats?.recentSubmissions : stats?.recentSubmissions)?.map((s: any, i: number) => (
                      <motion.div
                        key={s.id}
                        variants={slideInLeft}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="relative flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all group overflow-hidden"
                        onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getStatusColor(s.status)}`}
                        >
                          {s.status === 'GRADED' ? <Star className="w-5 h-5" /> :
                           s.status === 'SUBMITTED' ? <CheckCircle2 className="w-5 h-5" /> :
                           s.status === 'LATE' ? <AlertTriangle className="w-5 h-5" /> :
                           <Clock className="w-5 h-5" />}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{s.assignment?.title || s.fileName}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {role === 'TEACHER' && s.student?.name ? `by ${s.student.name} ${s.student?.batch ? `· ${s.student.batch}` : ''} · ` : ''}
                            {timeAgo(s.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {s.marks != null && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, delay: 0.6 + i * 0.05 }}
                              className={`text-sm font-bold ${getGradeColor(s.marks).color}`}
                            >
                              {s.marks.toFixed(1)}%
                            </motion.span>
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
            </GlowCard>
          </ScrollRevealSection>
        </div>

        {/* ─── Right Column (1/3) ──────────────────────────── */}
        <div className="space-y-5">

          {/* ─── Quick Actions ─────────────────────────────── */}
          <ScrollRevealSection>
            <GlowCard glowColor="amber">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {role === 'STUDENT' && [
                  { icon: <ClipboardList className="w-4 h-4" />, label: 'Assignments', page: 'assignments', color: 'text-emerald-600 dark:text-emerald-400', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10' },
                  { icon: <GraduationCap className="w-4 h-4" />, label: 'Quick Quiz', page: 'quiz', color: 'text-violet-600 dark:text-violet-400', bg: 'hover:bg-violet-50 dark:hover:bg-violet-900/10' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI Assistant', page: 'ai-chat', color: 'text-purple-600 dark:text-purple-400', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10' },
                  { icon: <Library className="w-4 h-4" />, label: 'Library', page: 'books', color: 'text-cyan-600 dark:text-cyan-400', bg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/10' },
                  { icon: <MessageSquare className="w-4 h-4" />, label: 'Community', page: 'student-community', color: 'text-amber-600 dark:text-amber-400', bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/10' },
                  { icon: <Bell className="w-4 h-4" />, label: 'Alerts', page: 'notifications', color: 'text-rose-600 dark:text-rose-400', bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/10' },
                ].map((action, i) => (
                  <motion.button
                    key={action.label}
                    variants={slideUpFade}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => useAppStore.getState().setPage(action.page as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border dark:border-gray-700 ${action.bg} transition-all group relative overflow-hidden`}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                      className={action.color}
                    >
                      {action.icon}
                    </motion.div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{action.label}</span>
                  </motion.button>
                ))}
                {(role === 'TEACHER' || role === 'CR') && [
                  { icon: <Plus className="w-4 h-4" />, label: 'Create', page: 'create-assignment', color: 'text-emerald-600 dark:text-emerald-400', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10' },
                  { icon: <FileText className="w-4 h-4" />, label: 'Grade', page: 'submissions', color: 'text-blue-600 dark:text-blue-400', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/10' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI', page: 'ai-chat', color: 'text-purple-600 dark:text-purple-400', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10' },
                  { icon: <Library className="w-4 h-4" />, label: 'Library', page: 'books', color: 'text-cyan-600 dark:text-cyan-400', bg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/10' },
                  { icon: <Megaphone className="w-4 h-4" />, label: 'Announce', page: 'announcements', color: 'text-amber-600 dark:text-amber-400', bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/10' },
                  { icon: <Bell className="w-4 h-4" />, label: 'Alerts', page: 'notifications', color: 'text-rose-600 dark:text-rose-400', bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/10' },
                ].map((action, i) => (
                  <motion.button
                    key={action.label}
                    variants={slideUpFade}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => useAppStore.getState().setPage(action.page as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border dark:border-gray-700 ${action.bg} transition-all group relative overflow-hidden`}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                      className={action.color}
                    >
                      {action.icon}
                    </motion.div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{action.label}</span>
                  </motion.button>
                ))}
                {role === 'ADMIN' && [
                  { icon: <ClipboardList className="w-4 h-4" />, label: 'Assignments', page: 'assignments', color: 'text-emerald-600 dark:text-emerald-400', bg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10' },
                  { icon: <Trophy className="w-4 h-4" />, label: 'Leaderboard', page: 'leaderboard', color: 'text-amber-600 dark:text-amber-400', bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/10' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI', page: 'ai-chat', color: 'text-purple-600 dark:text-purple-400', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/10' },
                  { icon: <Library className="w-4 h-4" />, label: 'Library', page: 'books', color: 'text-cyan-600 dark:text-cyan-400', bg: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/10' },
                  { icon: <Users className="w-4 h-4" />, label: 'Users', page: 'profile', color: 'text-blue-600 dark:text-blue-400', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/10' },
                  { icon: <Megaphone className="w-4 h-4" />, label: 'Announce', page: 'announcements', color: 'text-rose-600 dark:text-rose-400', bg: 'hover:bg-rose-50 dark:hover:bg-rose-900/10' },
                ].map((action, i) => (
                  <motion.button
                    key={action.label}
                    variants={slideUpFade}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => useAppStore.getState().setPage(action.page as any)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border dark:border-gray-700 ${action.bg} transition-all group relative overflow-hidden`}
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                      className={action.color}
                    >
                      {action.icon}
                    </motion.div>
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">{action.label}</span>
                  </motion.button>
                ))}
              </CardContent>
            </GlowCard>
          </ScrollRevealSection>

          {/* ─── Subject Performance (Student) ──────────────── */}
          {(role === 'STUDENT' || role === 'CR') && stats?.subjectPerformance?.length > 0 && (
            <ScrollRevealSection delay={0.1}>
              <GlowCard glowColor="violet">
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
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className={`text-[11px] font-bold ${gc.color}`}
                              >
                                {subj.avg}%
                              </motion.span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                              className={`h-full rounded-full ${
                                rate === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                rate >= 50 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                'bg-gradient-to-r from-amber-400 to-amber-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Teacher: My Subjects ────────────────────────── */}
          {role === 'TEACHER' && stats?.subjects?.length > 0 && (
            <ScrollRevealSection delay={0.1}>
              <GlowCard glowColor="violet">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    My Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {stats.subjects.map((subj: any) => (
                    <motion.div
                      key={subj.id}
                      whileHover={{ x: 4, backgroundColor: 'rgba(249,250,251,1)' }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm"
                      >
                        {subj.code.slice(0, 2)}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{subj.name}</p>
                        <p className="text-[10px] text-gray-400">{subj.code}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-gray-400">{subj._count.assignments} tasks</Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Admin: Top Students ─────────────────────────── */}
          {role === 'ADMIN' && stats?.topStudents?.length > 0 && (
            <ScrollRevealSection delay={0.1}>
              <GlowCard glowColor="amber">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Top Students
                  </CardTitle>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-amber-600 h-7" onClick={() => useAppStore.getState().setPage('leaderboard')}>
                      All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.topStudents.map((s: any, i: number) => (
                    <motion.div
                      key={s.id}
                      whileHover={{ x: 4, backgroundColor: 'rgba(249,250,251,1)' }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                          i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white dark:from-amber-600 dark:to-amber-800 dark:text-amber-200' :
                          i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-white dark:from-gray-500 dark:to-gray-700 dark:text-gray-200' :
                          i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white dark:from-orange-600 dark:to-orange-800 dark:text-orange-200' :
                          'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        }`}
                      >
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.batch || 'No batch'} &middot; {s.totalSubs} subs</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.avgMarks}%</span>
                    </motion.div>
                  ))}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Admin: Subjects Overview ────────────────────── */}
          {role === 'ADMIN' && stats?.activeSubjects?.length > 0 && (
            <ScrollRevealSection delay={0.15}>
              <GlowCard glowColor="cyan">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {stats.activeSubjects.map((subj: any) => (
                    <motion.div
                      key={subj.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-xs font-bold shadow-sm"
                      >
                        {subj.code.slice(0, 2)}
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{subj.name}</p>
                        <p className="text-[10px] text-gray-400">{subj.teacherName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-gray-400">{subj.assignmentCount} tasks</Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Admin: User Distribution ────────────────────── */}
          {role === 'ADMIN' && stats?.usersByRole && (
            <ScrollRevealSection delay={0.2}>
              <GlowCard glowColor="blue">
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
                      STUDENT: 'from-amber-400 to-amber-500',
                      TEACHER: 'from-emerald-400 to-emerald-500',
                      CR: 'from-violet-400 to-violet-500',
                      ADMIN: 'from-red-400 to-red-500',
                    };
                    return (
                      <div key={r.role} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{r.role}</span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-xs text-gray-400"
                          >
                            {r.count} ({pct}%)
                          </motion.span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                            className={`h-full rounded-full bg-gradient-to-r ${colorMap[r.role] || 'from-gray-400 to-gray-500'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Announcements ────────────────────────────────── */}
          {stats?.recentAnnouncements?.length > 0 && (
            <ScrollRevealSection delay={0.25}>
              <GlowCard glowColor="rose">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Announcements
                  </CardTitle>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-rose-600 h-7" onClick={() => useAppStore.getState().setPage('announcements')}>
                      All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {stats.recentAnnouncements.map((a: any) => (
                    <motion.div
                      key={a.id}
                      whileHover={{ scale: 1.01, y: -1 }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${a.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800' : a.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200' : 'border-gray-200 dark:border-gray-700'}`}>
                          {a.priority || 'NORMAL'}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
                      </div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{a.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{a.message}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Unread Notifications (Student) ──────────────── */}
          {(role === 'STUDENT' || role === 'CR') && stats?.recentNotifications?.length > 0 && (
            <ScrollRevealSection delay={0.3}>
              <GlowCard glowColor="amber">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Notifications
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge className="bg-red-500 text-white text-[10px] px-1.5 h-4">{stats.recentNotifications.length}</Badge>
                    </motion.div>
                  </CardTitle>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-amber-600 h-7" onClick={() => useAppStore.getState().setPage('notifications')}>
                      All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.recentNotifications.map((n: any) => (
                    <motion.div
                      key={n.id}
                      whileHover={{ x: 4, backgroundColor: 'rgba(249,250,251,1)' }}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{n.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}

          {/* ─── Performance Highlights (Student) ────────────── */}
          {(role === 'STUDENT' || role === 'CR') && (
            <ScrollRevealSection delay={0.35}>
              <GlowCard glowColor="emerald">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <motion.div
                    whileHover={{ scale: 1.02, x: 2 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 cursor-pointer"
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    </motion.div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Completion Rate</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{stats?.completionRate || 0}% of all assignments submitted</p>
                    </div>
                  </motion.div>
                  {stats?.maxMarks > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.02, x: 2 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 cursor-pointer"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Star className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                      </motion.div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Best Grade</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{stats.maxMarks.toFixed(1)}% — Keep it up!</p>
                      </div>
                    </motion.div>
                  )}
                  {stats?.averageMarks > 70 && (
                    <motion.div
                      whileHover={{ scale: 1.02, x: 2 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 cursor-pointer"
                    >
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      </motion.div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Top Performer</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Average above 70% — Great work!</p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </GlowCard>
            </ScrollRevealSection>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

// ═══════════════════════════════════════════════════════════
// Scroll Reveal Section (IntersectionObserver wrapper)
// ═══════════════════════════════════════════════════════════
function ScrollRevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.97 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 20,
        mass: 0.8,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════
// Simple Bar Chart with gradient bars (enhanced)
// ═══════════════════════════════════════════════════════════
function SimpleChart({ data, maxValue, label, subLabel, color }: {
  data: { label: string; value: number; sub: number }[];
  maxValue?: number;
  label: string;
  subLabel: string;
  color: string;
}) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const colorMap: Record<string, { bar: string; sub: string; glow: string }> = {
    emerald: {
      bar: 'bg-gradient-to-t from-emerald-600 via-emerald-400 to-emerald-300',
      sub: 'bg-gradient-to-t from-teal-600 via-teal-400 to-teal-300',
      glow: 'shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]',
    },
    blue: {
      bar: 'bg-gradient-to-t from-blue-600 via-blue-400 to-blue-300',
      sub: 'bg-gradient-to-t from-cyan-600 via-cyan-400 to-cyan-300',
      glow: 'shadow-[0_0_12px_-2px_rgba(59,130,246,0.4)]',
    },
    violet: {
      bar: 'bg-gradient-to-t from-violet-600 via-violet-400 to-violet-300',
      sub: 'bg-gradient-to-t from-purple-600 via-purple-400 to-purple-300',
      glow: 'shadow-[0_0_12px_-2px_rgba(139,92,246,0.4)]',
    },
    amber: {
      bar: 'bg-gradient-to-t from-amber-600 via-amber-400 to-amber-300',
      sub: 'bg-gradient-to-t from-orange-600 via-orange-400 to-orange-300',
      glow: 'shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)]',
    },
  };
  const colors = colorMap[color] || colorMap.emerald;

  const { ref: chartRef, isInView } = useInView({ threshold: 0.2 });

  return (
    <div ref={chartRef} className="space-y-3">
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
      <div className="flex items-end gap-2 h-36">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 w-full h-28 relative group">
              {/* Hover tooltip */}
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10"
                initial={false}
              >
                {d.value > 0 ? (maxValue ? `${d.value}%` : d.value) : '-'}
              </motion.div>
              {d.sub > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={isInView ? { height: `${Math.max((d.sub / max) * 100, 4)}%`, opacity: 0.6 } : {}}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`flex-1 rounded-t-lg ${colors.sub} opacity-60 min-h-[4px] transition-shadow duration-200 group-hover:${colors.glow}`}
                  title={`${subLabel}: ${d.sub}`}
                />
              )}
              {d.value > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={isInView ? { height: `${Math.max((d.value / max) * 100, 4)}%`, opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: i * 0.1 + 0.05, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`flex-1 rounded-t-lg ${colors.bar} min-h-[4px] transition-shadow duration-200 group-hover:shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] dark:group-hover:shadow-[0_0_15px_-3px_rgba(255,255,255,0.15)]`}
                  title={`${label}: ${d.value}`}
                />
              )}
              {d.value === 0 && d.sub === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.1 }}
                  className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-sm"
                />
              )}
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="text-[10px] text-gray-400 font-medium"
            >
              {d.label}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.5, type: 'spring', stiffness: 200 }}
              className="text-[11px] text-gray-600 dark:text-gray-400 font-bold"
            >
              {d.value > 0 ? (maxValue ? `${d.value}` : d.value) : '-'}
            </motion.span>
          </div>
        ))}
      </div>
    </div>
  );
}
