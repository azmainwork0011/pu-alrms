'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock, Trophy, Zap, ChevronRight, ChevronLeft,
  GraduationCap, Lightbulb, BarChart3,
  Star, Loader2, Target,
  BookOpen, CheckCircle2, XCircle,
  Flame, Heart, Volume2, VolumeX,
  Crown, ArrowRight, RotateCcw, History,
  Brain, Cpu, CircuitBoard, TrendingUp,
  Award, Lock, SkipForward, Timer,
} from 'lucide-react';
import {
  playCorrectAnswer, playWrongAnswer, playTimerWarning,
  playHeartLost, playGameOver, playWinFanfare, playPerfectScore,
  playStreakFire, playXPGain, playButtonPress, playSlideTransition,
  playQuestionReveal, playKBCIntro, playOptionSelect,
} from '@/lib/quiz-sounds';

// ─── Types ───────────────────────────────────────────────────────────
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
  questionType: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string | null;
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

interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  batch?: string;
  department?: string;
  bestScore: number;
  bestAccuracy: number;
  fastestTime: number;
  totalQuizzes: number;
}

interface AttemptEntry {
  id: string;
  categoryName: string;
  score: number;
  totalPoints: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
  createdAt: string;
}

// ─── Subjects ────────────────────────────────────────────────────────
const SUBJECTS = [
  {
    id: 'CS',
    name: 'Computer Science',
    icon: Cpu,
    color: 'from-emerald-500 to-teal-600',
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    desc: 'Programming, Data Structures, Algorithms, OS, DBMS',
    emoji: '💻',
  },
  {
    id: 'EE',
    name: 'Electrical Engineering',
    icon: CircuitBoard,
    color: 'from-amber-500 to-orange-600',
    accent: 'bg-amber-500',
    accentText: 'text-amber-600',
    accentBg: 'bg-amber-50',
    accentBorder: 'border-amber-200',
    desc: 'Circuits, Electronics, Power Systems, Signals',
    emoji: '⚡',
  },
  {
    id: 'BA',
    name: 'Business Administration',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-600',
    accent: 'bg-violet-500',
    accentText: 'text-violet-600',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-200',
    desc: 'Management, Accounting, Marketing, Economics',
    emoji: '📊',
  },
];

const QUIZ_COUNTS = [5, 10, 15];
const TIME_PER_QUESTION = 20; // seconds

// ─── Helper functions ────────────────────────────────────────────────
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getGrade(accuracy: number) {
  if (accuracy >= 95) return { label: 'S+', stars: 5, color: 'text-amber-500', msg: 'Perfect!', bg: 'bg-gradient-to-r from-amber-400 to-yellow-300' };
  if (accuracy >= 80) return { label: 'A', stars: 4, color: 'text-emerald-500', msg: 'Excellent!', bg: 'bg-gradient-to-r from-emerald-400 to-green-300' };
  if (accuracy >= 60) return { label: 'B', stars: 3, color: 'text-blue-500', msg: 'Well done!', bg: 'bg-gradient-to-r from-blue-400 to-cyan-300' };
  if (accuracy >= 40) return { label: 'C', stars: 2, color: 'text-orange-500', msg: 'Keep practicing!', bg: 'bg-gradient-to-r from-orange-400 to-amber-300' };
  return { label: 'D', stars: 1, color: 'text-red-500', msg: 'Try again!', bg: 'bg-gradient-to-r from-red-400 to-rose-300' };
}

