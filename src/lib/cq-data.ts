// ══════════════════════════════════════════════════════════════
// Code Quest Data — Stub with all required exports
// ══════════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type QuestionType = 'mcq' | 'code_output' | 'bug_finder' | 'code_puzzle' | 'syntax_match' | 'fill_blank';
export type Topic = 'Variables' | 'Loops' | 'Functions' | 'Arrays' | 'Strings' | 'OOP' | 'Recursion' | 'Data Structures' | 'Algorithms' | 'Error Handling' | 'Classes' | 'Inheritance' | 'Generics' | 'Pattern Matching';

export interface ProgrammingLanguage {
  id: string;
  name: string;
  icon: string;
  difficulty: Difficulty;
  color: string;
  topics: Topic[];
}

export interface Question {
  id: string;
  type: QuestionType;
  language: string;
  topic: Topic;
  difficulty: Difficulty;
  question: string;
  code?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
  timeLimit: number;
}

export interface BugFinderData {
  id: string;
  language: string;
  difficulty: Difficulty;
  title: string;
  buggyCode: string;
  description: string;
  hint: string;
  correctLine: number;
  explanation: string;
  points: number;
}

export interface CodePuzzleData {
  id: string;
  language: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  code: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface SyntaxMatchPair {
  id: string;
  language: string;
  syntax: string;
  description: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  type: QuestionType;
  language: string;
  topic: Topic;
  difficulty: Difficulty;
  question: string;
  code?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
  bonusPoints: number;
}

// ─── Constants ──────────────────────────────────────────
export const LANGUAGES: ProgrammingLanguage[] = [
  { id: 'python', name: 'Python', icon: '🐍', difficulty: 'Easy', color: '#3776AB', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'Recursion', 'Data Structures'] },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', difficulty: 'Easy', color: '#F7DF1E', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'OOP', 'Error Handling'] },
  { id: 'java', name: 'Java', icon: '☕', difficulty: 'Medium', color: '#ED8B00', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'OOP', 'Inheritance', 'Classes'] },
  { id: 'cpp', name: 'C++', icon: '🔧', difficulty: 'Medium', color: '#00599C', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'Recursion', 'Data Structures', 'Algorithms'] },
  { id: 'typescript', name: 'TypeScript', icon: '📘', difficulty: 'Easy', color: '#3178C6', topics: ['Variables', 'Functions', 'Arrays', 'Strings', 'OOP', 'Generics', 'Error Handling'] },
];

export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Code Novice' },
  { level: 2, xpRequired: 100, title: 'Code Apprentice' },
  { level: 3, xpRequired: 300, title: 'Code Warrior' },
  { level: 4, xpRequired: 600, title: 'Code Knight' },
  { level: 5, xpRequired: 1000, title: 'Code Master' },
  { level: 6, xpRequired: 1500, title: 'Code Expert' },
  { level: 7, xpRequired: 2100, title: 'Code Sage' },
  { level: 8, xpRequired: 2800, title: 'Code Legend' },
  { level: 9, xpRequired: 3600, title: 'Code Champion' },
  { level: 10, xpRequired: 5000, title: 'Code Grandmaster' },
];

export const AVATARS = [
  '🧑‍💻', '👨‍💻', '👩‍💻', '🦊', '🐉', '🦅', '🐺', '🦁',
  '🎮', '🎯', '🚀', '⚡', '🔥', '💎', '🏆', '⭐',
];

export const BUG_FINDER_CHALLENGES: BugFinderData[] = [
  {
    id: 'bug-1', language: 'python', difficulty: 'Easy', title: 'Off-by-One Error',
    buggyCode: `def sum_to_n(n):\n    total = 0\n    for i in range(1, n):  # Bug: should be n+1\n        total += i\n    return total`,
    description: 'Find and fix the bug in this function that should sum numbers from 1 to n.',
    hint: 'Check the range bounds', correctLine: 3,
    explanation: 'range(1, n) goes up to n-1. Use range(1, n+1) to include n.',
    points: 20,
  },
  {
    id: 'bug-2', language: 'javascript', difficulty: 'Easy', title: 'Variable Scope Bug',
    buggyCode: `function createCounter() {\n  for (var i = 0; i < 5; i++) {\n    setTimeout(() => console.log(i), 100);\n  }\n}`,
    description: 'What will this function output and why?',
    hint: 'Think about var vs let', correctLine: 2,
    explanation: 'var is function-scoped, so all callbacks see the same i (5). Use let for block scoping.',
    points: 25,
  },
];

export const CODE_PUZZLES: CodePuzzleData[] = [
  {
    id: 'puzzle-1', language: 'python', difficulty: 'Easy', title: 'List Comprehension',
    description: 'What does this expression evaluate to?',
    code: `[x**2 for x in range(5) if x % 2 == 0]`,
    options: ['[0, 4, 16]', '[1, 9, 25]', '[0, 2, 4]', '[4, 16, 36]'],
    correctAnswer: 0, explanation: 'range(5) = [0,1,2,3,4]. Even numbers: 0,2,4. Squared: 0,4,16.',
    points: 15,
  },
  {
    id: 'puzzle-2', language: 'javascript', difficulty: 'Medium', title: 'Array Methods',
    description: 'What does this expression return?',
    code: `[1,2,3,4,5].filter(x => x > 2).map(x => x * 2).reduce((a,b) => a + b, 0)`,
    options: ['24', '18', '12', '30'],
    correctAnswer: 0, explanation: 'filter -> [3,4,5], map -> [6,8,10], reduce -> 24.',
    points: 20,
  },
];

