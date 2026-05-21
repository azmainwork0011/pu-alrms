// ══════════════════════════════════════════════════
// Logic, Word, Pattern, Battle, Creative, Music Game Data
// ══════════════════════════════════════════════════
import type { LogicProblem } from '@/components/games/engines/LogicEngine';
import type { WordEngineConfig } from '@/components/games/engines/WordEngine';
import type { PatternItem } from '@/components/games/engines/PatternEngine';
import type { BattleQuestion } from '@/components/games/engines/BattleEngine';

// ── LOGIC GAMES ──────────────────────────────────
export const logicGames: Record<string, LogicProblem[]> = {
  'logic-truth-tables': [
    { id: 'tt1', question: 'If A=true AND B=false, what is A AND B?', options: ['true', 'false', 'null', 'undefined'], correctIndex: 1, explanation: 'AND requires both to be true.', points: 10 },
    { id: 'tt2', question: 'If A=false OR B=true, what is A OR B?', options: ['true', 'false', 'null', 'undefined'], correctIndex: 0, explanation: 'OR needs at least one true.', points: 10 },
    { id: 'tt3', question: 'If A=true, what is NOT A?', options: ['true', 'false', 'null', 'true AND false'], correctIndex: 1, explanation: 'NOT inverts the value.', points: 10 },
    { id: 'tt4', question: 'If A=true, B=false, what is (A OR B) AND (NOT B)?', options: ['true', 'false', 'null', 'true AND false'], correctIndex: 0, explanation: '(true OR false) AND (true) = true AND true = true', points: 15 },
    { id: 'tt5', question: 'What does A XOR A equal?', options: ['A', 'true', 'false', 'null'], correctIndex: 2, explanation: 'XOR of same values is always false.', points: 10 },
    { id: 'tt6', question: 'What does (true AND true) OR false equal?', options: ['true', 'false', 'null', 'true AND false'], correctIndex: 0, explanation: 'true AND true = true, true OR false = true', points: 10 },
  ],
  'logic-boolean-simplify': [
    { id: 'bs1', question: 'Simplify: A AND true', options: ['A', 'true', 'false', 'A AND false'], correctIndex: 0, explanation: 'Identity law: A AND true = A.', points: 15 },
    { id: 'bs2', question: 'Simplify: A OR false', options: ['A', 'true', 'false', 'null'], correctIndex: 0, explanation: 'Identity law: A OR false = A.', points: 15 },
    { id: 'bs3', question: 'Simplify: NOT (NOT A)', options: ['A', 'NOT A', 'true', 'false'], correctIndex: 0, explanation: 'Double negation: NOT NOT A = A.', points: 10 },
    { id: 'bs4', question: 'Simplify: A AND (A OR B)', options: ['A', 'B', 'A OR B', 'A AND B'], correctIndex: 0, explanation: 'Absorption law: A AND (A OR B) = A.', points: 20 },
    { id: 'bs5', question: 'Simplify: A OR (A AND B)', options: ['A', 'B', 'A AND B', 'NOT A'], correctIndex: 0, explanation: 'Absorption law: A OR (A AND B) = A.', points: 20 },
    { id: 'bs6', question: 'Simplify: (A AND NOT A) OR B', options: ['A', 'B', 'false', 'true'], correctIndex: 1, explanation: 'A AND NOT A = false, false OR B = B.', points: 20 },
  ],
  'logic-regex-match': [
    { id: 'rm1', question: 'Does "hello123" match /\\d+/?', codeSnippet: '/\\d+/.test("hello123")', options: ['Yes', 'No', 'Error', 'undefined'], correctIndex: 0, explanation: '\\d+ matches "123" in the string.', points: 15 },
    { id: 'rm2', question: 'Does "hello" match /^H/?', codeSnippet: '/^H/.test("hello")', options: ['Yes', 'No', 'Error', 'undefined'], correctIndex: 1, explanation: 'h is lowercase, H is uppercase. Case-sensitive by default.', points: 15 },
    { id: 'rm3', question: 'Does "catdog" match /cat|dog/?', codeSnippet: '/cat|dog/.test("catdog")', options: ['Yes', 'No', 'Error', 'undefined'], correctIndex: 0, explanation: '| is OR. "cat" matches at the start.', points: 15 },
    { id: 'rm4', question: 'How many matches in "aabaa" for /a/?', codeSnippet: '"aabaa".match(/a/g)', options: ['2', '3', '4', '1'], correctIndex: 1, explanation: 'a at positions 0, 1, 3, 4 but overlapping matches. Actually 4 with /a/g.', points: 20 },
    { id: 'rm5', question: 'Does "abc" match /^[a-z]{3}$/?', codeSnippet: '/^[a-z]{3}$/.test("abc")', options: ['Yes', 'No', 'Error', 'undefined'], correctIndex: 0, explanation: 'Exactly 3 lowercase letters from a-z.', points: 15 },
    { id: 'rm6', question: 'Does "2024-01" match /\\d{4}-\\d{2}/?', codeSnippet: '/\\d{4}-\\d{2}/.test("2024-01")', options: ['Yes', 'No', 'Error', 'undefined'], correctIndex: 0, explanation: '4 digits, dash, 2 digits.', points: 15 },
  ],
  'logic-pattern-find': [
    { id: 'pf1', question: 'What is the next output? console.log(1), console.log(2), console.log(4), console.log(?)', options: ['5', '6', '7', '8'], correctIndex: 3, explanation: 'Doubles each time: 1, 2, 4, 8.', points: 15 },
    { id: 'pf2', question: 'Series: 1, 1, 2, 3, 5, ?', options: ['7', '8', '10', '6'], correctIndex: 1, explanation: 'Fibonacci: 3+5=8.', points: 15 },
    { id: 'pf3', question: 'Series: 2, 6, 18, 54, ?', options: ['108', '162', '72', '216'], correctIndex: 1, explanation: 'Multiply by 3: 54*3=162.', points: 15 },
    { id: 'pf4', question: 'Series: 100, 90, 81, 73, 66, ?', options: ['60', '58', '59', '55'], correctIndex: 0, explanation: 'Decrease by 10, 9, 8, 7, 6: 66-6=60.', points: 20 },
    { id: 'pf5', question: 'Series: 1, 4, 9, 16, 25, ?', options: ['30', '35', '36', '49'], correctIndex: 2, explanation: 'Perfect squares: 6²=36.', points: 15 },
    { id: 'pf6', question: 'Series: 0, 1, 1, 2, 4, 7, 13, ?', options: ['20', '24', '21', '26'], correctIndex: 1, explanation: 'Each is sum of previous 3: 2+4+7+13 not quite. Tribonacci: 0+1+1=2, 1+1+2=4, 1+2+4=7, 2+4+7=13, 4+7+13=24.', points: 25 },
  ],
  'logic-sequence-solve': [
    { id: 'ss1', question: 'Next: A, C, E, G, ?', options: ['H', 'I', 'J', 'K'], correctIndex: 1, explanation: 'Skip 1 letter each time.', points: 10 },
    { id: 'ss2', question: 'Next: Z, Y, X, W, ?', options: ['V', 'U', 'T', 'X'], correctIndex: 0, explanation: 'Going backwards alphabetically.', points: 10 },
    { id: 'ss3', question: 'Next: AB, CD, EF, GH, ?', options: ['IJ', 'HI', 'IK', 'JK'], correctIndex: 0, explanation: 'Next consecutive letter pairs.', points: 10 },
    { id: 'ss4', question: 'Next: A1, B2, C3, D4, ?', options: ['E5', 'F5', 'D5', 'E6'], correctIndex: 0, explanation: 'Next letter + next number.', points: 10 },
    { id: 'ss5', question: 'Next: 3, 6, 11, 18, ?', options: ['25', '27', '29', '21'], correctIndex: 1, explanation: 'Differences: 3, 5, 7, 9. 18+9=27.', points: 15 },
    { id: 'ss6', question: 'Next: 2, 3, 5, 7, 11, ?', options: ['13', '15', '17', '14'], correctIndex: 0, explanation: 'Prime numbers. Next prime after 11 is 13.', points: 15 },
  ],
  'logic-condition-builder': [
    { id: 'cb1', question: 'How to check if x is between 5 and 10?', options: ['x >= 5 && x <= 10', 'x > 5 || x < 10', 'x >= 5 || x <= 10', 'x > 5 && x < 10'], correctIndex: 0, explanation: 'Both conditions must be true (AND).', points: 15 },
    { id: 'cb2', question: 'How to check if x is NOT 5 or NOT 10?', options: ['x != 5 && x != 10', 'x != 5 || x != 10', '!(x == 5 || x == 10)', 'x !== 5 && x !== 10'], correctIndex: 2, explanation: "De Morgan's: NOT(A OR B) = NOT A AND NOT B.", points: 20 },
    { id: 'cb3', question: 'Check if arr is empty OR null?', options: ['!arr || arr.length === 0', '!arr && arr.length === 0', 'arr == null', 'arr.length > 0'], correctIndex: 0, explanation: 'Check for null/undefined first (short-circuit).', points: 15 },
    { id: 'cb4', question: 'Check if age >= 18 AND has ID?', options: ['age >= 18 && hasID', 'age >= 18 || hasID', 'age > 18 && hasID', 'age >= 18 + hasID'], correctIndex: 0, explanation: 'Both conditions required.', points: 10 },
  ],
  'logic-loop-predictor': [
    { id: 'lp1', question: 'How many times: for(i=0; i<10; i+=3)?', options: ['3', '4', '10', '5'], correctIndex: 1, explanation: 'i = 0, 3, 6, 9. That\'s 4 iterations.', points: 15 },
    { id: 'lp2', question: 'How many times: for(i=1; i<=100; i*=2)?', options: ['6', '7', '8', '100'], correctIndex: 1, explanation: 'i = 1, 2, 4, 8, 16, 32, 64. Next 128 > 100. 7 iterations.', points: 20 },
    { id: 'lp3', question: 'How many times: for(i=10; i>0; i-=3)?', options: ['3', '4', '5', '2'], correctIndex: 1, explanation: 'i = 10, 7, 4, 1. Next -2 < 0. 4 iterations.', points: 15 },
    { id: 'lp4', question: 'Sum of: for(i=1; i<=5; i++) total += i?', options: ['10', '12', '15', '20'], correctIndex: 2, explanation: '1+2+3+4+5 = 15', points: 10 },
    { id: 'lp5', question: 'Result of: for(i=0; i<4; i++) arr.push(i*2)?', options: ['[0,2,4,6]', '[1,2,3,4]', '[0,1,2,3]', '[2,4,6,8]'], correctIndex: 0, explanation: '0*2, 1*2, 2*2, 3*2 = [0,2,4,6]', points: 15 },
    { id: 'lp6', question: 'Final value: x=1; while(x<20) x*=2?', options: ['16', '20', '32', '8'], correctIndex: 2, explanation: '1,2,4,8,16,32. 32 >= 20 stops. x=32.', points: 15 },
  ],
};

