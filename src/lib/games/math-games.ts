// ══════════════════════════════════════════════════
// Math Game Data — Math problems
// ══════════════════════════════════════════════════
import type { MathProblem } from '@/components/games/engines/MathEngine';

export const mathGames: Record<string, MathProblem[]> = {
  'math-binary': [
    { id: 'b1', question: 'What is 1010 + 0110 in binary?', options: ['10000', '1100', '1110', '10100'], correctIndex: 0, explanation: '1010 (10) + 0110 (6) = 10000 (16)', points: 10 },
    { id: 'b2', question: 'What is 1111 in decimal?', options: ['14', '15', '16', '31'], correctIndex: 1, explanation: '8+4+2+1 = 15', points: 10 },
    { id: 'b3', question: 'What is 10 in binary?', options: ['1000', '1010', '1100', '1110'], correctIndex: 1, explanation: '10 = 8+2 = 1010', points: 10 },
    { id: 'b4', question: 'What is 1100 & 1010?', options: ['1000', '1010', '0110', '1110'], correctIndex: 0, explanation: 'Bitwise AND: only common 1-bits stay', points: 15 },
    { id: 'b5', question: 'What is 1010 | 1100?', options: ['1000', '1010', '1110', '0110'], correctIndex: 2, explanation: 'Bitwise OR: any 1-bit stays', points: 15 },
    { id: 'b6', question: 'What is 1010 XOR 1100?', options: ['0110', '1000', '1110', '1010'], correctIndex: 0, explanation: 'XOR: different bits become 1', points: 15 },
    { id: 'b7', question: 'What is ~0 in 4-bit binary?', options: ['1111', '0000', '1000', '0001'], correctIndex: 0, explanation: 'NOT 0 = all 1s', points: 10 },
    { id: 'b8', question: 'Left shift 0011 by 1 (0011 << 1)?', options: ['0110', '0011', '0001', '1100'], correctIndex: 0, explanation: 'Shift left = multiply by 2: 3*2=6=0110', points: 10 },
  ],
  'math-hex': [
    { id: 'h1', question: 'What is 0xFF in decimal?', options: ['255', '256', '15', '16'], correctIndex: 0, explanation: 'FF = 15*16 + 15 = 255', points: 10 },
    { id: 'h2', question: 'What is 16 in hexadecimal?', options: ['0x10', '0x16', '0xF', '0x20'], correctIndex: 0, explanation: '16 = 1*16 + 0 = 0x10', points: 10 },
    { id: 'h3', question: 'What is #0A0A0A in RGB?', options: ['(10,10,10)', '(0,10,0)', '(160,160,160)', '(15,15,15)'], correctIndex: 0, explanation: '0A = 10 in decimal for each channel', points: 15 },
    { id: 'h4', question: 'What is 0x100 in decimal?', options: ['100', '256', '16', '1024'], correctIndex: 1, explanation: '1*256 + 0*16 + 0 = 256', points: 15 },
    { id: 'h5', question: 'What is 255 in hexadecimal?', options: ['0xFF', '0x100', '0xF0', '0xEE'], correctIndex: 0, explanation: '255 = 15*16 + 15 = 0xFF', points: 10 },
    { id: 'h6', question: 'What color is #00FF00?', options: ['Red', 'Green', 'Blue', 'Yellow'], correctIndex: 1, explanation: 'R=0, G=FF(255), B=0 = Green', points: 10 },
  ],
  'math-bitwise': [
    { id: 'bw1', question: 'What is 5 & 3?', options: ['1', '3', '7', '2'], correctIndex: 0, explanation: '0101 & 0011 = 0001 = 1', points: 15 },
    { id: 'bw2', question: 'What is 5 | 3?', options: ['1', '7', '3', '6'], correctIndex: 1, explanation: '0101 | 0011 = 0111 = 7', points: 15 },
    { id: 'bw3', question: 'What is 5 ^ 3?', options: ['1', '6', '7', '2'], correctIndex: 1, explanation: '0101 ^ 0011 = 0110 = 6', points: 15 },
    { id: 'bw4', question: 'What is 8 >> 1?', options: ['16', '4', '2', '8'], correctIndex: 1, explanation: 'Right shift: 8/2 = 4', points: 15 },
    { id: 'bw5', question: 'What is 1 << 4?', options: ['4', '8', '16', '32'], correctIndex: 2, explanation: 'Left shift: 1 * 2^4 = 16', points: 15 },
    { id: 'bw6', question: 'What is ~7 in 4-bit?', options: ['7', '-8', '8', '0'], correctIndex: 1, explanation: '~7 (0111) = 1000 in 4-bit = -8 (two\'s complement)', points: 20 },
  ],
  'math-logic-gates': [
    { id: 'lg1', question: 'What is A AND B if A=1, B=0?', options: ['1', '0', 'undefined', 'null'], correctIndex: 1, explanation: 'AND: both must be 1', points: 10 },
    { id: 'lg2', question: 'What is A OR B if A=1, B=0?', options: ['0', '1', 'undefined', 'null'], correctIndex: 1, explanation: 'OR: at least one must be 1', points: 10 },
    { id: 'lg3', question: 'What is NOT A if A=1?', options: ['1', '0', '-1', 'null'], correctIndex: 1, explanation: 'NOT: inverts the value', points: 10 },
    { id: 'lg4', question: 'What is A XOR B if A=1, B=1?', options: ['1', '0', 'undefined', 'null'], correctIndex: 1, explanation: 'XOR: different values give 1', points: 10 },
    { id: 'lg5', question: 'What is A NAND B if A=0, B=0?', options: ['0', '1', 'undefined', 'null'], correctIndex: 1, explanation: 'NAND: NOT (A AND B) = NOT 0 = 1', points: 15 },
    { id: 'lg6', question: 'What is A NOR B if A=1, B=0?', options: ['1', '0', 'undefined', 'null'], correctIndex: 1, explanation: 'NOR: NOT (A OR B) = NOT 1 = 0', points: 15 },
  ],
  'math-ip-address': [
    { id: 'ip1', question: 'What class is 192.168.1.1?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: '192-223 is Class C', points: 15 },
    { id: 'ip2', question: 'What is the subnet mask for /24?', options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.128'], correctIndex: 2, explanation: '/24 = 255.255.255.0', points: 15 },
    { id: 'ip3', question: 'How many hosts in /24?', options: ['254', '256', '128', '512'], correctIndex: 0, explanation: '2^8 - 2 = 254 usable hosts', points: 15 },
    { id: 'ip4', question: 'What is 127.0.0.1?', options: ['Default gateway', 'Loopback address', 'Broadcast', 'DNS server'], correctIndex: 1, explanation: '127.0.0.1 is the loopback/localhost address', points: 10 },
    { id: 'ip5', question: 'What class is 10.0.0.1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: '1-126 is Class A', points: 15 },
    { id: 'ip6', question: 'What is the broadcast for 192.168.1.0/24?', options: ['192.168.1.0', '192.168.1.255', '192.168.1.254', '192.168.255.255'], correctIndex: 1, explanation: 'Last address in subnet is broadcast', points: 15 },
  ],
  'math-subnet': [
    { id: 'sb1', question: '/28 subnet has how many usable hosts?', options: ['14', '16', '30', '32'], correctIndex: 0, explanation: '2^4 - 2 = 14', points: 20 },
    { id: 'sb2', question: 'What is the subnet mask for /26?', options: ['255.255.255.128', '255.255.255.192', '255.255.255.224', '255.255.255.240'], correctIndex: 1, explanation: '/26 = 255.255.255.192', points: 20 },
    { id: 'sb3', question: 'How many subnets does /26 create from /24?', options: ['2', '4', '8', '16'], correctIndex: 1, explanation: '2^(26-24) = 4 subnets', points: 20 },
    { id: 'sb4', question: 'First usable IP in 192.168.1.64/26?', options: ['192.168.1.0', '192.168.1.64', '192.168.1.65', '192.168.1.63'], correctIndex: 2, explanation: 'First usable = network + 1 = .65', points: 20 },
  ],
  'math-big-o': [
    { id: 'bo1', question: 'What is the complexity of nested loops i < n, j < n?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(log n)'], correctIndex: 1, explanation: 'Nested loops = O(n²)', points: 15 },
    { id: 'bo2', question: 'What is the complexity of binary search?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(log n)'], correctIndex: 3, explanation: 'Halves search space each step', points: 15 },
    { id: 'bo3', question: 'What is the complexity of merge sort?', options: ['O(n²)', 'O(n)', 'O(n log n)', 'O(log n)'], correctIndex: 2, explanation: 'Divide and conquer = O(n log n)', points: 15 },
    { id: 'bo4', question: 'What is the complexity of hash table lookup?', options: ['O(n)', 'O(n²)', 'O(1)', 'O(log n)'], correctIndex: 2, explanation: 'Average case is O(1)', points: 15 },
    { id: 'bo5', question: 'What is the complexity of accessing array[i]?', options: ['O(n)', 'O(n²)', 'O(1)', 'O(log n)'], correctIndex: 2, explanation: 'Direct index access = O(1)', points: 10 },
    { id: 'bo6', question: 'What is the complexity of string concatenation in a loop?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(1)'], correctIndex: 1, explanation: 'Each concat may create new string', points: 20 },
  ],
  'math-complexity': [
    { id: 'cx1', question: 'O(2^n) is characteristic of which algorithm?', options: ['Binary search', 'Sorting', 'Brute force recursion', 'Hash table'], correctIndex: 2, explanation: 'Exponential growth with recursion', points: 20 },
    { id: 'cx2', question: 'Which is faster: O(n log n) or O(n²)?', options: ['O(n²)', 'O(n log n)', 'Same', 'Depends'], correctIndex: 1, explanation: 'n log n grows slower than n²', points: 15 },
    { id: 'cx3', question: 'What is O(1) space complexity?', options: ['Uses no memory', 'Uses constant extra memory', 'Uses O(n) memory', 'Uses O(n²) memory'], correctIndex: 1, explanation: 'Constant extra space regardless of input', points: 15 },
    { id: 'cx4', question: 'Amortized O(1) applies to which operation?', options: ['Array sort', 'Array push', 'Array access', 'Array reverse'], correctIndex: 1, explanation: 'Push is O(1) amortized (rarely needs resize)', points: 20 },
    { id: 'cx5', question: 'What is the space complexity of merge sort?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctIndex: 2, explanation: 'Merge sort needs O(n) extra space for merging', points: 20 },
    { id: 'cx6', question: 'O(n + m) when processing two arrays means?', options: ['O(n*m)', 'O(n)', 'O(n) + O(m)', 'O(max(n,m))'], correctIndex: 2, explanation: 'Process each array once: O(n) + O(m)', points: 20 },
  ],
};
