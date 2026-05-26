// Placeholder stub engines — games coming soon
'use client';
import React from 'react';

function StubEngine({ config }: { config: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="text-5xl">🚧</div>
      <p className="font-bold text-lg">{config?.title || 'Game'} — Coming Soon!</p>
      <p className="text-sm text-gray-500">This game engine is under construction.</p>
      {config?.onBack && <button onClick={config.onBack} className="mt-2 text-sm text-emerald-500 underline">Go Back</button>}
    </div>
  );
}

export const QuizEngine = StubEngine;
export const MemoryEngine = StubEngine;
export const TypingEngine = StubEngine;
export const ReactionEngine = StubEngine;
export const PuzzleEngine = StubEngine;
export const BattleEngine = StubEngine;
export const PatternEngine = StubEngine;
export const MathEngine = StubEngine;
export const WordEngine = StubEngine;
export const LogicEngine = StubEngine;
