'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export function ConfettiParticles({ show }: { show: boolean }) {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5, dur: 1 + Math.random(),
    color: ['#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4'][i % 5],
  })), []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute w-2 h-2 rounded-full" style={{ left: `${p.x}%`, top: '-10px', backgroundColor: p.color }}
          initial={{ y: 0, opacity: 1 }} animate={{ y: '100vh', opacity: 0, rotate: 720 }} transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }} />
      ))}
    </div>
  );
}

export function TimerCircle({ timeLeft, maxTime, size = 48 }: { timeLeft: number; maxTime: number; size?: number }) {
  const pct = (timeLeft / maxTime) * 100;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const low = timeLeft <= 3;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth={4} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" className={low ? 'stroke-rose-500' : 'stroke-emerald-500'} strokeWidth={4} strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: off }} transition={{ duration: 0.3 }} />
      </svg>
      <span className={`absolute text-sm font-bold ${low ? 'text-rose-500' : 'text-foreground'}`}>{timeLeft}</span>
    </div>
  );
}

const diffColors = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

export { diffColors };