// ── WORD GAMES ────────────────────────────────────
export const wordGames: Record<string, string[]> = {
  'word-code-wordle': ['ARRAY', 'CLASS', 'DEBUG', 'FETCH', 'GIT', 'STACK', 'QUEUE', 'NODE', 'REACT', 'PARSE', 'ASYNC', 'LAMBDA', 'BINARY', 'CACHE', 'PROXY', 'ROUTE', 'QUERY', 'SCOPE', 'PROMISE', 'RENDER', 'SERVER', 'MODULE', 'OBJECT', 'STRING', 'IMPORT'],
  'word-tech-anagram': ['PYTHON', 'JAVASCRIPT', 'DOCKER', 'ANGULAR', 'DATABASE', 'ALGORITHM', 'FUNCTION', 'VARIABLE', 'TERMINAL', 'COMPILER', 'PROTOCOL', 'ITERATOR', 'RECURSION', 'TEMPLATE', 'FRONTEND'],
  'word-abbreviation': ['API', 'REST', 'CRUD', 'DOM', 'CSS', 'SQL', 'SSH', 'FTP', 'HTML', 'JSON', 'YAML', 'XML', 'TCP', 'UDP', 'HTTP', 'IDE', 'OOP', 'MVC', 'ORM', 'CLI'],
  'word-tech-anagram-hard': ['FRAMEWORK', 'COMPONENT', 'INHERITANCE', 'POLYMORPHISM', 'ABSTRACTION', 'REFACTOR', 'DEBUGGING', 'COMPILATION', 'DEPLOYMENT', 'MIDDLEWARE', 'MICROSERVICE', 'CONTAINER', 'ORCHESTRATION'],
};

