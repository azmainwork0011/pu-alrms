'use client';

// ═══════════════════════════════════════════════════════
// CodeQuest Arena – Data Layer
// ═══════════════════════════════════════════════════════

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionType = 'MCQ' | 'OUTPUT_PREDICTION' | 'CODE_FIXING';

export interface ProgrammingLanguage {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  difficulty: Difficulty;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  icon: string;
  description: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface Question {
  id: string;
  languageId: string;
  topicId: string;
  type: QuestionType;
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
  points: number;
}

export interface LevelThreshold {
  level: number;
  title: string;
  xpRequired: number;
  badge: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  languageId: string;
  difficulty: Difficulty;
  points: number;
  questions: Question[];
}

export interface BugFinderData {
  id: string;
  languageId: string;
  title: string;
  code: string;
  bugLine: number;
  bugDescription: string;
  fixedCode: string;
  difficulty: Difficulty;
  points: number;
}

export interface CodePuzzleData {
  id: string;
  languageId: string;
  title: string;
  shuffledLines: string[];
  correctOrder: string[];
  description: string;
  difficulty: Difficulty;
  points: number;
}

export interface SyntaxMatchPair {
  id: string;
  concept: string;
  syntax: string;
  languageId: string;
}

// ═══════════════════════════════════════════════════════
// Level System
// ═══════════════════════════════════════════════════════

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, title: 'Code Novice', xpRequired: 0, badge: '🌱' },
  { level: 2, title: 'Code Apprentice', xpRequired: 100, badge: '📘' },
  { level: 3, title: 'Script Kiddie', xpRequired: 250, badge: '📓' },
  { level: 4, title: 'Code Padawan', xpRequired: 500, badge: '⚔️' },
  { level: 5, title: 'Junior Developer', xpRequired: 800, badge: '🔧' },
  { level: 6, title: 'Code Warrior', xpRequired: 1200, badge: '🛡️' },
  { level: 7, title: 'Problem Solver', xpRequired: 1700, badge: '🧩' },
  { level: 8, title: 'Senior Coder', xpRequired: 2300, badge: '💎' },
  { level: 9, title: 'Algorithms Master', xpRequired: 3000, badge: '🧠' },
  { level: 10, title: 'System Architect', xpRequired: 4000, badge: '🏗️' },
  { level: 11, title: 'Tech Lead', xpRequired: 5200, badge: '🏆' },
  { level: 12, title: 'Full Stack Expert', xpRequired: 6500, badge: '🌐' },
  { level: 13, title: 'Open Source Hero', xpRequired: 8000, badge: '⭐' },
  { level: 14, title: 'AI Integrator', xpRequired: 10000, badge: '🤖' },
  { level: 15, title: 'Cloud Architect', xpRequired: 12500, badge: '☁️' },
  { level: 16, title: 'DevOps Ninja', xpRequired: 15000, badge: '🥷' },
  { level: 17, title: 'Security Expert', xpRequired: 18000, badge: '🔐' },
  { level: 18, title: 'Principal Engineer', xpRequired: 22000, badge: '🎯' },
  { level: 19, title: 'Distinguished Engineer', xpRequired: 27000, badge: '🎖️' },
  { level: 20, title: 'Legendary Coder', xpRequired: 35000, badge: '👑' },
];

// ═══════════════════════════════════════════════════════
// Questions Database (150+ questions across 6 languages)
// ═══════════════════════════════════════════════════════

