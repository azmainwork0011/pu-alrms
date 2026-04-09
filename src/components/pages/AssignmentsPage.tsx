'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { assignmentApi, submissionApi, subjectApi } from '@/lib/api';
import { Search, BookOpen, Calendar, Plus, MoreHorizontal, Edit, Trash2, Eye, UsersRound, Copy, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getTypeBadgeVariant, getStatusColor, safeFormat, safeIsPast } from '@/components/pu-helpers';

function AssignmentsPage({ type = 'ASSIGNMENT' }: { type?: string }) {
  const { user, setPage, setAssignmentId } = useAppStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', title: '', description: '', deadline: '', status: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const canManage = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'CR';

  const loadAssignments = useCallback(async () => {
    try {
      const [assignData, subData] = await Promise.all([
        assignmentApi.list({ type }),
        user?.role === 'STUDENT' ? submissionApi.list({}) : Promise.resolve([]),
      ]);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setSubmissions(Array.isArray(subData) ? subData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [type, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadAssignments();
      if (!cancelled) {
        const allSubjects = await subjectApi.list();
        setSubjects(Array.isArray(allSubjects) ? allSubjects : []);
      }
    })();
    return () => { cancelled = true; };
  }, [loadAssignments]);

  const filtered = assignments.filter((a: any) => {
    if (filterSubject !== 'all' && a.subjectId !== filterSubject) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getSubmissionStatus = (assignmentId: string) => submissions.find((s: any) => s.assignmentId === assignmentId);

  // ─── Edit Handler ─────────────────────────────────
  const openEdit = (a: any) => {
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

  const handleEdit = async () => {
    if (!editForm.title || !editForm.deadline) { toast.error('Title and deadline required'); return; }
    setEditLoading(true);
    try {
      await assignmentApi.update(editForm.id, {
        title: editForm.title,
        description: editForm.description,
        deadline: new Date(editForm.deadline).toISOString(),
        status: editForm.status,
      });
      toast.success('Assignment updated!');
      setEditOpen(false);
      await loadAssignments();
    } catch (err: any) { toast.error(err.message || 'Update failed'); }
    finally { setEditLoading(false); }
  };

  // ─── Duplicate Handler ───────────────────────────
  const handleDuplicate = async (a: any) => {
    setOpenMenuId(null);
    try {
      await assignmentApi.create({
        title: `${a.title} (Copy)`,
        description: a.description,
        subjectId: a.subjectId,
        type: a.type,
        deadline: a.deadline,
        batch: a.batch,
      });
      toast.success('Assignment duplicated!');
      await loadAssignments();
    } catch (err: any) { toast.error(err.message || 'Duplicate failed'); }
  };

  // ─── Delete Handler ──────────────────────────────
  const openDelete = (a: any) => { setDeleteTarget(a); setDeleteOpen(true); setOpenMenuId(null); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await assignmentApi.delete(deleteTarget.id);
      toast.success('Assignment archived!');
      setDeleteOpen(false);
      setDeleteTarget(null);
      await loadAssignments();
    } catch (err: any) { toast.error(err.message || 'Delete failed'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === 'LAB_REPORT' ? '🔬 Lab Reports' : '📝 Assignments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} items found</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-700"><SelectValue placeholder="Filter subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.code} — {s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {canManage && (
            <Button onClick={() => setPage('create-assignment')} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Create New
            </Button>
          )}
        </div>
      </div>

      {/* ─── Stats Bar ──────────────────────────── */}
      {!loading && assignments.length > 0 && canManage && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Active', count: assignments.filter((a: any) => a.status === 'ACTIVE').length, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { label: 'Closed', count: assignments.filter((a: any) => a.status === 'CLOSED').length, color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700', icon: <Clock className="w-3.5 h-3.5" /> },
            { label: 'Total', count: assignments.length, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', icon: <BookOpen className="w-3.5 h-3.5" /> },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${s.color}`}>
              {s.icon}{s.label}: <span className="font-bold">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Assignment List ────────────────────── */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl dark:bg-gray-800" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500">No assignments found</p>
          {canManage && <Button onClick={() => setPage('create-assignment')} variant="outline" className="mt-4 dark:bg-gray-800 dark:border-gray-700">Create your first assignment</Button>}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a: any, i) => {
            const sub = getSubmissionStatus(a.id);
            let deadline: Date; let isOverdue = false;
            try { deadline = new Date(a.deadline); isOverdue = safeIsPast(deadline) && a.status === 'ACTIVE'; } catch { deadline = new Date(); }

            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border dark:border-gray-800 hover:shadow-md transition-shadow group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setAssignmentId(a.id)}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
                          <Badge variant={getTypeBadgeVariant(a.type)} className="text-xs">{a.type === 'LAB_REPORT' ? 'Lab Report' : 'Assignment'}</Badge>
                          {a.batch && <Badge variant="outline" className="text-xs border-violet-300 text-violet-600 dark:text-violet-400 dark:border-violet-700"><UsersRound className="w-3 h-3 mr-1" />{a.batch}</Badge>}
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{a.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.subject?.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{safeFormat(deadline, 'MMM d, yyyy')}</span>
                          {a._count && <span>{a._count.submissions} submissions</span>}
                          {a.creator && <span>by {a.creator.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Submission status for students */}
                        {user?.role === 'STUDENT' && (
                          sub ? (
                            <Badge className={getStatusColor(sub.status)}>{sub.status} {sub.marks ? `· ${sub.marks}/100` : ''}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-900/20">Pending</Badge>
                          )
                        )}
                        {/* View button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400" onClick={() => setAssignmentId(a.id)}><Eye className="w-4 h-4" /></Button>

                        {/* Action menu for teacher/admin */}
                        {canManage && (
                          <div className="relative">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}><MoreHorizontal className="w-4 h-4" /></Button>
                            <AnimatePresence>
                              {openMenuId === a.id && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-full mt-1 z-50 w-44 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                                  <button onClick={() => openEdit(a)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Edit className="w-4 h-4" />Edit Assignment</button>
                                  <button onClick={() => handleDuplicate(a)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Copy className="w-4 h-4" />Duplicate</button>
                                  <Separator />
                                  <button onClick={() => openDelete(a)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" />Delete (Archive)</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
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

      {/* ─── Edit Dialog ─────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-emerald-500" />Edit Assignment</DialogTitle>
            <DialogDescription>Update assignment details. Changes will be reflected to all students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="dark:bg-gray-800 dark:border-gray-700" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Deadline</Label><Input type="datetime-local" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className="dark:bg-gray-800 dark:border-gray-700" /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
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
            <Button onClick={handleEdit} disabled={editLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {editLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm Dialog ───────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2"><Trash2 className="w-5 h-5" />Archive Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive <strong>&quot;{deleteTarget?.title}&quot;</strong>? This will soft-delete the assignment. You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
            <Button onClick={handleDelete} disabled={deleteLoading} variant="destructive">
              {deleteLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Archiving...</> : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AssignmentsPage;