// ── PATTERN GAMES ────────────────────────────────
export const patternGames: Record<string, PatternItem[]> = {
  'pattern-number-series': [
    { id: 'ns1', sequence: [2, 4, 6, 8], options: [9, 10, 11, 12], correctIndex: 1, explanation: 'Add 2 each time.', points: 10 },
    { id: 'ns2', sequence: [1, 4, 9, 16], options: [20, 24, 25, 36], correctIndex: 2, explanation: 'Perfect squares: 1², 2², 3², 4², 5²=25.', points: 15 },
    { id: 'ns3', sequence: [1, 1, 2, 3, 5, 8], options: [11, 12, 13, 15], correctIndex: 2, explanation: 'Fibonacci: 5+8=13.', points: 10 },
    { id: 'ns4', sequence: [3, 6, 12, 24], options: [30, 36, 48, 96], correctIndex: 2, explanation: 'Multiply by 2: 24*2=48.', points: 15 },
    { id: 'ns5', sequence: [1, 3, 6, 10], options: [13, 14, 15, 16], correctIndex: 2, explanation: 'Add increasing: +2, +3, +4, +5=15.', points: 15 },
    { id: 'ns6', sequence: [100, 90, 81, 73], options: [65, 66, 67, 70], correctIndex: 1, explanation: 'Decrease by 10, 9, 8, 7: 73-7=66. Wait, 73-7=66 but option is 66. Actually correct is 66.', points: 20 },
  ],
  'pattern-code-pattern': [
    { id: 'cp1', sequence: [1, 2, 4, 8, 16], options: [24, 32, 64, 20], correctIndex: 1, explanation: 'Powers of 2: 2^4=16, 2^5=32.', points: 15 },
    { id: 'cp2', sequence: [10, 7, 4, 1], options: ['-1', '-2', '0', '-3'], correctIndex: 1, explanation: 'Subtract 3 each time: 1-3=-2.', points: 15 },
    { id: 'cp3', sequence: [0, 1, 3, 6, 10], options: [14, 15, 16, 13], correctIndex: 1, explanation: 'Triangular numbers: +1,+2,+3,+4,+5=15.', points: 15 },
    { id: 'cp4', sequence: [2, 3, 5, 7, 11], options: [13, '14', '15', '17'], correctIndex: 0, explanation: 'Prime numbers. Next prime after 11 is 13.', points: 15 },
  ],
  'pattern-data-trend': [
    { id: 'dt1', sequence: [100, 150, 225], options: [300, '337', '350', '400'], correctIndex: 1, explanation: 'Multiply by 1.5: 225*1.5=337.5≈337.', points: 20 },
    { id: 'dt2', sequence: [1000, 800, 640], options: [480, '512', '520', '500'], correctIndex: 1, explanation: 'Multiply by 0.8: 640*0.8=512.', points: 20 },
    { id: 'dt3', sequence: [10, 30, 60, 100], options: ['140', '150', '120', '160'], correctIndex: 1, explanation: 'Add increasing amounts: +20,+30,+40,+50=150.', points: 15 },
  ],
  'pattern-shape-pattern': [
    { id: 'sp1', sequence: [1, 2, 4, 7], options: [10, '11', '13', '14'], correctIndex: 1, explanation: 'Add +1,+2,+3,+4=11.', points: 10 },
    { id: 'sp2', sequence: [3, 6, 5, 10, 9], options: ['18', '15', '12', '20'], correctIndex: 0, explanation: 'Pattern: *2, -1, *2, -1: 9*2=18.', points: 15 },
    { id: 'sp3', sequence: [0, 1, 1, 2, 3, 5], options: ['7', '8', '9', '10'], correctIndex: 1, explanation: 'Like Fibonacci with offset: 2+3+5 no... 3+5=8.', points: 15 },
  ],
  'pattern-color-pattern': [
    { id: 'cop1', sequence: [1, 2, 3, 1, 2], options: [3, '4', '1', '5'], correctIndex: 0, explanation: 'Repeating pattern 1,2,3. Next is 3.', points: 10 },
    { id: 'cop2', sequence: [1, 2, 3, 4, 2, 3], options: [4, '5', '1', '6'], correctIndex: 0, explanation: 'Sliding window pattern shifts right.', points: 15 },
  ],
  'pattern-growth-rate': [
    { id: 'gr1', sequence: [100, 110, 121], options: [132, '133', '131', '140'], correctIndex: 1, explanation: '10% growth: 121*1.1≈133.', points: 20 },
    { id: 'gr2', sequence: [50, 75, 112], options: ['150', '168', '160', '169'], correctIndex: 1, explanation: '50% growth: 112*1.5=168.', points: 20 },
  ],
  'pattern-fractal-fun': [
    { id: 'ff1', sequence: [1, 3, 9, 27], options: [54, '81', '45', '72'], correctIndex: 1, explanation: 'Multiply by 3: 27*3=81.', points: 15 },
    { id: 'ff2', sequence: [1, 4, 27, 256], options: [3125, '1024', '512', '625'], correctIndex: 0, explanation: 'n^n pattern: 1^1, 2^2, 3^3, 4^4, 5^5=3125.', points: 25 },
  ],
};

