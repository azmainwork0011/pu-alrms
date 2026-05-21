// =============================================================================
// Coding Games Data — 8 games, 100+ challenges
// =============================================================================

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CodingGame {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  gradient: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  xpReward: number;
  playCount: number;
}

export interface CodeTyperChallenge {
  id: string;
  language: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  code: string;
  points: number;
  category: string;
}

export interface CodeCompletionChallenge {
  id: string;
  language: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  code: string;
  blanks: string[];
  options: string[][];
  explanation: string;
  points: number;
  topic: string;
}

export interface PatternChallenge {
  id: string;
  language: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  code: string;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  points: number;
}

export interface ErrorHunterChallenge {
  id: string;
  language: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  title: string;
  code: string;
  errorLine: number;
  errorType: 'SyntaxError' | 'RuntimeError' | 'LogicError' | 'TypeError' | 'ReferenceError';
  errorDescription: string;
  fix: string;
  options: string[];
  correctOption: number;
  points: number;
}

export interface SQLChallenge {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  title: string;
  tableDescription: string;
  query: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface AlgorithmSortChallenge {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  title: string;
  description: string;
  steps: string[];
  options: string[];
  explanation: string;
  points: number;
  algorithm: string;
}

export interface CSSStylerChallenge {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  title: string;
  description: string;
  correctCSS: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface GitChallenge {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  scenario: string;
  correctCommand: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

// ─── Game Definitions ───────────────────────────────────────────────────────

export const CODING_GAMES: CodingGame[] = [
  {
    id: 'code-typer',
    name: 'Code Typer',
    description: 'Type code snippets fast and accurately to build muscle memory for common syntax patterns.',
    icon: '⌨️',
    image: '/games/code-typer.png',
    gradient: 'from-blue-500 to-cyan-400',
    difficulty: 'EASY',
    category: 'Typing',
    xpReward: 10,
    playCount: 15,
  },
  {
    id: 'code-completion',
    name: 'Code Completion',
    description: 'Fill in the blanks to complete real code snippets. Tests your knowledge of syntax and APIs.',
    icon: '🧩',
    image: '/games/code-completion.png',
    gradient: 'from-violet-500 to-purple-400',
    difficulty: 'MEDIUM',
    category: 'Completion',
    xpReward: 15,
    playCount: 15,
  },
  {
    id: 'pattern-predictor',
    name: 'Pattern Predictor',
    description: 'Predict what code will output. Sharpen your mental execution and debugging skills.',
    icon: '🔮',
    image: '/games/pattern-predictor.png',
    gradient: 'from-amber-500 to-orange-400',
    difficulty: 'MEDIUM',
    category: 'Prediction',
    xpReward: 15,
    playCount: 15,
  },
  {
    id: 'error-hunter',
    name: 'Error Hunter',
    description: 'Find and classify bugs hidden in code. Learn to spot common mistakes quickly.',
    icon: '🐛',
    image: '/games/error-hunter.png',
    gradient: 'from-red-500 to-rose-400',
    difficulty: 'MEDIUM',
    category: 'Debugging',
    xpReward: 20,
    playCount: 15,
  },
  {
    id: 'sql-lab',
    name: 'SQL Query Lab',
    description: 'Build and understand SQL queries. Master SELECT, JOIN, GROUP BY, subqueries and more.',
    icon: '🗄️',
    image: '/games/sql-lab.png',
    gradient: 'from-emerald-500 to-teal-400',
    difficulty: 'MEDIUM',
    category: 'Databases',
    xpReward: 20,
    playCount: 15,
  },
  {
    id: 'algorithm-sort',
    name: 'Algorithm Sort',
    description: 'Arrange the steps of classic algorithms in the correct order.',
    icon: '🔀',
    image: '/games/algorithm-sort.png',
    gradient: 'from-indigo-500 to-blue-400',
    difficulty: 'HARD',
    category: 'Algorithms',
    xpReward: 25,
    playCount: 12,
  },
  {
    id: 'css-styler',
    name: 'CSS Styler',
    description: 'Match CSS rules to design requirements. Master layouts, flexbox, grid, and visual effects.',
    icon: '🎨',
    image: '/games/css-styler.png',
    gradient: 'from-pink-500 to-fuchsia-400',
    difficulty: 'EASY',
    category: 'Styling',
    xpReward: 15,
    playCount: 12,
  },
  {
    id: 'git-simulator',
    name: 'Git Simulator',
    description: 'Match git commands to real-world scenarios. Master version control workflows.',
    icon: '🌿',
    image: '/games/git-simulator.png',
    gradient: 'from-gray-600 to-gray-400',
    difficulty: 'HARD',
    category: 'Git',
    xpReward: 20,
    playCount: 12,
  },
];

// ─── 1. Code Typer Challenges ──────────────────────────────────────────────

export const CODE_TYPER_CHALLENGES: CodeTyperChallenge[] = [
  // ── EASY ──
  {
    id: 'ct-01',
    language: 'Python',
    difficulty: 'EASY',
    code: 'print("Hello, World!")',
    points: 10,
    category: 'basics',
  },
  {
    id: 'ct-02',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'console.log("Hello, World!");',
    points: 10,
    category: 'basics',
  },
  {
    id: 'ct-03',
    language: 'Python',
    difficulty: 'EASY',
    code: 'for i in range(10):\n    print(i)',
    points: 10,
    category: 'loops',
  },
  {
    id: 'ct-04',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'const arr = [1, 2, 3];',
    points: 10,
    category: 'arrays',
  },
  {
    id: 'ct-05',
    language: 'Java',
    difficulty: 'EASY',
    code: 'System.out.println(42);',
    points: 10,
    category: 'basics',
  },
  {
    id: 'ct-06',
    language: 'Python',
    difficulty: 'EASY',
    code: 'x = len([1, 2, 3, 4, 5])',
    points: 10,
    category: 'arrays',
  },
  {
    id: 'ct-07',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'function add(a, b) {\n  return a + b;\n}',
    points: 15,
    category: 'functions',
  },
  // ── MEDIUM ──
  {
    id: 'ct-08',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
    points: 20,
    category: 'functions',
  },
  {
    id: 'ct-09',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'const sum = arr.reduce((acc, val) => acc + val, 0);',
    points: 20,
    category: 'arrays',
  },
  {
    id: 'ct-10',
    language: 'TypeScript',
    difficulty: 'MEDIUM',
    code: 'interface User {\n  name: string;\n  age: number;\n  email: string;\n}',
    points: 20,
    category: 'types',
  },
  {
    id: 'ct-11',
    language: 'C++',
    difficulty: 'MEDIUM',
    code: 'for (int i = 0; i < n; i++) {\n    sum += arr[i];\n}',
    points: 20,
    category: 'loops',
  },
  {
    id: 'ct-12',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'squares = [x**2 for x in range(1, 11)]',
    points: 20,
    category: 'arrays',
  },
  {
    id: 'ct-13',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'const filtered = arr.filter(x => x % 2 === 0);',
    points: 20,
    category: 'arrays',
  },
  {
    id: 'ct-14',
    language: 'Java',
    difficulty: 'MEDIUM',
    code: 'HashMap<String, Integer> map = new HashMap<>();\nmap.put("key", 42);',
    points: 20,
    category: 'data-structures',
  },
  // ── HARD ──
  {
    id: 'ct-15',
    language: 'Python',
    difficulty: 'HARD',
    code: 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)',
    points: 30,
    category: 'algorithms',
  },
  {
    id: 'ct-16',
    language: 'TypeScript',
    difficulty: 'HARD',
    code: 'async function fetchData<T>(url: string): Promise<T> {\n  const response = await fetch(url);\n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}`);\n  }\n  return response.json();\n}',
    points: 30,
    category: 'async',
  },
  {
    id: 'ct-17',
    language: 'C++',
    difficulty: 'HARD',
    code: 'class Node {\npublic:\n    int data;\n    Node* next;\n    Node(int val) : data(val), next(nullptr) {}\n};\n\nvoid insert(Node*& head, int val) {\n    Node* newNode = new Node(val);\n    newNode->next = head;\n    head = newNode;\n}',
    points: 30,
    category: 'data-structures',
  },
  {
    id: 'ct-18',
    language: 'JavaScript',
    difficulty: 'HARD',
    code: 'function debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => {\n      fn.apply(this, args);\n    }, delay);\n  };\n}',
    points: 30,
    category: 'functions',
  },
];

// ─── 2. Code Completion Challenges ─────────────────────────────────────────

export const CODE_COMPLETION_CHALLENGES: CodeCompletionChallenge[] = [
  // ── EASY ──
  {
    id: 'cc-01',
    language: 'Python',
    difficulty: 'EASY',
    code: 'name = "World"\nprint("Hello, " + ____ + "!")',
    blanks: ['name'],
    options: [['name', 'Name', 'world', 'string']],
    explanation: 'The variable "name" holds the value "World" and is concatenated into the print string.',
    points: 10,
    topic: 'variables',
  },
  {
    id: 'cc-02',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'const fruits = ["apple", "banana", "cherry"];\nconsole.log(____.length);',
    blanks: ['fruits'],
    options: [['fruits', 'fruits()', 'array', 'list']],
    explanation: 'The .length property on an array returns the number of elements.',
    points: 10,
    topic: 'arrays',
  },
  {
    id: 'cc-03',
    language: 'Python',
    difficulty: 'EASY',
    code: 'for i in ____:\n    print(i)',
    blanks: ['range(5)'],
    options: [['range(5)', 'range', '[5]', 'range(4)']],
    explanation: 'range(5) generates numbers 0 through 4, which is a common Python loop pattern.',
    points: 10,
    topic: 'loops',
  },
  {
    id: 'cc-04',
    language: 'Java',
    difficulty: 'EASY',
    code: 'String greeting = ____;\nSystem.out.println(greeting.toUpperCase());',
    blanks: ['"hello"'],
    options: [['"hello"', 'hello', 'String', 'new String()']],
    explanation: 'String literals in Java are enclosed in double quotes. toUpperCase() converts to uppercase.',
    points: 10,
    topic: 'strings',
  },
  {
    id: 'cc-05',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'function greet(name) {\n  return `Hello, ${____}!`;\n}',
    blanks: ['name'],
    options: [['name', 'name()', '$name', '{name}']],
    explanation: 'Template literals use ${variable} syntax to embed expressions inside backtick strings.',
    points: 10,
    topic: 'functions',
  },
  // ── MEDIUM ──
  {
    id: 'cc-06',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'def is_even(n):\n    return n ____ 2 == 0',
    blanks: ['%'],
    options: [['%', '/', '//', '*']],
    explanation: 'The modulo operator % returns the remainder. If n % 2 equals 0, n is even.',
    points: 15,
    topic: 'operators',
  },
  {
    id: 'cc-07',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'const doubled = numbers.____(x => x * 2);',
    blanks: ['map'],
    options: [['map', 'filter', 'forEach', 'reduce']],
    explanation: 'Array.map() creates a new array by applying a function to every element.',
    points: 15,
    topic: 'arrays',
  },
  {
    id: 'cc-08',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'students = {"Alice": 90, "Bob": 85}\nfor ____, score ____ students.items():\n    print(f"{name}: {score}")',
    blanks: ['name', 'in'],
    options: [['name', 'key', 'i', 'item'], ['in', 'of', 'from', '=']],
    explanation: 'dict.items() yields (key, value) pairs. Unpack with "for key, value in dict.items()".',
    points: 15,
    topic: 'dictionaries',
  },
  {
    id: 'cc-09',
    language: 'TypeScript',
    difficulty: 'MEDIUM',
    code: 'interface Product {\n  id: ____;\n  name: string;\n  price: ____;\n}',
    blanks: ['number', 'number'],
    options: [['number', 'Number', 'int', 'integer'], ['number', 'string', 'float', 'decimal']],
    explanation: 'TypeScript uses lowercase "number" for both integer and floating-point numeric types.',
    points: 15,
    topic: 'types',
  },
  {
    id: 'cc-10',
    language: 'C++',
    difficulty: 'MEDIUM',
    code: '#include <iostream>\n#include <____>\nusing namespace std;\nint main() {\n    vector<int> v = {1, 2, 3};\n    return 0;\n}',
    blanks: ['vector'],
    options: [['vector', 'Vector', 'list', 'array']],
    explanation: 'The <vector> header provides the std::vector container, a dynamic array in C++.',
    points: 15,
    topic: 'data-structures',
  },
  {
    id: 'cc-11',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'const result = await fetch("/api/data").____(r => r.json());',
    blanks: ['then'],
    options: [['then', 'catch', 'finally', 'map']],
    explanation: 'fetch() returns a Promise. Use .then() to chain the response parsing with r.json().',
    points: 15,
    topic: 'async',
  },
  // ── HARD ──
  {
    id: 'cc-12',
    language: 'Python',
    difficulty: 'HARD',
    code: 'from functools import ____\n\n@lru_cache(maxsize=____)\ndef fib(n):\n    if n < 2:\n        return n\n    return fib(n-1) + fib(n-2)',
    blanks: ['lru_cache', 'None'],
    options: [['lru_cache', 'cache', 'memoize', 'wraps'], ['None', '128', '0', '10']],
    explanation: 'lru_cache is a decorator that memoizes function results. maxsize=None means unlimited cache.',
    points: 25,
    topic: 'decorators',
  },
  {
    id: 'cc-13',
    language: 'JavaScript',
    difficulty: 'HARD',
    code: 'class EventEmitter {\n  #listeners = new ____();\n\n  on(event, callback) {\n    if (!this.#listeners.has(event)) {\n      this.#listeners.____(event, []);\n    }\n    this.#listeners.get(event).push(callback);\n  }\n}',
    blanks: ['Map', 'set'],
    options: [['Map', 'Set', 'Array', 'Object'], ['set', 'add', 'push', 'put']],
    explanation: 'Map allows any key type. Use .set() to add entries; .add() is for Sets, .push() is for Arrays.',
    points: 25,
    topic: 'classes',
  },
  {
    id: 'cc-14',
    language: 'SQL',
    difficulty: 'HARD',
    code: 'SELECT department, AVG(salary) as avg_salary\nFROM employees\nWHERE status = ____\nGROUP ____ department\nHAVING AVG(salary) > ____\nORDER BY avg_salary DESC;',
    blanks: ["'active'", 'BY', '50000'],
    options: [["'active'", 'active', "'Active'", 'TRUE'], ['BY', 'ON', 'WITH', 'TO'], ['50000', '5000', '100000', '0']],
    explanation: 'WHERE filters rows before grouping. GROUP BY aggregates per department. HAVING filters groups.',
    points: 25,
    topic: 'sql',
  },
  {
    id: 'cc-15',
    language: 'Java',
    difficulty: 'HARD',
    code: 'public class Singleton {\n    private static volatile Singleton ____;\n\n    private Singleton() {}\n\n    public static Singleton getInstance() {\n        if (instance == null) {\n            synchronized (Singleton.class) {\n                if (instance == null) {\n                    instance = ____ Singleton();\n                }\n            }\n        }\n        return instance;\n    }\n}',
    blanks: ['instance', 'new'],
    options: [['instance', 'INSTANCE', '_instance', 'single'], ['new', 'create', 'make', 'init']],
    explanation: 'Double-checked locking with volatile ensures thread-safe lazy initialization of the singleton.',
    points: 25,
    topic: 'design-patterns',
  },
  {
    id: 'cc-16',
    language: 'TypeScript',
    difficulty: 'HARD',
    code: 'type Result<T, E = Error> =\n  | { ____: true; value: T }\n  | { ok: false; ____: E };\n\nfunction divide(a: number, b: number): Result<number, string> {\n  if (b === 0) return { ok: false, error: "Division by zero" };\n  return { ok: true, ____: a / b };\n}',
    blanks: ['ok', 'error', 'value'],
    options: [['ok', 'success', 'valid', 'status'], ['error', 'err', 'fail', 'message'], ['value', 'data', 'result', 'output']],
    explanation: 'This discriminated union pattern uses the "ok" field to narrow types — a common Result pattern.',
    points: 25,
    topic: 'types',
  },
];

// ─── 3. Pattern Predictor Challenges ────────────────────────────────────────

export const PATTERN_CHALLENGES: PatternChallenge[] = [
  // ── EASY ──
  {
    id: 'pp-01',
    language: 'Python',
    difficulty: 'EASY',
    code: 'x = 5\nx = x + 3\nprint(x)',
    question: 'What does this code print?',
    correctAnswer: '8',
    options: ['5', '8', '3', '53'],
    explanation: 'x starts as 5, then x + 3 = 8 is assigned back to x. Output is 8.',
    points: 10,
  },
  {
    id: 'pp-02',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'let text = "hello";\nconsole.log(text.toUpperCase());',
    question: 'What does this code print?',
    correctAnswer: 'HELLO',
    options: ['hello', 'HELLO', 'Hello', 'undefined'],
    explanation: 'toUpperCase() returns a new string with all characters converted to uppercase.',
    points: 10,
  },
  {
    id: 'pp-03',
    language: 'Python',
    difficulty: 'EASY',
    code: 'nums = [10, 20, 30]\nprint(len(nums))',
    question: 'What does this code print?',
    correctAnswer: '3',
    options: ['2', '3', '10', '30'],
    explanation: 'len() returns the number of items in the list. The list has 3 elements.',
    points: 10,
  },
  {
    id: 'pp-04',
    language: 'JavaScript',
    difficulty: 'EASY',
    code: 'console.log(5 + "3");',
    question: 'What does this code print?',
    correctAnswer: '53',
    options: ['8', '53', '"53"', 'undefined'],
    explanation: 'When + is used with a string, JavaScript coerces the number to a string and concatenates.',
    points: 10,
  },
  {
    id: 'pp-05',
    language: 'Python',
    difficulty: 'EASY',
    code: 'print(2 ** 3)',
    question: 'What does this code print?',
    correctAnswer: '8',
    options: ['6', '8', '9', '5'],
    explanation: 'The ** operator is exponentiation in Python. 2 raised to the power of 3 equals 8.',
    points: 10,
  },
  // ── MEDIUM ──
  {
    id: 'pp-06',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'def mystery(n):\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result\n\nprint(mystery(5))',
    question: 'What does this code print?',
    correctAnswer: '120',
    options: ['25', '60', '120', '720'],
    explanation: 'This computes factorial(5) = 5 × 4 × 3 × 2 × 1 = 120.',
    points: 15,
  },
  {
    id: 'pp-07',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'const arr = [1, 2, 3, 4, 5];\nconst result = arr.filter(x => x % 2 === 0).map(x => x * x);\nconsole.log(result);',
    question: 'What does this code print?',
    correctAnswer: '[4, 16]',
    options: ['[2, 4]', '[4, 16]', '[1, 9, 25]', '[4, 8, 12, 16, 20]'],
    explanation: 'filter keeps even numbers [2, 4], then map squares them to [4, 16].',
    points: 15,
  },
  {
    id: 'pp-08',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint(fib(7))',
    question: 'What does this code print?',
    correctAnswer: '13',
    options: ['8', '11', '13', '21'],
    explanation: 'Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13. The 7th number (0-indexed) is 13.',
    points: 15,
  },
  {
    id: 'pp-09',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'let s = "";\nfor (let i = 0; i < 5; i++) {\n  s += i % 2 === 0 ? "a" : "b";\n}\nconsole.log(s);',
    question: 'What does this code print?',
    correctAnswer: 'ababa',
    options: ['aaaaa', 'ababa', 'babab', 'abab'],
    explanation: 'i=0(even)→a, i=1(odd)→b, i=2(even)→a, i=3(odd)→b, i=4(even)→a. Result: "ababa".',
    points: 15,
  },
  {
    id: 'pp-10',
    language: 'Python',
    difficulty: 'MEDIUM',
    code: 'nums = [3, 1, 4, 1, 5]\nnums.sort()\nprint(nums[-2])',
    question: 'What does this code print?',
    correctAnswer: '4',
    options: ['1', '3', '4', '5'],
    explanation: 'After sorting: [1, 1, 3, 4, 5]. Index -2 is the second-to-last element: 4.',
    points: 15,
  },
  {
    id: 'pp-11',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    code: 'function foo(a, b) {\n  return a ?? b;\n}\nconsole.log(foo(null, 42));\nconsole.log(foo(0, 42));',
    question: 'What does this code print (two lines)?',
    correctAnswer: '42\n0',
    options: ['42\n42', '42\n0', 'null\n0', 'null\n42'],
    explanation: '?? (nullish coalescing) returns the right side only if the left is null or undefined. 0 is not nullish, so it returns 0.',
    points: 15,
  },
  // ── HARD ──
  {
    id: 'pp-12',
    language: 'Python',
    difficulty: 'HARD',
    code: 'def mystery(s):\n    return s[::-1] == s\n\nresults = [mystery(x) for x in ["radar", "hello", "level", "world"]]\nprint(sum(results))',
    question: 'What does this code print?',
    correctAnswer: '2',
    options: ['0', '1', '2', '3'],
    explanation: 'The function checks for palindromes. "radar" and "level" are palindromes (True=1). 1+1=2.',
    points: 25,
  },
  {
    id: 'pp-13',
    language: 'JavaScript',
    difficulty: 'HARD',
    code: 'const matrix = [[1, 2], [3, 4], [5, 6]];\nconst flat = matrix.reduce((acc, row) => [...acc, ...row], []);\nconsole.log(flat.filter((v, i) => v + i === 5));',
    question: 'What does this code print?',
    correctAnswer: '[3]',
    options: ['[1, 4]', '[2, 5]', '[3]', '[3, 5]'],
    explanation: 'Flattened array: [1,2,3,4,5,6]. filter checks v+i===5: i=0→1≠5, i=1→3≠5, i=2→3+2=5✓, i=3→7≠5, i=4→9≠5, i=5→11≠5. Only index 2 (value 3) matches, so output is [3].',
    points: 25,
  },
  {
    id: 'pp-14',
    language: 'Python',
    difficulty: 'HARD',
    code: 'def f(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 2:\n        return 1\n    memo[n] = f(n-1, memo) + f(n-2, memo)\n    return memo[n]\n\nprint(f(10))',
    question: 'What does this code print?',
    correctAnswer: '55',
    options: ['34', '55', '89', '144'],
    explanation: 'This is memoized Fibonacci. fib(10) = 55. The sequence: 1,1,2,3,5,8,13,21,34,55.',
    points: 25,
  },
  {
    id: 'pp-15',
    language: 'JavaScript',
    difficulty: 'HARD',
    code: 'class Counter {\n  #count = 0;\n  increment() { return ++this.#count; }\n  decrement() { return --this.#count; }\n  get value() { return this.#count; }\n}\n\nconst c = new Counter();\nc.increment();\nc.increment();\nc.increment();\nc.decrement();\nconsole.log(c.value);',
    question: 'What does this code print?',
    correctAnswer: '2',
    options: ['1', '2', '3', '4'],
    explanation: 'Start at 0, increment 3 times (→3), decrement once (→2). Private field #count = 2.',
    points: 25,
  },
  {
    id: 'pp-16',
    language: 'Python',
    difficulty: 'HARD',
    code: 'from collections import Counter\n\nwords = "the cat sat on the mat the cat".split()\ncounts = Counter(words)\nprint(counts["the"])',
    question: 'What does this code print?',
    correctAnswer: '3',
    options: ['2', '3', '4', '5'],
    explanation: '"the" appears 3 times in the sentence. Counter creates a frequency dictionary.',
    points: 25,
  },
];

// ─── 4. Error Hunter Challenges ─────────────────────────────────────────────

export const ERROR_HUNTER_CHALLENGES: ErrorHunterChallenge[] = [
  // ── EASY ──
  {
    id: 'eh-01',
    language: 'Python',
    difficulty: 'EASY',
    title: 'The Missing Colon',
    code: 'x = 10\nif x > 5\n    print("big")',
    errorLine: 2,
    errorType: 'SyntaxError',
    errorDescription: 'Missing colon after the if condition.',
    fix: 'Add a colon at the end of line 2: if x > 5:',
    options: [
      'Missing colon after if condition',
      'print() is not a function',
      'Variable x is undefined',
      'Indentation error',
    ],
    correctOption: 0,
    points: 10,
  },
  {
    id: 'eh-02',
    language: 'JavaScript',
    difficulty: 'EASY',
    title: 'Undefined Variable',
    code: 'function greet() {\n  console.log(message);\n}\ngreet();',
    errorLine: 2,
    errorType: 'ReferenceError',
    errorDescription: 'message is referenced but never declared.',
    fix: 'Declare message before using it: const message = "Hello!";',
    options: [
      'greet is not defined',
      'message is not defined',
      'console is not a function',
      'Missing return statement',
    ],
    correctOption: 1,
    points: 10,
  },
  {
    id: 'eh-03',
    language: 'Python',
    difficulty: 'EASY',
    title: 'Wrong Comparison',
    code: 'name = "Alice"\nif name = "Bob":\n    print("Hi Bob")',
    errorLine: 2,
    errorType: 'SyntaxError',
    errorDescription: 'Using assignment (=) instead of comparison (==).',
    fix: 'Change = to == for comparison: if name == "Bob":',
    options: [
      'String must use double quotes',
      'Using = instead of ==',
      'print() needs parentheses',
      'Indentation is wrong',
    ],
    correctOption: 1,
    points: 10,
  },
  {
    id: 'eh-04',
    language: 'Java',
    difficulty: 'EASY',
    title: 'Case Mismatch',
    code: 'public class Main {\n  public static void main(String[] args) {\n    String s = "hello";\n    System.out.println(s.Uppercase());\n  }\n}',
    errorLine: 4,
    errorType: 'RuntimeError',
    errorDescription: 'Method name should be toUpperCase(), not Uppercase().',
    fix: 'Change s.Uppercase() to s.toUpperCase().',
    options: [
      'Main class is not public',
      'System.out is undefined',
      'Method name is misspelled',
      'String cannot be printed',
    ],
    correctOption: 2,
    points: 10,
  },
  {
    id: 'eh-05',
    language: 'JavaScript',
    difficulty: 'EASY',
    title: 'Object Bracket Typo',
    code: 'const user = {\n  name: "Alice",\n  age: 30\n};\nconsole.log(user[name]);',
    errorLine: 5,
    errorType: 'ReferenceError',
    errorDescription: 'name is used without quotes — should be a string key.',
    fix: 'Change user[name] to user["name"] or user.name.',
    options: [
      'user is not defined',
      'name is not defined (missing quotes)',
      'Missing semicolon on line 3',
      'Console.log should be lowercase',
    ],
    correctOption: 1,
    points: 10,
  },
  // ── MEDIUM ──
  {
    id: 'eh-06',
    language: 'Python',
    difficulty: 'MEDIUM',
    title: 'Off-by-One Error',
    code: 'def sum_list(arr):\n    total = 0\n    for i in range(len(arr)):\n        total += arr[i + 1]\n    return total\n\nprint(sum_list([1, 2, 3, 4]))',
    errorLine: 4,
    errorType: 'RuntimeError',
    errorDescription: 'i + 1 goes out of bounds on the last iteration (IndexError).',
    fix: 'Change arr[i + 1] to arr[i], or change range to range(len(arr) - 1).',
    options: [
      'len() is not a function',
      'Index out of bounds (off-by-one)',
      'Cannot add integers',
      'Return type mismatch',
    ],
    correctOption: 1,
    points: 20,
  },
  {
    id: 'eh-07',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    title: 'Wrong Expectation from push()',
    code: 'const arr = [3, 1, 4, 1, 5];\nconst sorted = arr.push(9);\nconsole.log(sorted);',
    errorLine: 2,
    errorType: 'LogicError',
    errorDescription: 'push() returns the new length of the array, not the modified array.',
    fix: 'Call arr.push(9) first, then use arr for the sorted result, or use const result = [...arr, 9].',
    options: [
      'push() does not exist on arrays',
      'push() returns the new length, not the array',
      'Cannot reassign const variable',
      '9 is not a valid number',
    ],
    correctOption: 1,
    points: 20,
  },
  {
    id: 'eh-08',
    language: 'Python',
    difficulty: 'MEDIUM',
    title: 'Mutable Default Argument',
    code: 'def add_item(item, lst=[]):\n    lst.append(item)\n    return lst\n\nprint(add_item("a"))\nprint(add_item("b"))',
    errorLine: 2,
    errorType: 'LogicError',
    errorDescription: 'Using a mutable default argument (list) causes it to persist across calls.',
    fix: 'Use None as default and create a new list inside: def add_item(item, lst=None): lst = lst or []',
    options: [
      'append() is not a list method',
      'Mutable default argument persists between calls',
      'Cannot pass strings to functions',
      'print() does not accept function results',
    ],
    correctOption: 1,
    points: 20,
  },
  {
    id: 'eh-09',
    language: 'JavaScript',
    difficulty: 'MEDIUM',
    title: 'TypeError on Null',
    code: 'const data = null;\nconst length = data.length;',
    errorLine: 2,
    errorType: 'TypeError',
    errorDescription: 'Cannot read property "length" of null.',
    fix: 'Add a null check: const length = data?.length ?? 0;',
    options: [
      'data is not defined',
      'null does not have a length property (TypeError)',
      'Assignment to const variable',
      'length is a reserved keyword',
    ],
    correctOption: 1,
    points: 20,
  },
  {
    id: 'eh-10',
    language: 'C++',
    difficulty: 'MEDIUM',
    title: 'Integer Division',
    code: '#include <iostream>\nusing namespace std;\nint main() {\n    double result = 5 / 2;\n    cout << result << endl;\n    return 0;\n}',
    errorLine: 4,
    errorType: 'LogicError',
    errorDescription: '5/2 performs integer division, giving 2.0 instead of 2.5.',
    fix: 'Use 5.0 / 2 or static_cast<double>(5) / 2 to force floating-point division.',
    options: [
      'cout is not defined',
      'Integer division yields 2 instead of 2.5',
      'endl is not a valid manipulator',
      'Missing return type in main',
    ],
    correctOption: 1,
    points: 20,
  },
  {
    id: 'eh-11',
    language: 'TypeScript',
    difficulty: 'MEDIUM',
    title: 'Type Assertion Gone Wrong',
    code: 'const value: unknown = "hello";\nconst len: number = (value as string).lenght;',
    errorLine: 2,
    errorType: 'TypeError',
    errorDescription: '"lenght" is misspelled — should be "length".',
    fix: 'Correct the spelling: (value as string).length.',
    options: [
      'unknown cannot be cast to string',
      'Property "lenght" does not exist (typo)',
      'Cannot assign to a typed variable',
      'Type assertion syntax is wrong',
    ],
    correctOption: 1,
    points: 20,
  },
  // ── HARD ──
  {
    id: 'eh-12',
    language: 'JavaScript',
    difficulty: 'HARD',
    title: 'Closure in a Loop',
    code: 'const funcs = [];\nfor (var i = 0; i < 3; i++) {\n  funcs.push(function() { return i; });\n}\nconsole.log(funcs[0]());\nconsole.log(funcs[1]());\nconsole.log(funcs[2]());',
    errorLine: 2,
    errorType: 'LogicError',
    errorDescription: 'var is function-scoped, so all closures share the same i (which ends at 3).',
    fix: 'Use let instead of var: for (let i = 0; i < 3; i++)',
    options: [
      'funcs array is not initialized',
      'var in loop causes all closures to share the same variable',
      'push() modifies the wrong array',
      'Function expressions are not allowed in loops',
    ],
    correctOption: 1,
    points: 30,
  },
  {
    id: 'eh-13',
    language: 'Python',
    difficulty: 'HARD',
    title: 'Shallow Copy Trap',
    code: 'original = [[1, 2], [3, 4]]\ncopy = original.copy()\ncopy[0][0] = 99\nprint(original[0][0])',
    errorLine: 2,
    errorType: 'LogicError',
    errorDescription: '.copy() creates a shallow copy — inner lists are still shared references.',
    fix: 'Use copy.deepcopy(original) for a full independent copy.',
    options: [
      '.copy() is not a valid list method',
      'Shallow copy shares inner list references',
      '99 is not a valid integer',
      'print() cannot index into lists',
    ],
    correctOption: 1,
    points: 30,
  },
  {
    id: 'eh-14',
    language: 'Java',
    difficulty: 'HARD',
    title: 'String Comparison with ==',
    code: 'String a = new String("hello");\nString b = new String("hello");\nif (a == b) {\n    System.out.println("equal");\n} else {\n    System.out.println("not equal");\n}',
    errorLine: 3,
    errorType: 'LogicError',
    errorDescription: '== compares object references, not string content. Use .equals() for value comparison.',
    fix: 'Change a == b to a.equals(b).',
    options: [
      'String constructor is deprecated',
      '== compares references, not values — use .equals()',
      'System.out.println is not a valid statement',
      'new String() creates a compile error',
    ],
    correctOption: 1,
    points: 30,
  },
  {
    id: 'eh-15',
    language: 'JavaScript',
    difficulty: 'HARD',
    title: 'Async/Await Without Try-Catch',
    code: 'async function fetchUser() {\n  const res = await fetch("/api/user");\n  const data = await res.json();\n  return data;\n}\n\nfetchUser().then(user => console.log(user.name));',
    errorLine: 2,
    errorType: 'RuntimeError',
    errorDescription: 'No error handling — if fetch fails or returns non-JSON, the Promise rejects with an unhandled error.',
    fix: 'Wrap in try-catch: try { const res = await fetch(...) } catch (err) { console.error(err); }',
    options: [
      'await cannot be used with fetch',
      'No error handling — network failures cause unhandled rejections',
      'res.json() is not a function',
      '.then() cannot follow an async function',
    ],
    correctOption: 1,
    points: 30,
  },
  {
    id: 'eh-16',
    language: 'Python',
    difficulty: 'HARD',
    title: 'Generator Exhaustion',
    code: 'def gen():\n    yield 1\n    yield 2\n    yield 3\n\ng = gen()\nprint(list(g))\nprint(list(g))',
    errorLine: 7,
    errorType: 'LogicError',
    errorDescription: 'Generators are exhausted after one full iteration. The second list(g) returns an empty list.',
    fix: 'If you need to iterate multiple times, convert to a list first or recreate the generator.',
    options: [
      'gen() is not callable',
      'list() cannot convert generators',
      'Generator is exhausted after first iteration',
      'yield cannot be used inside functions',
    ],
    correctOption: 2,
    points: 30,
  },
];

// ─── 5. SQL Query Lab Challenges ────────────────────────────────────────────

export const SQL_CHALLENGES: SQLChallenge[] = [
  // ── EASY ──
  {
    id: 'sql-01',
    difficulty: 'EASY',
    title: 'Select All Columns',
    tableDescription: 'Table: users (id, name, email, age)',
    query: 'SELECT * FROM users;',
    question: 'Which query retrieves all columns from the users table?',
    options: [
      'SELECT * FROM users;',
      'SELECT all FROM users;',
      'GET * FROM users;',
      'SELECT ALL COLUMNS users;',
    ],
    correctAnswer: 'A',
    explanation: 'SELECT * is the standard SQL way to retrieve all columns from a table.',
    points: 10,
  },
  {
    id: 'sql-02',
    difficulty: 'EASY',
    title: 'Filter with WHERE',
    tableDescription: 'Table: employees (id, name, department, salary)',
    query: "SELECT name, salary FROM employees WHERE department = 'Engineering';",
    question: 'Which query gets names and salaries of Engineering employees?',
    options: [
      "SELECT name, salary FROM employees WHERE department = 'Engineering';",
      "SELECT name AND salary FROM employees WHERE department IS 'Engineering';",
      "GET name, salary FROM employees IF department = 'Engineering';",
      "SELECT name, salary FROM employees HAVING department = 'Engineering';",
    ],
    correctAnswer: 'A',
    explanation: 'WHERE filters rows before they are returned. Use = for equality comparison.',
    points: 10,
  },
  {
    id: 'sql-03',
    difficulty: 'EASY',
    title: 'Count Rows',
    tableDescription: 'Table: orders (id, customer_id, total, order_date)',
    query: 'SELECT COUNT(*) FROM orders;',
    question: 'Which query counts the total number of orders?',
    options: [
      'SELECT COUNT(*) FROM orders;',
      'SELECT total FROM orders;',
      'SELECT SUM(id) FROM orders;',
      'COUNT orders;',
    ],
    correctAnswer: 'A',
    explanation: 'COUNT(*) returns the total number of rows in a table or result set.',
    points: 10,
  },
  {
    id: 'sql-04',
    difficulty: 'EASY',
    title: 'Order By',
    tableDescription: 'Table: products (id, name, price, stock)',
    query: 'SELECT name, price FROM products ORDER BY price DESC;',
    question: 'Which query lists products from most to least expensive?',
    options: [
      'SELECT name, price FROM products ORDER BY price DESC;',
      'SELECT name, price FROM products SORT BY price HIGH;',
      'SELECT name, price FROM products ORDER price DESCENDING;',
      'SELECT name, price FROM products GROUP BY price DESC;',
    ],
    correctAnswer: 'A',
    explanation: 'ORDER BY sorts results. DESC means descending (highest first), ASC is ascending.',
    points: 10,
  },
  {
    id: 'sql-05',
    difficulty: 'EASY',
    title: 'Distinct Values',
    tableDescription: 'Table: employees (id, name, department, salary)',
    query: 'SELECT DISTINCT department FROM employees;',
    question: 'Which query returns a list of unique departments?',
    options: [
      'SELECT DISTINCT department FROM employees;',
      'SELECT UNIQUE department FROM employees;',
      'SELECT department UNIQUE FROM employees;',
      'SELECT DIFFERENT department FROM employees;',
    ],
    correctAnswer: 'A',
    explanation: 'DISTINCT removes duplicate rows from the result set, returning only unique values.',
    points: 10,
  },
  // ── MEDIUM ──
  {
    id: 'sql-06',
    difficulty: 'MEDIUM',
    title: 'JOIN Two Tables',
    tableDescription: 'Tables: orders (id, customer_id, total), customers (id, name, country)',
    query: 'SELECT customers.name, orders.total FROM orders JOIN customers ON orders.customer_id = customers.id;',
    question: 'Which query joins orders with customer names?',
    options: [
      'SELECT customers.name, orders.total FROM orders JOIN customers ON orders.customer_id = customers.id;',
      'SELECT name, total FROM orders, customers WHERE id = customer_id;',
      'SELECT customers.name, orders.total FROM orders LINK customers BY id;',
      'MERGE orders AND customers INTO name, total;',
    ],
    correctAnswer: 'A',
    explanation: 'JOIN connects tables using a common column. ON specifies the join condition.',
    points: 20,
  },
  {
    id: 'sql-07',
    difficulty: 'MEDIUM',
    title: 'GROUP BY with Aggregate',
    tableDescription: 'Table: sales (id, product, quantity, price)',
    query: 'SELECT product, SUM(quantity * price) AS revenue FROM sales GROUP BY product;',
    question: 'Which query calculates total revenue per product?',
    options: [
      'SELECT product, SUM(quantity * price) AS revenue FROM sales GROUP BY product;',
      'SELECT product, TOTAL(quantity * price) FROM sales;',
      'SELECT product, SUM(revenue) FROM sales GROUP BY product;',
      'SELECT product, ADD(quantity, price) AS revenue FROM sales;',
    ],
    correctAnswer: 'A',
    explanation: 'GROUP BY groups rows with the same product. SUM() calculates the total for each group.',
    points: 20,
  },
  {
    id: 'sql-08',
    difficulty: 'MEDIUM',
    title: 'HAVING Clause',
    tableDescription: 'Table: employees (id, name, department, salary)',
    query: "SELECT department, COUNT(*) as emp_count FROM employees GROUP BY department HAVING COUNT(*) > 5;",
    question: 'Which query finds departments with more than 5 employees?',
    options: [
      'SELECT department, COUNT(*) as emp_count FROM employees GROUP BY department HAVING COUNT(*) > 5;',
      "SELECT department, COUNT(*) FROM employees WHERE COUNT(*) > 5;",
      'SELECT department, COUNT(*) as emp_count FROM employees GROUP BY department WHERE emp_count > 5;',
      'SELECT department FROM employees HAVING count > 5;',
    ],
    correctAnswer: 'A',
    explanation: 'HAVING filters groups after GROUP BY. WHERE filters rows before grouping.',
    points: 20,
  },
  {
    id: 'sql-09',
    difficulty: 'MEDIUM',
    title: 'LIKE Pattern Matching',
    tableDescription: 'Table: users (id, name, email, created_at)',
    query: "SELECT name, email FROM users WHERE name LIKE 'J%' ORDER BY name;",
    question: 'Which query finds users whose names start with J?',
    options: [
      "SELECT name, email FROM users WHERE name LIKE 'J%' ORDER BY name;",
      "SELECT name, email FROM users WHERE name = 'J*';",
      "SELECT name, email FROM users WHERE name MATCH 'J%';",
      "SELECT name, email FROM users WHERE name BEGINS 'J';",
    ],
    correctAnswer: 'A',
    explanation: "LIKE with % is a wildcard. 'J%' matches any string starting with J.",
    points: 20,
  },
  {
    id: 'sql-10',
    difficulty: 'MEDIUM',
    title: 'NULL Handling',
    tableDescription: 'Table: customers (id, name, phone, email)',
    query: "SELECT name FROM customers WHERE phone IS NULL;",
    question: 'Which query finds customers with no phone number?',
    options: [
      'SELECT name FROM customers WHERE phone IS NULL;',
      'SELECT name FROM customers WHERE phone = NULL;',
      'SELECT name FROM customers WHERE phone == NULL;',
      'SELECT name FROM customers WITHOUT phone;',
    ],
    correctAnswer: 'A',
    explanation: 'IS NULL is the correct way to check for NULL. = NULL does not work because NULL is not a value.',
    points: 20,
  },
  {
    id: 'sql-11',
    difficulty: 'MEDIUM',
    title: 'Subquery in WHERE',
    tableDescription: 'Table: employees (id, name, salary), Table: departments (id, name, avg_salary)',
    query: 'SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
    question: 'Which query finds employees earning above average?',
    options: [
      'SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);',
      'SELECT name, salary FROM employees WHERE salary > AVG(salary);',
      'SELECT name, salary FROM employees HAVING salary > AVG(salary);',
      'SELECT name, salary FROM employees WHERE salary > AVERAGE(salary);',
    ],
    correctAnswer: 'A',
    explanation: 'A subquery in WHERE calculates the average first, then the outer query uses it for comparison.',
    points: 20,
  },
  // ── HARD ──
  {
    id: 'sql-12',
    difficulty: 'HARD',
    title: 'Self Join',
    tableDescription: 'Table: employees (id, name, manager_id, salary)',
    query: 'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;',
    question: 'Which query lists each employee with their manager name?',
    options: [
      'SELECT e.name AS employee, m.name AS manager FROM employees e JOIN employees m ON e.manager_id = m.id;',
      'SELECT name, manager FROM employees WHERE manager_id IS NOT NULL;',
      'SELECT e.name, m.name FROM employees e, employees m WHERE e.id = m.manager_id;',
      'SELECT employee, manager FROM employees SELF JOIN ON manager_id = id;',
    ],
    correctAnswer: 'A',
    explanation: 'A self join connects a table to itself using aliases (e and m) to differentiate the two instances.',
    points: 30,
  },
  {
    id: 'sql-13',
    difficulty: 'HARD',
    title: 'Window Function',
    tableDescription: 'Table: sales (id, employee_id, amount, sale_date)',
    query: 'SELECT employee_id, amount, RANK() OVER (ORDER BY amount DESC) as rank FROM sales;',
    question: 'Which query ranks sales amounts from highest to lowest?',
    options: [
      'SELECT employee_id, amount, RANK() OVER (ORDER BY amount DESC) as rank FROM sales;',
      'SELECT employee_id, amount, RANK(amount DESC) FROM sales;',
      'SELECT employee_id, amount, ROW_NUMBER(amount) DESC FROM sales;',
      'SELECT employee_id, amount FROM sales ORDER BY amount DESC RANK;',
    ],
    correctAnswer: 'A',
    explanation: 'RANK() OVER is a window function that assigns a rank based on the ORDER BY clause without collapsing rows.',
    points: 30,
  },
  {
    id: 'sql-14',
    difficulty: 'HARD',
    title: 'LEFT JOIN with COUNT',
    tableDescription: 'Tables: departments (id, name), employees (id, name, dept_id)',
    query: 'SELECT d.name, COUNT(e.id) as emp_count FROM departments d LEFT JOIN employees e ON d.id = e.dept_id GROUP BY d.name;',
    question: 'Which query lists all departments and their employee count (including 0)?',
    options: [
      'SELECT d.name, COUNT(e.id) as emp_count FROM departments d LEFT JOIN employees e ON d.id = e.dept_id GROUP BY d.name;',
      'SELECT name, COUNT(*) FROM departments JOIN employees ON id = dept_id;',
      'SELECT d.name, COUNT(e.id) FROM departments d, employees e GROUP BY d.name;',
      'SELECT d.name, SUM(e.id) FROM departments d LEFT JOIN employees e;',
    ],
    correctAnswer: 'A',
    explanation: 'LEFT JOIN ensures all departments appear even if they have no employees. COUNT(e.id) counts non-null matches.',
    points: 30,
  },
  {
    id: 'sql-15',
    difficulty: 'HARD',
    title: 'UPDATE with Subquery',
    tableDescription: 'Table: products (id, name, price, category)',
    query: "UPDATE products SET price = price * 1.1 WHERE category = (SELECT category FROM products WHERE name = 'Premium Widget');",
    question: 'Which query gives a 10% price increase to all products in the same category as "Premium Widget"?',
    options: [
      "UPDATE products SET price = price * 1.1 WHERE category = (SELECT category FROM products WHERE name = 'Premium Widget');",
      "UPDATE products SET price += 10% WHERE category = 'Premium Widget';",
      "UPDATE products INCREASE price BY 10% WHERE category = SELECT category FROM products;",
      "MODIFY products SET price = price * 1.1 IF category = 'Premium Widget';",
    ],
    correctAnswer: 'A',
    explanation: 'UPDATE with a subquery in WHERE allows you to filter based on a condition derived from the same or another table.',
    points: 30,
  },
  {
    id: 'sql-16',
    difficulty: 'HARD',
    title: 'CASE Expression',
    tableDescription: 'Table: orders (id, customer_id, total, status)',
    query: "SELECT id, total, CASE WHEN total > 1000 THEN 'High' WHEN total > 100 THEN 'Medium' ELSE 'Low' END AS tier FROM orders;",
    question: 'Which query categorizes orders by total amount?',
    options: [
      "SELECT id, total, CASE WHEN total > 1000 THEN 'High' WHEN total > 100 THEN 'Medium' ELSE 'Low' END AS tier FROM orders;",
      "SELECT id, total, IF(total > 1000, 'High', IF(total > 100, 'Medium', 'Low')) AS tier FROM orders;",
      "SELECT id, total, SWITCH(total > 1000, 'High', total > 100, 'Medium', 'Low') FROM orders;",
      "SELECT id, total, MAP total TO 'High', 'Medium', 'Low' FROM orders;",
    ],
    correctAnswer: 'A',
    explanation: 'CASE WHEN provides conditional logic in SQL. It evaluates conditions in order and returns the first match.',
    points: 30,
  },
];

// ─── 6. Algorithm Sort Challenges ───────────────────────────────────────────

export const ALGORITHM_SORT_CHALLENGES: AlgorithmSortChallenge[] = [
  // ── EASY ──
  {
    id: 'as-01',
    difficulty: 'EASY',
    title: 'Make a Cup of Tea',
    description: 'Put the steps for making a cup of tea in the correct order.',
    steps: [
      'Boil water in a kettle',
      'Place a tea bag in a cup',
      'Pour boiling water into the cup',
      'Let the tea steep for 3-5 minutes',
      'Remove the tea bag',
      'Add sugar or milk if desired',
      'Enjoy your tea',
    ],
    options: [
      'Add sugar or milk if desired',
      'Enjoy your tea',
      'Pour boiling water into the cup',
      'Place a tea bag in a cup',
      'Remove the tea bag',
      'Let the tea steep for 3-5 minutes',
      'Boil water in a kettle',
    ],
    explanation: 'This exercises algorithmic thinking: you need to boil water first, steep the tea, then customize and enjoy.',
    points: 10,
    algorithm: 'sequential',
  },
  {
    id: 'as-02',
    difficulty: 'EASY',
    title: 'Linear Search',
    description: 'Arrange the steps of linear search in the correct order.',
    steps: [
      'Start at the first element of the array',
      'Compare the current element with the target value',
      'If it matches, return the current index',
      'If it does not match, move to the next element',
      'If the end of the array is reached, return "not found"',
    ],
    options: [
      'Start at the first element of the array',
      'If the end of the array is reached, return "not found"',
      'Move to the next element',
      'If it matches, return the current index',
      'Compare the current element with the target value',
    ],
    explanation: 'Linear search checks each element one by one from the start until it finds the target or reaches the end.',
    points: 10,
    algorithm: 'linear-search',
  },
  {
    id: 'as-03',
    difficulty: 'EASY',
    title: 'Bubble Sort (Conceptual)',
    description: 'Arrange the core steps of one pass of bubble sort.',
    steps: [
      'Start with the first element',
      'Compare the current element with the next element',
      'If the current element is greater, swap them',
      'Move to the next pair of elements',
      'Repeat until the end of the array is reached',
    ],
    options: [
      'Move to the next pair of elements',
      'Repeat until the end of the array is reached',
      'Start with the first element',
      'If the current element is greater, swap them',
      'Compare the current element with the next element',
    ],
    explanation: 'Bubble sort repeatedly compares adjacent elements and swaps them if they are in the wrong order.',
    points: 10,
    algorithm: 'bubble-sort',
  },
  {
    id: 'as-04',
    difficulty: 'EASY',
    title: 'Binary Search Setup',
    description: 'Arrange the initial setup steps for binary search.',
    steps: [
      'Ensure the array is sorted',
      'Set the left pointer to the first index (0)',
      'Set the right pointer to the last index (length - 1)',
      'Calculate the middle index: mid = (left + right) / 2',
      'Compare the middle element with the target',
    ],
    options: [
      'Calculate the middle index: mid = (left + right) / 2',
      'Ensure the array is sorted',
      'Set the left pointer to the first index (0)',
      'Compare the middle element with the target',
      'Set the right pointer to the last index (length - 1)',
    ],
    explanation: 'Binary search requires a sorted array and uses two pointers to efficiently narrow down the search space.',
    points: 10,
    algorithm: 'binary-search',
  },
  // ── MEDIUM ──
  {
    id: 'as-05',
    difficulty: 'MEDIUM',
    title: 'Merge Sort',
    description: 'Arrange the steps of the merge sort algorithm.',
    steps: [
      'Check if the array has 1 or 0 elements (base case — already sorted)',
      'Find the middle index of the array',
      'Divide the array into a left half and a right half',
      'Recursively apply merge sort to the left half',
      'Recursively apply merge sort to the right half',
      'Merge the two sorted halves into one sorted array',
    ],
    options: [
      'Recursively apply merge sort to the right half',
      'Find the middle index of the array',
      'Divide the array into a left half and a right half',
      'Merge the two sorted halves into one sorted array',
      'Check if the array has 1 or 0 elements (base case — already sorted)',
      'Recursively apply merge sort to the left half',
    ],
    explanation: 'Merge sort is a divide-and-conquer algorithm. It splits the array, sorts each half recursively, then merges.',
    points: 20,
    algorithm: 'merge-sort',
  },
  {
    id: 'as-06',
    difficulty: 'MEDIUM',
    title: 'Quick Sort',
    description: 'Arrange the steps of the quick sort algorithm.',
    steps: [
      'Pick a pivot element from the array',
      'Partition the array: elements less than pivot go left, greater go right',
      'Recursively apply quick sort to the left sub-array',
      'Recursively apply quick sort to the right sub-array',
      'Combine the sorted left, pivot, and sorted right',
    ],
    options: [
      'Combine the sorted left, pivot, and sorted right',
      'Pick a pivot element from the array',
      'Recursively apply quick sort to the left sub-array',
      'Partition the array: elements less than pivot go left, greater go right',
      'Recursively apply quick sort to the right sub-array',
    ],
    explanation: 'Quick sort picks a pivot, partitions around it, and recursively sorts the partitions.',
    points: 20,
    algorithm: 'quick-sort',
  },
  {
    id: 'as-07',
    difficulty: 'MEDIUM',
    title: 'Binary Search Full Algorithm',
    description: 'Arrange the complete binary search algorithm steps.',
    steps: [
      'Ensure the array is sorted in ascending order',
      'Set left = 0 and right = array.length - 1',
      'While left <= right, continue searching',
      'Calculate mid = left + (right - left) / 2',
      'If array[mid] equals the target, return mid',
      'If array[mid] < target, set left = mid + 1',
      'If array[mid] > target, set right = mid - 1',
      'If the loop ends, return -1 (not found)',
    ],
    options: [
      'If array[mid] < target, set left = mid + 1',
      'Ensure the array is sorted in ascending order',
      'While left <= right, continue searching',
      'Set left = 0 and right = array.length - 1',
      'If the loop ends, return -1 (not found)',
      'Calculate mid = left + (right - left) / 2',
      'If array[mid] equals the target, return mid',
      'If array[mid] > target, set right = mid - 1',
    ],
    explanation: 'Binary search halves the search space each iteration. It runs in O(log n) time on sorted arrays.',
    points: 20,
    algorithm: 'binary-search',
  },
  {
    id: 'as-08',
    difficulty: 'MEDIUM',
    title: 'Insertion Sort',
    description: 'Arrange the steps of one iteration of insertion sort.',
    steps: [
      'Start from the second element (index 1)',
      'Store the current element as the key',
      'Compare the key with elements before it',
      'Shift elements greater than the key one position to the right',
      'Insert the key into the correct position',
      'Move to the next element and repeat',
    ],
    options: [
      'Move to the next element and repeat',
      'Compare the key with elements before it',
      'Start from the second element (index 1)',
      'Store the current element as the key',
      'Insert the key into the correct position',
      'Shift elements greater than the key one position to the right',
    ],
    explanation: 'Insertion sort builds a sorted array one element at a time by inserting each new element in its correct position.',
    points: 20,
    algorithm: 'insertion-sort',
  },
  // ── HARD ──
  {
    id: 'as-09',
    difficulty: 'HARD',
    title: 'Breadth-First Search (BFS)',
    description: 'Arrange the steps of BFS for graph traversal.',
    steps: [
      'Create a queue and enqueue the starting node',
      'Mark the starting node as visited',
      'While the queue is not empty',
      'Dequeue a node from the front of the queue',
      'Process (visit) the dequeued node',
      'For each unvisited neighbor of the current node',
      'Mark the neighbor as visited',
      'Enqueue the neighbor',
      'When the queue is empty, traversal is complete',
    ],
    options: [
      'Mark the starting node as visited',
      'Process (visit) the dequeued node',
      'When the queue is empty, traversal is complete',
      'For each unvisited neighbor of the current node',
      'Enqueue the neighbor',
      'While the queue is not empty',
      'Create a queue and enqueue the starting node',
      'Mark the neighbor as visited',
      'Dequeue a node from the front of the queue',
    ],
    explanation: 'BFS uses a queue (FIFO) to explore all neighbors at the current depth before moving to the next level.',
    points: 30,
    algorithm: 'bfs',
  },
  {
    id: 'as-10',
    difficulty: 'HARD',
    title: 'Depth-First Search (DFS)',
    description: 'Arrange the steps of recursive DFS for graph traversal.',
    steps: [
      'Mark the current node as visited',
      'Process (visit) the current node',
      'For each unvisited neighbor of the current node',
      'Recursively call DFS on the neighbor',
      'Backtrack when all neighbors are visited',
    ],
    options: [
      'Mark the current node as visited',
      'Recursively call DFS on the neighbor',
      'For each unvisited neighbor of the current node',
      'Backtrack when all neighbors are visited',
      'Process (visit) the current node',
    ],
    explanation: 'DFS uses recursion (or a stack) to explore as deep as possible along each branch before backtracking.',
    points: 30,
    algorithm: 'dfs',
  },
  {
    id: 'as-11',
    difficulty: 'HARD',
    title: "Dijkstra's Algorithm",
    description: "Arrange the steps of Dijkstra's shortest path algorithm.",
    steps: [
      'Set the distance to the source node as 0 and all others as infinity',
      'Add all nodes to a priority queue (min-heap)',
      'While the priority queue is not empty',
      'Extract the node with the smallest distance',
      'For each neighbor of the current node',
      'Calculate the tentative distance through the current node',
      'If the tentative distance is smaller, update the neighbor distance',
      'Update the priority queue with the new distance',
      'When complete, all shortest distances from the source are known',
    ],
    options: [
      'Set the distance to the source node as 0 and all others as infinity',
      'Extract the node with the smallest distance',
      'For each neighbor of the current node',
      'If the tentative distance is smaller, update the neighbor distance',
      'Update the priority queue with the new distance',
      'When complete, all shortest distances from the source are known',
      'Calculate the tentative distance through the current node',
      'Add all nodes to a priority queue (min-heap)',
      'While the priority queue is not empty',
    ],
    explanation: "Dijkstra's algorithm finds the shortest path from a source to all other nodes using a greedy approach with a priority queue.",
    points: 30,
    algorithm: 'dijkstra',
  },
  {
    id: 'as-12',
    difficulty: 'HARD',
    title: 'Heap Sort',
    description: 'Arrange the steps of the heap sort algorithm.',
    steps: [
      'Build a max-heap from the input array',
      'The largest element is now at the root (index 0)',
      'Swap the root with the last element of the heap',
      'Reduce the heap size by 1',
      'Heapify the root to restore the max-heap property',
      'Repeat steps 2-5 until the heap is empty',
      'The array is now sorted in ascending order',
    ],
    options: [
      'Reduce the heap size by 1',
      'Swap the root with the last element of the heap',
      'The array is now sorted in ascending order',
      'Heapify the root to restore the max-heap property',
      'Repeat steps 2-5 until the heap is empty',
      'Build a max-heap from the input array',
      'The largest element is now at the root (index 0)',
    ],
    explanation: 'Heap sort builds a max-heap and repeatedly extracts the maximum, placing it at the end of the array.',
    points: 30,
    algorithm: 'heap-sort',
  },
];

// ─── 7. CSS Styler Challenges ───────────────────────────────────────────────

export const CSS_STYLER_CHALLENGES: CSSStylerChallenge[] = [
  // ── EASY ──
  {
    id: 'css-01',
    difficulty: 'EASY',
    title: 'Center Text',
    description: 'Center the text of an h1 element horizontally.',
    correctCSS: 'text-align: center;',
    question: 'Which CSS property centers text horizontally?',
    options: [
      'A) text-align: center;',
      'B) align: center;',
      'C) text-center: true;',
      'D) horizontal-align: center;',
    ],
    correctAnswer: 'A',
    explanation: 'text-align: center is the correct way to center text content within a block-level element.',
    points: 10,
  },
  {
    id: 'css-02',
    difficulty: 'EASY',
    title: 'Bold Text',
    description: 'Make text bold using CSS.',
    correctCSS: 'font-weight: bold;',
    question: 'Which CSS makes text bold?',
    options: [
      'A) font-style: bold;',
      'B) font-weight: bold;',
      'C) text-style: bold;',
      'D) text-bold: true;',
    ],
    correctAnswer: 'B',
    explanation: 'font-weight controls the thickness of text. "bold" or numeric value 700 makes text bold.',
    points: 10,
  },
  {
    id: 'css-03',
    difficulty: 'EASY',
    title: 'Set Background Color',
    description: 'Set the background color of a div to light blue.',
    correctCSS: 'background-color: lightblue;',
    question: 'Which CSS sets the background color to light blue?',
    options: [
      'A) background: #lightblue;',
      'B) color-bg: lightblue;',
      'C) background-color: lightblue;',
      'D) bg-color: lightblue;',
    ],
    correctAnswer: 'C',
    explanation: 'background-color is the standard property. Named colors like lightblue are valid CSS values.',
    points: 10,
  },
  {
    id: 'css-04',
    difficulty: 'EASY',
    title: 'Add Padding',
    description: 'Add 20 pixels of padding on all sides of an element.',
    correctCSS: 'padding: 20px;',
    question: 'Which CSS adds 20px padding on all sides?',
    options: [
      'A) margin: 20px;',
      'B) spacing: 20px;',
      'C) padding: 20px;',
      'D) gap: 20px;',
    ],
    correctAnswer: 'C',
    explanation: 'padding creates space inside an element, between the content and the border. margin is outside.',
    points: 10,
  },
  // ── MEDIUM ──
  {
    id: 'css-05',
    difficulty: 'MEDIUM',
    title: 'Flexbox Center',
    description: 'Center a child element both horizontally and vertically inside a flex container.',
    correctCSS: 'display: flex;\njustify-content: center;\nalign-items: center;',
    question: 'Which CSS centers a child element in a flex container both ways?',
    options: [
      'A) display: flex; justify-content: center; align-items: center;',
      'B) display: grid; place-items: center;',
      'C) display: flex; text-align: center; vertical-align: middle;',
      'D) display: block; margin: auto; top: 50%;',
    ],
    correctAnswer: 'A',
    explanation: 'justify-content centers along the main axis (horizontal by default), align-items centers along the cross axis (vertical).',
    points: 20,
  },
  {
    id: 'css-06',
    difficulty: 'MEDIUM',
    title: 'Grid Layout',
    description: 'Create a 3-column grid with equal-width columns and a 10px gap.',
    correctCSS: 'display: grid;\ngrid-template-columns: repeat(3, 1fr);\ngap: 10px;',
    question: 'Which CSS creates a 3-column equal grid with 10px gaps?',
    options: [
      'A) display: grid; columns: 3; gap: 10px;',
      'B) display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;',
      'C) display: flex; flex-wrap: wrap; gap: 10px;',
      'D) display: grid; grid-columns: 3; spacing: 10px;',
    ],
    correctAnswer: 'B',
    explanation: 'grid-template-columns: repeat(3, 1fr) creates 3 equal columns. 1fr means "1 fraction of available space".',
    points: 20,
  },
  {
    id: 'css-07',
    difficulty: 'MEDIUM',
    title: 'Smooth Hover Transition',
    description: 'Make a button smoothly change its background color on hover over 0.3 seconds.',
    correctCSS: 'transition: background-color 0.3s ease;',
    question: 'Which CSS creates a smooth background color transition?',
    options: [
      'A) animation: background-color 0.3s;',
      'B) transition: background-color 0.3s ease;',
      'C) hover-transition: 0.3s;',
      'D) transform: background-color 0.3s;',
    ],
    correctAnswer: 'B',
    explanation: 'transition: background-color 0.3s ease smoothly animates the background-color property when it changes.',
    points: 20,
  },
  {
    id: 'css-08',
    difficulty: 'MEDIUM',
    title: 'Fixed Position Header',
    description: 'Create a header that stays at the top of the viewport when scrolling.',
    correctCSS: 'position: fixed;\ntop: 0;\nleft: 0;\nright: 0;\nz-index: 100;',
    question: 'Which CSS keeps a header fixed at the top of the viewport?',
    options: [
      'A) position: absolute; top: 0; left: 0;',
      'B) position: fixed; top: 0; left: 0; right: 0; z-index: 100;',
      'C) position: sticky; top: 0;',
      'D) float: top; width: 100%;',
    ],
    correctAnswer: 'B',
    explanation: 'position: fixed positions relative to the viewport. top/left/right: 0 spans the full width. z-index keeps it above other content.',
    points: 20,
  },
  // ── HARD ──
  {
    id: 'css-09',
    difficulty: 'HARD',
    title: 'CSS Grid Auto-Fill Responsive',
    description: 'Create a responsive grid that automatically adds columns as space allows, with a minimum column width of 250px.',
    correctCSS: 'display: grid;\ngrid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\ngap: 1rem;',
    question: 'Which CSS creates a responsive auto-filling grid with minimum 250px columns?',
    options: [
      'A) display: grid; grid-template-columns: auto 250px; gap: 1rem;',
      'B) display: flex; flex-wrap: wrap; min-width: 250px;',
      'C) display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;',
      'D) display: grid; grid-auto-columns: 250px; gap: 1rem;',
    ],
    correctAnswer: 'C',
    explanation: 'repeat(auto-fill, minmax(250px, 1fr)) creates as many columns as fit, each at least 250px wide, growing equally.',
    points: 30,
  },
  {
    id: 'css-10',
    difficulty: 'HARD',
    title: 'Custom Scrollbar',
    description: 'Style the scrollbar to be 8px wide with a dark thumb and light track.',
    correctCSS: 'scrollbar-width: thin;\nscrollbar-color: #555 #f1f1f1;',
    question: 'Which modern CSS styles the scrollbar to be thin with custom colors?',
    options: [
      'A) ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #555; }',
      'B) scrollbar-width: thin; scrollbar-color: #555 #f1f1f1;',
      'C) scroll-style: thin; scroll-thumb: #555; scroll-track: #f1f1f1;',
      'D) overflow: custom; bar-color: #555;',
    ],
    correctAnswer: 'B',
    explanation: 'scrollbar-width and scrollbar-color are the modern, cross-browser standard for scrollbar styling.',
    points: 30,
  },
  {
    id: 'css-11',
    difficulty: 'HARD',
    title: 'Aspect Ratio Box',
    description: 'Create a responsive box that maintains a 16:9 aspect ratio.',
    correctCSS: 'aspect-ratio: 16 / 9;\nwidth: 100%;',
    question: 'Which CSS creates a responsive 16:9 aspect ratio container?',
    options: [
      'A) padding-top: 56.25%; position: relative;',
      'B) aspect-ratio: 16 / 9; width: 100%;',
      'C) ratio: 16/9; responsive: true;',
      'D) height: calc(width * 9 / 16);',
    ],
    correctAnswer: 'B',
    explanation: 'The aspect-ratio property is the modern way to set a preferred aspect ratio. width: 100% makes it responsive.',
    points: 30,
  },
  {
    id: 'css-12',
    difficulty: 'HARD',
    title: 'Container Query',
    description: 'Apply styles based on the container width being at least 400px.',
    correctCSS: '@container (min-width: 400px) {\n  .card {\n    flex-direction: row;\n  }\n}',
    question: 'Which CSS applies styles when a container is at least 400px wide?',
    options: [
      'A) @media (min-width: 400px) { .card { flex-direction: row; } }',
      'B) @container (min-width: 400px) { .card { flex-direction: row; } }',
      'C) @parent (width >= 400px) { .card { flex-direction: row; } }',
      'D) container: min-width(400px) { .card { flex-direction: row; } }',
    ],
    correctAnswer: 'B',
    explanation: '@container queries apply styles based on the container size (parent), not the viewport — ideal for reusable components.',
    points: 30,
  },
];

// ─── 8. Git Simulator Challenges ────────────────────────────────────────────

export const GIT_CHALLENGES: GitChallenge[] = [
  // ── EASY ──
  {
    id: 'git-01',
    difficulty: 'EASY',
    scenario: 'You want to see what files have been modified in your working directory.',
    correctCommand: 'git status',
    question: 'Which command shows the current state of your working directory?',
    options: [
      'A) git status',
      'B) git show',
      'C) git list',
      'D) git info',
    ],
    correctAnswer: 'A',
    explanation: 'git status shows which files are modified, staged, untracked, or deleted.',
    points: 10,
  },
  {
    id: 'git-02',
    difficulty: 'EASY',
    scenario: 'You have modified a file and want to stage it for the next commit.',
    correctCommand: 'git add <filename>',
    question: 'Which command stages a file for commit?',
    options: [
      'A) git stage <filename>',
      'B) git add <filename>',
      'C) git commit <filename>',
      'D) git push <filename>',
    ],
    correctAnswer: 'B',
    explanation: 'git add moves changes from the working directory to the staging area (index).',
    points: 10,
  },
  {
    id: 'git-03',
    difficulty: 'EASY',
    scenario: 'You have staged your changes and are ready to save them with a descriptive message.',
    correctCommand: 'git commit -m "Your message here"',
    question: 'Which command commits staged changes with a message?',
    options: [
      'A) git save -m "message"',
      'B) git commit -m "message"',
      'C) git push -m "message"',
      'D) git store "message"',
    ],
    correctAnswer: 'B',
    explanation: 'git commit -m saves staged changes with a descriptive message. The -m flag allows inline messages.',
    points: 10,
  },
  {
    id: 'git-04',
    difficulty: 'EASY',
    scenario: 'You want to see the commit history of your repository.',
    correctCommand: 'git log',
    question: 'Which command shows the commit history?',
    options: [
      'A) git history',
      'B) git log',
      'C) git commits',
      'D) git timeline',
    ],
    correctAnswer: 'B',
    explanation: 'git log displays the commit history in reverse chronological order, showing hashes, authors, dates, and messages.',
    points: 10,
  },
  // ── MEDIUM ──
  {
    id: 'git-05',
    difficulty: 'MEDIUM',
    scenario: 'You made changes to a file but want to discard them and restore the last committed version.',
    correctCommand: 'git checkout -- <filename>',
    question: 'Which command discards unstaged changes to a file?',
    options: [
      'A) git undo <filename>',
      'B) git reset <filename>',
      'C) git checkout -- <filename>',
      'D) git revert <filename>',
    ],
    correctAnswer: 'C',
    explanation: 'git checkout -- <file> discards working directory changes. Note: git restore <file> is the modern equivalent.',
    points: 20,
  },
  {
    id: 'git-06',
    difficulty: 'MEDIUM',
    scenario: 'You accidentally staged a file that should not be committed. You want to unstage it.',
    correctCommand: 'git restore --staged <filename>',
    question: 'Which command unstages a file while keeping the changes?',
    options: [
      'A) git unstage <filename>',
      'B) git restore --staged <filename>',
      'C) git rm --cached <filename>',
      'D) Both B and C',
    ],
    correctAnswer: 'D',
    explanation: 'Both git restore --staged and git rm --cached unstage a file. restore --staged is the recommended modern command.',
    points: 20,
  },
  {
    id: 'git-07',
    difficulty: 'MEDIUM',
    scenario: 'You are working on a feature and want to create a new branch called "feature/login".',
    correctCommand: 'git checkout -b feature/login',
    question: 'Which command creates and switches to a new branch?',
    options: [
      'A) git new branch feature/login',
      'B) git branch feature/login && git switch feature/login',
      'C) git checkout -b feature/login',
      'D) git create branch feature/login',
    ],
    correctAnswer: 'C',
    explanation: 'git checkout -b creates a new branch and immediately switches to it. The modern equivalent is git switch -c.',
    points: 20,
  },
  {
    id: 'git-08',
    difficulty: 'MEDIUM',
    scenario: 'You are on the develop branch and want to merge the feature branch into it.',
    correctCommand: 'git merge feature-branch',
    question: 'Which command merges another branch into your current branch?',
    options: [
      'A) git combine feature-branch',
      'B) git merge feature-branch',
      'C) git join feature-branch',
      'D) git pull feature-branch',
    ],
    correctAnswer: 'B',
    explanation: 'git merge integrates changes from another branch into the current branch. It creates a merge commit if needed.',
    points: 20,
  },
  {
    id: 'git-09',
    difficulty: 'MEDIUM',
    scenario: 'You want to push your local branch "feature/login" to the remote for the first time.',
    correctCommand: 'git push -u origin feature/login',
    question: 'Which command pushes a local branch to the remote and sets up tracking?',
    options: [
      'A) git push origin feature/login',
      'B) git push -u origin feature/login',
      'C) git upload feature/login',
      'D) Both A and B work, but B also sets upstream tracking',
    ],
    correctAnswer: 'D',
    explanation: '-u (or --set-upstream) links the local branch to the remote, so future git push commands work without arguments.',
    points: 20,
  },
  // ── HARD ──
  {
    id: 'git-10',
    difficulty: 'HARD',
    scenario: 'You committed something sensitive (like a password) to the main branch and need to undo the last commit while keeping the changes as unstaged.',
    correctCommand: 'git reset --soft HEAD~1',
    question: 'Which command undoes the last commit but keeps changes staged?',
    options: [
      'A) git revert HEAD',
      'B) git reset --soft HEAD~1',
      'C) git reset --hard HEAD~1',
      'D) git checkout HEAD~1',
    ],
    correctAnswer: 'B',
    explanation: '--soft keeps changes staged. --hard would discard them entirely. revert creates a new commit that undoes changes.',
    points: 30,
  },
  {
    id: 'git-11',
    difficulty: 'HARD',
    scenario: 'You want to see a concise, one-line-per-commit summary of the branch history with a graph.',
    correctCommand: 'git log --oneline --graph --all',
    question: 'Which command shows a compact graphical commit history?',
    options: [
      'A) git log --short',
      'B) git log --oneline --graph --all',
      'C) git show --graph',
      'D) git branch --visual',
    ],
    correctAnswer: 'B',
    explanation: '--oneline shortens each commit to one line. --graph shows branch/merge lines. --all includes all branches.',
    points: 30,
  },
  {
    id: 'git-12',
    difficulty: 'HARD',
    scenario: 'You have uncommitted changes and need to temporarily switch to another branch to fix a bug.',
    correctCommand: 'git stash',
    question: 'Which command temporarily saves uncommitted changes?',
    options: [
      'A) git save',
      'B) git stash',
      'C) git freeze',
      'D) git snapshot',
    ],
    correctAnswer: 'B',
    explanation: 'git stash saves your working directory and index state. Use git stash pop to restore them later.',
    points: 30,
  },
  {
    id: 'git-13',
    difficulty: 'HARD',
    scenario: 'You accidentally committed on the wrong branch. You want to move those commits to a new branch and reset the old branch.',
    correctCommand: 'git branch new-branch\ngit reset --hard HEAD~1',
    question: 'Which sequence moves the last commit to a new branch and resets the current one?',
    options: [
      'A) git branch new-branch && git reset --hard HEAD~1',
      'B) git move HEAD~1 to new-branch',
      'C) git checkout new-branch && git cherry-pick HEAD',
      'D) git rebase new-branch',
    ],
    correctAnswer: 'A',
    explanation: 'First create the new branch at the current commit, then reset the current branch back one commit. The new branch retains the work.',
    points: 30,
  },
  {
    id: 'git-14',
    difficulty: 'HARD',
    scenario: 'You want to rewrite the last commit message without changing any files.',
    correctCommand: 'git commit --amend -m "New commit message"',
    question: 'Which command changes the message of the most recent commit?',
    options: [
      'A) git edit commit',
      'B) git commit --amend -m "New message"',
      'C) git reword HEAD',
      'D) git rename commit "New message"',
    ],
    correctAnswer: 'B',
    explanation: '--amend modifies the last commit. With -m it changes the message. WARNING: Never amend commits that have been pushed.',
    points: 30,
  },
];

// ─── Utility Functions ──────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomItems<T>(
  pool: T[],
  difficulty?: string,
  count: number = 5,
): T[] {
  let filtered = pool;
  if (difficulty && difficulty !== 'ALL') {
    filtered = pool.filter(
      (item) =>
        (item as Record<string, unknown>).difficulty ===
        difficulty.toUpperCase(),
    );
  }
  return shuffleArray(filtered).slice(0, count);
}

export function getRandomCodeTyperChallenge(
  difficulty?: string,
  count: number = 5,
): CodeTyperChallenge[] {
  return getRandomItems(CODE_TYPER_CHALLENGES, difficulty, count);
}

export function getRandomCodeCompletionChallenge(
  difficulty?: string,
  count: number = 5,
): CodeCompletionChallenge[] {
  return getRandomItems(CODE_COMPLETION_CHALLENGES, difficulty, count);
}

export function getRandomPatternChallenge(
  difficulty?: string,
  count: number = 5,
): PatternChallenge[] {
  return getRandomItems(PATTERN_CHALLENGES, difficulty, count);
}

export function getRandomErrorHunterChallenge(
  difficulty?: string,
  count: number = 5,
): ErrorHunterChallenge[] {
  return getRandomItems(ERROR_HUNTER_CHALLENGES, difficulty, count);
}

export function getRandomSQLChallenge(
  difficulty?: string,
  count: number = 5,
): SQLChallenge[] {
  return getRandomItems(SQL_CHALLENGES, difficulty, count);
}

export function getRandomAlgorithmSortChallenge(
  difficulty?: string,
  count: number = 5,
): AlgorithmSortChallenge[] {
  return getRandomItems(ALGORITHM_SORT_CHALLENGES, difficulty, count);
}

export function getRandomCSSStylerChallenge(
  difficulty?: string,
  count: number = 5,
): CSSStylerChallenge[] {
  return getRandomItems(CSS_STYLER_CHALLENGES, difficulty, count);
}

export function getRandomGitChallenge(
  difficulty?: string,
  count: number = 5,
): GitChallenge[] {
  return getRandomItems(GIT_CHALLENGES, difficulty, count);
}

// Re-export shuffleArray for convenience
export { shuffleArray };
