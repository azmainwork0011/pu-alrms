// ═══════════════════════════════════════════════════════════════════
// PU-ALRMS Games Catalog — 100+ Mini-Games
// ═══════════════════════════════════════════════════════════════════

export type GameCategory =
  | 'quiz' | 'memory' | 'typing' | 'puzzle' | 'battle'
  | 'reaction' | 'creative' | 'math' | 'logic' | 'word'
  | 'pattern' | 'music';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: GameCategory;
  difficulty: Difficulty;
  xpReward: number;
  playsCount: number;
  rating: number;
  tags: string[];
  isNew?: boolean;
  engine: 'quiz' | 'memory' | 'typing' | 'reaction' | 'puzzle' | 'battle' | 'pattern' | 'math' | 'word' | 'creative' | 'music';
}

export const CATEGORY_INFO: Record<GameCategory, { label: string; icon: string; color: string; bgColor: string }> = {
  quiz:     { label: 'Quiz',      icon: '🎯', color: 'text-blue-400',    bgColor: 'from-blue-500 to-cyan-500' },
  memory:   { label: 'Memory',    icon: '🧠', color: 'text-purple-400',  bgColor: 'from-purple-500 to-fuchsia-500' },
  typing:   { label: 'Typing',    icon: '⌨️', color: 'text-emerald-400', bgColor: 'from-emerald-500 to-teal-500' },
  puzzle:   { label: 'Puzzle',    icon: '🧩', color: 'text-amber-400',   bgColor: 'from-amber-500 to-orange-500' },
  battle:   { label: 'Battle',    icon: '⚔️', color: 'text-rose-400',    bgColor: 'from-rose-500 to-red-500' },
  reaction: { label: 'Reaction',  icon: '⚡', color: 'text-yellow-400',  bgColor: 'from-yellow-500 to-amber-500' },
  creative: { label: 'Creative',  icon: '🎨', color: 'text-pink-400',    bgColor: 'from-pink-500 to-rose-500' },
  math:     { label: 'Math',      icon: '🔢', color: 'text-cyan-400',    bgColor: 'from-cyan-500 to-blue-500' },
  logic:    { label: 'Logic',     icon: '💡', color: 'text-orange-400',  bgColor: 'from-orange-500 to-red-500' },
  word:     { label: 'Word',      icon: '📝', color: 'text-teal-400',    bgColor: 'from-teal-500 to-emerald-500' },
  pattern:  { label: 'Pattern',   icon: '🔮', color: 'text-violet-400',  bgColor: 'from-violet-500 to-purple-500' },
  music:    { label: 'Music',     icon: '🎵', color: 'text-fuchsia-400', bgColor: 'from-fuchsia-500 to-pink-500' },
};

