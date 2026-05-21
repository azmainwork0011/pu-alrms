// ═══════════════════════════════════════════════════════════════════
// Game Question Banks — Data for all game engines
// ═══════════════════════════════════════════════════════════════════

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  codeSnippet?: string;
}

export interface MemoryPair {
  id: string;
  left: string;
  right: string;
  color?: string;
}

export interface TypingSnippet {
  id: string;
  code: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PuzzleItem {
  id: string;
  title: string;
  lines: string[];
  correctOrder: string[];
}

export interface ReactionChallenge {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  timeLimit: number; // seconds
}

export interface MathProblem {
  id: string;
  question: string;
  answer: number;
  options: number[];
  explanation?: string;
}

export interface WordPuzzle {
  id: string;
  word: string;
  hint: string;
  category: string;
}

export interface PatternSequence {
  id: string;
  sequence: (string | number)[];
  answer: string | number;
  options: (string | number)[];
  hint?: string;
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ QUESTIONS
// ═══════════════════════════════════════════════════════════════════
export const QUIZ_BANKS: Record<string, QuizQuestion[]> = {
  'quiz-python': [
    { question: 'What is the output of print(type([]))?', options: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"], correctIndex: 0 },
    { question: 'Which keyword is used to define a function in Python?', options: ['function', 'def', 'func', 'define'], correctIndex: 1 },
    { question: 'What does len() return for a string "hello"?', options: ['4', '5', '6', 'Error'], correctIndex: 1 },
    { question: 'What is a list comprehension?', options: ['A way to read lists', 'A concise way to create lists', 'A sorting method', 'A list deletion technique'], correctIndex: 1 },
    { question: 'Which of these is immutable in Python?', options: ['list', 'dict', 'set', 'tuple'], correctIndex: 3 },
    { question: 'What does "self" refer to in a class method?', options: ['The class', 'The current instance', 'The parent class', 'The module'], correctIndex: 1 },
    { question: 'How do you handle exceptions in Python?', options: ['try/except', 'try/catch', 'begin/rescue', 'do/error'], correctIndex: 0 },
    { question: 'What is a decorator in Python?', options: ['A function that modifies another function', 'A CSS-like styling tool', 'A type of loop', 'A data structure'], correctIndex: 0 },
    { question: 'What does "yield" do?', options: ['Returns a value and pauses the function', 'Ends the function', 'Throws an error', 'Creates a class'], correctIndex: 0 },
    { question: 'Which method is called when an object is created?', options: ['__new__', '__init__', '__create__', '__start__'], correctIndex: 1 },
  ],
  'quiz-javascript': [
    { question: 'What is "===" in JavaScript?', options: ['Assignment', 'Loose equality', 'Strict equality', 'Not equal'], correctIndex: 2 },
    { question: 'What does "typeof null" return?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctIndex: 2 },
    { question: 'What is a closure?', options: ['A function with access to its outer scope', 'A way to close tabs', 'A type of loop', 'A CSS property'], correctIndex: 0 },
    { question: 'Which array method creates a new array?', options: ['forEach', 'map', 'splice', 'sort'], correctIndex: 1 },
    { question: 'What is async/await used for?', options: ['Error handling', 'DOM manipulation', 'Handling promises', 'Event listening'], correctIndex: 2 },
    { question: 'What does JSON.stringify do?', options: ['Parses JSON', 'Converts object to JSON string', 'Creates a JSON object', 'Validates JSON'], correctIndex: 1 },
    { question: 'What is the event loop?', options: ['A for loop', 'A mechanism for async execution', 'A CSS animation', 'A type of array'], correctIndex: 1 },
    { question: 'What is "undefined" in JavaScript?', options: ['A variable with no value', 'A boolean false', 'A string', 'An object'], correctIndex: 0 },
    { question: 'Which is NOT a primitive type?', options: ['string', 'number', 'object', 'boolean'], correctIndex: 2 },
    { question: 'What does "spread operator" (...) do?', options: ['Deletes properties', 'Copies/enumerables', 'Creates classes', 'Imports modules'], correctIndex: 1 },
  ],
  'quiz-html-css': [
    { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Logic', 'Home Tool Markup Language'], correctIndex: 0 },
    { question: 'Which CSS property changes text color?', options: ['font-color', 'text-color', 'color', 'foreground-color'], correctIndex: 2 },
    { question: 'What is the difference between id and class?', options: ['No difference', 'id is unique, class can be reused', 'class is unique, id can be reused', 'id is for CSS only'], correctIndex: 1 },
    { question: 'What is Flexbox used for?', options: ['Database queries', 'Layout and alignment', '3D rendering', 'Audio processing'], correctIndex: 1 },
    { question: 'Which tag creates a hyperlink?', options: ['<link>', '<a>', '<href>', '<url>'], correctIndex: 1 },
    { question: 'What is CSS Grid?', options: ['A database system', 'A 2D layout system', 'A graphics API', 'A framework'], correctIndex: 1 },
    { question: 'What does "position: absolute" do?', options: ['Positions relative to parent', 'Positions relative to viewport', 'Positions at top of page', 'Removes element'], correctIndex: 0 },
    { question: 'What is the box model order (inside out)?', options: ['margin, border, padding, content', 'content, padding, border, margin', 'border, padding, content, margin', 'padding, content, border, margin'], correctIndex: 1 },
    { question: 'What is a semantic HTML element?', options: ['<div> and <span>', '<header>, <nav>, <main>', '<b> and <i>', '<table> and <form>'], correctIndex: 1 },
    { question: 'What does z-index control?', options: ['Width', 'Height', 'Stacking order', 'Opacity'], correctIndex: 2 },
  ],
  'quiz-sql': [
    { question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Question Language', 'System Query Logic', 'Standard Query Logic'], correctIndex: 0 },
    { question: 'Which command retrieves data?', options: ['GET', 'SELECT', 'FETCH', 'FIND'], correctIndex: 1 },
    { question: 'What does JOIN do?', options: ['Deletes data', 'Combines rows from tables', 'Creates a table', 'Sorts data'], correctIndex: 1 },
    { question: 'What is a primary key?', options: ['Any column', 'A unique identifier for each row', 'A foreign reference', 'An index'], correctIndex: 1 },
    { question: 'Which clause filters results?', options: ['HAVING', 'WHERE', 'FILTER', 'IF'], correctIndex: 1 },
    { question: 'What does GROUP BY do?', options: ['Sorts data', 'Groups rows with same values', 'Creates groups', 'Deletes duplicates'], correctIndex: 1 },
    { question: 'What is a foreign key?', options: ['A primary key in another table', 'A key for encryption', 'A backup key', 'An auto-increment key'], correctIndex: 0 },
    { question: 'Which command modifies existing data?', options: ['INSERT', 'ALTER', 'UPDATE', 'MODIFY'], correctIndex: 2 },
  ],
  'quiz-dsa': [
    { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1 },
    { question: 'Which data structure uses FIFO?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctIndex: 1 },
    { question: 'What is a hash map collision?', options: ['Map is full', 'Two keys hash to same index', 'Memory overflow', 'Type error'], correctIndex: 1 },
    { question: 'Which traversal visits root, left, right?', options: ['Inorder', 'Preorder', 'Postorder', 'Level order'], correctIndex: 1 },
    { question: 'What is the worst case of quicksort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctIndex: 2 },
    { question: 'What does LIFO stand for?', options: ['Last In First Out', 'Last Index First Order', 'Linear Input Fast Output', 'Light Input Full Output'], correctIndex: 0 },
    { question: 'Which is a balanced BST?', options: ['Binary Tree', 'AVL Tree', 'Linked List', 'Heap'], correctIndex: 1 },
    { question: 'What is dynamic programming?', options: ['Running code at runtime', 'Optimization by storing subproblem results', 'Object-oriented programming', 'Database programming'], correctIndex: 1 },
  ],
};

// Default quiz bank for games without specific questions
export const DEFAULT_QUIZ_BANK: QuizQuestion[] = [
  { question: 'What is a variable?', options: ['A storage location', 'A function', 'A loop', 'A class'], correctIndex: 0 },
  { question: 'Which language runs in the browser?', options: ['Python', 'Java', 'JavaScript', 'C++'], correctIndex: 2 },
  { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Logic', 'None of these'], correctIndex: 0 },
  { question: 'What is an API?', options: ['Application Programming Interface', 'Advanced Programming Integration', 'Application Process Integration', 'None of these'], correctIndex: 0 },
  { question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style System', 'Creative Style Sheets', 'Coded Style System'], correctIndex: 0 },
  { question: 'Which is a version control system?', options: ['Git', 'Grep', 'Grunt', 'Gulp'], correctIndex: 0 },
  { question: 'What is OOP?', options: ['Object-Oriented Programming', 'Online Ordered Processing', 'Open Output Protocol', 'None of these'], correctIndex: 0 },
  { question: 'What is a framework?', options: ['A code library with structure', 'A CSS file', 'A database', 'An IDE'], correctIndex: 0 },
];

// ═══════════════════════════════════════════════════════════════════
// MEMORY PAIRS
// ═══════════════════════════════════════════════════════════════════
export const MEMORY_BANKS: Record<string, MemoryPair[]> = {
  'memory-code-match': [
    { id: '1', left: 'for loop', right: 'for (let i = 0; i < n; i++)' },
    { id: '2', left: 'while loop', right: 'while (condition) { }' },
    { id: '3', left: 'function', right: 'function name() { }' },
    { id: '4', left: 'array', right: '[1, 2, 3, 4, 5]' },
    { id: '5', left: 'object', right: '{ key: "value" }' },
    { id: '6', left: 'if statement', right: 'if (condition) { }' },
    { id: '7', left: 'try/catch', right: 'try { } catch (e) { }' },
    { id: '8', left: 'class', right: 'class Name { constructor() }' },
  ],
  'memory-api-match': [
    { id: '1', left: 'GET /users', right: 'List all users' },
    { id: '2', left: 'POST /users', right: 'Create a user' },
    { id: '3', left: 'PUT /users/:id', right: 'Update a user' },
    { id: '4', left: 'DELETE /users/:id', right: 'Delete a user' },
    { id: '5', left: 'GET /users/:id', right: 'Get one user' },
    { id: '6', left: 'PATCH /users/:id', right: 'Partial update' },
    { id: '7', left: 'POST /auth/login', right: 'User login' },
    { id: '8', left: 'POST /auth/logout', right: 'User logout' },
  ],
  'memory-emoji-decode': [
    { id: '1', left: '🐛', right: 'Bug' },
    { id: '2', left: '🔥', right: 'Trending' },
    { id: '3', left: '🚀', right: 'Launch' },
    { id: '4', left: '🔒', right: 'Security' },
    { id: '5', left: '📦', right: 'Package' },
    { id: '6', left: '🔧', right: 'Settings/Config' },
    { id: '7', left: '✅', right: 'Success/Pass' },
    { id: '8', left: '❌', right: 'Error/Fail' },
  ],
  'memory-color-pairs': [
    { id: '1', left: 'Red', right: '#FF0000' },
    { id: '2', left: 'Green', right: '#00FF00' },
    { id: '3', left: 'Blue', right: '#0000FF' },
    { id: '4', left: 'Black', right: '#000000' },
    { id: '5', left: 'White', right: '#FFFFFF' },
    { id: '6', left: 'Purple', right: '#800080' },
    { id: '7', left: 'Orange', right: '#FFA500' },
    { id: '8', left: 'Cyan', right: '#00FFFF' },
  ],
};

export const DEFAULT_MEMORY_BANK: MemoryPair[] = [
  { id: '1', left: 'Python', right: '🐍' },
  { id: '2', left: 'JavaScript', right: '⚡' },
  { id: '3', left: 'Java', right: '☕' },
  { id: '4', left: 'C++', right: '🔧' },
  { id: '5', left: 'React', right: '⚛️' },
  { id: '6', left: 'Node.js', right: '🟢' },
  { id: '7', left: 'Git', right: '🔀' },
  { id: '8', left: 'Docker', right: '🐳' },
];

// ═══════════════════════════════════════════════════════════════════
// TYPING SNIPPETS
// ═══════════════════════════════════════════════════════════════════
export const TYPING_BANKS: Record<string, TypingSnippet[]> = {
  'typing-speed-code': [
    { id: '1', code: 'const sum = (a, b) => a + b;', language: 'JavaScript', difficulty: 'easy' },
    { id: '2', code: 'for (let i = 0; i < arr.length; i++) {\n  console.log(arr[i]);\n}', language: 'JavaScript', difficulty: 'medium' },
    { id: '3', code: 'const filtered = arr.filter(x => x > 0).map(x => x * 2);', language: 'JavaScript', difficulty: 'medium' },
    { id: '4', code: 'async function fetchData(url) {\n  const res = await fetch(url);\n  return res.json();\n}', language: 'JavaScript', difficulty: 'hard' },
  ],
  'typing-python': [
    { id: '1', code: 'def greet(name):\n    return f"Hello, {name}!"', language: 'Python', difficulty: 'easy' },
    { id: '2', code: 'squares = [x**2 for x in range(10)]', language: 'Python', difficulty: 'medium' },
    { id: '3', code: 'class Dog:\n    def __init__(self, name):\n        self.name = name', language: 'Python', difficulty: 'medium' },
  ],
  'typing-html': [
    { id: '1', code: '<div class="container">\n  <h1>Hello World</h1>\n  <p>Welcome</p>\n</div>', language: 'HTML', difficulty: 'easy' },
    { id: '2', code: '<form action="/submit" method="POST">\n  <input type="text" name="q" />\n  <button type="submit">Go</button>\n</form>', language: 'HTML', difficulty: 'medium' },
  ],
  'typing-css': [
    { id: '1', code: '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 1rem;\n}', language: 'CSS', difficulty: 'medium' },
    { id: '2', code: '@media (max-width: 768px) {\n  .sidebar { display: none; }\n  .content { width: 100%; }\n}', language: 'CSS', difficulty: 'hard' },
  ],
  'typing-sql': [
    { id: '1', code: 'SELECT name, email FROM users WHERE role = "admin";', language: 'SQL', difficulty: 'easy' },
    { id: '2', code: 'SELECT u.name, COUNT(o.id) as orders\nFROM users u\nJOIN orders o ON u.id = o.user_id\nGROUP BY u.id;', language: 'SQL', difficulty: 'hard' },
  ],
};

export const DEFAULT_TYPING_BANK: TypingSnippet[] = [
  { id: '1', code: 'console.log("Hello, World!");', language: 'JavaScript', difficulty: 'easy' },
  { id: '2', code: 'const data = await fetch("/api").then(r => r.json());', language: 'JavaScript', difficulty: 'medium' },
  { id: '3', code: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}', language: 'JavaScript', difficulty: 'hard' },
];

// ═══════════════════════════════════════════════════════════════════
// REACTION CHALLENGES
// ═══════════════════════════════════════════════════════════════════
export const REACTION_BANKS: Record<string, ReactionChallenge[]> = {
  'reaction-bug-spot': [
    { id: '1', prompt: 'Which line has the bug?\nfor (let i = 0; i <= arr.length; i++)', options: ['Line 1 (correct)', 'Line 2 (off-by-one)', 'No bug', 'Both lines'], correctIndex: 1, timeLimit: 5 },
    { id: '2', prompt: 'Which line has the bug?\nconst x = null;\nconsole.log(x.length);', options: ['Line 1', 'Line 2 (null.length)', 'No bug', 'Both'], correctIndex: 1, timeLimit: 5 },
    { id: '3', prompt: 'Which line has the bug?\nif (x = 5) { doSomething(); }', options: ['Line 1 (assignment not comparison)', 'No bug', 'Missing semicolon', 'Wrong syntax'], correctIndex: 0, timeLimit: 5 },
  ],
  'reaction-http-status': [
    { id: '1', prompt: 'Status 404 means:', options: ['Server Error', 'Not Found', 'Unauthorized', 'Redirect'], correctIndex: 1, timeLimit: 3 },
    { id: '2', prompt: 'Status 200 means:', options: ['Created', 'Error', 'OK', 'Redirect'], correctIndex: 2, timeLimit: 3 },
    { id: '3', prompt: 'Status 500 means:', options: ['Not Found', 'Bad Request', 'Server Error', 'Unauthorized'], correctIndex: 2, timeLimit: 3 },
    { id: '4', prompt: 'Status 201 means:', options: ['OK', 'Created', 'Accepted', 'No Content'], correctIndex: 1, timeLimit: 3 },
    { id: '5', prompt: 'Status 401 means:', options: ['Forbidden', 'Not Found', 'Unauthorized', 'Bad Request'], correctIndex: 2, timeLimit: 3 },
    { id: '6', prompt: 'Status 403 means:', options: ['Unauthorized', 'Forbidden', 'Not Found', 'Server Error'], correctIndex: 1, timeLimit: 3 },
    { id: '7', prompt: 'Status 301 means:', options: ['Temporary Redirect', 'Permanent Redirect', 'Not Modified', 'Bad Gateway'], correctIndex: 1, timeLimit: 3 },
    { id: '8', prompt: 'Status 304 means:', options: ['Not Modified', 'Not Found', 'No Content', 'Moved'], correctIndex: 0, timeLimit: 3 },
  ],
};

export const DEFAULT_REACTION_BANK: ReactionChallenge[] = [
  { id: '1', prompt: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctIndex: 1, timeLimit: 5 },
  { id: '2', prompt: 'What language runs in browser?', options: ['Python', 'Java', 'JavaScript', 'C++'], correctIndex: 2, timeLimit: 5 },
  { id: '3', prompt: 'HTML stands for?', options: ['Hyper Text Markup Language', 'High Tech ML', 'Home Tool ML', 'None'], correctIndex: 0, timeLimit: 5 },
  { id: '4', prompt: 'CSS stands for?', options: ['Cascading Style Sheets', 'Computer SS', 'Creative SS', 'None'], correctIndex: 0, timeLimit: 5 },
  { id: '5', prompt: 'Git is for?', options: ['Version control', 'Styling', 'Database', 'Server'], correctIndex: 0, timeLimit: 5 },
];

// ═══════════════════════════════════════════════════════════════════
// MATH PROBLEMS
// ═══════════════════════════════════════════════════════════════════
export function generateMathProblems(count: number, difficulty: 'easy' | 'medium' | 'hard'): MathProblem[] {
  const problems: MathProblem[] = [];
  for (let i = 0; i < count; i++) {
    if (difficulty === 'easy') {
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      const op = Math.floor(Math.random() * 4);
      const ops = ['+', '-', '×', '÷'] as const;
      let answer: number;
      if (op === 0) answer = a + b;
      else if (op === 1) answer = a - b;
      else if (op === 2) { const va = Math.floor(Math.random() * 12) + 1; const vb = Math.floor(Math.random() * 12) + 1; problems.push({ id: `m${i}`, question: `${va} × ${vb} = ?`, answer: va * vb, options: generateOptions(va * vb), explanation: `${va} × ${vb} = ${va * vb}` }); continue; }
      else { const va = Math.floor(Math.random() * 10) + 1; const vb = va * (Math.floor(Math.random() * 10) + 1); problems.push({ id: `m${i}`, question: `${vb} ÷ ${va} = ?`, answer: vb / va, options: generateOptions(vb / va), explanation: `${vb} ÷ ${va} = ${vb / va}` }); continue; }
      problems.push({ id: `m${i}`, question: `${a} ${ops[op]} ${b} = ?`, answer, options: generateOptions(answer), explanation: `${a} ${ops[op]} ${b} = ${answer}` });
    } else if (difficulty === 'medium') {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 50) + 10;
      const c = Math.floor(Math.random() * 50) + 10;
      const op = Math.floor(Math.random() * 2);
      const answer = op === 0 ? a * b + c : a + b * c;
      problems.push({ id: `m${i}`, question: op === 0 ? `${a} × ${b} + ${c} = ?` : `${a} + ${b} × ${c} = ?`, answer, options: generateOptions(answer), explanation: `Following order of operations: ${answer}` });
    } else {
      const base = Math.floor(Math.random() * 4) + 2;
      const exp = Math.floor(Math.random() * 3) + 2;
      const answer = Math.pow(base, exp);
      problems.push({ id: `m${i}`, question: `${base}${exp === 2 ? '²' : exp === 3 ? '³' : '⁴'} = ?`, answer, options: generateOptions(answer), explanation: `${base}^${exp} = ${answer}` });
    }
  }
  return problems;
}

function generateOptions(correct: number): number[] {
  const options = new Set<number>([correct]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const opt = correct + (offset === 0 ? 1 : offset);
    if (opt > 0) options.add(opt);
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
}

// ═══════════════════════════════════════════════════════════════════
// WORD PUZZLES
// ═══════════════════════════════════════════════════════════════════
export const WORD_BANKS: Record<string, WordPuzzle[]> = {
  'word-code-wordle': [
    { word: 'ARRAY', hint: 'A data structure that stores multiple values', category: 'Data Structure' },
    { word: 'CLASS', hint: 'A blueprint for creating objects', category: 'OOP' },
    { word: 'STACK', hint: 'LIFO data structure', category: 'Data Structure' },
    { word: 'QUEUE', hint: 'FIFO data structure', category: 'Data Structure' },
    { word: 'TOKEN', hint: 'Used for authentication', category: 'Security' },
    { word: 'QUERY', hint: 'A request for data from a database', category: 'Database' },
    { word: 'PARSE', hint: 'To analyze a string or data', category: 'General' },
    { word: 'SCOPE', hint: 'The accessibility of variables', category: 'General' },
    { word: 'ASYNC', hint: 'Non-blocking execution', category: 'Concept' },
    { word: 'CACHE', hint: 'Temporary data storage for speed', category: 'Performance' },
    { word: 'DEBUG', hint: 'Finding and fixing errors', category: 'Process' },
    { word: 'ROUTE', hint: 'URL path mapping', category: 'Web' },
    { word: 'STATE', hint: 'Data that changes over time', category: 'React' },
    { word: 'FETCH', hint: 'API request method', category: 'Web' },
  ],
};

export const DEFAULT_WORD_BANK: WordPuzzle[] = [
  { word: 'CODE', hint: 'What programmers write', category: 'General' },
  { word: 'DATA', hint: 'Information stored in variables', category: 'General' },
  { word: 'LOOP', hint: 'Repeats code execution', category: 'General' },
  { word: 'NODE', hint: 'JavaScript runtime', category: 'Runtime' },
  { word: 'TYPE', hint: 'Classification of data', category: 'General' },
  { word: 'SORT', hint: 'Arrange in order', category: 'Algorithm' },
  { word: 'HASH', hint: 'Fixed-size output from any input', category: 'Security' },
  { word: 'BIND', hint: 'Attach event to element', category: 'DOM' },
];

// ═══════════════════════════════════════════════════════════════════
// PATTERN SEQUENCES
// ═══════════════════════════════════════════════════════════════════
export function generatePatternSequences(count: number): PatternSequence[] {
  const sequences: PatternSequence[] = [];
  for (let i = 0; i < count; i++) {
    const type = Math.floor(Math.random() * 4);
    if (type === 0) {
      // Arithmetic sequence
      const start = Math.floor(Math.random() * 10) + 1;
      const diff = Math.floor(Math.random() * 5) + 1;
      const seq = Array.from({ length: 5 }, (_, j) => start + j * diff);
      const answer = start + 5 * diff;
      sequences.push({
        id: `p${i}`, sequence: seq, answer,
        options: [answer, answer + diff, answer - diff, answer + diff * 2].sort(() => Math.random() - 0.5),
        hint: `Each number increases by ${diff}`,
      });
    } else if (type === 1) {
      // Geometric sequence
      const start = Math.floor(Math.random() * 3) + 1;
      const ratio = Math.floor(Math.random() * 2) + 2;
      const seq = Array.from({ length: 5 }, (_, j) => start * Math.pow(ratio, j));
      const answer = start * Math.pow(ratio, 5);
      sequences.push({
        id: `p${i}`, sequence: seq, answer,
        options: [answer, answer * ratio, answer / ratio, answer * 2].sort(() => Math.random() - 0.5),
        hint: `Each number is multiplied by ${ratio}`,
      });
    } else if (type === 2) {
      // Fibonacci-like
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      const seq = [a, b];
      for (let j = 2; j < 6; j++) seq.push(seq[j - 1] + seq[j - 2]);
      sequences.push({
        id: `p${i}`, sequence: seq.slice(0, 5), answer: seq[5],
        options: [seq[5], seq[5] + 1, seq[5] - 1, seq[4]].sort(() => Math.random() - 0.5),
        hint: 'Each number is the sum of the two before it',
      });
    } else {
      // Square numbers
      const offset = Math.floor(Math.random() * 3);
      const seq = Array.from({ length: 5 }, (_, j) => (j + 1 + offset) ** 2);
      const answer = (6 + offset) ** 2;
      sequences.push({
        id: `p${i}`, sequence: seq, answer,
        options: [answer, answer + 1, answer - 1, (7 + offset) ** 2].sort(() => Math.random() - 0.5),
        hint: 'These are perfect squares',
      });
    }
  }
  return sequences;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: Get data for any game
// ═══════════════════════════════════════════════════════════════════
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
