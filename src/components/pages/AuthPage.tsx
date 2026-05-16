'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/app';
import { authApi } from '@/lib/api';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  UserPlus, AlertCircle, Loader2, ChevronLeft, Sparkles,
} from 'lucide-react';
import {
  getPasswordStrength, isValidEmail,
} from '@/components/pu-helpers';

// ─── Animated Background ──────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <motion.div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)' }}
        animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
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

// ─── Main Auth Page ───────────────────────────────────────
function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const { setAuth } = useAppStore();

  // Restore saved email & seed database
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('login-email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    } catch { /* ignore */ }
    fetch('/api/auth/seed', { method: 'POST' }).catch(() => {});
  }, []);

  const pwStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = mode === 'login'
        ? await authApi.login(formData.email, formData.password)
        : await authApi.register(formData);
      setAuth(result.user, result.token);
      try { localStorage.removeItem('login-email'); } catch { /* ignore */ }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(err)) {
        setError('Network error. Please check your internet connection.');
      } else if (msg.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (msg.includes('Email already registered')) {
        setError('This email is already registered. Try signing in instead.');
      } else if (msg.includes('Email and password are required')) {
        setError('Please enter both email and password.');
      } else {
        setError(msg || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await authApi.login('alice@stu.pu.edu', 'student123');
      setAuth(result.user, result.token);
      toast.success('Welcome to PU-ALRMS!');
    } catch (err: any) {
      setError('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
        >
          {/* ─── Logo & Branding ─────────────────────────── */}
          <motion.div
            className="text-center mb-8"
            variants={fadeUp}
            custom={0}
          >
            <div className="relative inline-flex items-center justify-center mb-5">
              <motion.div
                className="absolute w-28 h-28 rounded-3xl"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10"
                style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
              </motion.div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              PU-ALRMS
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Prime University Academic Management System
            </p>
          </motion.div>

          {/* ─── Auth Card ──────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl"
            style={{ boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4)' }}
          >
            {/* Top accent */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="p-6 sm:p-8">
              {/* Mode Tabs */}
              <div className="flex items-center justify-between mb-6">
                {mode === 'register' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white -ml-2"
                    onClick={() => setMode('login')}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.05] ml-auto">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${mode === 'login' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${mode === 'register' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* ─── Form ─────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name (Register only) */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Full Name</Label>
                        <div className="relative">
                          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-400">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </div>
                  {formData.email && !isValidEmail(formData.email) && (
                    <p className="text-[11px] text-red-400/80 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Please enter a valid email address
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-400">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="h-11 pl-10 pr-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength for register */}
                  {mode === 'register' && formData.password && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">Strength</span>
                        <span className={`text-[10px] font-semibold ${pwStrength.score >= 4 ? 'text-emerald-400' : pwStrength.score >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
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

                {/* Role Select (Register only) */}
                <AnimatePresence>
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5"
                    >
                      <Label className="text-xs font-medium text-gray-400">Role</Label>
                      <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                        <SelectTrigger className="h-11 rounded-xl text-sm border-white/[0.08] bg-white/[0.04] text-gray-300 focus:ring-emerald-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/[0.08] bg-gray-900">
                          <SelectItem value="STUDENT" className="text-gray-300 focus:bg-white/[0.06] focus:text-gray-100">Student</SelectItem>
                          <SelectItem value="TEACHER" className="text-gray-300 focus:bg-white/[0.06] focus:text-gray-100">Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot Password (Login only) */}
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
                      onClick={() => toast.info('Password reset coming soon.')}
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
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300/80 flex-1 leading-relaxed">{error}</p>
                      <button
                        type="button"
                        className="text-red-400/50 hover:text-red-300 transition-colors p-0.5"
                        onClick={() => setError(null)}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className={`
                    w-full h-12 rounded-xl text-sm font-semibold text-white border-0
                    transition-all duration-300 relative overflow-hidden
                    ${loading ? 'opacity-80 cursor-wait' : 'hover:shadow-lg active:scale-[0.98]'}
                  `}
                  style={{
                    background: loading ? undefined : 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)',
                    boxShadow: loading ? undefined : '0 4px 24px rgba(16,185,129,0.2)',
                  }}
                  disabled={loading || (mode === 'register' && formData.email && !isValidEmail(formData.email))}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : mode === 'login' ? (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Demo Access (Login only) */}
              {mode === 'login' && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="mt-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">or</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={quickDemoLogin}
                      disabled={loading}
                      className="flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 bg-white/[0.02] hover:bg-emerald-500/[0.04] transition-all duration-200 w-full text-gray-400 hover:text-emerald-300"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Try Demo</span>
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>

          {/* ─── Footer ──────────────────────────────────── */}
          <motion.div
            className="mt-6 text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-[10px] text-gray-600">
              Prime University &mdash; Academic Learning Resource Management System
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthPage;
