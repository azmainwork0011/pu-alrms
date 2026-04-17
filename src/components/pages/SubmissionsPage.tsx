'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/store/app';
import { submissionApi, assignmentApi } from '@/lib/api';
import { Eye } from 'lucide-react';
import { getInitials, getStatusColor, safeFormat } from '@/components/pu-helpers';

function SubmissionsPage() {
  const { user } = useAppStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignment, setFilterAssignment] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sData, aData] = await Promise.all([
          submissionApi.list({}),
          assignmentApi.list({}),
        ]);
        if (cancelled) return;
        setSubmissions(Array.isArray(sData) ? sData : []);
        setAssignments(Array.isArray(aData) ? aData : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = submissions.filter((s: any) => {
    if (user?.role === 'STUDENT' && s.studentId !== user.id) return false;
    if (filterAssignment !== 'all' && s.assignmentId !== filterAssignment) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.role === 'TEACHER' ? 'Grade Submissions' : 'My Submissions'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{filtered.length} submissions</p>
        </div>
        {user?.role === 'TEACHER' && (
          <Select value={filterAssignment} onValueChange={setFilterAssignment}>
            <SelectTrigger className="w-full sm:w-56 dark:bg-gray-800 dark:border-gray-700"><SelectValue placeholder="Filter by assignment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              {assignments.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500">No submissions found</CardContent></Card>
      ) : (
        <Card className="border dark:border-gray-800 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-800">
                <TableHead className="hidden sm:table-cell">Assignment</TableHead>
                <TableHead>Details</TableHead>
                {user?.role === 'TEACHER' && <TableHead className="hidden sm:table-cell">Student</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Marks</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => {
                let submittedDate: string = '';
                try { submittedDate = safeFormat(new Date(s.submittedAt), 'MMM d'); } catch { /* noop */ }
                return (
                  <TableRow key={s.id} className="dark:border-gray-800">
                    <TableCell className="font-medium hidden sm:table-cell max-w-[200px] truncate dark:text-gray-200">{s.assignment?.title}</TableCell>
                    <TableCell>
                      <p className="font-medium sm:hidden text-sm dark:text-gray-200">{s.assignment?.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{s.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <span>{submittedDate}</span>
                        {s.marks != null && <span className="sm:hidden">· {s.marks}/100</span>}
                      </div>
                    </TableCell>
                    {user?.role === 'TEACHER' && (
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6"><AvatarImage src={s.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(s.student?.name || '?')}</AvatarFallback></Avatar>
                          <span className="text-sm dark:text-gray-300">{s.student?.name}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell><Badge className={`text-xs ${getStatusColor(s.status)}`}>{s.status}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell">{s.marks != null ? <span className="font-medium dark:text-gray-200">{s.marks}/100</span> : <span className="text-gray-400 dark:text-gray-500">-</span>}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-8 sm:w-8" onClick={() => useAppStore.getState().setAssignmentId(s.assignmentId)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default SubmissionsPage;