// ═══════════════════════════════════════════════════════════════════
// QUIZ GAMES (15)
// ═══════════════════════════════════════════════════════════════════
const quizGames: GameDefinition[] = [
  { id: 'quiz-python', name: 'Python Mastery', description: 'Test your Python knowledge with questions on syntax, data structures, and best practices.', icon: '🐍', category: 'quiz', difficulty: 'MEDIUM', xpReward: 30, playsCount: 2847, rating: 4.7, tags: ['Python', 'Programming'], engine: 'quiz' },
  { id: 'quiz-javascript', name: 'JavaScript Pro', description: 'From closures to async/await — prove your JS expertise.', icon: '⚡', category: 'quiz', difficulty: 'MEDIUM', xpReward: 30, playsCount: 3102, rating: 4.8, tags: ['JavaScript', 'Web'], engine: 'quiz', isNew: true },
  { id: 'quiz-java', name: 'Java Challenge', description: 'OOP, collections, streams — how well do you know Java?', icon: '☕', category: 'quiz', difficulty: 'HARD', xpReward: 40, playsCount: 1923, rating: 4.5, tags: ['Java', 'OOP'], engine: 'quiz' },
  { id: 'quiz-cpp', name: 'C++ Fundamentals', description: 'Pointers, templates, STL — test your C++ knowledge.', icon: '🔧', category: 'quiz', difficulty: 'HARD', xpReward: 40, playsCount: 1456, rating: 4.4, tags: ['C++', 'Systems'], engine: 'quiz' },
  { id: 'quiz-html-css', name: 'HTML & CSS', description: 'Flexbox, Grid, selectors — web layout mastery.', icon: '🌐', category: 'quiz', difficulty: 'EASY', xpReward: 20, playsCount: 4215, rating: 4.6, tags: ['HTML', 'CSS', 'Web'], engine: 'quiz' },
  { id: 'quiz-sql', name: 'SQL Wizard', description: 'Queries, joins, aggregations — database expertise.', icon: '🗃️', category: 'quiz', difficulty: 'MEDIUM', xpReward: 30, playsCount: 2103, rating: 4.5, tags: ['SQL', 'Database'], engine: 'quiz' },
  { id: 'quiz-git', name: 'Git Master', description: 'Branching, merging, rebasing — version control mastery.', icon: '🔀', category: 'quiz', difficulty: 'EASY', xpReward: 20, playsCount: 3567, rating: 4.3, tags: ['Git', 'DevOps'], engine: 'quiz' },
  { id: 'quiz-docker', name: 'Docker Essentials', description: 'Containers, images, compose — containerization knowledge.', icon: '🐳', category: 'quiz', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1789, rating: 4.4, tags: ['Docker', 'DevOps'], engine: 'quiz' },
  { id: 'quiz-react', name: 'React Expert', description: 'Hooks, state management, performance — React mastery.', icon: '⚛️', category: 'quiz', difficulty: 'MEDIUM', xpReward: 35, playsCount: 2654, rating: 4.7, tags: ['React', 'Frontend'], engine: 'quiz', isNew: true },
  { id: 'quiz-dsa', name: 'Data Structures', description: 'Arrays, trees, graphs, hash maps — core CS knowledge.', icon: '🌳', category: 'quiz', difficulty: 'HARD', xpReward: 45, playsCount: 1890, rating: 4.6, tags: ['DSA', 'Algorithms'], engine: 'quiz' },
  { id: 'quiz-algorithms', name: 'Algorithm Arena', description: 'Sorting, searching, dynamic programming — algorithm challenges.', icon: '🏆', category: 'quiz', difficulty: 'HARD', xpReward: 45, playsCount: 1567, rating: 4.5, tags: ['Algorithms', 'CS'], engine: 'quiz' },
  { id: 'quiz-networking', name: 'Networking Basics', description: 'TCP/IP, HTTP, DNS — computer networking concepts.', icon: '📡', category: 'quiz', difficulty: 'EASY', xpReward: 20, playsCount: 1234, rating: 4.2, tags: ['Networking', 'IT'], engine: 'quiz' },
  { id: 'quiz-os', name: 'OS Concepts', description: 'Processes, memory, file systems — operating systems.', icon: '💻', category: 'quiz', difficulty: 'HARD', xpReward: 40, playsCount: 987, rating: 4.3, tags: ['OS', 'Systems'], engine: 'quiz' },
  { id: 'quiz-cybersecurity', name: 'CyberSec 101', description: 'Encryption, firewalls, attacks — security fundamentals.', icon: '🔒', category: 'quiz', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1654, rating: 4.4, tags: ['Security', 'IT'], engine: 'quiz', isNew: true },
  { id: 'quiz-typescript', name: 'TypeScript Challenge', description: 'Types, generics, interfaces — TypeScript proficiency.', icon: '🔷', category: 'quiz', difficulty: 'MEDIUM', xpReward: 30, playsCount: 2234, rating: 4.6, tags: ['TypeScript', 'Web'], engine: 'quiz' },
];