const allQuestions: Question[] = [
  // ── PYTHON ───────────────────────────────────────────
  // Variables & Data Types
  { id: 'py-v-1', languageId: 'python', topicId: 'py-variables', type: 'MCQ', question: 'What is the output of type(3.14)?', codeSnippet: 'type(3.14)', options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"], correctAnswer: 'B', explanation: '3.14 is a floating-point number, so type() returns float.', difficulty: 'EASY', points: 10 },
  { id: 'py-v-2', languageId: 'python', topicId: 'py-variables', type: 'OUTPUT_PREDICTION', question: 'What does this code print?', codeSnippet: 'x = "Hello"\ny = "World"\nprint(x + " " + y)', correctAnswer: 'Hello World', explanation: 'The + operator concatenates strings in Python.', difficulty: 'EASY', points: 10 },
  { id: 'py-v-3', languageId: 'python', topicId: 'py-variables', type: 'MCQ', question: 'Which is NOT a valid Python variable name?', codeSnippet: undefined, options: ['_name', 'my_var', '2ndValue', 'camelCase'], correctAnswer: 'C', explanation: 'Python variables cannot start with a number.', difficulty: 'EASY', points: 10 },
  { id: 'py-v-4', languageId: 'python', topicId: 'py-variables', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'a, b, c = 1, 2, 3\nprint(b)', correctAnswer: '2', explanation: 'Python supports tuple unpacking. a=1, b=2, c=3.', difficulty: 'EASY', points: 10 },
  { id: 'py-v-5', languageId: 'python', topicId: 'py-variables', type: 'CODE_FIXING', question: 'Fix the code that tries to convert a string to integer:', codeSnippet: 'name = "42"\nresult = int("hello")', correctAnswer: 'name = "42"\nresult = int(name)', explanation: 'int() can only convert numeric strings. Use the variable name instead of "hello".', difficulty: 'EASY', points: 15 },

  // Control Flow
  { id: 'py-cf-1', languageId: 'python', topicId: 'py-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'x = 15\nif x > 10:\n    if x > 20:\n        print("big")\n    else:\n        print("medium")\nelse:\n    print("small")', correctAnswer: 'medium', explanation: '15 > 10 is True, but 15 > 20 is False, so "medium" is printed.', difficulty: 'EASY', points: 10 },
  { id: 'py-cf-2', languageId: 'python', topicId: 'py-control-flow', type: 'OUTPUT_PREDICTION', question: 'What does this print?', codeSnippet: 'for i in range(3):\n    print(i, end=" ")', correctAnswer: '0 1 2', explanation: 'range(3) generates 0, 1, 2 (exclusive of stop value).', difficulty: 'EASY', points: 10 },
  { id: 'py-cf-3', languageId: 'python', topicId: 'py-control-flow', type: 'MCQ', question: 'How many times does this loop run?', codeSnippet: 'count = 0\nwhile count < 5:\n    count += 2', options: ['2 times', '3 times', '4 times', '5 times'], correctAnswer: 'B', explanation: 'count goes 0→2→4→6. The loop body runs when count<5: at 0,2,4 = 3 times.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-cf-4', languageId: 'python', topicId: 'py-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'result = [x**2 for x in range(5) if x % 2 == 0]\nprint(result)', correctAnswer: '[0, 4, 16]', explanation: 'List comprehension: squares of even numbers in range(5): 0²=0, 2²=4, 4²=16.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-cf-5', languageId: 'python', topicId: 'py-control-flow', type: 'CODE_FIXING', question: 'Fix the indentation error:', codeSnippet: 'for i in range(3):\nprint(i)', correctAnswer: 'for i in range(3):\n    print(i)', explanation: 'Python uses indentation to define blocks. The print statement needs to be indented.', difficulty: 'EASY', points: 10 },

  // Functions
  { id: 'py-fn-1', languageId: 'python', topicId: 'py-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'def greet(name="World"):\n    return f"Hello, {name}!"\n\nprint(greet())\nprint(greet("Alice"))', correctAnswer: 'Hello, World!\nHello, Alice!', explanation: 'Default parameter "World" is used when no argument is passed.', difficulty: 'EASY', points: 10 },
  { id: 'py-fn-2', languageId: 'python', topicId: 'py-functions', type: 'OUTPUT_PREDICTION', question: 'What does this return?', codeSnippet: 'def add(*args):\n    return sum(args)\n\nprint(add(1, 2, 3, 4))', correctAnswer: '10', explanation: '*args collects all positional arguments into a tuple. sum(1,2,3,4) = 10.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-fn-3', languageId: 'python', topicId: 'py-functions', type: 'MCQ', question: 'What is a lambda function in Python?', codeSnippet: undefined, options: ['A recursive function', 'An anonymous inline function', 'A built-in function', 'A class method'], correctAnswer: 'B', explanation: 'Lambda creates anonymous functions using the syntax: lambda args: expression.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-fn-4', languageId: 'python', topicId: 'py-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'x = 10\ndef modify():\n    x = 20\n    print(x)\nmodify()\nprint(x)', correctAnswer: '20\n10', explanation: 'The function creates a local variable x. The global x remains unchanged.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-fn-5', languageId: 'python', topicId: 'py-functions', type: 'CODE_FIXING', question: 'Fix the function to return the factorial correctly:', codeSnippet: 'def factorial(n):\n    if n == 0:\n        return 0\n    return n * factorial(n-1)', correctAnswer: 'def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)', explanation: 'Base case of factorial(0) should return 1, not 0. Otherwise all results would be 0.', difficulty: 'MEDIUM', points: 20 },

  // Lists & Collections
  { id: 'py-lc-1', languageId: 'python', topicId: 'py-lists', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'arr = [1, 2, 3, 4, 5]\nprint(arr[1:4])', correctAnswer: '[2, 3, 4]', explanation: 'Slicing [1:4] gives elements at index 1, 2, 3 (4 is exclusive).', difficulty: 'EASY', points: 10 },
  { id: 'py-lc-2', languageId: 'python', topicId: 'py-lists', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'fruits = ["apple", "banana", "cherry"]\nfruits.append("date")\nfruits.pop(1)\nprint(fruits)', correctAnswer: "['apple', 'cherry', 'date']", explanation: 'append adds to end, pop(1) removes index 1 ("banana").', difficulty: 'EASY', points: 10 },
  { id: 'py-lc-3', languageId: 'python', topicId: 'py-lists', type: 'MCQ', question: 'What does dict.get("key", "default") do?', codeSnippet: undefined, options: ['Sets a key-value pair', 'Returns value or default if key not found', 'Deletes a key', 'Returns all keys'], correctAnswer: 'B', explanation: 'dict.get() returns the value for key if exists, otherwise returns the default.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-lc-4', languageId: 'python', topicId: 'py-lists', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'nums = {1, 2, 3, 2, 1}\nprint(len(nums))', correctAnswer: '3', explanation: 'Sets only store unique values. {1,2,3,2,1} becomes {1,2,3}.', difficulty: 'EASY', points: 10 },
  { id: 'py-lc-5', languageId: 'python', topicId: 'py-lists', type: 'CODE_FIXING', question: 'Fix the tuple modification error:', codeSnippet: 'my_tuple = (1, 2, 3)\nmy_tuple[0] = 10', correctAnswer: 'my_list = list((1, 2, 3))\nmy_list[0] = 10', explanation: 'Tuples are immutable in Python. Convert to list first to modify.', difficulty: 'MEDIUM', points: 15 },

  // OOP
  { id: 'py-oop-1', languageId: 'python', topicId: 'py-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f"{self.name} says Woof!"\n\ndog = Dog("Rex")\nprint(dog.speak())', correctAnswer: 'Rex says Woof!', explanation: '__init__ is the constructor. self.name stores the instance attribute.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-oop-2', languageId: 'python', topicId: 'py-oop', type: 'MCQ', question: 'What does super().__init__() do?', codeSnippet: undefined, options: ['Calls the parent class constructor', 'Creates a new instance', 'Deletes the parent class', 'Imports a module'], correctAnswer: 'A', explanation: 'super() gives access to parent class methods. __init__() calls the constructor.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-oop-3', languageId: 'python', topicId: 'py-oop', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'class Animal:\n    species = "Unknown"\n\nclass Dog(Animal):\n    species = "Canine"\n\nprint(Dog.species)\nprint(Animal.species)', correctAnswer: 'Canine\nUnknown', explanation: 'Class attributes are inherited but can be overridden in subclasses.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-oop-4', languageId: 'python', topicId: 'py-oop', type: 'CODE_FIXING', question: 'Fix the static method call:', codeSnippet: 'class Math:\n    @staticmethod\n    def add(a, b):\n        return a + b\n\nresult = Math.add(2, 3)  # This works\nresult = Math().add(2, 3)  # This also works', correctAnswer: 'class Math:\n    @staticmethod\n    def add(a, b):\n        return a + b\n\nresult = Math.add(2, 3)', explanation: 'Static methods should be called on the class directly, not on an instance.', difficulty: 'MEDIUM', points: 15 },
  { id: 'py-oop-5', languageId: 'python', topicId: 'py-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'class Counter:\n    count = 0\n    def __init__(self):\n        Counter.count += 1\n\na = Counter()\nb = Counter()\nc = Counter()\nprint(Counter.count)', correctAnswer: '3', explanation: 'Counter.count is a class variable shared across all instances.', difficulty: 'HARD', points: 20 },

  // ── JAVA ──────────────────────────────────────────────
  // Variables & Data Types
  { id: 'java-v-1', languageId: 'java', topicId: 'java-variables', type: 'MCQ', question: 'Which is the default value of an int variable in Java?', codeSnippet: undefined, options: ['0', '1', 'null', 'undefined'], correctAnswer: 'A', explanation: 'Java initializes int to 0, boolean to false, and object references to null.', difficulty: 'EASY', points: 10 },
  { id: 'java-v-2', languageId: 'java', topicId: 'java-variables', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'int x = 5;\nint y = x++;\nSystem.out.println(x + " " + y);', correctAnswer: '6 5', explanation: 'x++ is post-increment: y gets the old value (5), then x becomes 6.', difficulty: 'EASY', points: 10 },
  { id: 'java-v-3', languageId: 'java', topicId: 'java-variables', type: 'MCQ', question: 'Which data type can store the largest integer?', codeSnippet: undefined, options: ['int', 'long', 'short', 'byte'], correctAnswer: 'B', explanation: 'long is 64-bit (±9.2×10¹⁸), int is 32-bit, short is 16-bit, byte is 8-bit.', difficulty: 'EASY', points: 10 },
  { id: 'java-v-4', languageId: 'java', topicId: 'java-variables', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'double d = 10 / 3;\nSystem.out.println(d);', correctAnswer: '3.0', explanation: '10/3 is integer division (= 3), then auto-widened to double (3.0). Use 10.0/3 for 3.333.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-v-5', languageId: 'java', topicId: 'java-variables', type: 'CODE_FIXING', question: 'Fix the type mismatch:', codeSnippet: 'int result = Math.pow(2, 10);', correctAnswer: 'int result = (int) Math.pow(2, 10);', explanation: 'Math.pow() returns double. Must explicitly cast to int.', difficulty: 'EASY', points: 10 },

  // Control Flow
  { id: 'java-cf-1', languageId: 'java', topicId: 'java-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'for (int i = 0; i < 5; i++) {\n    if (i == 3) break;\n    System.out.print(i);\n}', correctAnswer: '012', explanation: 'break exits the loop when i==3, so only 0,1,2 are printed.', difficulty: 'EASY', points: 10 },
  { id: 'java-cf-2', languageId: 'java', topicId: 'java-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'String day = "Saturday";\nswitch(day) {\n    case "Monday": System.out.print("Work"); break;\n    case "Saturday":\n    case "Sunday": System.out.print("Weekend"); break;\n    default: System.out.print("Day");\n}', correctAnswer: 'Weekend', explanation: 'Fall-through: Saturday has no break, so it falls through to Sunday case.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-cf-3', languageId: 'java', topicId: 'java-control-flow', type: 'MCQ', question: 'What is the value of x?', codeSnippet: 'int x = 0;\nfor (int i = 1; i <= 3; i++) {\n    x += i * i;\n}', options: ['5', '9', '14', '6'], correctAnswer: 'C', explanation: 'x = 1×1 + 2×2 + 3×3 = 1 + 4 + 9 = 14', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-cf-4', languageId: 'java', topicId: 'java-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'int sum = 0;\nfor (int i = 1; i <= 10; i += 3) {\n    sum += i;\n}\nSystem.out.println(sum);', correctAnswer: '22', explanation: 'i takes values 1,4,7,10. sum = 1+4+7+10 = 22.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-cf-5', languageId: 'java', topicId: 'java-control-flow', type: 'CODE_FIXING', question: 'Fix the infinite loop:', codeSnippet: 'int i = 0;\nwhile (i < 5) {\n    System.out.println(i);\n}', correctAnswer: 'int i = 0;\nwhile (i < 5) {\n    System.out.println(i);\n    i++;\n}', explanation: 'Missing increment statement causes infinite loop. i++ must be added.', difficulty: 'EASY', points: 10 },

  // Functions (Methods)
  { id: 'java-fn-1', languageId: 'java', topicId: 'java-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'public static int factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\nSystem.out.println(factorial(5));', correctAnswer: '120', explanation: '5! = 5×4×3×2×1 = 120', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-fn-2', languageId: 'java', topicId: 'java-functions', type: 'MCQ', question: 'What is method overloading?', codeSnippet: undefined, options: ['Having the same method name with different parameters', 'Overriding a parent method', 'Calling a method from within itself', 'A method that returns nothing'], correctAnswer: 'A', explanation: 'Method overloading allows multiple methods with same name but different parameter lists.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-fn-3', languageId: 'java', topicId: 'java-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'public static void modify(int x) {\n    x = 20;\n}\nint num = 10;\nmodify(num);\nSystem.out.println(num);', correctAnswer: '10', explanation: 'Java passes primitives by value. Changes inside the method don\'t affect the original.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-fn-4', languageId: 'java', topicId: 'java-functions', type: 'CODE_FIXING', question: 'Fix the varargs method:', codeSnippet: 'public static int sum(int... nums) {\n    int total = 0;\n    for (int n : nums) {\n        total += n;\n    }\n    return total;\n}\n// Call: sum(1, 2, 3, 4) should return 10', correctAnswer: 'public static int sum(int... nums) {\n    int total = 0;\n    for (int n : nums) {\n        total += n;\n    }\n    return total;\n}\nsum(1, 2, 3, 4); // Returns 10', explanation: 'This code is actually correct. The varargs syntax (int...) allows variable arguments.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-fn-5', languageId: 'java', topicId: 'java-functions', type: 'MCQ', question: 'Can a method return multiple values in Java?', codeSnippet: undefined, options: ['Yes, using comma syntax', 'No, but you can return an array or object', 'Yes, using the multi keyword', 'No, never'], correctAnswer: 'B', explanation: 'Java methods return one value. Use arrays, collections, or custom objects for multiple values.', difficulty: 'EASY', points: 10 },

  // Arrays & Collections
  { id: 'java-ac-1', languageId: 'java', topicId: 'java-collections', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'int[] arr = {5, 3, 8, 1, 9};\nArrays.sort(arr);\nSystem.out.println(arr[2]);', correctAnswer: '5', explanation: 'After sorting: {1,3,5,8,9}. Index 2 = 5.', difficulty: 'EASY', points: 10 },
  { id: 'java-ac-2', languageId: 'java', topicId: 'java-collections', type: 'MCQ', question: 'Which collection allows duplicate elements?', codeSnippet: undefined, options: ['Set', 'HashSet', 'ArrayList', 'TreeSet'], correctAnswer: 'C', explanation: 'ArrayList allows duplicates. Set implementations (HashSet, TreeSet) do not.', difficulty: 'EASY', points: 10 },
  { id: 'java-ac-3', languageId: 'java', topicId: 'java-collections', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'ArrayList<String> list = new ArrayList<>();\nlist.add("A");\nlist.add("B");\nlist.add(1, "C");\nSystem.out.println(list);', correctAnswer: '[A, C, B]', explanation: 'add(1, "C") inserts "C" at index 1, shifting "B" right.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-ac-4', languageId: 'java', topicId: 'java-collections', type: 'CODE_FIXING', question: 'Fix the array access error:', codeSnippet: 'int[] arr = new int[3];\narr[3] = 10;', correctAnswer: 'int[] arr = new int[4];\narr[3] = 10;', explanation: 'Array of size 3 has indices 0-2. arr[3] causes ArrayIndexOutOfBoundsException.', difficulty: 'EASY', points: 10 },
  { id: 'java-ac-5', languageId: 'java', topicId: 'java-collections', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'HashMap<String, Integer> map = new HashMap<>();\nmap.put("a", 1);\nmap.put("b", 2);\nmap.put("a", 3);\nSystem.out.println(map.get("a"));', correctAnswer: '3', explanation: 'put() overwrites existing values. "a" was 1, then updated to 3.', difficulty: 'MEDIUM', points: 15 },

  // OOP
  { id: 'java-oop-1', languageId: 'java', topicId: 'java-oop', type: 'MCQ', question: 'What is the default access modifier in Java?', codeSnippet: undefined, options: ['public', 'private', 'protected', 'package-private (default)'], correctAnswer: 'D', explanation: 'When no modifier is specified, it is package-private (accessible within same package).', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-oop-2', languageId: 'java', topicId: 'java-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'class Animal {\n    public String speak() { return "..."; }\n}\nclass Cat extends Animal {\n    @Override\n    public String speak() { return "Meow!"; }\n}\nAnimal a = new Cat();\nSystem.out.println(a.speak());', correctAnswer: 'Meow!', explanation: 'Dynamic method dispatch: Cat\'s speak() is called because actual object is Cat.', difficulty: 'MEDIUM', points: 15 },
  { id: 'java-oop-3', languageId: 'java', topicId: 'java-oop', type: 'MCQ', question: 'Which keyword prevents class inheritance?', codeSnippet: undefined, options: ['static', 'final', 'abstract', 'sealed'], correctAnswer: 'B', explanation: 'final class cannot be extended. final methods cannot be overridden.', difficulty: 'EASY', points: 10 },
  { id: 'java-oop-4', languageId: 'java', topicId: 'java-oop', type: 'CODE_FIXING', question: 'Fix the abstract class usage:', codeSnippet: 'abstract class Shape {\n    abstract double area();\n}\nShape s = new Shape();', correctAnswer: 'abstract class Shape {\n    abstract double area();\n}\nShape s = new Shape() {\n    @Override\n    double area() { return 0; }\n};', explanation: 'Cannot instantiate abstract class directly. Create anonymous subclass or concrete subclass.', difficulty: 'HARD', points: 20 },
  { id: 'java-oop-5', languageId: 'java', topicId: 'java-oop', type: 'MCQ', question: 'What is an interface in Java?', codeSnippet: undefined, options: ['A class with private methods only', 'A contract that defines method signatures', 'A data structure', 'A type of loop'], correctAnswer: 'B', explanation: 'An interface defines what methods a class must implement (a contract).', difficulty: 'EASY', points: 10 },

  // ── JAVASCRIPT ─────────────────────────────────────────
  // Variables & Data Types
  { id: 'js-v-1', languageId: 'javascript', topicId: 'js-variables', type: 'MCQ', question: 'What is the difference between let and var?', codeSnippet: undefined, options: ['let is block-scoped, var is function-scoped', 'No difference', 'var is block-scoped, let is function-scoped', 'let cannot be reassigned'], correctAnswer: 'A', explanation: 'let is block-scoped ({}), var is function-scoped and hoisted.', difficulty: 'EASY', points: 10 },
  { id: 'js-v-2', languageId: 'javascript', topicId: 'js-variables', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'console.log(typeof null)', correctAnswer: 'object', explanation: 'This is a well-known JS bug from the first version. typeof null returns "object".', difficulty: 'EASY', points: 10 },
  { id: 'js-v-3', languageId: 'javascript', topicId: 'js-variables', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'let a = "5";\nlet b = 3;\nconsole.log(a + b);\nconsole.log(a - b);', correctAnswer: '53\n2', explanation: '+ with string concatenates. - converts string to number.', difficulty: 'EASY', points: 10 },
  { id: 'js-v-4', languageId: 'javascript', topicId: 'js-variables', type: 'MCQ', question: 'What does const mean in JavaScript?', codeSnippet: undefined, options: ['The value cannot change', 'The binding cannot be reassigned', 'The variable is global', 'The variable is private'], correctAnswer: 'B', explanation: 'const prevents reassignment, but object properties can still be modified.', difficulty: 'EASY', points: 10 },
  { id: 'js-v-5', languageId: 'javascript', topicId: 'js-variables', type: 'CODE_FIXING', question: 'Fix the const reassignment:', codeSnippet: 'const arr = [1, 2, 3];\narr = [4, 5, 6];', correctAnswer: 'const arr = [1, 2, 3];\narr.length = 0;\narr.push(4, 5, 6);', explanation: 'Cannot reassign const, but can modify the array contents using methods.', difficulty: 'EASY', points: 10 },

  // Control Flow
  { id: 'js-cf-1', languageId: 'javascript', topicId: 'js-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}', correctAnswer: '0\n1\n2', explanation: 'let creates a new binding per iteration. With var it would print 3,3,3.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-cf-2', languageId: 'javascript', topicId: 'js-control-flow', type: 'OUTPUT_PREDICTION', question: 'What does this print?', codeSnippet: 'const result = [1,2,3].map(n => n * 2).filter(n => n > 2);\nconsole.log(result);', correctAnswer: '[4, 6]', explanation: 'map doubles: [2,4,6]. filter keeps > 2: [4,6].', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-cf-3', languageId: 'javascript', topicId: 'js-control-flow', type: 'MCQ', question: 'What is the output?', codeSnippet: 'console.log(0 == false);\nconsole.log(0 === false);', options: ['true, true', 'false, false', 'true, false', 'false, true'], correctAnswer: 'C', explanation: '== uses type coercion (0 == false is true). === requires same type (0 === false is false).', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-cf-4', languageId: 'javascript', topicId: 'js-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'const sum = [1,2,3,4].reduce((acc, n) => acc + n, 0);\nconsole.log(sum);', correctAnswer: '10', explanation: 'reduce starts with 0, adds each element: 0+1+2+3+4 = 10.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-cf-5', languageId: 'javascript', topicId: 'js-control-flow', type: 'CODE_FIXING', question: 'Fix the async/await usage:', codeSnippet: 'function getData() {\n  const res = await fetch("/api");\n  return res.json();\n}', correctAnswer: 'async function getData() {\n  const res = await fetch("/api");\n  return res.json();\n}', explanation: 'await can only be used inside async functions.', difficulty: 'MEDIUM', points: 15 },

  // Functions
  { id: 'js-fn-1', languageId: 'javascript', topicId: 'js-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'const greet = (name = "World") => `Hello, ${name}!`;\nconsole.log(greet());\nconsole.log(greet("JS"));', correctAnswer: 'Hello, World!\nHello, JS!', explanation: 'Arrow function with default parameter. ES6 template literals.', difficulty: 'EASY', points: 10 },
  { id: 'js-fn-2', languageId: 'javascript', topicId: 'js-functions', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'function outer() {\n  let count = 0;\n  return function inner() {\n    return ++count;\n  };\n}\nconst counter = outer();\nconsole.log(counter());\nconsole.log(counter());', correctAnswer: '1\n2', explanation: 'Closure: inner function retains access to count variable from outer scope.', difficulty: 'HARD', points: 20 },
  { id: 'js-fn-3', languageId: 'javascript', topicId: 'js-functions', type: 'MCQ', question: 'What does the spread operator (...) do?', codeSnippet: undefined, options: ['Removes an element from array', 'Expands iterable into individual elements', 'Creates a deep copy', 'Sorts the array'], correctAnswer: 'B', explanation: 'Spread operator expands iterables: [...arr] or func(...args).', difficulty: 'EASY', points: 10 },
  { id: 'js-fn-4', languageId: 'javascript', topicId: 'js-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'const obj = {a: 1, b: 2, c: 3};\nconst {a, ...rest} = obj;\nconsole.log(rest);', correctAnswer: '{b: 2, c: 3}', explanation: 'Object destructuring with rest operator collects remaining properties.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-fn-5', languageId: 'javascript', topicId: 'js-functions', type: 'CODE_FIXING', question: 'Fix the this binding issue:', codeSnippet: 'const obj = {\n  name: "Alice",\n  greet: function() {\n    setTimeout(function() {\n      console.log(this.name);\n    }, 100);\n  }\n};\nobj.greet();', correctAnswer: 'const obj = {\n  name: "Alice",\n  greet: function() {\n    setTimeout(() => {\n      console.log(this.name);\n    }, 100);\n  }\n};\nobj.greet();', explanation: 'Arrow functions inherit this from enclosing scope. Regular functions have their own this.', difficulty: 'HARD', points: 20 },

  // Arrays & Objects
  { id: 'js-ao-1', languageId: 'javascript', topicId: 'js-arrays', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'const arr = [1, [2, 3], [4, [5]]];\nconsole.log(arr.flat(Infinity));', correctAnswer: '[1, 2, 3, 4, 5]', explanation: 'flat(Infinity) recursively flattens all nested arrays.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-ao-2', languageId: 'javascript', topicId: 'js-arrays', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'const obj = {x: 1, y: 2};\nconst copy = {...obj, y: 3, z: 4};\nconsole.log(copy);', correctAnswer: '{x: 1, y: 3, z: 4}', explanation: 'Spread copies existing properties, later properties override earlier ones.', difficulty: 'EASY', points: 10 },
  { id: 'js-ao-3', languageId: 'javascript', topicId: 'js-arrays', type: 'MCQ', question: 'Which method does NOT modify the original array?', codeSnippet: undefined, options: ['push()', 'splice()', 'map()', 'sort()'], correctAnswer: 'C', explanation: 'map() returns a new array. push, splice, and sort modify the original.', difficulty: 'EASY', points: 10 },
  { id: 'js-ao-4', languageId: 'javascript', topicId: 'js-arrays', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'const set = new Set([1, 2, 2, 3, 3, 3]);\nconsole.log([...set]);', correctAnswer: '[1, 2, 3]', explanation: 'Set only keeps unique values. Spread converts back to array.', difficulty: 'EASY', points: 10 },
  { id: 'js-ao-5', languageId: 'javascript', topicId: 'js-arrays', type: 'CODE_FIXING', question: 'Fix the deep copy issue:', codeSnippet: 'const original = {a: {b: 1}};\nconst copy = {...original};\ncopy.a.b = 2;\n// original.a.b is now also 2!', correctAnswer: 'const original = {a: {b: 1}};\nconst copy = JSON.parse(JSON.stringify(original));\ncopy.a.b = 2;', explanation: 'Spread only creates shallow copy. Use JSON.parse(JSON.stringify()) or structuredClone() for deep copy.', difficulty: 'MEDIUM', points: 15 },

  // OOP (Prototypes)
  { id: 'js-oop-1', languageId: 'javascript', topicId: 'js-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'class Animal {\n  constructor(name) { this.name = name; }\n  speak() { return `${this.name} makes a sound`; }\n}\nclass Dog extends Animal {\n  speak() { return `${this.name} barks`; }\n}\nconst d = new Dog("Rex");\nconsole.log(d.speak());', correctAnswer: 'Rex barks', explanation: 'ES6 class syntax with extends. Dog overrides speak().', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-oop-2', languageId: 'javascript', topicId: 'js-oop', type: 'MCQ', question: 'What is a Promise in JavaScript?', codeSnippet: undefined, options: ['A synchronous operation', 'An object representing future value or failure', 'A type of loop', 'A data structure'], correctAnswer: 'B', explanation: 'Promise represents the eventual completion (or failure) of an async operation.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-oop-3', languageId: 'javascript', topicId: 'js-oop', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'async function test() {\n  const p1 = Promise.resolve(1);\n  const p2 = Promise.resolve(2);\n  const p3 = Promise.resolve(3);\n  console.log(await Promise.all([p1, p2, p3]));\n}\ntest();', correctAnswer: '[1, 2, 3]', explanation: 'Promise.all waits for all promises and returns array of results.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-oop-4', languageId: 'javascript', topicId: 'js-oop', type: 'CODE_FIXING', question: 'Fix the async error handling:', codeSnippet: 'async function fetchData() {\n  const res = await fetch("/api");\n  const data = await res.json();\n  return data;\n}', correctAnswer: 'async function fetchData() {\n  try {\n    const res = await fetch("/api");\n    if (!res.ok) throw new Error("HTTP error");\n    const data = await res.json();\n    return data;\n  } catch (err) {\n    console.error("Failed:", err);\n    return null;\n  }\n}', explanation: 'Always handle errors in async functions with try/catch and check res.ok.', difficulty: 'MEDIUM', points: 15 },
  { id: 'js-oop-5', languageId: 'javascript', topicId: 'js-oop', type: 'MCQ', question: 'What does JSON.stringify() do?', codeSnippet: undefined, options: ['Parses JSON string to object', 'Converts object to JSON string', 'Validates JSON', 'Formats code'], correctAnswer: 'B', explanation: 'JSON.stringify() serializes a JavaScript object/value to a JSON string.', difficulty: 'EASY', points: 10 },

  // ── KOTLIN ─────────────────────────────────────────────
  // Variables & Data Types
  { id: 'kt-v-1', languageId: 'kotlin', topicId: 'kt-variables', type: 'MCQ', question: 'What is the difference between val and var in Kotlin?', codeSnippet: undefined, options: ['val is immutable, var is mutable', 'val is mutable, var is immutable', 'No difference', 'val is for numbers, var for strings'], correctAnswer: 'A', explanation: 'val (read-only) cannot be reassigned. var (mutable) can be reassigned.', difficulty: 'EASY', points: 10 },
  { id: 'kt-v-2', languageId: 'kotlin', topicId: 'kt-variables', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'val name: String? = null\nprintln(name?.length ?: "null value")', correctAnswer: 'null value', explanation: '?. safe call returns null. ?: (Elvis operator) provides default value.', difficulty: 'EASY', points: 10 },
  { id: 'kt-v-3', languageId: 'kotlin', topicId: 'kt-variables', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'val x = 10\nval y = 20\nprintln("Sum = ${x + y}")', correctAnswer: 'Sum = 30', explanation: 'String template ${} evaluates expressions inside strings.', difficulty: 'EASY', points: 10 },
  { id: 'kt-v-4', languageId: 'kotlin', topicId: 'kt-variables', type: 'MCQ', question: 'What is the type inferred for: val list = listOf(1, 2, 3)?', codeSnippet: undefined, options: ['ArrayList<Int>', 'List<Int>', 'MutableList<Int>', 'Array<Int>'], correctAnswer: 'B', explanation: 'listOf() returns immutable List<T>. Use mutableListOf() for mutable version.', difficulty: 'EASY', points: 10 },
  { id: 'kt-v-5', languageId: 'kotlin', topicId: 'kt-variables', type: 'CODE_FIXING', question: 'Fix the null safety error:', codeSnippet: 'val name: String? = null\nval length = name.length', correctAnswer: 'val name: String? = null\nval length = name?.length ?: 0', explanation: 'Cannot access length on nullable type. Use safe call ?. or null check.', difficulty: 'EASY', points: 10 },

  // Control Flow
  { id: 'kt-cf-1', languageId: 'kotlin', topicId: 'kt-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'val result = when {\n    10 > 20 -> "impossible"\n    10 < 20 -> "possible"\n    else -> "equal"\n}\nprintln(result)', correctAnswer: 'possible', explanation: 'when expression evaluates conditions top to bottom. 10 < 20 is true.', difficulty: 'EASY', points: 10 },
  { id: 'kt-cf-2', languageId: 'kotlin', topicId: 'kt-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'for (i in 1..5 step 2) {\n    print("$i ")\n}', correctAnswer: '1 3 5', explanation: '1..5 creates range. step 2 increments by 2: 1, 3, 5.', difficulty: 'EASY', points: 10 },
  { id: 'kt-cf-3', languageId: 'kotlin', topicId: 'kt-control-flow', type: 'MCQ', question: 'What does "in" operator check in Kotlin?', codeSnippet: undefined, options: ['Variable initialization', 'Membership in range/collection', 'Type checking', 'Null checking'], correctAnswer: 'B', explanation: '"in" checks if a value is within a range or collection.', difficulty: 'EASY', points: 10 },
  { id: 'kt-cf-4', languageId: 'kotlin', topicId: 'kt-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'val list = listOf(1, 2, 3, 4, 5)\nprintln(list.filter { it % 2 == 0 })', correctAnswer: '[2, 4]', explanation: 'filter keeps elements matching the predicate. Even numbers: 2, 4.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-cf-5', languageId: 'kotlin', topicId: 'kt-control-flow', type: 'CODE_FIXING', question: 'Fix the when expression:', codeSnippet: 'val x = 5\nval result = when(x) {\n    1 -> "one"\n    2 -> "two"\n}', correctAnswer: 'val x = 5\nval result = when(x) {\n    1 -> "one"\n    2 -> "two"\n    else -> "other"\n}', explanation: 'when must be exhaustive. Add else branch for unhandled cases.', difficulty: 'EASY', points: 10 },

  // Functions
  { id: 'kt-fn-1', languageId: 'kotlin', topicId: 'kt-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'fun greet(name: String = "World"): String = "Hello, $name!"\nprintln(greet())\nprintln(greet("Kotlin"))', correctAnswer: 'Hello, World!\nHello, Kotlin!', explanation: 'Single-expression function with default parameter.', difficulty: 'EASY', points: 10 },
  { id: 'kt-fn-2', languageId: 'kotlin', topicId: 'kt-functions', type: 'MCQ', question: 'What is an extension function in Kotlin?', codeSnippet: undefined, options: ['A function that extends class hierarchy', 'A function added to a class without modifying it', 'A recursive function', 'An abstract function'], correctAnswer: 'B', explanation: 'Extension functions add new functions to existing classes without inheritance.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-fn-3', languageId: 'kotlin', topicId: 'kt-functions', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'fun printMultiple(vararg items: String) {\n    for (item in items) print("$item ")\n}\nprintMultiple("a", "b", "c")', correctAnswer: 'a b c', explanation: 'vararg allows variable number of arguments.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-fn-4', languageId: 'kotlin', topicId: 'kt-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'val multiply: (Int, Int) -> Int = { a, b -> a * b }\nprintln(multiply(4, 5))', correctAnswer: '20', explanation: 'Lambda expression assigned to a variable. (Int, Int) -> Int is the type.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-fn-5', languageId: 'kotlin', topicId: 'kt-functions', type: 'CODE_FIXING', question: 'Fix the infix function:', codeSnippet: 'infix fun Int.power(exp: Int): Int {\n    return Math.pow(this, exp)\n}\nval result = 2 power 3', correctAnswer: 'import kotlin.math.pow\ninfix fun Int.power(exp: Int): Double {\n    return this.toDouble().pow(exp)\n}\nval result = 2 power 3', explanation: 'Math.pow returns Double. Need to convert and use correct import.', difficulty: 'HARD', points: 20 },

  // Collections
  { id: 'kt-co-1', languageId: 'kotlin', topicId: 'kt-collections', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'val map = mapOf("a" to 1, "b" to 2, "c" to 3)\nprintln(map["b"])', correctAnswer: '2', explanation: 'mapOf creates immutable map. Access values using [] operator.', difficulty: 'EASY', points: 10 },
  { id: 'kt-co-2', languageId: 'kotlin', topicId: 'kt-collections', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'val list = listOf(3, 1, 4, 1, 5)\nprintln(list.sorted().distinct())', correctAnswer: '[1, 3, 4, 5]', explanation: 'sorted() sorts ascending, distinct() removes duplicates.', difficulty: 'EASY', points: 10 },
  { id: 'kt-co-3', languageId: 'kotlin', topicId: 'kt-collections', type: 'MCQ', question: 'What is the difference between List and MutableList?', codeSnippet: undefined, options: ['List is immutable, MutableList is mutable', 'List is faster', 'MutableList is deprecated', 'No difference'], correctAnswer: 'A', explanation: 'List is read-only. MutableList allows add, remove, set operations.', difficulty: 'EASY', points: 10 },
  { id: 'kt-co-4', languageId: 'kotlin', topicId: 'kt-collections', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'val names = listOf("Alice", "Bob", "Charlie")\nprintln(names.map { it.length })', correctAnswer: '[5, 3, 7]', explanation: 'map transforms each element. "Alice"=5, "Bob"=3, "Charlie"=7.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-co-5', languageId: 'kotlin', topicId: 'kt-collections', type: 'CODE_FIXING', question: 'Fix the map modification:', codeSnippet: 'val map = mutableMapOf("a" to 1)\nval newMap = map + ("b" to 2)\nmap["c"] = 3', correctAnswer: 'val map = mutableMapOf("a" to 1)\nmap["b"] = 2\nmap["c"] = 3\n// OR for immutable:\nval map2 = mapOf("a" to 1) + ("b" to 2) + ("c" to 3)', explanation: 'Use map.put() or []= on mutable maps. + creates new immutable map.', difficulty: 'EASY', points: 10 },

  // OOP
  { id: 'kt-oop-1', languageId: 'kotlin', topicId: 'kt-oop', type: 'MCQ', question: 'What is a data class in Kotlin?', codeSnippet: undefined, options: ['A class that holds data with auto-generated equals/hashCode/toString', 'A class for database operations', 'A JSON parser class', 'An abstract class'], correctAnswer: 'A', explanation: 'data class auto-generates equals(), hashCode(), toString(), copy(), componentN().', difficulty: 'EASY', points: 10 },
  { id: 'kt-oop-2', languageId: 'kotlin', topicId: 'kt-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'data class Point(val x: Int, val y: Int)\nval p1 = Point(1, 2)\nval p2 = Point(1, 2)\nprintln(p1 == p2)', correctAnswer: 'true', explanation: 'data class generates equals() based on properties, not reference.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-oop-3', languageId: 'kotlin', topicId: 'kt-oop', type: 'MCQ', question: 'What is a sealed class?', codeSnippet: undefined, options: ['A class that cannot be inherited', 'A restricted class hierarchy', 'An encrypted class', 'A final class'], correctAnswer: 'B', explanation: 'Sealed class restricts inheritance to defined subclasses in the same file.', difficulty: 'MEDIUM', points: 15 },
  { id: 'kt-oop-4', languageId: 'kotlin', topicId: 'kt-oop', type: 'CODE_FIXING', question: 'Fix the companion object usage:', codeSnippet: 'class Config {\n    static val URL = "https://api.com"\n}', correctAnswer: 'class Config {\n    companion object {\n        const val URL = "https://api.com"\n    }\n}', explanation: 'Kotlin uses companion object instead of static. Use const for compile-time constants.', difficulty: 'EASY', points: 10 },
  { id: 'kt-oop-5', languageId: 'kotlin', topicId: 'kt-oop', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'open class Shape {\n    open fun draw() = print("Shape")\n}\nclass Circle : Shape() {\n    override fun draw() = print("Circle")\n}\nval s: Shape = Circle()\ns.draw()', correctAnswer: 'Circle', explanation: 'Polymorphism: Circle\'s draw() is called despite Shape reference type.', difficulty: 'MEDIUM', points: 15 },

  // ── DART ───────────────────────────────────────────────
  { id: 'dart-v-1', languageId: 'dart', topicId: 'dart-variables', type: 'MCQ', question: 'What is the correct way to declare a variable in Dart?', codeSnippet: undefined, options: ['let x = 5;', 'var x = 5;', 'int x := 5;', 'dim x = 5;'], correctAnswer: 'B', explanation: 'Dart uses var for type-inferred variables, or explicit types like int x = 5;.', difficulty: 'EASY', points: 10 },
  { id: 'dart-v-2', languageId: 'dart', topicId: 'dart-variables', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'String? name = null;\nprint(name ?? "Guest");', correctAnswer: 'Guest', explanation: '?? (null-aware operator) returns right operand if left is null.', difficulty: 'EASY', points: 10 },
  { id: 'dart-v-3', languageId: 'dart', topicId: 'dart-variables', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'final list = [1, 2, 3];\nlist.add(4);\nprint(list);', correctAnswer: '[1, 2, 3, 4]', explanation: 'final prevents reassignment but allows modification of the object.', difficulty: 'EASY', points: 10 },
  { id: 'dart-v-4', languageId: 'dart', topicId: 'dart-variables', type: 'MCQ', question: 'What does late keyword mean in Dart?', codeSnippet: undefined, options: ['The variable is deprecated', 'The variable will be initialized later', 'The variable is lazy', 'The variable is constant'], correctAnswer: 'B', explanation: 'late tells Dart the variable will be initialized before use, enabling non-null types without immediate init.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-v-5', languageId: 'dart', topicId: 'dart-variables', type: 'CODE_FIXING', question: 'Fix the type error:', codeSnippet: 'int count = null;', correctAnswer: 'int? count = null;\n// or\nint count = 0;', explanation: 'Non-nullable int cannot be null. Use int? for nullable or provide initial value.', difficulty: 'EASY', points: 10 },

  // Control Flow
  { id: 'dart-cf-1', languageId: 'dart', topicId: 'dart-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'for (int i = 0; i < 3; i++) {\n  if (i == 1) continue;\n  print(i);\n}', correctAnswer: '0\n2', explanation: 'continue skips the rest of the loop body when i==1.', difficulty: 'EASY', points: 10 },
  { id: 'dart-cf-2', languageId: 'dart', topicId: 'dart-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'var result = switch(2) {\n  1 => "one",\n  2 => "two",\n  _ => "other",\n};\nprint(result);', correctAnswer: 'two', explanation: 'Dart 3 switch expression with arrow syntax. _ is default case.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-cf-3', languageId: 'dart', topicId: 'dart-control-flow', type: 'MCQ', question: 'What does cascade notation (..) do?', codeSnippet: undefined, options: ['Creates a new object', 'Chains multiple operations on same object', 'Creates a deep copy', 'Adds error handling'], correctAnswer: 'B', explanation: '.. allows chaining method calls on same object without intermediate variables.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-cf-4', languageId: 'dart', topicId: 'dart-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'final numbers = [1, 2, 3, 4, 5];\nfinal even = numbers.where((n) => n.isEven).toList();\nprint(even);', correctAnswer: '[2, 4]', explanation: 'where() filters elements. isEven is a built-in int property.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-cf-5', languageId: 'dart', topicId: 'dart-control-flow', type: 'CODE_FIXING', question: 'Fix the collection-if syntax:', codeSnippet: 'var items = [\n  "apple",\n  if (true) "banana",\n  for (var i in [1,2]) "item$i"\n];', correctAnswer: 'var includeBanana = true;\nvar items = [\n  "apple",\n  if (includeBanana) "banana",\n  for (var i in [1,2]) "item$i"\n];', explanation: 'collection-if and collection-for work in list/set/map literals. Use variable, not literal.', difficulty: 'MEDIUM', points: 15 },

  // Functions
  { id: 'dart-fn-1', languageId: 'dart', topicId: 'dart-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'void main() {\n  greet(name: "Dart");\n}\nvoid greet({String name = "World"}) {\n  print("Hello, $name!");\n}', correctAnswer: 'Hello, Dart!', explanation: 'Named parameters in curly braces with default value.', difficulty: 'EASY', points: 10 },
  { id: 'dart-fn-2', languageId: 'dart', topicId: 'dart-functions', type: 'MCQ', question: 'What is a Future in Dart?', codeSnippet: undefined, options: ['A value that will be available later', 'A loop construct', 'A data type', 'An array'], correctAnswer: 'A', explanation: 'Future represents a value or error that will be available asynchronously.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-fn-3', languageId: 'dart', topicId: 'dart-functions', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'List<int> nums = [3, 1, 4, 1, 5];\nnums.sort();\nprint(nums.first);\nprint(nums.last);', correctAnswer: '1\n5', explanation: 'sort() modifies in place. first and last are getters.', difficulty: 'EASY', points: 10 },
  { id: 'dart-fn-4', languageId: 'dart', topicId: 'dart-functions', type: 'CODE_FIXING', question: 'Fix the async function:', codeSnippet: 'String fetchData() {\n  final response = await http.get(Uri.parse("/api"));\n  return response.body;\n}', correctAnswer: 'Future<String> fetchData() async {\n  final response = await http.get(Uri.parse("/api"));\n  return response.body;\n}', explanation: 'Functions using await must be async and return Future<T> or void.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-fn-5', languageId: 'dart', topicId: 'dart-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'int Function(int, int) add = (a, b) => a + b;\nprint(add(3, 7));', correctAnswer: '10', explanation: 'Function type annotation with arrow function syntax.', difficulty: 'MEDIUM', points: 15 },

  // Collections
  { id: 'dart-co-1', languageId: 'dart', topicId: 'dart-collections', type: 'MCQ', question: 'Which is NOT a built-in Dart collection?', codeSnippet: undefined, options: ['List', 'Set', 'Map', 'Tuple'], correctAnswer: 'D', explanation: 'Dart has List, Set, and Map as built-in collections. No Tuple type.', difficulty: 'EASY', points: 10 },
  { id: 'dart-co-2', languageId: 'dart', topicId: 'dart-collections', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'var map = {"a": 1, "b": 2};\nmap["c"] = 3;\nprint(map.length);', correctAnswer: '3', explanation: 'Map literal can add entries with [] operator.', difficulty: 'EASY', points: 10 },
  { id: 'dart-co-3', languageId: 'dart', topicId: 'dart-collections', type: 'CODE_FIXING', question: 'Fix the spread collection:', codeSnippet: 'var list1 = [1, 2];\nvar list2 = [list1, 3, 4];', correctAnswer: 'var list1 = [1, 2];\nvar list2 = [...list1, 3, 4];', explanation: 'Use ... spread operator to flatten list1 into list2.', difficulty: 'EASY', points: 10 },

  // OOP
  { id: 'dart-oop-1', languageId: 'dart', topicId: 'dart-oop', type: 'MCQ', question: 'What is a mixin in Dart?', codeSnippet: undefined, options: ['A way to share code between classes', 'A type of variable', 'A loop', 'A constructor type'], correctAnswer: 'A', explanation: 'Mixins allow injecting methods/properties into classes without inheritance.', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-oop-2', languageId: 'dart', topicId: 'dart-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'class Animal {\n  String speak() => "...";\n}\nclass Cat extends Animal {\n  @override\n  String speak() => "Meow!";\n}\nvoid main() {\n  Animal a = Cat();\n  print(a.speak());\n}', correctAnswer: 'Meow!', explanation: '@override marks method overriding. Polymorphism calls Cat.speak().', difficulty: 'MEDIUM', points: 15 },
  { id: 'dart-oop-3', languageId: 'dart', topicId: 'dart-oop', type: 'CODE_FIXING', question: 'Fix the constructor:', codeSnippet: 'class User {\n  String name;\n  User(name) {\n    this.name = name;\n  }\n}', correctAnswer: 'class User {\n  final String name;\n  User(this.name);\n}', explanation: 'Use this.name in constructor parameter for automatic initialization. Use final for immutable fields.', difficulty: 'MEDIUM', points: 15 },

  // ── SWIFT ──────────────────────────────────────────────
  { id: 'swift-v-1', languageId: 'swift', topicId: 'swift-variables', type: 'MCQ', question: 'What keyword declares a constant in Swift?', codeSnippet: undefined, options: ['const', 'let', 'val', 'final'], correctAnswer: 'B', explanation: 'Swift uses let for constants and var for variables.', difficulty: 'EASY', points: 10 },
  { id: 'swift-v-2', languageId: 'swift', topicId: 'swift-variables', type: 'OUTPUT_PREDICTION', question: 'What is the type of this variable?', codeSnippet: 'let value = 3.14', correctAnswer: 'Double', explanation: 'Decimal literals default to Double in Swift. Use 3.14f for Float.', difficulty: 'EASY', points: 10 },
  { id: 'swift-v-3', languageId: 'swift', topicId: 'swift-variables', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'let name: String? = nil\nprint(name ?? "Unknown")', correctAnswer: 'Unknown', explanation: 'Nil-coalescing operator ?? provides default when optional is nil.', difficulty: 'EASY', points: 10 },
  { id: 'swift-v-4', languageId: 'swift', topicId: 'swift-variables', type: 'MCQ', question: 'What is type safety in Swift?', codeSnippet: undefined, options: ['Code runs faster', 'Prevents mixing incompatible types', 'Enables OOP', 'Manages memory'], correctAnswer: 'B', explanation: 'Swift is type-safe: you cannot pass Int where String is expected.', difficulty: 'EASY', points: 10 },
  { id: 'swift-v-5', languageId: 'swift', topicId: 'swift-variables', type: 'CODE_FIXING', question: 'Fix the optional unwrapping:', codeSnippet: 'let text: String? = "Hello"\nprint(text.count)', correctAnswer: 'let text: String? = "Hello"\nif let unwrapped = text {\n    print(unwrapped.count)\n}', explanation: 'Cannot use optional directly. Use if let/guard let for safe unwrapping.', difficulty: 'EASY', points: 10 },

  // Control Flow
  { id: 'swift-cf-1', languageId: 'swift', topicId: 'swift-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'for i in 1...5 {\n    if i == 3 { continue }\n    print(i, terminator: " ")\n}', correctAnswer: '1 2 4 5', explanation: '1...5 is closed range (1 to 5). continue skips 3.', difficulty: 'EASY', points: 10 },
  { id: 'swift-cf-2', languageId: 'swift', topicId: 'swift-control-flow', type: 'MCQ', question: 'What is the difference between ..< and ... in Swift?', codeSnippet: undefined, options: ['..< is half-open, ... is closed range', 'They are the same', '... is exclusive, ..< is inclusive', '..< is for arrays only'], correctAnswer: 'A', explanation: '1..<5 = [1,2,3,4], 1...5 = [1,2,3,4,5].', difficulty: 'EASY', points: 10 },
  { id: 'swift-cf-3', languageId: 'swift', topicId: 'swift-control-flow', type: 'OUTPUT_PREDICTION', question: 'What is the result?', codeSnippet: 'let scores = [85, 92, 78, 95, 88]\nlet highScores = scores.filter { $0 >= 90 }\nprint(highScores)', correctAnswer: '[92, 95]', explanation: 'filter with closure $0 (shorthand for first parameter) keeps scores >= 90.', difficulty: 'MEDIUM', points: 15 },
  { id: 'swift-cf-4', languageId: 'swift', topicId: 'swift-control-flow', type: 'CODE_FIXING', question: 'Fix the switch statement:', codeSnippet: 'let grade = "B"\nswitch grade {\ncase "A": print("Excellent")\ncase "B": print("Good")\n}', correctAnswer: 'let grade = "B"\nswitch grade {\ncase "A": print("Excellent")\ncase "B": print("Good")\ndefault: print("Other")\n}', explanation: 'Swift switch must be exhaustive. Add default case.', difficulty: 'EASY', points: 10 },

  // Functions
  { id: 'swift-fn-1', languageId: 'swift', topicId: 'swift-functions', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'func greet(_ name: String = "World") -> String {\n    return "Hello, \\(name)!"\n}\nprint(greet())\nprint(greet("Swift"))', correctAnswer: 'Hello, World!\nHello, Swift!', explanation: '_ omits argument label. Default parameter used when no argument provided.', difficulty: 'EASY', points: 10 },
  { id: 'swift-fn-2', languageId: 'swift', topicId: 'swift-functions', type: 'MCQ', question: 'What is a closure in Swift?', codeSnippet: undefined, options: ['Self-contained block of code that can be passed around', 'A class constructor', 'A type alias', 'An import statement'], correctAnswer: 'A', explanation: 'Closures are self-contained code blocks like { (params) -> return in body }.', difficulty: 'MEDIUM', points: 15 },
  { id: 'swift-fn-3', languageId: 'swift', topicId: 'swift-functions', type: 'OUTPUT_PREDICTION', question: 'What is printed?', codeSnippet: 'func calculate(_ a: Int, _ b: Int, operation: (Int, Int) -> Int) -> Int {\n    return operation(a, b)\n}\nlet result = calculate(10, 5) { $0 * $1 }\nprint(result)', correctAnswer: '50', explanation: 'Trailing closure syntax. $0=10, $1=5, operation multiplies: 50.', difficulty: 'HARD', points: 20 },

  // Collections
  { id: 'swift-co-1', languageId: 'swift', topicId: 'swift-collections', type: 'MCQ', question: 'What is the difference between Array and Set in Swift?', codeSnippet: undefined, options: ['Array is ordered with duplicates, Set is unordered unique', 'No difference', 'Array is faster', 'Set is ordered'], correctAnswer: 'A', explanation: 'Array: ordered, allows duplicates. Set: unordered, unique elements only.', difficulty: 'EASY', points: 10 },
  { id: 'swift-co-2', languageId: 'swift', topicId: 'swift-collections', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'var dict = ["a": 1, "b": 2]\ndict["c"] = 3\ndict["a"] = nil\nprint(dict)', correctAnswer: '["b": 2, "c": 3]', explanation: 'Setting key to nil removes it from dictionary in Swift.', difficulty: 'MEDIUM', points: 15 },
  { id: 'swift-co-3', languageId: 'swift', topicId: 'swift-collections', type: 'CODE_FIXING', question: 'Fix the array modification in a for loop:', codeSnippet: 'var nums = [1, 2, 3, 4, 5]\nfor num in nums {\n    if num == 3 { nums.remove(at: 2) }\n}\nprint(nums)', correctAnswer: 'var nums = [1, 2, 3, 4, 5]\nnums.removeAll { $0 == 3 }\nprint(nums)', explanation: 'Cannot modify array while iterating. Use removeAll(where:) instead.', difficulty: 'MEDIUM', points: 15 },

  // OOP
  { id: 'swift-oop-1', languageId: 'swift', topicId: 'swift-oop', type: 'MCQ', question: 'What is a protocol in Swift?', codeSnippet: undefined, options: ['A class type', 'A blueprint of methods/properties', 'A variable type', 'A loop construct'], correctAnswer: 'B', explanation: 'Protocol defines a blueprint of methods and properties (similar to interface in Java).', difficulty: 'MEDIUM', points: 15 },
  { id: 'swift-oop-2', languageId: 'swift', topicId: 'swift-oop', type: 'OUTPUT_PREDICTION', question: 'What is the output?', codeSnippet: 'class Vehicle {\n    var speed = 0\n}\nclass Car: Vehicle {\n    override var speed: Int {\n        get { return super.speed }\n        set { super.speed = newValue * 2 }\n    }\n}\nlet car = Car()\ncar.speed = 50\nprint(car.speed)', correctAnswer: '100', explanation: 'Property observer doubles the value. Setting 50 stores 100 via setter.', difficulty: 'HARD', points: 20 },
  { id: 'swift-oop-3', languageId: 'swift', topicId: 'swift-oop', type: 'CODE_FIXING', question: 'Fix the struct mutation:', codeSnippet: 'struct Point {\n    var x: Int\n    var y: Int\n    mutating func move(dx: Int, dy: Int) {\n        x += dx\n        y += dy\n    }\n}\nlet p = Point(x: 0, y: 0)\np.move(dx: 1, dy: 1)', correctAnswer: 'struct Point {\n    var x: Int\n    var y: Int\n    mutating func move(dx: Int, dy: Int) {\n        x += dx\n        y += dy\n    }\n}\nvar p = Point(x: 0, y: 0)\np.move(dx: 1, dy: 1)', explanation: 'mutating methods require var, not let. Structs are value types.', difficulty: 'MEDIUM', points: 15 },
];

// ═══════════════════════════════════════════════════════
// Languages Metadata
// ═══════════════════════════════════════════════════════

export const LANGUAGES: ProgrammingLanguage[] = [
  { id: 'python', name: 'Python', icon: '🐍', color: '#3776AB', gradient: 'from-blue-500 to-yellow-400', description: 'The most popular language for beginners and experts. Great for AI, web, and data science.', difficulty: 'EASY', topics: [
    { id: 'py-variables', name: 'Variables & Data Types', icon: '📦', description: 'Learn Python variables, numbers, strings, and type conversion', difficulty: 'EASY', questionCount: 5 },
    { id: 'py-control-flow', name: 'Control Flow', icon: '🔀', description: 'If statements, loops, and comprehensions', difficulty: 'EASY', questionCount: 5 },
    { id: 'py-functions', name: 'Functions', icon: '⚙️', description: 'Defining functions, parameters, lambda, and recursion', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'py-lists', name: 'Lists & Collections', icon: '📋', description: 'Lists, tuples, sets, dictionaries, and their methods', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'py-oop', name: 'Object-Oriented Programming', icon: '🏗️', description: 'Classes, inheritance, encapsulation, and polymorphism', difficulty: 'HARD', questionCount: 5 },
  ]},
  { id: 'java', name: 'Java', icon: '☕', color: '#ED8B00', gradient: 'from-orange-500 to-red-500', description: 'Enterprise-grade language for Android, web services, and large-scale systems.', difficulty: 'MEDIUM', topics: [
    { id: 'java-variables', name: 'Variables & Data Types', icon: '📦', description: 'Java primitive types, references, and type casting', difficulty: 'EASY', questionCount: 5 },
    { id: 'java-control-flow', name: 'Control Flow', icon: '🔀', description: 'If-else, switch, for, while, and enhanced loops', difficulty: 'EASY', questionCount: 5 },
    { id: 'java-functions', name: 'Methods', icon: '⚙️', description: 'Method declaration, overloading, recursion, and varargs', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'java-collections', name: 'Arrays & Collections', icon: '📋', description: 'Arrays, ArrayList, HashMap, and Set', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'java-oop', name: 'Object-Oriented Programming', icon: '🏗️', description: 'Classes, inheritance, interfaces, and polymorphism', difficulty: 'HARD', questionCount: 5 },
  ]},
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: '#F7DF1E', gradient: 'from-yellow-400 to-black', description: 'The language of the web. Powers frontend, backend (Node.js), and mobile apps.', difficulty: 'MEDIUM', topics: [
    { id: 'js-variables', name: 'Variables & Data Types', icon: '📦', description: 'let, const, var, type coercion, and primitive types', difficulty: 'EASY', questionCount: 5 },
    { id: 'js-control-flow', name: 'Control Flow & Array Methods', icon: '🔀', description: 'Callbacks, promises, map, filter, reduce', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'js-functions', name: 'Functions & Closures', icon: '⚙️', description: 'Arrow functions, closures, hoisting, and this binding', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'js-arrays', name: 'Arrays & Objects', icon: '📋', description: 'Array methods, object destructuring, spread operator', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'js-oop', name: 'OOP & Async Programming', icon: '🏗️', description: 'ES6 classes, prototypes, Promises, async/await', difficulty: 'HARD', questionCount: 5 },
  ]},
  { id: 'kotlin', name: 'Kotlin', icon: '🟣', color: '#7F52FF', gradient: 'from-purple-500 to-orange-400', description: 'Modern language for Android development. Concise, safe, and interoperable with Java.', difficulty: 'MEDIUM', topics: [
    { id: 'kt-variables', name: 'Variables & Null Safety', icon: '📦', description: 'val, var, nullable types, and safe calls', difficulty: 'EASY', questionCount: 5 },
    { id: 'kt-control-flow', name: 'Control Flow', icon: '🔀', description: 'when expression, ranges, and functional loops', difficulty: 'EASY', questionCount: 5 },
    { id: 'kt-functions', name: 'Functions & Lambdas', icon: '⚙️', description: 'Extension functions, higher-order functions, inline', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'kt-collections', name: 'Collections', icon: '📋', description: 'List, Set, Map, and collection operations', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'kt-oop', name: 'OOP & Advanced', icon: '🏗️', description: 'Data classes, sealed classes, companion objects', difficulty: 'HARD', questionCount: 5 },
  ]},
  { id: 'dart', name: 'Dart', icon: '🎯', color: '#0175C2', gradient: 'from-cyan-500 to-blue-600', description: 'Client-optimized language for Flutter apps on mobile, web, and desktop.', difficulty: 'MEDIUM', topics: [
    { id: 'dart-variables', name: 'Variables & Types', icon: '📦', description: 'var, final, const, null safety, and late keyword', difficulty: 'EASY', questionCount: 5 },
    { id: 'dart-control-flow', name: 'Control Flow', icon: '🔀', description: 'Switch expressions, cascade, collection operators', difficulty: 'EASY', questionCount: 5 },
    { id: 'dart-functions', name: 'Functions & Async', icon: '⚙️', description: 'Named params, Future, async/await, generators', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'dart-collections', name: 'Collections', icon: '📋', description: 'List, Set, Map, and collection methods', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'dart-oop', name: 'OOP & Mixins', icon: '🏗️', description: 'Constructors, mixins, extensions, and abstract classes', difficulty: 'HARD', questionCount: 5 },
  ]},
  { id: 'swift', name: 'Swift', icon: '🍎', color: '#FA7343', gradient: 'from-orange-500 to-red-600', description: 'Powerful and intuitive language for iOS, macOS, watchOS, and tvOS development.', difficulty: 'MEDIUM', topics: [
    { id: 'swift-variables', name: 'Variables & Optionals', icon: '📦', description: 'let, var, optionals, and type inference', difficulty: 'EASY', questionCount: 5 },
    { id: 'swift-control-flow', name: 'Control Flow', icon: '🔀', description: 'Switch, guard, ranges, and where clauses', difficulty: 'EASY', questionCount: 5 },
    { id: 'swift-functions', name: 'Functions & Closures', icon: '⚙️', description: 'Parameters, closures, trailing closures, generics', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'swift-collections', name: 'Collections', icon: '📋', description: 'Arrays, dictionaries, sets, and higher-order functions', difficulty: 'MEDIUM', questionCount: 5 },
    { id: 'swift-oop', name: 'OOP & Protocols', icon: '🏗️', description: 'Classes, structs, protocols, and extensions', difficulty: 'HARD', questionCount: 5 },
  ]},
];

// ═══════════════════════════════════════════════════════
// Mini Game Data
// ═══════════════════════════════════════════════════════

export const BUG_FINDER_CHALLENGES: BugFinderData[] = [
  { id: 'bf-1', languageId: 'python', title: 'Off-by-one error', code: 'def factorial(n):\n    result = 1\n    for i in range(1, n):\n        result *= i\n    return result', bugLine: 3, bugDescription: 'range(1, n) should be range(1, n+1) to include n', fixedCode: 'def factorial(n):\n    result = 1\n    for i in range(1, n+1):\n        result *= i\n    return result', difficulty: 'EASY', points: 15 },
  { id: 'bf-2', languageId: 'python', title: 'Mutable default argument', code: 'def add_item(item, lst=[]):\n    lst.append(item)\n    return lst', bugLine: 1, bugDescription: 'Mutable default argument is shared across calls', fixedCode: 'def add_item(item, lst=None):\n    if lst is None:\n        lst = []\n    lst.append(item)\n    return lst', difficulty: 'MEDIUM', points: 25 },
  { id: 'bf-3', languageId: 'java', title: 'String comparison bug', code: 'String a = "hello";\nString b = new String("hello");\nif (a == b) {\n    System.out.println("Equal");\n}', bugLine: 3, bugDescription: 'Use .equals() for String comparison, not ==', fixedCode: 'String a = "hello";\nString b = new String("hello");\nif (a.equals(b)) {\n    System.out.println("Equal");\n}', difficulty: 'EASY', points: 15 },
  { id: 'bf-4', languageId: 'java', title: 'Integer overflow', code: 'int result = 1;\nfor (int i = 1; i <= 20; i++) {\n    result *= i;\n}\nSystem.out.println(result);', bugLine: 1, bugDescription: 'int overflows for large factorials. Use long or BigInteger', fixedCode: 'long result = 1;\nfor (int i = 1; i <= 20; i++) {\n    result *= i;\n}\nSystem.out.println(result);', difficulty: 'MEDIUM', points: 25 },
  { id: 'bf-5', languageId: 'javascript', title: 'Async/Await in loop', code: 'async function processAll(urls) {\n  for (const url of urls) {\n    await fetch(url);\n  }\n}', bugLine: 3, bugDescription: 'Sequential processing. Use Promise.all for parallel', fixedCode: 'async function processAll(urls) {\n  await Promise.all(urls.map(url => fetch(url)));\n}', difficulty: 'MEDIUM', points: 25 },
  { id: 'bf-6', languageId: 'javascript', title: 'Closure in loop', code: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}', bugLine: 1, bugDescription: 'var is function-scoped. All timeouts print 3. Use let', fixedCode: 'for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100);\n}', difficulty: 'MEDIUM', points: 25 },
  { id: 'bf-7', languageId: 'kotlin', title: 'NullPointerException', code: 'val name: String? = null\nval length = name.length', bugLine: 2, bugDescription: 'Cannot access length on nullable type without safe call', fixedCode: 'val name: String? = null\nval length = name?.length ?: 0', difficulty: 'EASY', points: 15 },
  { id: 'bf-8', languageId: 'dart', title: 'Missing await', code: 'Future<String> getData() async {\n  final response = http.get(Uri.parse("/api"));\n  return response.body;\n}', bugLine: 2, bugDescription: 'Missing await before http.get() call', fixedCode: 'Future<String> getData() async {\n  final response = await http.get(Uri.parse("/api"));\n  return response.body;\n}', difficulty: 'EASY', points: 15 },
  { id: 'bf-9', languageId: 'swift', title: 'Struct mutation', code: 'struct Point {\n    var x: Int\n    mutating func move() { x += 1 }\n}\nlet p = Point(x: 0)\np.move()', bugLine: 5, bugDescription: 'Cannot call mutating method on let constant. Use var', fixedCode: 'struct Point {\n    var x: Int\n    mutating func move() { x += 1 }\n}\nvar p = Point(x: 0)\np.move()', difficulty: 'EASY', points: 15 },
  { id: 'bf-10', languageId: 'python', title: 'Infinite recursion', code: 'def fibonacci(n):\n    return fibonacci(n-1) + fibonacci(n-2)', bugLine: 2, bugDescription: 'Missing base case causes infinite recursion', fixedCode: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)', difficulty: 'EASY', points: 15 },
];

export const CODE_PUZZLES: CodePuzzleData[] = [
  { id: 'cp-1', languageId: 'python', title: 'Bubble Sort', description: 'Arrange the lines to implement bubble sort', shuffledLines: ['def bubble_sort(arr):', '    n = len(arr)', '    for i in range(n):', '        for j in range(0, n-i-1):', '            if arr[j] > arr[j+1]:', '                arr[j], arr[j+1] = arr[j+1], arr[j]', '    return arr'], correctOrder: ['def bubble_sort(arr):', '    n = len(arr)', '    for i in range(n):', '        for j in range(0, n-i-1):', '            if arr[j] > arr[j+1]:', '                arr[j], arr[j+1] = arr[j+1], arr[j]', '    return arr'], difficulty: 'EASY', points: 20 },
  { id: 'cp-2', languageId: 'python', title: 'Binary Search', description: 'Arrange the lines to implement binary search', shuffledLines: ['def binary_search(arr, target):', '    left, right = 0, len(arr) - 1', '    while left <= right:', '        mid = (left + right) // 2', '        if arr[mid] == target:', '            return mid', '        elif arr[mid] < target:', '            left = mid + 1', '        else:', '            right = mid - 1', '    return -1'], correctOrder: ['def binary_search(arr, target):', '    left, right = 0, len(arr) - 1', '    while left <= right:', '        mid = (left + right) // 2', '        if arr[mid] == target:', '            return mid', '        elif arr[mid] < target:', '            left = mid + 1', '        else:', '            right = mid - 1', '    return -1'], difficulty: 'MEDIUM', points: 30 },
  { id: 'cp-3', languageId: 'java', title: 'Reverse a String', description: 'Arrange the lines to reverse a string', shuffledLines: ['public static String reverse(String s) {', '    StringBuilder sb = new StringBuilder();', '    for (int i = s.length() - 1; i >= 0; i--) {', '        sb.append(s.charAt(i));', '    }', '    return sb.toString();', '}'], correctOrder: ['public static String reverse(String s) {', '    StringBuilder sb = new StringBuilder();', '    for (int i = s.length() - 1; i >= 0; i--) {', '        sb.append(s.charAt(i));', '    }', '    return sb.toString();', '}'], difficulty: 'EASY', points: 20 },
  { id: 'cp-4', languageId: 'javascript', title: 'Debounce Function', description: 'Arrange the lines to create a debounce function', shuffledLines: ['function debounce(fn, delay) {', '    let timer;', '    return function(...args) {', '        clearTimeout(timer);', '        timer = setTimeout(() => {', '            fn.apply(this, args);', '        }, delay);', '    };', '}'], correctOrder: ['function debounce(fn, delay) {', '    let timer;', '    return function(...args) {', '        clearTimeout(timer);', '        timer = setTimeout(() => {', '            fn.apply(this, args);', '        }, delay);', '    };', '}'], difficulty: 'MEDIUM', points: 30 },
  { id: 'cp-5', languageId: 'javascript', title: 'Flatten Array', description: 'Arrange the lines to implement array flattening', shuffledLines: ['function flatten(arr) {', '    return arr.reduce((acc, item) => {', '        if (Array.isArray(item)) {', '            return acc.concat(flatten(item));', '        }', '        return acc.concat(item);', '    }, []);', '}'], correctOrder: ['function flatten(arr) {', '    return arr.reduce((acc, item) => {', '        if (Array.isArray(item)) {', '            return acc.concat(flatten(item));', '        }', '        return acc.concat(item);', '    }, []);', '}'], difficulty: 'MEDIUM', points: 30 },
  { id: 'cp-6', languageId: 'kotlin', title: 'Singleton Pattern', description: 'Arrange the lines to implement a singleton', shuffledLines: ['object Database {', '    private var instance: Database? = null', '    fun getInstance(): Database {', '        if (instance == null) {', '            instance = Database()', '        }', '        return instance!!', '    }', '}'], correctOrder: ['object Database {', '    private var instance: Database? = null', '    fun getInstance(): Database {', '        if (instance == null) {', '            instance = Database()', '        }', '        return instance!!', '    }', '}'], difficulty: 'MEDIUM', points: 30 },
  { id: 'cp-7', languageId: 'swift', title: 'Generic Stack', description: 'Arrange the lines to implement a generic stack', shuffledLines: ['struct Stack<Element> {', '    private var items: [Element] = []', '    mutating func push(_ item: Element) {', '        items.append(item)', '    }', '    mutating func pop() -> Element? {', '        return items.popLast()', '    }', '}'], correctOrder: ['struct Stack<Element> {', '    private var items: [Element] = []', '    mutating func push(_ item: Element) {', '        items.append(item)', '    }', '    mutating func pop() -> Element? {', '        return items.popLast()', '    }', '}'], difficulty: 'MEDIUM', points: 30 },
  { id: 'cp-8', languageId: 'dart', title: 'Counter Widget', description: 'Arrange the lines for a Flutter counter widget', shuffledLines: ['class CounterWidget extends StatefulWidget {', '    @override', '    State<StatefulWidget> createState() => _CounterState()', '}', 'class _CounterState extends State<CounterWidget> {', '    int count = 0;', '    @override', '    Widget build(BuildContext context) {', '        return Text("$count");', '    }', '}'], correctOrder: ['class CounterWidget extends StatefulWidget {', '    @override', '    State<StatefulWidget> createState() => _CounterState()', '}', 'class _CounterState extends State<CounterWidget> {', '    int count = 0;', '    @override', '    Widget build(BuildContext context) {', '        return Text("$count");', '    }', '}'], difficulty: 'MEDIUM', points: 30 },
];

export const SYNTAX_MATCH_PAIRS: SyntaxMatchPair[] = [
  { id: 'sm-1', concept: 'Print to console', syntax: 'print("Hello")', languageId: 'python' },
  { id: 'sm-2', concept: 'Print to console', syntax: 'System.out.println("Hello")', languageId: 'java' },
  { id: 'sm-3', concept: 'Print to console', syntax: 'console.log("Hello")', languageId: 'javascript' },
  { id: 'sm-4', concept: 'Print to console', syntax: 'println("Hello")', languageId: 'kotlin' },
  { id: 'sm-5', concept: 'Print to console', syntax: 'print("Hello")', languageId: 'dart' },
  { id: 'sm-6', concept: 'Print to console', syntax: 'print("Hello")', languageId: 'swift' },
  { id: 'sm-7', concept: 'Define constant', syntax: 'const x = 5', languageId: 'python' },
  { id: 'sm-8', concept: 'Define constant', syntax: 'final int X = 5', languageId: 'java' },
  { id: 'sm-9', concept: 'Define constant', syntax: 'const x = 5', languageId: 'javascript' },
  { id: 'sm-10', concept: 'Define constant', syntax: 'val x = 5', languageId: 'kotlin' },
  { id: 'sm-11', concept: 'Define constant', syntax: 'const x = 5', languageId: 'dart' },
  { id: 'sm-12', concept: 'Define constant', syntax: 'let x = 5', languageId: 'swift' },
  { id: 'sm-13', concept: 'For loop (1 to 5)', syntax: 'for i in range(1, 6):', languageId: 'python' },
  { id: 'sm-14', concept: 'For loop (1 to 5)', syntax: 'for (int i = 1; i <= 5; i++)', languageId: 'java' },
  { id: 'sm-15', concept: 'For loop (1 to 5)', syntax: 'for (let i = 1; i <= 5; i++)', languageId: 'javascript' },
  { id: 'sm-16', concept: 'For loop (1 to 5)', syntax: 'for (i in 1..5)', languageId: 'kotlin' },
  { id: 'sm-17', concept: 'For loop (1 to 5)', syntax: 'for (var i = 1; i <= 5; i++)', languageId: 'dart' },
  { id: 'sm-18', concept: 'For loop (1 to 5)', syntax: 'for i in 1...5', languageId: 'swift' },
  { id: 'sm-19', concept: 'Function declaration', syntax: 'def func_name():', languageId: 'python' },
  { id: 'sm-20', concept: 'Function declaration', syntax: 'void funcName() {}', languageId: 'java' },
  { id: 'sm-21', concept: 'Function declaration', syntax: 'function funcName() {}', languageId: 'javascript' },
  { id: 'sm-22', concept: 'Function declaration', syntax: 'fun funcName() {}', languageId: 'kotlin' },
  { id: 'sm-23', concept: 'Function declaration', syntax: 'void funcName() {}', languageId: 'dart' },
  { id: 'sm-24', concept: 'Function declaration', syntax: 'func funcName() {}', languageId: 'swift' },
];

// ═══════════════════════════════════════════════════════
// Daily Challenges
// ═══════════════════════════════════════════════════════

export const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'dc-1', title: 'Python Fundamentals', description: 'Test your Python basics with this mixed challenge!', languageId: 'python', difficulty: 'MEDIUM', points: 50, questions: allQuestions.filter(q => q.languageId === 'python').slice(0, 5) },
  { id: 'dc-2', title: 'Java Essentials', description: 'Prove your Java knowledge!', languageId: 'java', difficulty: 'MEDIUM', points: 50, questions: allQuestions.filter(q => q.languageId === 'java').slice(0, 5) },
  { id: 'dc-3', title: 'JavaScript Mastery', description: 'Show your JS skills!', languageId: 'javascript', difficulty: 'HARD', points: 75, questions: allQuestions.filter(q => q.languageId === 'javascript').slice(0, 5) },
  { id: 'dc-4', title: 'Kotlin Challenge', description: 'Android devs, this is for you!', languageId: 'kotlin', difficulty: 'MEDIUM', points: 50, questions: allQuestions.filter(q => q.languageId === 'kotlin').slice(0, 5) },
  { id: 'dc-5', title: 'Dart & Flutter', description: 'Cross-platform challenge!', languageId: 'dart', difficulty: 'MEDIUM', points: 50, questions: allQuestions.filter(q => q.languageId === 'dart').slice(0, 5) },
  { id: 'dc-6', title: 'Swift Coding', description: 'iOS developer challenge!', languageId: 'swift', difficulty: 'MEDIUM', points: 50, questions: allQuestions.filter(q => q.languageId === 'swift').slice(0, 5) },
  { id: 'dc-7', title: 'Multi-Language Mix', description: 'Questions from all languages!', languageId: 'python', difficulty: 'HARD', points: 100, questions: allQuestions.slice(0, 8) },
];

// ═══════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════

export function getLanguageById(id: string): ProgrammingLanguage | undefined {
  return LANGUAGES.find(l => l.id === id);
}

export function getTopicById(langId: string, topicId: string): Topic | undefined {
  const lang = getLanguageById(langId);
  return lang?.topics.find(t => t.id === topicId);
}

export function getRandomQuestions(langId: string, topicId?: string, count: number = 5, difficulty?: Difficulty): Question[] {
  let pool = allQuestions.filter(q => q.languageId === langId);
  if (topicId) pool = pool.filter(q => q.topicId === topicId);
  if (difficulty) pool = pool.filter(q => q.difficulty === difficulty);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getQuestionsByDifficulty(langId: string, difficulty: Difficulty): Question[] {
  return allQuestions.filter(q => q.languageId === langId && q.difficulty === difficulty);
}

export function getAllQuestions(langId: string): Question[] {
  return allQuestions.filter(q => q.languageId === langId);
}

export function getLevelForXP(xp: number): LevelThreshold {
  let current = LEVEL_THRESHOLDS[0];
  for (const level of LEVEL_THRESHOLDS) {
    if (xp >= level.xpRequired) current = level;
    else break;
  }
  return current;
}

export function getNextLevel(currentXP: number): { level: number; xpRequired: number; xpNeeded: number } {
  const nextThreshold = LEVEL_THRESHOLDS.find(l => l.xpRequired > currentXP);
  if (!nextThreshold) return { level: 20, xpRequired: 35000, xpNeeded: 0 };
  return { level: nextThreshold.level, xpRequired: nextThreshold.xpRequired, xpNeeded: nextThreshold.xpRequired - currentXP };
}

export function getTodayChallenge(): DailyChallenge {
  const dayIndex = new Date().getDay();
  return DAILY_CHALLENGES[dayIndex % DAILY_CHALLENGES.length];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Mock leaderboard data
export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'ProCoder99', level: 18, xp: 28500, avatar: '🦊', battlesWon: 142, accuracy: 94 },
  { rank: 2, name: 'CodeNinja', level: 16, xp: 22000, avatar: '🐉', battlesWon: 128, accuracy: 91 },
  { rank: 3, name: 'ByteMaster', level: 15, xp: 19500, avatar: '🦁', battlesWon: 115, accuracy: 89 },
  { rank: 4, name: 'StackOverflow', level: 14, xp: 17200, avatar: '🐼', battlesWon: 98, accuracy: 87 },
  { rank: 5, name: 'AlgoQueen', level: 13, xp: 15800, avatar: '🦄', battlesWon: 92, accuracy: 86 },
  { rank: 6, name: 'DevWizard', level: 12, xp: 14100, avatar: '🐸', battlesWon: 85, accuracy: 84 },
  { rank: 7, name: 'HackHero', level: 11, xp: 12500, avatar: '🦅', battlesWon: 78, accuracy: 82 },
  { rank: 8, name: 'BugSlayer', level: 10, xp: 10800, avatar: '🐝', battlesWon: 71, accuracy: 80 },
  { rank: 9, name: 'PixelCoder', level: 9, xp: 9200, avatar: '🦋', battlesWon: 65, accuracy: 78 },
  { rank: 10, name: 'LogicLord', level: 8, xp: 7800, avatar: '🐙', battlesWon: 58, accuracy: 76 },
];

export const AVATARS = ['🦊', '🐉', '🦁', '🐼', '🦄', '🐸', '🦅', '🐝', '🦋', '🐙', '🎭', '👾', '🤖', '🧙', '🧛', '🦹', '🕵️', '🥷', '🧑‍💻', '👨‍💻', '👩‍💻'];
