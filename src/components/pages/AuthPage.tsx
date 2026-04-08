'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app';
import { authApi } from '@/lib/api';
import {
  GraduationCap, BookOpen, Mail, Lock, Unlock, Eye, Globe,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 p-4 relative">
      <FloatingParticles />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            <GraduationCap className="w-8 h-8" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prime University</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Assignment &amp; Lab Report Management System</p>
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
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => toast.info('Google OAuth coming soon!')}
                  >
                    <Globe className="w-4 h-4" /> Sign in with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => toast.info('Temporary email login coming soon!')}
                  >
                    <Mail className="w-4 h-4" /> Temp Email
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
    </div>
  );
}

export default AuthPage;