// ═══════════════════════════════════════════════════════════════════
// MEMORY GAMES (10)
// ═══════════════════════════════════════════════════════════════════
const memoryGames: GameDefinition[] = [
  { id: 'memory-code-match', name: 'Code Match', description: 'Match programming concepts with their code snippets.', icon: '🔗', category: 'memory', difficulty: 'MEDIUM', xpReward: 25, playsCount: 3456, rating: 4.6, tags: ['Code', 'Matching'], engine: 'memory' },
  { id: 'memory-api-match', name: 'API Match', description: 'Match API endpoints with their descriptions.', icon: '🔌', category: 'memory', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1876, rating: 4.3, tags: ['API', 'REST'], engine: 'memory' },
  { id: 'memory-emoji-decode', name: 'Emoji Decode', description: 'Match tech terms with their emoji representations.', icon: '😀', category: 'memory', difficulty: 'EASY', xpReward: 15, playsCount: 4567, rating: 4.7, tags: ['Emoji', 'Fun'], engine: 'memory', isNew: true },
  { id: 'memory-color-pairs', name: 'Color Hex Match', description: 'Match CSS color names with their hex codes.', icon: '🎨', category: 'memory', difficulty: 'EASY', xpReward: 20, playsCount: 2345, rating: 4.4, tags: ['CSS', 'Colors'], engine: 'memory' },
  { id: 'memory-icon-match', name: 'Icon Match', description: 'Match tech icons with their frameworks/tools.', icon: '🖼️', category: 'memory', difficulty: 'EASY', xpReward: 15, playsCount: 2876, rating: 4.5, tags: ['Icons', 'Tech'], engine: 'memory' },
  { id: 'memory-syntax-pairs', name: 'Syntax Pairs', description: 'Match programming syntax across languages.', icon: '📝', category: 'memory', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1987, rating: 4.3, tags: ['Syntax', 'Languages'], engine: 'memory' },
  { id: 'memory-bug-patterns', name: 'Bug Patterns', description: 'Match common bugs with their fixes.', icon: '🐛', category: 'memory', difficulty: 'HARD', xpReward: 35, playsCount: 1543, rating: 4.4, tags: ['Debug', 'Bugs'], engine: 'memory' },
  { id: 'memory-terminal-cmds', name: 'Terminal Match', description: 'Match commands with their terminal outputs.', icon: '🖥️', category: 'memory', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2123, rating: 4.5, tags: ['Terminal', 'CLI'], engine: 'memory' },
  { id: 'memory-shortcuts', name: 'Shortcut Match', description: 'Match keyboard shortcuts with their actions.', icon: '⌨️', category: 'memory', difficulty: 'EASY', xpReward: 20, playsCount: 3234, rating: 4.6, tags: ['Shortcuts', 'Productivity'], engine: 'memory' },
  { id: 'memory-data-types', name: 'Data Type Match', description: 'Match data with their correct types.', icon: '📦', category: 'memory', difficulty: 'EASY', xpReward: 20, playsCount: 2567, rating: 4.3, tags: ['Types', 'Programming'], engine: 'memory' },
];

// ═══════════════════════════════════════════════════════════════════
// TYPING GAMES (8)
// ═══════════════════════════════════════════════════════════════════
const typingGames: GameDefinition[] = [
  { id: 'typing-speed-code', name: 'Speed Code', description: 'Type code snippets as fast as you can. WPM matters!', icon: '🚀', category: 'typing', difficulty: 'MEDIUM', xpReward: 30, playsCount: 5678, rating: 4.8, tags: ['Speed', 'Code'], engine: 'typing' },
  { id: 'typing-html', name: 'HTML Typer', description: 'Type HTML tags and attributes quickly and accurately.', icon: '🌐', category: 'typing', difficulty: 'EASY', xpReward: 20, playsCount: 2345, rating: 4.4, tags: ['HTML', 'Speed'], engine: 'typing' },
  { id: 'typing-css', name: 'CSS Typer', description: 'Type CSS properties and values with precision.', icon: '🎨', category: 'typing', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1987, rating: 4.3, tags: ['CSS', 'Speed'], engine: 'typing' },
  { id: 'typing-javascript', name: 'JS Speed Run', description: 'Race through JavaScript code snippets.', icon: '⚡', category: 'typing', difficulty: 'HARD', xpReward: 35, playsCount: 3456, rating: 4.6, tags: ['JavaScript', 'Speed'], engine: 'typing' },
  { id: 'typing-python', name: 'Python Sprint', description: 'Type Python code at lightning speed.', icon: '🐍', category: 'typing', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2789, rating: 4.5, tags: ['Python', 'Speed'], engine: 'typing' },
  { id: 'typing-json', name: 'JSON Racer', description: 'Type JSON data structures accurately and fast.', icon: '📋', category: 'typing', difficulty: 'EASY', xpReward: 20, playsCount: 1654, rating: 4.2, tags: ['JSON', 'Data'], engine: 'typing' },
  { id: 'typing-sql', name: 'SQL Typer', description: 'Type SQL queries with accuracy and speed.', icon: '🗃️', category: 'typing', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1432, rating: 4.3, tags: ['SQL', 'Database'], engine: 'typing' },
  { id: 'typing-regex', name: 'Regex Typist', description: 'Type regex patterns — the ultimate typing challenge.', icon: '🔮', category: 'typing', difficulty: 'HARD', xpReward: 40, playsCount: 876, rating: 4.5, tags: ['Regex', 'Advanced'], engine: 'typing', isNew: true },
];

