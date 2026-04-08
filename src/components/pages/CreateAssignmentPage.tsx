'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, UsersRound } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { assignmentApi, subjectApi } from '@/lib/api';

const API_BASE = '';

interface BatchOption {
  value: string;
  label: string;
}

function CreateAssignmentPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    type: 'ASSIGNMENT',
    deadline: '',
    batch: '',
  });
  const { setPage } = useAppStore();

  useEffect(() => {
    Promise.all([
      subjectApi.list(),
      fetch(`${API_BASE}/api/batches`).then(r => r.json()),
    ]).then(([subjData, batchData]) => {
      setSubjects(Array.isArray(subjData) ? subjData : []);
      setBatches(Array.isArray(batchData) ? batchData : []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) { toast.error('Please select a subject'); return; }
    setLoading(true);
    try {
      await assignmentApi.create({
        ...form,
        batch: form.batch || null,
      });
      toast.success(
        form.batch
          ? `Assignment created for batch ${form.batch}!`
          : 'Assignment created for all students!'
      );
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
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Assignment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ca-title">Title</Label>
                <Input
                  id="ca-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Data Structures Lab 3"
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-desc">Description</Label>
                <Textarea
                  id="ca-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the assignment requirements, instructions, and grading criteria..."
                  rows={4}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              {/* ─── Target Batch Selection ─────────────────── */}
              <Card className="border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UsersRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <Label className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Target Audience
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">
                      Select Batch (leave empty for all students)
                    </Label>
                    <Select
                      value={form.batch || '__all__'}
                      onValueChange={(v) => setForm({ ...form, batch: v === '__all__' ? '' : v })}
                    >
                      <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectValue placeholder="All batches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            All Batches
                          </span>
                        </SelectItem>
                        {batches.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {b.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {form.batch && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center gap-1.5"
                    >
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">
                        🎯 Batch: {form.batch}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Only students in this batch will see this assignment
                      </span>
                    </motion.div>
                  )}

                  {!form.batch && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      No batch selected — assignment will be visible to <strong>all students</strong>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ─── Subject & Type ─────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGNMENT">📝 Assignment</SelectItem>
                      <SelectItem value="LAB_REPORT">🔬 Lab Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ─── Deadline ───────────────────────────────── */}
              <div className="space-y-2">
                <Label htmlFor="ca-deadline">Deadline</Label>
                <Input
                  id="ca-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              {/* ─── Actions ────────────────────────────────── */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage('assignments')}
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      {form.batch ? '🎯 Create for ' + form.batch : '✅ Create Assignment'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default CreateAssignmentPage;
