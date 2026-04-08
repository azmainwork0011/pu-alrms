'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/app';
import { assignmentApi, subjectApi } from '@/lib/api';

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

export default CreateAssignmentPage;
