'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app';
import { assignmentApi, submissionApi, commentApi } from '@/lib/api';
import {
  Calendar, Upload, CheckCircle2, Send, ChevronLeft, BookOpen,
  PenTool, FileText, Clock, UsersRound, MessageSquare, AlertTriangle,
  Award, Star, GraduationCap, Sparkles,
} from 'lucide-react';
import { getInitials, getTypeBadgeVariant, getStatusColor, safeFormat, safeIsPast, timeAgo } from '@/components/pu-helpers';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const scaleIn = { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 dark:bg-gray-800" />
        <Skeleton className="h-56 rounded-xl dark:bg-gray-800" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl dark:bg-gray-800" />
          <Skeleton className="h-64 rounded-xl dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 dark:text-gray-500">Assignment not found</p>
        <Button variant="outline" onClick={() => useAppStore.getState().setPage('assignments')} className="mt-4 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to list
        </Button>
      </div>
    );
  }

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
  const isLabReport = assignment.type === 'LAB_REPORT';
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-5">
      {/* ─── Back Button ───────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => useAppStore.getState().setPage('assignments')}
          className="text-gray-500 dark:text-gray-400 -ml-2 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to list
        </Button>
      </motion.div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* MAIN ASSIGNMENT CARD                                  */}
      {/* ══════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden">
          {/* Top accent bar */}
          <div className={`h-1 ${isLabReport ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} />

          <CardContent className="p-5 sm:p-6">
            {/* Status badges + title row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className={`${getTypeBadgeVariant(assignment.type)} text-xs font-semibold px-2.5 py-0.5`}>
                    {isLabReport ? '🔬 Lab Report' : '📝 Assignment'}
                  </Badge>
                  <Badge className={`${getStatusColor(assignment.status)} text-xs font-medium px-2.5 py-0.5`}>
                    {assignment.status}
                  </Badge>
                  {assignment.batch && (
                    <Badge variant="outline" className="text-xs border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20">
                      <UsersRound className="w-3 h-3 mr-1" /> {assignment.batch}
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {assignment.title}
                </h1>
              </div>
              <div className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium ${
                deadlinePast
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}>
                <Calendar className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-xs font-bold">{safeFormat(deadline, 'MMM d, yyyy')}</div>
                  <div className="text-[10px] opacity-70">{safeFormat(deadline, 'h:mm a')}</div>
                </div>
              </div>
            </div>

            {/* Subject + Creator info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mb-5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <BookOpen className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{assignment.subject?.name}</span>
                {assignment.subject?.code && (
                  <span className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded font-mono">{assignment.subject?.code}</span>
                )}
              </div>
              {assignment.creator && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={assignment.creator.avatar} />
                    <AvatarFallback className="text-[8px]">{getInitials(assignment.creator.name || 'T')}</AvatarFallback>
                  </Avatar>
                  <span>by {assignment.creator.name}</span>
                </div>
              )}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{submissions.length} submissions</span>
            </div>

            <Separator className="dark:bg-gray-800 mb-5" />

            {/* Description */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Requirements & Instructions
              </h3>
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                {assignment.description}
              </div>
            </div>

            {/* ── Student Submit Area ───────────────────────── */}
            {user?.role === 'STUDENT' && (
              <div>
                {hasSubmitted ? (
                  mySubmission && (
                    <motion.div {...scaleIn}>
                      <div className={`p-4 rounded-xl border ${
                        mySubmission.status === 'GRADED'
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : mySubmission.status === 'LATE'
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            mySubmission.status === 'GRADED'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40'
                              : 'bg-violet-100 dark:bg-violet-900/40'
                          }`}>
                            {mySubmission.status === 'GRADED'
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              : <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {mySubmission.status === 'GRADED' ? 'Submitted & Graded' : mySubmission.status === 'LATE' ? 'Submitted Late' : 'Submitted'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {mySubmission.fileName} &middot; {timeAgo(mySubmission.submittedAt || mySubmission.createdAt)}
                            </p>
                            {mySubmission.marks != null && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                  <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{mySubmission.marks}/100</span>
                                </div>
                                {mySubmission.marks >= 80 && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] border-0">Excellent</Badge>}
                                {mySubmission.marks >= 60 && mySubmission.marks < 80 && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] border-0">Good</Badge>}
                                {mySubmission.marks < 60 && mySubmission.marks >= 0 && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] border-0">Needs Work</Badge>}
                              </div>
                            )}
                            {mySubmission.feedback && (
                              <div className="mt-2 p-2.5 rounded-lg bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Feedback</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{mySubmission.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                ) : assignment.status === 'ACTIVE' && (
                  <motion.div {...scaleIn}>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-dashed border-emerald-300 dark:border-emerald-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Ready to submit?</p>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                              {deadlinePast ? '⚠️ Deadline has passed — late submission' : `${safeFormat(deadline, 'MMM d')} at ${safeFormat(deadline, 'h:mm a')}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className={`h-10 px-5 font-semibold shadow-sm ${deadlinePast ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
                        >
                          {submitting ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Submitting...</>
                          ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Submit Work</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* BOTTOM GRID: SUBMISSIONS + DISCUSSION                  */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* ─── Submissions (Teacher/Admin only) ──────────── */}
        {isTeacherOrAdmin && (
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm h-full">
              <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Submissions</h3>
                <Badge variant="outline" className="text-[10px] ml-auto">{submissions.length}</Badge>
              </div>
              <CardContent className="p-4">
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {submissions.length === 0 ? (
                      <div className="text-center py-8">
                        <InboxIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No submissions yet</p>
                      </div>
                    ) : (
                      submissions.map((s: any) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={s.student?.avatar} />
                            <AvatarFallback className="text-xs">{s.student?.name ? getInitials(s.student.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.student?.name}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {s.fileName}
                              {s.student?.batch ? ` · ${s.student.batch}` : ''}
                            </p>
                            {s.marks != null && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-amber-500" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{s.marks}/100</span>
                              </div>
                            )}
                            {s.feedback && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{s.feedback}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-[10px] ${getStatusColor(s.status)}`}>{s.status}</Badge>
                            {s.status !== 'GRADED' && (
                              <Dialog open={gradeDialogOpen && selectedSubId === s.id} onOpenChange={(open) => { if (!open) { setGradeDialogOpen(false); setSelectedSubId(null); } }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-9 sm:h-7 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                                  onClick={() => openGradeDialog(s.id)}
                                >
                                  <PenTool className="w-3 h-3 mr-1" /> Grade
                                </Button>
                                <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Award className="w-5 h-5 text-emerald-500" />
                                      Grade Submission
                                    </DialogTitle>
                                    <DialogDescription className="dark:text-gray-400">
                                      {s.student?.name} — {s.fileName}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold uppercase tracking-wider">Marks (out of 100)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={gradeData.marks}
                                        onChange={(e) => setGradeData({ ...gradeData, marks: e.target.value })}
                                        placeholder="0 - 100"
                                        className="h-11 text-lg font-bold text-center dark:bg-gray-800 dark:border-gray-700"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-semibold uppercase tracking-wider">Feedback</Label>
                                      <Textarea
                                        value={gradeData.feedback}
                                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                        placeholder="Provide feedback for this submission..."
                                        rows={3}
                                        className="dark:bg-gray-800 dark:border-gray-700"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => { setGradeDialogOpen(false); setSelectedSubId(null); }} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleGrade}
                                      disabled={!gradeData.marks || !!gradingId}
                                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                                    >
                                      {gradingId ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Saving...</>
                                      ) : (
                                        <><Award className="w-4 h-4 mr-2" /> Submit Grade</>
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Discussion ───────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm h-full">
            <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Discussion</h3>
              <Badge variant="outline" className="text-[10px] ml-auto">{comments.length}</Badge>
            </div>
            <CardContent className="p-4">
              <ScrollArea className="max-h-64">
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No comments yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Start the discussion!</p>
                    </div>
                  ) : (
                    comments.map((c: any) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-2.5"
                      >
                        <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                          <AvatarImage src={c.user?.avatar} />
                          <AvatarFallback className="text-[10px]">{c.user?.name ? getInitials(c.user.name) : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 bg-gray-50 dark:bg-gray-800/40 rounded-xl rounded-tl-md p-2.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{c.user?.name}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{c.content}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-3 dark:bg-gray-800" />

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleComment(); } }}
                    className="h-10 text-sm dark:bg-gray-800/50 dark:border-gray-700 pr-10"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="h-10 w-10 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Grade Dialog (outside grid for portal) ───────── */}
    </div>
  );
}

// Simple inbox icon
function InboxIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

export default AssignmentDetailPage;
