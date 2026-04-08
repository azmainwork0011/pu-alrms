'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { leaderboardApi } from '@/lib/api';
import { Trophy } from 'lucide-react';
import { getInitials } from '@/components/pu-helpers';

function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardApi.get().then((data) => setEntries(Array.isArray(data) ? data : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" />Student Leaderboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Top performers ranked by academic performance</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl dark:bg-gray-800" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="border dark:border-gray-800"><CardContent className="py-12 text-center text-gray-400 dark:text-gray-500">No graded submissions yet</CardContent></Card>
      ) : (
        <>
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[1, 0, 2].map((idx) => {
                const e = entries[idx];
                if (!e) return null;
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Card className={`border dark:border-gray-800 text-center ${idx === 0 ? 'ring-2 ring-amber-300 dark:ring-amber-600' : ''}`}>
                      <CardContent className="p-4">
                        <div className="text-3xl mb-2">{medals[idx]}</div>
                        <Avatar className="w-12 h-12 mx-auto mb-2">
                          <AvatarImage src={e.avatar} />
                          <AvatarFallback>{getInitials(e.name)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-sm truncate dark:text-gray-100">{e.name}</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{e.averageMarks?.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{e.totalSubmissions} submissions</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Card className="border dark:border-gray-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-800">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Average Marks</TableHead>
                  <TableHead className="w-32">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e: any, i: number) => (
                  <TableRow key={e.id} className="dark:border-gray-800">
                    <TableCell className="font-bold">{i < 3 ? <span className="text-lg">{medals[i]}</span> : `#${i + 1}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8"><AvatarImage src={e.avatar} /><AvatarFallback className="text-xs">{getInitials(e.name)}</AvatarFallback></Avatar>
                        <span className="font-medium dark:text-gray-200">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{e.totalSubmissions}</TableCell>
                    <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">{e.averageMarks?.toFixed(1)}%</TableCell>
                    <TableCell><Progress value={e.averageMarks} className="h-2" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