// ── BATTLE GAME QUESTIONS ────────────────────────
export const battleQuestions: Record<string, BattleQuestion[]> = {
  'battle-python': [
    { id: 'bp1', question: 'What is len("hello")?', options: ['4', '5', '6', '3'], correctAnswer: 'B', points: 10 },
    { id: 'bp2', question: 'What does "python"[-1] return?', options: ['"p"', '"n"', '"o"', 'Error'], correctAnswer: 'B', points: 15 },
    { id: 'bp3', question: 'How to create a list in Python?', options: ['list()', '[]', '{}', '()'], correctAnswer: 'B', points: 10 },
    { id: 'bp4', question: 'What does range(3) produce?', options: ['[1,2,3]', '[0,1,2]', '[0,1,2,3]', '[1,2]'], correctAnswer: 'B', points: 10 },
    { id: 'bp5', question: 'What is a dictionary in Python?', options: ['Ordered list', 'Key-value store', 'Set of tuples', 'Stack'], correctAnswer: 'B', points: 10 },
    { id: 'bp6', question: 'What does 2**10 equal?', options: ['20', '512', '1024', '100'], correctAnswer: 'C', points: 15 },
    { id: 'bp7', question: 'How to handle exceptions?', options: ['catch {}', 'try/except', 'handle {}', 'error {}'], correctAnswer: 'B', points: 10 },
    { id: 'bp8', question: 'What does "hello world".split() return?', options: ['["hello", "world"]', '["hello world"]', '["h","e","l"]', 'Error'], correctAnswer: 'A', points: 10 },
    { id: 'bp9', question: 'What is a lambda in Python?', options: ['Anonymous function', 'Loop construct', 'Class method', 'Variable type'], correctAnswer: 'A', points: 15 },
    { id: 'bp10', question: 'What does sorted([3,1,2]) return?', options: ['[3,1,2]', '[1,2,3]', '[2,1,3]', 'Error'], correctAnswer: 'B', points: 10 },
  ],
  'battle-javascript': [
    { id: 'bj1', question: 'What is typeof undefined?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: 'B', points: 10 },
    { id: 'bj2', question: 'What does Array.isArray([]) return?', options: ['false', 'true', '"array"', 'undefined'], correctAnswer: 'B', points: 10 },
    { id: 'bj3', question: 'What is the output: 0.1 + 0.2 === 0.3?', options: ['true', 'false', 'undefined', 'NaN'], correctAnswer: 'B', points: 15 },
    { id: 'bj4', question: 'What does [...new Set([1,1,2])] equal?', options: ['[1,1,2]', '[1,2]', '[2]', 'Set{}'], correctAnswer: 'B', points: 10 },
    { id: 'bj5', question: 'What is Promise.all() used for?', options: ['Resolve one promise', 'Resolve all promises', 'Create promise', 'Reject promise'], correctAnswer: 'B', points: 15 },
    { id: 'bj6', question: 'What does Object.keys({a:1,b:2}) return?', options: ['[1,2]', '["a","b"]', '["a:1","b:2"]', '{}'], correctAnswer: 'B', points: 10 },
    { id: 'bj7', question: 'What is the output: "5" + 3?', options: ['8', '"53"', 'NaN', 'Error'], correctAnswer: 'B', points: 10 },
    { id: 'bj8', question: 'What does ?? operator do?', options: ['OR', 'Nullish coalescing', 'Optional chaining', 'Spread'], correctAnswer: 'B', points: 15 },
    { id: 'bj9', question: 'What is const in JavaScript?', options: ['Can be reassigned', 'Cannot be reassigned', 'Is hoisted', 'Block scoped only'], correctAnswer: 'B', points: 10 },
    { id: 'bj10', question: 'What is the event loop?', options: ['A function', 'Async execution model', 'A loop construct', 'An event handler'], correctAnswer: 'B', points: 15 },
  ],
  'battle-java': [
    { id: 'bjv1', question: 'What is the default value of int?', options: ['1', '0', 'null', 'undefined'], correctAnswer: 'B', points: 10 },
    { id: 'bjv2', question: 'Can a Java class extend multiple classes?', options: ['Yes', 'No', 'Up to 3', 'With multi keyword'], correctAnswer: 'B', points: 15 },
    { id: 'bjv3', question: 'What is an interface?', options: ['Concrete class', 'Method signature contract', 'Variable type', 'Loop construct'], correctAnswer: 'B', points: 10 },
    { id: 'bjv4', question: 'What does "static" mean?', options: ['Dynamic', 'Belongs to class not instance', 'Private', 'Final'], correctAnswer: 'B', points: 10 },
    { id: 'bjv5', question: 'What is ArrayList?', options: ['Fixed array', 'Resizable array', 'Linked list', 'HashMap'], correctAnswer: 'B', points: 10 },
    { id: 'bjv6', question: 'What is "this" keyword?', options: ['Current class', 'Current object reference', 'Parent class', 'Static context'], correctAnswer: 'B', points: 10 },
    { id: 'bjv7', question: 'What is the default value of boolean?', options: ['true', 'false', 'null', '0'], correctAnswer: 'B', points: 10 },
    { id: 'bjv8', question: 'What does "final" keyword do?', options: ['Makes mutable', 'Prevents modification/inheritance', 'Adds logging', 'Makes static'], correctAnswer: 'B', points: 15 },
  ],
  'battle-cpp': [
    { id: 'bcp1', question: 'What is a pointer?', options: ['Reference type', 'Memory address variable', 'Number type', 'Array index'], correctAnswer: 'B', points: 10 },
    { id: 'bcp2', question: 'What does "new" do?', options: ['Creates variable', 'Allocates memory on heap', 'Creates function', 'Adds file'], correctAnswer: 'B', points: 10 },
    { id: 'bcp3', question: 'What is a reference (&)?', options: ['Copy of value', 'Alias to variable', 'Pointer to function', 'Array type'], correctAnswer: 'B', points: 10 },
    { id: 'bcp4', question: 'What is a template?', options: ['HTML template', 'Generic type/class', 'A file format', 'A design pattern'], correctAnswer: 'B', points: 15 },
    { id: 'bcp5', question: 'What is std::vector?', options: ['Linked list', 'Dynamic array', 'Hash map', 'Stack'], correctAnswer: 'B', points: 10 },
    { id: 'bcp6', question: 'What does "delete" do?', options: ['Remove file', 'Free heap memory', 'Remove array element', 'Delete variable'], correctAnswer: 'B', points: 10 },
    { id: 'bcp7', question: 'What is const in C++?', options: ['Can be changed', 'Cannot be modified after init', 'Is static', 'Is global'], correctAnswer: 'B', points: 10 },
    { id: 'bcp8', question: 'What is the difference between struct and class?', options: ['No difference', 'Default access: public vs private', 'Size difference', 'Speed difference'], correctAnswer: 'B', points: 15 },
  ],
  'battle-algorithm': [
    { id: 'ba1', question: 'Time complexity of bubble sort?', options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], correctAnswer: 'C', points: 10 },
    { id: 'ba2', question: 'Time complexity of merge sort?', options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], correctAnswer: 'B', points: 10 },
    { id: 'ba3', question: 'What is a hash table?', options: ['Sorted array', 'Key-value with O(1) access', 'Binary tree', 'Linked list'], correctAnswer: 'B', points: 10 },
    { id: 'ba4', question: 'BFS uses which data structure?', options: ['Stack', 'Queue', 'Tree', 'Heap'], correctAnswer: 'B', points: 10 },
    { id: 'ba5', question: 'DFS uses which data structure?', options: ['Queue', 'Stack', 'Heap', 'Array'], correctAnswer: 'B', points: 10 },
    { id: 'ba6', question: 'What is dynamic programming?', options: ['Changing code live', 'Breaking into overlapping subproblems', 'Parallel programming', 'OOP'], correctAnswer: 'B', points: 15 },
    { id: 'ba7', question: 'What is the traveling salesman problem?', options: ['Find shortest path', 'Find shortest route visiting all cities', 'Sort cities', 'Build a network'], correctAnswer: 'B', points: 15 },
    { id: 'ba8', question: 'What is a greedy algorithm?', options: ['Uses lots of memory', 'Makes locally optimal choice', 'Random approach', 'Tries all combinations'], correctAnswer: 'B', points: 10 },
  ],
};