// ═══════════════════════════════════════════════════════════════════
// PUZZLE GAMES (10)
// ═══════════════════════════════════════════════════════════════════
const puzzleGames: GameDefinition[] = [
  { id: 'puzzle-code-sort', name: 'Code Sort', description: 'Arrange code lines in the correct execution order.', icon: '📝', category: 'puzzle', difficulty: 'MEDIUM', xpReward: 30, playsCount: 3456, rating: 4.6, tags: ['Code', 'Logic'], engine: 'puzzle' },
  { id: 'puzzle-algo-steps', name: 'Algorithm Steps', description: 'Put algorithm steps in the correct sequence.', icon: '📐', category: 'puzzle', difficulty: 'HARD', xpReward: 40, playsCount: 1890, rating: 4.4, tags: ['Algorithm', 'Steps'], engine: 'puzzle' },
  { id: 'puzzle-debug-sequence', name: 'Debug Sequence', description: 'Find and fix bugs by arranging the correct debug steps.', icon: '🐛', category: 'puzzle', difficulty: 'MEDIUM', xpReward: 30, playsCount: 2345, rating: 4.5, tags: ['Debug', 'Sequence'], engine: 'puzzle' },
  { id: 'puzzle-api-chain', name: 'API Chain', description: 'Connect API calls in the correct order for a workflow.', icon: '🔗', category: 'puzzle', difficulty: 'HARD', xpReward: 35, playsCount: 1234, rating: 4.3, tags: ['API', 'Workflow'], engine: 'puzzle' },
  { id: 'puzzle-data-flow', name: 'Data Flow', description: 'Trace data through a system and arrange the flow correctly.', icon: '📊', category: 'puzzle', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1567, rating: 4.4, tags: ['Data', 'Architecture'], engine: 'puzzle' },
  { id: 'puzzle-state-machine', name: 'State Machine', description: 'Arrange state transitions in the correct order.', icon: '🔄', category: 'puzzle', difficulty: 'HARD', xpReward: 40, playsCount: 987, rating: 4.2, tags: ['State', 'Logic'], engine: 'puzzle' },
  { id: 'puzzle-design-pattern', name: 'Design Pattern', description: 'Match design patterns with their implementations.', icon: '🏗️', category: 'puzzle', difficulty: 'HARD', xpReward: 40, playsCount: 1234, rating: 4.5, tags: ['Design', 'Patterns'], engine: 'puzzle', isNew: true },
  { id: 'puzzle-oop-hierarchy', name: 'OOP Hierarchy', description: 'Arrange class inheritance and relationships correctly.', icon: '🏛️', category: 'puzzle', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1876, rating: 4.3, tags: ['OOP', 'Classes'], engine: 'puzzle' },
  { id: 'puzzle-db-schema', name: 'DB Schema Builder', description: 'Arrange tables and relationships to form a valid schema.', icon: '🗃️', category: 'puzzle', difficulty: 'HARD', xpReward: 35, playsCount: 1098, rating: 4.4, tags: ['Database', 'Schema'], engine: 'puzzle' },
  { id: 'puzzle-network-topo', name: 'Network Topology', description: 'Connect network nodes to form the correct topology.', icon: '📡', category: 'puzzle', difficulty: 'MEDIUM', xpReward: 30, playsCount: 876, rating: 4.2, tags: ['Network', 'Topology'], engine: 'puzzle' },
];

// ═══════════════════════════════════════════════════════════════════
// BATTLE GAMES (5)
// ═══════════════════════════════════════════════════════════════════
const battleGames: GameDefinition[] = [
  { id: 'battle-python', name: 'Python Battle', description: 'Challenge the bot to a Python quiz duel!', icon: '🐍⚔️', category: 'battle', difficulty: 'MEDIUM', xpReward: 50, playsCount: 4567, rating: 4.8, tags: ['Python', 'Battle'], engine: 'battle' },
  { id: 'battle-javascript', name: 'JS Battle', description: 'Prove your JavaScript skills against the AI bot.', icon: '⚡⚔️', category: 'battle', difficulty: 'MEDIUM', xpReward: 50, playsCount: 3890, rating: 4.7, tags: ['JavaScript', 'Battle'], engine: 'battle' },
  { id: 'battle-java', name: 'Java Battle', description: 'OOP battle with Java questions.', icon: '☕⚔️', category: 'battle', difficulty: 'HARD', xpReward: 60, playsCount: 2134, rating: 4.5, tags: ['Java', 'Battle'], engine: 'battle' },
  { id: 'battle-cpp', name: 'C++ Battle', description: 'Systems programming battle!', icon: '🔧⚔️', category: 'battle', difficulty: 'HARD', xpReward: 60, playsCount: 1567, rating: 4.4, tags: ['C++', 'Battle'], engine: 'battle' },
  { id: 'battle-algorithm', name: 'Algorithm Battle', description: 'The ultimate coding challenge battle!', icon: '🏆⚔️', category: 'battle', difficulty: 'HARD', xpReward: 70, playsCount: 2876, rating: 4.9, tags: ['Algorithm', 'Challenge'], engine: 'battle', isNew: true },
];