function getCorrectFeedback(streak: number): string {
  if (streak >= 7) return 'Legendary! 🔥';
  if (streak >= 5) return 'Unstoppable! 💥';
  if (streak >= 3) return 'On fire! 🔥';
  const msgs = ['Correct!', 'Brilliant!', 'Nailed it!', 'Spot on!', 'Perfect!', 'Outstanding!'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function getWrongFeedback(): string {
  const msgs = ['Not quite...', 'Oops!', 'Try harder next time!', 'Almost!', 'Not this time...'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Confetti Component ──────────────────────────────────────────────
const CONFETTI_COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function ConfettiExplosion({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 80,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.3,
    rotation: Math.random() * 360,
    size: Math.random() * 8 + 4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: '30%', backgroundColor: p.color, rotate: p.rotation, width: p.size, height: p.size * 0.6 }}
          initial={{ y: 0, opacity: 1, scale: 0 }}
          animate={{ y: 400 + Math.random() * 200, opacity: 0, scale: 1, rotate: p.rotation + 720 }}
          transition={{ duration: 1.5 + Math.random(), delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── Animated XP Counter ─────────────────────────────────────────────
function useAnimatedCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
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
      setCount(target === 0 ? 0 : Math.round(startVal + (eased * (target - startVal))));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

// ─── Hearts Display ──────────────────────────────────────────────────
function HeartsDisplay({ hearts, maxHearts, shake }: { hearts: number; maxHearts: number; shake: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxHearts }, (_, i) => (
        <motion.div
          key={i}
          animate={shake && i >= hearts ? { x: [0, -4, 4, -2, 2, 0], opacity: [1, 0.3, 0.3, 0.3, 0.3, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-300 ${
              i < hearts ? 'text-red-500 fill-red-500' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main QuizPage Component ────────────────────────────────────────
export default function QuizPage() {
  const { user, token } = useAppStore();

  // Screen state machine
  const [screen, setScreen] = useState<'subject-select' | 'category-select' | 'difficulty-select' | 'playing' | 'feedback' | 'results' | 'leaderboard' | 'history'>('subject-select');

  // Subject & category
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [selectedCount, setSelectedCount] = useState(10);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillAnswer, setFillAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(0);

  // Scoring
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  // Hearts
  const [hearts, setHearts] = useState(5);
  const [maxHearts] = useState(5);

  // UI state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHeartsLost, setShowHeartsLost] = useState(false);
  const [showStreakFire, setShowStreakFire] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [lastXPGain, setLastXPGain] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [profile, setProfile] = useState<QuizProfile>({
    totalXP: 0, dailyStreak: 0, bestStreak: 0, totalQuizzes: 0, totalCorrect: 0, totalQuestions: 0, lastQuizDate: null,
  });

  // Leaderboard & history
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [leaderboardDept, setLeaderboardDept] = useState('CS');

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef<Array<{ questionId: string; selectedOption: string; timeSpent: number }>>([]);
  const currentQRef = useRef(0);
  const startTimeRef = useRef(0);
  const heartsRef = useRef(5);
  const soundRef = useRef(true);
  const streakRef = useRef(0);
  const comboRef = useRef(0);
  const correctCountRef = useRef(0);

  useEffect(() => { heartsRef.current = hearts; }, [hearts]);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);

  const playSound = useCallback((fn: () => void) => { if (soundEnabled) fn(); }, [soundEnabled]);

  // ─── Fetch Profile ──────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/quiz/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProfile(data.profile); }
    } catch { /* silent */ }
  }, [token]);

  const updateProfile = useCallback(async (xpGained: number, correct: number, total: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/quiz/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ xpGained, correctCount: correct, totalQuestions: total }),
      });
      if (res.ok) { const data = await res.json(); setProfile(data.profile); }
    } catch { /* silent */ }
  }, [token]);

  // Load profile on mount
  useEffect(() => {
    const load = async () => { await fetchProfile(); };
    load();
  }, [fetchProfile]);

  // ─── Fetch Categories ──────────────────────────────────────────
  const fetchCategories = useCallback(async (subjectId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/categories?department=${subjectId}`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setScreen('category-select');
        playSound(playButtonPress);
      }
    } catch { toast.error('Failed to load categories'); }
    setLoading(false);
  }, [playSound]);

  // ─── Start Quiz ────────────────────────────────────────────────
  const startQuiz = useCallback(async (category: QuizCategory, count: number) => {
    setSelectedCategory(category);
    setSelectedCount(count);
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/questions?categoryId=${encodeURIComponent(category.id)}&count=${count}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setCurrentQ(0);
          setScore(0);
          setCorrectCount(0);
          setXp(0);
          setStreak(0);
          setBestStreak(0);
          setCombo(0);
          setHearts(5);
          setSelectedOption(null);
          setFillAnswer('');
          setIsAnswered(false);
          setIsCorrect(false);
          setTimeLeft(TIME_PER_QUESTION);
          setStartTime(Date.now());
          setShowConfetti(false);
          setShowHeartsLost(false);
          setShowStreakFire(false);
          setLastXPGain(0);
          answersRef.current = [];
          currentQRef.current = 0;
          startTimeRef.current = Date.now();
          heartsRef.current = 5;
          streakRef.current = 0;
          comboRef.current = 0;
          correctCountRef.current = 0;
          setScreen('playing');
          playSound(playKBCIntro);
          setTimeout(() => playSound(playQuestionReveal), 400);
        } else {
          toast.error('No questions available for this category');
        }
      }
    } catch { toast.error('Failed to start quiz'); }
    setLoading(false);
  }, [playSound, token]);

  // ─── Finish Quiz (game over / all done) ───────────────────────
  const finishQuizDirect = useCallback(async () => {
    setLoading(true);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const finalAnswers = answersRef.current;

    try {
      const res = await fetch('/api/quiz/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'submit', categoryId: selectedCategory?.id, answers: finalAnswers, timeTaken }),
      });

      let finalCorrect = correctCountRef.current;
      let totalQ = finalAnswers.length;
      if (res.ok) {
        const data = await res.json();
        setResult(data.attempt);
        finalCorrect = data.attempt.correctCount;
        totalQ = data.attempt.totalQuestions;
        setCorrectCount(finalCorrect);
        setScore(data.attempt.score);
      } else {
        const accuracy = totalQ > 0 ? Math.round((finalCorrect / totalQ) * 100) : 0;
        setResult({
          id: 'client', score: score, totalPoints: totalQ * 10,
          correctCount: finalCorrect, totalQuestions: totalQ, accuracy, timeTaken,
        });
      }

      setScreen('results');
      const acc = totalQ > 0 ? (finalCorrect / totalQ) * 100 : 0;
      if (acc === 100) playSound(playPerfectScore);
      else if (acc >= 70) playSound(playWinFanfare);
      else playSound(playGameOver);

      updateProfile(xp, finalCorrect, totalQ);
    } catch { toast.error('Failed to submit quiz'); }
    setLoading(false);
  }, [selectedCategory, token, playSound, score, xp, updateProfile]);

  const finishQuiz = useCallback(async () => {
    finishQuizDirect();
  }, [finishQuizDirect]);

  // ─── Submit Answer ─────────────────────────────────────────────
  const submitAnswer = useCallback((answer: string) => {
    if (isAnswered || !questions[currentQ]) return;
    setSelectedOption(answer);
    setIsAnswered(true);
    playSound(playOptionSelect);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }

    const q = questions[currentQ];
    const timeSpent = TIME_PER_QUESTION - timeLeft;
    const correct = answer.toLowerCase().trim() === q.correctOption.toLowerCase().trim();

    answersRef.current = [...answersRef.current, { questionId: q.id, selectedOption: answer, timeSpent }];

    setIsCorrect(correct);

    if (correct) {
      const newStreak = streakRef.current + 1;
      const newCombo = comboRef.current + 1;
      const comboMultiplier = Math.min(newCombo, 5);
      const timeBonus = Math.max(0, Math.floor(timeLeft * 0.5));
      const xpGain = 10 + timeBonus + (comboMultiplier > 1 ? comboMultiplier * 3 : 0);
      const pts = q.points + timeBonus;

      setStreak(newStreak);
      setCombo(newCombo);
      setBestStreak(prev => Math.max(prev, newStreak));
      setScore(prev => prev + pts);
      setCorrectCount(prev => prev + 1);
      setXp(prev => prev + xpGain);
      setLastXPGain(xpGain);
      setFeedbackMsg(getCorrectFeedback(newStreak));

      streakRef.current = newStreak;
      comboRef.current = newCombo;
      correctCountRef.current = correctCountRef.current + 1;

      if (newStreak >= 3) { setShowStreakFire(true); setTimeout(() => setShowStreakFire(false), 1500); }
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);

      setTimeout(() => playSound(playCorrectAnswer), 200);
      if (newStreak >= 3) setTimeout(() => playSound(playStreakFire), 400);
      if (newCombo >= 2) setTimeout(() => playSound(playXPGain), 300);
    } else {
      const newHearts = heartsRef.current - 1;
      setHearts(newHearts);
      heartsRef.current = newHearts;
      setStreak(0);
      setCombo(0);
      streakRef.current = 0;
      comboRef.current = 0;
      setShowHeartsLost(true);
      setFeedbackMsg(getWrongFeedback());
      setTimeout(() => setShowHeartsLost(false), 1500);

      setTimeout(() => playSound(playWrongAnswer), 200);
      setTimeout(() => playSound(playHeartLost), 400);
    }

    // Transition to feedback then next
    setTimeout(() => {
      if (!correct && heartsRef.current <= 0) {
        playSound(playGameOver);
        finishQuizDirect();
      } else {
        setScreen('feedback');
      }
    }, correct ? 1000 : 1500);
  }, [isAnswered, currentQ, questions, timeLeft, playSound, finishQuizDirect]);

  // ─── Timeout Handler ───────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    setIsCorrect(false);
    const newHearts = heartsRef.current - 1;
    setHearts(newHearts);
    heartsRef.current = newHearts;
    setStreak(0);
    setCombo(0);
    streakRef.current = 0;
    comboRef.current = 0;
    setShowHeartsLost(true);
    setFeedbackMsg("Time's up!");
    if (soundRef.current) playHeartLost();

    const qId = questions[currentQRef.current]?.id;
    answersRef.current = [...answersRef.current, { questionId: qId, selectedOption: 'TIMEOUT', timeSpent: TIME_PER_QUESTION }];

    setTimeout(() => {
      setShowHeartsLost(false);
      if (heartsRef.current <= 0) {
        if (soundRef.current) playGameOver();
        finishQuizDirect();
      } else {
        setScreen('feedback');
      }
    }, 1200);
  }, [currentQ, questions, finishQuizDirect]);

  // ─── Timer Effect ──────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing' || isAnswered) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
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
      tickRef.current = setInterval(() => { if (soundEnabled) playTimerWarning(); }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [screen, currentQ, isAnswered, timeLeft, soundEnabled, handleTimeout]);

  // ─── Next Question ─────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    playSound(playSlideTransition);
    if (currentQ >= questions.length - 1) {
      finishQuiz();
      return;
    }
    const next = currentQ + 1;
    setCurrentQ(next);
    currentQRef.current = next;
    setSelectedOption(null);
    setFillAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setTimeLeft(TIME_PER_QUESTION);
    setLastXPGain(0);
    setScreen('playing');
    setTimeout(() => playSound(playQuestionReveal), 200);
  }, [currentQ, questions.length, finishQuiz, playSound]);

  // ─── Fill-blank submit ─────────────────────────────────────────
  const submitFillBlank = useCallback(() => {
    if (!fillAnswer.trim()) return;
    submitAnswer(fillAnswer.trim());
  }, [fillAnswer, submitAnswer]);

  // ─── Fetch Leaderboard ─────────────────────────────────────────
  const fetchLeaderboard = useCallback(async (dept: string) => {
    setLeaderboardDept(dept);
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/leaderboard?department=${dept}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  // ─── Fetch Attempt History ─────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/attempts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [token]);

  // ─── Progress ──────────────────────────────────────────────────
  const progressPct = questions.length > 0 ? ((currentQ + (isAnswered ? 1 : 0)) / questions.length) * 100 : 0;
  const totalScore = result ? result.score : score;

  // Animated counters for results
  const animScore = useAnimatedCounter(screen === 'results' ? (result?.score || score) : 0, 1200);
  const animXP = useAnimatedCounter(screen === 'results' ? xp : 0, 1200);
  const animAccuracy = useAnimatedCounter(screen === 'results' && result ? Math.round(result.accuracy) : 0, 1200);
  const animTime = useAnimatedCounter(screen === 'results' && result ? result.timeTaken : 0, 1000);

  // ─── Animation Variants ────────────────────────────────────────
  const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
  const fadeRight = { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 } };
  const scaleIn = { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 } };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[calc(100vh-8rem)] relative overflow-hidden">
      <ConfettiExplosion active={showConfetti} />

      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 1: Subject Selection                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'subject-select' && (
          <motion.div key="subject-select" {...fadeUp} className="max-w-2xl mx-auto px-4 pt-4 pb-8">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 mb-3"
              >
                <GraduationCap className="w-8 h-8" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold">Quick Quiz</h1>
              <p className="text-muted-foreground text-sm mt-1">Choose a subject and test your knowledge</p>
            </div>

            {/* Subject Cards */}
            <div className="space-y-3 mb-6">
              {SUBJECTS.map((subject, i) => (
                <motion.button
                  key={subject.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedSubject(subject);
                    fetchCategories(subject.id);
                  }}
                  className="w-full text-left p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${subject.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                      <subject.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{subject.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {loading && selectedSubject?.id === subject.id ? (
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Stats & Navigation */}
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[
                  { icon: <Flame className="w-4 h-4" />, value: profile.dailyStreak, label: 'Streak', color: 'text-orange-500' },
                  { icon: <Zap className="w-4 h-4" />, value: profile.totalXP, label: 'Total XP', color: 'text-amber-500' },
                  { icon: <Trophy className="w-4 h-4" />, value: profile.totalQuizzes, label: 'Quizzes', color: 'text-emerald-500' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border">
                    <div className={stat.color}>{stat.icon}</div>
                    <div>
                      <p className="text-sm font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Tabs */}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { fetchLeaderboard('CS'); setScreen('leaderboard'); }}>
                <Trophy className="w-4 h-4 mr-2" /> Leaderboard
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { fetchHistory(); setScreen('history'); }}>
                <History className="w-4 h-4 mr-2" /> History
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 2: Category Selection                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'category-select' && selectedSubject && (
          <motion.div key="category-select" {...fadeRight} className="max-w-2xl mx-auto px-4 pt-4 pb-8">
            <button onClick={() => { setScreen('subject-select'); playSound(playButtonPress); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Subjects
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedSubject.color} flex items-center justify-center text-white`}>
                <selectedSubject.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedSubject.name}</h2>
                <p className="text-sm text-muted-foreground">{categories.length} categories available</p>
              </div>
            </div>

            {categories.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No categories found for this subject.</p>
                <p className="text-xs text-muted-foreground mb-4">Click below to seed questions.</p>
                <Button onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('/api/quiz/seed', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
                    if (res.ok) { toast.success('Questions seeded!'); fetchCategories(selectedSubject.id); }
                  } catch { toast.error('Failed to seed'); }
                  setLoading(false);
                }}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Seed Questions
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-all cursor-pointer group border-border/50" onClick={() => { setSelectedCategory(cat); setScreen('difficulty-select'); playSound(playButtonPress); }}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{cat.icon || '📚'}</span>
                            <div>
                              <h3 className="font-semibold text-sm">{cat.name}</h3>
                              <p className="text-xs text-muted-foreground">{cat.description || `${cat.questionCount || '?'} questions`}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{cat.difficulty}</Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 3: Difficulty / Count Selection                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'difficulty-select' && selectedSubject && selectedCategory && (
          <motion.div key="difficulty-select" {...scaleIn} className="max-w-md mx-auto px-4 pt-4 pb-8">
            <button onClick={() => { setScreen('category-select'); playSound(playButtonPress); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Categories
            </button>

            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">{selectedCategory.icon || '📚'}</span>
              <h2 className="text-xl font-bold">{selectedCategory.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose how many questions</p>
            </div>

            <div className="space-y-3">
              {QUIZ_COUNTS.map((count) => (
                <motion.div key={count} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex items-center justify-between text-left"
                    onClick={() => startQuiz(selectedCategory, count)}
                    disabled={loading}
                  >
                    <div>
                      <p className="font-semibold">{count} Questions</p>
                      <p className="text-xs text-muted-foreground">~{Math.ceil(count * TIME_PER_QUESTION / 60)} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {count === 5 && <Badge variant="secondary" className="text-[10px]">Quick</Badge>}
                      {count === 10 && <Badge className={`text-[10px] ${selectedSubject.accentText} ${selectedSubject.accentBg} border-transparent`}>Standard</Badge>}
                      {count === 15 && <Badge variant="secondary" className="text-[10px]">Marathon</Badge>}
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 4: Playing                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'playing' && questions[currentQ] && (
          <motion.div key={`playing-${currentQ}`} {...fadeRight} className="max-w-lg mx-auto px-4 pt-2 pb-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {currentQ + 1}/{questions.length}
                </span>
                {streak >= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-0.5 text-orange-500"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{streak}</span>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* XP Badge */}
                <div className="flex items-center gap-1 text-amber-500">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">{xp}</span>
                </div>

                {/* Sound Toggle */}
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Hearts */}
                <HeartsDisplay hearts={hearts} maxHearts={maxHearts} shake={showHeartsLost} />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={progressPct} className="h-2" />
            </div>

            {/* Timer Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-bold tabular-nums ${timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : 'text-foreground'}`}>
                    {timeLeft}s
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  +{Math.max(0, Math.floor(timeLeft * 0.5))} time bonus
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors duration-300 ${
                    timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'linear' }}
                />
              </div>
            </div>

            {/* Streak Fire Overlay */}
            <AnimatePresence>
              {showStreakFire && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center mb-3"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold shadow-lg">
                    <Flame className="w-4 h-4" /> {streak} Streak!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Card */}
            <Card className="mb-5 border-border/50 shadow-sm">
              <CardContent className="p-5">
                {/* Question Type Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {questions[currentQ].questionType === 'FILL_BLANK' ? '✏️ Fill in the Blank' : questions[currentQ].questionType === 'TRUE_FALSE' ? '✅ True or False' : '📝 Multiple Choice'}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {questions[currentQ].difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {questions[currentQ].points} pts
                  </Badge>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-semibold leading-relaxed mb-5">
                  {questions[currentQ].question}
                </h3>

                {/* Options / Input */}
                {questions[currentQ].questionType === 'FILL_BLANK' ? (
                  <div className="flex gap-2">
                    <Input
                      value={fillAnswer}
                      onChange={(e) => setFillAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitFillBlank()}
                      placeholder="Type your answer..."
                      className="flex-1"
                      disabled={isAnswered}
                      autoFocus
                    />
                    {!isAnswered && (
                      <Button onClick={submitFillBlank} disabled={!fillAnswer.trim()}>
                        Check
                      </Button>
                    )}
                  </div>
                ) : questions[currentQ].questionType === 'TRUE_FALSE' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((opt) => {
                      const isThis = selectedOption === opt;
                      const isCorrectOpt = questions[currentQ].correctOption.toLowerCase() === opt.toLowerCase();
                      let bgClass = 'bg-muted hover:bg-accent border-border/50';
                      if (isAnswered && isThis) {
                        bgClass = isCorrectOpt ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30' : 'bg-red-100 border-red-400 dark:bg-red-900/30';
                      } else if (isAnswered && isCorrectOpt) {
                        bgClass = 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30';
                      }

                      return (
                        <motion.button
                          key={opt}
                          whileHover={!isAnswered ? { scale: 1.02 } : {}}
                          whileTap={!isAnswered ? { scale: 0.98 } : {}}
                          onClick={() => !isAnswered && submitAnswer(opt)}
                          disabled={isAnswered}
                          className={`p-4 rounded-xl border-2 text-center font-semibold transition-all ${bgClass}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isAnswered && isThis && (isCorrectOpt ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />)}
                            {isAnswered && !isThis && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            <span className="text-base">{opt}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  /* MCQ Options */
                  <div className="space-y-2.5">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const optVal = questions[currentQ][`option${letter}` as keyof QuizQuestion] as string;
                      if (!optVal) return null;
                      const isThis = selectedOption === letter;
                      const isCorrectOpt = letter === questions[currentQ].correctOption;
                      let bgClass = 'bg-card hover:bg-accent/50 border-border/50';
                      if (isAnswered && isThis) {
                        bgClass = isCorrectOpt ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30' : 'bg-red-100 border-red-400 dark:bg-red-900/30';
                      } else if (isAnswered && isCorrectOpt) {
                        bgClass = 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30';
                      }

                      return (
                        <motion.button
                          key={letter}
                          whileHover={!isAnswered ? { x: 4 } : {}}
                          whileTap={!isAnswered ? { scale: 0.98 } : {}}
                          onClick={() => !isAnswered && submitAnswer(letter)}
                          disabled={isAnswered}
                          className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${bgClass}`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isAnswered && isThis
                              ? isCorrectOpt ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                              : 'bg-muted font-medium'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-sm font-medium flex-1">{optVal}</span>
                          {isAnswered && isThis && (isCorrectOpt ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />)}
                          {isAnswered && !isThis && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Display */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Score: <strong className="text-foreground">{score}</strong></span>
              <span>Combo: {combo > 1 ? <strong className="text-amber-500">x{Math.min(combo, 5)}</strong> : <span>-</span>}</span>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 5: Feedback                                          */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'feedback' && questions[currentQ] && (
          <motion.div key="feedback" {...scaleIn} className="max-w-lg mx-auto px-4 pt-4 pb-8">
            {/* Result Banner */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className={`text-center p-6 rounded-2xl mb-5 ${
                isCorrect
                  ? 'bg-emerald-50 border-2 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                  : 'bg-red-50 border-2 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                )}
              </motion.div>
              <h2 className={`text-xl font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {feedbackMsg}
              </h2>

              {/* XP Gained */}
              {isCorrect && lastXPGain > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2"
                >
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                    <Zap className="w-3 h-3 mr-1" /> +{lastXPGain} XP
                  </Badge>
                </motion.div>
              )}

              {/* Wrong - Show correct answer */}
              {!isCorrect && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3">
                  <p className="text-sm text-muted-foreground">Correct answer:</p>
                  {questions[currentQ].questionType === 'MCQ' && (
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {questions[currentQ].correctOption}: {questions[currentQ][`option${questions[currentQ].correctOption}` as keyof QuizQuestion]}
                    </p>
                  )}
                  {questions[currentQ].questionType !== 'MCQ' && (
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {questions[currentQ].correctOption}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Explanation */}
              {questions[currentQ].explanation && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto"
                >
                  {questions[currentQ].explanation}
                </motion.p>
              )}
            </motion.div>

            {/* Continue Button */}
            <Button
              onClick={nextQuestion}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {currentQ >= questions.length - 1 ? 'See Results' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 6: Results                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'results' && result && (
          <motion.div key="results" {...fadeUp} className="max-w-lg mx-auto px-4 pt-2 pb-8">
            {/* Grade Badge */}
            {(() => {
              const grade = getGrade(result.accuracy);
              return (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                  className="text-center mb-6"
                >
                  <div className={`inline-flex flex-col items-center justify-center w-24 h-24 rounded-full ${grade.bg} shadow-lg`}>
                    <span className="text-3xl font-black text-white">{grade.label}</span>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < grade.stars ? 'text-white fill-white' : 'text-white/30'}`} />
                      ))}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mt-3">{grade.msg}</h2>
                  <p className="text-sm text-muted-foreground">{selectedCategory?.name}</p>
                </motion.div>
              );
            })()}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Score', value: animScore, icon: <Trophy className="w-5 h-5" />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                { label: 'Accuracy', value: `${animAccuracy}%`, icon: <Target className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { label: 'XP Earned', value: animXP, icon: <Zap className="w-5 h-5" />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { label: 'Time', value: formatTime(animTime), icon: <Clock className="w-5 h-5" />, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`p-4 rounded-xl ${stat.bg} border`}
                >
                  <div className={`${stat.color} mb-1`}>{stat.icon}</div>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Detail Stats */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Correct Answers</span>
                    <span className="font-semibold text-emerald-600">{result.correctCount}/{result.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Best Streak</span>
                    <span className="font-semibold text-orange-500">{bestStreak} 🔥</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Time/Question</span>
                    <span className="font-semibold">{result.totalQuestions > 0 ? formatTime(Math.round(result.timeTaken / result.totalQuestions)) : '0:00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <Button onClick={() => { setScreen('subject-select'); playSound(playButtonPress); }} className="w-full" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" /> Play Again
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="outline" onClick={() => { fetchLeaderboard(selectedSubject?.id || 'CS'); setScreen('leaderboard'); }}>
                  <Trophy className="w-4 h-4 mr-2" /> Leaderboard
                </Button>
                <Button variant="outline" onClick={() => { fetchHistory(); setScreen('history'); }}>
                  <History className="w-4 h-4 mr-2" /> History
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 7: Leaderboard                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'leaderboard' && (
          <motion.div key="leaderboard" {...fadeUp} className="max-w-2xl mx-auto px-4 pt-4 pb-8">
            <button onClick={() => { setScreen('subject-select'); playSound(playButtonPress); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Quiz
            </button>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
              </h2>
            </div>

            {/* Subject Tabs */}
            <Tabs value={leaderboardDept} onValueChange={(v) => fetchLeaderboard(v)}>
              <TabsList className="w-full grid grid-cols-3 mb-4">
                {SUBJECTS.map(s => (
                  <TabsTrigger key={s.id} value={s.id} className="text-xs">
                    {s.emoji} {s.id}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : leaderboard.length === 0 ? (
              <Card className="p-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No leaderboard data yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Complete a quiz to appear here!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center gap-3 mb-4 pt-2">
                    {/* 2nd place */}
                    <div className="text-center flex-1">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto mb-1 text-lg font-bold text-gray-600 dark:text-gray-300 overflow-hidden">
                        {leaderboard[1].avatar ? <img src={leaderboard[1].avatar} alt="" className="w-full h-full object-cover" /> : leaderboard[1].name?.[0]}
                      </div>
                      <p className="text-xs font-medium truncate max-w-[80px] mx-auto">{leaderboard[1].name?.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground">{leaderboard[1].bestScore} pts</p>
                      <div className="bg-gray-200 dark:bg-gray-700 h-16 rounded-t-lg mt-1 flex items-center justify-center">
                        <span className="text-lg font-black text-gray-500">2</span>
                      </div>
                    </div>
                    {/* 1st place */}
                    <div className="text-center flex-1">
                      <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Crown className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      </motion.div>
                      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 flex items-center justify-center mx-auto mb-1 text-lg font-bold text-amber-600 overflow-hidden">
                        {leaderboard[0].avatar ? <img src={leaderboard[0].avatar} alt="" className="w-full h-full object-cover" /> : leaderboard[0].name?.[0]}
                      </div>
                      <p className="text-xs font-semibold truncate max-w-[90px] mx-auto">{leaderboard[0].name?.split(' ')[0]}</p>
                      <p className="text-xs font-bold text-amber-600">{leaderboard[0].bestScore} pts</p>
                      <div className="bg-amber-100 dark:bg-amber-900/20 h-20 rounded-t-lg mt-1 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                        <span className="text-xl font-black text-amber-600">1</span>
                      </div>
                    </div>
                    {/* 3rd place */}
                    <div className="text-center flex-1">
                      <div className="w-11 h-11 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-1 text-lg font-bold text-orange-600 overflow-hidden">
                        {leaderboard[2].avatar ? <img src={leaderboard[2].avatar} alt="" className="w-full h-full object-cover" /> : leaderboard[2].name?.[0]}
                      </div>
                      <p className="text-xs font-medium truncate max-w-[80px] mx-auto">{leaderboard[2].name?.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground">{leaderboard[2].bestScore} pts</p>
                      <div className="bg-orange-100 dark:bg-orange-900/20 h-12 rounded-t-lg mt-1 flex items-center justify-center border border-orange-200 dark:border-orange-800">
                        <span className="text-lg font-black text-orange-600">3</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full list */}
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {leaderboard.map((entry, i) => {
                        const isCurrentUser = entry.userId === user?.id;
                        return (
                          <div
                            key={entry.userId}
                            className={`flex items-center gap-3 px-4 py-3 ${isCurrentUser ? 'bg-primary/5' : ''}`}
                          >
                            <span className={`w-6 text-center text-sm font-bold ${i < 3 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                              {entry.avatar ? <img src={entry.avatar} alt="" className="w-full h-full object-cover" /> : entry.name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{entry.name}{isCurrentUser ? ' (You)' : ''}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.department} • {entry.batch || 'N/A'}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold">{entry.bestScore}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.bestAccuracy.toFixed(0)}% acc</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SCREEN 8: Attempt History                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {screen === 'history' && (
          <motion.div key="history" {...fadeUp} className="max-w-2xl mx-auto px-4 pt-4 pb-8">
            <button onClick={() => { setScreen('subject-select'); playSound(playButtonPress); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Quiz
            </button>

            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <History className="w-5 h-5" /> Quiz History
            </h2>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 rounded-lg bg-muted/50 border text-center">
                <p className="text-lg font-bold">{profile.totalQuizzes}</p>
                <p className="text-[10px] text-muted-foreground">Total Quizzes</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border text-center">
                <p className="text-lg font-bold">{profile.totalCorrect}</p>
                <p className="text-[10px] text-muted-foreground">Correct Answers</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border text-center">
                <p className="text-lg font-bold">{profile.totalQuestions > 0 ? Math.round((profile.totalCorrect / profile.totalQuestions) * 100) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">Overall Accuracy</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : attempts.length === 0 ? (
              <Card className="p-8 text-center">
                <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No quiz attempts yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Complete a quiz to see your history!</p>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {attempts.map((attempt, i) => {
                  const grade = getGrade(attempt.accuracy);
                  return (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="hover:shadow-sm transition-all">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${grade.bg} flex items-center justify-center`}>
                                <span className="text-sm font-black text-white">{grade.label}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{attempt.categoryName || 'Quiz'}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(attempt.createdAt).toLocaleDateString()} • {formatTime(attempt.timeTaken)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{attempt.score} pts</p>
                              <p className="text-[10px] text-muted-foreground">
                                {attempt.correctCount}/{attempt.totalQuestions} ({attempt.accuracy.toFixed(0)}%)
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