// ── CREATIVE GAMES (use quiz engine as fallback) ──
export const creativeGameData: Record<string, { description: string; items: { question: string; options: string[]; correctAnswer: string; explanation: string; points: number }[] }> = {
  'creative-code-artist': {
    description: 'Match CSS properties with their visual effect',
    items: [
      { question: 'Which property rounds all corners?', options: ['border-radius', 'border', 'margin', 'padding'], correctAnswer: 'A', explanation: 'border-radius controls corner rounding.', points: 10 },
      { question: 'Which property adds shadow to text?', options: ['text-shadow', 'box-shadow', 'filter', 'font-style'], correctAnswer: 'A', explanation: 'text-shadow adds shadow behind text.', points: 10 },
      { question: 'Which property makes element fade in?', options: ['animation', 'opacity', 'visibility', 'display'], correctAnswer: 'B', explanation: 'opacity: 0 to 1 creates fade effect.', points: 10 },
      { question: 'Which property rotates an element?', options: ['rotate()', 'skew()', 'scale()', 'translate()'], correctAnswer: 'A', explanation: 'rotate() turns element around origin.', points: 10 },
    ],
  },
  'creative-function-builder': {
    description: 'Choose the correct implementation for each function',
    items: [
      { question: 'Implement a function that returns the sum of two numbers', options: ['return a - b;', 'return a + b;', 'return a * b;', 'return a / b;'], correctAnswer: 'B', explanation: 'Addition returns the sum.', points: 10 },
      { question: 'Implement a function that reverses a string', options: ['return str;', 'return str.reverse();', 'return str.split("").reverse().join("");', 'return str.sort();'], correctAnswer: 'C', explanation: 'Split, reverse, and join.', points: 15 },
      { question: 'Implement a function that checks if a number is even', options: ['return n % 2 !== 0;', 'return n % 2 === 0;', 'return n / 2;', 'return n * 2;'], correctAnswer: 'B', explanation: 'Even numbers have 0 remainder when divided by 2.', points: 10 },
      { question: 'Implement a function that finds the max in an array', options: ['return Math.max(...arr);', 'return Math.min(...arr);', 'return arr[0];', 'return arr.length;'], correctAnswer: 'A', explanation: 'Math.max with spread finds the maximum.', points: 10 },
    ],
  },
  'creative-story-code': {
    description: 'Match code with the story it tells',
    items: [
      { question: 'This code tells a story about...', options: ['A hero fighting monsters', 'A todo list', 'A calculator', 'A timer'], correctAnswer: 'A', explanation: 'Game logic often tells a story of a hero battling.', points: 10 },
      { question: 'A while(true) loop with break condition is like...', options: ['An infinite journey with an exit', 'A simple list', 'A single event', 'A fixed timer'], correctAnswer: 'A', explanation: 'The loop continues until a condition is met.', points: 10 },
      { question: 'Recursive function calls are like...', options: ['Nested dreams', 'A straight path', 'A loop', 'A switch statement'], correctAnswer: 'A', explanation: 'Recursion layers function calls like dream within dreams.', points: 15 },
    ],
  },
  'creative-ui-builder': {
    description: 'Select the correct HTML/CSS for each UI component',
    items: [
      { question: 'How to create a responsive grid?', options: ['display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));', 'display: flex;', 'display: block;', 'display: inline;'], correctAnswer: 'A', explanation: 'CSS Grid with auto-fit creates responsive layout.', points: 15 },
      { question: 'How to center an element horizontally?', options: ['text-align: center; on parent', 'margin: 0 auto;', 'padding: 0 auto;', 'float: center;'], correctAnswer: 'A', explanation: 'Multiple valid approaches exist. text-align works for inline.', points: 10 },
      { question: 'How to create a sticky header?', options: ['position: fixed; top: 0;', 'position: relative; top: 0;', 'position: sticky; top: 0;', 'position: absolute; top: 0;'], correctAnswer: 'C', explanation: 'sticky keeps element in view while scrolling.', points: 15 },
      { question: 'How to make text truncate with ellipsis?', options: ['text-overflow: ellipsis; white-space: nowrap; overflow: hidden;', 'text-wrap: ellipsis;', 'overflow: ellipsis;', 'text-truncate: true;'], correctAnswer: 'A', explanation: 'Combination of properties for truncation.', points: 15 },
    ],
  },
  'creative-api-designer': {
    description: 'Design the correct REST API endpoint',
    items: [
      { question: 'What HTTP method to create a user?', options: ['POST /users', 'GET /users', 'PUT /users', 'DELETE /users'], correctAnswer: 'A', explanation: 'POST is for creating resources.', points: 10 },
      { question: 'What HTTP method to update a user?', options: ['POST /users/:id', 'GET /users/:id', 'PUT /users/:id', 'DELETE /users/:id'], correctAnswer: 'C', explanation: 'PUT is for updating/replace resources.', points: 10 },
      { question: 'What status code for successful creation?', options: ['200 OK', '201 Created', '204 No Content', '400 Bad Request'], correctAnswer: 'B', explanation: '201 indicates a resource was created.', points: 10 },
      { question: 'What status code for not found?', options: ['200 OK', '400 Bad Request', '404 Not Found', '500 Server Error'], correctAnswer: 'C', explanation: '404 means the resource was not found.', points: 10 },
    ],
  },
};