// ═══════════════════════════════════════════════════════════════════
// REACTION GAMES (10)
// ═══════════════════════════════════════════════════════════════════
const reactionGames: GameDefinition[] = [
  { id: 'reaction-bug-spot', name: 'Bug Spotter', description: 'Spot the bug in code as fast as possible!', icon: '🐛', category: 'reaction', difficulty: 'MEDIUM', xpReward: 25, playsCount: 3890, rating: 4.6, tags: ['Bug', 'Speed'], engine: 'reaction' },
  { id: 'reaction-color-word', name: 'Color Word', description: 'Stroop test — identify the text color, not the word!', icon: '🌈', category: 'reaction', difficulty: 'EASY', xpReward: 15, playsCount: 5678, rating: 4.5, tags: ['Color', 'Brain'], engine: 'reaction' },
  { id: 'reaction-quick-click', name: 'Quick Click', description: 'Click the correct tech icon as fast as you can.', icon: '👆', category: 'reaction', difficulty: 'EASY', xpReward: 15, playsCount: 4567, rating: 4.3, tags: ['Click', 'Speed'], engine: 'reaction' },
  { id: 'reaction-binary-flash', name: 'Binary Flash', description: 'Convert binary numbers in a flash!', icon: '💻', category: 'reaction', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2345, rating: 4.4, tags: ['Binary', 'Speed'], engine: 'reaction' },
  { id: 'reaction-code-scanner', name: 'Code Scanner', description: 'Scan code and find the matching pattern instantly.', icon: '🔍', category: 'reaction', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1987, rating: 4.3, tags: ['Code', 'Pattern'], engine: 'reaction' },
  { id: 'reaction-keyboard-hero', name: 'Keyboard Hero', description: 'Press the correct key when symbols appear!', icon: '🎹', category: 'reaction', difficulty: 'EASY', xpReward: 20, playsCount: 3456, rating: 4.6, tags: ['Keyboard', 'Speed'], engine: 'reaction' },
  { id: 'reaction-symbol-match', name: 'Symbol Match', description: 'Match programming symbols quickly.', icon: '©️', category: 'reaction', difficulty: 'EASY', xpReward: 15, playsCount: 2876, rating: 4.2, tags: ['Symbols', 'Match'], engine: 'reaction' },
  { id: 'reaction-port-numbers', name: 'Port Numbers', description: 'Match services with their port numbers quickly.', icon: '🔌', category: 'reaction', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1543, rating: 4.3, tags: ['Network', 'Ports'], engine: 'reaction' },
  { id: 'reaction-http-status', name: 'HTTP Status Rush', description: 'Identify HTTP status codes at lightning speed!', icon: '🌐', category: 'reaction', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2123, rating: 4.5, tags: ['HTTP', 'Status'], engine: 'reaction', isNew: true },
  { id: 'reaction-error-id', name: 'Error Identifier', description: 'Identify programming error types instantly.', icon: '❌', category: 'reaction', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1876, rating: 4.4, tags: ['Errors', 'Speed'], engine: 'reaction' },
];

