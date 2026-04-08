'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, isPast, differenceInDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useTheme } from 'next-themes';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Store and API
import { useAppStore, type PageView, type User, type UserRole } from '@/store/app';
import { authApi, assignmentApi, submissionApi, commentApi, notificationApi, dashboardApi, leaderboardApi, subjectApi, aiApi } from '@/lib/api';

// Icons
import {
  BookOpen, ClipboardList, FlaskConical, Upload, MessageSquare, Trophy, Bell, User as UserIcon,
  LogOut, Menu, X, GraduationCap, Settings, BarChart3, Clock, CheckCircle2, AlertTriangle,
  Star, Send, Sparkles, FileText, Plus, ChevronRight, ChevronLeft, Calendar, Target, TrendingUp,
  Users, Award, Edit, Trash2, Eye, MessageCircle, HomeIcon, PenTool, Beaker, LayoutDashboard,
  Search, Filter, Moon, Sun, Code2, Heart, Globe, Mail, Lock, Unlock, Wifi, WifiOff,
  BookMarked, GraduationCapIcon, Lightbulb, Bug, BrainCircuit, Volume2
} from 'lucide-react';

// ─── Notification Sound (Web Audio API) ───────────────────
let audioCtx: AudioContext | null = null;

function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1);
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.2);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, ctx.currentTime);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

// ─── Password Strength ────────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string; width: string } {
  if (!password) return { score: 0, label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', width: '20%' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500', width: '80%' };
  return { score, label: 'Very Strong', color: 'bg-emerald-600', width: '100%' };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Helper ──────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    case 'TEACHER': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'STUDENT': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function getTypeBadgeVariant(type: string) {
  return type === 'LAB_REPORT' ? 'default' as const : 'secondary' as const;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'GRADED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'LATE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'ARCHIVED': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function safeFormat(date: Date, fmt: string): string {
  try {
    return format(date, fmt);
  } catch {
    return 'N/A';
  }
}

function safeIsPast(date: Date): boolean {
  try {
    return isPast(date);
  } catch {
    return false;
  }
}

function timeAgo(dateStr: string): string {
  try {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return safeFormat(new Date(dateStr), 'MMM d');
  } catch {
    return '';
  }
}

// ─── Animated Counter ─────────────────────────────────────
function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || target === 0) return;
    hasAnimated.current = true;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

