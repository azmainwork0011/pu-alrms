// ══════════════════════════════════════════════════
// Puzzle Game Data — Code ordering puzzles
// ══════════════════════════════════════════════════
export interface PuzzleData {
  id: string;
  description: string;
  correctOrder: string[];
}

export const puzzleGames: Record<string, PuzzleData[]> = {
  'puzzle-code-sort': [
    { id: 'cs1', description: 'Sort the code to create a function that reverses a string', correctOrder: ['function reverseString(str) {', '  return str.split("").reverse().join("");', '}'] },
    { id: 'cs2', description: 'Sort the code to create a function that checks for palindrome', correctOrder: ['function isPalindrome(str) {', '  const reversed = str.split("").reverse().join("");', '  return str === reversed;', '}'] },
    { id: 'cs3', description: 'Sort the code to create a function that finds the max in an array', correctOrder: ['function findMax(arr) {', '  return Math.max(...arr);', '}'] },
    { id: 'cs4', description: 'Sort the code to create a function that flattens nested arrays', correctOrder: ['function flatten(arr) {', '  return arr.flat(Infinity);', '}'] },
    { id: 'cs5', description: 'Sort the code to create a debounce function', correctOrder: ['function debounce(fn, delay) {', '  let timer;', '  return (...args) => {', '    clearTimeout(timer);', '    timer = setTimeout(() => fn(...args), delay);', '  };', '}'] },
    { id: 'cs6', description: 'Sort the code to filter even numbers', correctOrder: ['const numbers = [1, 2, 3, 4, 5, 6, 7, 8];', 'const evens = numbers.filter(n => n % 2 === 0);', 'console.log(evens); // [2, 4, 6, 8]'] },
  ],
  'puzzle-algo-steps': [
    { id: 'as1', description: 'Sort the steps of bubble sort', correctOrder: ['Compare adjacent elements', 'If first > second, swap them', 'Move to next pair', 'Repeat until no swaps needed'] },
    { id: 'as2', description: 'Sort the steps of binary search', correctOrder: ['Set left = 0, right = length - 1', 'Calculate mid = (left + right) / 2', 'If arr[mid] == target, return mid', 'If arr[mid] < target, left = mid + 1', 'If arr[mid] > target, right = mid - 1', 'Repeat while left <= right'] },
    { id: 'as3', description: 'Sort the steps of merge sort', correctOrder: ['Divide array in half', 'Recursively sort left half', 'Recursively sort right half', 'Merge sorted halves'] },
    { id: 'as4', description: 'Sort the steps of Dijkstra\'s algorithm', correctOrder: ['Initialize all distances to infinity', 'Set source distance to 0', 'Visit unvisited node with smallest distance', 'Update neighbors\' distances', 'Mark current node as visited', 'Repeat until all visited'] },
    { id: 'as5', description: 'Sort the steps of quicksort', correctOrder: ['Choose a pivot element', 'Partition array around pivot', 'Recursively sort left of pivot', 'Recursively sort right of pivot'] },
  ],
  'puzzle-debug-sequence': [
    { id: 'ds1', description: 'Sort the debugging steps for a "function not defined" error', correctOrder: ['Read the error message and line number', 'Check if the function exists in scope', 'Verify the function is defined before use', 'Check for typos in the function name', 'Test the fix'] },
    { id: 'ds2', description: 'Sort the debugging steps for a "NaN" result', correctOrder: ['Identify where NaN appears', 'Check input values for undefined', 'Add input validation', 'Use Number() or parseInt() for conversion', 'Test with edge cases'] },
    { id: 'ds3', description: 'Sort the steps to fix a memory leak', correctOrder: ['Use browser DevTools Memory tab', 'Take heap snapshots', 'Identify detached DOM trees', 'Find event listeners not removed', 'Add cleanup in componentWillUnmount/despawn'] },
  ],
  'puzzle-api-chain': [
    { id: 'ac1', description: 'Sort the API call chain for fetching user data', correctOrder: ['fetch("/api/auth/token", { method: "POST" })', '.then(res => res.json())', '.then(data => fetch(`/api/users/${data.userId}`))', '.then(res => res.json())', '.then(user => displayUser(user))', '.catch(err => handleError(err))'] },
    { id: 'ac2', description: 'Sort the steps to create and save a new post', correctOrder: ['Validate input data', 'POST /api/posts with JSON body', 'Receive created post with ID', 'Update local state', 'Show success notification'] },
  ],
  'puzzle-data-flow': [
    { id: 'df1', description: 'Sort the data flow for processing a form submission', correctOrder: ['User fills out form fields', 'Client validates inputs', 'Serialize data to JSON', 'Send POST request to API', 'Server validates and saves to DB', 'Return success response', 'Update UI with confirmation'] },
    { id: 'df2', description: 'Sort the data flow for a search feature', correctOrder: ['User types in search box', 'Debounce input (300ms delay)', 'Send search query to API', 'API queries database', 'Return matching results', 'Display results in UI'] },
  ],
  'puzzle-state-machine': [
    { id: 'sm1', description: 'Sort the states of an order system', correctOrder: ['Created', 'Payment Pending', 'Payment Confirmed', 'Processing', 'Shipped', 'Delivered'] },
    { id: 'sm2', description: 'Sort the states of a pull request', correctOrder: ['Draft', 'Open', 'In Review', 'Changes Requested', 'Approved', 'Merged'] },
    { id: 'sm3', description: 'Sort the states of a user authentication flow', correctOrder: ['Not Authenticated', 'Login Form', 'Validating', 'MFA Challenge (if enabled)', 'Authenticated', 'Session Active'] },
  ],
  'puzzle-design-pattern': [
    { id: 'dp1', description: 'Sort the steps to implement the Observer pattern', correctOrder: ['Create a Subject class', 'Add subscribe() method', 'Add unsubscribe() method', 'Add notify() method', 'Observers implement update()', 'Subject calls notify() on change'] },
    { id: 'dp2', description: 'Sort the steps to implement the Singleton pattern', correctOrder: ['Create class with private constructor', 'Add static instance property', 'Add static getInstance() method', 'Check if instance exists, create if not', 'Return the single instance'] },
  ],
  'puzzle-oop-hierarchy': [
    { id: 'oh1', description: 'Sort the class hierarchy from base to derived', correctOrder: ['class Animal { constructor(name) }', 'class Dog extends Animal { bark() }', 'class GuideDog extends Dog { guide() }'] },
    { id: 'oh2', description: 'Sort the class hierarchy for shapes', correctOrder: ['class Shape { getArea() }', 'class Circle extends Shape { constructor(r) }', 'class Rectangle extends Shape { constructor(w, h) }', 'class Square extends Rectangle { constructor(s) }'] },
  ],
  'puzzle-db-schema': [
    { id: 'dbs1', description: 'Sort the tables by creation order (respecting foreign keys)', correctOrder: ['CREATE TABLE users (id PK, name)', 'CREATE TABLE posts (id PK, user_id FK)', 'CREATE TABLE comments (id PK, post_id FK, user_id FK)'] },
    { id: 'dbs2', description: 'Sort the columns for a users table', correctOrder: ['id INT PRIMARY KEY AUTO_INCREMENT', 'username VARCHAR(50) UNIQUE NOT NULL', 'email VARCHAR(100) UNIQUE NOT NULL', 'password_hash VARCHAR(255) NOT NULL', 'created_at TIMESTAMP DEFAULT NOW()'] },
  ],
  'puzzle-network-topology': [
    { id: 'nt1', description: 'Sort the network layers from top to bottom', correctOrder: ['Application Layer (HTTP)', 'Transport Layer (TCP)', 'Network Layer (IP)', 'Data Link Layer (Ethernet)', 'Physical Layer (Cables)'] },
    { id: 'nt2', description: 'Sort the DNS resolution steps', correctOrder: ['Check browser cache', 'Check OS cache', 'Query recursive DNS resolver', 'Query root DNS server', 'Query TLD DNS server', 'Query authoritative DNS server', 'Return IP address'] },
  ],
};
