'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store/app';
import { announcementApi } from '@/lib/api';
import {
  Megaphone, AlertTriangle, Bell, Edit, Trash2, MoreHorizontal, Plus, User as UserIcon,
} from 'lucide-react';
import { DashboardSkeleton, timeAgo, playNotificationSound } from '@/components/pu-helpers';

function AnnouncementsPage() {
  const { user } = useAppStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', message: '', type: 'GENERAL', priority: 'NORMAL' });
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const canEdit = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'CR';
  const canDelete = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await announcementApi.list();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      if (editId) {
        await announcementApi.update(editId, form);
        toast.success('Announcement updated');
      } else {
        await announcementApi.create(form);
        toast.success('Announcement published to all students!');
        playNotificationSound();
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ title: '', message: '', type: 'GENERAL', priority: 'NORMAL' });
      loadAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ann: any) => {
    setForm({ title: ann.title, message: ann.message, type: ann.type, priority: ann.priority });
    setEditId(ann.id);
    setShowCreate(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await announcementApi.delete(id);
      toast.success('Announcement deleted');
      loadAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const getTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      ASSIGNMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      EXAM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      RESULT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    };
    return styles[type] || styles.GENERAL;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Announcements
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {canCreate ? 'Create and manage announcements for all students' : 'Stay updated with the latest announcements'}
          </p>
        </div>
        {canCreate && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={() => { setShowCreate(true); setEditId(null); setForm({ title: '', message: '', type: 'GENERAL', priority: 'NORMAL' }); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> New Announcement
            </Button>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setEditId(null); setForm({ title: '', message: '', type: 'GENERAL', priority: 'NORMAL' }); } }}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
            <DialogDescription>
              {editId ? 'Update the announcement details' : 'This will be sent as a notification to all students'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title..." required className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write your announcement..." rows={4} required className="dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                    <SelectItem value="EXAM">Exam</SelectItem>
                    <SelectItem value="RESULT">Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditId(null); }} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Cancel</Button>
              <Button type="submit" disabled={submitting || !form.title.trim() || !form.message.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span> : null}
                {editId ? 'Update' : 'Publish'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card className="border dark:border-gray-800">
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No announcements yet</p>
            {canCreate && <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create the first announcement to notify all students</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann, i) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border dark:border-gray-800 ${ann.priority === 'CRITICAL' ? 'border-l-4 border-l-red-500 dark:border-l-red-400' : ann.priority === 'HIGH' ? 'border-l-4 border-l-amber-500 dark:border-l-amber-400' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {getPriorityIcon(ann.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{ann.title}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeStyle(ann.type)}`}>{ann.type}</span>
                          {ann.priority === 'CRITICAL' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">CRITICAL</span>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{ann.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{ann.creator?.name || 'Unknown'}</span>
                          <span>{timeAgo(ann.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 dark:text-gray-400 dark:hover:text-gray-200">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-gray-900 dark:border-gray-800">
                          <DropdownMenuItem onClick={() => handleEdit(ann)} className="dark:text-gray-300 dark:focus:bg-gray-800"><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                          {canDelete && <DropdownMenuItem onClick={() => handleDelete(ann.id)} className="text-red-600 dark:text-red-400 dark:focus:bg-gray-800"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;
