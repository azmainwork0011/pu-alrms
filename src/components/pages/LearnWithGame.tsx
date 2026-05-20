'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Swords, Gamepad2, Trophy, User,
  Star, Flame, Zap, Target, Clock, ChevronRight, ChevronLeft,
  X, Check, RotateCcw, ArrowUp, ArrowDown,
  Send, Award, Crown, Sparkles, Play,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AnimatedCounter } from '@/components/pu-helpers';
import { useAppStore } from '@/store/app';
import {
  GAME_CATALOG, LANGUAGES, LEVEL_THRESHOLDS, AVATARS,
  BUG_FINDER_CHALLENGES, CODE_PUZZLES, SYNTAX_MATCH_PAIRS,
  MEMORY_MATCH_CARDS, CODE_FILL_CHALLENGES, PATTERN_CHALLENGES,
  TYPING_SNIPPETS, SPEED_QUIZ_SETS, MOCK_LEADERBOARD,
  getTodayChallenge, getRandomQuestions, getLevelForXP, getNextLevel,
  shuffleArray, getLanguageById,
  type Question, type ProgrammingLanguage, type Topic, type Difficulty,
  type BugFinderData, type CodePuzzleData, type SyntaxMatchPair,
  type DailyChallenge, type GameCatalog as GameCatalogType,
  type MemoryMatchCard, type CodeFillChallenge, type PatternChallenge,
  type TypingSnippet, type SpeedQuizSet,
} from '@/lib/cq-data';

// ══════════════════════════════════════════════════════════════
// Types & Constants
// ══════════════════════════════════════════════════════════════

type View = 'home' | 'hub' | 'game' | 'leaderboard' | 'profile';
type GameId = GameCatalogType['id'];

interface UserProfile {
  name: string; avatar: string; xp: number; streak: number;
  battlesWon: number; questionsAnswered: number; correctAnswers: number; gamesPlayed: number;
}

const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const scaleIn = { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.92 } };
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const diffColors: Record<Difficulty, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const defaultProfile: UserProfile = {
  name: 'Player One', avatar: '🦊', xp: 450, streak: 7,
  battlesWon: 12, questionsAnswered: 85, correctAnswers: 62, gamesPlayed: 8,
};

const recentActivity = [
  { id: 'a1', text: 'Completed Python Control Flow quiz', xp: 45, time: '2h ago' },
  { id: 'a2', text: 'Won battle against CodeNinja', xp: 80, time: '5h ago' },
  { id: 'a3', text: 'Earned "Code Padawan" badge', xp: 100, time: '1d ago' },
  { id: 'a4', text: 'Played Bug Detective mini game', xp: 25, time: '1d ago' },
];

// ══════════════════════════════════════════════════════════════
// Sub-components
// ══════════════════════════════════════════════════════════════

function StatCard({ icon, label, value, color, suffix = '' }: { icon: React.ReactNode; label: string; value: number; color: string; suffix?: string }) {
  return (
    <motion.div {...fadeIn} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold"><AnimatedCounter target={value} />{suffix && <span className="text-sm text-gray-400 ml-1">{suffix}</span>}</div>
    </motion.div>
  );
}

function TimerCircle({ timeLeft, maxTime, size = 52 }: { timeLeft: number; maxTime: number; size?: number }) {
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
      <span className={`absolute text-base font-bold ${low ? 'text-rose-500' : 'text-foreground'}`}>{timeLeft}</span>
    </div>
  );
}

function QuestionOption({ option, index, selected, correct, revealed, onClick }: { option: string; index: number; selected: boolean; correct: boolean; revealed: boolean; onClick: () => void }) {
  const letter = String.fromCharCode(65 + index);
  let bg = 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20';
  if (revealed && selected && correct) bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300';
  if (revealed && selected && !correct) bg = 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-700 dark:text-rose-300';
  if (revealed && !selected && correct) bg = 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700';
  return (
    <motion.button whileHover={!revealed ? { scale: 1.01 } : {}} whileTap={!revealed ? { scale: 0.98 } : {}} onClick={onClick} disabled={revealed}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${bg} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}>
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${revealed && selected && correct ? 'bg-emerald-500 text-white' : revealed && selected && !correct ? 'bg-rose-500 text-white' : revealed && correct ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
        {revealed && selected && correct ? <Check className="w-3.5 h-3.5" /> : revealed && selected && !correct ? <X className="w-3.5 h-3.5" /> : letter}
      </span>
      <span className="text-sm font-medium flex-1">{option}</span>
    </motion.button>
  );
}

