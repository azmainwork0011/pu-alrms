'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiFetch } from '@/lib/api';
import { getInitials, AnimatedCounter, timeAgo } from '@/components/pu-helpers';
import type { UserRole } from '@/store/app';
import {
  Shield, Users, Activity, Code, Search, Ban, CheckCircle, XCircle,
  BadgeCheck, ChevronLeft, ChevronRight, MoreVertical, UserCog, RefreshCw,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  bannedUsers: number;
  roleDistribution: { role: UserRole; count: number }[];
}

interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  timestamp: string;
  status: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white',
  ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  DEVELOPER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  TEACHER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  STUDENT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  CR: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

const ROLE_BAR_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'from-emerald-500 to-cyan-400',
  ADMIN: 'from-rose-400 to-rose-500',
  DEVELOPER: 'from-amber-400 to-amber-500',
  TEACHER: 'from-violet-400 to-violet-500',
  STUDENT: 'from-gray-300 to-gray-400',
  CR: 'from-cyan-400 to-cyan-500',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BANNED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const ITEMS_PER_PAGE = 12;

// ═══════════════════════════════════════════════════════════════
// VERIFIED BADGE
// ═══════════════════════════════════════════════════════════════

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-blue-500" title="Meta Verified">
      <BadgeCheck className="w-3.5 h-3.5" />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// AVATAR INITIALS
// ═══════════════════════════════════════════════════════════════

