'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock, Trophy, Zap, ChevronRight,
  GraduationCap, Lightbulb, BarChart3,
  RotateCcw, Star, Loader2,
  BookOpen, ArrowLeft, CheckCircle2, XCircle,
  Timer, SkipForward, BarChart2,
  Volume2, VolumeX,
  Flame, Heart,
  Crown, PartyPopper, Lock,
} from 'lucide-react';
import {
  playKBCIntro, playQuestionReveal, playOptionSelect, playLockKiyaJaye,
  playCorrectAnswer, playWrongAnswer, playTimerTick, playTimerWarning,
  playLifelineUsed, playHeartLost, playGameOver, playWinFanfare,
  playPerfectScore, playStreakFire, playXPGain, playButtonPress,
  playSlideTransition, playCountdownBeep,
} from '@/lib/quiz-sounds';

// ─── Types ───────────────────────────────────────────────────────────────
interface QuizCategory {
  id: string;
  name: string;
  department: string;
  icon: string;
  description?: string;
  difficulty: string;
  questionCount: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficulty: string;
  points: number;
}

interface QuizResult {
  id: string;
  score: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
}

interface QuizProfile {
  totalXP: number;
  dailyStreak: number;
  bestStreak: number;
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  lastQuizDate: string | null;
}

const OPTIONS = ['A', 'B', 'C', 'D'];

// ─── Prize Ladder (Indian Rupees) ───────────────────────────────────────
const PRIZES = [
  '₹1,000', '₹2,000', '₹5,000', '₹10,000',
  '₹20,000', '₹50,000', '₹1,00,000', '₹2,00,000',
  '₹5,00,000', '₹10,00,000', '₹50,00,000', '₹1,00,00,000',
  '₹5,00,00,000', '₹7,00,00,000',
];

const MILESTONE_INDICES = new Set([4, 9, 13]);

const DEPARTMENTS = [
  { id: 'ALL', name: 'All Topics', icon: <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-emerald-500 to-green-600', accent: 'bg-emerald-500', desc: 'Mix of all departments' },
  { id: 'CSE', name: 'Computer Science', icon: <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-cyan-500 to-blue-600', accent: 'bg-cyan-500', desc: 'Coding, Data Structures, Algorithms' },
  { id: 'LLB', name: 'Law (LLB)', icon: <ScaleIcon className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-amber-500 to-orange-600', accent: 'bg-amber-500', desc: 'Law, Ethics, Constitution' },
  { id: 'EEE', name: 'Electrical Engineering', icon: <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-teal-500 to-emerald-600', accent: 'bg-teal-500', desc: 'Circuits, Electronics, Power Systems' },
  { id: 'BBA', name: 'Business Administration', icon: <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-rose-500 to-pink-600', accent: 'bg-rose-500', desc: 'Management, Accounting, Mathematics' },
];

function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3v17.5"/><path d="M18 7l-6-4-6 4"/><path d="M6 21h12"/><path d="M3 21h3"/><path d="M18 21h3"/></svg>;
}

const DIFF_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  EASY: { color: 'text-green-400', bg: 'bg-green-900/40', label: 'Beginner' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-900/40', label: 'Intermediate' },
  HARD: { color: 'text-red-400', bg: 'bg-red-900/40', label: 'Advanced' },
};

// ─── Animated Star Particles Background ──────────────────────────────────
const STAR_PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 5,
}));

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STAR_PARTICLES.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Mascot Owl ─────────────────────────────────────────────────────────
function KBCOwl({ mood, size = 'lg' }: { mood: 'happy' | 'sad' | 'thinking' | 'cheering' | 'sleeping'; size?: 'sm' | 'lg' | 'xs' }) {
  const sizes = { lg: 'w-20 h-20 sm:w-24 sm:h-24', sm: 'w-12 h-12 sm:w-14 sm:h-14', xs: 'w-10 h-10 sm:w-12 sm:h-12' };
  const sizeClass = sizes[size] || sizes.lg;
  const eyeSize = size === 'lg' ? 'w-4 h-4' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-2 h-2';

  return (
    <motion.div
      animate={
        mood === 'cheering' ? { y: [0, -8, 0], rotate: [0, -5, 5, 0] } :
        mood === 'happy' ? { scale: [1, 1.05, 1] } :
        mood === 'sad' ? { rotate: [0, -3, 0] } :
        mood === 'thinking' ? { rotate: [0, 5, 0, -5, 0] } :
        { scale: [1, 0.98, 1] }
      }
      transition={{ duration: mood === 'cheering' ? 0.6 : 1, repeat: mood === 'cheering' ? Infinity : 0 }}
      className={`${sizeClass} relative select-none`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-indigo-700 rounded-full" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-[55%] bg-gradient-to-b from-blue-200 to-indigo-100 rounded-full" />
      {(['left', 'right'] as const).map(side => (
        <div key={side} className={`absolute top-[25%] ${side === 'left' ? 'left-[22%]' : 'right-[22%]'} flex items-center justify-center`}>
          <div className={`bg-white rounded-full p-[2px] ${size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-3 h-3'}`}>
            {mood === 'sleeping' ? (
              <div className="w-full h-0.5 bg-gray-400 rounded-full mt-[1px]" />
            ) : mood === 'sad' ? (
              <div className={`${eyeSize} bg-gray-800 rounded-full`} style={{ clipPath: 'ellipse(50% 30% at 50% 70%)' }} />
            ) : (
              <div className={`${eyeSize} bg-gray-800 rounded-full relative`}>
                <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full" />
              </div>
            )}
          </div>
        </div>
      ))}
      <div className={`absolute top-[42%] left-1/2 -translate-x-1/2 ${size === 'lg' ? 'w-5 h-3' : 'w-3 h-2'} bg-amber-500 rounded-b-full`} />
      <div className={`absolute top-[40%] -left-1 ${size === 'lg' ? 'w-5 h-8' : 'w-3 h-5'} bg-blue-600 rounded-l-full`} />
      <div className={`absolute top-[40%] -right-1 ${size === 'lg' ? 'w-5 h-8' : 'w-3 h-5'} bg-blue-600 rounded-r-full`} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
        <div className={`${size === 'lg' ? 'w-3 h-2' : 'w-2 h-1'} bg-amber-500 rounded-b-full`} />
        <div className={`${size === 'lg' ? 'w-3 h-2' : 'w-2 h-1'} bg-amber-500 rounded-b-full`} />
      </div>
      {mood === 'cheering' && (
        <motion.div initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute -top-3 left-1/2 -translate-x-1/2">
          <div className={`w-0 h-0 ${size === 'lg' ? 'border-l-[8px] border-r-[8px] border-b-[14px]' : 'border-l-[5px] border-r-[5px] border-b-[9px]'} border-l-transparent border-r-transparent border-b-amber-400`} />
          <div className={`absolute ${size === 'lg' ? '-top-1 -left-0.5' : '-top-0.5 -left-0'} w-2 h-2 bg-red-400 rounded-full`} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Confetti / Celebration Particles ───────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B35', '#22D3EE', '#A855F7', '#3B82F6', '#FBBF24'];
const CONFETTI_PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  x: 50 + (Math.random() - 0.5) * 60,
  color: CONFETTI_COLORS[Math.floor(Math.random() * 6)],
  delay: Math.random() * 0.3,
  rotation: Math.random() * 360,
  size: Math.random() * 6 + 4,
}));
const XP_PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: 40 + Math.random() * 20,
  delay: Math.random() * 0.3,
}));