function ConfettiParticles({ show }: { show: boolean }) {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.5, dur: 1 + Math.random(), color: ['#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4'][i % 5],
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

function HPBar({ hp, maxHp, label, color }: { hp: number; maxHp: number; label: string; color: string }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold"><span>{label}</span><span>{hp}/{maxHp}</span></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full bg-gradient-to-r ${color}`} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

function GameCardComponent({ game, onClick }: { game: GameCatalogType; onClick: () => void }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow cursor-pointer h-full" onClick={onClick}>
        <div className="relative h-32 sm:h-40 bg-gray-100 dark:bg-gray-800">
          <Image src={game.image} alt={game.name} width={400} height={200} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <span className="text-2xl">{game.icon}</span>
            <div className="flex items-center gap-1">
              {game.isNew && <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>}
              <Badge className={`text-[10px] px-1.5 py-0 ${diffColors[game.difficulty]}`}>{game.difficulty}</Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-bold text-sm sm:text-base truncate">{game.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{game.description}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(game.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />)}</div>
              <span className="text-[10px] text-gray-400 ml-1">({game.playsCount.toLocaleString()})</span>
            </div>
            <Badge variant="secondary" className="text-[10px] px-2 py-0">+{game.xpReward} XP</Badge>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {game.tags.slice(0, 2).map(t => <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">{t}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GameHeader({ game, onBack, score, timer, maxTime }: { game: GameCatalogType; onBack: () => void; score?: number; timer?: number; maxTime?: number }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">{game.icon}</span>
        <h2 className="font-bold text-sm sm:text-base truncate">{game.name}</h2>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {score !== undefined && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Zap className="w-3 h-3 mr-1" />{score}</Badge>}
        {timer !== undefined && maxTime !== undefined && <TimerCircle timeLeft={timer} maxTime={maxTime} size={40} />}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function LearnWithGame() {
  const appUser = useAppStore(s => s.user);
  const [view, setView] = useState<View>('home');
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => ({ ...defaultProfile, name: appUser?.name || defaultProfile.name }));
  const [showConfetti, setShowConfetti] = useState(false);

  const addXP = useCallback((amount: number) => {
    setProfile(p => ({ ...p, xp: p.xp + amount }));
    if (amount >= 20) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2000); }
  }, []);

  const dailyChallenge = useMemo(() => getTodayChallenge(), []);

  const goHome = useCallback(() => { setView('home'); setActiveGameId(null); }, []);
  const openHub = useCallback(() => setView('hub'), []);
  const openGame = useCallback((id: GameId) => { setActiveGameId(id); setView('game'); }, []);

  const activeGame = useMemo(() => GAME_CATALOG.find(g => g.id === activeGameId), [activeGameId]);

  // ── Shared Game State ──
  const [gameTimer, setGameTimer] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  useEffect(() => {
    if (view !== 'game' || gameOver || gameTimer <= 0) return;
    const t = setTimeout(() => setGameTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [view, gameTimer, gameOver]);

  // ── Learn Quiz State ──
  const [learnStep, setLearnStep] = useState<'langs' | 'topics' | 'quiz' | 'results'>('langs');
  const [learnLang, setLearnLang] = useState<ProgrammingLanguage | null>(null);
  const [learnTopic, setLearnTopic] = useState<Topic | null>(null);
  const [learnQs, setLearnQs] = useState<Question[]>([]);
  const [learnQI, setLearnQI] = useState(0);
  const [learnAns, setLearnAns] = useState('');
  const [learnRev, setLearnRev] = useState(false);
  const [learnCorrect, setLearnCorrect] = useState(0);
  const [learnXP, setLearnXP] = useState(0);

  // ── Battle State ──
  const [battleLang, setBattleLang] = useState('');
  const [battleP1HP, setBattleP1HP] = useState(100);
  const [battleP2HP, setBattleP2HP] = useState(100);
  const [battleRound, setBattleRound] = useState(0);
  const [battleQs, setBattleQs] = useState<Question[]>([]);
  const [battleQ, setBattleQ] = useState<Question | null>(null);
  const [battleAns, setBattleAns] = useState('');
  const [battleRev, setBattleRev] = useState(false);
  const [battleEndMsg, setBattleEndMsg] = useState('');
  const [battleXP, setBattleXP] = useState(0);
  const [battleStep, setBattleStep] = useState<'select' | 'battle' | 'end'>('select');
  const [battleShake, setBattleShake] = useState(false);
  const [battleGlow, setBattleGlow] = useState<'player' | 'bot' | null>(null);

  // ── Bug Finder State ──
  const [bfChallenge, setBfChallenge] = useState<BugFinderData | null>(null);
  const [bfSelected, setBfSelected] = useState<number | null>(null);
  const [bfRevealed, setBfRevealed] = useState(false);

  // ── Code Puzzle State ──
  const [cpChallenge, setCpChallenge] = useState<CodePuzzleData | null>(null);
  const [cpOrder, setCpOrder] = useState<string[]>([]);
  const [cpRevealed, setCpRevealed] = useState(false);
  const [cpCorrect, setCpCorrect] = useState(false);

  // ── Syntax Match State ──
  const [smConcepts, setSmConcepts] = useState<{ id: string; concept: string; matched: boolean }[]>([]);
  const [smSyntaxes, setSmSyntaxes] = useState<{ id: string; syntax: string; matched: boolean }[]>([]);
  const [smPairs, setSmPairs] = useState<SyntaxMatchPair[]>([]);
  const [smSelected, setSmSelected] = useState<{ type: 'concept' | 'syntax'; id: string } | null>(null);
  const [smMatched, setSmMatched] = useState(0);
  const [smWrong, setSmWrong] = useState(false);

  // ── Memory Match State ──
  const [mmCards, setMmCards] = useState<{ id: string; pairId: string; display: string; flipped: boolean; matched: boolean }[]>([]);
  const [mmFlipped, setMmFlipped] = useState<string[]>([]);
  const [mmMoves, setMmMoves] = useState(0);
  const [mmChecking, setMmChecking] = useState(false);

  // ── Typing Race State ──
  const [tySnippet, setTySnippet] = useState<TypingSnippet | null>(null);
  const [tyInput, setTyInput] = useState('');
  const [tyStartTime, setTyStartTime] = useState<number | null>(null);
  const [tyFinished, setTyFinished] = useState(false);
  const tyInputRef = useRef<HTMLTextAreaElement>(null);

  // ── Speed Quiz State ──
  const [sqSet, setSqSet] = useState<SpeedQuizSet | null>(null);
  const [sqQI, setSqQI] = useState(0);
  const [sqTimer, setSqTimer] = useState(8);
  const [sqAns, setSqAns] = useState('');
  const [sqRev, setSqRev] = useState(false);
  const [sqScore, setSqScore] = useState(0);
  const [sqStreak, setSqStreak] = useState(0);
  const [sqEnded, setSqEnded] = useState(false);
  const [sqTotalCorrect, setSqTotalCorrect] = useState(0);

  // ── Output Predictor State ──
  const [opQs, setOpQs] = useState<Question[]>([]);
  const [opQI, setOpQI] = useState(0);
  const [opAns, setOpAns] = useState('');
  const [opRev, setOpRev] = useState(false);
  const [opCorrect, setOpCorrect] = useState(0);
  const [opEnded, setOpEnded] = useState(false);

  // ── Code Fill State ──
  const [cfChallenge, setCfChallenge] = useState<CodeFillChallenge | null>(null);
  const [cfAnswers, setCfAnswers] = useState<string[]>([]);
  const [cfRevealed, setCfRevealed] = useState(false);
  const [cfCorrectCount, setCfCorrectCount] = useState(0);

  // ── Pattern Master State ──
  const [patChallenges, setPatChallenges] = useState<PatternChallenge[]>([]);
  const [patQI, setPatQI] = useState(0);
  const [patAns, setPatAns] = useState<number | null>(null);
  const [patRev, setPatRev] = useState(false);
  const [patScore, setPatScore] = useState(0);
  const [patStreak, setPatStreak] = useState(0);
  const [patEnded, setPatEnded] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // Game Init Functions
  // ══════════════════════════════════════════════════════════════

  const resetGameState = useCallback(() => {
    setGameTimer(60); setGameOver(false); setGameScore(0);
    setBfChallenge(null); setBfSelected(null); setBfRevealed(false);
    setCpChallenge(null); setCpOrder([]); setCpRevealed(false); setCpCorrect(false);
    setSmConcepts([]); setSmSyntaxes([]); setSmPairs([]); setSmSelected(null); setSmMatched(0); setSmWrong(false);
    setMmCards([]); setMmFlipped([]); setMmMoves(0); setMmChecking(false);
    setTySnippet(null); setTyInput(''); setTyStartTime(null); setTyFinished(false);
    setSqSet(null); setSqQI(0); setSqTimer(8); setSqAns(''); setSqRev(false); setSqScore(0); setSqStreak(0); setSqEnded(false); setSqTotalCorrect(0);
    setOpQs([]); setOpQI(0); setOpAns(''); setOpRev(false); setOpCorrect(0); setOpEnded(false);
    setCfChallenge(null); setCfAnswers([]); setCfRevealed(false); setCfCorrectCount(0);
    setPatChallenges([]); setPatQI(0); setPatAns(null); setPatRev(false); setPatScore(0); setPatStreak(0); setPatEnded(false);
  }, []);

  const startGame = useCallback((id: GameId) => {
    resetGameState();
    setActiveGameId(id);
    setView('game');
  }, [resetGameState]);

  // Bug Finder
  const startBugFinder = useCallback(() => {
    const c = BUG_FINDER_CHALLENGES[Math.floor(Math.random() * BUG_FINDER_CHALLENGES.length)];
    setBfChallenge(c); setBfSelected(null); setBfRevealed(false);
    setGameTimer(60); setGameScore(0); setGameOver(false);
    setActiveGameId('bug-finder'); setView('game');
  }, []);

  const handleBfClick = useCallback((line: number) => {
    if (bfRevealed || !bfChallenge) return;
    setBfSelected(line); setBfRevealed(true);
    if (line === bfChallenge.correctLine) {
      setGameScore(1); addXP(bfChallenge.points);
      setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 }));
    }
  }, [bfRevealed, bfChallenge, addXP]);

  // Code Puzzle
  const startCodePuzzle = useCallback(() => {
    const c = CODE_PUZZLES[Math.floor(Math.random() * CODE_PUZZLES.length)];
    let order = shuffleArray([...c.correctOrder]);
    while (order.every((l, i) => l === c.correctOrder[i]) && c.correctOrder.length > 1) order = shuffleArray([...c.correctOrder]);
    setCpChallenge(c); setCpOrder(order); setCpRevealed(false); setCpCorrect(false);
    setGameTimer(90); setGameScore(0); setGameOver(false);
    setActiveGameId('code-puzzle'); setView('game');
  }, []);

  const moveCpLine = useCallback((idx: number, dir: 'up' | 'down') => {
    if (cpRevealed) return;
    const n = [...cpOrder]; const t = dir === 'up' ? idx - 1 : idx + 1;
    if (t < 0 || t >= n.length) return;
    [n[idx], n[t]] = [n[t], n[idx]]; setCpOrder(n);
  }, [cpOrder, cpRevealed]);

  const checkCp = useCallback(() => {
    if (!cpChallenge) return;
    const ok = cpOrder.every((l, i) => l === cpChallenge.correctOrder[i]);
    setCpRevealed(true); setCpCorrect(ok);
    if (ok) { setGameScore(1); addXP(cpChallenge.points); setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 })); }
  }, [cpChallenge, cpOrder, addXP]);

  // Battle
  const startBattle = useCallback((langId: string) => {
    const qs = getRandomQuestions(langId, undefined, 10);
    if (qs.length < 5) return;
    setBattleLang(langId); setBattleQs(qs); setBattleP1HP(100); setBattleP2HP(100);
    setBattleRound(0); setBattleQ(null); setBattleAns(''); setBattleRev(false);
    setBattleEndMsg(''); setBattleXP(0); setBattleStep('battle'); setBattleShake(false); setBattleGlow(null);
    setActiveGameId('code-battle'); setView('game');
    setTimeout(() => { setBattleQ(qs[0]); setBattleRound(1); }, 100);
  }, []);

  // Syntax Match
  const startSyntaxMatch = useCallback(() => {
    const lang = LANGUAGES[Math.floor(Math.random() * LANGUAGES.length)];
    const concepts = ['Print to console', 'Define constant', 'For loop (1 to 5)', 'Function declaration'];
    let pairs = SYNTAX_MATCH_PAIRS.filter(p => p.languageId === lang.id && concepts.includes(p.concept)).slice(0, 4);
    if (pairs.length < 4) { const extras = SYNTAX_MATCH_PAIRS.filter(p => concepts.includes(p.concept) && !pairs.includes(p)).slice(0, 4 - pairs.length); pairs.push(...extras); }
    setSmPairs(pairs);
    setSmConcepts(shuffleArray(pairs.map(p => ({ id: p.id, concept: p.concept, matched: false }))));
    setSmSyntaxes(shuffleArray(pairs.map(p => ({ id: p.id, syntax: p.syntax, matched: false }))));
    setSmSelected(null); setSmMatched(0); setSmWrong(false);
    setGameTimer(60); setGameScore(0); setGameOver(false);
    setActiveGameId('syntax-match'); setView('game');
  }, []);

  const handleSmSelect = useCallback((type: 'concept' | 'syntax', id: string) => {
    if (gameOver || smWrong) return;
    const items = type === 'concept' ? smConcepts : smSyntaxes;
    if (!items.find(i => i.id === id) || items.find(i => i.id === id)!.matched) return;
    if (!smSelected) { setSmSelected({ type, id }); return; }
    if (smSelected.type === type) { setSmSelected({ type, id }); return; }
    const cId = type === 'concept' ? id : smSelected.id;
    const sId = type === 'syntax' ? id : smSelected.id;
    const cItem = smConcepts.find(c => c.id === cId);
    const sItem = smSyntaxes.find(s => s.id === sId);
    const pair = smPairs.find(p => p.concept === cItem?.concept && p.syntax === sItem?.syntax);
    if (pair) {
      setSmConcepts(p => p.map(i => i.id === cId ? { ...i, matched: true } : i));
      setSmSyntaxes(p => p.map(i => i.id === sId ? { ...i, matched: true } : i));
      setSmMatched(m => m + 1); setGameScore(s => s + 1); addXP(10);
      if (smMatched + 1 >= Math.min(smPairs.length, 4)) { setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 })); setTimeout(() => setGameOver(true), 500); }
    } else { setSmWrong(true); setTimeout(() => setSmWrong(false), 600); }
    setSmSelected(null);
  }, [smSelected, smConcepts, smSyntaxes, smPairs, smMatched, smWrong, gameOver, addXP]);

  // Memory Match
  const startMemoryMatch = useCallback(() => {
    const shuffled = shuffleArray([...MEMORY_MATCH_CARDS]).slice(0, 8);
    const cards: typeof mmCards = [];
    shuffled.forEach(c => {
      cards.push({ id: c.id + '-a', pairId: c.pairId, display: c.content, flipped: false, matched: false });
      cards.push({ id: c.id + '-b', pairId: c.pairId, display: c.matchContent, flipped: false, matched: false });
    });
    setMmCards(shuffleArray(cards)); setMmFlipped([]); setMmMoves(0); setMmChecking(false);
    setGameTimer(120); setGameScore(0); setGameOver(false);
    setActiveGameId('memory-match'); setView('game');
  }, []);

  const handleMmFlip = useCallback((id: string) => {
    if (mmChecking || gameOver) return;
    const card = mmCards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (mmFlipped.length >= 2) return;
    const newFlipped = [...mmFlipped, id];
    setMmFlipped(newFlipped);
    setMmCards(p => p.map(c => c.id === id ? { ...c, flipped: true } : c));
    if (newFlipped.length === 2) {
      setMmMoves(m => m + 1);
      const first = mmCards.find(c => c.id === newFlipped[0])!;
      const second = mmCards.find(c => c.id === newFlipped[1])!;
      if (first.pairId === second.pairId) {
        setMmChecking(true);
        setTimeout(() => {
          setMmCards(p => p.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c));
          setMmFlipped([]); setMmChecking(false); setGameScore(s => s + 1); addXP(5);
          const matchedCount = mmCards.filter(c => c.matched || c.pairId === first.pairId).length;
          if (matchedCount + 2 >= mmCards.length) {
            setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 }));
            setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2000);
            setTimeout(() => setGameOver(true), 500);
          }
        }, 600);
      } else {
        setMmChecking(true);
        setTimeout(() => {
          setMmCards(p => p.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setMmFlipped([]); setMmChecking(false);
        }, 800);
      }
    }
  }, [mmCards, mmFlipped, mmChecking, gameOver, addXP]);

  // Typing Race
  const startTypingRace = useCallback(() => {
    const s = TYPING_SNIPPETS[Math.floor(Math.random() * TYPING_SNIPPETS.length)];
    setTySnippet(s); setTyInput(''); setTyStartTime(null); setTyFinished(false);
    setGameTimer(120); setGameScore(0); setGameOver(false);
    setActiveGameId('typing-race'); setView('game');
    setTimeout(() => tyInputRef.current?.focus(), 200);
  }, []);

  useEffect(() => {
    if (!tySnippet || tyFinished || gameOver) return;
    if (tyStartTime === null && tyInput.length > 0) setTyStartTime(Date.now());
    if (tyInput === tySnippet.code) {
      setTyFinished(true);
      const elapsed = tyStartTime ? (Date.now() - tyStartTime) / 1000 : 1;
      const words = tySnippet.code.length / 5;
      const wpm = Math.round(words / elapsed * 60);
      setGameScore(wpm);
      addXP(tySnippet.points + Math.floor(wpm / 5) * 5);
      setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 }));
    }
  }, [tyInput, tySnippet, tyStartTime, tyFinished, gameOver, addXP]);

  // Speed Quiz
  const startSpeedQuiz = useCallback((set: SpeedQuizSet) => {
    setSqSet(set); setSqQI(0); setSqTimer(set.timePerQuestion); setSqAns(''); setSqRev(false);
    setSqScore(0); setSqStreak(0); setSqEnded(false); setSqTotalCorrect(0);
    setGameScore(0); setGameOver(false);
    setActiveGameId('speed-quiz'); setView('game');
  }, []);

  useEffect(() => {
    if (!sqSet || sqEnded || gameOver || sqRev) return;
    if (sqQI >= sqSet.questions.length) { setSqEnded(true); setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 })); return; }
    if (sqTimer <= 0) { setSqRev(true); setSqStreak(0); setTimeout(() => { setSqQI(i => i + 1); setSqAns(''); setSqRev(false); setSqTimer(sqSet.timePerQuestion); }, 1500); return; }
    const t = setTimeout(() => setSqTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sqSet, sqQI, sqTimer, sqRev, sqEnded, gameOver]);

  const handleSqAnswer = useCallback((ans: string) => {
    if (sqRev || !sqSet) return;
    const q = sqSet.questions[sqQI];
    setSqAns(ans); setSqRev(true);
    if (ans === q.correctAnswer) { setSqScore(s => s + q.points); setSqStreak(s => s + 1); setSqTotalCorrect(c => c + 1); addXP(q.points); }
    else { setSqStreak(0); }
    setTimeout(() => { setSqQI(i => i + 1); setSqAns(''); setSqRev(false); setSqTimer(sqSet.timePerQuestion); }, 1200);
  }, [sqRev, sqSet, sqQI, addXP]);

  // Output Predictor
  const startOutputPredictor = useCallback(() => {
    const allQs = getRandomQuestions(undefined, undefined, 8).filter(q => q.codeSnippet);
    setOpQs(allQs.slice(0, Math.min(allQs.length, 5))); setOpQI(0); setOpAns(''); setOpRev(false); setOpCorrect(0); setOpEnded(false);
    setGameScore(0); setGameOver(false);
    setActiveGameId('output-predictor'); setView('game');
  }, []);

  const handleOpAnswer = useCallback((ans: string) => {
    if (opRev || opQI >= opQs.length) return;
    const q = opQs[opQI];
    setOpAns(ans); setOpRev(true);
    if (ans === q.correctAnswer) { setOpCorrect(c => c + 1); setGameScore(s => s + q.points); addXP(q.points); }
  }, [opRev, opQI, opQs, addXP]);

  const nextOpQ = useCallback(() => {
    if (opQI + 1 >= opQs.length) { setOpEnded(true); setProfile(p => ({ ...p, questionsAnswered: p.questionsAnswered + opQs.length, correctAnswers: p.correctAnswers + opCorrect })); }
    else { setOpQI(i => i + 1); setOpAns(''); setOpRev(false); }
  }, [opQI, opQs.length, opCorrect]);

  // Code Fill
  const startCodeFill = useCallback(() => {
    const c = CODE_FILL_CHALLENGES[Math.floor(Math.random() * CODE_FILL_CHALLENGES.length)];
    setCfChallenge(c); setCfAnswers(new Array(c.correctAnswers.length).fill('')); setCfRevealed(false); setCfCorrectCount(0);
    setGameTimer(90); setGameScore(0); setGameOver(false);
    setActiveGameId('code-fill'); setView('game');
  }, []);

  const checkCf = useCallback(() => {
    if (!cfChallenge) return;
    let correct = 0;
    cfAnswers.forEach((a, i) => { if (a === cfChallenge.correctAnswers[i]) correct++; });
    setCfRevealed(true); setCfCorrectCount(correct);
    if (correct === cfChallenge.correctAnswers.length) { setGameScore(correct); addXP(cfChallenge.points); }
    else if (correct > 0) { addXP(Math.floor(cfChallenge.points * correct / cfChallenge.correctAnswers.length)); }
    setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 }));
  }, [cfChallenge, cfAnswers, addXP]);

  // Pattern Master
  const startPatternMaster = useCallback(() => {
    const shuffled = shuffleArray([...PATTERN_CHALLENGES]).slice(0, 6);
    setPatChallenges(shuffled); setPatQI(0); setPatAns(null); setPatRev(false); setPatScore(0); setPatStreak(0); setPatEnded(false);
    setGameScore(0); setGameOver(false);
    setActiveGameId('pattern-master'); setView('game');
  }, []);

  const handlePatAnswer = useCallback((idx: number) => {
    if (patRev || patQI >= patChallenges.length) return;
    setPatAns(idx); setPatRev(true);
    const c = patChallenges[patQI];
    if (idx === c.correctIndex) { setPatScore(s => s + c.points); setPatStreak(s => s + 1); setGameScore(s => s + c.points); addXP(c.points); }
    else { setPatStreak(0); }
  }, [patRev, patQI, patChallenges, addXP]);

  const nextPatQ = useCallback(() => {
    if (patQI + 1 >= patChallenges.length) { setPatEnded(true); setProfile(p => ({ ...p, gamesPlayed: p.gamesPlayed + 1 })); }
    else { setPatQI(i => i + 1); setPatAns(null); setPatRev(false); }
  }, [patQI, patChallenges.length]);

  // Learn Quiz
  const startLearnQuiz = useCallback((lang: ProgrammingLanguage, topic: Topic) => {
    const qs = getRandomQuestions(lang.id, topic as string, 5);
    if (qs.length === 0) return;
    setLearnQs(qs); setLearnQI(0); setLearnAns(''); setLearnRev(false); setLearnCorrect(0); setLearnXP(0);
    setLearnLang(lang); setLearnTopic(topic); setLearnStep('quiz');
    setActiveGameId('learn-quiz'); setView('game');
  }, []);

  const handleLearnAns = useCallback((ans: string) => {
    if (learnRev || learnQI >= learnQs.length) return;
    const q = learnQs[learnQI];
    setLearnAns(ans); setLearnRev(true);
    if (ans === q.correctAnswer) { setLearnCorrect(c => c + 1); setLearnXP(x => x + q.points); addXP(q.points); }
  }, [learnRev, learnQI, learnQs, addXP]);

  const nextLearnQ = useCallback(() => {
    if (learnQI + 1 >= learnQs.length) {
      setLearnStep('results');
      setProfile(p => ({ ...p, questionsAnswered: p.questionsAnswered + learnQs.length, correctAnswers: p.correctAnswers + learnCorrect }));
    } else { setLearnQI(i => i + 1); setLearnAns(''); setLearnRev(false); }
  }, [learnQI, learnQs.length, learnCorrect]);

  // Battle answer
  const handleBattleAns = useCallback((ans: string) => {
    if (battleRev || !battleQ) return;
    setBattleAns(ans); setBattleRev(true);
    const correct = ans === battleQ.correctAnswer;
    const botCorrect = Math.random() < 0.7;
    if (correct) { const dmg = 15 + Math.floor(Math.random() * 10); setBattleP2HP(h => Math.max(0, h - dmg)); setBattleGlow('player'); }
    else { const dmg = 10 + Math.floor(Math.random() * 8); setBattleP1HP(h => Math.max(0, h - dmg)); setBattleShake(true); }
    if (botCorrect) { const dmg = 8 + Math.floor(Math.random() * 7); setBattleP1HP(h => Math.max(0, h - dmg)); }
    setTimeout(() => { setBattleShake(false); setBattleGlow(null); }, 500);
    setTimeout(() => {
      setBattleRev(false); setBattleAns('');
      const nextR = battleRound + 1;
      if (battleP1HP <= 0 || battleP2HP <= 0 || nextR > battleQs.length) {
        const won = battleP2HP <= 0;
        const xp = won ? 100 + battleRound * 15 : 30 + battleRound * 5;
        setBattleXP(xp); setBattleEndMsg(won ? '🏆 Victory!' : '💀 Defeat!'); setBattleStep('end'); addXP(xp);
        setProfile(p => ({ ...p, battlesWon: p.battlesWon + (won ? 1 : 0) }));
      } else { setBattleRound(nextR); setBattleQ(battleQs[nextR - 1]); }
    }, 1800);
  }, [battleRev, battleQ, battleQs, battleRound, battleP1HP, battleP2HP, addXP]);

  // ══════════════════════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ══════════════════════════════════════════════════════════════

  function renderHome() {
    const level = getLevelForXP(profile.xp);
    const next = getNextLevel(profile.xp);
    const pct = next.xpRequired > level.xpRequired ? ((profile.xp - level.xpRequired) / (next.xpRequired - level.xpRequired)) * 100 : 100;
    return (
      <motion.div {...fadeIn} className="space-y-6">
        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800 p-5 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/30"><AvatarFallback className="text-xl sm:text-2xl bg-white/20">{profile.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{profile.name}</h2>
                <div className="text-emerald-100 text-xs sm:text-sm">{level.badge} {level.title}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-bold text-white">{profile.xp}</div>
                <div className="text-emerald-100 text-[10px] sm:text-xs">Total XP</div>
              </div>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1 }} />
            </div>
            <div className="flex justify-between text-xs text-emerald-100 mt-1"><span>Level {level.level}</span><span>Level {next.level}</span></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Zap className="w-4 h-4 text-amber-500" />} label="Total XP" value={profile.xp} color="bg-amber-100 dark:bg-amber-900/30" />
          <StatCard icon={<Star className="w-4 h-4 text-emerald-500" />} label="Level" value={level.level} color="bg-emerald-100 dark:bg-emerald-900/30" />
          <StatCard icon={<Flame className="w-4 h-4 text-orange-500" />} label="Streak" value={profile.streak} color="bg-orange-100 dark:bg-orange-900/30" suffix="days" />
          <StatCard icon={<Swords className="w-4 h-4 text-rose-500" />} label="Battles Won" value={profile.battlesWon} color="bg-rose-100 dark:bg-rose-900/30" />
        </div>

        {/* Daily Challenge */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" />Daily Challenge</h3>
          <Card className="overflow-hidden border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => { const q = [...dailyChallenge.questions]; setLearnQs(q); setLearnQI(0); setLearnAns(''); setLearnRev(false); setLearnCorrect(0); setLearnXP(0); setLearnLang(getLanguageById(dailyChallenge.languageId) || null); setLearnTopic(null); setLearnStep('quiz'); setActiveGameId('daily-challenge'); setView('game'); }}>
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-600 dark:from-violet-700 dark:to-fuchsia-800 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-white/20 text-white border-0 text-[10px]">{dailyChallenge.difficulty}</Badge>
                    <Badge className="bg-amber-400 text-amber-900 border-0 text-[10px]">+{dailyChallenge.points + dailyChallenge.bonusPoints} XP</Badge>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{dailyChallenge.title}</h3>
                  <p className="text-xs sm:text-sm text-violet-100 mt-1 line-clamp-2">{dailyChallenge.description}</p>
                  <Button className="mt-3 bg-white text-violet-600 hover:bg-white/90 font-semibold text-sm">Start Challenge <ChevronRight className="w-4 h-4 ml-1" /></Button>
                </div>
                <Image src="/games/daily-challenge.png" alt="Daily" width={80} height={80} className="rounded-xl shrink-0 hidden sm:block" />
              </div>
            </div>
          </Card>
        </div>

        {/* Featured Games */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Popular Games</h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={openHub}>See All <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {GAME_CATALOG.filter(g => g.isNew || g.rating >= 4.5).slice(0, 4).map(g => <GameCardComponent key={g.id} game={g} onClick={() => openGame(g.id)} />)}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <BookOpen className="w-5 h-5" />, label: 'Learn', desc: 'Start a quiz', color: 'from-emerald-500 to-teal-500', action: () => { setLearnStep('langs'); setActiveGameId('learn-quiz'); setView('game'); } },
              { icon: <Swords className="w-5 h-5" />, label: 'Battle', desc: 'Challenge bot', color: 'from-rose-500 to-orange-500', action: () => { setBattleStep('select'); setActiveGameId('code-battle'); setView('game'); } },
              { icon: <Gamepad2 className="w-5 h-5" />, label: 'All Games', desc: '12 games!', color: 'from-violet-500 to-fuchsia-500', action: openHub },
              { icon: <Trophy className="w-5 h-5" />, label: 'Leaderboard', desc: 'Global ranks', color: 'from-amber-500 to-yellow-500', action: () => setView('leaderboard') },
            ].map(a => (
              <motion.button key={a.label} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={a.action}
                className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 text-left hover:shadow-lg transition-shadow">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${a.color} flex items-center justify-center text-white mb-3`}>{a.icon}</div>
                <div className="font-semibold text-sm">{a.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />Recent Activity</h3>
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /><span className="text-xs sm:text-sm truncate">{a.text}</span></div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 shrink-0"><span className="text-emerald-500 font-medium">+{a.xp} XP</span><span className="hidden sm:inline">{a.time}</span></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function renderHub() {
    const cats = [...new Set(GAME_CATALOG.map(g => g.category))];
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goHome}><ChevronLeft className="w-4 h-4 mr-1" />Home</Button>
          <h2 className="text-xl font-bold flex-1">Games Hub</h2>
          <Badge variant="secondary">{GAME_CATALOG.length} games</Badge>
        </div>
        {cats.map(cat => (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{cat}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {GAME_CATALOG.filter(g => g.category === cat).map(g => <GameCardComponent key={g.id} game={g} onClick={() => openGame(g.id)} />)}
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  function renderLeaderboard() {
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={goHome}><ChevronLeft className="w-4 h-4 mr-1" />Home</Button><h2 className="text-xl font-bold flex-1">Leaderboard</h2></div>
        <div className="space-y-3">
          {MOCK_LEADERBOARD.map((e, i) => (
            <motion.div key={e.rank} {...fadeIn} transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${i === 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : i === 1 ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' : i === 2 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{i === 0 ? <Crown className="w-4 h-4" /> : e.rank}</div>
              <span className="text-2xl">{e.avatar}</span>
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{e.name}</div><div className="text-xs text-gray-500">Level {e.level} · {e.streak} day streak</div></div>
              <div className="text-right"><div className="font-bold text-sm">{e.xp.toLocaleString()}</div><div className="text-[10px] text-gray-500">XP</div></div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  function renderProfile() {
    const level = getLevelForXP(profile.xp);
    return (
      <motion.div {...fadeIn} className="space-y-6">
        <div className="flex items-center gap-3"><Button variant="ghost" size="sm" onClick={goHome}><ChevronLeft className="w-4 h-4 mr-1" />Home</Button><h2 className="text-xl font-bold flex-1">Profile</h2></div>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center text-white">
            <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-white/30"><AvatarFallback className="text-4xl bg-white/20">{profile.avatar}</AvatarFallback></Avatar>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <div className="text-emerald-100 mt-1">{level.badge} {level.title} · Level {level.level}</div>
            <div className="text-3xl font-bold mt-2">{profile.xp} XP</div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Flame className="w-4 h-4 text-orange-500" />} label="Streak" value={profile.streak} color="bg-orange-100 dark:bg-orange-900/30" suffix="days" />
              <StatCard icon={<Swords className="w-4 h-4 text-rose-500" />} label="Battles Won" value={profile.battlesWon} color="bg-rose-100 dark:bg-rose-900/30" />
              <StatCard icon={<Check className="w-4 h-4 text-emerald-500" />} label="Correct Answers" value={profile.correctAnswers} color="bg-emerald-100 dark:bg-emerald-900/30" />
              <StatCard icon={<Gamepad2 className="w-4 h-4 text-violet-500" />} label="Games Played" value={profile.gamesPlayed} color="bg-violet-100 dark:bg-violet-900/30" />
            </div>
            {profile.questionsAnswered > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Accuracy</span><span className="font-semibold">{Math.round((profile.correctAnswers / profile.questionsAnswered) * 100)}%</span></div>
                <Progress value={Math.round((profile.correctAnswers / profile.questionsAnswered) * 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // GAME RENDERS
  // ══════════════════════════════════════════════════════════════

  function renderBugFinder() {
    if (!bfChallenge) return renderGameStart('bug-finder', 'Find the bug!', 'Click on the line that contains the bug.', startBugFinder);
    if (bfRevealed) {
      const correct = bfSelected === bfChallenge.correctLine;
      return (
        <motion.div {...fadeIn} className="space-y-4">
          <GameHeader game={GAME_CATALOG[0]!} onBack={goHome} />
          <Card className="border-0 shadow-md"><CardContent className="p-4">
            <div className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs sm:text-sm">{bfChallenge.buggyCode.split('\n').map((line, i) => (
              <div key={i} className={`flex ${i + 1 === bfChallenge.correctLine ? 'bg-emerald-500/20 border-l-2 border-emerald-400 -ml-1 pl-3' : i + 1 === bfSelected && !correct ? 'bg-rose-500/20 border-l-2 border-rose-400 -ml-1 pl-3' : 'pl-1'} ${i > 0 ? 'mt-0.5' : ''}`}>
                <span className="w-8 text-right mr-3 text-gray-500 select-none text-[10px]">{i + 1}</span><span className="whitespace-pre">{line}</span>
              </div>
            ))}</div>
            <div className={`mt-4 p-3 rounded-lg ${correct ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
              <div className="font-bold text-sm">{correct ? '✅ Correct!' : '❌ Wrong!'}</div>
              <div className="text-sm mt-1">{bfChallenge.explanation}</div>
            </div>
            <Button className="mt-3 w-full" onClick={startBugFinder}><RotateCcw className="w-4 h-4 mr-2" />Try Another</Button>
          </CardContent></Card>
        </motion.div>
      );
    }
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[0]!} onBack={goHome} timer={gameTimer} maxTime={60} />
        <Card className="border-0 shadow-md"><CardContent className="p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm">{bfChallenge.title}</h3><Badge className={diffColors[bfChallenge.difficulty]}>{bfChallenge.difficulty}</Badge></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{bfChallenge.description}</p>
          <div className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs sm:text-sm cursor-pointer">{bfChallenge.buggyCode.split('\n').map((line, i) => (
            <div key={i} onClick={() => handleBfClick(i + 1)} className={`flex hover:bg-gray-800/60 active:bg-gray-800/80 transition-colors rounded ${bfSelected === i + 1 ? 'bg-rose-500/20 border-l-2 border-rose-400 -ml-1 pl-3' : 'pl-1'} ${i > 0 ? 'mt-0.5' : ''}`}>
              <span className="w-8 text-right mr-3 text-gray-500 select-none text-[10px]">{i + 1}</span><span className="whitespace-pre">{line}</span>
            </div>
          ))}</div>
          <p className="text-xs text-gray-400 mt-2">💡 Hint: {bfChallenge.hint}</p>
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderCodePuzzle() {
    if (!cpChallenge) return renderGameStart('code-puzzle', 'Arrange the code!', 'Put the lines in the correct order.', startCodePuzzle);
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[1]!} onBack={goHome} timer={gameTimer} maxTime={90} />
        <Card className="border-0 shadow-md"><CardContent className="p-4">
          <h3 className="font-bold text-sm mb-1">{cpChallenge.title}</h3>
          <p className="text-xs text-gray-500 mb-3">{cpChallenge.description}</p>
          <div className="space-y-1.5">
            {cpOrder.map((line, i) => (
              <motion.div key={i} layout className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 border ${cpRevealed && line === cpChallenge.correctOrder[i] ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-transparent'}`}>
                <span className="w-6 text-xs text-gray-400 text-center shrink-0">{i + 1}</span>
                <code className="flex-1 text-xs font-mono truncate">{line}</code>
                {!cpRevealed && (
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveCpLine(i, 'up')} disabled={i === 0} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={() => moveCpLine(i, 'down')} disabled={i === cpOrder.length - 1} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          {!cpRevealed && <Button className="mt-3 w-full" onClick={checkCp}>Check Order</Button>}
          {cpRevealed && (
            <div className="mt-3">
              <div className={`p-3 rounded-lg text-sm ${cpCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                {cpCorrect ? '✅ Perfect!' : '❌ Not quite right!'}
                <p className="mt-1 text-xs opacity-80">{cpChallenge.explanation}</p>
              </div>
              <Button className="mt-2 w-full" variant="outline" onClick={startCodePuzzle}><RotateCcw className="w-4 h-4 mr-2" />Try Another</Button>
            </div>
          )}
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderBattle() {
    if (battleStep === 'select') return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[2]!} onBack={goHome} />
        <h3 className="text-lg font-bold text-center">Choose Your Language</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LANGUAGES.map(l => (
            <motion.button key={l.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => startBattle(l.id)}
              className={`p-4 rounded-xl border-2 bg-gradient-to-br ${l.gradient} text-white text-center shadow-md hover:shadow-xl transition-shadow`}>
              <div className="text-3xl mb-1">{l.icon}</div><div className="font-bold text-sm">{l.name}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
    if (battleStep === 'end') return (
      <motion.div {...scaleIn} className="space-y-4 text-center py-8">
        <div className="text-5xl mb-4">{battleEndMsg.includes('Victory') ? '🏆' : '💀'}</div>
        <h2 className="text-2xl font-bold">{battleEndMsg}</h2>
        <p className="text-gray-500">Round {battleRound} · +{battleXP} XP</p>
        <div className="flex gap-3 justify-center"><Button onClick={() => { setBattleStep('select'); }}><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button><Button variant="outline" onClick={goHome}>Home</Button></div>
      </motion.div>
    );
    if (!battleQ) return null;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[2]!} onBack={goHome} />
        <div className="space-y-2">
          <motion.div animate={battleShake ? { x: [0, -8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.5 }}>
            <HPBar hp={battleP1HP} maxHp={100} label="🧑‍💻 You" color={battleGlow === 'player' ? 'from-emerald-400 to-teal-500' : 'from-emerald-500 to-green-500'} />
          </motion.div>
          <HPBar hp={battleP2HP} maxHp={100} label="🤖 Bot" color="from-rose-500 to-red-500" />
        </div>
        <div className="text-center text-xs text-gray-400">Round {battleRound}/{battleQs.length}</div>
        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
          <p className="text-sm font-medium">{battleQ.question}</p>
          {battleQ.codeSnippet && <pre className="bg-gray-950 text-gray-200 rounded-lg p-3 text-xs font-mono overflow-x-auto">{battleQ.codeSnippet}</pre>}
          <div className="space-y-2">
            {battleQ.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect = letter === battleQ.correctAnswer;
              const isSelected = battleAns === letter;
              let bg = 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
              if (battleRev && isCorrect) bg = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500';
              if (battleRev && isSelected && !isCorrect) bg = 'bg-rose-50 dark:bg-rose-900/20 border-rose-500';
              return (
                <motion.button key={i} whileHover={!battleRev ? { scale: 1.01 } : {}} whileTap={!battleRev ? { scale: 0.98 } : {}} onClick={() => handleBattleAns(letter)} disabled={battleRev}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${bg}`}>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${battleRev && isCorrect ? 'bg-emerald-500 text-white' : battleRev && isSelected ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>{letter}</span>
                  <span className="text-sm flex-1">{opt}</span>
                </motion.button>
              );
            })}
          </div>
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderMemoryMatch() {
    if (mmCards.length === 0) return renderGameStart('memory-match', 'Match the pairs!', 'Flip cards to find matching coding concepts.', startMemoryMatch);
    const allMatched = mmCards.every(c => c.matched);
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[3]!} onBack={goHome} timer={gameTimer} maxTime={120} score={gameScore} />
        <div className="flex justify-between text-xs text-gray-500"><span>Moves: {mmMoves}</span><span>Matched: {mmCards.filter(c => c.matched).length / 2}/{mmCards.length / 2}</span></div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {mmCards.map(card => (
            <motion.button key={card.id} whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}} whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
              onClick={() => handleMmFlip(card.id)} disabled={card.matched || mmChecking}
              className={`aspect-square rounded-xl border-2 text-center p-1.5 sm:p-2 transition-all text-[9px] sm:text-xs font-medium flex items-center justify-center leading-tight
                ${card.matched ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300' :
                  card.flipped ? 'bg-white dark:bg-gray-700 border-violet-400 text-foreground' :
                  'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-400 text-white hover:shadow-lg cursor-pointer'}`}>
              {card.flipped || card.matched ? card.display : '?'}
            </motion.button>
          ))}
        </div>
        {allMatched && (
          <motion.div {...scaleIn} className="text-center py-4">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-bold text-lg">All Matched!</h3>
            <p className="text-sm text-gray-500">Completed in {mmMoves} moves</p>
            <Button className="mt-3" onClick={startMemoryMatch}><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  function renderTypingRace() {
    if (!tySnippet) return renderGameStart('typing-race', 'Type the code!', 'Type the code snippet as fast as you can.', startTypingRace);
    const elapsed = tyStartTime ? (tyFinished ? tyStartTime : Date.now()) - tyStartTime : 0;
    const wpm = elapsed > 0 ? Math.round((tyInput.length / 5) / (elapsed / 1000) * 60) : 0;
    const accuracy = tyInput.length > 0 ? Math.round(tyInput.split('').filter((c, i) => c === tySnippet.code[i]).length / tyInput.length * 100) : 100;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[4]!} onBack={goHome} timer={gameTimer} maxTime={120} />
        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-bold text-sm">{tySnippet.title}</h3><Badge className={diffColors[tySnippet.difficulty]}>{tySnippet.difficulty}</Badge></div>
          <div className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs sm:text-sm whitespace-pre-wrap break-all leading-relaxed">
            {tySnippet.code.split('').map((char, i) => (
              <span key={i} className={tyInput[i] === undefined ? 'text-gray-500' : tyInput[i] === char ? 'text-emerald-400' : 'text-rose-400 bg-rose-500/20'}>{char}</span>
            ))}
          </div>
          <textarea ref={tyInputRef} value={tyInput} onChange={e => setTyInput(e.target.value)} disabled={tyFinished}
            className="w-full h-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 font-mono text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="Start typing here..." />
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">WPM: <span className="font-bold text-foreground">{tyFinished ? gameScore : wpm}</span></span>
            <span className="text-gray-500">Accuracy: <span className={`font-bold ${accuracy >= 95 ? 'text-emerald-500' : accuracy >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>{accuracy}%</span></span>
          </div>
        </CardContent></Card>
        {tyFinished && (
          <motion.div {...scaleIn} className="text-center py-4">
            <div className="text-3xl mb-2">⌨️</div>
            <h3 className="font-bold text-lg">Race Complete!</h3>
            <p className="text-sm text-gray-500">{gameScore} WPM · {accuracy}% accuracy</p>
            <Button className="mt-3" onClick={startTypingRace}><RotateCcw className="w-4 h-4 mr-2" />Race Again</Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  function renderSyntaxMatch() {
    if (smConcepts.length === 0) return renderGameStart('syntax-match', 'Match concepts to syntax!', 'Select one from each column.', startSyntaxMatch);
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[5]!} onBack={goHome} timer={gameTimer} maxTime={60} score={gameScore} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Concepts</h4>
            <div className="space-y-2">
              {smConcepts.map(c => (
                <motion.button key={c.id} whileHover={!c.matched ? { scale: 1.02 } : {}} whileTap={!c.matched ? { scale: 0.98 } : {}}
                  onClick={() => handleSmSelect('concept', c.id)} disabled={c.matched}
                  className={`w-full p-2.5 rounded-xl border-2 text-left text-xs font-medium transition-all ${c.matched ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300' : smSelected?.type === 'concept' && smSelected?.id === c.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : smWrong ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 animate-pulse' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
                  {c.concept}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Syntax</h4>
            <div className="space-y-2">
              {smSyntaxes.map(s => (
                <motion.button key={s.id} whileHover={!s.matched ? { scale: 1.02 } : {}} whileTap={!s.matched ? { scale: 0.98 } : {}}
                  onClick={() => handleSmSelect('syntax', s.id)} disabled={s.matched}
                  className={`w-full p-2.5 rounded-xl border-2 text-left text-xs font-mono transition-all ${s.matched ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300' : smSelected?.type === 'syntax' && smSelected?.id === s.id ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20' : smWrong ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 animate-pulse' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
                  {s.syntax}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  function renderSpeedQuiz() {
    if (!sqSet) return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[6]!} onBack={goHome} />
        <h3 className="text-lg font-bold text-center">Choose a Quiz Set</h3>
        <div className="space-y-3">
          {SPEED_QUIZ_SETS.map(s => (
            <motion.button key={s.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => startSpeedQuiz(s)}
              className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-left hover:border-orange-400 transition-colors">
              <div className="flex justify-between items-start"><div><h4 className="font-bold text-sm">{s.title}</h4><p className="text-xs text-gray-500 mt-0.5">{s.category} · {s.questions.length} questions</p></div>
                <div className="text-right"><Badge className={diffColors[s.difficulty]}>{s.difficulty}</Badge><div className="text-xs text-gray-400 mt-1">{s.timePerQuestion}s each</div></div></div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
    if (sqEnded) return (
      <motion.div {...scaleIn} className="space-y-4 text-center py-8">
        <div className="text-5xl mb-4">⚡</div>
        <h2 className="text-2xl font-bold">Quiz Complete!</h2>
        <p className="text-gray-500">{sqTotalCorrect}/{sqSet.questions.length} correct · {sqScore} points</p>
        <div className="flex gap-3 justify-center"><Button onClick={() => { setSqSet(null); }}>Choose Another</Button><Button variant="outline" onClick={goHome}>Home</Button></div>
      </motion.div>
    );
    const q = sqSet.questions[sqQI];
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[6]!} onBack={goHome} score={sqScore} />
        <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Q{sqQI + 1}/{sqSet.questions.length}</span>
          {sqStreak >= 3 && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">🔥 {sqStreak} streak!</Badge>}
        </div>
        <div className="flex justify-center"><TimerCircle timeLeft={sqTimer} maxTime={sqSet.timePerQuestion} size={64} /></div>
        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
          <AnimatePresence mode="wait"><motion.div key={q.id} {...fadeIn}><p className="font-medium text-sm">{q.question}</p>
            <div className="space-y-2 mt-3">{q.options.map((opt, i) => <QuestionOption key={i} option={opt} index={i} selected={sqAns === String.fromCharCode(65 + i)} correct={String.fromCharCode(65 + i) === q.correctAnswer} revealed={sqRev} onClick={() => handleSqAnswer(String.fromCharCode(65 + i))} />)}</div>
            {sqRev && <div className={`p-2 rounded-lg text-xs mt-2 ${sqAns === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>{q.explanation}</div>}
          </motion.div></AnimatePresence>
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderOutputPredictor() {
    if (opQs.length === 0) return renderGameStart('output-predictor', 'Predict the output!', 'Read the code and guess what it outputs.', startOutputPredictor);
    if (opEnded) return (
      <motion.div {...scaleIn} className="space-y-4 text-center py-8">
        <div className="text-5xl mb-4">🔮</div>
        <h2 className="text-2xl font-bold">Done!</h2>
        <p className="text-gray-500">{opCorrect}/{opQs.length} correct</p>
        <div className="flex gap-3 justify-center"><Button onClick={startOutputPredictor}><RotateCcw className="w-4 h-4 mr-2" />Try Again</Button><Button variant="outline" onClick={goHome}>Home</Button></div>
      </motion.div>
    );
    const q = opQs[opQI];
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[7]!} onBack={goHome} score={gameScore} />
        <div className="text-xs text-gray-500">Q{opQI + 1}/{opQs.length} · {opCorrect} correct</div>
        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
          <p className="font-medium text-sm">{q.question}</p>
          <pre className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs overflow-x-auto">{q.codeSnippet}</pre>
          <div className="space-y-2">{q.options.map((opt, i) => <QuestionOption key={i} option={opt} index={i} selected={opAns === String.fromCharCode(65 + i)} correct={String.fromCharCode(65 + i) === q.correctAnswer} revealed={opRev} onClick={() => handleOpAnswer(String.fromCharCode(65 + i))} />)}</div>
          {opRev && <div className={`p-2 rounded-lg text-xs mt-2 ${opAns === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>{q.explanation}
            <Button className="mt-2 w-full text-xs" size="sm" onClick={nextOpQ}>{opQI + 1 < opQs.length ? 'Next Question' : 'See Results'}</Button>
          </div>}
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderCodeFill() {
    if (!cfChallenge) return renderGameStart('code-fill', 'Fill in the blanks!', 'Complete the code by filling the blanks.', startCodeFill);
    const blankCount = cfChallenge.codeTemplate.split('___BLANK___').length - 1;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[8]!} onBack={goHome} timer={gameTimer} maxTime={90} />
        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-sm">{cfChallenge.title}</h3>
          <div className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {cfChallenge.codeTemplate.split('___BLANK___').map((part, i) => (
              <React.Fragment key={i}>{part}
                {i < blankCount && (
                  <select value={cfAnswers[i] || ''} onChange={e => { if (!cfRevealed) { const n = [...cfAnswers]; n[i] = e.target.value; setCfAnswers(n); } }}
                    disabled={cfRevealed} className={`mx-1 px-2 py-0.5 rounded text-xs font-bold ${cfRevealed ? (cfAnswers[i] === cfChallenge.correctAnswers[i] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-rose-500/20 text-rose-400 border border-rose-500') : 'bg-violet-500/20 text-violet-400 border border-violet-500'} focus:outline-none`}>
                    <option value="">___</option>
                    {cfChallenge.options.filter((o, idx, arr) => arr.indexOf(o) === idx).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </React.Fragment>
            ))}
          </div>
          {!cfRevealed && <Button className="w-full" disabled={cfAnswers.some(a => !a)} onClick={checkCf}>Check Answers</Button>}
          {cfRevealed && (
            <div>
              <div className={`p-3 rounded-lg text-sm ${cfCorrectCount === blankCount ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}>
                {cfCorrectCount === blankCount ? '✅ Perfect!' : `Got ${cfCorrectCount}/${blankCount} correct`}
                <p className="mt-1 text-xs opacity-80">{cfChallenge.explanation}</p>
              </div>
              <Button className="mt-2 w-full" variant="outline" onClick={startCodeFill}><RotateCcw className="w-4 h-4 mr-2" />Try Another</Button>
            </div>
          )}
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderPatternMaster() {
    if (patChallenges.length === 0) return renderGameStart('pattern-master', 'Find the pattern!', 'What comes next in the sequence?', startPatternMaster);
    if (patEnded) return (
      <motion.div {...scaleIn} className="space-y-4 text-center py-8">
        <div className="text-5xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold">Pattern Master!</h2>
        <p className="text-gray-500">Score: {patScore} points</p>
        <div className="flex gap-3 justify-center"><Button onClick={startPatternMaster}><RotateCcw className="w-4 h-4 mr-2" />Play Again</Button><Button variant="outline" onClick={goHome}>Home</Button></div>
      </motion.div>
    );
    const c = patChallenges[patQI];
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[9]!} onBack={goHome} score={patScore} />
        <div className="text-xs text-gray-500">Q{patQI + 1}/{patChallenges.length} {patStreak >= 3 && <Badge className="ml-2 bg-orange-100 text-orange-700">🔥 {patStreak}</Badge>}</div>
        <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {c.sequence.map((n, i) => <span key={i} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-bold text-lg">{n}</span>)}
            <span className="text-2xl text-gray-400 font-bold">?</span>
          </div>
          <h4 className="text-sm text-gray-500">What comes next?</h4>
          <div className="grid grid-cols-2 gap-2">
            {c.nextOptions.map((opt, i) => (
              <motion.button key={i} whileHover={!patRev ? { scale: 1.03 } : {}} whileTap={!patRev ? { scale: 0.97 } : {}}
                onClick={() => handlePatAnswer(i)} disabled={patRev}
                className={`p-4 rounded-xl border-2 text-center font-bold text-xl transition-all ${patRev && i === c.correctIndex ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700' : patRev && patAns === i && i !== c.correctIndex ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-700' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-violet-400'}`}>
                {opt}
              </motion.button>
            ))}
          </div>
          {patRev && <div className={`p-3 rounded-lg text-xs ${patAns === c.correctIndex ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>{c.explanation}
            <Button className="mt-2 w-full text-xs" size="sm" onClick={nextPatQ}>{patQI + 1 < patChallenges.length ? 'Next' : 'See Results'}</Button>
          </div>}
        </CardContent></Card>
      </motion.div>
    );
  }

  function renderLearnQuiz() {
    if (learnStep === 'langs') return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[10]!} onBack={goHome} />
        <h3 className="text-lg font-bold">Choose a Language</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGUAGES.map(l => (
            <motion.button key={l.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setLearnLang(l); setLearnStep('topics'); }}
              className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-left hover:border-emerald-400 transition-colors">
              <div className="flex items-center gap-3"><span className="text-3xl">{l.icon}</span><div><div className="font-bold">{l.name}</div><div className="text-xs text-gray-500">{l.topics.length} topics</div></div></div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
    if (learnStep === 'topics' && learnLang) return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={GAME_CATALOG[10]!} onBack={() => setLearnStep('langs')} />
        <h3 className="text-lg font-bold">{learnLang.name} Topics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {learnLang.topics.map(t => (
            <motion.button key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => startLearnQuiz(learnLang, t)}
              className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-sm font-medium hover:border-emerald-400 transition-colors">{t}</motion.button>
          ))}
        </div>
      </motion.div>
    );
    if (learnStep === 'quiz' && learnQs.length > 0) {
      if (learnQI >= learnQs.length) return (
        <motion.div {...scaleIn} className="space-y-4 text-center py-8">
          <div className="text-5xl mb-4">📚</div><h2 className="text-2xl font-bold">Quiz Complete!</h2>
          <p className="text-gray-500">{learnCorrect}/{learnQs.length} correct · +{learnXP} XP</p>
          <div className="flex gap-3 justify-center"><Button onClick={() => setLearnStep('langs')}>Choose Another</Button><Button variant="outline" onClick={goHome}>Home</Button></div>
        </motion.div>
      );
      const q = learnQs[learnQI];
      return (
        <motion.div {...fadeIn} className="space-y-4">
          <GameHeader game={GAME_CATALOG[10]!} onBack={() => setLearnStep(learnLang ? 'topics' : 'langs')} score={learnXP} />
          <div className="text-xs text-gray-500">Q{learnQI + 1}/{learnQs.length}</div>
          <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
            <p className="font-medium text-sm">{q.question}</p>
            {q.codeSnippet && <pre className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs overflow-x-auto">{q.codeSnippet}</pre>}
            <div className="space-y-2">{q.options.map((opt, i) => <QuestionOption key={i} option={opt} index={i} selected={learnAns === String.fromCharCode(65 + i)} correct={String.fromCharCode(65 + i) === q.correctAnswer} revealed={learnRev} onClick={() => handleLearnAns(String.fromCharCode(65 + i))} />)}</div>
            {learnRev && <div className={`p-2 rounded-lg text-xs mt-2 ${learnAns === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>{q.explanation}
              <Button className="mt-2 w-full text-xs" size="sm" onClick={nextLearnQ}>{learnQI + 1 < learnQs.length ? 'Next' : 'Results'}</Button>
            </div>}
          </CardContent></Card>
        </motion.div>
      );
    }
    if (learnStep === 'results') return (
      <motion.div {...scaleIn} className="space-y-4 text-center py-8">
        <div className="text-5xl mb-4">📚</div><h2 className="text-2xl font-bold">Quiz Complete!</h2>
        <p className="text-gray-500">{learnCorrect}/{learnQs.length} correct · +{learnXP} XP</p>
        <div className="flex gap-3 justify-center"><Button onClick={() => setLearnStep('langs')}>Choose Another</Button><Button variant="outline" onClick={goHome}>Home</Button></div>
      </motion.div>
    );
    return null;
  }

  function renderDailyChallenge() {
    if (learnStep === 'quiz' && learnQs.length > 0) {
      if (learnQI >= learnQs.length) return (
        <motion.div {...scaleIn} className="space-y-4 text-center py-8">
          <ConfettiParticles show={learnCorrect >= 3} />
          <div className="text-5xl mb-4">🎉</div><h2 className="text-2xl font-bold">Daily Challenge Complete!</h2>
          <p className="text-gray-500">{learnCorrect}/{learnQs.length} correct · +{learnXP} XP</p>
          {learnCorrect >= 3 && <Badge className="bg-amber-100 text-amber-700">🔥 Bonus +{dailyChallenge.bonusPoints} XP!</Badge>}
          <Button onClick={goHome}>Back to Home</Button>
        </motion.div>
      );
      const q = learnQs[learnQI];
      return (
        <motion.div {...fadeIn} className="space-y-4">
          <GameHeader game={GAME_CATALOG[11]!} onBack={goHome} score={learnXP} />
          <div className="text-xs text-gray-500">Q{learnQI + 1}/{learnQs.length}</div>
          <Card className="border-0 shadow-md"><CardContent className="p-4 space-y-3">
            <p className="font-medium text-sm">{q.question}</p>
            {q.codeSnippet && <pre className="bg-gray-950 text-gray-200 rounded-lg p-3 font-mono text-xs overflow-x-auto">{q.codeSnippet}</pre>}
            <div className="space-y-2">{q.options.map((opt, i) => <QuestionOption key={i} option={opt} index={i} selected={learnAns === String.fromCharCode(65 + i)} correct={String.fromCharCode(65 + i) === q.correctAnswer} revealed={learnRev} onClick={() => handleLearnAns(String.fromCharCode(65 + i))} />)}</div>
            {learnRev && <div className={`p-2 rounded-lg text-xs mt-2 ${learnAns === q.correctAnswer ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>{q.explanation}
              <Button className="mt-2 w-full text-xs" size="sm" onClick={nextLearnQ}>{learnQI + 1 < learnQs.length ? 'Next' : 'Results'}</Button>
            </div>}
          </CardContent></Card>
        </motion.div>
      );
    }
    return null;
  }

  function renderGameStart(id: GameId, title: string, desc: string, startFn: () => void) {
    const game = GAME_CATALOG.find(g => g.id === id);
    if (!game) return null;
    return (
      <motion.div {...fadeIn} className="space-y-4">
        <GameHeader game={game} onBack={goHome} />
        <div className="text-center py-8">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-6xl mb-4">{game.icon}</motion.div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-gray-500 text-sm mb-6">{desc}</p>
          <Button size="lg" onClick={startFn} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"><Play className="w-5 h-5 mr-2" />Start Game</Button>
        </div>
      </motion.div>
    );
  }

  function renderActiveGame() {
    if (!activeGameId) return null;
    switch (activeGameId) {
      case 'bug-finder': return renderBugFinder();
      case 'code-puzzle': return renderCodePuzzle();
      case 'code-battle': return renderBattle();
      case 'memory-match': return renderMemoryMatch();
      case 'typing-race': return renderTypingRace();
      case 'syntax-match': return renderSyntaxMatch();
      case 'speed-quiz': return renderSpeedQuiz();
      case 'output-predictor': return renderOutputPredictor();
      case 'code-fill': return renderCodeFill();
      case 'pattern-master': return renderPatternMaster();
      case 'learn-quiz': return renderLearnQuiz();
      case 'daily-challenge': return renderDailyChallenge();
      default: return renderGameStart(activeGameId, activeGame?.name || 'Game', activeGame?.description || '', () => {});
    }
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <ConfettiParticles show={showConfetti} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {view === 'home' && <motion.div key="home" {...fadeIn}>{renderHome()}</motion.div>}
          {view === 'hub' && <motion.div key="hub" {...fadeIn}>{renderHub()}</motion.div>}
          {view === 'game' && <motion.div key="game" {...fadeIn}>{renderActiveGame()}</motion.div>}
          {view === 'leaderboard' && <motion.div key="lb" {...fadeIn}>{renderLeaderboard()}</motion.div>}
          {view === 'profile' && <motion.div key="prof" {...fadeIn}>{renderProfile()}</motion.div>}
        </AnimatePresence>
      </main>
      {/* Bottom Nav */}
      <nav className="sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          {[
            { v: 'home' as View, icon: <Home className="w-5 h-5" />, label: 'Home' },
            { v: 'hub' as View, icon: <Gamepad2 className="w-5 h-5" />, label: 'Games' },
            { v: 'leaderboard' as View, icon: <Trophy className="w-5 h-5" />, label: 'Ranks' },
            { v: 'profile' as View, icon: <User className="w-5 h-5" />, label: 'Profile' },
          ].map(n => (
            <button key={n.v} onClick={() => setView(n.v)}
              className={`flex-1 py-2 sm:py-3 flex flex-col items-center gap-0.5 transition-colors ${view === n.v ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              {n.icon}<span className="text-[10px] sm:text-xs">{n.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