function UserAvatar({ name, role }: { name: string; role: string }) {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white',
    ADMIN: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white',
    DEVELOPER: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
    TEACHER: 'bg-gradient-to-br from-violet-500 to-purple-500 text-white',
    STUDENT: 'bg-gradient-to-br from-gray-400 to-gray-500 text-white',
    CR: 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white',
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colors[role] || 'bg-gray-200 text-gray-600'}`}>
      {getInitials(name || 'U')}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, icon, gradient }: {
  label: string; value: number; icon: React.ReactNode; gradient: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="hover:-translate-y-0.5 transition-all duration-300 border dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium truncate">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedCounter target={value} />
              </p>
            </div>
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab({ stats, recentLogins, loading }: {
  stats: AdminStats | null; recentLogins: LogEntry[]; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Active Today', value: stats?.activeToday || 0, icon: <Activity className="w-5 h-5" />, gradient: 'from-cyan-500 to-teal-500' },
    { label: 'New This Week', value: stats?.newThisWeek || 0, icon: <CheckCircle className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-500' },
    { label: 'Banned Users', value: stats?.bannedUsers || 0, icon: <Ban className="w-5 h-5" />, gradient: 'from-rose-500 to-red-500' },
  ];

  const roleData = stats?.roleDistribution || [];
  const maxRole = Math.max(...roleData.map(r => r.count), 1);

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="visible">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Role Distribution */}
      <motion.div variants={fadeUp}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No data available</p>
            ) : roleData.map(r => {
              const pct = Math.round(r.count / maxRole * 100);
              const total = roleData.reduce((a, b) => a + b.count, 0);
              const share = Math.round(r.count / total * 100);
              return (
                <div key={r.role} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className={`${ROLE_COLORS[r.role] || 'bg-gray-100 text-gray-600'} text-[10px] px-2 py-0.5 border-0`}>
                        {r.role}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.count} users</span>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">{share}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${ROLE_BAR_COLORS[r.role] || 'from-gray-400 to-gray-500'}`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Recent Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogins.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {recentLogins.slice(0, 5).map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <UserAvatar name={log.userName} role={log.userRole} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">{log.userName}</p>
                        <Badge className={`${ROLE_COLORS[log.userRole]} text-[9px] px-1.5 py-0 border-0`}>{log.userRole}</Badge>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">{log.userEmail}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(log.timestamp)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT TAB
// ═══════════════════════════════════════════════════════════════

function UserManagementTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
        ...(search && { search }),
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });
      const data = await apiFetch<{ users: AdminUser[]; pagination: { total: number } }>(`/api/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      // Silently handle — will show empty state
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const performAction = async (userId: string, body: Record<string, any>) => {
    setActionLoading(userId);
    try {
      await apiFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, ...body }),
      });
      await fetchUsers();
    } catch {
      // Error handled silently
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="visible">
      {/* Search & Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36 h-10"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {(['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'TEACHER', 'STUDENT', 'CR'] as UserRole[]).map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="BANNED">Banned</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* User List */}
      <Card className="border dark:border-gray-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Users className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <UserAvatar name={user.name} role={user.role} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{user.name}</p>
                      {user.verified && <VerifiedBadge />}
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge className={`${ROLE_COLORS[user.role]} text-[10px] px-1.5 py-0 border-0`}>{user.role}</Badge>
                      <Badge className={`${STATUS_COLORS[user.status]} text-[10px] px-1.5 py-0 border-0`}>{user.status}</Badge>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    {user.lastLogin && <span className="text-[10px] text-gray-400">Login: {timeAgo(user.lastLogin)}</span>}
                    <span className="text-[10px] text-gray-400">Joined: {timeAgo(user.createdAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {actionLoading === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => performAction(user.id, { verified: !user.verified })}>
                          {user.verified ? <XCircle className="w-4 h-4 mr-2 text-rose-500" /> : <BadgeCheck className="w-4 h-4 mr-2 text-blue-500" />}
                          {user.verified ? 'Remove Verified' : 'Set Verified'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => performAction(user.id, { role: 'TEACHER' })}>
                          <UserCog className="w-4 h-4 mr-2 text-violet-500" />
                          Change Role
                        </DropdownMenuItem>
                        {user.status === 'ACTIVE' ? (
                          <>
                            <DropdownMenuItem onClick={() => performAction(user.id, { status: 'SUSPENDED' })}>
                              <XCircle className="w-4 h-4 mr-2 text-amber-500" />
                              Suspend User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => performAction(user.id, { status: 'BANNED' })} className="text-rose-600">
                              <Ban className="w-4 h-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => performAction(user.id, { status: 'ACTIVE' })}>
                            <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-600 dark:text-gray-300 px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEVELOPER ACCESS TAB
// ═══════════════════════════════════════════════════════════════

function DeveloperAccessTab() {
  const [devs, setDevs] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDevs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ users: AdminUser[]; pagination: { total: number } }>('/api/admin/users?role=DEVELOPER&limit=50');
      setDevs(data.users || []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevs(); }, [fetchDevs]);

  const toggleDevStatus = async (userId: string, currentStatus: string) => {
    setActionLoading(userId);
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await apiFetch('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, status: newStatus }),
      });
      await fetchDevs();
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={fadeUp}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Developer Accounts
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-2 py-0 border-0">
                {devs.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : devs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Code className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No developer accounts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {devs.map((dev, i) => (
                  <motion.div
                    key={dev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <UserAvatar name={dev.name} role="DEVELOPER" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">{dev.name}</p>
                        {dev.verified && <VerifiedBadge />}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">{dev.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${STATUS_COLORS[dev.status]} text-[10px] px-1.5 py-0 border-0`}>{dev.status}</Badge>
                        {dev.lastLogin && <span className="text-[10px] text-gray-400">Last login: {timeAgo(dev.lastLogin)}</span>}
                      </div>
                    </div>
                    <Button
                      variant={dev.status === 'ACTIVE' ? 'outline' : 'default'}
                      size="sm"
                      className={`h-8 text-xs ${dev.status === 'ACTIVE' ? 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0'}`}
                      disabled={actionLoading === dev.id}
                      onClick={() => toggleDevStatus(dev.id, dev.status)}
                    >
                      {actionLoading === dev.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : dev.status === 'ACTIVE' ? (
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      )}
                      {dev.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM LOGS TAB
// ═══════════════════════════════════════════════════════════════

function SystemLogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      const data = await apiFetch<LogEntry[]>(`/api/admin/logs?${params}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Filter Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {(['SUPER_ADMIN', 'ADMIN', 'DEVELOPER', 'TEACHER', 'STUDENT', 'CR'] as UserRole[]).map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-gray-400">{logs.length} entries</span>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border dark:border-gray-800">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <Activity className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No log entries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase tracking-wider text-gray-400 font-medium min-w-[540px]">
                  <span>User</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Last Login</span>
                  <span>Status</span>
                </div>
                {/* Table Rows */}
                <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {logs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 sm:gap-3 items-center px-3 sm:px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors min-w-[540px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar name={log.userName} role={log.userRole} />
                        <span className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">{log.userName}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 truncate">{log.userEmail}</span>
                      <Badge className={`${ROLE_COLORS[log.userRole]} text-[9px] px-1.5 py-0 border-0 shrink-0`}>{log.userRole}</Badge>
                      <span className="text-[11px] text-gray-400 shrink-0">{log.timestamp ? timeAgo(log.timestamp) : 'N/A'}</span>
                      <Badge className={`${STATUS_COLORS[log.status]} text-[9px] px-1.5 py-0 border-0 shrink-0`}>{log.status || 'ACTIVE'}</Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

function AdminPanelPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogins, setRecentLogins] = useState<LogEntry[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        apiFetch<AdminStats>('/api/admin/stats').catch(() => null),
        apiFetch<LogEntry[]>('/api/admin/logs?limit=5').catch(() => []),
      ]);
      setStats(statsData);
      setRecentLogins(Array.isArray(logsData) ? logsData : []);
    } catch {
      // Silently handle
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)] min-w-0 overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-4 sm:p-5 text-white shadow-lg shadow-emerald-500/10"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">Super Admin Panel</h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">Manage users, roles, and system access</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl">
          {[
            { value: 'overview', label: 'Overview', icon: Activity },
            { value: 'users', label: 'Users', icon: Users },
            { value: 'developers', label: 'Devs', icon: Code },
            { value: 'logs', label: 'Logs', icon: Shield },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:font-semibold transition-all"
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="mt-5">
            <OverviewTab stats={stats} recentLogins={recentLogins} loading={overviewLoading} />
          </TabsContent>

          <TabsContent value="users" className="mt-5">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="developers" className="mt-5">
            <DeveloperAccessTab />
          </TabsContent>

          <TabsContent value="logs" className="mt-5">
            <SystemLogsTab />
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

export default AdminPanelPage;
