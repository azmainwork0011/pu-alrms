'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  getPasswordStrength, isValidEmail, FloatingParticles, DevCredit, Shield,
} from '@/components/pu-helpers';

function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginRole, setLoginRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const { setAuth } = useAppStore();

  // Google OAuth dialog state
  const [googleOpen, setGoogleOpen] = useState(false);
  const [googleForm, setGoogleForm] = useState({ name: '', email: '', role: 'STUDENT' });
  const [googleLoading, setGoogleLoading] = useState(false);

  // Temp email dialog state
  const [tempEmailOpen, setTempEmailOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempLoading, setTempLoading] = useState(false);

  const roleConfig = {
    STUDENT: { color: 'amber', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', placeholder: 'student@stu.pu.edu' },
    TEACHER: { color: 'emerald', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', placeholder: 'teacher@pu.edu' },
    ADMIN: { color: 'rose', gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', placeholder: 'admin@pu.edu' },
  };

  const currentRole = roleConfig[loginRole];
  const pwStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = activeTab === 'login'
        ? await authApi.login(formData.email, formData.password)
        : await authApi.register(formData);
      setAuth(result.user, result.token);
      toast.success(activeTab === 'login' ? 'Welcome back!' : 'Account created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
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
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Temp Email Handler ─────────────────────────────────
  const handleTempEmailAuth = async () => {
    setTempLoading(true);
    try {
      const result = await authApi.tempEmailAuth(tempName.trim() || undefined);
      setAuth(result.user, result.token);
      toast.success(`Welcome! Your temp email: ${result.tempEmail}`);
      setTempEmailOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Temp login failed');
    } finally {
      setTempLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Student', email: 'alice@stu.pu.edu', password: 'student123', icon: <GraduationCap className="w-5 h-5" />, role: 'STUDENT' as const, color: 'amber' },
    { label: 'Teacher', email: 'dr.smith@pu.edu', password: 'teacher123', icon: <BookOpen className="w-5 h-5" />, role: 'TEACHER' as const, color: 'emerald' },
    { label: 'Admin', email: 'admin@pu.edu', password: 'admin123', icon: <Shield className="w-5 h-5" />, role: 'ADMIN' as const, color: 'rose' },
  ];

  const quickLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuth(result.user, result.token);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-4 relative">
      <FloatingParticles />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PU-ALRMS</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Prime University &middot; Assignment &amp; Lab Report Management</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100/50 dark:shadow-none dark:bg-gray-900/80 dark:border dark:border-gray-800 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeTab === 'login' && (
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                {(['STUDENT', 'TEACHER', 'ADMIN'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                      loginRole === role
                        ? `bg-gradient-to-r ${roleConfig[role].gradient} text-white shadow-sm`
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setLoginRole(role)}
                  >
                    {role === 'STUDENT' ? '🎓 Student' : role === 'TEACHER' ? '👨‍🏫 Teacher' : '👨‍💼 Admin'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="dark:bg-gray-800 dark:border-gray-700" />
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={activeTab === 'login' ? currentRole.placeholder : 'you@pu.edu'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="pl-9 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-xs text-red-500">Please enter a valid email address</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="pl-9 pr-10 dark:bg-gray-800 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Unlock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {activeTab === 'register' && formData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Strength</span>
                      <span className={`text-xs font-medium ${pwStrength.score >= 4 ? 'text-emerald-600 dark:text-emerald-400' : pwStrength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>{pwStrength.label}</span>
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

              {activeTab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              <Button
                type="submit"
                className={`w-full bg-gradient-to-r ${currentRole.gradient} hover:opacity-90 text-white border-0 shadow-lg`}
                disabled={loading || (activeTab === 'register' && formData.email && !isValidEmail(formData.email))}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</span>
                ) : activeTab === 'login' ? `Sign In as ${loginRole.charAt(0) + loginRole.slice(1).toLowerCase()}` : 'Create Account'}
              </Button>
            </form>

            {activeTab === 'login' && (
              <>
                <div className="mt-4 flex gap-2">
                  {/* ─── Google Sign In Button ─────────── */}
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => setGoogleOpen(true)}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="truncate">Sign in with Google</span>
                  </Button>

                  {/* ─── Temp Email Button ────────────── */}
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => setTempEmailOpen(true)}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span className="truncate">Quick Access</span>
                  </Button>
                </div>

                <div className="mt-5">
                  <Separator className="my-4" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">Quick Demo Access</p>
                  <div className="grid grid-cols-3 gap-2">
                    {demoAccounts.map((acc) => (
                      <motion.div key={acc.email} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`w-full text-xs h-auto py-3 flex-col gap-1.5 ${acc.role === 'STUDENT' ? 'border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30' : acc.role === 'TEACHER' ? 'border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30' : 'border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30'}`}
                          onClick={() => quickLogin(acc.email, acc.password)}
                          disabled={loading}
                        >
                          {acc.icon}
                          <span className="font-medium">{acc.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 space-y-2">
          <DevCredit />
          <p className="text-center text-xs text-gray-400 dark:text-gray-600">PU-ALRMS &copy; 2024 Prime University. All rights reserved.</p>
        </div>
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

export default AuthPage;
