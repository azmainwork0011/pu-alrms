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
