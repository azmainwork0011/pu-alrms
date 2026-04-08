'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { format, isPast, differenceInDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

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
  Users, Award, Edit, Trash2, Eye, MessageCircle, Home, PenTool, Beaker, LayoutDashboard,
  Search, Filter
} from 'lucide-react';

// ─── Helper ──────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
    case 'TEACHER': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'STUDENT': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getTypeBadgeVariant(type: string) {
  return type === 'LAB_REPORT' ? 'default' as const : 'secondary' as const;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800';
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
    case 'GRADED': return 'bg-purple-100 text-purple-800';
    case 'LATE': return 'bg-red-100 text-red-800';
    case 'CLOSED': return 'bg-gray-100 text-gray-800';
    case 'ARCHIVED': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
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
    return format(new Date(dateStr), 'MMM d');
  } catch {
    return '';
  }
}

// ─── Auth Page ───────────────────────────────────────────
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const { setAuth } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = isLogin
        ? await authApi.login(formData.email, formData.password)
        : await authApi.register(formData);
      setAuth(result.user, result.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Student', email: 'alice@stu.pu.edu', password: 'student123', icon: '🎓' },
    { label: 'Teacher', email: 'dr.smith@pu.edu', password: 'teacher123', icon: '👨‍🏫' },
    { label: 'Admin', email: 'admin@pu.edu', password: 'admin123', icon: '👨‍💼' },
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Prime University</h1>
          <p className="text-gray-500 mt-1">Assignment &amp; Lab Report Management System</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100/50">
          <CardHeader className="pb-4">
            <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@pu.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                ) : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-6">
                <Separator className="my-4" />
                <p className="text-xs text-gray-400 text-center mb-3">Quick Demo Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {demoAccounts.map((acc) => (
                    <Button key={acc.email} type="button" variant="outline" size="sm" className="text-xs h-auto py-2 flex-col gap-1" onClick={() => quickLogin(acc.email, acc.password)} disabled={loading}>
                      <span className="text-lg">{acc.icon}</span>
                      <span>{acc.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-gray-400 mt-6">PU-ALRMS © 2024 Prime University. All rights reserved.</p>
      </div>
    </div>
  );
}

// ─── Sidebar Navigation ──────────────────────────────────
function SidebarNav({ onNavigate }: { onNavigate: (page: PageView) => void }) {
  const { user, currentPage, setPage } = useAppStore();

  const navItems: { page: PageView; label: string; icon: React.ReactNode; roles?: UserRole[] }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { page: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
    { page: 'lab-reports', label: 'Lab Reports', icon: <FlaskConical className="w-4 h-4" /> },
    { page: 'create-assignment', label: 'Create Assignment', icon: <Plus className="w-4 h-4" />, roles: ['TEACHER'] },
    { page: 'submissions', label: user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions', icon: <FileText className="w-4 h-4" /> },
    { page: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" />, roles: ['STUDENT', 'ADMIN'] },
    { page: 'ai-chat', label: 'AI Assistant', icon: <Sparkles className="w-4 h-4" /> },
    { page: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { page: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const filtered = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'STUDENT'));

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {filtered.map((item) => (
        <Button
          key={item.page}
          variant={currentPage === item.page ? 'secondary' : 'ghost'}
          className={`w-full justify-start gap-3 ${currentPage === item.page ? 'bg-emerald-100 text-emerald-800 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
          onClick={() => onNavigate(item.page)}
        >
          {item.icon}
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

// ─── Mobile Sidebar ──────────────────────────────────────
function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen, setPage } = useAppStore();
  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            PU-ALRMS
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={(page) => { setPage(page); setSidebarOpen(false); }} />
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
          .filter((a: any) => !isPast(new Date(a.deadline)))
          .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
          .slice(0, 5);
        setUpcoming(upcomingAssignments);

        if (user?.role === 'STUDENT') {
          const subs = await submissionApi.list({});
          if (!cancelled) setRecentSubs(Array.isArray(subs) ? subs.slice(0, 5) : []);
        } else if (user?.role === 'TEACHER') {
          const subs = await submissionApi.list({});
          if (!cancelled) setRecentSubs(Array.isArray(subs) ? subs.filter((s: any) => s.status !== 'GRADED').slice(0, 5) : []);
        } else if (user?.role === 'ADMIN') {
          const subs = await submissionApi.list({});
          if (!cancelled) setRecentSubs(Array.isArray(subs) ? subs.slice(0, 5) : []);
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
    { label: 'Pending', value: stats?.pendingAssignments || 0, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Submitted', value: stats?.submittedCount || 0, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Grade', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Upcoming', value: stats?.upcomingDeadlines || 0, icon: <Calendar className="w-5 h-5" />, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const teacherStats = [
    { label: 'Created', value: stats?.createdAssignments || 0, icon: <FileText className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'To Grade', value: stats?.pendingGrading || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg Marks', value: stats?.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <Star className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const adminStats = [
    { label: 'Users', value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Assignments', value: stats?.totalAssignments || 0, icon: <ClipboardList className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Submissions', value: stats?.totalSubmissions || 0, icon: <Upload className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Subjects', value: stats?.activeSubjects || 0, icon: <BookOpen className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const currentStats = user?.role === 'ADMIN' ? adminStats : user?.role === 'TEACHER' ? teacherStats : studentStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'STUDENT' && "Here&apos;s your academic overview"}
          {user?.role === 'TEACHER' && "Here&apos;s your teaching dashboard"}
          {user?.role === 'ADMIN' && "System overview and analytics"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentStats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No upcoming deadlines</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => useAppStore.getState().setAssignmentId(a.id)}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-gray-500">{a.subject?.name} · {a.subject?.code}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-xs font-medium text-amber-600">{format(new Date(a.deadline), 'MMM d')}</p>
                      <p className="text-xs text-gray-400">{differenceInDays(new Date(a.deadline), new Date())}d left</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {user?.role === 'TEACHER' ? 'Pending Grading' : 'Recent Submissions'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubs.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {recentSubs.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.assignment?.title || s.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {s.student?.name ? `by ${s.student.name} · ` : ''}{s.fileName}
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
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {user?.role === 'STUDENT' && (
              <>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('assignments')}><ClipboardList className="w-5 h-5 text-emerald-600" /><span className="text-xs">View Assignments</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('submissions')}><Upload className="w-5 h-5 text-blue-600" /><span className="text-xs">Submit Work</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600" /><span className="text-xs">AI Assistant</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('leaderboard')}><Trophy className="w-5 h-5 text-amber-600" /><span className="text-xs">Leaderboard</span></Button>
              </>
            )}
            {user?.role === 'TEACHER' && (
              <>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('create-assignment')}><Plus className="w-5 h-5 text-emerald-600" /><span className="text-xs">Create Assignment</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('submissions')}><PenTool className="w-5 h-5 text-blue-600" /><span className="text-xs">Grade Submissions</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600" /><span className="text-xs">AI Assistant</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('lab-reports')}><Beaker className="w-5 h-5 text-amber-600" /><span className="text-xs">Lab Reports</span></Button>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('assignments')}><ClipboardList className="w-5 h-5 text-emerald-600" /><span className="text-xs">All Assignments</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('leaderboard')}><Trophy className="w-5 h-5 text-amber-600" /><span className="text-xs">Leaderboard</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('ai-chat')}><Sparkles className="w-5 h-5 text-purple-600" /><span className="text-xs">AI Assistant</span></Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-2" onClick={() => useAppStore.getState().setPage('notifications')}><Bell className="w-5 h-5 text-rose-600" /><span className="text-xs">Notifications</span></Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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
          <h1 className="text-2xl font-bold text-gray-900">
            {type === 'LAB_REPORT' ? 'Lab Reports' : 'Assignments'}
          </h1>
          <p className="text-gray-500 mt-1">{filtered.length} items</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter subject" /></SelectTrigger>
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
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">No items found</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a: any) => {
            const sub = getSubmissionStatus(a.id);
            const deadline = new Date(a.deadline);
            const isOverdue = isPast(deadline) && a.status === 'ACTIVE';
            return (
              <Card key={a.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAssignmentId(a.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                        <Badge variant={getTypeBadgeVariant(a.type)} className="text-xs">
                          {a.type === 'LAB_REPORT' ? 'Lab Report' : 'Assignment'}
                        </Badge>
                        {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{a.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.subject?.name}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(deadline, 'MMM d, yyyy')}</span>
                        {a.creator && <span>by {a.creator.name}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {sub ? (
                        <Badge className={getStatusColor(sub.status)}>{sub.status} {sub.marks ? `· ${sub.marks}/100` : ''}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">Pending</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (!assignment) return <div className="text-center py-12 text-gray-400">Assignment not found</div>;

  const deadline = new Date(assignment.deadline);
  const hasSubmitted = submissions.some((s: any) => s.studentId === user?.id);
  const mySubmission = submissions.find((s: any) => s.studentId === user?.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().setPage('assignments')} className="text-gray-500">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to list
      </Button>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getTypeBadgeVariant(assignment.type)}>
                  {assignment.type === 'LAB_REPORT' ? 'Lab Report' : 'Assignment'}
                </Badge>
                <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
              </div>
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              <CardDescription className="mt-1">
                {assignment.subject?.name} ({assignment.subject?.code}) · by {assignment.creator?.name}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isPast(deadline) ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <Calendar className="w-4 h-4" />
                {format(deadline, 'MMM d, yyyy HH:mm')}
              </div>
              <p className="text-xs text-gray-400 mt-1">{submissions.length} submissions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{assignment.description}</div>

          {user?.role === 'STUDENT' && !hasSubmitted && assignment.status === 'ACTIVE' && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-sm text-emerald-800 font-medium mb-3">Ready to submit your work?</p>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Submitting...</> : <><Upload className="w-4 h-4 mr-2" />Submit Work</>}
              </Button>
            </div>
          )}

          {mySubmission && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Your Submission</p>
                  <p className="text-xs text-purple-600">{mySubmission.fileName} · {mySubmission.status}</p>
                  {mySubmission.marks != null && <p className="text-sm font-bold text-purple-900 mt-1">Score: {mySubmission.marks}/100</p>}
                  {mySubmission.feedback && <p className="text-xs text-purple-700 mt-1">Feedback: {mySubmission.feedback}</p>}
                </div>
                <CheckCircle2 className="w-8 h-8 text-purple-400 shrink-0" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {submissions.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No submissions yet</p>
                  ) : (
                    submissions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={s.student?.avatar} />
                              <AvatarFallback className="text-xs">{s.student?.name ? getInitials(s.student.name) : '?'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">{s.student?.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{s.fileName}</p>
                          {s.marks != null && <p className="text-xs font-medium text-purple-700">Score: {s.marks}/100</p>}
                          {s.feedback && <p className="text-xs text-gray-500 mt-0.5 truncate">{s.feedback}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge className={`text-xs ${getStatusColor(s.status)}`}>{s.status}</Badge>
                          {s.status !== 'GRADED' && user?.role === 'TEACHER' && (
                            <Dialog open={gradeDialogOpen && selectedSubId === s.id} onOpenChange={(open) => { if (!open) { setGradeDialogOpen(false); setSelectedSubId(null); } }}>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openGradeDialog(s.id)}>
                                <PenTool className="w-3 h-3 mr-1" />Grade
                              </Button>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Grade Submission</DialogTitle>
                                  <DialogDescription>{s.student?.name} - {s.fileName}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                  <div className="space-y-2">
                                    <Label>Marks (out of 100)</Label>
                                    <Input type="number" min="0" max="100" value={gradeData.marks} onChange={(e) => setGradeData({ ...gradeData, marks: e.target.value })} placeholder="0-100" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Feedback</Label>
                                    <Textarea value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} placeholder="Provide feedback..." rows={3} />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => { setGradeDialogOpen(false); setSelectedSubId(null); }}>Cancel</Button>
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

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Discussion ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No comments yet. Start the discussion!</p>
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
                          <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <Separator className="my-3" />
            <div className="flex gap-2">
              <Input placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(); } }} />
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
        <h1 className="text-2xl font-bold text-gray-900">Create New Assignment</h1>
        <p className="text-gray-500 mt-1">Set up a new assignment or lab report for your students</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ca-title">Title</Label>
              <Input id="ca-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Assignment title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-desc">Description</Label>
              <Textarea id="ca-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the assignment requirements..." rows={4} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="LAB_REPORT">Lab Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-deadline">Deadline</Label>
              <Input id="ca-deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setPage('assignments')}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Creating...</> : 'Create Assignment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
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
          <h1 className="text-2xl font-bold text-gray-900">{user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions'}</h1>
          <p className="text-gray-500 mt-1">{filtered.length} submissions</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Select value={filterAssignment} onValueChange={setFilterAssignment}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Filter by assignment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              {assignments.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">No submissions found</CardContent></Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Assignment</TableHead>
                <TableHead>Details</TableHead>
                {user?.role === 'TEACHER' && <TableHead className="hidden sm:table-cell">Student</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium hidden sm:table-cell max-w-[200px] truncate">{s.assignment?.title}</TableCell>
                  <TableCell>
                    <p className="font-medium sm:hidden text-sm">{s.assignment?.title}</p>
                    <p className="text-sm text-gray-500 truncate">{s.fileName}</p>
                    <p className="text-xs text-gray-400">{format(new Date(s.submittedAt), 'MMM d')}</p>
                  </TableCell>
                  {user?.role === 'TEACHER' && (
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6"><AvatarImage src={s.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(s.student?.name || '?')}</AvatarFallback></Avatar>
                        <span className="text-sm">{s.student?.name}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell><Badge className={`text-xs ${getStatusColor(s.status)}`}>{s.status}</Badge></TableCell>
                  <TableCell>{s.marks != null ? <span className="font-medium">{s.marks}/100</span> : <span className="text-gray-400">-</span>}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Academic Assistant
          </h1>
          <p className="text-gray-500 text-sm mt-1">Powered by AI · Ask anything about your assignments</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setMessages([])}>
            <MessageSquare className="w-4 h-4 mr-1" />Clear Chat
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">How can I help you today?</h3>
              <p className="text-sm text-gray-500 mt-1 mb-6 max-w-sm">I can help with assignments, programming, lab reports, and academic questions.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <Button key={i} variant="outline" className="text-xs h-auto py-2.5 text-left justify-start" onClick={() => sendMessage(prompt)}>
                    <MessageCircle className="w-3 h-3 mr-2 shrink-0" />
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className={msg.role === 'user' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}>
                    {msg.role === 'user' ? getInitials(useAppStore.getState().user?.name || 'U') : 'AI'}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-md' : 'bg-gray-100 text-gray-800 rounded-tl-md'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-code:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8"><AvatarFallback className="bg-purple-100 text-purple-700 text-xs">AI</AvatarFallback></Avatar>
              <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your studies..." disabled={loading} className="flex-1" />
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

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" />Student Leaderboard</h1>
        <p className="text-gray-500 mt-1">Top performers ranked by academic performance</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">No graded submissions yet</CardContent></Card>
      ) : (
        <>
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map((idx) => {
                const e = entries[idx];
                if (!e) return null;
                return (
                  <Card key={e.id} className={`border-0 shadow-sm text-center ${idx === 0 ? 'ring-2 ring-amber-300' : ''}`}>
                    <CardContent className="p-4">
                      <div className="text-3xl mb-2">{medals[idx]}</div>
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={e.avatar} />
                        <AvatarFallback>{getInitials(e.name)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm truncate">{e.name}</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{e.averageMarks?.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{e.totalSubmissions} submissions</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="border-0 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Average Marks</TableHead>
                  <TableHead className="w-32">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e: any, i: number) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-bold">{i < 3 ? <span className="text-lg">{medals[i]}</span> : `#${i + 1}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8"><AvatarImage src={e.avatar} /><AvatarFallback className="text-xs">{getInitials(e.name)}</AvatarFallback></Avatar>
                        <span className="font-medium">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{e.totalSubmissions}</TableCell>
                    <TableCell className="font-bold text-emerald-700">{e.averageMarks?.toFixed(1)}%</TableCell>
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
      case 'ASSIGNMENT': return <ClipboardList className="w-4 h-4 text-emerald-600" />;
      case 'DEADLINE': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'FEEDBACK': return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notifications yet</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card key={n.id} className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${!n.isRead ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''}`} onClick={() => !n.isRead && markAsRead(n.id)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-gray-100">{getNotifIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />}
                </div>
              </CardContent>
            </Card>
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
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xl">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <Badge className={`mt-1 ${getRoleBadgeColor(user?.role || '')}`}>{user?.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Account Statistics</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-12 rounded-lg" /><Skeleton className="h-12 rounded-lg" /></div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-3">
              {user?.role === 'STUDENT' && (
                <>
                  <div className="p-3 rounded-lg bg-emerald-50"><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-emerald-700">{stats.pendingAssignments || 0}</p></div>
                  <div className="p-3 rounded-lg bg-purple-50"><p className="text-xs text-gray-500">Submitted</p><p className="text-xl font-bold text-purple-700">{stats.submittedCount || 0}</p></div>
                  <div className="p-3 rounded-lg bg-amber-50"><p className="text-xs text-gray-500">Average Grade</p><p className="text-xl font-bold text-amber-700">{stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A'}</p></div>
                  <div className="p-3 rounded-lg bg-rose-50"><p className="text-xs text-gray-500">Upcoming</p><p className="text-xl font-bold text-rose-700">{stats.upcomingDeadlines || 0}</p></div>
                </>
              )}
              {user?.role === 'TEACHER' && (
                <>
                  <div className="p-3 rounded-lg bg-emerald-50"><p className="text-xs text-gray-500">Assignments</p><p className="text-xl font-bold text-emerald-700">{stats.createdAssignments || 0}</p></div>
                  <div className="p-3 rounded-lg bg-blue-50"><p className="text-xs text-gray-500">Submissions</p><p className="text-xl font-bold text-blue-700">{stats.totalSubmissions || 0}</p></div>
                  <div className="p-3 rounded-lg bg-amber-50"><p className="text-xs text-gray-500">To Grade</p><p className="text-xl font-bold text-amber-700">{stats.pendingGrading || 0}</p></div>
                  <div className="p-3 rounded-lg bg-purple-50"><p className="text-xs text-gray-500">Avg Marks</p><p className="text-xl font-bold text-purple-700">{stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A'}</p></div>
                </>
              )}
              {user?.role === 'ADMIN' && (
                <>
                  <div className="p-3 rounded-lg bg-emerald-50"><p className="text-xs text-gray-500">Total Users</p><p className="text-xl font-bold text-emerald-700">{stats.totalUsers || 0}</p></div>
                  <div className="p-3 rounded-lg bg-blue-50"><p className="text-xs text-gray-500">Assignments</p><p className="text-xl font-bold text-blue-700">{stats.totalAssignments || 0}</p></div>
                  <div className="p-3 rounded-lg bg-purple-50"><p className="text-xs text-gray-500">Submissions</p><p className="text-xl font-bold text-purple-700">{stats.totalSubmissions || 0}</p></div>
                  <div className="p-3 rounded-lg bg-amber-50"><p className="text-xs text-gray-500">Subjects</p><p className="text-xl font-bold text-amber-700">{stats.activeSubjects || 0}</p></div>
                </>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main App Layout ────────────────────────────────────
function AppLayout() {
  const { user, currentPage, notificationCount, toggleSidebar, setPage, setNotificationCount } = useAppStore();

  useEffect(() => {
    notificationApi.list().then((data: any[]) => {
      setNotificationCount(Array.isArray(data) ? data.filter(n => !n.isRead).length : 0);
    }).catch(() => {});
  }, [currentPage, setNotificationCount]);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'assignments': return 'Assignments';
      case 'lab-reports': return 'Lab Reports';
      case 'assignment-detail': return 'Assignment Details';
      case 'create-assignment': return 'Create Assignment';
      case 'submissions': return user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions';
      case 'ai-chat': return 'AI Assistant';
      case 'leaderboard': return 'Leaderboard';
      case 'notifications': return 'Notifications';
      case 'profile': return 'Profile';
      default: return 'Dashboard';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'assignments': return <AssignmentsPage type="ASSIGNMENT" />;
      case 'lab-reports': return <AssignmentsPage type="LAB_REPORT" />;
      case 'assignment-detail': return <AssignmentDetailPage />;
      case 'create-assignment': return <CreateAssignmentPage />;
      case 'submissions': return <SubmissionsPage />;
      case 'ai-chat': return <AIChatPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <MobileSidebar />

      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r z-30">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">PU-ALRMS</p>
              <p className="text-xs text-gray-400">Prime University</p>
            </div>
          </div>
        </div>
        <SidebarNav onNavigate={setPage} />
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user?.role || '')}`}>{user?.role}</Badge>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-64 flex flex-col min-h-screen flex-1">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                <Menu className="w-5 h-5" />
              </Button>
              <h2 className="font-semibold text-gray-900">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" onClick={() => setPage('notifications')}>
                      <Bell className="w-5 h-5" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Avatar className="w-7 h-7"><AvatarImage src={user?.avatar} /><AvatarFallback className="text-xs">{user?.name ? getInitials(user.name) : '?'}</AvatarFallback></Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPage('profile')}><UserIcon className="w-4 h-4 mr-2" />Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => useAppStore.getState().logout()} className="text-red-600"><LogOut className="w-4 h-4 mr-2" />Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {renderPage()}
        </main>

        <footer className="border-t bg-white px-4 py-3 mt-auto">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>PU-ALRMS © 2024 Prime University</span>
            <span>Assignment &amp; Lab Report Management System</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Root Page Component ─────────────────────────────────
export default function HomePage() {
  const { isAuthenticated, mounted, hydrate } = useAppStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      {isAuthenticated ? <AppLayout /> : <AuthPage />}
    </TooltipProvider>
  );
}