// ═══════════════════════════════════════════════════════════════════
// MATH GAMES (8)
// ═══════════════════════════════════════════════════════════════════
const mathGames: GameDefinition[] = [
  { id: 'math-binary', name: 'Binary Converter', description: 'Convert between binary, decimal, and hex.', icon: '🔢', category: 'math', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2345, rating: 4.4, tags: ['Binary', 'Convert'], engine: 'math' },
  { id: 'math-hex', name: 'Hex Master', description: 'Hexadecimal number challenges.', icon: '🔲', category: 'math', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1876, rating: 4.3, tags: ['Hex', 'Numbers'], engine: 'math' },
  { id: 'math-bitwise', name: 'Bitwise Ops', description: 'AND, OR, XOR, NOT — bitwise operator challenges.', icon: '🔄', category: 'math', difficulty: 'HARD', xpReward: 35, playsCount: 1234, rating: 4.4, tags: ['Bitwise', 'Ops'], engine: 'math' },
  { id: 'math-logic-gates', name: 'Logic Gates', description: 'AND, OR, NOT, XOR — evaluate logic gate outputs.', icon: '🔌', category: 'math', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1567, rating: 4.3, tags: ['Logic', 'Gates'], engine: 'math' },
  { id: 'math-ip-address', name: 'IP Address', description: 'Calculate network and broadcast addresses.', icon: '📡', category: 'math', difficulty: 'HARD', xpReward: 35, playsCount: 987, rating: 4.2, tags: ['IP', 'Network'], engine: 'math' },
  { id: 'math-subnet', name: 'Subnet Calc', description: 'Subnetting challenges for network engineers.', icon: '📊', category: 'math', difficulty: 'HARD', xpReward: 40, playsCount: 876, rating: 4.3, tags: ['Subnet', 'Network'], engine: 'math' },
  { id: 'math-big-o', name: 'Big O Master', description: 'Identify time and space complexity of code.', icon: '📈', category: 'math', difficulty: 'HARD', xpReward: 40, playsCount: 1432, rating: 4.5, tags: ['Complexity', 'Algorithms'], engine: 'math', isNew: true },
  { id: 'math-ascii', name: 'ASCII Decoder', description: 'Convert between ASCII values and characters.', icon: '🔤', category: 'math', difficulty: 'EASY', xpReward: 20, playsCount: 2103, rating: 4.2, tags: ['ASCII', 'Convert'], engine: 'math' },
];

// ═══════════════════════════════════════════════════════════════════
// LOGIC GAMES (8)
// ═══════════════════════════════════════════════════════════════════
const logicGames: GameDefinition[] = [
  { id: 'logic-truth-table', name: 'Truth Tables', description: 'Build truth tables for logical expressions.', icon: '📊', category: 'logic', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1876, rating: 4.4, tags: ['Boolean', 'Logic'], engine: 'logic' },
  { id: 'logic-boolean', name: 'Boolean Simplify', description: 'Simplify complex boolean expressions.', icon: '✨', category: 'logic', difficulty: 'HARD', xpReward: 35, playsCount: 1234, rating: 4.3, tags: ['Boolean', 'Simplify'], engine: 'logic' },
  { id: 'logic-state-trans', name: 'State Transitions', description: 'Predict the next state in a state machine.', icon: '🔄', category: 'logic', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1567, rating: 4.2, tags: ['State', 'Machine'], engine: 'logic' },
  { id: 'logic-regex-match', name: 'Regex Match', description: 'Does the string match the regex? Yes or No!', icon: '🔎', category: 'logic', difficulty: 'HARD', xpReward: 35, playsCount: 1098, rating: 4.5, tags: ['Regex', 'Pattern'], engine: 'logic' },
  { id: 'logic-pattern-find', name: 'Pattern Find', description: 'Find the logical pattern in sequences.', icon: '🔍', category: 'logic', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2345, rating: 4.4, tags: ['Pattern', 'Logic'], engine: 'logic' },
  { id: 'logic-sequence', name: 'Sequence Solve', description: 'Complete the number and letter sequences.', icon: '🔢', category: 'logic', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1987, rating: 4.3, tags: ['Sequence', 'Solve'], engine: 'logic' },
  { id: 'logic-condition', name: 'Condition Builder', description: 'Build correct if/else conditions for scenarios.', icon: '🔀', category: 'logic', difficulty: 'EASY', xpReward: 20, playsCount: 1654, rating: 4.2, tags: ['Condition', 'Code'], engine: 'logic' },
  { id: 'logic-loop-predict', name: 'Loop Predictor', description: 'Predict loop output without running the code.', icon: '🔁', category: 'logic', difficulty: 'HARD', xpReward: 35, playsCount: 1432, rating: 4.5, tags: ['Loop', 'Predict'], engine: 'logic', isNew: true },
];

