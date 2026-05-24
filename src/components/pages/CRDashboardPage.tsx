'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAppStore } from '@/store/app';
import { taskApi, batchNotificationApi } from '@/lib/api';
import { silentError, ApiError } from '@/lib/api';
import { safeFormat, getInitials, AnimatedCounter } from '@/components/pu-helpers';
import {
  ClipboardList, Plus, Edit, Trash2, Send, Users, BarChart3,
  Calendar, Clock, AlertTriangle, FileText, Presentation,
  FlaskConical, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Search, Bell, Eye, MoreVertical, MessageSquare, TrendingUp,
  Save, X, GraduationCap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface TaskItem {
  id: string;
  subjectName: string;
  subjectCode: string;
  batch: string;
  type: string;
  description: string;
  dueDate: string;
  status: string;
  createdAt: string;
  _count?: { responses: number };
}

interface ResponseItem {
  id: string;
  studentId: string;
  student?: { id: string; name: string; email: string; avatar?: string };
  status: string;
  marks: number | null;
  feedback: string | null;
  fileName?: string;
  fileUrl?: string;
  submittedAt: string;
}

interface AnalyticsData {
  totalTasks: number;
  activeTasks: number;
  closedTasks: number;
  overdueTasks: number;
  totalSubmissions: number;
  gradedSubmissions: number;
  completionRate: number;
  taskCompletionRates: { taskId: string; taskName: string; submitted: number; total: number }[];
  pendingCount: number;
  submittedCount: number;
  lateCount: number;
  gradedCount: number;
  tasksByType: { type: string; count: number }[];
  recentActivity?: { action: string; message: string; time: string }[];
}

// ═══════════════════════════════════════════════════════════
// Animation Variants
// ═══════════════════════════════════════════════════════════
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
function getTypeBadge(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    ASSIGNMENT: { label: 'Assignment', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    LAB_REPORT: { label: 'Lab Report', cls: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' },
    PRESENTATION: { label: 'Presentation', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };
  return map[type] || { label: type, cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
}

function getStatusBadge(status: string) {
  const map: Record<string, { cls: string }> = {
    ACTIVE: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    CLOSED: { cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    ARCHIVED: { cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  };
  return map[status] || { cls: 'bg-gray-100 text-gray-600' };
}

function getResponseStatusBadge(status: string) {
  const map: Record<string, { cls: string; icon: React.ElementType }> = {
    PENDING: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock },
    SUBMITTED: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
    LATE: { cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle },
    GRADED: { cls: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300', icon: CheckCircle2 },
  };
  return map[status] || { cls: 'bg-gray-100 text-gray-600', icon: Clock };
}

function getDaysRemaining(dueDate: string): { days: number; label: string; color: string } {
  try {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return { days, label: `${Math.abs(days)}d overdue`, color: 'text-red-600 dark:text-red-400' };
    if (days === 0) return { days, label: 'Due today', color: 'text-red-600 dark:text-red-400' };
    if (days === 1) return { days, label: '1 day left', color: 'text-red-600 dark:text-red-400' };
    if (days <= 4) return { days, label: `${days}d left`, color: 'text-amber-600 dark:text-amber-400' };
    return { days, label: `${days}d left`, color: 'text-emerald-600 dark:text-emerald-400' };
  } catch {
    return { days: 0, label: 'N/A', color: 'text-gray-400' };
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'LAB_REPORT': return FlaskConical;
    case 'PRESENTATION': return Presentation;
    default: return FileText;
  }
}

// ═══════════════════════════════════════════════════════════
// Spinner
// ═══════════════════════════════════════════════════════════
function Spinner({ className = '' }: { className?: string }) {
  return <div className={`w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin ${className}`} />;
}

// ═══════════════════════════════════════════════════════════
// Skeleton Loading
// ═══════════════════════════════════════════════════════════
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl dark:bg-gray-800" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-12 rounded-xl dark:bg-gray-800" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl dark:bg-gray-800" />)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function CRDashboardPage() {
  const { user } = useAppStore();
  const batch = user?.batch || '';

  // ─── Data State ────────────────────────────────────────
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // ─── Filter State ─────────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  // ─── Dialog State ─────────────────────────────────────
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [responsesSheetOpen, setResponsesSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // ─── Task Form State ──────────────────────────────────
  const [form, setForm] = useState({
    subjectName: '', subjectCode: '', type: 'ASSIGNMENT',
    dueDate: '', description: '', batch: batch,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // ─── Notification Form ────────────────────────────────
  const [notifyForm, setNotifyForm] = useState({
    title: '', message: '', type: 'GENERAL', batch: batch,
  });
  const [notifySubmitting, setNotifySubmitting] = useState(false);

  // ─── Responses State ──────────────────────────────────
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState<Record<string, string>>({});
  const [gradeFeedback, setGradeFeedback] = useState<Record<string, string>>({});

  // ─── Responses summary from API ──────────────────────
  const [responseSummary, setResponseSummary] = useState<{
    total: number; submitted: number; pending: number;
    late: number; graded: number; averageMarks: number;
  } | null>(null);

  // ─── Tab State ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('tasks');

  // ══════════════════════════════════════════════════════
  // FETCH: Tasks
  // ══════════════════════════════════════════════════════
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (batch) params.batch = batch;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const data = await taskApi.list(params);
      const result = data?.data || data;
      setTasks(Array.isArray(result?.tasks || result) ? (result.tasks || result) : []);
      setTotalPages(result?.pagination?.totalPages || Math.ceil((result?.pagination?.total || 0) / limit) || 1);
    } catch (err) {
      silentError(err, 'CRDashboard:fetchTasks');
    } finally {
      setLoading(false);
    }
  }, [batch, typeFilter, statusFilter, search, page, limit]);

  // ══════════════════════════════════════════════════════
  // FETCH: Analytics
  // ══════════════════════════════════════════════════════
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await taskApi.analytics();
      setAnalytics(data?.data || data || null);
    } catch (err) {
      silentError(err, 'CRDashboard:fetchAnalytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, search]);

  // ══════════════════════════════════════════════════════
  // TASK CRUD
  // ══════════════════════════════════════════════════════
  const openCreateDialog = () => {
    setEditingTask(null);
    setForm({ subjectName: '', subjectCode: '', type: 'ASSIGNMENT', dueDate: '', description: '', batch });
    setFormErrors({});
    setTaskDialogOpen(true);
  };

  const openEditDialog = (task: TaskItem) => {
    setEditingTask(task);
    setForm({
      subjectName: task.subjectName,
      subjectCode: task.subjectCode,
      type: task.type,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      description: task.description || '',
      batch: task.batch || batch,
    });
    setFormErrors({});
    setTaskDialogOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.subjectName.trim()) errors.subjectName = 'Subject name is required';
    if (!form.subjectCode.trim()) errors.subjectCode = 'Subject code is required';
    if (!form.dueDate) errors.dueDate = 'Due date is required';
    if (!form.batch.trim()) errors.batch = 'Batch name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTaskSubmit = async () => {
    if (!validateForm()) return;
    setFormSubmitting(true);
    try {
      if (editingTask) {
        await taskApi.update(editingTask.id, form);
        toast.success('Task updated successfully');
      } else {
        await taskApi.create(form);
        toast.success('Task created — notifications sent to batch');
      }
      setTaskDialogOpen(false);
      fetchTasks();
      fetchAnalytics();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save task';
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = (task: TaskItem) => {
    setDeletingTask(task);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await taskApi.delete(deletingTask.id);
      toast.success('Task deleted successfully');
      setDeleteConfirmOpen(false);
      setDeletingTask(null);
      fetchTasks();
      fetchAnalytics();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete task';
      toast.error(msg);
    }
  };

  // ══════════════════════════════════════════════════════
  // RESPONSES VIEW
  // ══════════════════════════════════════════════════════
  const openResponses = async (task: TaskItem) => {
    setSelectedTask(task);
    setResponsesSheetOpen(true);
    setResponsesLoading(true);
    setResponses([]);
    setResponseSummary(null);
    try {
      const data = await taskApi.getResponses(task.id);
      const result = data?.data || data;
      setResponses(Array.isArray(result?.responses || result) ? (result.responses || result) : []);
      if (result?.summary) setResponseSummary(result.summary);
    } catch (err) {
      silentError(err, 'CRDashboard:fetchResponses');
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleGrade = async (response: ResponseItem) => {
    const marksVal = parseFloat(gradeMarks[response.id] || String(response.marks || 0));
    const feedbackVal = gradeFeedback[response.id] || response.feedback || '';
    if (isNaN(marksVal) || marksVal < 0) { toast.error('Enter valid marks'); return; }
    setGradingId(response.id);
    try {
      await taskApi.gradeResponse(selectedTask!.id, {
        studentId: response.studentId,
        marks: marksVal,
        feedback: feedbackVal,
      });
      toast.success('Grade saved');
      openResponses(selectedTask!);
      fetchAnalytics();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to grade';
      toast.error(msg);
    } finally {
      setGradingId(null);
    }
  };

  // ══════════════════════════════════════════════════════
  // SEND NOTIFICATION
  // ══════════════════════════════════════════════════════
  const handleSendNotification = async () => {
    if (!notifyForm.title.trim() || !notifyForm.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setNotifySubmitting(true);
    try {
      await batchNotificationApi.send(notifyForm);
      toast.success('Notification sent to batch');
      setNotifyDialogOpen(false);
      setNotifyForm({ title: '', message: '', type: 'GENERAL', batch });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to send notification';
      toast.error(msg);
    } finally {
      setNotifySubmitting(false);
    }
  };

  const sendQuickReminder = (task: TaskItem) => {
    const remaining = getDaysRemaining(task.dueDate);
    batchNotificationApi.send({
      batch: task.batch || batch,
      title: `Deadline Reminder: ${task.subjectName}`,
      message: `This is a reminder that "${task.subjectName}" (${task.subjectCode}) is due ${remaining.label}. Please submit before the deadline.`,
      type: 'DEADLINE',
    }).then(() => {
      toast.success('Deadline reminder sent');
    }).catch((err) => {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send reminder');
    });
  };

  // ══════════════════════════════════════════════════════
  // DERIVED DATA
  // ══════════════════════════════════════════════════════
  const totalStudents = analytics?.totalTasks ? (analytics?.activeTasks || 0) + 20 : 20;
  const pendingResponses = analytics?.pendingCount || 0;
  const completionRate = analytics?.completionRate || 0;
  const overdueTasks = analytics?.overdueTasks || 0;
  const activeTasks = analytics?.activeTasks || 0;

  // ══════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════
  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)] min-w-0 overflow-x-hidden">

      {/* ═══ 1. HEADER ═══ */}
      <motion.div {...fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">CR Dashboard</h1>
                {batch && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                    <GraduationCap className="w-3 h-3 mr-1" />{batch}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage submission tasks for your batch</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" onClick={() => setNotifyDialogOpen(true)}>
              <Bell className="w-4 h-4" /> Notify
            </Button>
            <Button className="gap-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" /> Create Task
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══ 2. QUICK STATS ═══ */}
      {analyticsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl dark:bg-gray-800" />)}
        </div>
      ) : (
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3" variants={stagger} initial="hidden" animate="visible">
          {[
            { label: 'Active Tasks', value: activeTasks, icon: <ClipboardList className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500', desc: 'Total active' },
            { label: 'Pending Responses', value: pendingResponses, icon: <Clock className="w-5 h-5" />, gradient: 'from-amber-500 to-orange-500', desc: 'Awaiting submission' },
            { label: 'Completion Rate', value: completionRate, icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500', desc: 'Overall rate', isPercent: true },
            { label: 'Overdue Tasks', value: overdueTasks, icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-rose-500 to-red-500', desc: 'Past due date' },
          ].map(s => (
            <motion.div key={s.label} variants={staggerChild}>
              <Card className="hover:-translate-y-1 transition-all duration-300 border dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {s.isPercent ? (
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
      )}

      {/* ═══ 3. TABS (Tasks / Analytics) ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 dark:bg-gray-800 h-10">
          <TabsTrigger value="tasks" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            <ClipboardList className="w-3.5 h-3.5" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* ──── TASKS TAB ──── */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          {/* Filter Bar */}
          <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 w-full sm:w-44 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
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
                <SelectTrigger className="h-10 w-full sm:w-44 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Task Cards Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-xl dark:bg-gray-800" />)}
            </div>
          ) : tasks.length === 0 ? (
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <Card className="border dark:border-gray-800">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 font-medium">No tasks found</p>
                  <Button className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white" onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-1.5" /> Create your first task
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <motion.div className="grid md:grid-cols-2 gap-4" variants={stagger} initial="hidden" animate="visible">
                {tasks.map((task) => {
                  const typeInfo = getTypeBadge(task.type);
                  const statusInfo = getStatusBadge(task.status);
                  const remaining = getDaysRemaining(task.dueDate);
                  const TypeIcon = getTypeIcon(task.type);
                  const responseCount = task._count?.responses || 0;

                  return (
                    <motion.div key={task.id} variants={staggerChild}>
                      <Card className="border border-gray-200/80 dark:border-gray-700/50 hover:shadow-md transition-all group overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                task.type === 'LAB_REPORT' ? 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400' :
                                task.type === 'PRESENTATION' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                                'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                <TypeIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {task.subjectName}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge className="text-[10px] font-mono px-1.5 py-0 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{task.subjectCode}</Badge>
                                  <Badge className={`text-[10px] px-1.5 py-0 border ${typeInfo.cls}`}>{typeInfo.label}</Badge>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => openResponses(task)}>
                                  <Eye className="w-4 h-4 mr-2 text-gray-400" /> View Responses
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(task)}>
                                  <Edit className="w-4 h-4 mr-2 text-gray-400" /> Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => sendQuickReminder(task)}>
                                  <Send className="w-4 h-4 mr-2 text-gray-400" /> Send Reminder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => confirmDelete(task)} className="text-red-600 dark:text-red-400 focus:text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
                          )}

                          {/* Due date indicator */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.dueDate ? safeFormat(new Date(task.dueDate), 'MMM d, yyyy') : 'No deadline'}
                            </span>
                            <span className={`text-xs font-medium ${remaining.color}`}>
                              ({remaining.label})
                            </span>
                          </div>

                          {/* Response progress */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">Submissions</span>
                              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{responseCount} submitted</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((responseCount / Math.max(totalStudents, 1)) * 100, 100)}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-[10px] px-2 py-0.5 border ${statusInfo.cls}`}>{task.status}</Badge>
                              <span className="text-[10px] text-gray-400">{task.createdAt ? safeFormat(new Date(task.createdAt), 'MMM d') : ''}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                              onClick={() => openResponses(task)}>
                              <Users className="w-3 h-3" /> Responses
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div {...fadeUp} className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 dark:bg-gray-800 dark:border-gray-700"
                    disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8 dark:bg-gray-800 dark:border-gray-700"
                    disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </TabsContent>

        {/* ──── ANALYTICS TAB ──── */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {analyticsLoading ? (
            <LoadingSkeleton />
          ) : analytics ? (
            <motion.div {...fadeUp} className="space-y-5">
              {/* Summary row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Total Tasks', value: analytics.totalTasks || 0 },
                  { label: 'Active', value: analytics.activeTasks || 0 },
                  { label: 'Closed', value: analytics.closedTasks || 0 },
                  { label: 'Overdue', value: analytics.overdueTasks || 0 },
                  { label: 'Avg Completion', value: `${analytics.completionRate || 0}%` },
                ].map(s => (
                  <Card key={s.label} className="border dark:border-gray-800">
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Tasks by Type Distribution */}
                <Card className="border dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Tasks by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.tasksByType && analytics.tasksByType.length > 0 ? (
                      <div className="flex items-end gap-3 h-40">
                        {analytics.tasksByType.map((item) => {
                          const maxVal = Math.max(...analytics.tasksByType.map(t => t.count), 1);
                          const typeBadge = getTypeBadge(item.type);
                          return (
                            <div key={item.type} className="flex-1 flex flex-col items-center gap-2">
                              <div className="w-full flex items-end justify-center h-28">
                                <motion.div initial={{ height: 0 }}
                                  animate={{ height: `${(item.count / maxVal) * 100}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut' }}
                                  className="w-12 rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 dark:from-emerald-700 dark:to-teal-500 min-h-[4px]" />
                              </div>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">{item.count}</span>
                              <Badge className={`text-[10px] px-1.5 ${typeBadge.cls}`}>{typeBadge.label}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                  </CardContent>
                </Card>

                {/* Completion Rates per Task */}
                <Card className="border dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      Completion Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.taskCompletionRates && analytics.taskCompletionRates.length > 0 ? (
                      <ScrollArea className="max-h-64">
                        <div className="space-y-3">
                          {analytics.taskCompletionRates.slice(0, 8).map((t) => {
                            const pct = t.total > 0 ? Math.round((t.submitted / t.total) * 100) : 0;
                            return (
                              <div key={t.taskId} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{t.taskName}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.submitted}/{t.total} ({pct}%)</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Response Status Breakdown */}
              <Card className="border dark:border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Response Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Pending', value: analytics.pendingCount || 0, color: 'bg-amber-500', icon: <Clock className="w-5 h-5 text-amber-500" /> },
                      { label: 'Submitted', value: analytics.submittedCount || 0, color: 'bg-emerald-500', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
                      { label: 'Late', value: analytics.lateCount || 0, color: 'bg-red-500', icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
                      { label: 'Graded', value: analytics.gradedCount || 0, color: 'bg-violet-500', icon: <CheckCircle2 className="w-5 h-5 text-violet-500" /> },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        {s.icon}
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Timeline */}
              {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                <Card className="border dark:border-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-72">
                      <div className="space-y-2">
                        {analytics.recentActivity.map((a, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-700 dark:text-gray-300">{a.message}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <Card className="border dark:border-gray-800">
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500">No analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ CREATE / EDIT TASK DIALOG ═══ */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                {editingTask ? <Edit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              </div>
              {editingTask ? `Edit ${getTypeBadge(editingTask.type).label}` : `Create ${getTypeBadge(form.type).label}`}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {editingTask ? 'Update task details. Changes will be reflected to all students.' : 'Create a new submission task for your batch. Students will be notified.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Subject Name *</Label>
                <Input value={form.subjectName} onChange={e => setForm({ ...form, subjectName: e.target.value })}
                  placeholder="e.g. Data Structures" className="h-10 dark:bg-gray-800 dark:border-gray-700"
                  aria-invalid={!!formErrors.subjectName} />
                {formErrors.subjectName && <p className="text-[11px] text-red-500">{formErrors.subjectName}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Subject Code *</Label>
                <Input value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })}
                  placeholder="e.g. CSE301" className="h-10 dark:bg-gray-800 dark:border-gray-700"
                  aria-invalid={!!formErrors.subjectCode} />
                {formErrors.subjectCode && <p className="text-[11px] text-red-500">{formErrors.subjectCode}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-10 dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNMENT"><div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Assignment</div></SelectItem>
                  <SelectItem value="LAB_REPORT"><div className="flex items-center gap-2"><FlaskConical className="w-3.5 h-3.5" /> Lab Report</div></SelectItem>
                  <SelectItem value="PRESENTATION"><div className="flex items-center gap-2"><Presentation className="w-3.5 h-3.5" /> Presentation</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Due Date *</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="h-10 dark:bg-gray-800 dark:border-gray-700"
                min={new Date().toISOString().slice(0, 10)}
                aria-invalid={!!formErrors.dueDate} />
              {formErrors.dueDate && <p className="text-[11px] text-red-500">{formErrors.dueDate}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Batch</Label>
              <Input value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}
                className="h-10 dark:bg-gray-800 dark:border-gray-700" disabled={!['CR', 'ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(user?.role || '')} />
              {formErrors.batch && <p className="text-[11px] text-red-500">{formErrors.batch}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3} placeholder="Task description, instructions..." className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
            <Button onClick={handleTaskSubmit} disabled={formSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              {formSubmitting ? <><Spinner className="mr-2" /> Saving...</> : editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRM DIALOG ═══ */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              Delete Task
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to delete <strong>&quot;{deletingTask?.subjectName}&quot;</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeletingTask(null); }}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ BATCH NOTIFICATION DIALOG ═══ */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              Send Batch Notification
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">Send a notification to all students in your batch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Batch</Label>
              <Input value={notifyForm.batch} className="h-10 dark:bg-gray-800 dark:border-gray-700" disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Type</Label>
              <Select value={notifyForm.type} onValueChange={v => setNotifyForm({ ...notifyForm, type: v })}>
                <SelectTrigger className="h-10 dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="DEADLINE">Deadline Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Title *</Label>
              <Input value={notifyForm.title} onChange={e => setNotifyForm({ ...notifyForm, title: e.target.value })}
                placeholder="Notification title" className="h-10 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Message *</Label>
              <Textarea value={notifyForm.message} onChange={e => setNotifyForm({ ...notifyForm, message: e.target.value })}
                rows={3} placeholder="Write your message..." className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
            <Button onClick={handleSendNotification} disabled={notifySubmitting}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              {notifySubmitting ? <><Spinner className="mr-2" /> Sending...</> : <><Send className="w-4 h-4 mr-1.5" /> Send Notification</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ RESPONSES SHEET ═══ */}
      <Sheet open={responsesSheetOpen} onOpenChange={setResponsesSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl dark:bg-gray-900 dark:border-gray-800 p-0">
          <SheetHeader className="p-4 border-b dark:border-gray-800">
            <SheetTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <span className="text-sm font-semibold">{selectedTask?.subjectName}</span>
                <span className="text-xs text-gray-500 ml-2">{selectedTask?.subjectCode}</span>
              </div>
            </SheetTitle>
            <SheetDescription className="dark:text-gray-400">
              View and grade student submissions
            </SheetDescription>
          </SheetHeader>

          {/* Summary Stats */}
          {responseSummary && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              {[
                { label: 'Total', value: responseSummary.total, icon: <Users className="w-3.5 h-3.5" /> },
                { label: 'Submitted', value: responseSummary.submitted, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
                { label: 'Pending', value: responseSummary.pending, icon: <Clock className="w-3.5 h-3.5" />, color: 'text-amber-600' },
                { label: 'Late', value: responseSummary.late, icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-red-600' },
                { label: 'Graded', value: responseSummary.graded, icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'text-violet-600' },
                { label: 'Avg Marks', value: responseSummary.averageMarks > 0 ? `${responseSummary.averageMarks.toFixed(1)}` : 'N/A', icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-white dark:bg-gray-800/50">
                  <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">{s.icon}</div>
                  <p className={`text-sm font-bold ${s.color || 'text-gray-900 dark:text-white'}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Responses Table */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4">
              {responsesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}
                </div>
              ) : responses.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No responses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {responses.map((resp) => {
                    const statusBadge = getResponseStatusBadge(resp.status);
                    const StatusIcon = statusBadge.icon;
                    const marksValue = gradeMarks[resp.id] ?? (resp.marks != null ? String(resp.marks) : '');
                    const feedbackValue = gradeFeedback[resp.id] ?? (resp.feedback || '');

                    return (
                      <motion.div key={resp.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200/80 dark:border-gray-700/50 rounded-xl p-3.5 space-y-3 hover:shadow-sm transition-shadow">

                        {/* Student header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {getInitials(resp.student?.name || 'Student')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{resp.student?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-gray-400">{resp.student?.email || ''}</p>
                            </div>
                          </div>
                          <Badge className={`text-[10px] px-2 py-0.5 border ${statusBadge.cls}`}>
                            <StatusIcon className="w-3 h-3 mr-0.5" /> {resp.status}
                          </Badge>
                        </div>

                        {/* Submitted info */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{resp.submittedAt ? safeFormat(new Date(resp.submittedAt), 'MMM d, yyyy HH:mm') : 'Not submitted'}</span>
                          {resp.fileName && (
                            <a href={resp.fileUrl || '#'} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                              <FileText className="w-3 h-3" /> {resp.fileName}
                            </a>
                          )}
                        </div>

                        {/* Grade section (shown for submitted/late/graded) */}
                        {(resp.status === 'SUBMITTED' || resp.status === 'LATE' || resp.status === 'GRADED') && (
                          <>
                            <Separator className="dark:bg-gray-800" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Marks</Label>
                                <Input type="number" min="0" max="100" placeholder="0"
                                  value={marksValue}
                                  onChange={e => setGradeMarks({ ...gradeMarks, [resp.id]: e.target.value })}
                                  className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700" />
                              </div>
                              <div className="sm:col-span-1 space-y-1">
                                <Label className="text-[10px] text-gray-500 uppercase tracking-wider">Feedback</Label>
                                <Textarea placeholder="Optional feedback..."
                                  value={feedbackValue}
                                  onChange={e => setGradeFeedback({ ...gradeFeedback, [resp.id]: e.target.value })}
                                  rows={2} className="text-sm dark:bg-gray-800 dark:border-gray-700" />
                              </div>
                              <div className="flex items-end">
                                <Button size="sm" className="w-full h-9 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white gap-1.5"
                                  disabled={gradingId === resp.id}
                                  onClick={() => handleGrade(resp)}>
                                  {gradingId === resp.id ? <Spinner /> : <Save className="w-3.5 h-3.5" />}
                                  {resp.status === 'GRADED' ? 'Update Grade' : 'Save Grade'}
                                </Button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Already graded display */}
                        {resp.status === 'GRADED' && resp.marks != null && (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 text-xs">
                              {resp.marks} marks
                            </Badge>
                            {resp.feedback && <span className="text-[11px] text-gray-500 dark:text-gray-400 italic">&ldquo;{resp.feedback}&rdquo;</span>}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
