'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLeaderboard } from '@/lib/hooks/use-queries';
import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/components/pu-helpers';

function LeaderboardPage() {
  const { data: rawEntries, isLoading: loading } = useLeaderboard();
  const entries = Array.isArray(rawEntries) ? rawEntries : [];

  const medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];

  // Podium order: 2nd place first (left), 1st place center, 3rd place right
  const podiumOrder = [1, 0, 2] as const;
  const podiumStyles = [
    { ring: '', scale: 'sm:mt-4', medalSize: 'text-2xl sm:text-3xl', avatarSize: 'w-10 h-10 sm:w-12 sm:h-12', nameSize: 'text-xs sm:text-sm', markSize: 'text-lg sm:text-2xl' },
    { ring: 'ring-2 ring-amber-300 dark:ring-amber-600', scale: 'sm:mt-0', medalSize: 'text-3xl sm:text-4xl', avatarSize: 'w-14 h-14 sm:w-16 sm:h-16', nameSize: 'text-sm sm:text-base', markSize: 'text-xl sm:text-3xl' },
    { ring: '', scale: 'sm:mt-4', medalSize: 'text-2xl sm:text-3xl', avatarSize: 'w-10 h-10 sm:w-12 sm:h-12', nameSize: 'text-xs sm:text-sm', markSize: 'text-lg sm:text-2xl' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0 overflow-x-hidden">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          Student Leaderboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Top performers ranked by academic performance</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl dark:bg-gray-800" />)}</div>
      ) : entries.length === 0 ? (
        <Card className="border dark:border-gray-800">
          <CardContent className="py-8 sm:py-12 text-center text-gray-400 dark:text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No graded submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ─── Top 3 Podium ────────────────────────────── */}
          {entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {podiumOrder.map((dataIdx, displayIdx) => {
                const e = entries[dataIdx];
                if (!e) return null;
                const style = podiumStyles[dataIdx];
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dataIdx * 0.1 }}
                    className="min-w-0"
                  >
                    <Card className={`border dark:border-gray-800 text-center ${style.ring}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className={`${style.medalSize} mb-1 sm:mb-2`}>{medals[dataIdx]}</div>
                        <Avatar className={`${style.avatarSize} mx-auto mb-1.5 sm:mb-2`}>
                          <AvatarImage src={e.avatar} />
                          <AvatarFallback>{getInitials(e.name)}</AvatarFallback>
                        </Avatar>
                        <p className={`font-semibold truncate dark:text-gray-100 ${style.nameSize}`}>{e.name}</p>
                        <p className={`font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 ${style.markSize}`}>
                          {e.averageMarks?.toFixed(1)}%
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{e.totalSubmissions} submissions</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ─── Full Rankings Table ──────────────────────── */}
          <Card className="border dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-800">
                    <TableHead className="w-14 sm:w-16 text-xs sm:text-sm">Rank</TableHead>
                    <TableHead className="text-xs sm:text-sm">Student</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Submissions</TableHead>
                    <TableHead className="text-xs sm:text-sm">Avg Marks</TableHead>
                    <TableHead className="hidden sm:table-cell w-28 sm:w-32 text-xs sm:text-sm">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e: any, i: number) => (
                    <TableRow key={e.id} className="dark:border-gray-800">
                      <TableCell className="font-bold text-sm">
                        {i < 3 ? <span className="text-base sm:text-lg">{medals[i]}</span> : <span className="text-gray-500">#{i + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
                            <AvatarImage src={e.avatar} />
                            <AvatarFallback className="text-[10px] sm:text-xs">{getInitials(e.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium dark:text-gray-200 text-sm truncate">{e.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell dark:text-gray-300 text-sm">{e.totalSubmissions}</TableCell>
                      <TableCell className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{e.averageMarks?.toFixed(1)}%</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2 min-w-0">
                          <Progress value={e.averageMarks} className="h-2 flex-1 min-w-0" />
                          <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">{e.averageMarks?.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
