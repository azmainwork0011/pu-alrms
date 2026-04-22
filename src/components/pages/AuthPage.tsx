'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppStore } from '@/store/app';
import { authApi } from '@/lib/api';
import {
  GraduationCap, BookOpen, Mail, Lock, Eye, EyeOff, Globe, Zap, ArrowRight, Sparkles, UserPlus, KeyRound,
  Monitor, Shield, ChevronRight, Check, X, AlertCircle, Loader2,
} from 'lucide-react';
import {
  getPasswordStrength, isValidEmail, DevCredit, Shield as ShieldIcon,
} from '@/components/pu-helpers';

// ─── Design Tokens ────────────────────────────────────────
const COLORS = {
  bg: {
    primary: '#0a0d14',
    secondary: '#0f1219',
    card: 'rgba(15, 18, 25, 0.85)',
    cardBorder: 'rgba(236, 72, 153, 0.08)',
    input: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',
    inputFocus: 'rgba(236, 72, 153, 0.5)',
  },
  accent: {
    pink: '#ec4899',
    pinkLight: '#f472b6',
    pinkDark: '#be185d',
    cyan: '#22d3ee',
    cyanLight: '#67e8f9',
    violet: '#a78bfa',
    emerald: '#34d399',
    amber: '#fbbf24',
    rose: '#fb7185',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
    faint: '#475569',
  },
};

// ─── Role Configurations ──────────────────────────────────
const roleConfig = {
  STUDENT: {
    label: 'Student',
    icon: GraduationCap,
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    activeBorder: 'border-amber-400/60',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    glow: 'shadow-amber-500/10',
    accentColor: COLORS.accent.amber,
  },
  TEACHER: {
    label: 'Teacher',
    icon: BookOpen,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    activeBorder: 'border-emerald-400/60',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-emerald-500/10',
    accentColor: COLORS.accent.emerald,
  },
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    gradient: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30 hover:border-rose-400/60',
    activeBorder: 'border-rose-400/60',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    glow: 'shadow-rose-500/10',
    accentColor: COLORS.accent.rose,
  },
};

