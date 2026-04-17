'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Save, Volume2, VolumeX, Speaker, Sparkles, Clock,
  Award, Star, Target, TrendingUp, ChevronRight,
  ImagePlus, ShieldCheck, LogIn, Settings, Bell,
} from 'lucide-react';
import {
  getSoundSettings, saveSoundSettings, previewSound,
  SOUND_OPTIONS, type SoundType, type SoundOption,
} from '@/lib/notification-sound';

// ══════════════════════════════════════════════════════════════
// Animation Variants
// ══════════════════════════════════════════════════════════════
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const scaleIn = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } };

// ══════════════════════════════════════════════════════════════
// Notification Sound Settings Component
// ══════════════════════════════════════════════════════════════
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${settings.enabled ? 'bg-emerald-100 dark:bg-emerald-900/30 shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {settings.enabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sound Effects</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{settings.enabled ? 'Playing sounds on notifications' : 'Notification sounds muted'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleEnabled}
          className={`relative w-11 h-6 rounded-full transition-all duration-300 ${settings.enabled ? 'bg-emerald-500 shadow-sm shadow-emerald-200/50' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300" style={{ left: settings.enabled ? '22px' : '2px' }} />
        </button>
      </div>

      {settings.enabled && (
        <div className="space-y-2 pl-12">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Volume</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input type="range" min="0" max="100" value={settings.volume * 100} onChange={(e) => changeVolume(Number(e.target.value) / 100)} className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-emerald-500" />
        </div>
      )}

      {settings.enabled && (
        <div className="space-y-2 pl-12">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Choose Sound (tap to select & preview)</p>
          {['Original', 'Classic', 'Trending', 'Hindi', 'Bangla'].map((cat) => {
            const catOptions = SOUND_OPTIONS.filter(o => o.category === cat);
            if (catOptions.length === 0) return null;
            return (
              <div key={cat} className="space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-2">{cat}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catOptions.map((option: SoundOption) => {
                    const isSelected = settings.soundType === option.id;
                    const isPlaying = previewing === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => changeSound(option.id)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected ? option.isRealAudio ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-400 shadow-sm' : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-400 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${isPlaying ? 'scale-[0.98]' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isPlaying ? 'bg-amber-500 text-white scale-110' : isSelected ? (option.isRealAudio ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-800/30 text-emerald-600 dark:text-emerald-400') : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          }`}>
                            {isPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-semibold truncate ${isSelected ? (option.isRealAudio ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300') : 'text-gray-700 dark:text-gray-300'}`}>{option.label}</p>
                              {option.isRealAudio && <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500 text-white uppercase tracking-wider">Original</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{option.description}</p>
                          </div>
                          {isSelected && (
                            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${option.isRealAudio ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {settings.enabled && (
        <div className="flex justify-center pt-1">
          <Button size="sm" variant="outline" onClick={() => handlePreview(settings.soundType)} className="gap-2 h-8 text-xs">
            <Volume2 className={`w-3.5 h-3.5 ${previewing ? 'animate-pulse' : ''}`} />
            {previewing ? 'Playing...' : 'Preview Current Sound'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PROFILE PAGE
// ══════════════════════════════════════════════════════════════

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
      if (uploadType === 'avatar') { updateUser({ avatar: r.url }); setAvatarPreview(null); }
      else { updateUser({ coverPhoto: r.url }); setCoverPreview(null); }
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

  const roleGradient = role === 'ADMIN' ? 'from-red-500 to-orange-500' : role === 'TEACHER' ? 'from-emerald-500 to-teal-500' : role === 'CR' ? 'from-violet-500 to-purple-500' : 'from-amber-500 to-orange-500';
  const roleGlow = role === 'ADMIN' ? 'shadow-red-300/40 dark:shadow-red-900/20' : role === 'TEACHER' ? 'shadow-emerald-300/40 dark:shadow-emerald-900/20' : role === 'CR' ? 'shadow-violet-300/40 dark:shadow-violet-900/20' : 'shadow-amber-300/40 dark:shadow-amber-900/20';

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-safe min-w-0 overflow-x-hidden">
      {/* ══════════════════════════════════════════════════════════ */}
      {/* HERO: Cover + Avatar + Name                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp}>
        <div className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700/50 shadow-xl">
          {/* ── Cover Photo ──────────────────────────────── */}
          <div className="relative h-44 sm:h-56 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
            {coverSrc ? (
              <img src={coverSrc} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                {/* Decorative pattern */}
                <div className="absolute inset-0">
                  <motion.div className="absolute -top-10 -left-10 w-40 h-40 bg-white/8 rounded-full" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                  <motion.div className="absolute bottom-0 right-0 w-56 h-56 bg-white/5 rounded-full" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
                  <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 12, repeat: Infinity }}>
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="opacity-[0.04]">
                      <rect x="20" y="20" width="160" height="160" rx="20" stroke="white" strokeWidth="1.5" />
                      <rect x="50" y="50" width="100" height="100" rx="12" stroke="white" strokeWidth="1" />
                      <circle cx="100" cy="85" r="20" stroke="white" strokeWidth="1" />
                      <path d="M60 140 C60 120 80 110 100 110 C120 110 140 120 140 140" stroke="white" strokeWidth="1" fill="none" />
                    </svg>
                  </motion.div>
                </div>
                {/* Mesh gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </>
            )}
            {/* Cover upload button */}
            <button
              type="button"
              onClick={() => pickFile('cover')}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/40 hover:bg-black/60 active:bg-black/70 text-white/80 hover:text-white transition-all backdrop-blur-md text-xs font-medium min-h-[44px]"
              disabled={!!uploading}
            >
              {uploading === 'cover' ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              Cover
            </button>
          </div>

          {/* ── Profile Content ──────────────────────────── */}
          <div className="relative px-5 sm:px-6 pb-6 bg-white dark:bg-gray-900">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <motion.div
                className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-gray-900"
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Avatar glow ring */}
                <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${roleGradient} opacity-30 blur-md ${roleGlow}`} />
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="relative w-full h-full object-cover" />
                ) : (
                  <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br ${roleGradient}`}>
                    <span className="text-3xl font-bold text-white">{getInitials(user?.name || 'U')}</span>
                  </div>
                )}
                {/* Avatar hover overlay */}
                <button
                  type="button"
                  onClick={() => pickFile('avatar')}
                  className="absolute inset-0 bg-black/30 sm:bg-black/0 hover:bg-black/50 sm:hover:bg-black/50 transition-all duration-200 flex items-center justify-center group"
                  disabled={!!uploading}
                >
                  {uploading === 'avatar' ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                      <Camera className="w-4 h-4 text-white" />
                      <span className="text-xs text-white font-medium">Change</span>
                    </div>
                  )}
                </button>
              </motion.div>
              {/* Online status dot */}
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-gray-900 shadow-sm" />
            </div>

            {/* Name + Role + Edit */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 -mt-1">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">{user?.name || 'User'}</h2>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${roleGradient}`} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <Badge className={`${getRoleBadgeColor(role)} text-xs font-semibold px-2.5 py-0.5`}>{roleLabel}</Badge>
                  {user?.batch && (
                    <Badge variant="outline" className="text-xs font-medium border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-3 h-3 mr-1" />{user.batch}
                    </Badge>
                  )}
                  {user?.department && (
                    <Badge variant="outline" className="text-xs font-medium border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                      <Building2 className="w-3 h-3 mr-1" />{user.department}
                    </Badge>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={editMode ? 'edit' : 'view'} {...scaleIn} className="flex items-center gap-2 shrink-0">
                  {editMode ? (
                    <>
                      <Button size="sm" onClick={saveProfile} disabled={saving} className={`h-9 px-5 bg-gradient-to-r ${roleGradient} hover:opacity-90 text-white font-semibold shadow-md border-0`}>
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1.5" />Save</>}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="h-9 px-4 text-gray-600 dark:text-gray-300">
                        <X className="w-3.5 h-3.5 mr-1" />Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEdit} className={`h-9 px-5 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group`}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      Edit Profile
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* STATS CARDS                                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl dark:bg-gray-800" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(role === 'STUDENT' ? [
              { label: 'Pending', value: stats.pendingAssignments || 0, icon: <Clock className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/40', iconBg: 'bg-amber-100 dark:bg-amber-800/30' },
              { label: 'Submitted', value: stats.submittedCount || 0, icon: <Target className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40', iconBg: 'bg-emerald-100 dark:bg-emerald-800/30' },
              { label: 'Avg Grade', value: stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <TrendingUp className="w-4 h-4" />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40', iconBg: 'bg-violet-100 dark:bg-violet-800/30', isText: true },
              { label: 'Completion', value: stats.completionRate || 0, icon: <Award className="w-4 h-4" />, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-100 dark:border-cyan-800/40', iconBg: 'bg-cyan-100 dark:bg-cyan-800/30', isPercent: true },
            ] : role === 'TEACHER' || role === 'CR' ? [
              { label: 'Created', value: stats.createdAssignments || 0, icon: <Sparkles className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40', iconBg: 'bg-emerald-100 dark:bg-emerald-800/30' },
              { label: 'Submissions', value: stats.totalSubmissions || 0, icon: <Target className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/40', iconBg: 'bg-blue-100 dark:bg-blue-800/30' },
              { label: 'To Grade', value: stats.pendingGrading || 0, icon: <Clock className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/40', iconBg: 'bg-amber-100 dark:bg-amber-800/30' },
              { label: 'Avg Marks', value: stats.averageMarks ? `${stats.averageMarks.toFixed(1)}%` : 'N/A', icon: <Star className="w-4 h-4" />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40', iconBg: 'bg-violet-100 dark:bg-violet-800/30', isText: true },
            ] : [
              { label: 'Users', value: stats.totalUsers || 0, icon: <Shield className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40', iconBg: 'bg-emerald-100 dark:bg-emerald-800/30' },
              { label: 'Assignments', value: stats.totalAssignments || 0, icon: <Target className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/40', iconBg: 'bg-blue-100 dark:bg-blue-800/30' },
              { label: 'Submissions', value: stats.totalSubmissions || 0, icon: <TrendingUp className="w-4 h-4" />, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40', iconBg: 'bg-violet-100 dark:bg-violet-800/30' },
              { label: 'Subjects', value: stats.activeSubjects?.length || 0, icon: <BookOpen className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/40', iconBg: 'bg-amber-100 dark:bg-amber-800/30' },
            ]).map((s: any, idx: number) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className={`p-4 rounded-xl border ${s.border} ${s.bg} transition-shadow hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center ${s.color}`}>
                    {s.icon}
                  </div>
                </div>
                <p className={`text-2xl font-extrabold ${s.color} tracking-tight`}>
                  {s.isText ? s.value : s.isPercent ? (
                    <><AnimatedCounter target={typeof s.value === 'number' ? s.value : 0} /><span className="text-sm font-medium text-gray-400 ml-0.5">%</span></>
                  ) : <AnimatedCounter target={typeof s.value === 'number' ? s.value : 0} />}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        ) : null}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PROFILE INFORMATION                                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Profile Information</h3>
          </div>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {editMode ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', val: formName, set: setFormName, ph: 'Your full name', required: true },
                    { label: 'Roll Number', val: formRoll, set: setFormRoll, ph: 'e.g. 2024001' },
                    { label: 'Batch', val: formBatch, set: setFormBatch, ph: 'e.g. CSE-66' },
                    { label: 'Department', val: formDept, set: setFormDept, ph: 'e.g. Computer Science' },
                    { label: 'Phone', val: formPhone, set: setFormPhone, ph: '+8801XXXXXXXXX' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                      <Input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className="h-10 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors" />
                    </div>
                  ))}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio / About</label>
                    <textarea
                      value={formBio}
                      onChange={(e) => setFormBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full p-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 bg-gray-50/50 resize-none min-h-[80px] focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                      rows={3}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                    {[
                      { icon: <User className="w-4 h-4" />, label: 'Full Name', value: user?.name },
                      { icon: <Hash className="w-4 h-4" />, label: 'Roll Number', value: user?.rollNumber },
                      { icon: <BookOpen className="w-4 h-4" />, label: 'Batch', value: user?.batch },
                      { icon: <Building2 className="w-4 h-4" />, label: 'Department', value: user?.department },
                      { icon: <Mail className="w-4 h-4" />, label: 'Email', value: user?.email },
                      { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: user?.phone },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 py-3.5 -mx-1 px-1 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg transition-colors min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5">
                            {item.value || <span className="text-gray-300 dark:text-gray-600 italic text-xs">Not set</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Bio */}
                  {user?.bio && (
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Bio</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{user.bio}</p>
                    </div>
                  )}
                  {/* Joined */}
                  <div className="flex items-center gap-3 py-3.5 px-1 mt-1">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Joined</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{joinDate}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* QUICK SETTINGS SECTION                                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Notification Sound */}
        <motion.div {...fadeUp} transition={{ delay: 0.22 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm h-full">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notification Sound</h3>
            </div>
            <CardContent className="p-5">
              <NotificationSoundSettings />
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Actions */}
        <motion.div {...fadeUp} transition={{ delay: 0.28 }}>
          <Card className="border border-gray-200/80 dark:border-gray-700/50 shadow-sm h-full">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Settings className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Account</h3>
            </div>
            <CardContent className="p-5 space-y-3">
              {/* Quick info cards */}
              <div className="space-y-2">
                {[
                  { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, label: 'Account Status', value: 'Active & Verified', color: 'text-emerald-600 dark:text-emerald-400' },
                  { icon: <LogIn className="w-4 h-4 text-violet-500" />, label: 'Role', value: roleLabel, color: 'text-violet-600 dark:text-violet-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700/50 flex items-center justify-center shadow-sm">
                        {item.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.label}</span>
                    </div>
                    <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  variant="destructive"
                  onClick={logout}
                  className="w-full h-10 font-semibold rounded-xl bg-rose-500 hover:bg-rose-600 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" className="hidden" accept="image/*" onChange={onFile} />
      <input ref={coverRef} type="file" className="hidden" accept="image/*" onChange={onFile} />
    </div>
  );
}

export default ProfilePage;
