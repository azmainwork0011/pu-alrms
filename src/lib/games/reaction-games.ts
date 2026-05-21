// ══════════════════════════════════════════════════
// Reaction Game Data — Reaction game configs
// ══════════════════════════════════════════════════
import type { ReactionItem } from '@/components/games/engines/ReactionEngine';

export const reactionGames: Record<string, ReactionItem[]> = {
  'reaction-bug-spotter': [
    { id: 'bs1', prompt: 'Find the bug!', options: ['for (var i=0; i<5; i++)', 'for (let i=0; i<5; i++)', 'for (let i=0; i<5; i++)', 'for (let i=0; i<5; i++)'], correctIndex: 0, timeLimit: 5000 },
    { id: 'bs2', prompt: 'Which line has a bug?', options: ['const x = 5;', 'if (x = 5)', 'return x;', 'x++'], correctIndex: 1, timeLimit: 5000 },
    { id: 'bs3', prompt: 'Find the error!', options: ['arr.push(1)', 'arr.map(x => x)', 'arr.sort()', 'arr.filter(x)'], correctIndex: 2, timeLimit: 5000 },
    { id: 'bs4', prompt: 'Which is correct?', options: ['parseInt("3.14")', 'parseFloat("3.14")', 'Number("3.14")', 'Both B and C'], correctIndex: 3, timeLimit: 5000 },
    { id: 'bs5', prompt: 'Bug or not?', options: ['typeof null === "null"', 'typeof null === "object"', 'null === undefined', 'null == undefined'], correctIndex: 1, timeLimit: 5000 },
    { id: 'bs6', prompt: 'Which returns true?', options: ['[] == false', '[] == true', '[] === false', '[] === true'], correctIndex: 0, timeLimit: 5000 },
  ],
  'reaction-color-word': [
    { id: 'cw1', prompt: 'RED (shown in blue)', options: ['Blue', 'Red', 'Green', 'Purple'], correctIndex: 0, timeLimit: 3000 },
    { id: 'cw2', prompt: 'GREEN (shown in red)', options: ['Green', 'Red', 'Yellow', 'Blue'], correctIndex: 1, timeLimit: 3000 },
    { id: 'cw3', prompt: 'BLUE (shown in yellow)', options: ['Yellow', 'Green', 'Blue', 'Red'], correctIndex: 2, timeLimit: 3000 },
    { id: 'cw4', prompt: 'YELLOW (shown in green)', options: ['Blue', 'Green', 'Red', 'Yellow'], correctIndex: 1, timeLimit: 3000 },
    { id: 'cw5', prompt: 'PURPLE (shown in orange)', options: ['Orange', 'Purple', 'Red', 'Blue'], correctIndex: 0, timeLimit: 3000 },
    { id: 'cw6', prompt: 'ORANGE (shown in purple)', options: ['Orange', 'Purple', 'Green', 'Red'], correctIndex: 1, timeLimit: 3000 },
  ],
  'reaction-quick-click': [
    { id: 'qc1', prompt: 'Click the largest number!', options: ['42', '128', '99', '256'], correctIndex: 3, timeLimit: 3000 },
    { id: 'qc2', prompt: 'Click the smallest number!', options: ['7', '3', '15', '1'], correctIndex: 3, timeLimit: 3000 },
    { id: 'qc3', prompt: 'Click the even number!', options: ['7', '11', '8', '13'], correctIndex: 2, timeLimit: 3000 },
    { id: 'qc4', prompt: 'Click the prime number!', options: ['4', '9', '15', '7'], correctIndex: 3, timeLimit: 3000 },
    { id: 'qc5', prompt: 'Click the square number!', options: ['3', '5', '16', '7'], correctIndex: 2, timeLimit: 3000 },
    { id: 'qc6', prompt: 'Click the Fibonacci number!', options: ['4', '6', '8', '10'], correctIndex: 2, timeLimit: 3000 },
  ],
  'reaction-binary-flash': [
    { id: 'bf1', prompt: 'What is 1010 in decimal?', options: ['8', '10', '12', '14'], correctIndex: 1, timeLimit: 4000 },
    { id: 'bf2', prompt: 'What is 1100 in decimal?', options: ['10', '12', '14', '6'], correctIndex: 1, timeLimit: 4000 },
    { id: 'bf3', prompt: 'What is 1111 in decimal?', options: ['14', '15', '16', '13'], correctIndex: 1, timeLimit: 4000 },
    { id: 'bf4', prompt: 'What is 5 in binary?', options: ['101', '110', '100', '111'], correctIndex: 0, timeLimit: 4000 },
    { id: 'bf5', prompt: 'What is 9 in binary?', options: ['1001', '1010', '1000', '1011'], correctIndex: 0, timeLimit: 4000 },
    { id: 'bf6', prompt: 'What is 10000 in decimal?', options: ['14', '16', '18', '20'], correctIndex: 1, timeLimit: 4000 },
  ],
  'reaction-code-scanner': [
    { id: 'cs1', prompt: 'What does [1,2,3].indexOf(2) return?', options: ['0', '1', '2', '3'], correctIndex: 1, timeLimit: 4000 },
    { id: 'cs2', prompt: 'What does "hello".slice(1,3) return?', options: ['"he"', '"el"', '"ll"', '"lo"'], correctIndex: 1, timeLimit: 4000 },
    { id: 'cs3', prompt: 'What is Math.floor(3.7)?', options: ['3', '4', '3.5', '3.7'], correctIndex: 0, timeLimit: 4000 },
    { id: 'cs4', prompt: 'What does "abc".toUpperCase() return?', options: ['"abc"', '"ABC"', '"Abc"', '"abc"'], correctIndex: 1, timeLimit: 4000 },
    { id: 'cs5', prompt: 'What is 10 % 3?', options: ['3', '1', '0', '10'], correctIndex: 1, timeLimit: 4000 },
    { id: 'cs6', prompt: 'What does !!true return?', options: ['"true"', 'true', 'undefined', '1'], correctIndex: 1, timeLimit: 4000 },
  ],
  'reaction-keyboard-hero': [
    { id: 'kh1', prompt: 'Press the shortcut for Copy', options: ['Ctrl+V', 'Ctrl+C', 'Ctrl+X', 'Ctrl+Z'], correctIndex: 1, timeLimit: 3000 },
    { id: 'kh2', prompt: 'Press the shortcut for Undo', options: ['Ctrl+Y', 'Ctrl+S', 'Ctrl+Z', 'Ctrl+A'], correctIndex: 2, timeLimit: 3000 },
    { id: 'kh3', prompt: 'Press the shortcut for Save', options: ['Ctrl+Z', 'Ctrl+S', 'Ctrl+P', 'Ctrl+F'], correctIndex: 1, timeLimit: 3000 },
    { id: 'kh4', prompt: 'Press the shortcut for Find', options: ['Ctrl+H', 'Ctrl+G', 'Ctrl+F', 'Ctrl+R'], correctIndex: 2, timeLimit: 3000 },
    { id: 'kh5', prompt: 'Press the shortcut for Select All', options: ['Ctrl+F', 'Ctrl+A', 'Ctrl+S', 'Ctrl+E'], correctIndex: 1, timeLimit: 3000 },
    { id: 'kh6', prompt: 'Press the shortcut for Close Tab', options: ['Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Q'], correctIndex: 1, timeLimit: 3000 },
  ],
  'reaction-symbol-match': [
    { id: 'sm1', prompt: 'What does === mean in JS?', options: ['Assignment', 'Strict equality', 'Loose equality', 'Not equal'], correctIndex: 1, timeLimit: 4000 },
    { id: 'sm2', prompt: 'What does => mean?', options: ['Greater equal', 'Arrow function', 'Object property', 'Type cast'], correctIndex: 1, timeLimit: 4000 },
    { id: 'sm3', prompt: 'What does && mean?', options: ['Logical OR', 'Logical AND', 'Bitwise OR', 'Bitwise AND'], correctIndex: 1, timeLimit: 4000 },
    { id: 'sm4', prompt: 'What does ?? mean?', options: ['Spread', 'Optional chaining', 'Nullish coalescing', 'Template literal'], correctIndex: 2, timeLimit: 4000 },
    { id: 'sm5', prompt: 'What does ... mean in [1,...arr]?', options: ['Rest parameter', 'Spread operator', 'Ellipsis', 'Range'], correctIndex: 1, timeLimit: 4000 },
    { id: 'sm6', prompt: 'What does ?. mean?', options: ['Optional property', 'Ternary', 'Optional chaining', 'Conditional'], correctIndex: 2, timeLimit: 4000 },
  ],
  'reaction-port-number': [
    { id: 'pn1', prompt: 'Port 80 is for?', options: ['HTTPS', 'FTP', 'HTTP', 'SSH'], correctIndex: 2, timeLimit: 3000 },
    { id: 'pn2', prompt: 'Port 443 is for?', options: ['HTTP', 'HTTPS', 'SSH', 'FTP'], correctIndex: 1, timeLimit: 3000 },
    { id: 'pn3', prompt: 'Port 22 is for?', options: ['FTP', 'HTTP', 'SSH', 'SMTP'], correctIndex: 2, timeLimit: 3000 },
    { id: 'pn4', prompt: 'Port 3306 is for?', options: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL'], correctIndex: 3, timeLimit: 3000 },
    { id: 'pn5', prompt: 'Port 5432 is for?', options: ['MySQL', 'MongoDB', 'PostgreSQL', 'Redis'], correctIndex: 2, timeLimit: 3000 },
    { id: 'pn6', prompt: 'Port 6379 is for?', options: ['MySQL', 'Redis', 'MongoDB', 'Elasticsearch'], correctIndex: 1, timeLimit: 3000 },
  ],
  'reaction-http-status': [
    { id: 'hs1', prompt: 'Status 200 means?', options: ['Not Found', 'OK', 'Server Error', 'Redirect'], correctIndex: 1, timeLimit: 3000 },
    { id: 'hs2', prompt: 'Status 404 means?', options: ['OK', 'Forbidden', 'Not Found', 'Error'], correctIndex: 2, timeLimit: 3000 },
    { id: 'hs3', prompt: 'Status 500 means?', options: ['Client Error', 'Server Error', 'Redirect', 'Created'], correctIndex: 1, timeLimit: 3000 },
    { id: 'hs4', prompt: 'Status 201 means?', options: ['OK', 'Deleted', 'Created', 'Accepted'], correctIndex: 2, timeLimit: 3000 },
    { id: 'hs5', prompt: 'Status 403 means?', options: ['Not Found', 'Unauthorized', 'Forbidden', 'Timeout'], correctIndex: 2, timeLimit: 3000 },
    { id: 'hs6', prompt: 'Status 301 means?', options: ['Temporary Redirect', 'Permanent Redirect', 'Not Modified', 'Bad Request'], correctIndex: 1, timeLimit: 3000 },
  ],
  'reaction-error-id': [
    { id: 'ei1', prompt: '"Cannot read property of undefined" is?', options: ['TypeError', 'SyntaxError', 'ReferenceError', 'RangeError'], correctIndex: 0, timeLimit: 4000 },
    { id: 'ei2', prompt: '"Unexpected token" is?', options: ['TypeError', 'SyntaxError', 'URIError', 'EvalError'], correctIndex: 1, timeLimit: 4000 },
    { id: 'ei3', prompt: '"x is not defined" is?', options: ['TypeError', 'SyntaxError', 'ReferenceError', 'RangeError'], correctIndex: 2, timeLimit: 4000 },
    { id: 'ei4', prompt: '"Maximum call stack exceeded" is?', options: ['SyntaxError', 'RangeError', 'URIError', 'RangeError/Stack Overflow'], correctIndex: 3, timeLimit: 4000 },
    { id: 'ei5', prompt: '"Failed to fetch" usually means?', options: ['Syntax error', 'Network issue', 'Permission denied', 'Out of memory'], correctIndex: 1, timeLimit: 4000 },
    { id: 'ei6', prompt: '"CORS error" means?', options: ['Server down', 'Cross-origin blocked', 'Wrong URL', 'Timeout'], correctIndex: 1, timeLimit: 4000 },
  ],
};
