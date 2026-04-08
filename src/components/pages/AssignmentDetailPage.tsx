'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar, Upload, CheckCircle2, Send, ChevronLeft, BookOpen, PenTool, FileText,
} from 'lucide-react';
import { getInitials, getTypeBadgeVariant, getStatusColor, safeFormat, safeIsPast, timeAgo } from '@/components/pu-helpers';

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

export default AssignmentDetailPage;
