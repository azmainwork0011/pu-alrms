// ══════════════════════════════════════════════════════════════
// Code Quest Data — Complete data layer for LearnWithGame
// ══════════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'MCQ' | 'OUTPUT_PREDICTION' | 'CODE_FIXING' | 'CODE_PUZZLE' | 'SYNTAX_MATCH' | 'FILL_BLANK';
export type Topic = 'Variables' | 'Loops' | 'Functions' | 'Arrays' | 'Strings' | 'OOP' | 'Recursion' | 'Data Structures' | 'Algorithms' | 'Error Handling' | 'Classes' | 'Inheritance' | 'Generics';

export interface ProgrammingLanguage {
  id: string;
  name: string;
  icon: string;
  difficulty: Difficulty;
  color: string;
  gradient: string;
  topics: Topic[];
}

export interface Question {
  id: string;
  type: QuestionType;
  language: string;
  topic: Topic;
  difficulty: Difficulty;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: string; // "A", "B", "C", "D" — letter of correct option
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
  correctOrder: string[];
  explanation: string;
  points: number;
}

export interface SyntaxMatchPair {
  id: string;
  languageId: string;
  concept: string;
  syntax: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  languageId: string;
  difficulty: Difficulty;
  title: string;
  description: string;
  points: number;
  bonusPoints: number;
  questions: Question[];
}

export interface LevelInfo {
  level: number;
  title: string;
  badge: string;
  xpRequired: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  avatar: string;
  streak: number;
}

export interface GameCatalog {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string; // path to image in /games/
  category: 'quiz' | 'puzzle' | 'battle' | 'speed' | 'memory' | 'typing';
  difficulty: Difficulty;
  players: 'single' | 'multi' | 'vs-bot';
  xpReward: number;
  color: string; // gradient class like "from-emerald-500 to-teal-600"
  tags: string[];
  rating: number; // 1-5
  playsCount: number;
  isPremium: boolean;
  isNew: boolean;
}

export interface MemoryMatchCard {
  id: string;
  pairId: string;
  content: string; // the concept/term
  matchContent: string; // the matching value
  category: string; // language or topic
}

export interface CodeFillChallenge {
  id: string;
  language: string;
  difficulty: Difficulty;
  title: string;
  codeTemplate: string; // code with ___BLANK___ markers
  options: string[]; // options for each blank
  correctAnswers: string[];
  explanation: string;
  points: number;
}

export interface PatternChallenge {
  id: string;
  difficulty: Difficulty;
  sequence: number[];
  nextOptions: number[];
  correctIndex: number; // index of correct answer in nextOptions
  explanation: string;
  points: number;
}

export interface TypingSnippet {
  id: string;
  language: string;
  difficulty: Difficulty;
  code: string;
  title: string;
  points: number;
}

export interface SpeedQuizSet {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  questions: Question[];
  timePerQuestion: number; // seconds
  totalPoints: number;
}

// ─── Level System ──────────────────────────────────────

export const LEVEL_THRESHOLDS: LevelInfo[] = [
  { level: 1, xpRequired: 0, title: 'Code Novice', badge: '🌱' },
  { level: 2, xpRequired: 100, title: 'Code Apprentice', badge: '📘' },
  { level: 3, xpRequired: 300, title: 'Code Warrior', badge: '⚔️' },
  { level: 4, xpRequired: 600, title: 'Code Knight', badge: '🛡️' },
  { level: 5, xpRequired: 1000, title: 'Code Master', badge: '🌟' },
  { level: 6, xpRequired: 1500, title: 'Code Expert', badge: '🔥' },
  { level: 7, xpRequired: 2100, title: 'Code Sage', badge: '💎' },
  { level: 8, xpRequired: 2800, title: 'Code Legend', badge: '👑' },
  { level: 9, xpRequired: 3600, title: 'Code Champion', badge: '🏆' },
  { level: 10, xpRequired: 5000, title: 'Code Grandmaster', badge: '🏅' },
];

// ─── Languages ──────────────────────────────────────────
export const LANGUAGES: ProgrammingLanguage[] = [
  { id: 'python', name: 'Python', icon: '🐍', difficulty: 'EASY', color: '#3776AB', gradient: 'from-blue-500 to-yellow-400', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'Recursion', 'Data Structures'] },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', difficulty: 'EASY', color: '#F7DF1E', gradient: 'from-yellow-400 to-amber-600', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'OOP', 'Error Handling'] },
  { id: 'java', name: 'Java', icon: '☕', difficulty: 'MEDIUM', color: '#ED8B00', gradient: 'from-red-500 to-orange-500', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'OOP', 'Inheritance', 'Classes'] },
  { id: 'cpp', name: 'C++', icon: '🔧', difficulty: 'MEDIUM', color: '#00599C', gradient: 'from-blue-700 to-cyan-500', topics: ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'Recursion', 'Data Structures', 'Algorithms'] },
  { id: 'typescript', name: 'TypeScript', icon: '📘', difficulty: 'EASY', color: '#3178C6', gradient: 'from-blue-600 to-blue-400', topics: ['Variables', 'Functions', 'Arrays', 'Strings', 'OOP', 'Generics', 'Error Handling'] },
];

export const AVATARS = [
  '🧑‍💻', '👨‍💻', '👩‍💻', '🦊', '🐉', '🦅', '🐺', '🦁',
  '🎮', '🎯', '🚀', '⚡', '🔥', '💎', '🏆', '⭐',
];