export const SYNTAX_MATCH_PAIRS: SyntaxMatchPair[] = [
  { id: 'syn-1', language: 'python', syntax: 'for x in range(10):', description: 'Loop 0 to 9' },
  { id: 'syn-2', language: 'python', syntax: 'if __name__ == "__main__":', description: 'Entry point check' },
  { id: 'syn-3', language: 'javascript', syntax: 'const arr = [...new Set(arr)]', description: 'Remove duplicates' },
  { id: 'syn-4', language: 'java', syntax: 'ArrayList<String> list = new ArrayList<>()', description: 'Create list' },
  { id: 'syn-5', language: 'cpp', syntax: 'std::vector<int> v;', description: 'Create vector' },
  { id: 'syn-6', language: 'typescript', syntax: 'type Optional<T> = T | undefined', description: 'Optional type' },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alice Chen', xp: 4200, level: 7, avatar: '🦊', streak: 14 },
  { rank: 2, name: 'Bob Martinez', xp: 3800, level: 6, avatar: '🐉', streak: 10 },
  { rank: 3, name: 'Carol Williams', xp: 3100, level: 5, avatar: '🦅', streak: 8 },
  { rank: 4, name: 'David Kim', xp: 2500, level: 4, avatar: '🐺', streak: 5 },
  { rank: 5, name: 'Emma Wilson', xp: 1800, level: 3, avatar: '🦁', streak: 3 },
];

// ─── Utility Functions ──────────────────────────────────
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getLanguageById(id: string): ProgrammingLanguage | undefined {
  return LANGUAGES.find(lang => lang.id === id);
}

export function getLevelForXP(xp: number): number {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) level = threshold.level;
  }
  return level;
}

export function getNextLevel(currentXP: number): { currentLevel: number; nextLevel: number; xpNeeded: number; xpProgress: number } {
  const currentLevel = getLevelForXP(currentXP);
  const nextLevel = currentLevel + 1;
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)?.xpRequired || 0;
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === nextLevel)?.xpRequired || (currentThreshold + 500);
  const xpNeeded = nextThreshold - currentThreshold;
  const xpProgress = currentXP - currentThreshold;
  return { currentLevel, nextLevel, xpNeeded, xpProgress };
}

export function getTodayChallenge(): DailyChallenge | null {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `daily-${today}`,
    date: today,
    type: 'mcq',
    language: 'python',
    topic: 'Loops',
    difficulty: 'Medium',
    question: 'What is the output of this Python code?',
    code: 'for i in range(3):\n    for j in range(i):\n        print("*", end="")\n    print()',
    options: ['*\n**\n***', '*\n**\n***\n****', '***\n***\n***', '*\n*\n*'],
    correctAnswer: 0,
    explanation: 'i=0: no stars, i=1: *, i=2: **. Prints newline after each row.',
    points: 30,
    bonusPoints: 15,
  };
}

export function getRandomQuestions(_language?: string, _count?: number, _difficulty?: Difficulty): Question[] {
  return [
    {
      id: 'q-1', type: 'mcq', language: 'python', topic: 'Variables', difficulty: 'Easy',
      question: 'What is the output of: x = 5; x += 3; print(x)?',
      options: ['5', '8', '3', 'Error'],
      correctAnswer: 1, explanation: 'x += 3 is equivalent to x = x + 3 = 8.', points: 10, timeLimit: 15,
    },
    {
      id: 'q-2', type: 'mcq', language: 'javascript', topic: 'Arrays', difficulty: 'Easy',
      question: 'What does [1,2,3].length return?',
      options: ['2', '3', '4', 'undefined'],
      correctAnswer: 1, explanation: 'The array [1,2,3] has 3 elements.', points: 10, timeLimit: 15,
    },
    {
      id: 'q-3', type: 'code_output', language: 'python', topic: 'Loops', difficulty: 'Medium',
      question: 'What does this code print?',
      code: 'result = []\nfor i in range(1, 6):\n    if i % 2 == 0:\n        result.append(i)\nprint(result)',
      options: ['[1, 3, 5]', '[2, 4]', '[1, 2, 3, 4, 5]', '[2, 4, 6]'],
      correctAnswer: 1, explanation: 'Even numbers from 1-5 are 2 and 4.', points: 15, timeLimit: 20,
    },
  ];
}

// Legacy exports for backward compatibility
export const CQ_LANGUAGES = LANGUAGES;
export const CQ_TITLES: Record<number, string> = {};
LEVEL_THRESHOLDS.forEach(t => { CQ_TITLES[t.level] = t.title; });
export function getCQTitle(level: number): string {
  return LEVEL_THRESHOLDS.find(t => t.level === level)?.title || 'Code Novice';
}
export function getXPForLevel(level: number): number {
  return LEVEL_THRESHOLDS.find(t => t.level === level)?.xpRequired || 0;
}
