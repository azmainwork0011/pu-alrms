'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/app';
import { assignmentApi, submissionApi, subjectApi } from '@/lib/api';
import { Search, BookOpen, Calendar } from 'lucide-react';
import { getTypeBadgeVariant, getStatusColor, safeFormat, safeIsPast } from '@/components/pu-helpers';

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {type === 'LAB_REPORT' ? 'Lab Reports' : 'Assignments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} items</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48 dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-700"><SelectValue placeholder="Filter subject" /></SelectTrigger>
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
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl dark:bg-gray-800" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500">No items found</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a: any, i) => {
            const sub = getSubmissionStatus(a.id);
            let deadline: Date;
            let isOverdue = false;
            try {
              deadline = new Date(a.deadline);
              isOverdue = safeIsPast(deadline) && a.status === 'ACTIVE';
            } catch {
              deadline = new Date();
            }
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="border dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setAssignmentId(a.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
                          <Badge variant={getTypeBadgeVariant(a.type)} className="text-xs">
                            {a.type === 'LAB_REPORT' ? 'Lab Report' : 'Assignment'}
                          </Badge>
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{a.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.subject?.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{safeFormat(deadline, 'MMM d, yyyy')}</span>
                          {a.creator && <span>by {a.creator.name}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {sub ? (
                          <Badge className={getStatusColor(sub.status)}>{sub.status} {sub.marks ? `\u00b7 ${sub.marks}/100` : ''}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-900/20">Pending</Badge>
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
    </div>
  );
}

export default AssignmentsPage;
