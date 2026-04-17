'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app';
import { assignmentApi, subjectApi } from '@/lib/api';
import {
  ArrowLeft, Plus, Sparkles, BookOpen, UsersRound, Calendar,
  GraduationCap, FileText, FlaskConical, Clock, ChevronRight,
  CheckCircle2, Loader2, X, Search,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const scaleIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } };

interface BatchOption { value: string; label: string; }

function CreateAssignmentPage() {
  const { user, setPage } = useAppStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // New subject form
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [showNewSubjectForm, setShowNewSubjectForm] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    type: 'ASSIGNMENT',
    deadline: '',
    batch: '',
  });

  // Fetch subjects and batches
  useEffect(() => {
    Promise.all([
      subjectApi.list(),
      fetch('/api/batches').then(r => r.json()),
    ]).then(([subjData, batchData]) => {
      setSubjects(Array.isArray(subjData) ? subjData : []);
      setBatches(Array.isArray(batchData) ? batchData : []);
    }).catch(console.error);
  }, []);

  // Filter subjects by search
  const filteredSubjects = subjects.filter((s: any) => {
    if (!subjectSearch) return true;
    const q = subjectSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  const selectedSubject = subjects.find((s: any) => s.id === form.subjectId);

  // Handle subject selection
  const selectSubject = useCallback((id: string) => {
    setForm(prev => ({ ...prev, subjectId: id }));
    setShowSubjectDropdown(false);
    setSubjectSearch('');
    setShowNewSubjectForm(false);
  }, []);

  // Handle creating a new subject inline
  const handleCreateSubject = useCallback(async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) {
      toast.error('Subject name and code are required');
      return;
    }
    setCreatingSubject(true);
    try {
      const created = await subjectApi.create({
        name: newSubject.name.trim(),
        code: newSubject.code.trim(),
      });
      setSubjects(prev => [...prev, created]);
      setForm(prev => ({ ...prev, subjectId: created.id }));
      setShowNewSubjectForm(false);
      setNewSubject({ name: '', code: '' });
      setSubjectSearch('');
      toast.success(`Subject "${created.name}" created!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subject');
    } finally {
      setCreatingSubject(false);
    }
  }, [newSubject]);

  // Submit assignment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) { toast.error('Please select a subject'); return; }
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    if (!form.deadline) { toast.error('Please set a deadline'); return; }
    setLoading(true);
    try {
      await assignmentApi.create({
        ...form,
        batch: form.batch || null,
      });
      toast.success(
        form.batch
          ? `Assignment created for ${form.batch}!`
          : 'Assignment created for all students!'
      );
      setPage('assignments');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  // Assignment type options
  const typeOptions = [
    { value: 'ASSIGNMENT', label: '📝 Assignment', desc: 'Regular homework or coursework' },
    { value: 'LAB_REPORT', label: '🔬 Lab Report', desc: 'Lab experiment or practical work' },
  ];
  const currentType = typeOptions.find(t => t.value === form.type) || typeOptions[0];

  return (
    <div className="max-w-2xl mx-auto space-y-5 min-w-0 overflow-x-hidden">
      {/* ─── Header ────────────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <Button variant="ghost" size="sm" onClick={() => setPage('assignments')} className="text-gray-500 dark:text-gray-400 -ml-2 mb-3 hover:text-emerald-600 dark:hover:text-emerald-400">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Assignments
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create Assignment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set up a new task for your students</p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 1: ASSIGNMENT DETAILS                      */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Assignment Details</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Title, description and type</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-gray-700 text-gray-500">
                Required
              </Badge>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="ca-title" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment Title
                </Label>
                <Input
                  id="ca-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Data Structures Lab 3"
                  required
                  className="h-11 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="ca-desc" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description & Instructions
                </Label>
                <Textarea
                  id="ca-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the assignment requirements, instructions, and grading criteria..."
                  rows={5}
                  required
                  className="text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              {/* Assignment Type */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assignment Type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {typeOptions.map((t) => (
                    <motion.button
                      key={t.value}
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`relative p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                        form.type === t.value
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="text-lg mb-1.5">{t.label.split(' ')[0]}</div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.label.split(' ').slice(1).join(' ')}</div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t.desc}</div>
                      {form.type === t.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 2: SUBJECT (with inline create)             */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Subject</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Select an existing subject or create a new one</p>
              </div>
              <Badge variant="outline" className="text-[10px] border-gray-200 dark:border-gray-700 text-gray-500">
                Required
              </Badge>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Selected subject display */}
              {form.subjectId && selectedSubject ? (
                <motion.div
                  {...scaleIn}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedSubject.code}</span>
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{selectedSubject.name}</span>
                    </div>
                    {selectedSubject.teacher && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        by {selectedSubject.teacher.name} · {selectedSubject._count?.assignments || 0} assignments
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setForm(prev => ({ ...prev, subjectId: '' })); setSubjectSearch(''); }}
                    className="p-2 h-9 w-9 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : showNewSubjectForm ? (
                /* ── New Subject Form ─────────────────────── */
                <motion.div {...scaleIn} className="space-y-3 p-4 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Create New Subject</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowNewSubjectForm(false); setNewSubject({ name: '', code: '' }); }}
                      className="p-1.5 h-8 w-8 rounded hover:bg-violet-100 dark:hover:bg-violet-900/40 text-gray-400 flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Subject Code <span className="text-rose-500">*</span></Label>
                      <Input
                        value={newSubject.code}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="e.g. CS201"
                        className="h-10 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Subject Name <span className="text-rose-500">*</span></Label>
                      <Input
                        value={newSubject.name}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Data Structures & Algorithms"
                        className="h-10 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateSubject}
                    disabled={creatingSubject || !newSubject.code.trim() || !newSubject.name.trim()}
                    className="w-full h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium"
                  >
                    {creatingSubject ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" /> Create & Select Subject</>
                    )}
                  </Button>
                </motion.div>
              ) : (
                /* ── Subject Selector ──────────────────────── */
                <div className="space-y-2.5">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={subjectSearch}
                      onChange={(e) => { setSubjectSearch(e.target.value); setShowSubjectDropdown(true); }}
                      onFocus={() => setShowSubjectDropdown(true)}
                      placeholder="Search subject by name or code..."
                      className="pl-9 h-11 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
                    />
                  </div>

                  {/* Dropdown list */}
                  <AnimatePresence>
                    {showSubjectDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="relative z-20"
                      >
                        <div className="absolute inset-x-0 top-0 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
                          {/* Create new option */}
                          <button
                            type="button"
                            onClick={() => { setShowNewSubjectForm(true); setShowSubjectDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors border-b border-gray-100 dark:border-gray-700/50"
                          >
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                              <Plus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Create New Subject</p>
                              <p className="text-[11px] text-gray-400">Add a new subject with code and name</p>
                            </div>
                          </button>

                          {/* Existing subjects */}
                          {filteredSubjects.length === 0 ? (
                            <div className="px-4 py-6 text-center">
                              <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">
                                {subjectSearch ? 'No subjects found' : 'No subjects created yet'}
                              </p>
                            </div>
                          ) : (
                            filteredSubjects.map((s: any) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => selectSubject(s.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{s.code}</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    by {s.teacher?.name || 'Unknown'} · {s._count?.assignments || 0} assignments
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Click outside to close */}
                  {showSubjectDropdown && (
                    <div className="fixed inset-0 z-10" onClick={() => setShowSubjectDropdown(false)} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 3: DEADLINE & BATCH                         */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Schedule & Audience</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Deadline and batch targeting</p>
              </div>
            </div>

            <CardContent className="p-5 sm:p-6 space-y-5">
              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="ca-deadline" className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Submission Deadline
                </Label>
                <Input
                  id="ca-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required
                  className="h-11 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                />
                {form.deadline && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(form.deadline).toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </motion.p>
                )}
              </div>

              <Separator className="dark:bg-gray-800" />

              {/* Batch Selection */}
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3 h-3" /> Target Batch
                </Label>
                <Select
                  value={form.batch || '__all__'}
                  onValueChange={(v) => setForm({ ...form, batch: v === '__all__' ? '' : v })}
                >
                  <SelectTrigger className="h-11 text-sm bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="All batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">
                      <div className="flex items-center gap-2">
                        <UsersRound className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="font-medium">All Batches</span>
                          <p className="text-[10px] text-gray-400">Visible to every student</p>
                        </div>
                      </div>
                    </SelectItem>
                    {batches.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-emerald-500" />
                          <div>
                            <span className="font-medium">{b.label}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <AnimatePresence mode="wait">
                  {form.batch ? (
                    <motion.div
                      key="selected"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{form.batch}</p>
                        <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">Only students in this batch will see this assignment</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="all"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700"
                    >
                      <UsersRound className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No batch selected — assignment will be visible to <strong className="text-gray-700 dark:text-gray-300">all students</strong>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 4: SUMMARY & SUBMIT                         */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Type', value: currentType.label, color: 'text-gray-700 dark:text-gray-300' },
                    { label: 'Subject', value: selectedSubject ? `${selectedSubject.code} — ${selectedSubject.name}` : 'Not selected', color: selectedSubject ? 'text-violet-700 dark:text-violet-300' : 'text-gray-400' },
                    { label: 'Batch', value: form.batch || 'All Batches', color: 'text-gray-700 dark:text-gray-300' },
                    { label: 'Deadline', value: form.deadline ? new Date(form.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not set', color: form.deadline ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">{item.label}</span>
                      <span className={`text-xs font-semibold mt-0.5 truncate ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="dark:bg-gray-800" />

              {/* Actions */}
              <div className="flex gap-3 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage('assignments')}
                  className="h-11 px-5 font-medium dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !form.subjectId || !form.title.trim() || !form.deadline}
                  className="h-11 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-md shadow-emerald-200/50 dark:shadow-emerald-900/20 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {form.batch ? `Create for ${form.batch}` : 'Create Assignment'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </form>
    </div>
  );
}

export default CreateAssignmentPage;
