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
  { id: 'CSE', name: 'Computer Science', icon: <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-cyan-500 to-blue-600', accent: 'bg-cyan-500', desc: 'Coding, Data Structures, Algorithms' },
  { id: 'LLB', name: 'Law (LLB)', icon: <ScaleIcon className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-amber-500 to-orange-600', accent: 'bg-amber-500', desc: 'Law, Ethics, Constitution' },
  { id: 'EEE', name: 'Electrical Engineering', icon: <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8" />, color: 'from-emerald-500 to-teal-600', accent: 'bg-emerald-500', desc: 'Circuits, Electronics, Power Systems' },
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

// ─── Circular Timer ──────────────────────────────────────────────────────
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
      const res = await fetch(`/api/quiz/categories?department=${dept}`);
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
      const res = await fetch(`/api/quiz/questions?categoryId=${encodeURIComponent(category.id)}&count=10`);
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
          setScreen('playing');
          playSound(playKBCIntro);
        } else {
          toast.error('No questions available');
        }
      }
    } catch { toast.error('Failed to start quiz'); }
    setLoading(false);
  }, [playSound]);

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
    setExtraTimeUsed(true); // Mark as used so it can't be reused
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
    <div className="min-h-0 sm:min-h-[calc(100vh-8rem)] bg-gradient-to-b from-[#0a0e27] via-[#0f1538] to-[#060a1f] relative overflow-hidden">
      <StarField />
      <ConfettiExplosion active={showConfetti} />
      <XPParticles active={showXPPop} />

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DEPARTMENT SELECT                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'dept-select' && (
          <motion.div key="dept-select" {...fadeSlideUp} className="max-w-3xl mx-auto px-4 pt-6 sm:pt-8 pb-8">
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
                  className="relative text-left p-4 sm:p-5 rounded-2xl bg-[#141a3a]/80 backdrop-blur-sm border border-[#2a3060]/50 transition-all group hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] active:scale-[0.98]"
                >
                  <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center mb-2.5 sm:mb-3 text-white shadow-lg`}>
                    {dept.icon}
                  </div>
                  <h3 className="font-bold text-white text-base sm:text-lg mb-0.5">{dept.name}</h3>
                  <p className="text-[11px] sm:text-xs text-gray-400">{dept.desc}</p>
                  <ChevronRight className="w-5 h-5 text-gray-600 absolute top-4 right-4 sm:top-6 sm:right-5 opacity-0 group-hover:opacity-100 group-hover:text-amber-400 transition-all" />
                </motion.button>
              ))}
            </div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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
        {/* CATEGORY SELECT                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'category-select' && (
          <motion.div key="category-select" {...fadeSlideRight} className="max-w-3xl mx-auto px-4 pt-4 pb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
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

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No quiz categories for {selectedDept}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startQuiz(cat)}
                    className="group cursor-pointer p-4 sm:p-5 rounded-2xl bg-[#141a3a]/80 backdrop-blur-sm border border-[#2a3060]/50 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                      <Badge className={`${DIFF_STYLES[cat.difficulty]?.bg || 'bg-gray-800'} ${DIFF_STYLES[cat.difficulty]?.color || 'text-gray-400'} text-[10px] sm:text-[11px] border-0 font-semibold`}>
                        {DIFF_STYLES[cat.difficulty]?.label || cat.difficulty}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mb-1">{cat.name}</h3>
                    <p className="text-[11px] sm:text-xs text-gray-400 mb-3 sm:mb-4 line-clamp-2">{cat.description || 'Test your knowledge'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs text-gray-500 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {cat.questionCount} questions
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* QUIZ PLAYING                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'playing' && questions.length > 0 && (
          <motion.div key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="flex gap-4 lg:gap-6 max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-6 sm:pb-8">
              <PrizeLadder currentQ={currentQ} totalQ={questions.length} />

              {/* Main Quiz Area */}
              <div className="flex-1 max-w-2xl w-full">
                {/* ─── Top Stats Bar ──────────────────────────────── */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg bg-[#141a3a]/80 border border-[#2a3060]/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#3a4080] transition-colors shrink-0">
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* Streak + XP */}
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    {streak >= 2 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
                        <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
                        <span className="text-[10px] sm:text-xs font-black text-orange-400">{streak}</span>
                      </motion.div>
                    )}
                    <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                      <span className="text-[10px] sm:text-xs font-black text-amber-400">{xp}</span>
                    </div>
                  </div>

                  {/* Hearts */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <AnimatePresence>
                      {Array.from({ length: maxHearts }).map((_, i) => (
                        <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}>
                          {i < hearts ? (
                            <motion.div animate={showHeartsLost && i === hearts ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : {}}>
                              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                            </motion.div>
                          ) : (
                            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ─── Progress Bar ───────────────────────────────── */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                    <span className="text-[11px] sm:text-xs font-bold text-gray-400">
                      {currentQ + 1} / {questions.length}
                    </span>
                    {combo >= 2 && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[10px] sm:text-xs font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                        x{Math.min(combo, 5)} COMBO
                      </motion.span>
                    )}
                  </div>
                  <div className="w-full h-2.5 sm:h-3 bg-[#1a2040] rounded-full overflow-hidden border border-[#2a3060]/50">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* ─── Mascot + Timer ─────────────────────────────── */}
                <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                  <KBCOwl mood={mascotMood} size="sm" />
                  <CircularTimer timeLeft={timeLeft} />
                </div>

                {/* ─── Question Card ──────────────────────────────── */}
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
                    <div className="bg-[#141a3a]/80 backdrop-blur-sm rounded-2xl border border-[#2a3060]/50 p-4 sm:p-6 mb-3 sm:mb-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                        <Badge className={`${DIFF_STYLES[questions[currentQ].difficulty]?.bg || 'bg-gray-800'} ${DIFF_STYLES[questions[currentQ].difficulty]?.color || 'text-gray-400'} text-[10px] sm:text-[11px] border-0 font-semibold`}>
                          {DIFF_STYLES[questions[currentQ].difficulty]?.label || questions[currentQ].difficulty}
                        </Badge>
                        <Badge className="bg-amber-500/10 text-amber-400 text-[10px] sm:text-[11px] border border-amber-500/30 font-semibold">
                          {PRIZES[currentQ] || `${questions[currentQ].points} pts`}
                        </Badge>
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-white leading-relaxed">
                        {questions[currentQ].question}
                      </h3>
                    </div>

                    {/* ─── Options ─────────────────────────────────── */}
                    <div className="space-y-2 sm:space-y-3">
                      {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((opt, i) => {
                        const letter = OPTIONS[i];
                        const isHidden = hiddenOptions.includes(letter);
                        const isSelected = selectedOption === letter;
                        const isTheCorrectOption = questions[currentQ].correctOption === letter;

                        let borderColor = 'border-[#2a3060]/50';
                        let bgColor = 'bg-[#141a3a]/80';
                        let icon = null;

                        if (isAnswered && isHidden) {
                          borderColor = 'border-gray-800/50';
                          bgColor = 'bg-[#0a0e20]/50';
                        } else if (isAnswered && isSelected && isCorrect) {
                          borderColor = 'border-green-400';
                          bgColor = 'bg-green-900/20';
                          icon = <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4 }}><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" /></motion.div>;
                        } else if (isAnswered && isSelected && !isCorrect) {
                          borderColor = 'border-red-500/70';
                          bgColor = 'bg-red-900/20';
                          icon = <motion.div animate={{ x: [0, -3, 3, 0] }} transition={{ duration: 0.3 }}><XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" /></motion.div>;
                        } else if (isAnswered && !isSelected && isTheCorrectOption && !isCorrect) {
                          borderColor = 'border-green-500/70';
                          bgColor = 'bg-green-900/20';
                          icon = <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />;
                        }

                        return (
                          <motion.button
                            key={opt}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: isHidden ? 0.2 : 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.3 }}
                            whileHover={!isAnswered && !isHidden ? { scale: 1.01, y: -1 } : {}}
                            whileTap={!isAnswered && !isHidden ? { scale: 0.98 } : {}}
                            onClick={() => { if (!isHidden && !isAnswered) submitAnswer(letter); }}
                            disabled={isAnswered || isHidden}
                            className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all backdrop-blur-sm min-h-[52px] sm:min-h-0 ${borderColor} ${bgColor} ${isHidden ? 'opacity-20 pointer-events-none' : ''} ${isAnswered && isSelected && isCorrect ? 'shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''} ${isAnswered && isSelected && !isCorrect ? 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''} ${!isAnswered && !isHidden ? 'cursor-pointer hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(255,215,0,0.08)] active:scale-[0.98]' : 'cursor-default'}`}
                          >
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 font-black text-xs sm:text-sm transition-all ${
                              isAnswered && isSelected && isCorrect
                                ? 'bg-green-500 text-white'
                                : isAnswered && isSelected && !isCorrect
                                  ? 'bg-red-500 text-white'
                                  : isAnswered && isTheCorrectOption && !isSelected
                                    ? 'bg-green-500 text-white'
                                    : 'bg-[#1a2040] text-gray-400 border border-[#2a3060]/50'
                            }`}>
                              {letter}
                            </div>
                            <span className={`flex-1 font-medium text-xs sm:text-sm ${
                              isAnswered && isSelected && isCorrect
                                ? 'text-green-300'
                                : isAnswered && isSelected && !isCorrect
                                  ? 'text-red-300'
                                  : isAnswered && isTheCorrectOption && !isSelected
                                    ? 'text-green-300'
                                    : 'text-gray-300'
                            }`}>
                              {isHidden ? '???' : questions[currentQ][opt]}
                            </span>
                            {icon}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* ─── Lifelines Row ───────────────────────────── */}
                    <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                      <Button size="sm" disabled={!fiftyFifty || isAnswered} onClick={useFiftyFifty}
                        className={`flex-1 h-11 sm:h-10 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold gap-1 sm:gap-1.5 border-2 transition-all ${
                          fiftyFifty && !isAnswered
                            ? 'bg-[#141a3a]/80 border-amber-500/30 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10'
                            : 'bg-[#0a0e20]/50 border-gray-800/50 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />50:50
                      </Button>
                      <Button size="sm" disabled={skipUsed} onClick={useSkip}
                        className={`flex-1 h-11 sm:h-10 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold gap-1 sm:gap-1.5 border-2 transition-all ${
                          !skipUsed
                            ? 'bg-[#141a3a]/80 border-amber-500/30 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10'
                            : 'bg-[#0a0e20]/50 border-gray-800/50 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Skip
                      </Button>
                      <Button size="sm" disabled={extraTimeUsed || isAnswered} onClick={useExtraTime}
                        className={`flex-1 h-11 sm:h-10 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold gap-1 sm:gap-1.5 border-2 transition-all ${
                          !extraTimeUsed && !isAnswered
                            ? 'bg-[#141a3a]/80 border-amber-500/30 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10'
                            : 'bg-[#0a0e20]/50 border-gray-800/50 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />+10s
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* FEEDBACK SCREEN (between questions)                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#0a0e27] via-[#0f1538] to-[#060a1f] p-4"
          >
            <StarField />
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3, damping: 8 }}
                  className={`inline-block px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl mb-3 sm:mb-4 ${
                    isCorrect
                      ? 'bg-green-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-black">
                    {isCorrect ? '✓ Correct!' : '✗ Wrong!'}
                  </span>
                </motion.div>

                <p className="text-base sm:text-lg font-bold text-white mb-1">{feedbackMsg}</p>

                {isCorrect && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                      <span className="text-xs sm:text-sm font-black text-amber-400">+{10 + Math.min(combo, 5) * 3} XP</span>
                    </div>
                    {combo >= 2 && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                        <span className="text-xs sm:text-sm font-black text-orange-400">{combo}x</span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {!isCorrect && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-1 mb-3 sm:mb-4">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 fill-red-400" />
                    <span className="text-xs sm:text-sm font-bold text-red-400">{hearts} hearts remaining</span>
                  </motion.div>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Button
                  onClick={nextQuestion}
                  className="w-full h-12 sm:h-14 rounded-2xl text-sm sm:text-base font-black border-0 transition-all active:translate-y-0.5 bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30"
                >
                  {currentQ >= questions.length - 1 ? 'See Results' : 'Continue'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* RESULTS SCREEN                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-8"
          >
            <ConfettiExplosion active={result.accuracy >= 70} />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}
              className="bg-[#141a3a]/80 backdrop-blur-sm rounded-2xl border border-[#2a3060]/50 overflow-hidden"
            >
              {/* Result header */}
              <div className={`relative p-5 sm:p-8 text-center ${
                result.accuracy >= 90 ? 'bg-gradient-to-b from-amber-900/40 to-transparent' :
                result.accuracy >= 70 ? 'bg-gradient-to-b from-green-900/30 to-transparent' :
                'bg-gradient-to-b from-red-900/30 to-transparent'
              }`}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2, damping: 10 }}>
                  <KBCOwl mood={result.accuracy >= 70 ? 'cheering' : 'sad'} />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-3 sm:mt-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.4, damping: 8 }}
                    className={`inline-block px-5 sm:px-6 py-1.5 sm:py-2 rounded-2xl text-black font-black text-2xl sm:text-3xl ${
                      result.accuracy >= 90 ? 'bg-amber-500 shadow-lg shadow-amber-500/30' :
                      result.accuracy >= 70 ? 'bg-green-500 shadow-lg shadow-green-500/30' :
                      'bg-red-500 shadow-lg shadow-red-500/30'
                    }`}
                  >
                    {getGrade(result.accuracy).label}
                  </motion.div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className={`text-base sm:text-lg font-bold mt-2 sm:mt-3 ${getGrade(result.accuracy).color}`}>
                  {getGrade(result.accuracy).msg}
                </motion.p>

                {/* Stars */}
                <div className="flex justify-center gap-0.5 sm:gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: -10, scale: 0 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.55 + i * 0.1, type: 'spring' }}>
                      <Star className={`w-6 h-6 sm:w-7 sm:h-7 ${i < getGrade(result.accuracy).stars ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
                    </motion.div>
                  ))}
                </div>

                <p className="text-[10px] sm:text-xs text-gray-500 mt-2">{selectedCategory?.name}</p>
              </div>

              {/* Stats grid */}
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { val: animScore, label: 'Score', color: 'text-green-400', bg: 'bg-green-900/20 border-green-500/20' },
                    { val: animXP, label: 'XP Earned', color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-500/20' },
                    { val: `${animAccuracy}%`, label: 'Accuracy', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-500/20' },
                    { val: animStreak, label: 'Best Streak', color: 'text-orange-400', bg: 'bg-orange-900/20 border-orange-500/20' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${item.bg} border text-center`}
                    >
                      <p className={`text-2xl sm:text-3xl font-black ${item.color}`}>{item.val}</p>
                      <p className={`text-[10px] sm:text-xs font-bold ${item.color.replace('400', '500/80')} uppercase tracking-wide mt-0.5`}>{item.label}</p>
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
                  <div className="flex flex-col items-center p-2 rounded-xl bg-orange-900/15 border border-orange-500/20">
                    <Flame className="w-4 h-4 text-orange-400 mb-0.5" />
                    <p className="text-sm sm:text-base font-black text-orange-400">{profile.dailyStreak}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold">Streak</p>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-amber-900/15 border border-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-400 mb-0.5" />
                    <p className="text-sm sm:text-base font-black text-amber-400">{profile.totalXP}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold">Total XP</p>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-green-900/15 border border-green-500/20">
                    <Trophy className="w-4 h-4 text-green-400 mb-0.5" />
                    <p className="text-sm sm:text-base font-black text-green-400">{profile.totalQuizzes}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold">Quizzes</p>
                  </div>
                </motion.div>

                {/* Extra stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-[#2a3060]/30"
                >
                  <span className="text-[11px] sm:text-xs text-gray-500">{result.correctCount} correct out of {result.totalQuestions}</span>
                  <span className="text-[11px] sm:text-xs text-gray-500">{result.timeTaken}s</span>
                </motion.div>

                {/* Perfect badge */}
                {result.accuracy === 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, type: 'spring' }}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-900/30 to-amber-900/10 border border-amber-500/30"
                  >
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <span className="text-xs sm:text-sm font-bold text-amber-300">Perfect Score! Outstanding!</span>
                    <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="flex gap-2 sm:gap-3 pt-1 sm:pt-2"
                >
                  <Button
                    variant="outline"
                    className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-sm border-2 border-[#2a3060]/50 text-gray-300 hover:border-[#3a4080] bg-[#141a3a]/80 hover:bg-[#1a2050]"
                    onClick={() => { setScreen('category-select'); setMascotMood('happy'); }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />Try Again
                  </Button>
                  <Button
                    className="flex-1 h-11 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-sm border-0 bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                    onClick={() => { setScreen('dept-select'); setMascotMood('cheering'); }}
                  >
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />New Topic
                  </Button>
                </motion.div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuizPage;
