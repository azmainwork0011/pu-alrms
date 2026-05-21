// ══════════════════════════════════════════════════
// Typing Game Data — Code snippets for all 8 typing games
// ══════════════════════════════════════════════════
import type { TypingSnippet } from '@/components/games/engines/TypingEngine';

export const typingGames: Record<string, TypingSnippet[]> = {
  'typing-speed-code': [
    { id: 'sc1', code: 'const sum = (a, b) => a + b;\nconsole.log(sum(5, 3));', title: 'Arrow Function Sum', language: 'JavaScript', points: 15 },
    { id: 'sc2', code: 'for (let i = 0; i < 10; i++) {\n  console.log(i);\n}', title: 'For Loop', language: 'JavaScript', points: 15 },
    { id: 'sc3', code: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)', title: 'Fibonacci', language: 'Python', points: 20 },
    { id: 'sc4', code: 'const arr = [1, 2, 3, 4, 5];\nconst doubled = arr.map(x => x * 2);', title: 'Array Map', language: 'JavaScript', points: 15 },
    { id: 'sc5', code: 'class Node {\n  constructor(val) {\n    this.val = val;\n    this.next = null;\n  }\n}', title: 'LinkedList Node', language: 'JavaScript', points: 20 },
  ],
  'typing-html': [
    { id: 'ht1', code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n</head>\n</html>', title: 'HTML5 Boilerplate', language: 'HTML', points: 15 },
    { id: 'ht2', code: '<nav>\n  <ul>\n    <li><a href="/">Home</a></li>\n    <li><a href="/about">About</a></li>\n  </ul>\n</nav>', title: 'Navigation', language: 'HTML', points: 15 },
    { id: 'ht3', code: '<form action="/submit" method="POST">\n  <input type="text" name="q" />\n  <button type="submit">Search</button>\n</form>', title: 'Search Form', language: 'HTML', points: 15 },
    { id: 'ht4', code: '<div class="card">\n  <img src="photo.jpg" alt="Photo" />\n  <h2>Title</h2>\n  <p>Description text</p>\n</div>', title: 'Card Component', language: 'HTML', points: 15 },
  ],
  'typing-css': [
    { id: 'cs1', code: '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 1rem;\n}', title: 'Flexbox Center', language: 'CSS', points: 15 },
    { id: 'cs2', code: '.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 1rem;\n}', title: 'Grid Layout', language: 'CSS', points: 15 },
    { id: 'cs3', code: '.btn {\n  padding: 0.5rem 1rem;\n  border-radius: 0.5rem;\n  background: #10b981;\n  color: white;\n}', title: 'Button Style', language: 'CSS', points: 15 },
    { id: 'cs4', code: '@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n.element {\n  animation: fadeIn 0.3s ease;\n}', title: 'Fade Animation', language: 'CSS', points: 20 },
  ],
  'typing-js': [
    { id: 'js1', code: 'const fetchData = async (url) => {\n  try {\n    const res = await fetch(url);\n    return await res.json();\n  } catch (err) {\n    console.error(err);\n  }\n};', title: 'Async Fetch', language: 'JavaScript', points: 20 },
    { id: 'js2', code: 'const debounce = (fn, delay) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};', title: 'Debounce', language: 'JavaScript', points: 20 },
    { id: 'js3', code: 'const unique = (arr) => [...new Set(arr)];\nconst flattened = (arr) => arr.flat();\nconst chunked = (arr, n) => {\n  return Array.from({length: Math.ceil(arr.length/n)}, (_,i) => arr.slice(i*n, i*n+n));\n};', title: 'Array Utils', language: 'JavaScript', points: 25 },
  ],
  'typing-python': [
    { id: 'py1', code: 'def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1', title: 'Binary Search', language: 'Python', points: 25 },
    { id: 'py2', code: 'class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, item):\n        self.items.append(item)\n    def pop(self):\n        return self.items.pop()\n    def is_empty(self):\n        return len(self.items) == 0', title: 'Stack Class', language: 'Python', points: 20 },
    { id: 'py3', code: 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    mid = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + mid + quicksort(right)', title: 'Quicksort', language: 'Python', points: 25 },
  ],
  'typing-json': [
    { id: 'jn1', code: '{\n  "name": "John",\n  "age": 30,\n  "skills": ["JavaScript", "Python"],\n  "address": {\n    "city": "New York",\n    "zip": "10001"\n  }\n}', title: 'User Object', language: 'JSON', points: 15 },
    { id: 'jn2', code: '[\n  { "id": 1, "title": "Task 1", "done": true },\n  { "id": 2, "title": "Task 2", "done": false },\n  { "id": 3, "title": "Task 3", "done": true }\n]', title: 'Todo List', language: 'JSON', points: 15 },
    { id: 'jn3', code: '{\n  "api": "/users",\n  "method": "GET",\n  "headers": { "Authorization": "Bearer token" },\n  "params": { "page": 1, "limit": 10 }\n}', title: 'API Config', language: 'JSON', points: 15 },
  ],
  'typing-sql': [
    { id: 'sq1', code: 'SELECT u.name, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nGROUP BY u.id, u.name\nHAVING order_count > 5\nORDER BY order_count DESC;', title: 'User Orders Query', language: 'SQL', points: 20 },
    { id: 'sq2', code: 'CREATE TABLE products (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255) NOT NULL,\n  price DECIMAL(10,2),\n  created_at TIMESTAMP DEFAULT NOW()\n);', title: 'Create Table', language: 'SQL', points: 20 },
    { id: 'sq3', code: 'UPDATE inventory\nSET quantity = quantity - sold_qty\nWHERE product_id IN (\n  SELECT product_id FROM orders WHERE date = CURRENT_DATE\n);', title: 'Update with Subquery', language: 'SQL', points: 25 },
  ],
  'typing-regex': [
    { id: 'rx1', code: 'const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;\nconst phoneRegex = /^\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}$/;', title: 'Email & Phone Regex', language: 'Regex', points: 25 },
    { id: 'rx2', code: 'const urlRegex = /^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$/;', title: 'URL Regex', language: 'Regex', points: 25 },
    { id: 'rx3', code: 'const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;\nconst hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;', title: 'Password & Hex Regex', language: 'Regex', points: 30 },
  ],
};