// ═══════════════════════════════════════════════════════════════════
// WORD GAMES (8)
// ═══════════════════════════════════════════════════════════════════
const wordGames: GameDefinition[] = [
  { id: 'word-code-wordle', name: 'Code Wordle', description: 'Guess the programming keyword in 6 tries!', icon: '🎯', category: 'word', difficulty: 'EASY', xpReward: 20, playsCount: 6789, rating: 4.8, tags: ['Wordle', 'Guess'], engine: 'word' },
  { id: 'word-tech-anagram', name: 'Tech Anagram', description: 'Unscramble tech terms and programming jargon.', icon: '🔤', category: 'word', difficulty: 'EASY', xpReward: 15, playsCount: 3456, rating: 4.4, tags: ['Anagram', 'Scramble'], engine: 'word' },
  { id: 'word-abbreviation', name: 'Abbreviation Quiz', description: 'What does HTML, CSS, API, JWT stand for?', icon: '📌', category: 'word', difficulty: 'EASY', xpReward: 15, playsCount: 2876, rating: 4.3, tags: ['Abbreviation', 'Tech'], engine: 'word' },
  { id: 'word-acronym', name: 'Acronym Rush', description: 'Identify tech acronyms quickly.', icon: '🏷️', category: 'word', difficulty: 'EASY', xpReward: 15, playsCount: 2345, rating: 4.2, tags: ['Acronym', 'Speed'], engine: 'word' },
  { id: 'word-jargon', name: 'Jargon Buster', description: 'Match programming jargon with definitions.', icon: '📚', category: 'word', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1876, rating: 4.4, tags: ['Jargon', 'Vocab'], engine: 'word' },
  { id: 'word-framework', name: 'Framework Match', description: 'Match frameworks with their primary use cases.', icon: '🏗️', category: 'word', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1543, rating: 4.3, tags: ['Framework', 'Match'], engine: 'word' },
  { id: 'word-library-guess', name: 'Library Guess', description: 'Guess the npm package from its description.', icon: '📦', category: 'word', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1234, rating: 4.4, tags: ['NPM', 'Package'], engine: 'word', isNew: true },
  { id: 'word-command-decode', name: 'Command Decode', description: 'Decode what terminal commands do.', icon: '💻', category: 'word', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1654, rating: 4.3, tags: ['Command', 'Decode'], engine: 'word' },
];

// ═══════════════════════════════════════════════════════════════════
// PATTERN GAMES (8)
// ═══════════════════════════════════════════════════════════════════
const patternGames: GameDefinition[] = [
  { id: 'pattern-code', name: 'Code Pattern', description: 'Identify the pattern in code sequences.', icon: '📝', category: 'pattern', difficulty: 'MEDIUM', xpReward: 25, playsCount: 2345, rating: 4.5, tags: ['Code', 'Pattern'], engine: 'pattern' },
  { id: 'pattern-number', name: 'Number Series', description: 'Find the next number in the series.', icon: '🔢', category: 'pattern', difficulty: 'MEDIUM', xpReward: 25, playsCount: 3456, rating: 4.4, tags: ['Numbers', 'Series'], engine: 'pattern' },
  { id: 'pattern-shape', name: 'Shape Pattern', description: 'Identify the next shape in the pattern.', icon: '🔷', category: 'pattern', difficulty: 'EASY', xpReward: 20, playsCount: 2876, rating: 4.3, tags: ['Shape', 'Visual'], engine: 'pattern' },
  { id: 'pattern-color', name: 'Color Pattern', description: 'Find the repeating color sequence.', icon: '🌈', category: 'pattern', difficulty: 'EASY', xpReward: 15, playsCount: 2345, rating: 4.2, tags: ['Color', 'Visual'], engine: 'pattern' },
  { id: 'pattern-data-trend', name: 'Data Trend', description: 'Predict the next data point in a trend.', icon: '📈', category: 'pattern', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1567, rating: 4.4, tags: ['Data', 'Trend'], engine: 'pattern' },
  { id: 'pattern-growth-rate', name: 'Growth Rate', description: 'Calculate growth rates from data patterns.', icon: '📊', category: 'pattern', difficulty: 'HARD', xpReward: 35, playsCount: 987, rating: 4.3, tags: ['Growth', 'Math'], engine: 'pattern' },
  { id: 'pattern-fractal', name: 'Fractal Fun', description: 'Identify fractal patterns and their iterations.', icon: '🌀', category: 'pattern', difficulty: 'HARD', xpReward: 35, playsCount: 876, rating: 4.5, tags: ['Fractal', 'Visual'], engine: 'pattern', isNew: true },
  { id: 'pattern-output', name: 'Output Predictor', description: 'Predict what code will output based on patterns.', icon: '🔮', category: 'pattern', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1987, rating: 4.4, tags: ['Output', 'Predict'], engine: 'pattern' },
];