// ─── Animated Background ──────────────────────────────────
function PremiumBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ background: `linear-gradient(135deg, ${COLORS.bg.primary} 0%, #0d1117 40%, #111827 70%, ${COLORS.bg.secondary} 100%)` }}>
      {/* Gradient orbs */}
      <motion.div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)' }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }}
        animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 right-1/3 w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)' }}
        animate={{ x: [0, 30, -20, 0], y: [0, -25, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(236,72,153,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Top edge glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />
    </div>
  );
}

// ─── Network Error Detection ──────────────────────────────
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

// ─── Premium Input Field ──────────────────────────────────
function PremiumInput({
  id, label, type = 'text', icon: Icon, placeholder, value, onChange, required,
  error, showPasswordToggle = false, showPassword, onTogglePassword, autoComplete,
}: {
  id: string; label: string; type?: string; icon?: React.ElementType; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
  error?: string; showPasswordToggle?: boolean; showPassword?: boolean; onTogglePassword?: () => void;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-slate-400">
        {label}
      </Label>
      <div
        className={`
          relative flex items-center rounded-xl border transition-all duration-300
          ${focused
            ? 'border-pink-500/50 shadow-[0_0_0_3px_rgba(236,72,153,0.08),0_0_20px_rgba(236,72,153,0.06)]'
            : error
            ? 'border-red-500/40'
            : 'border-white/[0.06] hover:border-white/[0.12]'
          }
        `}
        style={{ background: COLORS.bg.input }}
      >
        {Icon && (
          <Icon
            className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 ${focused ? 'text-pink-400' : 'text-slate-500'}`}
          />
        )}
        <Input
          id={id}
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            flex-1 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0
            text-sm text-slate-100 placeholder:text-slate-600 h-11 px-3.5 ${Icon ? 'pl-10' : ''}
            ${showPasswordToggle ? 'pr-10' : ''}
          `}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 p-1 text-slate-500 hover:text-slate-300 transition-colors"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 flex items-center gap-1"
        >
          <XCircle className="w-3 h-3" /> {error}
        </motion.p>
      )}
    </div>
  );
}

function XCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

// ─── Main Auth Page ───────────────────────────────────────
function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [rememberMe, setRememberMe] = useState(false);
  const { setAuth } = useAppStore();

  const [loginRole, setLoginRoleState] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const setLoginRole = useCallback((role: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setLoginRoleState(role);
    try { localStorage.setItem('login-role', role); } catch { /* ignore */ }
  }, []);

  // Restore saved state + auto-seed
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
    } catch { /* ignore */ }
    fetch('/api/auth/seed', { method: 'POST' }).catch(() => {});
  }, []);

  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleForm, setGoogleForm] = useState({ name: '', email: '', role: 'STUDENT' });
  const [googleLoading, setGoogleLoading] = useState(false);

  const [tempEmailOpen, setTempEmailOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempLoading, setTempLoading] = useState(false);

  const currentRole = roleConfig[loginRole];
  const pwStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = activeTab === 'login'
        ? await authApi.login(formData.email, formData.password)
        : await authApi.register(formData);
      setAuth(result.user, result.token);
      try { localStorage.removeItem('login-email'); } catch { /* ignore */ }
      toast.success(activeTab === 'login' ? 'Welcome back!' : 'Account created successfully!');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(err)) {
        setError('Network error — please check your internet connection and try again.');
      } else if (msg.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (msg.includes('Email already registered')) {
        setError('This email is already registered. Try signing in instead.');
      } else if (msg.includes('Email and password are required')) {
        setError('Please enter both email and password.');
      } else if (msg.includes('Internal server error') || msg.includes('HTTP 5')) {
        setError('Server is temporarily busy. Tap to retry.');
      } else {
        setError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
    { label: 'Super Admin', email: 'diya.jainazmain9086@example.com', password: 'superadmin2024', icon: <ShieldIcon className="w-4 h-4" />, role: 'SUPER_ADMIN' as const, color: 'emerald', desc: 'Full system control' },
    { label: 'Admin', email: 'admin@pu.edu', password: 'admin123', icon: <Monitor className="w-4 h-4" />, role: 'ADMIN' as const, color: 'rose', desc: 'Manage the platform' },
    { label: 'Teacher', email: 'dr.smith@pu.edu', password: 'teacher123', icon: <BookOpen className="w-4 h-4" />, role: 'TEACHER' as const, color: 'teal', desc: 'Create & grade' },
    { label: 'Student', email: 'alice@stu.pu.edu', password: 'student123', icon: <GraduationCap className="w-4 h-4" />, role: 'STUDENT' as const, color: 'amber', desc: 'Submit & track' },
  ];

  const quickLogin = async (email: string, password: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.user, result.token);
      try { localStorage.removeItem('login-email'); } catch { /* ignore */ }
      toast.success('Welcome back!');
    } catch (err: any) {
      try { localStorage.setItem('login-email', email); } catch { /* ignore */ }
      if (isNetworkError(err)) {
        setError('Network error — please check your internet connection.');
      } else if (err?.message?.includes('Internal server error') || err?.message?.includes('HTTP 5')) {
        setError('Server is temporarily busy. Tap to retry.');
      } else {
        setError('Demo login failed. Please try again or use manual login.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Animation variants ──
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <div className="min-h-screen relative">
      <PremiumBg />

      <motion.div
        className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-[440px]">
          {/* ─── Logo & Branding ─────────────────────────── */}
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <div className="relative inline-flex items-center justify-center mb-5">
              {/* Outer glow */}
              <motion.div
                className="absolute w-28 h-28 rounded-3xl"
                style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Rotating ring */}
              <motion.div
                className="absolute w-[108px] h-[108px] rounded-2xl border border-pink-500/20"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Logo container */}
              <motion.div
                className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10"
                style={{ boxShadow: '0 8px 32px rgba(236,72,153,0.15), 0 0 0 1px rgba(255,255,255,0.05)' }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.97 }}
              >
                <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
              </motion.div>
            </div>

            <motion.h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              PU-ALRMS
            </motion.h1>
            <motion.p
              className="text-sm text-slate-500 mt-1.5 tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Prime University &middot; Academic Management System
            </motion.p>
          </motion.div>

          {/* ─── Main Auth Card ────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: COLORS.bg.card,
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: `1px solid ${COLORS.bg.cardBorder}`,
                boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
              }}
            >
              {/* Top accent gradient line */}
              <div className="h-0.5 bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-500" />

              <div className="p-6 sm:p-7">
                {/* ─── Tab Switcher ─────────────────────────── */}
                <div className="relative flex p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(167,139,250,0.1))', border: '1px solid rgba(236,72,153,0.2)', boxShadow: '0 2px 8px rgba(236,72,153,0.1)' }}
                    animate={{ left: activeTab === 'login' ? '4px' : '50%', width: 'calc(50% - 8px)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'login' ? 'text-pink-300' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'register' ? 'text-pink-300' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Register
                  </button>
                </div>

                {/* ─── Role Selector (Login) ────────────────── */}
                {activeTab === 'login' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-3 gap-2 mb-6"
                  >
                    {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((role) => {
                      const config = roleConfig[role];
                      const Icon = config.icon;
                      const isActive = loginRole === role;
                      return (
                        <motion.button
                          key={role}
                          type="button"
                          onClick={() => setLoginRole(role)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`
                            relative flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all duration-300
                            ${isActive
                              ? `${config.activeBorder} ${config.bg}`
                              : `border-white/[0.06] hover:border-white/[0.12]`
                            }
                          `}
                          style={isActive ? {
                            boxShadow: `0 4px 16px ${config.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                          } : {}}
                        >
                          <Icon className={`w-4.5 h-4.5 transition-colors duration-200 ${isActive ? config.text : 'text-slate-500'}`} />
                          <span className={`text-xs font-medium transition-colors duration-200 ${isActive ? config.text : 'text-slate-500'}`}>
                            {config.label}
                          </span>
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: config.accentColor }}
                            >
                              <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}

                {/* ─── Form ─────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name (Register) */}
                  <AnimatePresence>
                    {activeTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PremiumInput
                          id="name"
                          label="Full Name"
                          icon={UserPlus}
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <PremiumInput
                    id="email"
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    placeholder={activeTab === 'login' ? `you@${loginRole === 'STUDENT' ? 'stu.pu.edu' : loginRole === 'TEACHER' ? 'pu.edu' : 'pu.edu'}` : 'you@pu.edu'}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      try { localStorage.setItem('login-email', e.target.value); } catch { /* ignore */ }
                    }}
                    required
                    error={formData.email && !isValidEmail(formData.email) ? 'Please enter a valid email address' : undefined}
                  />

                  {/* Password */}
                  <div className="space-y-1.5">
                    <PremiumInput
                      id="password"
                      label="Password"
                      icon={Lock}
                      type="password"
                      autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      showPasswordToggle
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                    />
                    {activeTab === 'register' && formData.password && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-600">Strength</span>
                          <span className={`text-[11px] font-semibold ${pwStrength.score >= 4 ? 'text-emerald-400' : pwStrength.score >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                            {pwStrength.label}
                          </span>
                        </div>
                        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: pwStrength.score >= 4 ? '#34d399' : pwStrength.score >= 2 ? '#fbbf24' : '#f87171' }}
                            initial={{ width: 0 }}
                            animate={{ width: pwStrength.width }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role Select (Register) */}
                  <AnimatePresence>
                    {activeTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1.5"
                      >
                        <Label className="text-xs font-medium text-slate-400">Role</Label>
                        <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                          <SelectTrigger
                            className="h-11 rounded-xl text-sm border-white/[0.06] bg-white/[0.04] text-slate-300 focus:ring-0 focus:ring-offset-0"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/[0.08] bg-[#0f1219]">
                            <SelectItem value="STUDENT" className="text-slate-300 focus:bg-white/[0.06] focus:text-slate-100">Student</SelectItem>
                            <SelectItem value="TEACHER" className="text-slate-300 focus:bg-white/[0.06] focus:text-slate-100">Teacher</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login extras row */}
                  {activeTab === 'login' && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded border border-white/[0.12] bg-white/[0.04] peer-checked:bg-pink-500/20 peer-checked:border-pink-500/50 transition-all duration-200 flex items-center justify-center">
                            {rememberMe && <Check className="w-3 h-3 text-pink-400" strokeWidth={3} />}
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="text-xs text-pink-400/70 hover:text-pink-400 transition-colors"
                        onClick={() => toast.info('Password reset will be available soon.')}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Error Display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-start gap-2.5 p-3.5 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <button
                          type="button"
                          className="text-xs text-red-300/80 flex-1 text-left leading-relaxed hover:text-red-300 transition-colors cursor-pointer"
                          onClick={() => {
                            setError(null);
                            setTimeout(() => {
                              const form = document.querySelector('form');
                              if (form) form.requestSubmit();
                            }, 50);
                          }}
                        >
                          {error}
                          <span className="font-semibold text-red-300 underline ml-1">Retry</span>
                        </button>
                        <button
                          type="button"
                          className="shrink-0 text-red-400/50 hover:text-red-300 transition-colors p-0.5"
                          onClick={() => setError(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      className={`
                        w-full h-12 rounded-xl text-sm font-semibold text-white border-0
                        transition-all duration-300 relative overflow-hidden
                        ${loading ? 'opacity-80 cursor-wait' : 'hover:shadow-lg active:scale-[0.98]'}
                      `}
                      style={{
                        background: loading ? undefined : 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)',
                        boxShadow: loading ? undefined : '0 4px 24px rgba(236,72,153,0.25), 0 0 0 1px rgba(236,72,153,0.1)',
                      }}
                      disabled={loading || (activeTab === 'register' && formData.email && !isValidEmail(formData.email))}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : activeTab === 'login' ? (
                        <span className="flex items-center justify-center gap-2">
                          Sign In as {currentRole.label}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Create Account
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* ─── Login Extras ──────────────────────────── */}
                <AnimatePresence mode="wait">
                  {activeTab === 'login' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                    >
                      {/* Google & Quick Access */}
                      <div className="mt-5 grid grid-cols-2 gap-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 gap-2 text-xs rounded-xl border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.1] transition-all duration-200"
                          onClick={() => setGoogleOpen(true)}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 gap-2 text-xs rounded-xl border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 hover:border-white/[0.1] transition-all duration-200"
                          onClick={() => setTempEmailOpen(true)}
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          Quick Access
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                        <span className="text-[11px] text-slate-600 uppercase tracking-wider font-medium">Quick Demo Access</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                      </div>

                      {/* Demo Account Cards */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {demoAccounts.map((acc, idx) => {
                          const colorMap: Record<string, { border: string; hoverBg: string; iconColor: string; labelColor: string }> = {
                            emerald: { border: 'border-emerald-500/20 hover:border-emerald-400/40', hoverBg: 'hover:bg-emerald-500/[0.04]', iconColor: 'text-emerald-400', labelColor: 'text-emerald-300' },
                            rose: { border: 'border-rose-500/20 hover:border-rose-400/40', hoverBg: 'hover:bg-rose-500/[0.04]', iconColor: 'text-rose-400', labelColor: 'text-rose-300' },
                            teal: { border: 'border-teal-500/20 hover:border-teal-400/40', hoverBg: 'hover:bg-teal-500/[0.04]', iconColor: 'text-teal-400', labelColor: 'text-teal-300' },
                            amber: { border: 'border-amber-500/20 hover:border-amber-400/40', hoverBg: 'hover:bg-amber-500/[0.04]', iconColor: 'text-amber-400', labelColor: 'text-amber-300' },
                          };
                          const colors = colorMap[acc.color] || colorMap.amber;

                          return (
                            <motion.button
                              key={acc.email}
                              type="button"
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.25 + idx * 0.06, duration: 0.4 }}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => quickLogin(acc.email, acc.password)}
                              disabled={loading}
                              className={`
                                flex flex-col items-center gap-2 py-4 px-3 rounded-xl border
                                transition-all duration-300 text-center
                                ${colors.border} ${colors.hoverBg}
                                bg-white/[0.02]
                              `}
                              style={{
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              }}
                            >
                              <span className={colors.iconColor}>{acc.icon}</span>
                              <span className={`text-xs font-semibold ${colors.labelColor}`}>{acc.label}</span>
                              <span className="text-[10px] text-slate-600 leading-tight truncate w-full">{acc.desc}</span>
                              <span className="text-[9px] text-slate-700 truncate w-full font-mono">{acc.email}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ─── Footer ──────────────────────────────────────── */}
          <motion.div
            className="mt-6 space-y-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <DevCredit />
            <p className="text-center text-[11px] text-slate-700">
              PU-ALRMS &copy; 2026 Prime University. All rights reserved.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Google Sign-In Dialog                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog open={googleOpen} onOpenChange={setGoogleOpen}>
        <DialogContent
          className="sm:max-w-md rounded-2xl border-white/[0.08]"
          style={{ background: '#0f1219', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg text-slate-100">
              <Globe className="w-5 h-5 text-blue-400" />
              Sign in with Google
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Enter your Google account details to sign in or create a new account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="google-name" className="text-xs text-slate-400">Full Name</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="google-name"
                  placeholder="Your Google account name"
                  value={googleForm.name}
                  onChange={(e) => setGoogleForm({ ...googleForm, name: e.target.value })}
                  className="pl-9 h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="google-email" className="text-xs text-slate-400">Gmail Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="google-email"
                  type="email"
                  placeholder="you@gmail.com"
                  value={googleForm.email}
                  onChange={(e) => setGoogleForm({ ...googleForm, email: e.target.value })}
                  className="pl-9 h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Account Role</Label>
              <Select value={googleForm.role} onValueChange={(role) => setGoogleForm({ ...googleForm, role })}>
                <SelectTrigger className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#0f1219]">
                  <SelectItem value="STUDENT" className="text-slate-300">Student</SelectItem>
                  <SelectItem value="TEACHER" className="text-slate-300">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-300/70">
                New account will be created automatically if your email is not registered yet.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setGoogleOpen(false)}
                className="flex-1 h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGoogleAuth}
                disabled={googleLoading || !googleForm.name || !googleForm.email}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-0"
                style={{ boxShadow: '0 4px 16px rgba(59,130,246,0.2)' }}
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
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
        <DialogContent
          className="sm:max-w-md rounded-2xl border-white/[0.08]"
          style={{ background: '#0f1219', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg text-slate-100">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Quick Access Login
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Get instant access with a temporary email. No password needed!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="temp-name" className="text-xs text-slate-400">Your Name (optional)</Label>
              <Input
                id="temp-name"
                placeholder="Enter your name or leave blank"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="h-11 rounded-xl bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)' }}>
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300/70">
                A random temporary email will be generated for you. You&apos;ll be logged in as a Student instantly.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setTempEmailOpen(false)}
                className="flex-1 h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTempEmailAuth}
                disabled={tempLoading}
                className="flex-1 h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white border-0"
                style={{ boxShadow: '0 4px 16px rgba(251,191,36,0.2)' }}
              >
                {tempLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
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

export default AuthPage;
