'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app';
import { apiFetch } from '@/lib/api';
import { playNotificationSound } from '@/components/pu-helpers';
import {
  ClipboardList, Upload, FileText, Clock, AlertTriangle, CheckCircle2, Bell,
  Download, RefreshCw, BookOpen, FlaskConical, Presentation, Eye, Send,
  Calendar, Search, X, Paperclip, MessageSquare, CheckCheck, Sparkles, Inbox,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// Types & Constants
// ══════════════════════════════════════════════════════════════

interface Task {
  id: string;
  subjectName: string;
  subjectCode: string;
  type: 'ASSIGNMENT' | 'LAB_REPORT' | 'PRESENTATION';
  description: string;
  dueDate: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  batch: string;
  creatorId: string;
  creator?: { id: string; name: string; role: string };
  myResponse?: {
    id: string;
    fileName: string;
    fileSize?: number;
    fileUrl?: string;
    notes?: string;
    status: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
    marks?: number;
    feedback?: string;
    submittedAt: string;
    gradedAt?: string;
  };
  createdAt: string;
}

interface BatchNotification {
  id: string;
  type: 'NEW_TASK' | 'DEADLINE_REMINDER' | 'GENERAL';
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  ASSIGNMENT: { label: 'Assignment', color: 'emerald', icon: FileText, strip: 'from-emerald-500 to-teal-500' },
  LAB_REPORT: { label: 'Lab Report', color: 'amber', icon: FlaskConical, strip: 'from-amber-500 to-orange-500' },
  PRESENTATION: { label: 'Presentation', color: 'rose', icon: Presentation, strip: 'from-rose-500 to-pink-500' },
} as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  LATE: { label: 'Late', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  GRADED: { label: 'Graded', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: CheckCircle2 },
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'];

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getDaysUntil(dueDate: string): { days: number; text: string; urgent: boolean } {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { days, text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { days, text: 'Due today', urgent: true };
  if (days === 1) return { days, text: 'Due tomorrow', urgent: false };
  if (days <= 3) return { days, text: `${days}d remaining`, urgent: true };
  return { days, text: `${days}d remaining`, urgent: false };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return 'N/A'; }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDateShort(dateStr);
  } catch { return ''; }
}

function validateFile(file: File): string | null {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ACCEPTED_TYPES.includes(ext)) {
    return `Invalid file type "${ext}". Accepted: PDF, DOCX, PPTX, images, ZIP`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${formatFileSize(file.size)}). Max size: 25MB`;
  }
  return null;
}

function triggerNotification() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch { /* noop */ }
  }
  playNotificationSound();
}

// ══════════════════════════════════════════════════════════════
// Loading Skeleton
// ══════════════════════════════════════════════════════════════

function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-1 h-full min-h-[80px] rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-64" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════

function StudentTasksPage() {
  const { user } = useAppStore();

  // ─── Data State ─────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<BatchNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // ─── Filter State ───────────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);

  // ─── Dialog State ───────────────────────────────────────
  const [submitOpen, setSubmitOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ─── Submit Form State ──────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUnmountedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => { isUnmountedRef.current = true; };
  }, []);

  // ─── Fetch Tasks ────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (user?.batch) params.set('batch', user.batch);

      const res = await apiFetch<{ success: boolean; data: Task[]; total?: number; pagination?: { total: number } }>(
        `/api/tasks?${params.toString()}`
      );
      if (!isUnmountedRef.current) {
        setTasks(Array.isArray(res.data) ? res.data : []);
        setTotalTasks(res.pagination?.total ?? res.total ?? (Array.isArray(res.data) ? res.data.length : 0));
      }
    } catch (err: any) {
      if (!isUnmountedRef.current) {
        toast.error(err.message || 'Failed to load tasks');
      }
    } finally {
      if (!isUnmountedRef.current) setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search, user?.batch]);

  // ─── Fetch Notifications ────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifsLoading(true);
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (user?.batch) params.set('batch', user.batch);

      const res = await apiFetch<{ success: boolean; data: BatchNotification[] }>(
        `/api/batch-notifications?${params.toString()}`
      );
      if (!isUnmountedRef.current) {
        const notifs = Array.isArray(res.data) ? res.data : [];
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.read).length;
        useAppStore.getState().setNotificationCount(unread);
      }
    } catch { /* silent */ }
    finally { if (!isUnmountedRef.current) setNotifsLoading(false); }
  }, [user?.batch]);

  // ─── Initial Load ───────────────────────────────────────
  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ─── Process & Filter Tasks ─────────────────────────────
  const processedTasks = tasks.filter((t) => {
    if (t.status === 'ARCHIVED') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.subjectName.toLowerCase().includes(q) && !t.subjectCode.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (statusFilter !== 'all') {
      const responseStatus = t.myResponse?.status || 'PENDING';
      if (statusFilter === 'PENDING' && responseStatus !== 'PENDING') return false;
      if (statusFilter === 'SUBMITTED' && responseStatus !== 'SUBMITTED' && responseStatus !== 'LATE') return false;
      if (statusFilter === 'LATE' && responseStatus !== 'LATE') return false;
      if (statusFilter === 'GRADED' && responseStatus !== 'GRADED') return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (sortBy === 'subjectName') return a.subjectName.localeCompare(b.subjectName);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });

  // ─── Stats ──────────────────────────────────────────────
  const stats = {
    pending: tasks.filter(t => !t.myResponse || t.myResponse.status === 'PENDING').length,
    submitted: tasks.filter(t => t.myResponse?.status === 'SUBMITTED').length,
    late: tasks.filter(t => t.myResponse?.status === 'LATE').length,
    graded: tasks.filter(t => t.myResponse?.status === 'GRADED').length,
  };
  const unreadNotifs = notifications.filter(n => !n.read).length;

  // ─── File Handlers ──────────────────────────────────────
  const handleFileSelect = (f: File) => {
    const error = validateFile(f);
    if (error) { toast.error(error); return; }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const removeFile = () => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // ─── Submit Handler ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedTask || !file) { toast.error('Please select a file'); return; }

    const isLate = new Date(selectedTask.dueDate).getTime() < Date.now();
    if (isLate) {
      toast.warning('This submission will be marked as LATE');
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      if (notes) formData.append('notes', notes);

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/tasks/${selectedTask.id}/respond`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Submission failed');

      setSubmitSuccess(true);
      toast.success(isLate ? 'Submitted (marked as late)' : 'Submitted successfully!');

      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setSubmitOpen(false);
          setSubmitSuccess(false);
          setFile(null);
          setNotes('');
          fetchTasks();
        }
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      if (!isUnmountedRef.current) setSubmitting(false);
    }
  };

  // ─── Dialog Openers ─────────────────────────────────────
  const openSubmit = (task: Task) => {
    setSelectedTask(task);
    setFile(null);
    setNotes('');
    setSubmitSuccess(false);
    setSubmitOpen(true);
  };

  const openGrade = (task: Task) => {
    setSelectedTask(task);
    setGradeOpen(true);
  };

  // ─── Notification Click ─────────────────────────────────
  const handleNotifClick = (notif: BatchNotification) => {
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      const remaining = notifications.filter(n => !n.read && n.id !== notif.id).length;
      useAppStore.getState().setNotificationCount(remaining);
    }
    if (notif.taskId) {
      const task = tasks.find(t => t.id === notif.taskId);
      if (task) {
        setNotifOpen(false);
        if (task.myResponse?.status === 'GRADED') openGrade(task);
        else openSubmit(task);
      }
    }
    setNotifOpen(false);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-5 min-w-0 overflow-x-hidden">
      {/* ─── Header ──────────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  My Tasks
                </h1>
                {user?.batch && (
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px] border-0 font-semibold">
                    {user.batch}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Loading...' : `${processedTasks.length} task${processedTasks.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchTasks(); fetchNotifications(); toast.success('Refreshed'); }}
              className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotifOpen(true)}
              className="relative h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Notifications
              {unreadNotifs > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </motion.span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Summary ───────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Pending', count: stats.pending, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
            { label: 'Submitted', count: stats.submitted, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
            { label: 'Late', count: stats.late, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
            { label: 'Graded', count: stats.graded, color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
          ].map(s => (
            <div key={s.label} className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border ${s.color} transition-all`}>
              <span className="text-lg sm:text-xl font-bold">{loading ? '—' : s.count}</span>
              <span className="text-[10px] sm:text-xs font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Filters ─────────────────────────────────────── */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-full sm:w-40 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
              <SelectItem value="LAB_REPORT">Lab Report</SelectItem>
              <SelectItem value="PRESENTATION">Presentation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-full sm:w-40 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="GRADED">Graded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 w-full sm:w-40 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="subjectName">Subject Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ─── Task List ────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <TaskCardSkeleton key={i} />)}
        </div>
      ) : processedTasks.length === 0 ? (
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border dark:border-gray-800">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                {stats.pending === 0 && stats.submitted + stats.late + stats.graded > 0 ? (
                  <Sparkles className="w-8 h-8 text-emerald-400 dark:text-emerald-500" />
                ) : (
                  <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-medium">
                {stats.pending === 0 && stats.submitted + stats.late + stats.graded > 0
                  ? 'All tasks submitted! 🎉'
                  : 'No tasks assigned yet'
                }
              </p>
              <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">
                {stats.pending === 0 && stats.submitted + stats.late + stats.graded > 0
                  ? 'Great job! Check back later for new tasks.'
                  : 'New tasks will appear here when assigned.'
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {processedTasks.map((task, i) => {
            const typeCfg = TYPE_CONFIG[task.type] || TYPE_CONFIG.ASSIGNMENT;
            const TypeIcon = typeCfg.icon;
            const responseStatus = task.myResponse?.status || 'PENDING';
            const statusCfg = STATUS_CONFIG[responseStatus] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusCfg.icon;
            const due = getDaysUntil(task.dueDate);
            const isOverdue = due.days < 0 && responseStatus === 'PENDING';
            const isLateWarning = due.days < 3 && due.days >= 0 && responseStatus === 'PENDING';
            const canSubmit = responseStatus === 'PENDING' || responseStatus === 'SUBMITTED' || responseStatus === 'LATE';
            const isGraded = responseStatus === 'GRADED';
            const isPastDeadline = new Date(task.dueDate).getTime() < Date.now();

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border border-gray-200/80 dark:border-gray-700/50 hover:shadow-md transition-all overflow-hidden">
                  <CardContent className="p-3.5 sm:p-4">
                    <div className="flex items-start gap-3">
                      {/* Left color strip */}
                      <div className={`w-1 self-stretch rounded-full shrink-0 bg-gradient-to-b ${typeCfg.strip}`} />

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Subject + Type + Status row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-none">
                            {task.subjectName}
                          </h3>
                          <Badge className={`text-[10px] border-0 font-medium ${
                            task.type === 'ASSIGNMENT'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : task.type === 'LAB_REPORT'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}>
                            <TypeIcon className="w-3 h-3 mr-0.5" />
                            {typeCfg.label}
                          </Badge>
                        </div>

                        {/* Subject code */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-mono">{task.subjectCode}</p>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mb-2">{task.description}</p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(task.dueDate)}
                          </span>
                          <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-500' : isLateWarning ? 'text-amber-500' : ''}`}>
                            <Clock className="w-3 h-3" />
                            {due.text}
                          </span>
                          {task.creator && (
                            <span className="hidden sm:inline">by {task.creator.name}</span>
                          )}
                        </div>
                      </div>

                      {/* Right side: Status + Action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Response status badge */}
                        <Badge className={`${statusCfg.color} text-[10px] font-semibold px-2 py-0.5`}>
                          <StatusIcon className="w-3 h-3 mr-0.5" />
                          {statusCfg.label}
                          {task.myResponse?.marks != null && (
                            <span className="ml-1">{task.myResponse.marks}/100</span>
                          )}
                        </Badge>

                        {/* Late warning */}
                        {isPastDeadline && responseStatus === 'PENDING' && (
                          <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}

                        {/* Action button */}
                        {isGraded ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                            onClick={() => openGrade(task)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View Grade
                          </Button>
                        ) : canSubmit ? (
                          <Button
                            size="sm"
                            className={`h-8 text-xs gap-1 text-white ${
                              responseStatus === 'SUBMITTED' || responseStatus === 'LATE'
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                            onClick={() => openSubmit(task)}
                          >
                            {responseStatus === 'SUBMITTED' || responseStatus === 'LATE'
                              ? <><RefreshCw className="w-3.5 h-3.5" /> Resubmit</>
                              : <><Send className="w-3.5 h-3.5" /> Submit</>
                            }
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs gap-1 text-gray-400"
                            disabled
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </Button>
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

      {/* ═══════════════════════════════════════════════════════
          Notification Panel (Sheet)
          ═══════════════════════════════════════════════════════ */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md dark:bg-gray-950">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Notifications
              {unreadNotifs > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] border-0">
                  {unreadNotifs} new
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>Updates from your batch</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-hidden flex flex-col mt-2">
            {notifsLoading ? (
              <div className="space-y-3 px-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl dark:bg-gray-800" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No new notifications</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 max-h-[calc(100vh-180px)]">
                <div className="space-y-2 px-4 pb-4">
                  {notifications.map(notif => {
                    const notifIcon = notif.type === 'NEW_TASK'
                      ? <FileText className="w-4 h-4 text-emerald-500" />
                      : notif.type === 'DEADLINE_REMINDER'
                        ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                        : <MessageSquare className="w-4 h-4 text-gray-500" />;

                    return (
                      <motion.button
                        key={notif.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left rounded-xl p-3 border transition-all ${
                          notif.read
                            ? 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            : 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{notifIcon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-sm font-medium truncate ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">{timeAgo(notif.createdAt)}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════
          Submit Response Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={submitOpen} onOpenChange={(open) => { if (!submitting) setSubmitOpen(open); }}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          {submitSuccess ? (
            <div className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submitted!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your response has been recorded.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {selectedTask?.myResponse?.status === 'SUBMITTED' || selectedTask?.myResponse?.status === 'LATE'
                    ? 'Resubmit Response'
                    : 'Submit Response'
                  }
                </DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Upload your work for this task
                </DialogDescription>
              </DialogHeader>

              {/* Task Info Summary */}
              {selectedTask && (
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.subjectName}</span>
                    <Badge className={`text-[10px] border-0 ${
                      selectedTask.type === 'ASSIGNMENT'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : selectedTask.type === 'LAB_REPORT'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {TYPE_CONFIG[selectedTask.type]?.label || selectedTask.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>Due: {formatDate(selectedTask.dueDate)}</span>
                    <span className={getDaysUntil(selectedTask.dueDate).urgent ? 'text-red-500 font-medium' : ''}>
                      ({getDaysUntil(selectedTask.dueDate).text})
                    </span>
                  </div>
                  {selectedTask.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{selectedTask.description}</p>
                  )}
                </div>
              )}

              {/* Late Warning */}
              {selectedTask && new Date(selectedTask.dueDate).getTime() < Date.now() && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    This submission will be marked as <strong>LATE</strong>
                  </p>
                </div>
              )}

              {/* File Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Upload File
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                  className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : file
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50/50 dark:bg-gray-800/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_TYPES.join(',')}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />

                  {file ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Paperclip className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 shrink-0"
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600">
                        PDF, DOCX, PPTX, Images, ZIP (max 25MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any comments or notes about your submission..."
                  rows={2}
                  className="text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSubmitOpen(false)} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !file}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-1.5" /> Submit</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          Grade View Dialog
          ═══════════════════════════════════════════════════════ */}
      <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              Grade Details
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">View your submission grade and feedback</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {/* Task Info */}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2 border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedTask.subjectName}</span>
                  <Badge className={`text-[10px] border-0 ${
                    selectedTask.type === 'ASSIGNMENT'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : selectedTask.type === 'LAB_REPORT'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    {TYPE_CONFIG[selectedTask.type]?.label || selectedTask.type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{selectedTask.subjectCode}</p>
              </div>

              {/* Marks */}
              {selectedTask.myResponse?.marks != null && (
                <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 p-4 border border-teal-200 dark:border-teal-800/50 text-center">
                  <p className="text-3xl font-bold text-teal-700 dark:text-teal-400">
                    {selectedTask.myResponse.marks}
                    <span className="text-lg text-teal-500 dark:text-teal-500/70">/100</span>
                  </p>
                  <Progress value={selectedTask.myResponse.marks} className="mt-2 h-2" />
                </div>
              )}

              {/* Feedback */}
              {selectedTask.myResponse?.feedback && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Teacher Feedback
                  </label>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTask.myResponse.feedback}</p>
                  </div>
                </div>
              )}

              {/* Submission Details */}
              {selectedTask.myResponse && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Submission Details
                  </label>
                  <div className="rounded-lg border border-gray-100 dark:border-gray-700/50 divide-y dark:divide-gray-800">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">File</span>
                      {selectedTask.myResponse.fileUrl ? (
                        <a
                          href={selectedTask.myResponse.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                        >
                          <Download className="w-3 h-3" />
                          {selectedTask.myResponse.fileName || 'Download'}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{selectedTask.myResponse.fileName || 'N/A'}</span>
                      )}
                    </div>
                    {selectedTask.myResponse.notes && (
                      <div className="px-3 py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Notes</span>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{selectedTask.myResponse.notes}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Submitted</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {formatDate(selectedTask.myResponse.submittedAt)}
                      </span>
                    </div>
                    {selectedTask.myResponse.gradedAt && (
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Graded</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {formatDate(selectedTask.myResponse.gradedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Timeline
                </label>
                <div className="flex items-center gap-0 px-3 py-1">
                  {[
                    { label: 'Created', date: selectedTask.createdAt, active: true },
                    { label: 'Submitted', date: selectedTask.myResponse?.submittedAt, active: !!selectedTask.myResponse },
                    { label: 'Graded', date: selectedTask.myResponse?.gradedAt, active: selectedTask.myResponse?.status === 'GRADED' },
                  ].map((step, idx, arr) => (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          step.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{step.label}</span>
                        {step.date && (
                          <span className="text-[8px] text-gray-400 dark:text-gray-600">{formatDateShort(step.date)}</span>
                        )}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mb-4 mx-1 ${
                          step.active && arr[idx + 1].active
                            ? 'bg-emerald-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setGradeOpen(false)} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentTasksPage;