// ═══════════════════════════════════════════════════════════════════
// CREATIVE GAMES (5)
// ═══════════════════════════════════════════════════════════════════
const creativeGames: GameDefinition[] = [
  { id: 'creative-code-art', name: 'Code Artist', description: 'Create ASCII art by arranging code blocks.', icon: '🎨', category: 'creative', difficulty: 'EASY', xpReward: 20, playsCount: 2345, rating: 4.5, tags: ['ASCII', 'Art'], engine: 'creative' },
  { id: 'creative-fn-builder', name: 'Function Builder', description: 'Build functions by connecting code pieces.', icon: '🔧', category: 'creative', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1876, rating: 4.3, tags: ['Function', 'Build'], engine: 'creative' },
  { id: 'creative-story-code', name: 'Story Code', description: 'Write a mini story using programming concepts.', icon: '📖', category: 'creative', difficulty: 'EASY', xpReward: 20, playsCount: 1567, rating: 4.4, tags: ['Story', 'Creative'], engine: 'creative' },
  { id: 'creative-ui-build', name: 'UI Builder', description: 'Arrange UI components to match a design.', icon: '📱', category: 'creative', difficulty: 'MEDIUM', xpReward: 30, playsCount: 1234, rating: 4.5, tags: ['UI', 'Design'], engine: 'creative', isNew: true },
  { id: 'creative-api-design', name: 'API Designer', description: 'Design REST API endpoints for a given scenario.', icon: '🔌', category: 'creative', difficulty: 'HARD', xpReward: 40, playsCount: 876, rating: 4.3, tags: ['API', 'Design'], engine: 'creative' },
];

// ═══════════════════════════════════════════════════════════════════
// MUSIC GAMES (3)
// ═══════════════════════════════════════════════════════════════════
const musicGames: GameDefinition[] = [
  { id: 'music-code-rhythm', name: 'Code Rhythm', description: 'Tap along to coding-related sound patterns!', icon: '🎵', category: 'music', difficulty: 'EASY', xpReward: 20, playsCount: 1987, rating: 4.4, tags: ['Rhythm', 'Audio'], engine: 'music' },
  { id: 'music-error-sound', name: 'Error Sound ID', description: 'Identify types of errors by their beep patterns.', icon: '🔔', category: 'music', difficulty: 'MEDIUM', xpReward: 25, playsCount: 1234, rating: 4.2, tags: ['Sound', 'Error'], engine: 'music' },
  { id: 'music-compile-beat', name: 'Compile Beat', description: 'Match the compilation beat with the correct language!', icon: '🥁', category: 'music', difficulty: 'EASY', xpReward: 20, playsCount: 1567, rating: 4.3, tags: ['Beat', 'Match'], engine: 'music', isNew: true },
];

// ═══════════════════════════════════════════════════════════════════
// ALL GAMES CATALOG
// ═══════════════════════════════════════════════════════════════════
export const ALL_GAMES: GameDefinition[] = [
  ...quizGames,
  ...memoryGames,
  ...typingGames,
  ...puzzleGames,
  ...battleGames,
  ...reactionGames,
  ...mathGames,
  ...logicGames,
  ...wordGames,
  ...patternGames,
  ...creativeGames,
  ...musicGames,
];

export const GAME_COUNT = ALL_GAMES.length;

export function getGameById(id: string): GameDefinition | undefined {
  return ALL_GAMES.find(g => g.id === id);
}

export function getGamesByCategory(category: GameCategory): GameDefinition[] {
  return ALL_GAMES.filter(g => g.category === category);
}

export function searchGames(query: string): GameDefinition[] {
  const q = query.toLowerCase();
  return ALL_GAMES.filter(g =>
    g.name.toLowerCase().includes(q) ||
    g.description.toLowerCase().includes(q) ||
    g.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function getFeaturedGames(): GameDefinition[] {
  return ALL_GAMES.filter(g => g.isNew || g.rating >= 4.7).slice(0, 8);
}

export function getPopularGames(): GameDefinition[] {
  return [...ALL_GAMES].sort((a, b) => b.playsCount - a.playsCount).slice(0, 12);
}

export function getNewGames(): GameDefinition[] {
  return ALL_GAMES.filter(g => g.isNew);
}

// Category order for UI display
export const CATEGORY_ORDER: GameCategory[] = [
  'quiz', 'battle', 'memory', 'typing', 'puzzle',
  'reaction', 'logic', 'math', 'word', 'pattern',
  'creative', 'music',
];
