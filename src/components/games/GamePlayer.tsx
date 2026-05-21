'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getGameById } from '@/lib/games-data';
import type { GameDefinition } from '@/lib/games-data';

// Lazy-loaded game engine imports
import QuizEngine from '@/components/games/engines/QuizEngine';
import MemoryEngine from '@/components/games/engines/MemoryEngine';
import TypingEngine from '@/components/games/engines/TypingEngine';
import ReactionEngine from '@/components/games/engines/ReactionEngine';
import PuzzleEngine from '@/components/games/engines/PuzzleEngine';
import BattleEngine from '@/components/games/engines/BattleEngine';
import PatternEngine from '@/components/games/engines/PatternEngine';
import MathEngine from '@/components/games/engines/MathEngine';
import WordEngine from '@/components/games/engines/WordEngine';
import LogicEngine from '@/components/games/engines/LogicEngine';

// Game data imports
import { quizQuestions } from '@/lib/games/quiz-games';
import { memoryGames } from '@/lib/games/memory-games';
import { typingGames } from '@/lib/games/typing-games';
import { reactionGames } from '@/lib/games/reaction-games';
import { puzzleGames } from '@/lib/games/puzzle-games';
import { mathGames } from '@/lib/games/math-games';
import { logicGames } from '@/lib/games/logic-games';
import { wordGames, patternGames, battleQuestions, creativeGameData, musicGameData } from '@/lib/games/other-games';

// ── Loading Spinner ──────────────────────────────
function GameLoading({ game }: { game: GameDefinition }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="text-4xl"
      >
        {game.icon}
      </motion.div>
      <div className="text-center">
        <p className="font-bold text-sm">{game.name}</p>
        <p className="text-xs text-gray-500 mt-1">Loading game...</p>
      </div>
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    </div>
  );
}

// ── Game Config Builder ──────────────────────────
function buildGameConfig(game: GameDefinition, onBack: () => void, onComplete: (xp: number) => void) {
  const base = { gameId: game.id, title: game.name, icon: game.icon, xpReward: game.xpReward, onBack, onComplete };

  switch (game.engine) {
    case 'quiz': {
      // Check for creative/music games that use quiz engine
      if (creativeGameData[game.id]) {
        const creative = creativeGameData[game.id];
        return { ...base, questions: creative.items.map(i => ({ id: game.id + '-' + Math.random(), question: i.question, options: i.options, correctAnswer: i.correctAnswer, explanation: i.explanation, points: i.points })), timePerQuestion: 15 } as React.ComponentProps<typeof QuizEngine>['config'];
      }
      if (musicGameData[game.id]) {
        const music = musicGameData[game.id];
        return { ...base, questions: music.items.map(i => ({ id: game.id + '-' + Math.random(), question: i.question, options: i.options, correctAnswer: i.correctAnswer, explanation: i.explanation, points: i.points })), timePerQuestion: 15 } as React.ComponentProps<typeof QuizEngine>['config'];
      }
      const questions = quizQuestions[game.id] || [];
      return { ...base, questions, timePerQuestion: 20 } as React.ComponentProps<typeof QuizEngine>['config'];
    }
    case 'memory':
      return { ...base, cards: memoryGames[game.id] || [] } as React.ComponentProps<typeof MemoryEngine>['config'];
    case 'typing':
      return { ...base, snippets: typingGames[game.id] || [] } as React.ComponentProps<typeof TypingEngine>['config'];
    case 'reaction':
      return { ...base, items: reactionGames[game.id] || [], rounds: 6 } as React.ComponentProps<typeof ReactionEngine>['config'];
    case 'puzzle': {
      const puzzles = puzzleGames[game.id] || [];
      const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)] || puzzles[0];
      if (!puzzle) return null;
      return { ...base, description: puzzle.description, correctOrder: puzzle.correctOrder, timeLimit: 90 } as React.ComponentProps<typeof PuzzleEngine>['config'];
    }
    case 'battle': {
      const questions = battleQuestions[game.id] || [];
      return { ...base, questions, botName: 'CodeBot', botAvatar: '🤖' } as React.ComponentProps<typeof BattleEngine>['config'];
    }
    case 'pattern': {
      const items = patternGames[game.id] || [];
      return { ...base, items, rounds: 6 } as React.ComponentProps<typeof PatternEngine>['config'];
    }
    case 'math': {
      const problems = mathGames[game.id] || [];
      return { ...base, problems, rounds: 6 } as React.ComponentProps<typeof MathEngine>['config'];
    }
    case 'word': {
      const words = wordGames[game.id] || [];
      return { ...base, words } as React.ComponentProps<typeof WordEngine>['config'];
    }
    case 'logic': {
      const problems = logicGames[game.id] || [];
      return { ...base, problems, rounds: 6 } as React.ComponentProps<typeof LogicEngine>['config'];
    }
    default:
      return null;
  }
}

// ── Engine Renderer ──────────────────────────────
function EngineRenderer({ game, onBack }: { game: GameDefinition; onBack: () => void }) {
  const [xp, setXP] = useState(0);

  const config = useMemo(() => buildGameConfig(game, onBack, (earnedXP: number) => {
    setXP(prev => prev + earnedXP);
  }), [game, onBack]);

  if (!config) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">🚧</div>
        <p className="font-bold">Coming Soon!</p>
        <p className="text-sm text-gray-500 mt-1">This game is under construction.</p>
        <button onClick={onBack} className="mt-4 text-sm text-emerald-500 underline">Go Back</button>
      </div>
    );
  }

  switch (game.engine) {
    case 'quiz': return <QuizEngine config={config} />;
    case 'memory': return <MemoryEngine config={config} />;
    case 'typing': return <TypingEngine config={config} />;
    case 'reaction': return <ReactionEngine config={config} />;
    case 'puzzle': return <PuzzleEngine config={config} />;
    case 'battle': return <BattleEngine config={config} />;
    case 'pattern': return <PatternEngine config={config} />;
    case 'math': return <MathEngine config={config} />;
    case 'word': return <WordEngine config={config} />;
    case 'logic': return <LogicEngine config={config} />;
    default: return <GameLoading game={game} />;
  }
}

// ── GamePlayer Component ─────────────────────────
interface GamePlayerProps {
  gameId: string;
  onBack: () => void;
}

export default function GamePlayer({ gameId, onBack }: GamePlayerProps) {
  const game = useMemo(() => getGameById(gameId), [gameId]);

  if (!game) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Game not found</p>
        <button onClick={onBack} className="mt-2 text-sm text-emerald-500 underline">Go Back</button>
      </div>
    );
  }

  return (
    <motion.div
      key={gameId}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
    >
      <EngineRenderer game={game} onBack={onBack} />
    </motion.div>
  );
}