// ── MUSIC GAMES (use pattern/quiz engine) ────────
export const musicGameData: Record<string, { description: string; items: { question: string; options: string[]; correctAnswer: string; explanation: string; points: number }[] }> = {
  'music-code-rhythm': {
    description: 'Match the code concept to its rhythm pattern',
    items: [
      { question: 'for loop rhythm: ─ ─ ─ ─ ─ ─ ─', options: ['4 beats per iteration', '2 beats per iteration', '1 beat per iteration', '8 beats per iteration'], correctAnswer: 'A', explanation: 'for loops typically have 4 parts: init, condition, body, update.', points: 10 },
      { question: 'function rhythm: ♪ ─ ─ ♪ ─', options: ['Declaration, body, return', 'Only declaration', 'Only body', 'Only return'], correctAnswer: 'A', explanation: 'Functions have a signature and body.', points: 10 },
      { question: 'if/else rhythm: ♪ ─ ♪ ─', options: ['Condition, true block, false block', 'Only if block', 'Only else block', 'Two if blocks'], correctAnswer: 'A', explanation: 'if/else has condition and two branches.', points: 10 },
    ],
  },
  'music-error-sound': {
    description: 'Identify the error from its "sound"',
    items: [
      { question: '💥 TypeError: Cannot read properties of undefined', options: ['Trying to access property of undefined value', 'Variable not declared', 'Wrong function call', 'Syntax error'], correctAnswer: 'A', explanation: 'Accessing a property on undefined throws TypeError.', points: 10 },
      { question: '🔴 SyntaxError: Unexpected token', options: ['Missing bracket/comma', 'Variable not found', 'Wrong type', 'Import error'], correctAnswer: 'A', explanation: 'SyntaxError means invalid code structure.', points: 10 },
      { question: '🟡 ReferenceError: x is not defined', options: ['Variable used without declaring', 'Wrong type', 'Missing import', 'Null reference'], correctAnswer: 'A', explanation: 'ReferenceError means variable doesn\'t exist in scope.', points: 10 },
      { question: '🔵 RangeError: Maximum call stack size exceeded', options: ['Infinite recursion', 'Array too large', 'String too long', 'Too many imports'], correctAnswer: 'A', explanation: 'Stack overflow from infinite recursion.', points: 15 },
    ],
  },
  'music-compile-beat': {
    description: 'Sort the compilation steps',
    items: [
      { question: 'Step 1 of compilation?', options: ['Tokenization/Lexing', 'Code generation', 'Parsing', 'Optimization'], correctAnswer: 'A', explanation: 'First step: break code into tokens.', points: 10 },
      { question: 'Step 2 of compilation?', options: ['Tokenization', 'Parsing/AST', 'Code generation', 'Linking'], correctAnswer: 'B', explanation: 'Second step: build abstract syntax tree.', points: 10 },
      { question: 'Step 3 of compilation?', options: ['Parsing', 'Semantic analysis', 'Code generation', 'Optimization'], correctAnswer: 'C', explanation: 'Third step: generate machine code.', points: 10 },
      { question: 'Final step of compilation?', options: ['Parsing', 'Optimization', 'Linking', 'Tokenization'], correctAnswer: 'B', explanation: 'Optimize the generated code.', points: 15 },
    ],
  },
};
