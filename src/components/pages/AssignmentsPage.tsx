'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app';
import { useAssignments, useCreateAssignment, useDeleteAssignment, useUpdateAssignment, useSubjects, useSubmissions } from '@/lib/hooks/use-queries';
import {
  Search, BookOpen, Calendar, Plus, MoreHorizontal, Edit, Trash2, Eye,
  UsersRound, Copy, Clock, CheckCircle2, AlertCircle, GraduationCap,
  FileText, FlaskConical,
} from 'lucide-react';
import { getTypeBadgeVariant, getStatusColor, safeFormat, safeIsPast, getInitials } from '@/components/pu-helpers';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function AssignmentsPage({ type = 'ASSIGNMENT' }: { type?: string }) {
  const { user, setPage, setAssignmentId } = useAppStore();

  // React Query hooks for data fetching
  const { data: assignmentsRaw, isLoading: assignmentsLoading } = useAssignments({ type });
  const { data: subjectsRaw } = useSubjects();
  const { data: submissionsRaw } = useSubmissions({});

  const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : [];
  const subjects = Array.isArray(subjectsRaw) ? subjectsRaw : [];
  const submissions = Array.isArray(submissionsRaw) ? submissionsRaw : [];
  const loading = assignmentsLoading;

  // Mutation hooks
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const updateAssignment = useUpdateAssignment();

  // UI-only state
  const [filterSubject, setFilterSubject] = useState('all');
  const [search, setSearch] = useState('');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', title: '', description: '', deadline: '', status: '' });

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const canManage = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'CR';
  const isLabReport = type === 'LAB_REPORT';

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  const filtered = assignments.filter((a: any) => {
    if (filterSubject !== 'all' && a.subjectId !== filterSubject) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getSubmissionStatus = (assignmentId: string) => submissions.find((s: any) => s.assignmentId === assignmentId);

  // ─── Edit Handler ─────────────────────────────────
  const openEdit = (e: React.MouseEvent, a: any) => {
    e.stopPropagation();
    setEditForm({
      id: a.id,
      title: a.title,
      description: a.description,
      deadline: a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '',
      status: a.status,
    });
    setEditOpen(true);
    setOpenMenuId(null);
  };

  const handleEdit = () => {
    if (!editForm.title || !editForm.deadline) { toast.error('Title and deadline required'); return; }
    updateAssignment.mutate(
      {
        id: editForm.id,
        data: {
          title: editForm.title,
          description: editForm.description,
          deadline: new Date(editForm.deadline).toISOString(),
          status: editForm.status,
        },
      },
      {
        onSuccess: () => { setEditOpen(false); },
        onError: (err: any) => { toast.error(err.message || 'Update failed'); },
      },
    );
  };

  // ─── Duplicate Handler ───────────────────────────
  const handleDuplicate = (e: React.MouseEvent, a: any) => {
    e.stopPropagation();
    setOpenMenuId(null);
    createAssignment.mutate(
      {
        title: `${a.title} (Copy)`,
        description: a.description,
        subjectId: a.subjectId,
        type: a.type,
        deadline: a.deadline,
        batch: a.batch,
      },
      {
        onError: (err: any) => { toast.error(err.message || 'Duplicate failed'); },
      },
    );
  };

  // ─── Delete Handler ──────────────────────────────
  const openDelete = (e: React.MouseEvent, a: any) => {
    e.stopPropagation();
    setDeleteTarget(a);
    setDeleteOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAssignment.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: (err: any) => { toast.error(err.message || 'Delete failed'); },
    });
  };

  return (
    <div className="space-y-5 min-w-0 overflow-x-hidden">
      {/* ─── Header ──────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              isLabReport
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}>
              {isLabReport ? <FlaskConical className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {isLabReport ? 'Lab Reports' : 'Assignments'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Loading...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
          </div>
          {canManage && (
            <Button
              onClick={() => setPage('create-assignment')}
              className={`h-10 px-4 text-white font-semibold shadow-sm gap-2 ${
                isLabReport
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              }`}
            >
              <Plus className="w-4 h-4" /> Create New
            </Button>
          )}
        </div>
      </motion.div>

      {/* ─── Filters ─────────────────────────────────── */}
      {!loading && assignments.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="h-10 w-full sm:w-48 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-mono text-xs text-gray-500 mr-1.5">{s.code}</span> {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: 'Active', count: assignments.filter((a: any) => a.status === 'ACTIVE').length, color: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
                  { label: 'Closed', count: assignments.filter((a: any) => a.status === 'CLOSED').length, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
                ].map((s) => (
                  <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${s.color}`}>
                    {s.label}: <span className="font-bold">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Assignment List ────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl dark:bg-gray-800" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border dark:border-gray-800">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                {isLabReport ? <FlaskConical className="w-8 h-8 text-gray-300 dark:text-gray-600" /> : <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />}
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-medium">No {isLabReport ? 'lab reports' : 'assignments'} found</p>
              {canManage && (
                <Button
                  onClick={() => setPage('create-assignment')}
                  variant="outline"
                  className="mt-4 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Create your first {isLabReport ? 'lab report' : 'assignment'}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a: any, i) => {
            const sub = getSubmissionStatus(a.id);
            let deadline: Date; let isOverdue = false;
            try { deadline = new Date(a.deadline); isOverdue = safeIsPast(deadline) && a.status === 'ACTIVE'; } catch { deadline = new Date(); }

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className="border border-gray-200/80 dark:border-gray-700/50 hover:shadow-md transition-all group cursor-pointer overflow-hidden"
                  onClick={() => setAssignmentId(a.id)}
                >
                  <CardContent className="p-3.5 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Left accent stripe */}
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${
                        isLabReport
                          ? 'bg-gradient-to-b from-cyan-500 to-blue-500'
                          : 'bg-gradient-to-b from-emerald-500 to-teal-500'
                      }`} />
                      {/* Content + Actions wrapper */}
                      <div className="min-w-0 flex-1 flex flex-col gap-2.5 sm:gap-0 sm:flex-row sm:items-start">
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Title + Badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{a.title}</h3>
                          {isOverdue && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] border-0 font-semibold">
                              <AlertCircle className="w-3 h-3 mr-0.5" /> Overdue
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2.5">{a.description}</p>

                        {/* Meta info row */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400 dark:text-gray-500">
                          {/* Subject badge */}
                          {a.subject && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-medium">
                              <span className="font-mono text-[10px]">{a.subject.code}</span>
                              <span className="truncate max-w-[140px] sm:max-w-none">{a.subject.name}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {safeFormat(deadline, 'MMM d, yyyy')}
                          </span>
                          {a.batch && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium text-gray-600 dark:text-gray-400">
                              <GraduationCap className="w-3 h-3" /> {a.batch}
                            </span>
                          )}
                          {a._count && <span>{a._count.submissions} submissions</span>}
                          {a.creator && <span className="hidden sm:inline">by {a.creator.name}</span>}
                        </div>
                      </div>

                      {/* Right side: status + actions */}
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 sm:ml-2 border-t sm:border-0 pt-2.5 sm:pt-0 border-gray-100 dark:border-gray-800">
                        {/* Student submission status */}
                        {user?.role === 'STUDENT' && (
                          sub ? (
                            <Badge className={`${getStatusColor(sub.status)} text-[11px] font-medium`}>
                              {sub.status} {sub.marks ? `· ${sub.marks}%` : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] font-medium text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-900/20">
                              <Clock className="w-3 h-3 mr-0.5" /> Pending
                            </Badge>
                          )
                        )}

                        {/* Status badge for manage view */}
                        {canManage && (
                          <Badge className={`${getStatusColor(a.status)} text-[10px] font-medium px-2`}>
                            {a.status}
                          </Badge>
                        )}

                        {/* View button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 sm:h-8 sm:w-8 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          onClick={(e) => { e.stopPropagation(); setAssignmentId(a.id); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Action menu for teacher/admin */}
                        {canManage && (
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 sm:h-8 sm:w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === a.id ? null : a.id); }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                            <AnimatePresence>
                              {openMenuId === a.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-1 z-50 w-40 sm:w-44 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button onClick={(e) => openEdit(e, a)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <Edit className="w-4 h-4 text-gray-400" /> Edit Assignment
                                  </button>
                                  <button onClick={(e) => handleDuplicate(e, a)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <Copy className="w-4 h-4 text-gray-400" /> Duplicate
                                  </button>
                                  <Separator className="dark:bg-gray-800" />
                                  <button onClick={(e) => openDelete(e, a)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <Trash2 className="w-4 h-4" /> Delete (Archive)
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Edit Dialog ─────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Edit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Edit Assignment
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">Update assignment details. Changes will be reflected to all students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Title</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="h-10 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Deadline</Label>
                <Input type="datetime-local" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className="h-10 dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="h-10 dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
            <Button onClick={handleEdit} disabled={updateAssignment.isPending} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
              {updateAssignment.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ──────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Archive Assignment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>&quot;{deleteTarget?.title}&quot;</strong>? This will soft-delete the assignment. You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
            <Button onClick={handleDelete} disabled={deleteAssignment.isPending} variant="destructive">
              {deleteAssignment.isPending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Archiving...</> : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AssignmentsPage;