// ─── Page Transition Wrapper ──────────────────────────────
function PageTransition({ children, keyProp }: { children: React.ReactNode; keyProp: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Floating Particles ──────────────────────────────────
function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/20 dark:bg-emerald-400/10"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── DevCredit ────────────────────────────────────────────
function DevCredit({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 ${className}`}>
      <span className="inline-flex items-center gap-1">
        Developed with <Heart className="w-3 h-3 text-rose-400" /> by
      </span>
      <span className="font-medium text-gray-500 dark:text-gray-400">Jain Azmain</span>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span className="text-gray-500 dark:text-gray-400">CSE 66 Batch</span>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────
function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginRole, setLoginRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const { setAuth } = useAppStore();

  const roleConfig = {
    STUDENT: { color: 'amber', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', placeholder: 'student@stu.pu.edu' },
    TEACHER: { color: 'emerald', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', placeholder: 'teacher@pu.edu' },
    ADMIN: { color: 'rose', gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', placeholder: 'admin@pu.edu' },
  };

  const currentRole = roleConfig[loginRole];
  const pwStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = activeTab === 'login'
        ? await authApi.login(formData.email, formData.password)
        : await authApi.register(formData);
      setAuth(result.user, result.token);
      toast.success(activeTab === 'login' ? 'Welcome back!' : 'Account created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Student', email: 'alice@stu.pu.edu', password: 'student123', icon: <GraduationCap className="w-5 h-5" />, role: 'STUDENT' as const, color: 'amber' },
    { label: 'Teacher', email: 'dr.smith@pu.edu', password: 'teacher123', icon: <BookOpen className="w-5 h-5" />, role: 'TEACHER' as const, color: 'emerald' },
    { label: 'Admin', email: 'admin@pu.edu', password: 'admin123', icon: <Shield className="w-5 h-5" />, role: 'ADMIN' as const, color: 'rose' },
  ];

  const quickLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.user, result.token);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-4 relative">
      <FloatingParticles />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <GraduationCap className="w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prime University</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Assignment &amp; Lab Report Management System</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100/50 dark:shadow-none dark:bg-gray-900/80 dark:border dark:border-gray-800 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeTab === 'login' && (
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                      loginRole === role
                        ? `bg-gradient-to-r ${roleConfig[role].gradient} text-white shadow-sm`
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setLoginRole(role)}
                  >
                    {role === 'STUDENT' ? '🎓 Student' : role === 'TEACHER' ? '👨‍🏫 Teacher' : '👨‍💼 Admin'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="dark:bg-gray-800 dark:border-gray-700" />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={activeTab === 'login' ? currentRole.placeholder : 'you@pu.edu'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-9 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-xs text-red-500">Please enter a valid email address</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-9 pr-10 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Unlock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {activeTab === 'register' && formData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Strength</span>
                      <span className={`text-xs font-medium ${pwStrength.score >= 4 ? 'text-emerald-600 dark:text-emerald-400' : pwStrength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>{pwStrength.label}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${pwStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: pwStrength.width }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {activeTab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              <Button
                type="submit"
                className={`w-full bg-gradient-to-r ${currentRole.gradient} hover:opacity-90 text-white border-0 shadow-lg`}
                disabled={loading || (activeTab === 'register' && formData.email && !isValidEmail(formData.email))}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                ) : activeTab === 'login' ? `Sign In as ${loginRole.charAt(0) + loginRole.slice(1).toLowerCase()}` : 'Create Account'}
              </Button>
            </form>

            {activeTab === 'login' && (
              <>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => toast.info('Google OAuth coming soon!')}
                  >
                    <Globe className="w-4 h-4" /> Sign in with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => toast.info('Temporary email login coming soon!')}
                  >
                    <Mail className="w-4 h-4" /> Temp Email
                  </Button>
                </div>

                <div className="mt-5">
                  <Separator className="my-4" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">Quick Demo Access</p>
                  <div className="grid grid-cols-3 gap-2">
                    {demoAccounts.map((acc) => (
                      <motion.div key={acc.email} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`w-full text-xs h-auto py-3 flex-col gap-1.5 ${acc.role === 'STUDENT' ? 'border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30' : acc.role === 'TEACHER' ? 'border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30' : 'border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30'}`}
                          onClick={() => quickLogin(acc.email, acc.password)}
                          disabled={loading}
                        >
                          {acc.icon}
                          <span className="font-medium">{acc.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 space-y-2">
          <DevCredit />
          <p className="text-center text-xs text-gray-400 dark:text-gray-600">PU-ALRMS &copy; 2024 Prime University. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}

// Shield icon for admin (not in lucide directly, use ShieldCheck alternative)
function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

// ─── Sidebar Navigation ──────────────────────────────────
function SidebarNav({ onNavigate }: { onNavigate: (page: PageView) => void }) {
  const { user, currentPage } = useAppStore();

  const navItems: { page: PageView; label: string; icon: React.ReactNode; roles?: UserRole[]; badge?: string }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { page: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
    { page: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="w-4 h-4" /> },
    { page: 'create-assignment', label: 'Create Assignment', icon: <Plus className="w-4 h-4" />, roles: ['TEACHER'] },
    { page: 'submissions', label: user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions', icon: <FileText className="w-4 h-4" /> },
    { page: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" />, roles: ['STUDENT', 'ADMIN'] },
    { page: 'student-community', label: 'Community Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { page: 'ai-chat', label: 'AI Assistant', icon: <Sparkles className="w-4 h-4" /> },
    { page: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { page: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const filtered = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'STUDENT'));

  return (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {filtered.map((item) => (
        <motion.div key={item.page} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={currentPage === item.page ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-3 ${currentPage === item.page ? 'bg-emerald-100 text-emerald-800 font-medium dark:bg-emerald-900/30 dark:text-emerald-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}
            onClick={() => onNavigate(item.page)}
          >
            {item.icon}
            {item.label}
          </Button>
        </motion.div>
      ))}
    </nav>
  );
}

// ─── Mobile Sidebar ──────────────────────────────────────
function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen, setPage } = useAppStore();
  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 p-0 dark:bg-gray-900">
        <SheetHeader className="p-4 border-b dark:border-gray-800">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            PU-ALRMS
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={(page) => { setPage(page); setSidebarOpen(false); }} />
        <div className="p-3 border-t dark:border-gray-800">
          <DevCredit />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Dashboard Page ──────────────────────────────────────
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

  const currentStats = user?.role === 'ADMIN' ? adminStats : user?.role === 'TEACHER' ? teacherStats : studentStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {user?.role === 'STUDENT' && "Here's your academic overview"}
          {user?.role === 'TEACHER' && "Here's your teaching dashboard"}
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
              {user?.role === 'TEACHER' && (
                <>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('create-assignment')}><Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /><span className="text-xs">Create Assignment</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('submissions')}><PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400" /><span className="text-xs">Grade Submissions</span></Button></motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Button variant="outline" className="w-full h-auto py-3 flex-col gap-2 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /><span className="text-xs">AI Assistant</span></Button></motion.div>
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 dark:bg-gray-800" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl dark:bg-gray-800" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl dark:bg-gray-800" />
        <Skeleton className="h-64 rounded-xl dark:bg-gray-800" />
      </div>
    </div>
  );
}

// ─── Assignments List Page ───────────────────────────────
function AssignmentsPage({ type = 'ASSIGNMENT' }: { type?: string }) {
  const { user, setAssignmentId } = useAppStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [assignData, subData] = await Promise.all([
          assignmentApi.list({ type }),
          user?.role === 'STUDENT' ? submissionApi.list({}) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setAssignments(Array.isArray(assignData) ? assignData : []);
        setSubmissions(Array.isArray(subData) ? subData : []);
        const allSubjects = await subjectApi.list();
        if (!cancelled) setSubjects(Array.isArray(allSubjects) ? allSubjects : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [type, user]);

  const filtered = assignments.filter((a: any) => {
    if (filterSubject !== 'all' && a.subjectId !== filterSubject) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getSubmissionStatus = (assignmentId: string) => {
    return submissions.find((s: any) => s.assignmentId === assignmentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === 'LAB_REPORT' ? 'Lab Reports' : 'Assignments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} items</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-700"><SelectValue placeholder="Filter subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl dark:bg-gray-800" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500">No items found</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a: any, i) => {
            const sub = getSubmissionStatus(a.id);
            let deadline: Date;
            let isOverdue = false;
            try {
              deadline = new Date(a.deadline);
              isOverdue = safeIsPast(deadline) && a.status === 'ACTIVE';
            } catch {
              deadline = new Date();
            }
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="border dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAssignmentId(a.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
                          <Badge variant={getTypeBadgeVariant(a.type)} className="text-xs">
                            {a.type === 'LAB_REPORT' ? 'Lab Report' : 'Assignment'}
                          </Badge>
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{a.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.subject?.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{safeFormat(deadline, 'MMM d, yyyy')}</span>
                          {a.creator && <span>by {a.creator.name}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {sub ? (
                          <Badge className={getStatusColor(sub.status)}>{sub.status} {sub.marks ? `\u00b7 ${sub.marks}/100` : ''}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-900/20">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Assignment Detail Page ──────────────────────────────
function AssignmentDetailPage() {
  const { selectedAssignmentId, user } = useAppStore();
  const [assignment, setAssignment] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeData, setGradeData] = useState({ marks: '', feedback: '' });
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!selectedAssignmentId) return;
    setLoading(true);
    try {
      const [aData, cData, sData] = await Promise.all([
        assignmentApi.get(selectedAssignmentId),
        commentApi.list(selectedAssignmentId),
        submissionApi.list({ assignmentId: selectedAssignmentId }),
      ]);
      setAssignment(aData);
      setComments(Array.isArray(cData) ? cData : []);
      setSubmissions(Array.isArray(sData) ? sData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAssignmentId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComment = async () => {
    if (!newComment.trim() || !selectedAssignmentId) return;
    try {
      await commentApi.create({ assignmentId: selectedAssignmentId, content: newComment });
      setNewComment('');
      toast.success('Comment added');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add comment');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignmentId || !assignment) return;
    setSubmitting(true);
    try {
      await submissionApi.create({
        assignmentId: selectedAssignmentId,
        fileName: `${assignment.title.replace(/\s+/g, '_')}_submission.pdf`,
      });
      toast.success('Submitted successfully!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async () => {
    if (!selectedSubId) return;
    setGradingId(selectedSubId);
    try {
      await submissionApi.grade(selectedSubId, { marks: parseFloat(gradeData.marks), feedback: gradeData.feedback });
      toast.success('Graded successfully!');
      setGradeDialogOpen(false);
      setGradeData({ marks: '', feedback: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Grading failed');
    } finally {
      setGradingId(null);
    }
  };

  const openGradeDialog = (subId: string) => {
    setSelectedSubId(subId);
    setGradeData({ marks: '', feedback: '' });
    setGradeDialogOpen(true);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64 dark:bg-gray-800" /><Skeleton className="h-48 rounded-xl dark:bg-gray-800" /><Skeleton className="h-64 rounded-xl dark:bg-gray-800" /></div>;
  if (!assignment) return <div className="text-center py-12 text-gray-400 dark:text-gray-500">Assignment not found</div>;

  let deadline: Date;
  let deadlinePast = false;
  try {
    deadline = new Date(assignment.deadline);
    deadlinePast = safeIsPast(deadline);
  } catch {
    deadline = new Date();
    deadlinePast = false;
  }

  const hasSubmitted = submissions.some((s: any) => s.studentId === user?.id);
  const mySubmission = submissions.find((s: any) => s.studentId === user?.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().setPage('assignments')} className="text-gray-500 dark:text-gray-400">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to list
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getTypeBadgeVariant(assignment.type)}>
                    {assignment.type === 'LAB_REPORT' ? 'Lab Report' : 'Assignment'}
                  </Badge>
                  <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">{assignment.title}</CardTitle>
                <CardDescription className="mt-1 dark:text-gray-400">
                  {assignment.subject?.name} ({assignment.subject?.code}) &middot; by {assignment.creator?.name}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${deadlinePast ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                  <Calendar className="w-4 h-4" />
                  {safeFormat(deadline, 'MMM d, yyyy HH:mm')}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{submissions.length} submissions</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assignment.description}</div>

            {user?.role === 'STUDENT' && !hasSubmitted && assignment.status === 'ACTIVE' && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium mb-3">Ready to submit your work?</p>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Submitting...</> : <><Upload className="w-4 h-4 mr-2" />Submit Work</>}
                </Button>
              </div>
            )}

            {mySubmission && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Your Submission</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">{mySubmission.fileName} &middot; {mySubmission.status}</p>
                    {mySubmission.marks != null && <p className="text-sm font-bold text-purple-900 dark:text-purple-200 mt-1">Score: {mySubmission.marks}/100</p>}
                    {mySubmission.feedback && <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">Feedback: {mySubmission.feedback}</p>}
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-purple-400 shrink-0" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Card className="border dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {submissions.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No submissions yet</p>
                  ) : (
                    submissions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={s.student?.avatar} />
                              <AvatarFallback className="text-xs">{s.student?.name ? getInitials(s.student.name) : '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">{s.student?.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.fileName}</p>
                          {s.marks != null && <p className="text-xs font-medium text-purple-700 dark:text-purple-400">Score: {s.marks}/100</p>}
                          {s.feedback && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{s.feedback}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge className={`text-xs ${getStatusColor(s.status)}`}>{s.status}</Badge>
                          {s.status !== 'GRADED' && user?.role === 'TEACHER' && (
                            <Dialog open={gradeDialogOpen && selectedSubId === s.id} onOpenChange={(open) => { if (!open) { setGradeDialogOpen(false); setSelectedSubId(null); } }}>
                              <Button size="sm" variant="outline" className="text-xs h-7 dark:bg-gray-800 dark:border-gray-700" onClick={() => openGradeDialog(s.id)}>
                                <PenTool className="w-3 h-3 mr-1" />Grade
                              </Button>
                              <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
                                <DialogHeader>
                                  <DialogTitle>Grade Submission</DialogTitle>
                                  <DialogDescription className="dark:text-gray-400">{s.student?.name} - {s.fileName}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="space-y-2">
                                    <Label>Marks (out of 100)</Label>
                                    <Input type="number" min="0" max="100" value={gradeData.marks} onChange={(e) => setGradeData({ ...gradeData, marks: e.target.value })} placeholder="0-100" className="dark:bg-gray-800 dark:border-gray-700" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Feedback</Label>
                                    <Textarea value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} placeholder="Provide feedback..." rows={3} className="dark:bg-gray-800 dark:border-gray-700" />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => { setGradeDialogOpen(false); setSelectedSubId(null); }} className="dark:bg-gray-800 dark:border-gray-700">Cancel</Button>
                                  <Button onClick={handleGrade} disabled={!gradeData.marks || !!gradingId} className="bg-emerald-600 hover:bg-emerald-700">
                                    {gradingId ? 'Saving...' : 'Submit Grade'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Discussion ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No comments yet. Start the discussion!</p>
                ) : (
                  comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={c.user?.avatar} />
                        <AvatarFallback className="text-xs">{c.user?.name ? getInitials(c.user.name) : '?'}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.user?.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <Separator className="my-3 dark:bg-gray-800" />
            <div className="flex gap-2">
              <Input placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(); } }} className="dark:bg-gray-800 dark:border-gray-700" />
              <Button size="icon" onClick={handleComment} disabled={!newComment.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Create Assignment Page ──────────────────────────────
function CreateAssignmentPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', type: 'ASSIGNMENT', deadline: '' });
  const { setPage } = useAppStore();

  useEffect(() => {
    subjectApi.list().then((data) => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) { toast.error('Please select a subject'); return; }
    setLoading(true);
    try {
      await assignmentApi.create(form);
      toast.success('Assignment created successfully!');
      setPage('assignments');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Assignment</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Set up a new assignment or lab report for your students</p>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border dark:border-gray-800">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ca-title">Title</Label>
                <Input id="ca-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" required className="dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ca-desc">Description</Label>
                <Textarea id="ca-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the assignment requirements..." rows={4} required className="dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                      <SelectItem value="LAB_REPORT">Lab Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ca-deadline">Deadline</Label>
                <Input id="ca-deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required className="dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setPage('assignments')} className="dark:bg-gray-800 dark:border-gray-700">Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Creating...</> : 'Create Assignment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Submissions Page ────────────────────────────────────
function SubmissionsPage() {
  const { user } = useAppStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignment, setFilterAssignment] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sData, aData] = await Promise.all([
          submissionApi.list({}),
          assignmentApi.list({}),
        ]);
        if (cancelled) return;
        setSubmissions(Array.isArray(sData) ? sData : []);
        setAssignments(Array.isArray(aData) ? aData : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = submissions.filter((s: any) => {
    if (user?.role === 'STUDENT' && s.studentId !== user.id) return false;
    if (filterAssignment !== 'all' && s.assignmentId !== filterAssignment) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} submissions</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Select value={filterAssignment} onValueChange={setFilterAssignment}>
            <SelectTrigger className="w-56 dark:bg-gray-800 dark:border-gray-700"><SelectValue placeholder="Filter by assignment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              {assignments.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500">No submissions found</CardContent></Card>
      ) : (
        <Card className="border dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-800">
                <TableHead className="hidden sm:table-cell">Assignment</TableHead>
                <TableHead>Details</TableHead>
                {user?.role === 'TEACHER' && <TableHead className="hidden sm:table-cell">Student</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => {
                let submittedDate: string = '';
                try { submittedDate = safeFormat(new Date(s.submittedAt), 'MMM d'); } catch { /* noop */ }
                return (
                  <TableRow key={s.id} className="dark:border-gray-800">
                    <TableCell className="font-medium hidden sm:table-cell max-w-[200px] truncate dark:text-gray-200">{s.assignment?.title}</TableCell>
                    <TableCell>
                      <p className="font-medium sm:hidden text-sm dark:text-gray-200">{s.assignment?.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{s.fileName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{submittedDate}</p>
                    </TableCell>
                    {user?.role === 'TEACHER' && (
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6"><AvatarImage src={s.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(s.student?.name || '?')}</AvatarFallback></Avatar>
                          <span className="text-sm dark:text-gray-300">{s.student?.name}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell><Badge className={`text-xs ${getStatusColor(s.status)}`}>{s.status}</Badge></TableCell>
                    <TableCell>{s.marks != null ? <span className="font-medium dark:text-gray-200">{s.marks}/100</span> : <span className="text-gray-400 dark:text-gray-500">-</span>}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─── AI Chat Page ────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const ctaButtons = [
    { label: 'Get Assignment Help', icon: <ClipboardList className="w-5 h-5" />, prompt: 'Help me with my assignment. What should I include in my response?', gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Write Lab Report', icon: <FlaskConical className="w-5 h-5" />, prompt: 'How should I structure a proper lab report? Give me a detailed template.', gradient: 'from-blue-500 to-cyan-600' },
    { label: 'Code Review', icon: <Bug className="w-5 h-5" />, prompt: 'Review this code for bugs, performance issues, and best practices improvements.', gradient: 'from-orange-500 to-red-500' },
    { label: 'Study Tips', icon: <Lightbulb className="w-5 h-5" />, prompt: 'Give me effective study tips and strategies for computer science exams.', gradient: 'from-purple-500 to-pink-500' },
  ];

  const suggestedPrompts = [
    'Help me understand binary search trees',
    'How should I structure a lab report?',
    'Explain normalization in databases',
    'Tips for writing clean code',
    'Help with React component design',
  ];

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await aiApi.chat(message);
      const aiMsg: ChatMessage = { role: 'assistant', content: result.response || 'Sorry, I could not generate a response.' };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            AI Academic Assistant
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Powered by AI &middot; Ask anything about your assignments</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setMessages([])} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
            <MessageSquare className="w-4 h-4 mr-1" />Clear Chat
          </Button>
        )}
      </div>

      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How can I help you today?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6 max-w-sm">I can help with assignments, programming, lab reports, and academic questions.</p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
                {ctaButtons.map((cta, i) => (
                  <motion.button
                    key={cta.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => sendMessage(cta.prompt)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${cta.gradient} text-white hover:opacity-90 transition-opacity shadow-md`}
                  >
                    {cta.icon}
                    <span className="text-xs font-medium">{cta.label}</span>
                  </motion.button>
                ))}
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Or try a quick prompt:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <Button key={i} variant="outline" className="text-xs h-auto py-2.5 text-left justify-start dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" onClick={() => sendMessage(prompt)}>
                    <MessageCircle className="w-3 h-3 mr-2 shrink-0" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className={msg.role === 'user' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}>
                    {msg.role === 'user' ? getInitials(useAppStore.getState().user?.name || 'U') : 'AI'}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-code:text-xs dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8"><AvatarFallback className="bg-purple-100 text-purple-700 text-xs dark:bg-purple-900/30 dark:text-purple-300">AI</AvatarFallback></Avatar>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4 dark:border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your studies..." disabled={loading} className="flex-1 dark:bg-gray-800 dark:border-gray-700" />
            <Button type="submit" disabled={loading || !input.trim()} className="bg-purple-600 hover:bg-purple-700 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// ─── Leaderboard Page ────────────────────────────────────
function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.get().then((data) => setEntries(Array.isArray(data) ? data : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" />Student Leaderboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Top performers ranked by academic performance</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl dark:bg-gray-800" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500">No graded submissions yet</CardContent></Card>
      ) : (
        <>
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map((idx) => {
                const e = entries[idx];
                if (!e) return null;
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Card className={`border dark:border-gray-800 text-center ${idx === 0 ? 'ring-2 ring-amber-300 dark:ring-amber-600' : ''}`}>
                      <CardContent className="p-4">
                        <div className="text-3xl mb-2">{medals[idx]}</div>
                        <Avatar className="w-12 h-12 mx-auto mb-2">
                          <AvatarImage src={e.avatar} />
                          <AvatarFallback>{getInitials(e.name)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-sm truncate dark:text-gray-100">{e.name}</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{e.averageMarks?.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{e.totalSubmissions} submissions</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Card className="border dark:border-gray-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-800">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Average Marks</TableHead>
                  <TableHead className="w-32">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e: any, i: number) => (
                  <TableRow key={e.id} className="dark:border-gray-800">
                    <TableCell className="font-bold">{i < 3 ? <span className="text-lg">{medals[i]}</span> : `#${i + 1}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8"><AvatarImage src={e.avatar} /><AvatarFallback className="text-xs">{getInitials(e.name)}</AvatarFallback></Avatar>
                        <span className="font-medium dark:text-gray-200">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{e.totalSubmissions}</TableCell>
                    <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">{e.averageMarks?.toFixed(1)}%</TableCell>
                    <TableCell><Progress value={e.averageMarks} className="h-2" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Notifications Page ──────────────────────────────────
function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setNotificationCount } = useAppStore();

  useEffect(() => {
    notificationApi.list().then((data) => {
      setNotifications(Array.isArray(data) ? data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const unread = notifications.filter(n => !n.isRead);
      if (unread.length > 0) {
        playNotificationSound();
      }
    }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}</div>
      ) : notifications.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notifications yet</p></CardContent></Card>
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
                        <p className="text-sm font-semibold dark:text-gray-100">{n.title}</p>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
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

// ─── Profile Page ────────────────────────────────────────
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

// ─── Student Community Chat ──────────────────────────────
interface CommunityMessage {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system';
  role?: string;
}

interface OnlineUser {
  id: string;
  username: string;
  role?: string;
}

function StudentCommunityPage() {
  const { user, token } = useAppStore();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', { username: `${user.name} (${user.role})`, role: user.role });
    });

    socket.on('joined', () => {
      setIsJoined(true);
    });

    socket.on('messages-history', (history: CommunityMessage[]) => {
      if (Array.isArray(history)) {
        setMessages(history.slice(-100));
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });

    socket.on('message', (msg: CommunityMessage) => {
      setMessages(prev => [...prev.slice(-99), msg]);
      if (!isVisible) {
        playNotificationSound();
      }
    });

    socket.on('user-joined', (data: { user: OnlineUser; message: CommunityMessage }) => {
      setMessages(prev => [...prev.slice(-99), data.message]);
      setOnlineUsers(prev => {
        if (!prev.find(u => u.id === data.user.id)) {
          return [...prev, data.user];
        }
        return prev;
      });
      if (!isVisible) playNotificationSound();
    });

    socket.on('user-left', (data: { user: OnlineUser; message: CommunityMessage }) => {
      setMessages(prev => [...prev.slice(-99), data.message]);
      setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id));
    });

    socket.on('users-list', (data: { users: OnlineUser[] }) => {
      setOnlineUsers(data.users);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, isVisible]);

  const sendMessage = () => {
    if (socketRef.current && inputMessage.trim() && isJoined) {
      socketRef.current.emit('message', {
        content: inputMessage.trim(),
        username: `${user?.name} (${user?.role})`,
      });
      setInputMessage('');
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      TEACHER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      STUDENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role.slice(0, 4)}
      </span>
    );
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Student Community
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time chat with students and faculty</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="relative dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            onClick={() => setShowUsers(!showUsers)}
          >
            <Users className="w-4 h-4 mr-1" />
            {onlineUsers.length} Online
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
          </Button>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      {showUsers && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card className="border dark:border-gray-800">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Online Users ({onlineUsers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {onlineUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm dark:text-gray-300">{u.username}</span>
                    {getRoleBadge(u.role)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="border dark:border-gray-800 flex-1 flex flex-col overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {!isJoined ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Connecting to community chat...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome to the community chat!</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Be the first to say hello</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                {msg.type === 'system' ? (
                  <div className="text-center py-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{msg.username}</span>
                        {getRoleBadge(msg.role)}
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 break-words">{msg.content}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 dark:border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected || !isJoined}
              className="flex-1 dark:bg-gray-800 dark:border-gray-700"
            />
            <Button type="submit" disabled={!isConnected || !isJoined || !inputMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// ─── Dark Mode Toggle ────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Main App Layout ────────────────────────────────────
function AppLayout() {
  const { currentPage, user, toggleSidebar, notificationCount, setPage, logout } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'assignments': return <AssignmentsPage />;
      case 'lab-reports': return <AssignmentsPage type="LAB_REPORT" />;
      case 'assignment-detail': return <AssignmentDetailPage />;
      case 'create-assignment': return <CreateAssignmentPage />;
      case 'submissions': return <SubmissionsPage />;
      case 'ai-chat': return <AIChatPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
      case 'student-community': return <StudentCommunityPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 fixed top-0 left-0 h-full z-40">
        <div className="p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-gray-900 dark:text-white">PU-ALRMS</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Prime University</p>
            </div>
          </div>
        </div>
        <SidebarNav onNavigate={(page) => setPage(page)} />
        <div className="p-3 border-t dark:border-gray-800 mt-auto">
          <DevCredit />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={toggleSidebar}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                {currentPage === 'student-community' ? 'Community Chat' : currentPage.replace(/-/g, ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setPage('notifications')}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </motion.span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:block dark:text-gray-200">{user?.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 dark:bg-gray-900 dark:border-gray-800">
                  <DropdownMenuItem onClick={() => setPage('profile')} className="dark:text-gray-300 dark:focus:bg-gray-800">
                    <UserIcon className="w-4 h-4 mr-2" />Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPage('notifications')} className="dark:text-gray-300 dark:focus:bg-gray-800">
                    <Bell className="w-4 h-4 mr-2" />Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-800" />
                  <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 dark:focus:bg-gray-800">
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <PageTransition keyProp={currentPage}>
            {renderPage()}
          </PageTransition>
        </main>
      </div>

      <MobileSidebar />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function Home() {
  const { mounted, isAuthenticated, hydrate } = useAppStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Show loading screen while not mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">PU-ALRMS</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AppLayout />;
}