function ConfettiExplosion({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {CONFETTI_PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: '40%', backgroundColor: p.color, rotate: p.rotation, width: p.size, height: p.size * 0.6 }}
          initial={{ y: 0, opacity: 1, scale: 0 }}
          animate={{ y: 300 + Math.random() * 200, opacity: 0, scale: 1, rotate: p.rotation + 720 }}
          transition={{ duration: 1.5 + Math.random(), delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function XPParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {XP_PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute text-yellow-400 font-black text-sm"
          style={{ left: `${p.x}%`, top: '60%' }}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -100 }}
          transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
        >
          +XP
        </motion.div>
      ))}
    </div>
  );
}

// ─── Circular Timer (kept for reference, now we use horizontal bar) ──────
function CircularTimer({ timeLeft, maxTime = 30 }: { timeLeft: number; maxTime?: number }) {
  const size = 48;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / maxTime;
  const offset = circumference * (1 - progress);

  const color = timeLeft <= 5 ? '#f87171' : timeLeft <= 10 ? '#fb923c' : '#fbbf24';
  const glowColor = timeLeft <= 5 ? 'rgba(248,113,113,0.4)' : 'transparent';

  return (
    <motion.div
      animate={timeLeft <= 5 && timeLeft > 0 ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.5, repeat: Infinity }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(42,48,96,0.5)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ filter: timeLeft <= 5 ? `drop-shadow(0 0 6px ${glowColor})` : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-black tabular-nums ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
          {timeLeft}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const startTime = Date.now();
    const startVal = count;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = target === 0 ? 0 : Math.round(startVal + (eased * (target - startVal)));
      setCount(val);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

// ─── Plain Functions ─────────────────────────────────────────────────────
function getCorrectFeedback(streakCount: number): string {
  if (streakCount >= 5) return 'Unstoppable! Incredible streak!';
  if (streakCount >= 3) return 'Amazing streak! Keep going!';
  const msgs = ['Correct!', 'Brilliant!', 'Nailed it!', 'Spot on!', 'Perfect!', 'Outstanding!'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function getWrongFeedback(): string {
  const msgs = ['Wrong answer...', 'Oops! Not quite...', 'Focus on the next one!', 'Almost!', 'Not this time...'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function getGrade(accuracy: number) {
  if (accuracy >= 90) return { label: 'S', stars: 5, color: 'text-amber-400', msg: 'Outstanding!' };
  if (accuracy >= 75) return { label: 'A', stars: 4, color: 'text-green-400', msg: 'Excellent!' };
  if (accuracy >= 60) return { label: 'B', stars: 3, color: 'text-blue-400', msg: 'Well done!' };
  if (accuracy >= 40) return { label: 'C', stars: 2, color: 'text-orange-400', msg: 'Keep practicing!' };
  return { label: 'D', stars: 1, color: 'text-red-400', msg: 'Try again!' };
}

// ─── Prize Ladder (Desktop only) ────────────────────────────────────────
function PrizeLadder({ currentQ, totalQ }: { currentQ: number; totalQ: number }) {
  return (
    <div className="hidden lg:block w-52 xl:w-56 shrink-0">
      <div className="bg-[#141a3a]/80 backdrop-blur-sm border border-[#2a3060]/50 rounded-2xl p-3 xl:p-4 sticky top-4">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 text-center">Prize Ladder</h3>
        <div className="space-y-0.5">
          {[...PRIZES].reverse().map((prize, revIdx) => {
            const idx = PRIZES.length - 1 - revIdx;
            const isCurrent = idx === currentQ && totalQ > 0;
            const isPassed = idx < currentQ;
            const isMilestone = MILESTONE_INDICES.has(idx);

            return (
              <motion.div
                key={idx}
                animate={isCurrent ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300'
                    : isPassed
                      ? 'bg-green-900/20 text-green-400/60'
                      : isMilestone
                        ? 'text-amber-400/80 bg-amber-900/10'
                        : 'text-gray-500 bg-white/[0.02]'
                }`}
              >
                <span className="w-5 text-left">{idx + 1}</span>
                <span className={`flex-1 text-right ${isCurrent ? 'text-amber-300 font-black' : ''}`}>{prize}</span>
                {isMilestone && !isCurrent && !isPassed && <Star className="w-3 h-3 text-amber-500/60 ml-1" />}
                {isCurrent && <Lock className="w-3 h-3 text-amber-400 ml-1" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Duolingo-style horizontal timer bar ────────────────────────────────
function DuoTimerBar({ timeLeft, maxTime = 30 }: { timeLeft: number; maxTime?: number }) {
  const pct = (timeLeft / maxTime) * 100;
  const isLow = timeLeft <= 5;
  const isWarning = timeLeft <= 10 && timeLeft > 5;

  return (
    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full transition-colors duration-300 ${
          isLow ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
        initial={{ width: '100%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'linear' }}
      />
    </div>
  );
}

// ─── XP Floating Text ───────────────────────────────────────────────────
function XPFloatingText({ amount, active }: { amount: number; active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -60, scale: 1.2 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="absolute -top-2 right-0 text-emerald-600 font-black text-base sm:text-lg pointer-events-none z-30"
    >
      +{amount} XP
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
function QuizPage() {
  const { user, token, setPage } = useAppStore();

  const [screen, setScreen] = useState<'dept-select' | 'category-select' | 'playing' | 'feedback' | 'results'>('dept-select');
  const [selectedDept, setSelectedDept] = useState('');
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOption: string }[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const [hearts, setHearts] = useState(5);
  const [maxHearts] = useState(5);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showHeartsLost, setShowHeartsLost] = useState(false);
  const [showStreakFire, setShowStreakFire] = useState(false);
  const [showXPPop, setShowXPPop] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'sad' | 'thinking' | 'cheering' | 'sleeping'>('happy');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [lastXPGain, setLastXPGain] = useState(0);

  const [fiftyFifty, setFiftyFifty] = useState(true);
  const [skipUsed, setSkipUsed] = useState(false);
  const [extraTimeUsed, setExtraTimeUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [result, setResult] = useState<QuizResult | null>(null);

  // ─── Profile (persistent streaks & XP) ────────────────────────────
  const [profile, setProfile] = useState<QuizProfile>({ totalXP: 0, dailyStreak: 0, bestStreak: 0, totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0, lastQuizDate: null });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const heartsRef = useRef(hearts);
  const answersRef = useRef(answers);
  const currentQRef = useRef(currentQ);
  const startTimeRef = useRef(startTime);
  const questionsRef = useRef(questions);
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    heartsRef.current = hearts;
    answersRef.current = answers;
    currentQRef.current = currentQ;
    startTimeRef.current = startTime;
    questionsRef.current = questions;
    soundEnabledRef.current = soundEnabled;
  });

  const playSound = useCallback((fn: () => void) => { if (soundEnabled) fn(); }, [soundEnabled]);

  // ─── Fetch Profile ──────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/quiz/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch { /* silent */ }
  }, [token]);

  // ─── Update Profile after quiz ──────────────────────────────────
  const updateProfile = useCallback(async (xpGained: number, correct: number, total: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/quiz/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ xpGained, correctCount: correct, totalQuestions: total }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch { /* silent */ }
  }, [token]);

  // Load profile on mount
  useEffect(() => {
    const load = async () => { await fetchProfile(); };
    load();
  }, [fetchProfile]);

  // ─── Fetch Categories ──────────────────────────────────────────────
  const fetchCategories = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const url = dept === 'ALL'
        ? '/api/quiz/categories'
        : `/api/quiz/categories?department=${dept}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setScreen('category-select');
        playSound(playButtonPress);
      }
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  }, [playSound]);

  // ─── Start Quiz ────────────────────────────────────────────────────
  const startQuiz = useCallback(async (category: QuizCategory) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/questions?categoryId=${encodeURIComponent(category.id)}&count=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setCurrentQ(0);
          setScore(0);
          setCorrectCount(0);
          setSelectedOption(null);
          setIsAnswered(false);
          setTimeLeft(30);
          setStartTime(Date.now());
          setAnswers([]);
          setFiftyFifty(true);
          setSkipUsed(false);
          setExtraTimeUsed(false);
          setHiddenOptions([]);
          setShowConfetti(false);
          setHearts(5);
          setXp(0);
          setStreak(0);
          setBestStreak(0);
          setCombo(0);
          setIsCorrect(false);
          setMascotMood('thinking');
          setLastXPGain(0);
          setScreen('playing');
          playSound(playKBCIntro);
        } else {
          toast.error('No questions available');
        }
      }
    } catch { toast.error('Failed to start quiz'); }
    setLoading(false);
  }, [playSound, token]);

  // ─── Direct finish (for game over) ────────────────────────────────
  const finishQuizDirect = useCallback(async (finalAnswers: { questionId: string; selectedOption: string }[], timeTaken: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'submit', categoryId: selectedCategory?.id, answers: finalAnswers, timeTaken }),
      });
      let finalCorrect = correctCount;
      let totalQ = finalAnswers.length;
      if (res.ok) {
        const data = await res.json();
        setResult(data.attempt);
        finalCorrect = data.attempt.correctCount;
        totalQ = data.attempt.totalQuestions;
        setCorrectCount(finalCorrect);
        setScore(data.attempt.score);
        setScreen('results');
        playSound(data.attempt.accuracy >= 70 ? playWinFanfare : playGameOver);
      } else {
        const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
        setResult({ id: 'client', score, totalPoints: totalQ * 10, correctCount, totalQuestions: totalQ, accuracy, timeTaken });
        setScreen('results');
        playSound(accuracy >= 70 ? playWinFanfare : playGameOver);
      }
      // Update profile with XP and stats
      updateProfile(xp, finalCorrect, totalQ);
    } catch { toast.error('Failed to submit quiz'); }
    setLoading(false);
  }, [selectedCategory, token, playSound, correctCount, score, xp, updateProfile]);

  // ─── Timeout handler ───────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    setIsCorrect(false);
    const newHearts = heartsRef.current - 1;
    setHearts(newHearts);
    setStreak(0);
    setCombo(0);
    setShowHeartsLost(true);
    setMascotMood('sad');
    setFeedbackMsg("Time's up! ⏰");
    if (soundEnabledRef.current) playHeartLost();
    const qId = questionsRef.current[currentQRef.current]?.id;
    setAnswers(prev => [...prev, { questionId: qId, selectedOption: 'TIMEOUT' }]);
    setTimeout(() => {
      setShowHeartsLost(false);
      if (newHearts <= 0) {
        if (soundEnabledRef.current) playGameOver();
        setMascotMood('sad');
        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalAnswers = [...answersRef.current, { questionId: qId, selectedOption: 'TIMEOUT' }];
        finishQuizDirect(finalAnswers, timeTaken);
      } else {
        setScreen('feedback');
      }
    }, 1500);
  }, [finishQuizDirect]);

  // ─── Timer Effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing' || isAnswered) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsAnswered(true);
          if (timerRef.current) clearInterval(timerRef.current);
          if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
          setTimeout(() => handleTimeout(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (timeLeft <= 5 && timeLeft > 0 && soundEnabled) {
      tickRef.current = setInterval(() => {
        if (timeLeft <= 5 && timeLeft > 0) playTimerWarning();
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [screen, currentQ, isAnswered, timeLeft, soundEnabled, handleTimeout]);

  // ─── Submit Answer ─────────────────────────────────────────────────
  const submitAnswer = useCallback((option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    playSound(playOptionSelect);
    if (timerRef.current) clearInterval(timerRef.current);
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setAnswers(prev => [...prev, { questionId: questions[currentQ].id, selectedOption: option }]);

    const correctAnswer = questions[currentQ].correctOption;
    const correct = option === correctAnswer;

    setTimeout(() => { playSound(playLockKiyaJaye); }, 300);

    setIsCorrect(correct);
    const newStreak = correct ? streak + 1 : 0;
    const newCombo = correct ? combo + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);
    setStreak(newStreak);
    setCombo(newCombo);
    setBestStreak(newBestStreak);

    if (correct) {
      const comboMultiplier = Math.min(newCombo, 5);
      const xpGain = 10 + (comboMultiplier > 1 ? comboMultiplier * 3 : 0);
      const pts = questions[currentQ].points;
      setScore(prev => prev + pts);
      setCorrectCount(prev => prev + 1);
      setXp(prev => prev + xpGain);
      setLastXPGain(xpGain);
      setMascotMood('cheering');
      setShowConfetti(true);
      setShowXPPop(true);
      setShowStreakFire(newStreak >= 3);
      setFeedbackMsg(getCorrectFeedback(newStreak));
      setTimeout(() => { setShowConfetti(false); setShowXPPop(false); setShowStreakFire(false); }, 2000);
      playSound(playCorrectAnswer);
      setTimeout(() => { if (newStreak >= 3) playSound(playStreakFire); }, 400);
      setTimeout(() => { if (newCombo >= 2) playSound(playXPGain); }, 200);
    } else {
      const newHearts = hearts - 1;
      setHearts(newHearts);
      setShowHeartsLost(true);
      setMascotMood('sad');
      setFeedbackMsg(getWrongFeedback());
      setTimeout(() => setShowHeartsLost(false), 1500);
      playSound(playWrongAnswer);
      setTimeout(() => { playSound(playHeartLost); }, 200);
    }

    setTimeout(() => {
      if (correct) {
        setScreen('feedback');
      } else {
        const h = hearts - 1;
        if (h <= 0) {
          playSound(playGameOver);
          const timeTaken = Math.round((Date.now() - startTime) / 1000);
          finishQuizDirect([...answers, { questionId: questions[currentQ].id, selectedOption: option }], timeTaken);
        } else {
          setScreen('feedback');
        }
      }
    }, correct ? 1200 : 1800);
  }, [isAnswered, currentQ, questions, soundEnabled, streak, combo, bestStreak, hearts, answers, startTime, playSound, finishQuizDirect]);

  // ─── Finish Quiz (normal) ─────────────────────────────────────────
  const finishQuiz = useCallback(async () => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const finalAnswers = answers.length === questions.length
      ? answers
      : [...answers, { questionId: questions[currentQ]?.id, selectedOption: selectedOption || 'SKIP' }];

    setLoading(true);
    try {
      const res = await fetch('/api/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'submit', categoryId: selectedCategory?.id, answers: finalAnswers, timeTaken }),
      });
      let finalCorrect = correctCount;
      let totalQ = finalAnswers.length;
      if (res.ok) {
        const data = await res.json();
        setResult(data.attempt);
        finalCorrect = data.attempt.correctCount;
        totalQ = data.attempt.totalQuestions;
        setCorrectCount(finalCorrect);
        setScore(data.attempt.score);
        setScreen('results');
        const isPerfect = data.attempt.accuracy === 100;
        if (isPerfect) {
          playSound(playPerfectScore);
          setMascotMood('cheering');
        } else if (data.attempt.accuracy >= 70) {
          playSound(playWinFanfare);
          setMascotMood('happy');
        } else {
          playSound(playGameOver);
          setMascotMood('sad');
        }
      } else {
        const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
        const clientResult: QuizResult = { id: 'client', score, totalPoints: totalQ * 10, correctCount, totalQuestions: totalQ, accuracy, timeTaken };
        setResult(clientResult);
        setScreen('results');
        playSound(accuracy >= 70 ? playWinFanfare : playGameOver);
        setMascotMood(accuracy >= 70 ? 'happy' : 'sad');
      }
      // Update profile with XP and stats
      updateProfile(xp, finalCorrect, totalQ);
    } catch { toast.error('Failed to submit quiz'); }
    setLoading(false);
  }, [answers, questions, currentQ, selectedOption, selectedCategory, startTime, token, playSound, correctCount, score, xp, updateProfile]);

  // ─── Next Question ─────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    playSound(playSlideTransition);
    if (currentQ >= questions.length - 1) {
      finishQuiz();
      return;
    }
    setScreen('playing');
    setCurrentQ((prev) => prev + 1);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setHiddenOptions([]);
    setIsCorrect(false);
    setMascotMood('thinking');
    setLastXPGain(0);
    setTimeout(() => { playSound(playQuestionReveal); }, 200);
  }, [currentQ, questions.length, finishQuiz, playSound]);

  // ─── Lifelines ─────────────────────────────────────────────────────
  const useFiftyFifty = useCallback(() => {
    if (!fiftyFifty || isAnswered) return;
    setFiftyFifty(false);
    playSound(playLifelineUsed);
    const allOpts = ['A', 'B', 'C', 'D'].filter(o => o !== selectedOption);
    const toHide = allOpts.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  }, [fiftyFifty, isAnswered, selectedOption, playSound]);

  const useSkip = useCallback(() => {
    if (skipUsed) return;
    setSkipUsed(true);
    playSound(playLifelineUsed);
    nextQuestion();
  }, [skipUsed, nextQuestion, playSound]);

  const useExtraTime = useCallback(() => {
    if (extraTimeUsed || isAnswered) return;
    setExtraTimeUsed(true);
    playSound(playLifelineUsed);
    setTimeLeft(prev => prev + 10);
  }, [extraTimeUsed, isAnswered, playSound]);

  const progressPct = questions.length > 0 ? ((currentQ + (isAnswered ? 1 : 0)) / questions.length) * 100 : 0;

  // Animated counters for results
  const animScore = useAnimatedCounter(screen === 'results' && result ? result.score : 0, 1200);
  const animXP = useAnimatedCounter(screen === 'results' ? xp : 0, 1200);
  const animAccuracy = useAnimatedCounter(screen === 'results' && result ? result.accuracy : 0, 1200);
  const animStreak = useAnimatedCounter(screen === 'results' ? bestStreak : 0, 800);

  // ─── Animation Variants ────────────────────────────────────────────
  const fadeSlideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const fadeSlideRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-0 sm:min-h-[calc(100vh-8rem)] relative overflow-hidden">
      {/* Background: dark for dept/cat select, light for playing/feedback */}
      {(screen === 'playing' || screen === 'feedback') ? null : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#0f1538] to-[#060a1f]" />
          <StarField />
        </>
      )}

      <ConfettiExplosion active={showConfetti} />
      <XPParticles active={showXPPop} />

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DEPARTMENT SELECT (dark theme - entry screen)              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'dept-select' && (
          <motion.div key="dept-select" {...fadeSlideUp} className="relative z-10 max-w-3xl mx-auto px-4 pt-6 sm:pt-8 pb-8">
            <div className="text-center mb-6 sm:mb-8">
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1, damping: 10 }}>
                <KBCOwl mood="cheering" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-3 sm:mt-4 mb-1">
                Quick Quiz
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-400 text-xs sm:text-sm">
                Choose a department and test your knowledge
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {DEPARTMENTS.map((dept, i) => (
                <motion.button
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
                  onClick={() => { setSelectedDept(dept.id); fetchCategories(dept.id); }}
                  className={`relative text-left p-4 sm:p-5 rounded-2xl bg-[#141a3a]/80 backdrop-blur-sm border transition-all group active:scale-[0.98] ${
                    dept.id === 'ALL'
                      ? 'border-emerald-500/40 hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'border-[#2a3060]/50 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(255,215,0,0.1)]'
                  }`}
                >
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center mb-2.5 sm:mb-3 text-white shadow-lg`}>
                    {dept.icon}
                  </div>
                  <h3 className="font-bold text-white text-base sm:text-lg mb-0.5">{dept.name}</h3>
                  <p className="text-[11px] sm:text-xs text-gray-400">{dept.desc}</p>
                  <ChevronRight className={`w-5 h-5 absolute top-4 right-4 sm:top-6 sm:right-5 opacity-0 group-hover:opacity-100 transition-all ${
                    dept.id === 'ALL' ? 'text-emerald-400' : 'text-amber-400'
                  }`} style={{ color: '' }} />
                </motion.button>
              ))}
            </div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3"
            >
              {[
                { icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Daily Streak', value: String(profile.dailyStreak), color: 'text-orange-400' },
                { icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Total XP', value: String(profile.totalXP), color: 'text-amber-400' },
                { icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />, label: 'Quizzes', value: String(profile.totalQuizzes), color: 'text-green-400' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#141a3a]/80 backdrop-blur-sm border border-[#2a3060]/50">
                  <div className={`${stat.color}`}>{stat.icon}</div>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-black text-white">{stat.value}</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CATEGORY SELECT (light theme with dark header)              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'category-select' && (
          <motion.div key="category-select" {...fadeSlideRight} className="relative z-10">
            {/* Dark header */}
            <div className="bg-gradient-to-b from-[#0a0e27] to-[#0f1538] px-4 pt-4 pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-2 max-w-3xl mx-auto">
                <Button variant="ghost" size="icon" onClick={() => setScreen('dept-select')} className="h-11 w-11 text-gray-400 hover:text-white hover:bg-[#1e2550] rounded-xl">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-white truncate">Choose a Topic</h2>
                  <p className="text-xs sm:text-sm text-gray-400">{DEPARTMENTS.find(d => d.id === selectedDept)?.name}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-11 w-11 text-gray-400 hover:text-white hover:bg-[#1e2550] rounded-xl" onClick={() => setSoundEnabled(!soundEnabled)}>
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Light body */}
            <div className="bg-gray-50 min-h-[calc(100vh-12rem)] px-4 pb-8">
              {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : categories.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No quiz categories for this selection</p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {categories.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startQuiz(cat)}
                      className="group cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all overflow-hidden active:scale-[0.98]"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                          <Badge className={`text-[10px] sm:text-[11px] border-0 font-semibold ${
                            cat.difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                            cat.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {DIFF_STYLES[cat.difficulty]?.label || cat.difficulty}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{cat.name}</h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4 line-clamp-2">{cat.description || 'Test your knowledge'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {cat.questionCount} questions
                          </span>
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                            <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* QUIZ PLAYING (Duolingo light theme)                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'playing' && questions.length > 0 && (
          <motion.div key="playing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative z-10 bg-gray-50 min-h-0 sm:min-h-[calc(100vh-8rem)]">
            {/* ─── Top progress bar (full width, emerald) ─── */}
            <div className="w-full h-3 bg-gray-200">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            <div className="flex gap-4 lg:gap-6 max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-6 sm:pb-8">
              <PrizeLadder currentQ={currentQ} totalQ={questions.length} />

              {/* Main Quiz Area */}
              <div className="flex-1 max-w-2xl w-full">
                {/* ─── Top Stats Bar ──────────────────────────────── */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-1.5 sm:gap-2">
                  <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors shrink-0 shadow-sm">
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* XP counter with floating animation */}
                  <div className="relative">
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-black text-amber-600">{xp}</span>
                    </div>
                    <XPFloatingText amount={lastXPGain} active={showXPPop && lastXPGain > 0} />
                  </div>

                  {/* Streak */}
                  {streak >= 2 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-black text-orange-600">{streak}</span>
                    </motion.div>
                  )}

                  {/* Hearts */}
                  <div className="flex items-center gap-0 sm:gap-0.5 sm:gap-1">
                    <AnimatePresence>
                      {Array.from({ length: maxHearts }).map((_, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}>
                          {i < hearts ? (
                            <motion.div animate={showHeartsLost && i === hearts ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] } : {}}>
                              <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-500 fill-red-500" />
                            </motion.div>
                          ) : (
                            <Heart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-300" />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ─── Question counter ────────────────────────────── */}
                <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                  <span className="text-xs font-bold text-gray-500">
                    Question {currentQ + 1} of {questions.length}
                  </span>
                  {combo >= 2 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      x{Math.min(combo, 5)} COMBO
                    </motion.span>
                  )}
                </div>

                {/* ─── Duolingo Timer Bar ──────────────────────────── */}
                <div className="mb-4 sm:mb-5">
                  <DuoTimerBar timeLeft={timeLeft} maxTime={30} />
                </div>

                {/* ─── Question Card (white, Duolingo-style) ──────── */}
                <AnimatePresence mode="wait">
                  <motion.div key={currentQ}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{
                      opacity: 1, x: 0,
                      ...(isAnswered && selectedOption && !isCorrect ? { x: [0, -8, 8, -5, 5, 0] } : {}),
                    }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={
                      isAnswered && selectedOption && !isCorrect
                        ? { x: { duration: 0.4, ease: 'easeInOut' }, opacity: { duration: 0.25 }, default: { duration: 0.25 } }
                        : { duration: 0.25 }
                    }
                  >
                    {/* Question */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-5">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                        <Badge className={`text-[10px] sm:text-[11px] border-0 font-semibold ${
                          questions[currentQ].difficulty === 'EASY' ? 'bg-emerald-100 text-emerald-700' :
                          questions[currentQ].difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {DIFF_STYLES[questions[currentQ].difficulty]?.label || questions[currentQ].difficulty}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-600 text-[10px] sm:text-[11px] border-0 font-semibold truncate max-w-[110px] sm:max-w-none">
                          {PRIZES[currentQ] || `${questions[currentQ].points} pts`}
                        </Badge>
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-relaxed break-words">
                        {questions[currentQ].question}
                      </h3>
                    </div>

                    {/* ─── Options (Duolingo-style: big, rounded, letter prefix) ─── */}
                    <div className="space-y-2.5 sm:space-y-3">
                      {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((opt, i) => {
                        const letter = OPTIONS[i];
                        const isHidden = hiddenOptions.includes(letter);
                        const isSelected = selectedOption === letter;
                        const isTheCorrectOption = questions[currentQ].correctOption === letter;

                        // Duolingo-style button classes
                        let btnClasses = 'bg-white border-gray-200 text-gray-800 hover:border-emerald-400 hover:shadow-sm';
                        let letterClasses = 'bg-gray-100 text-gray-600 border border-gray-200';
                        let icon = null;

                        if (isAnswered && isHidden) {
                          btnClasses = 'bg-gray-50 border-gray-100 text-gray-300 opacity-50';
                          letterClasses = 'bg-gray-100 text-gray-400 border border-gray-100';
                        } else if (isAnswered && isSelected && isCorrect) {
                          btnClasses = 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30';
                          letterClasses = 'bg-white text-emerald-600 border border-white/30';
                          icon = <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15, damping: 8 }}><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></motion.div>;
                        } else if (isAnswered && isSelected && !isCorrect) {
                          btnClasses = 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30';
                          letterClasses = 'bg-white text-red-600 border border-white/30';
                          icon = <motion.div animate={{ x: [0, -3, 3, 0] }} transition={{ duration: 0.3 }}><XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></motion.div>;
                        } else if (isAnswered && isTheCorrectOption && !isSelected && !isCorrect) {
                          btnClasses = 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm';
                          letterClasses = 'bg-emerald-500 text-white border border-emerald-500';
                          icon = <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
                        }

                        return (
                          <motion.button
                            key={opt}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: isHidden ? 0.3 : 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.3 }}
                            whileHover={!isAnswered && !isHidden ? { scale: 1.01, y: -1 } : {}}
                            whileTap={!isAnswered && !isHidden ? { scale: 0.98 } : {}}
                            onClick={() => { if (!isHidden && !isAnswered) submitAnswer(letter); }}
                            disabled={isAnswered || isHidden}
                            className={`w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all min-h-[56px] sm:min-h-[60px] ${btnClasses} ${
                              isHidden ? 'pointer-events-none' : ''
                            } ${!isAnswered && !isHidden ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                          >
                            {/* Letter prefix circle */}
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm sm:text-base transition-all ${letterClasses}`}>
                              {letter}
                            </div>
                            <span className="flex-1 font-medium text-sm sm:text-base min-w-0 break-words">
                              {isHidden ? '???' : questions[currentQ][opt]}
                            </span>
                            {icon}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* ─── Lifelines Row (Duolingo-styled) ─────────── */}
                    <div className="flex gap-2 sm:gap-2.5 mt-4 sm:mt-5">
                      <Button size="sm" disabled={!fiftyFifty || isAnswered} onClick={useFiftyFifty}
                        className={`flex-1 h-12 sm:h-11 rounded-2xl text-[11px] sm:text-xs font-bold gap-1.5 sm:gap-1.5 border-2 transition-all shadow-sm ${
                          fiftyFifty && !isAnswered
                            ? 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                            : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />50:50
                      </Button>
                      <Button size="sm" disabled={skipUsed} onClick={useSkip}
                        className={`flex-1 h-12 sm:h-11 rounded-2xl text-[11px] sm:text-xs font-bold gap-1.5 sm:gap-1.5 border-2 transition-all shadow-sm ${
                          !skipUsed
                            ? 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                            : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <SkipForward className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />Skip
                      </Button>
                      <Button size="sm" disabled={extraTimeUsed || isAnswered} onClick={useExtraTime}
                        className={`flex-1 h-12 sm:h-11 rounded-2xl text-[11px] sm:text-xs font-bold gap-1.5 sm:gap-1.5 border-2 transition-all shadow-sm ${
                          !extraTimeUsed && !isAnswered
                            ? 'bg-white border-gray-200 text-gray-700 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'
                            : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <Timer className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />+10s
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FEEDBACK SCREEN (Duolingo popup between questions)          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 p-4"
          >
            <ConfettiExplosion active={isCorrect && showConfetti} />

            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="text-center max-w-xs sm:max-w-sm w-full"
            >
              <motion.div
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 10, delay: 0.1 }}
              >
                <KBCOwl mood={isCorrect ? 'cheering' : 'sad'} size="sm" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-4 sm:mt-6">
                {/* Duolingo-style feedback banner */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3, damping: 8 }}
                  className={`inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl mb-3 sm:mb-4 shadow-lg ${
                    isCorrect
                      ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                      : 'bg-red-500 text-white shadow-red-500/30'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                  <span className="text-lg sm:text-xl font-black">
                    {isCorrect ? 'Correct!' : 'Wrong!'}
                  </span>
                </motion.div>

                <p className="text-base sm:text-lg font-bold text-gray-800 mb-1 break-words">{feedbackMsg}</p>

                {isCorrect && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs sm:text-sm font-black text-amber-600">+{10 + Math.min(combo, 5) * 3} XP</span>
                    </div>
                    {combo >= 2 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-xs sm:text-sm font-black text-orange-600">{combo}x streak</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {!isCorrect && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-1.5 mb-3 sm:mb-4">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    <span className="text-xs sm:text-sm font-bold text-gray-500">{hearts} {hearts === 1 ? 'heart' : 'hearts'} remaining</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Duolingo-style continue button */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Button
                  onClick={nextQuestion}
                  className="w-full h-12 sm:h-14 rounded-2xl text-sm sm:text-base font-black border-0 transition-all active:translate-y-0.5 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                >
                  {currentQ >= questions.length - 1 ? 'See Results' : 'Continue'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* RESULTS SCREEN (Duolingo-style)                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 bg-gray-50 min-h-0 sm:min-h-[calc(100vh-8rem)]"
          >
            <ConfettiExplosion active={result.accuracy >= 70} />

            <div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Result header with big grade circle */}
                <div className={`relative p-5 sm:p-8 text-center ${
                  result.accuracy >= 90 ? 'bg-gradient-to-b from-amber-50 to-white' :
                  result.accuracy >= 70 ? 'bg-gradient-to-b from-emerald-50 to-white' :
                  'bg-gradient-to-b from-red-50 to-white'
                }`}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2, damping: 10 }}>
                    <KBCOwl mood={result.accuracy >= 70 ? 'cheering' : 'sad'} />
                  </motion.div>

                  {/* Duolingo-style big grade circle */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-3 sm:mt-4 flex justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.4, damping: 8 }}
                      className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-lg ${
                        result.accuracy >= 90 ? 'bg-amber-500 shadow-amber-500/30' :
                        result.accuracy >= 70 ? 'bg-emerald-500 shadow-emerald-500/30' :
                        result.accuracy >= 40 ? 'bg-blue-500 shadow-blue-500/30' :
                        'bg-red-500 shadow-red-500/30'
                      }`}
                    >
                      <span className="text-4xl sm:text-5xl font-black text-white">
                        {getGrade(result.accuracy).label}
                      </span>
                    </motion.div>
                  </motion.div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={`text-base sm:text-lg font-bold mt-2 sm:mt-3 ${
                    result.accuracy >= 90 ? 'text-amber-600' :
                    result.accuracy >= 70 ? 'text-emerald-600' :
                    result.accuracy >= 40 ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {getGrade(result.accuracy).msg}
                  </motion.p>

                  {/* Stars */}
                  <div className="flex justify-center gap-1 sm:gap-1.5 mt-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: -10, scale: 0 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.55 + i * 0.1, type: 'spring' }}>
                        <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${i < getGrade(result.accuracy).stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">{selectedCategory?.name}</p>
                </div>

                {/* Stats grid */}
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    {[
                      { val: animScore, label: 'Score', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                      { val: animXP, label: 'XP Earned', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                      { val: `${animAccuracy}%`, label: 'Accuracy', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                      { val: animStreak, label: 'Best Streak', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + i * 0.1 }}
                        className={`p-3 sm:p-4 rounded-2xl ${item.bg} border text-center`}
                      >
                        <p className={`text-2xl sm:text-3xl font-black ${item.color}`}>{item.val}</p>
                        <p className={`text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5`}>{item.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Your Profile Stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.05 }}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-orange-50 border border-orange-100">
                      <Flame className="w-4 h-4 text-orange-500 mb-0.5" />
                      <p className="text-sm sm:text-base font-black text-orange-600">{profile.dailyStreak}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">Streak</p>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                      <Zap className="w-4 h-4 text-amber-500 mb-0.5" />
                      <p className="text-sm sm:text-base font-black text-amber-600">{profile.totalXP}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">Total XP</p>
                    </div>
                    <div className="flex flex-col items-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <Trophy className="w-4 h-4 text-emerald-500 mb-0.5" />
                      <p className="text-sm sm:text-base font-black text-emerald-600">{profile.totalQuizzes}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">Quizzes</p>
                    </div>
                  </motion.div>

                  {/* Extra stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <span className="text-[11px] sm:text-xs text-gray-400">{result.correctCount} correct out of {result.totalQuestions}</span>
                    <span className="text-[11px] sm:text-xs text-gray-400">{result.timeTaken}s</span>
                  </motion.div>

                  {/* Perfect badge */}
                  {result.accuracy === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, type: 'spring' }}
                      className="flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
                    >
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span className="text-xs sm:text-sm font-bold text-amber-700">Perfect Score! Outstanding!</span>
                      <PartyPopper className="w-5 h-5 text-amber-500" />
                    </motion.div>
                  )}

                  {/* Action buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    className="flex gap-2.5 sm:gap-3 pt-1 sm:pt-2"
                  >
                    <Button
                      variant="outline"
                      className="flex-1 h-11 sm:h-12 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:border-gray-300 bg-white hover:bg-gray-50"
                      onClick={() => { setScreen('category-select'); setMascotMood('happy'); }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />Try Again
                    </Button>
                    <Button
                      className="flex-1 h-11 sm:h-12 rounded-2xl font-bold text-sm border-0 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                      onClick={() => { setScreen('dept-select'); setMascotMood('cheering'); }}
                    >
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />New Topic
                    </Button>
                  </motion.div>
                </CardContent>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuizPage;
