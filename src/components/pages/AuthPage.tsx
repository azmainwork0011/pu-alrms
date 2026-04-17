'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppStore } from '@/store/app';
import { authApi } from '@/lib/api';
import {
  GraduationCap, BookOpen, Mail, Lock, Unlock, Eye, Globe, Zap, ArrowRight, Sparkles, UserPlus, KeyRound,
  Monitor, Smartphone, Shield, ChevronRight,
} from 'lucide-react';
import {
  getPasswordStrength, isValidEmail, FloatingParticles, DevCredit, Shield as ShieldIcon,
} from '@/components/pu-helpers';

// ─── Animated Background Shapes ───────────────────────────
function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/15 dark:bg-emerald-500/8 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-teal-400/12 dark:bg-teal-500/6 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-3xl"
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-amber-300/8 dark:bg-amber-500/4 blur-3xl"
        animate={{ x: [0, -20, 20, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}

// ─── Network Error Detection ────────────────────────────
function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('net::ERR_') ||
    msg.includes('Aborted') ||
    msg.includes('timeout') ||
    msg.includes('ECONNREFUSED')
  );
}

function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const { setAuth } = useAppStore();

  // Persist login role and email across reloads
  const [loginRole, setLoginRoleState] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const setLoginRole = useCallback((role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setLoginRoleState(role);
    try { localStorage.setItem('login-role', role); } catch {}
  }, []);

  // Restore saved role + email on mount (after hydration)
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('login-role');
      if (savedRole && ['STUDENT', 'TEACHER', 'ADMIN'].includes(savedRole)) {
        setLoginRoleState(savedRole as 'STUDENT' | 'TEACHER' | 'ADMIN');
      }
      const savedEmail = localStorage.getItem('login-email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    } catch {}
  }, []);

  // Google OAuth dialog state
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleForm, setGoogleForm] = useState({ name: '', email: '', role: 'STUDENT' });
  const [googleLoading, setGoogleLoading] = useState(false);

  // Temp email dialog state
  const [tempEmailOpen, setTempEmailOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempLoading, setTempLoading] = useState(false);

  const roleConfig = {
    STUDENT: { color: 'amber', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', placeholder: 'student@stu.pu.edu', glow: 'shadow-amber-200/50 dark:shadow-amber-900/20' },
    TEACHER: { color: 'emerald', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', placeholder: 'teacher@pu.edu', glow: 'shadow-emerald-200/50 dark:shadow-emerald-900/20' },
    ADMIN: { color: 'rose', gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', placeholder: 'admin@pu.edu', glow: 'shadow-rose-200/50 dark:shadow-rose-900/20' },
  };

  const currentRole = roleConfig[loginRole];
  const pwStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent double-submission
    if (loading) return;
    setLoading(true);
    try {
      const result = activeTab === 'login'
        ? await authApi.login(formData.email, formData.password)
        : await authApi.register(formData);
      setAuth(result.user, result.token);
      try { localStorage.removeItem('login-email'); } catch {}
      toast.success(activeTab === 'login' ? 'Welcome back!' : 'Account created successfully!');
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error('Network error — please check your connection and try again');
      } else {
        toast.error(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Google OAuth Handler ───────────────────────────────
  const handleGoogleAuth = async () => {
    if (!googleForm.name.trim() || !googleForm.email.trim()) {
      toast.error('Please enter your name and email');
      return;
    }
    if (!isValidEmail(googleForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await authApi.googleAuth({
        name: googleForm.name.trim(),
        email: googleForm.email.trim(),
        role: googleForm.role,
      });
      setAuth(result.user, result.token);
      toast.success(result.isExisting ? `Welcome back, ${result.user.name}!` : `Account created via Google for ${result.user.name}!`);
      setGoogleOpen(false);
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error('Network error — please check your connection and try again');
      } else {
        toast.error(err.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Temp Email Handler ─────────────────────────────────
  const handleTempEmailAuth = async () => {
    if (tempLoading) return;
    setTempLoading(true);
    try {
      const result = await authApi.tempEmailAuth(tempName.trim() || undefined);
      setAuth(result.user, result.token);
      toast.success(`Welcome! Your temp email: ${result.tempEmail}`);
      setTempEmailOpen(false);
    } catch (err: any) {
      if (isNetworkError(err)) {
        toast.error('Network error — please check your connection and try again');
      } else {
        toast.error(err.message || 'Temp login failed');
      }
    } finally {
      setTempLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Student', email: 'alice@stu.pu.edu', password: 'student123', icon: <GraduationCap className="w-5 h-5" />, role: 'STUDENT' as const, color: 'amber', desc: 'Submit assignments & track grades' },
    { label: 'Teacher', email: 'dr.smith@pu.edu', password: 'teacher123', icon: <BookOpen className="w-5 h-5" />, role: 'TEACHER' as const, color: 'emerald', desc: 'Create & grade assignments' },
    { label: 'Admin', email: 'admin@pu.edu', password: 'admin123', icon: <ShieldIcon className="w-5 h-5" />, role: 'ADMIN' as const, color: 'rose', desc: 'Manage the platform' },
  ];

  const quickLogin = async (email: string, password: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.user, result.token);
      try { localStorage.removeItem('login-email'); } catch {}
      toast.success('Welcome back!');
    } catch (err: any) {
      try { localStorage.setItem('login-email', email); } catch {}
      if (isNetworkError(err)) {
        toast.error('Network error — please check your connection and try again');
      } else {
        toast.error(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-4 relative overflow-hidden">
      <AnimatedBg />
      <FloatingParticles />

      <motion.div
        className="w-full max-w-[420px] relative z-10"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* ─── Logo & Branding ───────────────────────────────── */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Logo with animated ring */}
          <div className="relative inline-flex items-center justify-center mb-4">
            {/* Outer glow ring */}
            <motion.div
              className="absolute w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400/30 to-teal-400/30 dark:from-emerald-500/20 dark:to-teal-500/20 blur-xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Rotating border ring */}
            <motion.div
              className="absolute w-[100px] h-[100px] rounded-2xl border-2 border-emerald-300/40 dark:border-emerald-500/20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Logo container */}
            <motion.div
              className="relative w-[88px] h-[88px] rounded-2xl overflow-hidden shadow-xl shadow-emerald-200/60 dark:shadow-emerald-900/40 border-2 border-white/60 dark:border-gray-700/60"
              whileHover={{ scale: 1.06, rotate: 2 }}
              whileTap={{ scale: 0.96 }}
            >
              <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
            </motion.div>
          </div>

          <motion.h1
            className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            PU-ALRMS
          </motion.h1>
          <motion.p
            className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Prime University &middot; Academic Management System
          </motion.p>
        </motion.div>

        {/* ─── Main Auth Card ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Card className={`shadow-2xl shadow-emerald-100/60 dark:shadow-none dark:bg-gray-900/80 dark:border dark:border-gray-800 backdrop-blur-xl border-0 overflow-hidden`}>
            {/* Card top accent bar */}
            <div className={`h-1 bg-gradient-to-r ${currentRole.gradient}`} />

            <CardHeader className="pb-4 pt-5 px-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1">
                  <TabsTrigger
                    value="login"
                    className={`rounded-lg transition-all ${activeTab === 'login' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : ''}`}
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className={`rounded-lg transition-all ${activeTab === 'register' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : ''}`}
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {/* ─── Role Selector (Login) ──────────────────── */}
              {activeTab === 'login' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl mb-5"
                >
                  {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`flex-1 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                        loginRole === role
                          ? `bg-gradient-to-r ${roleConfig[role].gradient} text-white shadow-md ${roleConfig[role].glow}`
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60'
                      }`}
                      onClick={() => setLoginRole(role)}
                    >
                      {role === 'STUDENT' ? '🎓 Student' : role === 'TEACHER' ? '📚 Teacher' : '🛡️ Admin'}
                    </button>
                  ))}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ─── Name Field (Register) ──────────────── */}
                {activeTab === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-gray-600 dark:text-gray-300">Full Name</Label>
                    <Input id="name" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors" />
                  </motion.div>
                )}

                {/* ─── Email Field ─────────────────────────── */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-600 dark:text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder={activeTab === 'login' ? currentRole.placeholder : 'you@pu.edu'}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        try { localStorage.setItem('login-email', e.target.value); } catch {}
                      }}
                      required
                      className="pl-10 h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {formData.email && !isValidEmail(formData.email) && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Please enter a valid email address
                    </motion.p>
                  )}
                </div>

                {/* ─── Password Field ──────────────────────── */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-gray-600 dark:text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="pl-10 pr-10 h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <Unlock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {activeTab === 'register' && formData.password && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">Strength</span>
                        <span className={`text-[11px] font-semibold ${pwStrength.score >= 4 ? 'text-emerald-600 dark:text-emerald-400' : pwStrength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>{pwStrength.label}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${pwStrength.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: pwStrength.width }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Role Select (Register) ─────────────── */}
                {activeTab === 'register' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Role</Label>
                    <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                      <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Student</SelectItem>
                        <SelectItem value="TEACHER">Teacher</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                {/* ─── Submit Button ──────────────────────── */}
                <Button
                  type="submit"
                  className={`w-full h-11 bg-gradient-to-r ${currentRole.gradient} hover:opacity-90 text-white border-0 shadow-lg ${currentRole.glow} font-semibold text-sm transition-all duration-200`}
                  disabled={loading || (activeTab === 'register' && formData.email && !isValidEmail(formData.email))}
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                  ) : activeTab === 'login' ? (
                    <span className="flex items-center justify-center gap-2">
                      Sign In as {loginRole.charAt(0) + loginRole.slice(1).toLowerCase()}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* ─── Login Extras ─────────────────────────────── */}
              {activeTab === 'login' && (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {/* Google & Quick Access */}
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 gap-2 text-xs h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setGoogleOpen(true)}
                      >
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="truncate">Google Sign-In</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 gap-2 text-xs h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setTempEmailOpen(true)}
                      >
                        <KeyRound className="w-4 h-4 text-amber-500" />
                        <span className="truncate">Quick Access</span>
                      </Button>
                    </div>

                    {/* Demo Accounts */}
                    <div className="mt-5">
                      <Separator className="my-4 bg-gray-200/60 dark:bg-gray-700/60" />
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3 font-medium">Quick Demo Access</p>
                      <div className="grid grid-cols-3 gap-2">
                        {demoAccounts.map((acc, idx) => (
                          <motion.div
                            key={acc.email}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.05 }}
                            whileHover={{ scale: 1.04, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className={`w-full text-xs h-auto py-3 px-2 flex-col gap-1.5 rounded-xl border-2 transition-all duration-200 ${acc.role === 'STUDENT' ? 'border-amber-200/80 hover:bg-amber-50 dark:border-amber-800/60 dark:hover:bg-amber-950/20' : acc.role === 'TEACHER' ? 'border-emerald-200/80 hover:bg-emerald-50 dark:border-emerald-800/60 dark:hover:bg-emerald-950/20' : 'border-rose-200/80 hover:bg-rose-50 dark:border-rose-800/60 dark:hover:bg-rose-950/20'}`}
                              onClick={() => quickLogin(acc.email, acc.password)}
                              disabled={loading}
                            >
                              <span className={`${
                                acc.role === 'STUDENT' ? 'text-amber-600 dark:text-amber-400' :
                                acc.role === 'TEACHER' ? 'text-emerald-600 dark:text-emerald-400' :
                                'text-rose-600 dark:text-rose-400'
                              }`}>
                                {acc.icon}
                              </span>
                              <span className="font-semibold text-[11px]">{acc.label}</span>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Footer ────────────────────────────────────────── */}
        <motion.div
          className="mt-6 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <DevCredit />
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-600">
            PU-ALRMS &copy; 2026 Prime University. All rights reserved.
          </p>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Google Sign-In Dialog                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={googleOpen} onOpenChange={setGoogleOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-blue-500" />
              Sign in with Google
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
              Enter your Google account details to sign in or create a new account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="google-name">Full Name</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="google-name"
                  placeholder="Your Google account name"
                  value={googleForm.name}
                  onChange={(e) => setGoogleForm({ ...googleForm, name: e.target.value })}
                  className="pl-9 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-email">Gmail Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="google-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={googleForm.email}
                  onChange={(e) => setGoogleForm({ ...googleForm, email: e.target.value })}
                  className="pl-9 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Role</Label>
              <Select value={googleForm.role} onValueChange={(role) => setGoogleForm({ ...googleForm, role })}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                New account will be created automatically if your email is not registered yet.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setGoogleOpen(false)} className="flex-1 dark:bg-gray-800 dark:border-gray-700">
                Cancel
              </Button>
              <Button
                onClick={handleGoogleAuth}
                disabled={googleLoading || !googleForm.name || !googleForm.email}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue with Google <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Temp Email Dialog                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={tempEmailOpen} onOpenChange={setTempEmailOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Quick Access Login
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 text-sm">
              Get instant access with a temporary email. No password needed!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="temp-name">Your Name (optional)</Label>
              <Input
                id="temp-name"
                placeholder="Enter your name or leave blank"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                A random temporary email will be generated for you. You&apos;ll be logged in as a Student instantly.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setTempEmailOpen(false)} className="flex-1 dark:bg-gray-800 dark:border-gray-700">
                Cancel
              </Button>
              <Button
                onClick={handleTempEmailAuth}
                disabled={tempLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {tempLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Login Instantly <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tiny XCircle icon (not exported by lucide-react)
function XCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

export default AuthPage;
