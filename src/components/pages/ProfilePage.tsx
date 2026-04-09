'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app';
import { dashboardApi, authApi } from '@/lib/api';
import { getInitials, getRoleBadgeColor, AnimatedCounter } from '@/components/pu-helpers';
import {
  Camera, Pencil, X, LogOut, Shield, BookOpen,
  Hash, Phone, Building2, User, Mail, Calendar,
  GraduationCap, Save, Volume2, VolumeX, Speaker,
} from 'lucide-react';
import {
  getSoundSettings, saveSoundSettings, previewSound,
  SOUND_OPTIONS, type SoundType, type SoundOption,
} from '@/lib/notification-sound';

// ─── Notification Sound Settings Component ──────────────
function NotificationSoundSettings() {
  const [settings, setSettings] = useState(() => getSoundSettings());
  const [previewing, setPreviewing] = useState<string | null>(null);

  const toggleEnabled = () => {
    const updated = saveSoundSettings({ enabled: !settings.enabled });
    setSettings(updated);
  };

  const changeVolume = (vol: number) => {
    const updated = saveSoundSettings({ volume: Math.round(vol * 100) / 100 });
    setSettings(updated);
  };

  const changeSound = (type: SoundType) => {
    const updated = saveSoundSettings({ soundType: type });
    setSettings(updated);
    // Auto-preview on selection
    setPreviewing(type);
    previewSound(type);
    setTimeout(() => setPreviewing(null), 1500);
  };

  const handlePreview = (type: SoundType) => {
    setPreviewing(type);
    previewSound(type);
    setTimeout(() => setPreviewing(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${settings.enabled ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {settings.enabled ? (
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Sound Effects</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {settings.enabled ? 'Playing meme sounds on notifications' : 'Notification sounds muted'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleEnabled}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${settings.enabled ? 'left-5.5 translate-x-0' : 'left-0.5'}`}
            style={{ left: settings.enabled ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Volume Slider */}
      {settings.enabled && (
        <div className="space-y-2 pl-12">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Volume</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume * 100}
            onChange={(e) => changeVolume(Number(e.target.value) / 100)}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      )}

      {/* Sound Selection Grid */}
      {settings.enabled && (
        <div className="space-y-2 pl-12">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Choose Sound (tap to select &amp; preview)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOUND_OPTIONS.map((option: SoundOption) => {
              const isSelected = settings.soundType === option.id;
              const isPlaying = previewing === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => changeSound(option.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? option.isRealAudio
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-400 shadow-sm'
                        : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-400 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${isPlaying ? 'scale-[0.98]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Play indicator - always visible */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      isPlaying
                        ? 'bg-amber-500 text-white scale-110'
                        : isSelected
                          ? option.isRealAudio
                            ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-800/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}>
                      {isPlaying ? (
                        <Volume2 className="w-4 h-4 animate-pulse" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-semibold truncate ${
                          isSelected
                            ? option.isRealAudio
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-emerald-700 dark:text-emerald-300'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {option.label}
                        </p>
                        {option.isRealAudio && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-white uppercase tracking-wider">Original</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{option.description}</p>
                    </div>

                    {/* Checkmark for selected */}
                    {isSelected && (
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        option.isRealAudio ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Preview Button */}
      {settings.enabled && (
        <div className="flex justify-center pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreview(settings.soundType)}
            className="gap-2 h-8 text-xs"
          >
            <Volume2 className={`w-3.5 h-3.5 ${previewing ? 'animate-pulse' : ''}`} />
            {previewing ? 'Playing...' : 'Preview Current Sound'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ProfilePage() {
  const { user, logout, updateUser } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'cover' | null>(null);

  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formBatch, setFormBatch] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBio, setFormBio] = useState('');

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'avatar' | 'cover'>('avatar');

  useEffect(() => {
    dashboardApi.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setFormName(user.name || '');
      setFormRoll(user.rollNumber || '');
      setFormBatch(user.batch || '');
      setFormDept(user.department || '');
      setFormPhone(user.phone || '');
      setFormBio(user.bio || '');
    }
  }, [user]);

  const startEdit = useCallback(() => {
    if (user) {
      setFormName(user.name || '');
      setFormRoll(user.rollNumber || '');
      setFormBatch(user.batch || '');
      setFormDept(user.department || '');
      setFormPhone(user.phone || '');
      setFormBio(user.bio || '');
    }
    setEditMode(true);
  }, [user]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setCoverPreview(null);
    setAvatarPreview(null);
  }, []);

  const saveProfile = useCallback(async () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await authApi.updateProfile({
        name: formName.trim(),
        rollNumber: formRoll.trim() || undefined,
        batch: formBatch.trim() || undefined,
        department: formDept.trim() || undefined,
        phone: formPhone.trim() || undefined,
        bio: formBio.trim() || undefined,
      });
      updateUser(r.user);
      setEditMode(false);
      toast.success('Profile updated!');
    } catch (e: any) { toast.error(e.message || 'Failed to update'); }
    finally { setSaving(false); }
  }, [formName, formRoll, formBatch, formDept, formPhone, formBio, updateUser]);

  const pickFile = useCallback((type: 'avatar' | 'cover') => {
    setUploadType(type);
    if (type === 'avatar') avatarRef.current?.click();
    else coverRef.current?.click();
  }, []);

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Only images allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (uploadType === 'cover') setCoverPreview(ev.target?.result as string);
      else setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(uploadType);
    try {
      const r = await authApi.uploadProfilePhoto(file, uploadType);
      if (uploadType === 'avatar') {
        updateUser({ avatar: r.url });
        setAvatarPreview(null);
      } else {
        updateUser({ coverPhoto: r.url });
        setCoverPreview(null);
      }
      toast.success(`${uploadType === 'avatar' ? 'Profile' : 'Cover'} photo updated!`);
    } catch (e: any) { toast.error(e.message || 'Upload failed'); }
    finally { setUploading(null); }
    e.target.value = '';
  }, [uploadType, updateUser]);

  const role = user?.role || 'STUDENT';
  const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'TEACHER' ? 'Teacher' : role === 'CR' ? 'Class Representative' : 'Student';
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  const avatarSrc = avatarPreview || user?.avatar || '';
  const coverSrc = coverPreview || user?.coverPhoto || '';

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ─── Cover + Header ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border dark:border-gray-800 overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-40 sm:h-52 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
            {coverSrc ? (
              <img src={coverSrc} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0">
                <div className="absolute top-4 left-8 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute bottom-4 right-12 w-48 h-48 bg-white/5 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <GraduationCap className="w-24 h-24 text-white/10" />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => pickFile('cover')}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm"
              disabled={!!uploading}
            >
              {uploading === 'cover' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-5 pb-5">
            {/* Avatar */}
            <div className="relative -mt-14 mb-3">
              <div className="relative w-28 h-28 rounded-2xl border-4 border-white dark:border-gray-900 overflow-hidden shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{getInitials(user?.name || 'U')}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => pickFile('avatar')}
                  className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center group"
                  disabled={!!uploading}
                >
                  {uploading === 'avatar' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            </div>

            {/* Name + Role + Edit */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || 'User'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge className={getRoleBadgeColor(role)}>{roleLabel}</Badge>
                  {user?.batch && (
                    <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400">
                      <BookOpen className="w-3 h-3 mr-1" />{user.batch}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Edit / Save / Cancel Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {editMode ? (
                  <>
                    <Button size="sm" onClick={saveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4">
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1.5" />
                      )}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} className="h-9 px-4">
                      <X className="w-4 h-4 mr-1" />Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={startEdit} className="h-9 px-4 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all">
                    <Pencil className="w-4 h-4 mr-1.5" />Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Profile Details ──────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Your full name" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Roll Number</label>
                  <Input value={formRoll} onChange={(e) => setFormRoll(e.target.value)} placeholder="e.g. 2024001" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Batch</label>
                  <Input value={formBatch} onChange={(e) => setFormBatch(e.target.value)} placeholder="e.g. CSE-66" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Department</label>
                  <Input value={formDept} onChange={(e) => setFormDept(e.target.value)} placeholder="e.g. Computer Science" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g. +8801XXXXXXXXX" className="h-9" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Bio / About</label>
                  <textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full p-2.5 text-sm rounded-lg border dark:border-gray-700 dark:bg-gray-800 resize-none min-h-[80px]"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {[
                  { icon: <User className="w-4 h-4" />, label: 'Full Name', value: user?.name },
                  { icon: <Hash className="w-4 h-4" />, label: 'Roll Number', value: user?.rollNumber },
                  { icon: <BookOpen className="w-4 h-4" />, label: 'Batch', value: user?.batch },
                  { icon: <Building2 className="w-4 h-4" />, label: 'Department', value: user?.department },
                  { icon: <Mail className="w-4 h-4" />, label: 'Email', value: user?.email },
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: user?.phone },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.value || <span className="text-gray-300 dark:text-gray-600 italic">Not set</span>}
                      </p>
                    </div>
                  </div>
                ))}
                {user?.bio && (
                  <div className="pt-1 px-3">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Bio</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{user.bio}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Joined</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{joinDate}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Account Statistics ──────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              Account Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl dark:bg-gray-800" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(role === 'STUDENT' ? [
                  { label: 'Pending', value: stats.pendingAssignments || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Submitted', value: stats.submittedCount || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Avg Grade', value: stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', isText: true },
                  { label: 'Completion', value: stats.completionRate || 0, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', isPercent: true },
                ] : role === 'TEACHER' || role === 'CR' ? [
                  { label: 'Created', value: stats.createdAssignments || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Submissions', value: stats.totalSubmissions || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'To Grade', value: stats.pendingGrading || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Avg Marks', value: stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', isText: true },
                ] : [
                  { label: 'Users', value: stats.totalUsers || 0, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Assignments', value: stats.totalAssignments || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Submissions', value: stats.totalSubmissions || 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: 'Subjects', value: stats.activeSubjects?.length || 0, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ]).map((s: any) => (
                  <div key={s.label} className={`p-3.5 rounded-xl ${s.bg}`}>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xl font-bold mt-1 ${s.color}`}>
                      {s.isText ? s.value : s.isPercent ? (
                        <><AnimatedCounter target={typeof s.value === 'number' ? s.value : 0} /><span className="text-sm text-gray-400 ml-0.5">%</span></>
                      ) : <AnimatedCounter target={typeof s.value === 'number' ? s.value : 0} />}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Notification Sound Settings ──────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Speaker className="w-4 h-4 text-amber-500" />
              Notification Sound
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationSoundSettings />
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Account Actions ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border dark:border-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Button variant="destructive" onClick={logout} className="h-9">
              <LogOut className="w-4 h-4 mr-2" />Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" className="hidden" accept="image/*" onChange={onFile} />
      <input ref={coverRef} type="file" className="hidden" accept="image/*" onChange={onFile} />
    </div>
  );
}

export default ProfilePage;
