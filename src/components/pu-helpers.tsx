'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

// ─── Notification Sound (Web Audio API) ───────────────────
let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1);
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.2);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, ctx.currentTime);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio not available
  }
}

// ─── Password Strength ────────────────────────────────────
export function getPasswordStrength(password: string): { score: number; label: string; color: string; width: string } {
  if (!password) return { score: 0, label: '', color: '', width: '0%' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', width: '20%' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500', width: '40%' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', width: '60%' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500', width: '80%' };
  return { score, label: 'Very Strong', color: 'bg-emerald-600', width: '100%' };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Helpers ──────────────────────────────────────────────
export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    case 'TEACHER': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'CR': return 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300';
    case 'STUDENT': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function getTypeBadgeVariant(type: string) {
  return type === 'LAB_REPORT' ? 'default' as const : 'secondary' as const;
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'GRADED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'LATE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'CLOSED': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'ARCHIVED': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function safeFormat(date: Date, fmt: string): string {
  try {
    return format(date, fmt);
  } catch {
    return 'N/A';
  }
}

export function safeIsPast(date: Date): boolean {
  try {
    return isPast(date);
  } catch {
    return false;
  }
}

export function timeAgo(dateStr: string): string {
  try {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return safeFormat(new Date(dateStr), 'MMM d');
  } catch {
    return '';
  }
}

// ─── Animated Counter ─────────────────────────────────────
export function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || target === 0) return;
    hasAnimated.current = true;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

// ─── Dashboard Skeleton ──────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Page Transition Wrapper ──────────────────────────────
export function PageTransition({ children, keyProp }: { children: React.ReactNode; keyProp: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Floating Particles ──────────────────────────────────
export function FloatingParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400/20 dark:bg-emerald-400/10"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── DevCredit ────────────────────────────────────────────
export function DevCredit({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 ${className}`}>
      <span className="inline-flex items-center gap-1">
        Developed with <Heart className="w-3 h-3 text-rose-400" /> by
      </span>
      <span className="font-medium text-gray-500 dark:text-gray-400">Jain Azmain</span>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span className="text-gray-500 dark:text-gray-400">CSE 66 Batch</span>
    </div>
  );
}

// ─── Shield Icon ──────────────────────────────────────────
export function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