// ─── Questions Bank ────────────────────────────────────
const QUESTIONS_BANK: Question[] = [
  // Python - Variables
  { id: 'py-v1', type: 'MCQ', language: 'python', topic: 'Variables', difficulty: 'EASY', question: 'What is the output of: x = 5; x += 3; print(x)?', options: ['5', '8', '3', 'Error'], correctAnswer: 'B', explanation: 'x += 3 is equivalent to x = x + 3 = 8.', points: 10, timeLimit: 15 },
  { id: 'py-v2', type: 'MCQ', language: 'python', topic: 'Variables', difficulty: 'EASY', question: 'Which keyword is used to define a constant in Python?', options: ['const', 'define', 'There is no const keyword', 'final'], correctAnswer: 'C', explanation: 'Python does not have a const keyword. Use ALL_CAPS naming convention.', points: 10, timeLimit: 15 },
  { id: 'py-v3', type: 'MCQ', language: 'python', topic: 'Variables', difficulty: 'MEDIUM', question: 'What is the type of: type(3 / 2)?', options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", 'Error'], correctAnswer: 'B', explanation: 'In Python 3, / always returns a float.', points: 15, timeLimit: 15 },

  // Python - Loops
  { id: 'py-l1', type: 'MCQ', language: 'python', topic: 'Loops', difficulty: 'EASY', question: 'How many times does "print(i)" execute in: for i in range(5)?', options: ['4', '5', '6', '0'], correctAnswer: 'B', explanation: 'range(5) generates 0, 1, 2, 3, 4 — that is 5 iterations.', points: 10, timeLimit: 15 },
  { id: 'py-l2', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Loops', difficulty: 'MEDIUM', question: 'What does this code print?', codeSnippet: 'result = []\nfor i in range(1, 6):\n    if i % 2 == 0:\n        result.append(i)\nprint(result)', options: ['[1, 3, 5]', '[2, 4]', '[1, 2, 3, 4, 5]', '[2, 4, 6]'], correctAnswer: 'B', explanation: 'Even numbers from 1-5 are 2 and 4.', points: 15, timeLimit: 20 },
  { id: 'py-l3', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Loops', difficulty: 'HARD', question: 'What does this code output?', codeSnippet: 'total = 0\nfor i in range(1, 4):\n    for j in range(1, 3):\n        total += i * j\nprint(total)', options: ['18', '12', '9', '6'], correctAnswer: 'A', explanation: 'i=1: j=1,2 → 1+2=3; i=2: j=1,2 → 2+4=6; i=3: j=1,2 → 3+6=9; Total=3+6+9=18', points: 25, timeLimit: 25 },
  { id: 'py-l4', type: 'MCQ', language: 'python', topic: 'Loops', difficulty: 'EASY', question: 'What does "break" do in a loop?', options: ['Skips current iteration', 'Exits the loop entirely', 'Restarts the loop', 'Pauses the loop'], correctAnswer: 'B', explanation: '"break" immediately exits the loop.', points: 10, timeLimit: 10 },

  // Python - Functions
  { id: 'py-f1', type: 'MCQ', language: 'python', topic: 'Functions', difficulty: 'EASY', question: 'What keyword defines a function in Python?', options: ['function', 'func', 'def', 'define'], correctAnswer: 'C', explanation: 'Python uses "def" keyword to define functions.', points: 10, timeLimit: 10 },
  { id: 'py-f2', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Functions', difficulty: 'MEDIUM', question: 'What is the output?', codeSnippet: 'def greet(name="World"):\n    return f"Hello, {name}!"\n\nprint(greet())\nprint(greet("Alice"))', options: ['Hello, World!\\nHello, Alice!', 'Hello, name!\\nHello, Alice!', 'Error', 'Hello, None!\\nHello, Alice!'], correctAnswer: 'A', explanation: 'Default parameter "World" is used when no argument is passed.', points: 15, timeLimit: 20 },
  { id: 'py-f3', type: 'MCQ', language: 'python', topic: 'Functions', difficulty: 'MEDIUM', question: 'What does "return" do in a function?', options: ['Prints a value', 'Sends a value back to the caller', 'Deletes the function', 'Creates a variable'], correctAnswer: 'B', explanation: '"return" sends a value back and exits the function.', points: 10, timeLimit: 10 },

  // Python - Arrays
  { id: 'py-a1', type: 'MCQ', language: 'python', topic: 'Arrays', difficulty: 'EASY', question: 'How do you get the length of a list in Python?', options: ['list.length()', 'len(list)', 'list.size', 'length(list)'], correctAnswer: 'B', explanation: 'Python uses the built-in len() function.', points: 10, timeLimit: 10 },
  { id: 'py-a2', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Arrays', difficulty: 'MEDIUM', question: 'What does this return?', codeSnippet: 'arr = [1, 2, 3, 4, 5]\nprint(arr[1:4])', options: ['[2, 3, 4]', '[1, 2, 3, 4]', '[2, 3, 4, 5]', '[1, 2, 3]'], correctAnswer: 'A', explanation: 'Slice [1:4] gives elements at index 1, 2, 3 (exclusive end).', points: 15, timeLimit: 15 },

  // Python - Strings
  { id: 'py-s1', type: 'MCQ', language: 'python', topic: 'Strings', difficulty: 'EASY', question: 'What does "hello"[0] return?', options: ['"h"', '"hello"', '"e"', 'Error'], correctAnswer: 'A', explanation: 'String indexing starts at 0. "hello"[0] = "h".', points: 10, timeLimit: 10 },
  { id: 'py-s2', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Strings', difficulty: 'MEDIUM', question: 'What is the output?', codeSnippet: 'text = "Python"\nprint(text[::-1])', options: ['"nohtyP"', '"Python"', '"P"', 'Error'], correctAnswer: 'A', explanation: '[::-1] reverses the string.', points: 15, timeLimit: 15 },

  // Python - Recursion
  { id: 'py-r1', type: 'MCQ', language: 'python', topic: 'Recursion', difficulty: 'MEDIUM', question: 'What is the base case in a recursive function?', options: ['The first function call', 'The condition that stops recursion', 'The recursive call', 'The function name'], correctAnswer: 'B', explanation: 'The base case is the terminating condition that prevents infinite recursion.', points: 15, timeLimit: 15 },
  { id: 'py-r2', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Recursion', difficulty: 'HARD', question: 'What does factorial(5) return?', codeSnippet: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))', options: ['24', '120', '60', '25'], correctAnswer: 'B', explanation: '5! = 5×4×3×2×1 = 120', points: 25, timeLimit: 20 },

  // Python - Data Structures
  { id: 'py-d1', type: 'MCQ', language: 'python', topic: 'Data Structures', difficulty: 'EASY', question: 'Which data structure uses key-value pairs in Python?', options: ['List', 'Tuple', 'Dictionary', 'Set'], correctAnswer: 'C', explanation: 'Dictionaries (dict) store key-value pairs.', points: 10, timeLimit: 10 },
  { id: 'py-d2', type: 'MCQ', language: 'python', topic: 'Data Structures', difficulty: 'MEDIUM', question: 'What is the time complexity of dictionary lookup?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 'C', explanation: 'Python dictionaries use hash tables for O(1) average lookup.', points: 15, timeLimit: 15 },

  // JavaScript - Variables
  { id: 'js-v1', type: 'MCQ', language: 'javascript', topic: 'Variables', difficulty: 'EASY', question: 'Which keyword creates a block-scoped variable in JavaScript?', options: ['var', 'let', 'both let and const', 'function'], correctAnswer: 'C', explanation: 'Both let and const are block-scoped. var is function-scoped.', points: 10, timeLimit: 15 },
  { id: 'js-v2', type: 'MCQ', language: 'javascript', topic: 'Variables', difficulty: 'EASY', question: 'What is typeof null in JavaScript?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: 'C', explanation: 'This is a famous JavaScript bug. typeof null returns "object".', points: 15, timeLimit: 15 },
  { id: 'js-v3', type: 'MCQ', language: 'javascript', topic: 'Variables', difficulty: 'MEDIUM', question: 'What does "let" vs "const" mean?', options: ['let is for numbers, const for strings', 'let can be reassigned, const cannot', 'They are the same', 'const is faster'], correctAnswer: 'B', explanation: 'let allows reassignment, const creates a read-only binding.', points: 10, timeLimit: 10 },

  // JavaScript - Arrays
  { id: 'js-a1', type: 'MCQ', language: 'javascript', topic: 'Arrays', difficulty: 'EASY', question: 'What does [1,2,3].length return?', options: ['2', '3', '4', 'undefined'], correctAnswer: 'B', explanation: 'The array [1,2,3] has 3 elements.', points: 10, timeLimit: 10 },
  { id: 'js-a2', type: 'OUTPUT_PREDICTION', language: 'javascript', topic: 'Arrays', difficulty: 'MEDIUM', question: 'What does this return?', codeSnippet: '[1,2,3,4,5].filter(x => x > 2).map(x => x * 2).reduce((a,b) => a + b, 0)', options: ['24', '18', '12', '30'], correctAnswer: 'A', explanation: 'filter → [3,4,5], map → [6,8,10], reduce → 24.', points: 20, timeLimit: 25 },
  { id: 'js-a3', type: 'MCQ', language: 'javascript', topic: 'Arrays', difficulty: 'EASY', question: 'Which method adds an element to the END of an array?', options: ['unshift()', 'push()', 'append()', 'add()'], correctAnswer: 'B', explanation: 'push() adds to the end, unshift() adds to the beginning.', points: 10, timeLimit: 10 },

  // JavaScript - Functions
  { id: 'js-f1', type: 'MCQ', language: 'javascript', topic: 'Functions', difficulty: 'MEDIUM', question: 'What is an arrow function?', options: ['function() {}', '() => {}', 'func() {}', 'lambda() {}'], correctAnswer: 'B', explanation: 'Arrow functions use => syntax: () => {}', points: 10, timeLimit: 10 },
  { id: 'js-f2', type: 'OUTPUT_PREDICTION', language: 'javascript', topic: 'Functions', difficulty: 'MEDIUM', question: 'What does this log?', codeSnippet: 'const greet = (name = "World") => `Hello, ${name}!`;\nconsole.log(greet());\nconsole.log(greet("Bob"));', options: ['Hello, World!\\nHello, Bob!', 'Hello, undefined!\\nHello, Bob!', 'Error', 'Hello, name!\\nHello, Bob!'], correctAnswer: 'A', explanation: 'Default parameters work the same in arrow functions.', points: 15, timeLimit: 20 },

  // JavaScript - Loops
  { id: 'js-l1', type: 'MCQ', language: 'javascript', topic: 'Loops', difficulty: 'EASY', question: 'Which loop guarantees at least one execution?', options: ['for', 'while', 'do...while', 'for...in'], correctAnswer: 'C', explanation: 'do...while executes the body before checking the condition.', points: 10, timeLimit: 15 },
  { id: 'js-l2', type: 'OUTPUT_PREDICTION', language: 'javascript', topic: 'Loops', difficulty: 'MEDIUM', question: 'What does this print?', codeSnippet: 'let sum = 0;\nfor (let i = 1; i <= 4; i++) {\n  sum += i;\n}\nconsole.log(sum);', options: ['6', '10', '4', '15'], correctAnswer: 'B', explanation: '1+2+3+4 = 10', points: 15, timeLimit: 20 },

  // JavaScript - Strings
  { id: 'js-s1', type: 'MCQ', language: 'javascript', topic: 'Strings', difficulty: 'EASY', question: 'What does "hello".toUpperCase() return?', options: ['"hello"', '"HELLO"', '"Hello"', 'Error'], correctAnswer: 'B', explanation: 'toUpperCase() converts the entire string to uppercase.', points: 10, timeLimit: 10 },
  { id: 'js-s2', type: 'OUTPUT_PREDICTION', language: 'javascript', topic: 'Strings', difficulty: 'MEDIUM', question: 'What is the result?', codeSnippet: 'const str = "Hello, World!";\nconsole.log(str.slice(7, 12));', options: ['"World"', '"World!"', '"Worl"', '"ello"'], correctAnswer: 'A', explanation: 'slice(7, 12) extracts characters from index 7 to 11 (exclusive).', points: 15, timeLimit: 15 },
  { id: 'js-s3', type: 'MCQ', language: 'javascript', topic: 'Strings', difficulty: 'EASY', question: 'How do you check if a string includes a substring?', options: ['str.contains()', 'str.includes()', 'str.has()', 'str.indexOf() !== -1'], correctAnswer: 'B', explanation: 'str.includes() returns true/false for substring presence.', points: 10, timeLimit: 10 },

  // JavaScript - OOP
  { id: 'js-o1', type: 'MCQ', language: 'javascript', topic: 'OOP', difficulty: 'MEDIUM', question: 'Which keyword is used to create a class in JavaScript?', options: ['function', 'struct', 'class', 'type'], correctAnswer: 'C', explanation: 'ES6 introduced the class keyword for creating classes.', points: 10, timeLimit: 10 },
  { id: 'js-o2', type: 'MCQ', language: 'javascript', topic: 'OOP', difficulty: 'MEDIUM', question: 'What does "this" refer to in a method?', options: ['The global object', 'The object the method belongs to', 'The class name', 'undefined'], correctAnswer: 'B', explanation: 'In a method, "this" refers to the object that owns the method.', points: 10, timeLimit: 10 },

  // JavaScript - Error Handling
  { id: 'js-e1', type: 'MCQ', language: 'javascript', topic: 'Error Handling', difficulty: 'MEDIUM', question: 'Which block catches errors in JavaScript?', options: ['catch', 'try...catch', 'error', 'handle'], correctAnswer: 'B', explanation: 'try...catch is used for error handling.', points: 10, timeLimit: 10 },

  // Java - Variables
  { id: 'jv-v1', type: 'MCQ', language: 'java', topic: 'Variables', difficulty: 'EASY', question: 'Which is the correct way to declare an integer in Java?', options: ['int x = 5;', 'var x = 5;', 'integer x = 5;', 'x := 5;'], correctAnswer: 'A', explanation: 'Java uses typed declarations: int x = 5;', points: 10, timeLimit: 10 },
  { id: 'jv-v2', type: 'MCQ', language: 'java', topic: 'Variables', difficulty: 'MEDIUM', question: 'What is the default value of a boolean field in Java?', options: ['true', 'false', 'null', '0'], correctAnswer: 'B', explanation: 'Boolean fields default to false in Java.', points: 10, timeLimit: 10 },

  // Java - Loops
  { id: 'jv-l1', type: 'OUTPUT_PREDICTION', language: 'java', topic: 'Loops', difficulty: 'EASY', question: 'What does this print?', codeSnippet: 'int sum = 0;\nfor (int i = 1; i <= 5; i++) {\n    sum += i;\n}\nSystem.out.println(sum);', options: ['10', '15', '5', '20'], correctAnswer: 'B', explanation: '1+2+3+4+5 = 15', points: 15, timeLimit: 20 },
  { id: 'jv-l2', type: 'MCQ', language: 'java', topic: 'Loops', difficulty: 'EASY', question: 'What is the enhanced for loop in Java?', options: ['for (int i : array)', 'for_each(array)', 'loop(array)', 'foreach (int i in array)'], correctAnswer: 'A', explanation: 'Java uses: for (Type var : collection)', points: 10, timeLimit: 10 },

  // Java - OOP
  { id: 'jv-o1', type: 'MCQ', language: 'java', topic: 'OOP', difficulty: 'MEDIUM', question: 'What keyword is used for inheritance in Java?', options: ['inherits', 'implements', 'extends', 'super'], correctAnswer: 'C', explanation: 'Java uses "extends" for class inheritance.', points: 15, timeLimit: 15 },
  { id: 'jv-o2', type: 'MCQ', language: 'java', topic: 'Classes', difficulty: 'MEDIUM', question: 'What is the default value of an int field in a Java class?', options: ['1', '0', 'null', 'undefined'], correctAnswer: 'B', explanation: 'Numeric fields default to 0 in Java.', points: 10, timeLimit: 15 },

  // Java - Inheritance
  { id: 'jv-i1', type: 'MCQ', language: 'java', topic: 'Inheritance', difficulty: 'HARD', question: 'Can a Java class extend multiple classes?', options: ['Yes', 'No, only one', 'Up to 3', 'Yes with the multi keyword'], correctAnswer: 'B', explanation: 'Java supports single class inheritance (but can implement multiple interfaces).', points: 20, timeLimit: 15 },

  // Java - Functions
  { id: 'jv-f1', type: 'MCQ', language: 'java', topic: 'Functions', difficulty: 'EASY', question: 'What is a method in Java?', options: ['A variable', 'A function inside a class', 'A loop', 'A conditional'], correctAnswer: 'B', explanation: 'In Java, functions are called methods and must be inside a class.', points: 10, timeLimit: 10 },

  // Java - Arrays
  { id: 'jv-a1', type: 'MCQ', language: 'java', topic: 'Arrays', difficulty: 'EASY', question: 'How do you create an array in Java?', options: ['int[] arr = {1,2,3}', 'arr = [1,2,3]', 'list arr = [1,2,3]', 'Array arr = new(1,2,3)'], correctAnswer: 'A', explanation: 'Java uses: int[] arr = {1, 2, 3};', points: 10, timeLimit: 10 },

  // Java - Strings
  { id: 'jv-s1', type: 'MCQ', language: 'java', topic: 'Strings', difficulty: 'MEDIUM', question: 'How do you compare strings in Java?', options: ['str1 == str2', 'str1.equals(str2)', 'str1 === str2', 'compare(str1, str2)'], correctAnswer: 'B', explanation: 'Use .equals() for value comparison. == compares references.', points: 15, timeLimit: 15 },

  // C++ - Variables
  { id: 'cp-v1', type: 'MCQ', language: 'cpp', topic: 'Variables', difficulty: 'EASY', question: 'Which is the correct way to declare a float in C++?', options: ['float x = 3.14;', 'Float x = 3.14;', 'f x = 3.14;', 'decimal x = 3.14;'], correctAnswer: 'A', explanation: 'C++ uses lowercase float, int, double, etc.', points: 10, timeLimit: 10 },

  // C++ - Loops
  { id: 'cp-l1', type: 'OUTPUT_PREDICTION', language: 'cpp', topic: 'Loops', difficulty: 'MEDIUM', question: 'What does this print?', codeSnippet: 'int x = 10;\nwhile (x > 5) {\n    x -= 2;\n}\ncout << x;', options: ['5', '4', '3', '6'], correctAnswer: 'B', explanation: '10→8→6→4. When x=4, 4>5 is false, so loop stops. x=4.', points: 15, timeLimit: 20 },

  // C++ - Data Structures
  { id: 'cp-d1', type: 'MCQ', language: 'cpp', topic: 'Data Structures', difficulty: 'MEDIUM', question: 'Which STL container provides key-value pairs?', options: ['vector', 'map', 'set', 'list'], correctAnswer: 'B', explanation: 'std::map provides key-value pairs stored in sorted order.', points: 15, timeLimit: 15 },

  // C++ - Arrays
  { id: 'cp-a1', type: 'OUTPUT_PREDICTION', language: 'cpp', topic: 'Arrays', difficulty: 'EASY', question: 'What does this print?', codeSnippet: 'int arr[] = {10, 20, 30};\ncout << arr[1];', options: ['10', '20', '30', 'Error'], correctAnswer: 'B', explanation: 'Array indexing starts at 0, so arr[1] is 20.', points: 10, timeLimit: 15 },

  // C++ - Functions
  { id: 'cp-f1', type: 'MCQ', language: 'cpp', topic: 'Functions', difficulty: 'EASY', question: 'What does & mean in a function parameter?', options: ['Logical AND', 'Bitwise AND', 'Pass by reference', 'Address of'], correctAnswer: 'C', explanation: 'In function parameters, & means pass by reference.', points: 10, timeLimit: 10 },

  // C++ - Algorithms
  { id: 'cp-al1', type: 'MCQ', language: 'cpp', topic: 'Algorithms', difficulty: 'MEDIUM', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 'B', explanation: 'Binary search halves the search space each step: O(log n).', points: 15, timeLimit: 15 },

  // C++ - Strings
  { id: 'cp-s1', type: 'MCQ', language: 'cpp', topic: 'Strings', difficulty: 'EASY', question: 'Which header is needed for std::string?', options: ['<string>', '<cstring>', '<String>', '<text>'], correctAnswer: 'A', explanation: '#include <string> is needed for std::string.', points: 10, timeLimit: 10 },

  // TypeScript - Variables
  { id: 'ts-v1', type: 'MCQ', language: 'typescript', topic: 'Variables', difficulty: 'EASY', question: 'How do you define a string type in TypeScript?', options: ['str name = "hi"', 'name: string = "hi"', 'String name = "hi"', 'name := "hi"'], correctAnswer: 'B', explanation: 'TypeScript uses colon annotation: name: string = "hi"', points: 10, timeLimit: 10 },

  // TypeScript - Functions
  { id: 'ts-f1', type: 'MCQ', language: 'typescript', topic: 'Functions', difficulty: 'MEDIUM', question: 'How do you type the return value of a function?', options: ['function add(a: number, b: number) -> number', 'function add(a: number, b: number): number', 'function add(a: number, b: number) => number', 'def add(a: number, b: number): number'], correctAnswer: 'B', explanation: 'TypeScript uses colon after the parameter list: ): number', points: 15, timeLimit: 15 },

  // TypeScript - Generics
  { id: 'ts-g1', type: 'MCQ', language: 'typescript', topic: 'Generics', difficulty: 'HARD', question: 'What is the purpose of generics in TypeScript?', options: ['To make code faster', 'To create reusable components with type safety', 'To add comments', 'To handle errors'], correctAnswer: 'B', explanation: 'Generics allow creating reusable components that work with any type while maintaining type safety.', points: 20, timeLimit: 20 },

  // TypeScript - OOP
  { id: 'ts-o1', type: 'MCQ', language: 'typescript', topic: 'OOP', difficulty: 'MEDIUM', question: 'How do you define an interface in TypeScript?', options: ['struct Person {}', 'class Person {}', 'interface Person {}', 'type Person {}'], correctAnswer: 'C', explanation: 'TypeScript uses the "interface" keyword.', points: 10, timeLimit: 10 },

  // TypeScript - Error Handling
  { id: 'ts-e1', type: 'MCQ', language: 'typescript', topic: 'Error Handling', difficulty: 'MEDIUM', question: 'How do you create a custom error type in TypeScript?', options: ['throw new Error("msg")', 'class CustomError extends Error {}', 'error("msg")', 'raise Error("msg")'], correctAnswer: 'B', explanation: 'You extend the Error class to create custom error types.', points: 15, timeLimit: 15 },

  // TypeScript - Arrays
  { id: 'ts-a1', type: 'MCQ', language: 'typescript', topic: 'Arrays', difficulty: 'EASY', question: 'How do you type an array of numbers in TypeScript?', options: ['number[]', 'Array(number)', 'list<number>', '[number]'], correctAnswer: 'A', explanation: 'number[] or Array<number> are both valid in TypeScript.', points: 10, timeLimit: 10 },
  { id: 'ts-a2', type: 'OUTPUT_PREDICTION', language: 'typescript', topic: 'Arrays', difficulty: 'MEDIUM', question: 'What does this return?', codeSnippet: 'const arr: number[] = [5, 3, 8, 1];\narr.sort((a, b) => a - b);\nconsole.log(arr[0]);', options: ['1', '5', '8', '3'], correctAnswer: 'A', explanation: 'Sort ascending: [1, 3, 5, 8]. arr[0] = 1.', points: 15, timeLimit: 20 },

  // TypeScript - Strings
  { id: 'ts-s1', type: 'MCQ', language: 'typescript', topic: 'Strings', difficulty: 'EASY', question: 'How do you create a template literal?', options: ['"Hello " + name', '`Hello ${name}`', '"Hello #{name}"', 'f"Hello {name}"'], correctAnswer: 'B', explanation: 'Template literals use backticks: `Hello ${name}`', points: 10, timeLimit: 10 },
];

// ─── Bug Finder Challenges ─────────────────────────────
export const BUG_FINDER_CHALLENGES: BugFinderData[] = [
  {
    id: 'bug-1', language: 'python', difficulty: 'EASY', title: 'Off-by-One Error',
    buggyCode: `def sum_to_n(n):\n    total = 0\n    for i in range(1, n):  # Bug: should be n+1\n        total += i\n    return total`,
    description: 'Find and fix the bug in this function that should sum numbers from 1 to n.',
    hint: 'Check the range bounds', correctLine: 3,
    explanation: 'range(1, n) goes up to n-1. Use range(1, n+1) to include n.',
    points: 20,
  },
  {
    id: 'bug-2', language: 'javascript', difficulty: 'EASY', title: 'Variable Scope Bug',
    buggyCode: `function createCounter() {\n  for (var i = 0; i < 5; i++) {\n    setTimeout(() => console.log(i), 100);\n  }\n}`,
    description: 'What will this function output and why?',
    hint: 'Think about var vs let', correctLine: 2,
    explanation: 'var is function-scoped, so all callbacks see the same i (5). Use let for block scoping.',
    points: 25,
  },
  {
    id: 'bug-3', language: 'python', difficulty: 'MEDIUM', title: 'List Mutation Bug',
    buggyCode: `def remove_negatives(numbers):\n    for num in numbers:\n        if num < 0:\n            numbers.remove(num)\n    return numbers`,
    description: 'This function should remove negative numbers, but misses some. Why?',
    hint: 'Modifying a list while iterating over it', correctLine: 2,
    explanation: 'Removing elements during iteration skips items. Use list comprehension: [n for n in numbers if n >= 0]',
    points: 30,
  },
  {
    id: 'bug-4', language: 'javascript', difficulty: 'MEDIUM', title: 'Comparison Bug',
    buggyCode: `function checkAge(age) {\n  if (age = 18) {\n    return "Access granted";\n  }\n  return "Access denied";\n}`,
    description: 'This function always grants access. Find the bug.',
    hint: 'Check the comparison operator', correctLine: 2,
    explanation: '= is assignment, not comparison. Use === for equality check.',
    points: 20,
  },
];

// ─── Code Puzzles ──────────────────────────────────────
export const CODE_PUZZLES: CodePuzzleData[] = [
  {
    id: 'puzzle-1', language: 'python', difficulty: 'EASY', title: 'List Comprehension Order',
    description: 'Arrange the code to create a list of even squares from 0 to 16.',
    correctOrder: ['evens = [', '    x ** 2', '    for x in range(9)', '    if x % 2 == 0', ']'],
    explanation: 'Correct list comprehension: evens = [x**2 for x in range(9) if x%2==0] → [0, 4, 16, 36, 64]',
    points: 20,
  },
  {
    id: 'puzzle-2', language: 'javascript', difficulty: 'MEDIUM', title: 'Array Pipeline Order',
    description: 'Arrange the steps to filter, map, and sum an array.',
    correctOrder: ['const nums = [1, 2, 3, 4, 5, 6];', 'const result = nums', '    .filter(n => n % 2 === 0)', '    .map(n => n * 3)', '    .reduce((sum, n) => sum + n, 0);'],
    explanation: 'Filter evens [2,4,6], multiply by 3 → [6,12,18], sum → 36.',
    points: 25,
  },
  {
    id: 'puzzle-3', language: 'python', difficulty: 'MEDIUM', title: 'Function Definition Order',
    description: 'Arrange the code for a function that checks if a number is prime.',
    correctOrder: ['def is_prime(n):', '    if n < 2:', '        return False', '    for i in range(2, int(n**0.5) + 1):', '        if n % i == 0:', '            return False', '    return True'],
    explanation: 'Check divisibility from 2 to √n. If none found, it is prime.',
    points: 30,
  },
  {
    id: 'puzzle-4', language: 'javascript', difficulty: 'EASY', title: 'Object Destructuring',
    description: 'Arrange the code to destructure and use an object.',
    correctOrder: ['const user = { name: "Alice", age: 25, role: "dev" };', 'const { name, age, role } = user;', 'console.log(`${name} is ${age}`);', 'console.log(`Role: ${role}`);'],
    explanation: 'Object destructuring extracts properties into variables.',
    points: 15,
  },
];

// ─── Syntax Match Pairs ────────────────────────────────
export const SYNTAX_MATCH_PAIRS: SyntaxMatchPair[] = [
  { id: 'syn-1', languageId: 'python', concept: 'Print to console', syntax: 'print("Hello")' },
  { id: 'syn-2', languageId: 'python', concept: 'Define constant', syntax: 'MAX_SIZE = 100' },
  { id: 'syn-3', languageId: 'python', concept: 'For loop (1 to 5)', syntax: 'for i in range(1, 6):' },
  { id: 'syn-4', languageId: 'python', concept: 'Function declaration', syntax: 'def my_func():' },
  { id: 'syn-5', languageId: 'python', concept: 'List comprehension', syntax: '[x**2 for x in range(10)]' },
  { id: 'syn-6', languageId: 'python', concept: 'While loop', syntax: 'while condition:' },

  { id: 'syn-7', languageId: 'javascript', concept: 'Print to console', syntax: 'console.log("Hello")' },
  { id: 'syn-8', languageId: 'javascript', concept: 'Define constant', syntax: 'const MAX = 100' },
  { id: 'syn-9', languageId: 'javascript', concept: 'For loop (1 to 5)', syntax: 'for (let i = 1; i <= 5; i++)' },
  { id: 'syn-10', languageId: 'javascript', concept: 'Function declaration', syntax: 'function myFunc() {}' },
  { id: 'syn-11', languageId: 'javascript', concept: 'Arrow function', syntax: 'const fn = () => {}' },
  { id: 'syn-12', languageId: 'javascript', concept: 'Remove duplicates', syntax: '[...new Set(arr)]' },

  { id: 'syn-13', languageId: 'java', concept: 'Print to console', syntax: 'System.out.println("Hello")' },
  { id: 'syn-14', languageId: 'java', concept: 'Define constant', syntax: 'static final int MAX = 100' },
  { id: 'syn-15', languageId: 'java', concept: 'For loop (1 to 5)', syntax: 'for (int i = 1; i <= 5; i++)' },
  { id: 'syn-16', languageId: 'java', concept: 'Function declaration', syntax: 'void myMethod() {}' },
  { id: 'syn-17', languageId: 'java', concept: 'Create list', syntax: 'ArrayList<String> list = new ArrayList<>()' },
  { id: 'syn-18', languageId: 'java', concept: 'Class declaration', syntax: 'public class MyClass {}' },

  { id: 'syn-19', languageId: 'cpp', concept: 'Print to console', syntax: 'std::cout << "Hello"' },
  { id: 'syn-20', languageId: 'cpp', concept: 'Define constant', syntax: 'const int MAX = 100' },
  { id: 'syn-21', languageId: 'cpp', concept: 'For loop (1 to 5)', syntax: 'for (int i = 1; i <= 5; i++)' },
  { id: 'syn-22', languageId: 'cpp', concept: 'Function declaration', syntax: 'void myFunction() {}' },
  { id: 'syn-23', languageId: 'cpp', concept: 'Create vector', syntax: 'std::vector<int> v;' },
  { id: 'syn-24', languageId: 'cpp', concept: 'Pointer declaration', syntax: 'int* ptr = &value;' },

  { id: 'syn-25', languageId: 'typescript', concept: 'Print to console', syntax: 'console.log("Hello")' },
  { id: 'syn-26', languageId: 'typescript', concept: 'Define constant', syntax: 'const MAX: number = 100' },
  { id: 'syn-27', languageId: 'typescript', concept: 'For loop (1 to 5)', syntax: 'for (let i = 1; i <= 5; i++)' },
  { id: 'syn-28', languageId: 'typescript', concept: 'Function with types', syntax: 'function add(a: number, b: number): number' },
  { id: 'syn-29', languageId: 'typescript', concept: 'Interface definition', syntax: 'interface User { name: string }' },
  { id: 'syn-30', languageId: 'typescript', concept: 'Optional type', syntax: 'type Optional<T> = T | undefined' },
];

// ─── Leaderboard ───────────────────────────────────────
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Alice Chen', xp: 4200, level: 7, avatar: '🦊', streak: 14 },
  { rank: 2, name: 'Bob Martinez', xp: 3800, level: 6, avatar: '🐉', streak: 10 },
  { rank: 3, name: 'Carol Williams', xp: 3100, level: 5, avatar: '🦅', streak: 8 },
  { rank: 4, name: 'David Kim', xp: 2500, level: 4, avatar: '🐺', streak: 5 },
  { rank: 5, name: 'Emma Wilson', xp: 1800, level: 3, avatar: '🦁', streak: 3 },
];

// ─── Game Catalog ──────────────────────────────────────
export const GAME_CATALOG: GameCatalog[] = [
  {
    id: 'bug-finder',
    name: 'Bug Detective',
    description: 'Find and fix bugs hidden in real code snippets. Sharpen your debugging skills!',
    icon: '🔍',
    image: '/games/bug-finder.png',
    category: 'puzzle',
    difficulty: 'MEDIUM',
    players: 'single',
    xpReward: 30,
    color: 'from-rose-500 to-orange-500',
    tags: ['debugging', 'logic', 'code-review'],
    rating: 4.5,
    playsCount: 12840,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'code-puzzle',
    name: 'Code Puzzle',
    description: 'Arrange scrambled code blocks into the correct order to build working programs.',
    icon: '🧩',
    image: '/games/code-puzzle.png',
    category: 'puzzle',
    difficulty: 'MEDIUM',
    players: 'single',
    xpReward: 25,
    color: 'from-violet-500 to-purple-600',
    tags: ['logic', 'syntax', 'problem-solving'],
    rating: 4.3,
    playsCount: 10250,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'code-battle',
    name: 'Code Battle',
    description: 'Challenge the AI bot to a coding duel! Answer faster and more accurately to win.',
    icon: '⚔️',
    image: '/games/code-battle.png',
    category: 'battle',
    difficulty: 'MEDIUM',
    players: 'vs-bot',
    xpReward: 50,
    color: 'from-red-500 to-rose-600',
    tags: ['competitive', 'speed', 'AI-challenge'],
    rating: 4.8,
    playsCount: 18920,
    isPremium: false,
    isNew: true,
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to match coding concepts with their definitions. Train your memory!',
    icon: '🃏',
    image: '/games/memory-match.png',
    category: 'memory',
    difficulty: 'EASY',
    players: 'single',
    xpReward: 20,
    color: 'from-emerald-500 to-teal-600',
    tags: ['memory', 'concepts', 'terminology'],
    rating: 4.2,
    playsCount: 15670,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'typing-race',
    name: 'Typing Race',
    description: 'Race against the clock by typing code snippets as fast and accurately as you can!',
    icon: '⌨️',
    image: '/games/typing-race.png',
    category: 'typing',
    difficulty: 'EASY',
    players: 'single',
    xpReward: 20,
    color: 'from-amber-500 to-yellow-500',
    tags: ['typing', 'speed', 'accuracy'],
    rating: 4.6,
    playsCount: 21300,
    isPremium: false,
    isNew: true,
  },
  {
    id: 'syntax-match',
    name: 'Syntax Match',
    description: 'Match programming concepts to their correct syntax across different languages.',
    icon: '🔗',
    image: '/games/syntax-match.png',
    category: 'memory',
    difficulty: 'EASY',
    players: 'single',
    xpReward: 20,
    color: 'from-cyan-500 to-blue-500',
    tags: ['syntax', 'languages', 'matching'],
    rating: 4.1,
    playsCount: 9870,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'speed-quiz',
    name: 'Speed Quiz',
    description: 'Rapid-fire questions! Answer as many as you can before time runs out.',
    icon: '⚡',
    image: '/games/speed-quiz.png',
    category: 'speed',
    difficulty: 'MEDIUM',
    players: 'single',
    xpReward: 35,
    color: 'from-orange-500 to-red-500',
    tags: ['speed', 'quiz', 'timed'],
    rating: 4.7,
    playsCount: 24500,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'output-predictor',
    name: 'Output Predictor',
    description: 'Read code snippets and predict the exact output. Master code tracing!',
    icon: '🔮',
    image: '/games/output-predictor.png',
    category: 'quiz',
    difficulty: 'MEDIUM',
    players: 'single',
    xpReward: 25,
    color: 'from-fuchsia-500 to-pink-600',
    tags: ['output', 'tracing', 'logic'],
    rating: 4.4,
    playsCount: 13400,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'code-fill',
    name: 'Code Fill',
    description: 'Fill in the blanks to complete real code snippets. Test your syntax mastery!',
    icon: '✏️',
    image: '/games/code-fill.png',
    category: 'puzzle',
    difficulty: 'MEDIUM',
    players: 'single',
    xpReward: 25,
    color: 'from-lime-500 to-green-600',
    tags: ['fill-blank', 'syntax', 'completion'],
    rating: 4.3,
    playsCount: 11200,
    isPremium: false,
    isNew: true,
  },
  {
    id: 'pattern-master',
    name: 'Pattern Master',
    description: 'Recognize number patterns and sequences. Sharpen your algorithmic thinking!',
    icon: '🧠',
    image: '/games/pattern-master.png',
    category: 'quiz',
    difficulty: 'HARD',
    players: 'single',
    xpReward: 35,
    color: 'from-indigo-500 to-violet-600',
    tags: ['patterns', 'algorithms', 'logic'],
    rating: 4.5,
    playsCount: 8900,
    isPremium: false,
    isNew: true,
  },
  {
    id: 'learn-quiz',
    name: 'Learn Quiz',
    description: 'Topic-based quizzes to deepen your understanding of specific programming concepts.',
    icon: '📚',
    image: '/games/learn-quiz.png',
    category: 'quiz',
    difficulty: 'EASY',
    players: 'single',
    xpReward: 20,
    color: 'from-teal-500 to-emerald-600',
    tags: ['learning', 'topics', 'fundamentals'],
    rating: 4.6,
    playsCount: 30100,
    isPremium: false,
    isNew: false,
  },
  {
    id: 'daily-challenge',
    name: 'Daily Challenge',
    description: 'A fresh challenge every day! Complete it for bonus XP and keep your streak alive.',
    icon: '📅',
    image: '/games/daily-challenge.png',
    category: 'quiz',
    difficulty: 'MEDIUM',
    players: 'single',
    xpReward: 45,
    color: 'from-amber-500 to-orange-600',
    tags: ['daily', 'streak', 'bonus-xp'],
    rating: 4.9,
    playsCount: 27800,
    isPremium: false,
    isNew: false,
  },
];

// ─── Memory Match Cards ────────────────────────────────
export const MEMORY_MATCH_CARDS: MemoryMatchCard[] = [
  // Python concepts
  { id: 'mm-1', pairId: 'py-list', content: 'Python: Ordered, mutable collection', matchContent: 'List []', category: 'Python' },
  { id: 'mm-2', pairId: 'py-dict', content: 'Python: Key-value pairs', matchContent: 'Dictionary {}', category: 'Python' },
  { id: 'mm-3', pairId: 'py-tuple', content: 'Python: Ordered, immutable collection', matchContent: 'Tuple ()', category: 'Python' },
  { id: 'mm-4', pairId: 'py-set', content: 'Python: Unordered, unique elements', matchContent: 'Set {}', category: 'Python' },
  // JavaScript concepts
  { id: 'mm-5', pairId: 'js-let', content: 'JavaScript: Block-scoped, reassignable', matchContent: 'let', category: 'JavaScript' },
  { id: 'mm-6', pairId: 'js-const', content: 'JavaScript: Block-scoped, read-only', matchContent: 'const', category: 'JavaScript' },
  { id: 'mm-7', pairId: 'js-var', content: 'JavaScript: Function-scoped, hoisted', matchContent: 'var', category: 'JavaScript' },
  { id: 'mm-8', pairId: 'js-arrow', content: 'JavaScript: Concise function syntax', matchContent: 'Arrow Function =>', category: 'JavaScript' },
  // Java concepts
  { id: 'mm-9', pairId: 'jv-class', content: 'Java: Blueprint for objects', matchContent: 'class', category: 'Java' },
  { id: 'mm-10', pairId: 'jv-extends', content: 'Java: Keyword for class inheritance', matchContent: 'extends', category: 'Java' },
  { id: 'mm-11', pairId: 'jv-interface', content: 'Java: Contract for implementing classes', matchContent: 'interface', category: 'Java' },
  { id: 'mm-12', pairId: 'jv-final', content: 'Java: Prevents modification/inheritance', matchContent: 'final', category: 'Java' },
  // General CS concepts
  { id: 'mm-13', pairId: 'cs-stack', content: 'CS: LIFO data structure', matchContent: 'Stack', category: 'CS Fundamentals' },
  { id: 'mm-14', pairId: 'cs-queue', content: 'CS: FIFO data structure', matchContent: 'Queue', category: 'CS Fundamentals' },
  { id: 'mm-15', pairId: 'cs-oop', content: 'CS: Encapsulation, Inheritance, Polymorphism', matchContent: 'OOP', category: 'CS Fundamentals' },
  { id: 'mm-16', pairId: 'cs-api', content: 'CS: Interface for software communication', matchContent: 'API', category: 'CS Fundamentals' },
];

// ─── Code Fill Challenges ──────────────────────────────
export const CODE_FILL_CHALLENGES: CodeFillChallenge[] = [
  {
    id: 'cf-1',
    language: 'python',
    difficulty: 'EASY',
    title: 'For Loop Sum',
    codeTemplate: `def sum_to_n(n):\n    total = 0\n    for i in ___BLANK___(1, n + 1):\n        total += i\n    ___BLANK___ total`,
    options: ['range', 'return', 'len', 'print'],
    correctAnswers: ['range', 'return'],
    explanation: 'Use range() to generate numbers from 1 to n, and return the accumulated total.',
    points: 15,
  },
  {
    id: 'cf-2',
    language: 'javascript',
    difficulty: 'EASY',
    title: 'Array Filter',
    codeTemplate: `function getEvens(arr) {\n  return arr.___BLANK___(x => x % 2 ___BLANK___ 0);\n}`,
    options: ['filter', '===', 'map', '!==', 'find'],
    correctAnswers: ['filter', '==='],
    explanation: 'Use filter() to select elements, and === to check strict equality with 0.',
    points: 15,
  },
  {
    id: 'cf-3',
    language: 'java',
    difficulty: 'MEDIUM',
    title: 'String Reverser',
    codeTemplate: `public static String reverse(String s) {\n    StringBuilder sb = new ___BLANK___(s);\n    return sb.___BLANK___().toString();\n}`,
    options: ['StringBuilder', 'reverse', 'String', 'toString', 'append'],
    correctAnswers: ['StringBuilder', 'reverse'],
    explanation: 'Create a StringBuilder from the string, then use reverse() to reverse it.',
    points: 20,
  },
  {
    id: 'cf-4',
    language: 'python',
    difficulty: 'MEDIUM',
    title: 'Dictionary Comprehension',
    codeTemplate: `def square_dict(numbers):\n    return {n: n ___BLANK___ 2 for n in ___BLANK___}`,
    options: ['**', 'numbers', '**', 'range', '*'],
    correctAnswers: ['**', 'numbers'],
    explanation: 'Use ** operator for exponentiation in a dictionary comprehension over the input list.',
    points: 20,
  },
  {
    id: 'cf-5',
    language: 'javascript',
    difficulty: 'MEDIUM',
    title: 'Object Destructuring',
    codeTemplate: `const user = { name: "Alice", age: 25 };\nconst { ___BLANK___, ___BLANK___ } = user;\nconsole.log(name, age);`,
    options: ['name', 'age', 'user', 'const', 'let'],
    correctAnswers: ['name', 'age'],
    explanation: 'Destructure the object by extracting property names: { name, age } = user.',
    points: 20,
  },
  {
    id: 'cf-6',
    language: 'python',
    difficulty: 'HARD',
    title: 'Binary Search',
    codeTemplate: `def binary_search(arr, target):\n    left, right = 0, ___BLANK___(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            ___BLANK___ mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
    options: ['len', 'return', 'range', 'print', 'mid'],
    correctAnswers: ['len', 'return'],
    explanation: 'Use len() to get the right boundary and return mid when the target is found.',
    points: 30,
  },
  {
    id: 'cf-7',
    language: 'javascript',
    difficulty: 'HARD',
    title: 'Promise Chain',
    codeTemplate: `function fetchData(url) {\n  return ___BLANK___(url)\n    .then(res => res.___BLANK___())\n    .then(data => console.log(data))\n    .___BLANK___(err => console.error(err));\n}`,
    options: ['fetch', 'json', 'catch', 'then', 'get'],
    correctAnswers: ['fetch', 'json', 'catch'],
    explanation: 'Fetch the URL, parse JSON with .json(), and handle errors with .catch().',
    points: 30,
  },
  {
    id: 'cf-8',
    language: 'java',
    difficulty: 'EASY',
    title: 'ArrayList Basics',
    codeTemplate: `ArrayList<String> list = new ___BLANK___<>();\nlist.___BLANK___("Hello");\nlist.___BLANK___("World");\nSystem.out.println(list.get(0));`,
    options: ['ArrayList', 'add', 'ArrayList', 'push', 'insert'],
    correctAnswers: ['ArrayList', 'add'],
    explanation: 'Create an ArrayList with the diamond operator <> and use add() to insert elements.',
    points: 15,
  },
];

// ─── Pattern Challenges ────────────────────────────────
export const PATTERN_CHALLENGES: PatternChallenge[] = [
  {
    id: 'pat-1',
    difficulty: 'EASY',
    sequence: [2, 4, 6, 8, 10],
    nextOptions: [11, 12, 14, 20],
    correctIndex: 1,
    explanation: 'Arithmetic progression: each number increases by 2. Next = 10 + 2 = 12.',
    points: 10,
  },
  {
    id: 'pat-2',
    difficulty: 'EASY',
    sequence: [1, 4, 9, 16, 25],
    nextOptions: [30, 35, 36, 49],
    correctIndex: 2,
    explanation: 'Perfect squares: 1², 2², 3², 4², 5². Next = 6² = 36.',
    points: 10,
  },
  {
    id: 'pat-3',
    difficulty: 'MEDIUM',
    sequence: [1, 1, 2, 3, 5, 8],
    nextOptions: [11, 12, 13, 15],
    correctIndex: 2,
    explanation: 'Fibonacci sequence: each number is the sum of the two before it. 5 + 8 = 13.',
    points: 15,
  },
  {
    id: 'pat-4',
    difficulty: 'MEDIUM',
    sequence: [3, 6, 12, 24, 48],
    nextOptions: [72, 84, 96, 100],
    correctIndex: 2,
    explanation: 'Geometric progression: each number doubles. 48 × 2 = 96.',
    points: 15,
  },
  {
    id: 'pat-5',
    difficulty: 'MEDIUM',
    sequence: [2, 6, 12, 20, 30],
    nextOptions: [36, 40, 42, 44],
    correctIndex: 2,
    explanation: 'Differences increase by 2: +4, +6, +8, +10. Next difference = +12, so 30 + 12 = 42.',
    points: 15,
  },
  {
    id: 'pat-6',
    difficulty: 'HARD',
    sequence: [1, 3, 7, 15, 31],
    nextOptions: [47, 55, 63, 65],
    correctIndex: 2,
    explanation: 'Pattern: n × 2 + 1. 1×2+1=3, 3×2+1=7, 7×2+1=15, 15×2+1=31, 31×2+1=63. (Also 2ⁿ - 1)',
    points: 20,
  },
  {
    id: 'pat-7',
    difficulty: 'HARD',
    sequence: [1, 8, 27, 64, 125],
    nextOptions: [150, 196, 216, 256],
    correctIndex: 2,
    explanation: 'Perfect cubes: 1³, 2³, 3³, 4³, 5³. Next = 6³ = 216.',
    points: 20,
  },
  {
    id: 'pat-8',
    difficulty: 'HARD',
    sequence: [2, 3, 5, 7, 11, 13],
    nextOptions: [14, 15, 17, 19],
    correctIndex: 2,
    explanation: 'Prime numbers in order: 2, 3, 5, 7, 11, 13. Next prime = 17.',
    points: 25,
  },
  {
    id: 'pat-9',
    difficulty: 'EASY',
    sequence: [10, 7, 4, 1],
    nextOptions: [-1, -2, -3, 0],
    correctIndex: 1,
    explanation: 'Subtract 3 each time: 1 - 3 = -2.',
    points: 10,
  },
  {
    id: 'pat-10',
    difficulty: 'MEDIUM',
    sequence: [1, 2, 4, 7, 11],
    nextOptions: [14, 15, 16, 17],
    correctIndex: 2,
    explanation: 'Differences increase by 1: +1, +2, +3, +4. Next difference = +5, so 11 + 5 = 16.',
    points: 15,
  },
];

// ─── Typing Snippets ───────────────────────────────────
export const TYPING_SNIPPETS: TypingSnippet[] = [
  {
    id: 'ts-1',
    language: 'python',
    difficulty: 'EASY',
    title: 'Hello World',
    code: `print("Hello, World!")`,
    points: 10,
  },
  {
    id: 'ts-2',
    language: 'python',
    difficulty: 'EASY',
    title: 'For Loop',
    code: `for i in range(10):\n    print(i)`,
    points: 15,
  },
  {
    id: 'ts-3',
    language: 'python',
    difficulty: 'MEDIUM',
    title: 'List Comprehension',
    code: `squares = [x ** 2 for x in range(1, 11)]\nprint(squares)`,
    points: 20,
  },
  {
    id: 'ts-4',
    language: 'javascript',
    difficulty: 'EASY',
    title: 'Arrow Function',
    code: `const greet = (name) => {\n  return \`Hello, \${name}!\`;\n};`,
    points: 15,
  },
  {
    id: 'ts-5',
    language: 'javascript',
    difficulty: 'MEDIUM',
    title: 'Array Methods Chain',
    code: `const result = numbers\n  .filter(n => n > 0)\n  .map(n => n * 2)\n  .reduce((a, b) => a + b, 0);`,
    points: 25,
  },
  {
    id: 'ts-6',
    language: 'javascript',
    difficulty: 'MEDIUM',
    title: 'Async Function',
    code: `async function fetchData(url) {\n  try {\n    const res = await fetch(url);\n    return await res.json();\n  } catch (err) {\n    console.error(err);\n  }\n}`,
    points: 30,
  },
  {
    id: 'ts-7',
    language: 'java',
    difficulty: 'EASY',
    title: 'Hello World',
    code: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello!");\n  }\n}`,
    points: 20,
  },
  {
    id: 'ts-8',
    language: 'java',
    difficulty: 'MEDIUM',
    title: 'ArrayList Loop',
    code: `ArrayList<String> list = new ArrayList<>();\nlist.add("Apple");\nlist.add("Banana");\nfor (String item : list) {\n  System.out.println(item);\n}`,
    points: 25,
  },
  {
    id: 'ts-9',
    language: 'python',
    difficulty: 'HARD',
    title: 'Class Definition',
    code: `class Dog:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\n    def bark(self):\n        return f"{self.name} says Woof!"`,
    points: 30,
  },
  {
    id: 'ts-10',
    language: 'javascript',
    difficulty: 'HARD',
    title: 'Promise with setTimeout',
    code: `function delay(ms) {\n  return new Promise(resolve => {\n    setTimeout(resolve, ms);\n  });\n}\n\ndelay(1000).then(() => {\n  console.log("Done!");\n});`,
    points: 35,
  },
];

// ─── Speed Quiz Sets ───────────────────────────────────
export const SPEED_QUIZ_SETS: SpeedQuizSet[] = [
  {
    id: 'speed-python-basics',
    title: 'Python Basics Blitz',
    category: 'Python',
    difficulty: 'EASY',
    questions: [
      { id: 'sq-pb-1', type: 'MCQ', language: 'python', topic: 'Variables', difficulty: 'EASY', question: 'What does print(type(42)) output?', options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", '42'], correctAnswer: 'A', explanation: '42 is an integer, so type() returns <class \'int\'>.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-2', type: 'MCQ', language: 'python', topic: 'Variables', difficulty: 'EASY', question: 'Which is a valid variable name in Python?', options: ['2name', 'my-var', 'my_var', 'class'], correctAnswer: 'C', explanation: 'Variable names can contain letters, numbers, and underscores but cannot start with a number or be a keyword.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-3', type: 'MCQ', language: 'python', topic: 'Loops', difficulty: 'EASY', question: 'What does range(3) generate?', options: ['[1, 2, 3]', '[0, 1, 2, 3]', '[0, 1, 2]', '[3]'], correctAnswer: 'C', explanation: 'range(3) generates 0, 1, 2 (stops before 3).', points: 5, timeLimit: 8 },
      { id: 'sq-pb-4', type: 'MCQ', language: 'python', topic: 'Functions', difficulty: 'EASY', question: 'Which keyword defines a function?', options: ['function', 'def', 'func', 'define'], correctAnswer: 'B', explanation: 'Python uses the def keyword to define functions.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-5', type: 'MCQ', language: 'python', topic: 'Strings', difficulty: 'EASY', question: 'What is "hello"[1]?', options: ['"h"', '"e"', '"l"', '"llo"'], correctAnswer: 'B', explanation: 'String indexing starts at 0, so index 1 is "e".', points: 5, timeLimit: 8 },
      { id: 'sq-pb-6', type: 'MCQ', language: 'python', topic: 'Arrays', difficulty: 'EASY', question: 'How do you add an item to a list?', options: ['list.add(5)', 'list.push(5)', 'list.append(5)', 'list.insert(5)'], correctAnswer: 'C', explanation: 'Python lists use .append() to add items to the end.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-7', type: 'MCQ', language: 'python', topic: 'Data Structures', difficulty: 'EASY', question: 'Which is immutable in Python?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correctAnswer: 'D', explanation: 'Tuples are immutable; lists, dicts, and sets are mutable.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-8', type: 'MCQ', language: 'python', topic: 'Loops', difficulty: 'EASY', question: 'What does break do?', options: ['Skip iteration', 'Exit loop', 'Restart loop', 'Pause loop'], correctAnswer: 'B', explanation: 'break immediately exits the loop.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-9', type: 'MCQ', language: 'python', topic: 'Variables', difficulty: 'EASY', question: 'What is the output of: bool("") ?', options: ['True', 'False', 'None', 'Error'], correctAnswer: 'B', explanation: 'Empty strings are falsy in Python.', points: 5, timeLimit: 8 },
      { id: 'sq-pb-10', type: 'MCQ', language: 'python', topic: 'Functions', difficulty: 'EASY', question: 'What does len("hello") return?', options: ['4', '5', '6', 'Error'], correctAnswer: 'B', explanation: '"hello" has 5 characters.', points: 5, timeLimit: 8 },
    ],
    timePerQuestion: 8,
    totalPoints: 50,
  },
  {
    id: 'speed-js-essentials',
    title: 'JavaScript Essentials',
    category: 'JavaScript',
    difficulty: 'EASY',
    questions: [
      { id: 'sq-je-1', type: 'MCQ', language: 'javascript', topic: 'Variables', difficulty: 'EASY', question: 'What is typeof undefined?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: 'B', explanation: 'typeof undefined returns "undefined".', points: 5, timeLimit: 8 },
      { id: 'sq-je-2', type: 'MCQ', language: 'javascript', topic: 'Variables', difficulty: 'EASY', question: 'Which is block-scoped?', options: ['var', 'let', 'function', 'global'], correctAnswer: 'B', explanation: 'let and const are block-scoped; var is function-scoped.', points: 5, timeLimit: 8 },
      { id: 'sq-je-3', type: 'MCQ', language: 'javascript', topic: 'Arrays', difficulty: 'EASY', question: 'What does [1,2,3].push(4) return?', options: ['4', '[1,2,3,4]', 'undefined', '3'], correctAnswer: 'A', explanation: 'push() returns the new length of the array (4).', points: 5, timeLimit: 8 },
      { id: 'sq-je-4', type: 'MCQ', language: 'javascript', topic: 'Functions', difficulty: 'EASY', question: 'What is an arrow function?', options: ['function() {}', '() => {}', '-> {}', 'lambda() {}'], correctAnswer: 'B', explanation: 'Arrow functions use => syntax.', points: 5, timeLimit: 8 },
      { id: 'sq-je-5', type: 'MCQ', language: 'javascript', topic: 'Strings', difficulty: 'EASY', question: 'What does "hello".length return?', options: ['4', '5', '6', 'undefined'], correctAnswer: 'B', explanation: '"hello" has 5 characters.', points: 5, timeLimit: 8 },
      { id: 'sq-je-6', type: 'MCQ', language: 'javascript', topic: 'Loops', difficulty: 'EASY', question: 'Which loop runs at least once?', options: ['for', 'while', 'do...while', 'for...in'], correctAnswer: 'C', explanation: 'do...while checks the condition after the first iteration.', points: 5, timeLimit: 8 },
      { id: 'sq-je-7', type: 'MCQ', language: 'javascript', topic: 'OOP', difficulty: 'EASY', question: 'How do you create a class?', options: ['function MyClass {}', 'class MyClass {}', 'new Class(MyClass)', 'struct MyClass {}'], correctAnswer: 'B', explanation: 'ES6 introduced the class keyword.', points: 5, timeLimit: 8 },
      { id: 'sq-je-8', type: 'MCQ', language: 'javascript', topic: 'Error Handling', difficulty: 'EASY', question: 'Which block catches errors?', options: ['if...else', 'try...catch', 'for...of', 'switch...case'], correctAnswer: 'B', explanation: 'try...catch handles exceptions.', points: 5, timeLimit: 8 },
      { id: 'sq-je-9', type: 'MCQ', language: 'javascript', topic: 'Arrays', difficulty: 'EASY', question: 'What does [1,2,3].pop() return?', options: ['1', '2', '3', '[1,2]'], correctAnswer: 'C', explanation: 'pop() removes and returns the last element (3).', points: 5, timeLimit: 8 },
      { id: 'sq-je-10', type: 'MCQ', language: 'javascript', topic: 'Variables', difficulty: 'EASY', question: 'What is NaN === NaN?', options: ['true', 'false', 'undefined', 'Error'], correctAnswer: 'B', explanation: 'NaN is not equal to anything, including itself.', points: 5, timeLimit: 8 },
    ],
    timePerQuestion: 8,
    totalPoints: 50,
  },
  {
    id: 'speed-mixed-medium',
    title: 'Mixed Language Medium',
    category: 'Mixed',
    difficulty: 'MEDIUM',
    questions: [
      { id: 'sq-mm-1', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Loops', difficulty: 'MEDIUM', question: 'What does this print?', codeSnippet: 'x = [1,2,3]\nprint(x[-1])', options: ['1', '2', '3', 'Error'], correctAnswer: 'C', explanation: 'Negative indexing: -1 refers to the last element.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-2', type: 'OUTPUT_PREDICTION', language: 'javascript', topic: 'Arrays', difficulty: 'MEDIUM', question: 'What does this return?', codeSnippet: '[1,2,3].map(x => x * 2)', options: ['[1,2,3]', '[2,4,6]', '[3,6,9]', '6'], correctAnswer: 'B', explanation: 'map() multiplies each element by 2.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-3', type: 'MCQ', language: 'python', topic: 'Data Structures', difficulty: 'MEDIUM', question: 'What is the time complexity of list.index(x)?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 'C', explanation: 'list.index() scans linearly: O(n).', points: 8, timeLimit: 10 },
      { id: 'sq-mm-4', type: 'MCQ', language: 'java', topic: 'OOP', difficulty: 'MEDIUM', question: 'Can a Java class extend multiple classes?', options: ['Yes', 'No', 'Up to 3', 'With the multi keyword'], correctAnswer: 'B', explanation: 'Java supports only single class inheritance.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-5', type: 'MCQ', language: 'javascript', topic: 'OOP', difficulty: 'MEDIUM', question: 'What does "this" refer to in a method?', options: ['Global object', 'The owning object', 'undefined', 'The class'], correctAnswer: 'B', explanation: 'In a method, this refers to the object the method belongs to.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-6', type: 'MCQ', language: 'python', topic: 'Functions', difficulty: 'MEDIUM', question: 'What is *args in Python?', options: ['A list of keyword arguments', 'Variable positional arguments', 'A dictionary', 'A tuple of tuples'], correctAnswer: 'B', explanation: '*args collects variable positional arguments into a tuple.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-7', type: 'OUTPUT_PREDICTION', language: 'javascript', topic: 'Loops', difficulty: 'MEDIUM', question: 'What does this print?', codeSnippet: 'for (let i = 0; i < 3; i++) {}\nconsole.log(i);', options: ['0', '2', '3', 'ReferenceError'], correctAnswer: 'D', explanation: 'let is block-scoped, so i is not accessible outside the loop.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-8', type: 'MCQ', language: 'python', topic: 'Strings', difficulty: 'MEDIUM', question: 'What does "abc".join(["x","y","z"]) return?', options: ['"xabc yabc z"', '"xayazc"', '"xyzabc"', 'Error'], correctAnswer: 'A', explanation: '"abc".join(list) places "abc" between each element: xabc yabc z.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-9', type: 'MCQ', language: 'typescript', topic: 'Generics', difficulty: 'MEDIUM', question: 'What does <T> mean in TypeScript?', options: ['A boolean', 'A generic type parameter', 'A template literal', 'An array type'], correctAnswer: 'B', explanation: '<T> declares a generic type parameter.', points: 8, timeLimit: 10 },
      { id: 'sq-mm-10', type: 'OUTPUT_PREDICTION', language: 'python', topic: 'Functions', difficulty: 'MEDIUM', question: 'What is the output?', codeSnippet: 'def foo(a, b=[]):\n    b.append(a)\n    return b\n\nprint(foo(1))\nprint(foo(2))', options: ['[1] \\n [2]', '[1] \\n [1, 2]', '[1] \\n [2]', 'Error'], correctAnswer: 'B', explanation: 'Mutable default argument is shared across calls. The list accumulates.', points: 10, timeLimit: 12 },
    ],
    timePerQuestion: 10,
    totalPoints: 82,
  },
  {
    id: 'speed-algorithms-hard',
    title: 'Algorithm Speed Run',
    category: 'Algorithms',
    difficulty: 'HARD',
    questions: [
      { id: 'sq-ah-1', type: 'MCQ', language: 'cpp', topic: 'Algorithms', difficulty: 'HARD', question: 'What is the time complexity of merge sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 'B', explanation: 'Merge sort divides and merges: O(n log n).', points: 10, timeLimit: 10 },
      { id: 'sq-ah-2', type: 'MCQ', language: 'python', topic: 'Data Structures', difficulty: 'HARD', question: 'What is the worst-case time complexity of quicksort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 'C', explanation: 'Quicksort degrades to O(n²) when the pivot is always the smallest or largest element.', points: 10, timeLimit: 10 },
      { id: 'sq-ah-3', type: 'MCQ', language: 'javascript', topic: 'Algorithms', difficulty: 'HARD', question: 'Which search requires a sorted array?', options: ['Linear search', 'Binary search', 'Hash search', 'BFS'], correctAnswer: 'B', explanation: 'Binary search requires the array to be sorted.', points: 10, timeLimit: 10 },
      { id: 'sq-ah-4', type: 'MCQ', language: 'python', topic: 'Recursion', difficulty: 'HARD', question: 'What is the space complexity of recursive factorial(n)?', options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 'B', explanation: 'Each recursive call adds a frame to the call stack: O(n) space.', points: 10, timeLimit: 10 },
      { id: 'sq-ah-5', type: 'MCQ', language: 'cpp', topic: 'Data Structures', difficulty: 'HARD', question: 'What is the time complexity of inserting at the front of a linked list?', options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'], correctAnswer: 'B', explanation: 'Inserting at the head of a linked list is O(1).', points: 10, timeLimit: 10 },
      { id: 'sq-ah-6', type: 'MCQ', language: 'java', topic: 'Data Structures', difficulty: 'HARD', question: 'Which data structure is best for a FIFO queue?', options: ['Stack', 'LinkedList', 'TreeMap', 'HashSet'], correctAnswer: 'B', explanation: 'LinkedList efficiently implements FIFO queue operations.', points: 10, timeLimit: 10 },
      { id: 'sq-ah-7', type: 'MCQ', language: 'python', topic: 'Algorithms', difficulty: 'HARD', question: 'What does BFS stand for?', options: ['Best First Search', 'Breadth-First Search', 'Binary File Search', 'Balanced Full Search'], correctAnswer: 'B', explanation: 'BFS = Breadth-First Search, explores level by level.', points: 10, timeLimit: 10 },
      { id: 'sq-ah-8', type: 'MCQ', language: 'javascript', topic: 'Data Structures', difficulty: 'HARD', question: 'What is a hash collision?', options: ['Two keys produce the same hash', 'Hash table is full', 'Key is null', 'Value is undefined'], correctAnswer: 'A', explanation: 'A hash collision occurs when two different keys map to the same index.', points: 10, timeLimit: 10 },
      { id: 'sq-ah-9', type: 'MCQ', language: 'cpp', topic: 'Algorithms', difficulty: 'HARD', question: 'What is the time complexity of heap sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 'B', explanation: 'Heap sort builds a heap (O(n)) and extracts n times (O(n log n)).', points: 10, timeLimit: 10 },
      { id: 'sq-ah-10', type: 'MCQ', language: 'python', topic: 'Recursion', difficulty: 'HARD', question: 'What is dynamic programming primarily used for?', options: ['Sorting', 'Optimization via overlapping subproblems', 'Error handling', 'Type checking'], correctAnswer: 'B', explanation: 'DP solves complex problems by breaking them into overlapping subproblems and caching results.', points: 10, timeLimit: 10 },
    ],
    timePerQuestion: 10,
    totalPoints: 100,
  },
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

/**
 * Returns full level info: { level, title, badge, xpRequired }
 */
export function getLevelForXP(xp: number): LevelInfo {
  let result = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) result = threshold;
  }
  return result;
}

/**
 * Returns the NEXT level info after the current XP level
 */
export function getNextLevel(currentXP: number): LevelInfo {
  const current = getLevelForXP(currentXP);
  const nextIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === current.level) + 1;
  if (nextIndex < LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[nextIndex];
  }
  // At max level — return current with bonus 1000 XP
  return { ...current, level: current.level + 1, xpRequired: current.xpRequired + 1000 };
}

/**
 * Get today's daily challenge with questions array
 */
export function getTodayChallenge(): DailyChallenge {
  const today = new Date().toISOString().split('T')[0];

  // Rotate through Python loop questions based on day
  const loopQuestions = QUESTIONS_BANK.filter(q => q.language === 'python' && q.topic === 'Loops');
  const selectedQuestions = shuffleArray(loopQuestions).slice(0, 3).map((q, i) => ({
    ...q,
    id: `daily-${today}-q${i}`,
  }));

  // Fallback if not enough loop questions
  if (selectedQuestions.length < 2) {
    const fallbackQs = QUESTIONS_BANK.filter(q => q.language === 'python');
    for (let i = selectedQuestions.length; i < 3; i++) {
      const fb = fallbackQs[i % fallbackQs.length];
      selectedQuestions.push({ ...fb, id: `daily-${today}-q${i}` });
    }
  }

  return {
    id: `daily-${today}`,
    date: today,
    languageId: 'python',
    difficulty: 'MEDIUM',
    title: 'Python Loop Master',
    description: 'Test your knowledge of Python loops — from basic for loops to nested iterations.',
    points: 30,
    bonusPoints: 15,
    questions: selectedQuestions,
  };
}

/**
 * Get random questions, optionally filtered by language and topic
 */
export function getRandomQuestions(languageId?: string, topicId?: string, count: number = 5): Question[] {
  let pool = [...QUESTIONS_BANK];

  if (languageId) {
    pool = pool.filter(q => q.language === languageId);
  }
  if (topicId) {
    pool = pool.filter(q => q.topic === topicId);
  }

  // If not enough, broaden the pool
  if (pool.length < count && languageId) {
    pool = [...QUESTIONS_BANK].filter(q => q.language === languageId);
  }
  if (pool.length < count) {
    pool = [...QUESTIONS_BANK];
  }

  return shuffleArray(pool).slice(0, count);
}

// ─── Legacy exports for backward compatibility ─────────
export const CQ_LANGUAGES = LANGUAGES;
export const CQ_TITLES: Record<number, string> = {};
LEVEL_THRESHOLDS.forEach(t => { CQ_TITLES[t.level] = t.title; });

export function getCQTitle(level: number): string {
  return LEVEL_THRESHOLDS.find(t => t.level === level)?.title || 'Code Novice';
}

export function getXPForLevel(level: number): number {
  return LEVEL_THRESHOLDS.find(t => t.level === level)?.xpRequired || 0;
}
