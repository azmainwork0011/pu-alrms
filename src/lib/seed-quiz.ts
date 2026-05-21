import { db } from '@/lib/db';

// Question data for 3 subjects: CS, EE, BA
// Each has 3 categories with 8-10 questions

interface SeedQuestion {
  question: string;
  questionType: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
  difficulty: string;
  points: number;
}

interface SeedCategory {
  name: string;
  department: string;
  icon: string;
  description: string;
  difficulty: string;
  questions: SeedQuestion[];
}

const SEED_DATA: SeedCategory[] = [
  // ═══════════════════════════════════════════════════════════
  // COMPUTER SCIENCE
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Programming Fundamentals',
    department: 'CS',
    icon: '💻',
    description: 'Variables, loops, functions, and core programming concepts',
    difficulty: 'EASY',
    questions: [
      { question: 'Which keyword is used to declare a constant in JavaScript?', questionType: 'MCQ', optionA: 'var', optionB: 'let', optionC: 'const', optionD: 'static', correctOption: 'C', explanation: 'The const keyword declares a block-scoped constant that cannot be reassigned.', difficulty: 'EASY', points: 10 },
      { question: 'What is the time complexity of binary search?', questionType: 'MCQ', optionA: 'O(n)', optionB: 'O(log n)', optionC: 'O(n²)', optionD: 'O(1)', correctOption: 'B', explanation: 'Binary search halves the search space each step, giving O(log n) time complexity.', difficulty: 'EASY', points: 10 },
      { question: 'In Python, what does len() return?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'length', explanation: 'len() returns the number of items in an object (length).', difficulty: 'EASY', points: 10 },
      { question: 'A stack follows which data access principle?', questionType: 'MCQ', optionA: 'FIFO', optionB: 'LIFO', optionC: 'Random', optionD: 'Priority', correctOption: 'B', explanation: 'Stack follows Last In, First Out (LIFO) — the last element added is the first removed.', difficulty: 'EASY', points: 10 },
      { question: 'Which loop is guaranteed to execute at least once?', questionType: 'MCQ', optionA: 'for loop', optionB: 'while loop', optionC: 'do-while loop', optionD: 'foreach loop', correctOption: 'C', explanation: 'A do-while loop checks the condition after execution, so it runs at least once.', difficulty: 'EASY', points: 10 },
      { question: 'Recursion requires a base case to prevent infinite loops.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Every recursive function needs a base case that stops the recursion.', difficulty: 'EASY', points: 10 },
      { question: 'What does OOP stand for?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Object Oriented Programming', explanation: 'OOP stands for Object-Oriented Programming.', difficulty: 'EASY', points: 10 },
      { question: 'Which symbol is used for single-line comments in JavaScript?', questionType: 'MCQ', optionA: '/* */', optionB: '//', optionC: '#', optionD: '--', correctOption: 'B', explanation: 'Double forward slashes (//) create single-line comments in JavaScript.', difficulty: 'EASY', points: 10 },
      { question: 'An array index starts at 0 in most programming languages.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'In C, C++, Java, Python, JavaScript and most languages, array indexing starts at 0.', difficulty: 'EASY', points: 10 },
    ],
  },
  {
    name: 'Data Structures & Algorithms',
    department: 'CS',
    icon: '🌳',
    description: 'Trees, graphs, sorting, and algorithmic thinking',
    difficulty: 'MEDIUM',
    questions: [
      { question: 'What is the worst-case time complexity of Quick Sort?', questionType: 'MCQ', optionA: 'O(n log n)', optionB: 'O(n)', optionC: 'O(n²)', optionD: 'O(log n)', correctOption: 'C', explanation: 'Quick Sort degrades to O(n²) when the pivot selection is consistently bad (already sorted data).', difficulty: 'MEDIUM', points: 15 },
      { question: 'Which data structure uses FIFO ordering?', questionType: 'MCQ', optionA: 'Stack', optionB: 'Queue', optionC: 'Tree', optionD: 'Hash Table', correctOption: 'B', explanation: 'A Queue follows First In, First Out (FIFO) ordering.', difficulty: 'MEDIUM', points: 15 },
      { question: 'In a binary search tree, the left child is always less than the parent.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'In a BST, left children are smaller and right children are larger than their parent.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is the height of a balanced binary tree with n nodes?', questionType: 'MCQ', optionA: 'O(n)', optionB: 'O(n²)', optionC: 'O(log n)', optionD: 'O(1)', correctOption: 'C', explanation: 'A balanced BST keeps height at O(log n), enabling efficient O(log n) lookups.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What does BFS stand for?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Breadth First Search', explanation: 'BFS stands for Breadth-First Search, which explores nodes level by level.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Which sorting algorithm has the best average-case performance?', questionType: 'MCQ', optionA: 'Bubble Sort', optionB: 'Selection Sort', optionC: 'Merge Sort', optionD: 'Insertion Sort', correctOption: 'C', explanation: 'Merge Sort consistently achieves O(n log n) in all cases, unlike Quick Sort.', difficulty: 'MEDIUM', points: 15 },
      { question: 'A hash table collision occurs when two keys map to the same index.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Collisions happen when the hash function produces the same index for different keys.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What data structure would you use to implement a LRU cache?', questionType: 'MCQ', optionA: 'Array', optionB: 'HashMap + Doubly Linked List', optionC: 'Stack', optionD: 'Binary Tree', correctOption: 'B', explanation: 'A HashMap for O(1) lookup combined with a Doubly Linked List for O(1) insertion/deletion.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Dynamic programming solves problems by breaking them into overlapping subproblems.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'DP stores solutions to subproblems to avoid redundant computation.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is a complete graph?', questionType: 'MCQ', optionA: 'A graph with no cycles', optionB: 'A graph where every pair of vertices is connected', optionC: 'A tree with all levels filled', optionD: 'A directed acyclic graph', correctOption: 'B', explanation: 'A complete graph has an edge between every pair of vertices.', difficulty: 'MEDIUM', points: 15 },
    ],
  },
  {
    name: 'Advanced CS Concepts',
    department: 'CS',
    icon: '🧠',
    description: 'OS, DBMS, networking, and system design',
    difficulty: 'HARD',
    questions: [
      { question: 'Which scheduling algorithm may cause starvation?', questionType: 'MCQ', optionA: 'Round Robin', optionB: 'Shortest Job First (non-preemptive)', optionC: 'FCFS', optionD: 'None of the above', correctOption: 'B', explanation: 'SJF non-preemptive can cause starvation as long processes may never execute if shorter ones keep arriving.', difficulty: 'HARD', points: 20 },
      { question: 'In database normalization, 3NF eliminates transitive dependencies.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Third Normal Form (3NF) removes transitive dependencies where non-key attributes depend on other non-key attributes.', difficulty: 'HARD', points: 20 },
      { question: 'What is the main purpose of DNS?', questionType: 'MCQ', optionA: 'Encrypt data', optionB: 'Translate domain names to IP addresses', optionC: 'Manage network traffic', optionD: 'Provide firewall protection', correctOption: 'B', explanation: 'DNS (Domain Name System) resolves human-readable domain names to IP addresses.', difficulty: 'HARD', points: 20 },
      { question: 'What does ACID stand for in database transactions?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Atomicity Consistency Isolation Durability', explanation: 'ACID properties ensure reliable database transactions.', difficulty: 'HARD', points: 20 },
      { question: 'Which protocol operates at the Transport layer?', questionType: 'MCQ', optionA: 'HTTP', optionB: 'TCP', optionC: 'IP', optionD: 'Ethernet', correctOption: 'B', explanation: 'TCP (Transmission Control Protocol) operates at Layer 4 (Transport) of the OSI model.', difficulty: 'HARD', points: 20 },
      { question: 'A deadlock requires four conditions to occur simultaneously.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Deadlock requires: Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait.', difficulty: 'HARD', points: 20 },
      { question: 'What is the CAP theorem about?', questionType: 'MCQ', optionA: 'Cache, API, Performance', optionB: 'Consistency, Availability, Partition tolerance', optionC: 'Concurrency, Atomicity, Parallelism', optionD: 'Compression, Authentication, Protection', correctOption: 'B', explanation: 'The CAP theorem states a distributed system can provide at most 2 of 3: Consistency, Availability, Partition tolerance.', difficulty: 'HARD', points: 20 },
      { question: 'What is a virtual memory page fault?', questionType: 'MCQ', optionA: 'A hardware error', optionB: 'When a program accesses memory not in RAM', optionC: 'When disk is full', optionD: 'When CPU overheats', correctOption: 'B', explanation: 'A page fault occurs when the OS needs to load a virtual memory page from disk into RAM.', difficulty: 'HARD', points: 20 },
      { question: 'REST APIs use HTTP methods to perform CRUD operations.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'REST maps GET (Read), POST (Create), PUT/PATCH (Update), DELETE (Delete) to CRUD.', difficulty: 'HARD', points: 20 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ELECTRICAL ENGINEERING
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Circuit Analysis',
    department: 'EE',
    icon: '🔌',
    description: 'Ohm\'s law, Kirchhoff\'s laws, and basic circuit theory',
    difficulty: 'EASY',
    questions: [
      { question: 'What is Ohm\'s law?', questionType: 'MCQ', optionA: 'V = IR', optionB: 'P = IV', optionC: 'V = LC', optionD: 'I = VR', correctOption: 'A', explanation: 'Ohm\'s Law states Voltage = Current × Resistance (V = IR).', difficulty: 'EASY', points: 10 },
      { question: 'The unit of electrical resistance is the ____.', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'ohm', explanation: 'Resistance is measured in ohms (Ω), named after Georg Ohm.', difficulty: 'EASY', points: 10 },
      { question: 'In a series circuit, current is the same through all components.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'In series circuits, there is only one path for current, so it\'s the same everywhere.', difficulty: 'EASY', points: 10 },
      { question: 'What is the unit of capacitance?', questionType: 'MCQ', optionA: 'Henry', optionB: 'Farad', optionC: 'Tesla', optionD: 'Weber', correctOption: 'B', explanation: 'Capacitance is measured in Farads (F), named after Michael Faraday.', difficulty: 'EASY', points: 10 },
      { question: 'Kirchhoff\'s Current Law (KCL) is based on conservation of what?', questionType: 'MCQ', optionA: 'Energy', optionB: 'Voltage', optionC: 'Charge', optionD: 'Power', correctOption: 'C', explanation: 'KCL states that the sum of currents entering a node equals the sum leaving it (conservation of charge).', difficulty: 'EASY', points: 10 },
      { question: 'A voltmeter is connected in parallel with the component being measured.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Voltmeters are connected in parallel to measure the potential difference across a component.', difficulty: 'EASY', points: 10 },
      { question: 'What happens to total resistance when resistors are connected in parallel?', questionType: 'MCQ', optionA: 'Increases', optionB: 'Decreases', optionC: 'Stays the same', optionD: 'Becomes zero', correctOption: 'B', explanation: 'Parallel resistors provide multiple paths, reducing total resistance below the smallest individual resistor.', difficulty: 'EASY', points: 10 },
      { question: 'The SI unit of electric current is the ____.', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'ampere', explanation: 'Current is measured in amperes (A), named after André-Marie Ampère.', difficulty: 'EASY', points: 10 },
      { question: 'Power in a DC circuit is calculated as P = V × I.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Power (P) in watts equals Voltage (V) times Current (I).', difficulty: 'EASY', points: 10 },
    ],
  },
  {
    name: 'Electronics & Signals',
    department: 'EE',
    icon: '📡',
    description: 'Semiconductors, amplifiers, and signal processing',
    difficulty: 'MEDIUM',
    questions: [
      { question: 'What type of material is silicon?', questionType: 'MCQ', optionA: 'Conductor', optionB: 'Insulator', optionC: 'Semiconductor', optionD: 'Superconductor', correctOption: 'C', explanation: 'Silicon is a semiconductor — its conductivity can be controlled by doping.', difficulty: 'MEDIUM', points: 15 },
      { question: 'In an NPN transistor, the majority carriers in the base are electrons.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'False', explanation: 'In NPN transistors, the base is P-type, so majority carriers are holes, not electrons.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is the gain of an ideal op-amp in open-loop configuration?', questionType: 'MCQ', optionA: '0', optionB: '1', optionC: '100', optionD: 'Infinite', correctOption: 'D', explanation: 'An ideal op-amp has infinite open-loop gain, though real op-amps have very high but finite gain.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What does PWM stand for?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Pulse Width Modulation', explanation: 'PWM controls power delivery by varying the duty cycle of pulses.', difficulty: 'MEDIUM', points: 15 },
      { question: 'A low-pass filter allows frequencies below the cutoff frequency to pass.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'A low-pass filter attenuates frequencies above the cutoff and passes those below.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is the purpose of a Zener diode?', questionType: 'MCQ', optionA: 'Amplify signals', optionB: 'Voltage regulation', optionC: 'Signal rectification', optionD: 'Current limiting', correctOption: 'B', explanation: 'Zener diodes maintain a constant voltage across them when reverse-biased beyond breakdown.', difficulty: 'MEDIUM', points: 15 },
      { question: 'The Nyquist theorem states sampling rate must be at least twice the maximum frequency.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Nyquist-Shannon theorem: fs ≥ 2 × fmax to avoid aliasing.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Which component stores energy in an electric field?', questionType: 'MCQ', optionA: 'Inductor', optionB: 'Resistor', optionC: 'Capacitor', optionD: 'Diode', correctOption: 'C', explanation: 'Capacitors store energy in their electric field between plates.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is the typical voltage drop across a silicon diode in forward bias?', questionType: 'MCQ', optionA: '0.3V', optionB: '0.7V', optionC: '1.2V', optionD: '5.0V', correctOption: 'B', explanation: 'A silicon diode has approximately 0.7V forward voltage drop.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Fourier transform converts signals from time domain to frequency domain.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'The Fourier transform decomposes a signal into its frequency components.', difficulty: 'MEDIUM', points: 15 },
    ],
  },
  {
    name: 'Power Systems & Machines',
    department: 'EE',
    icon: '⚡',
    description: 'Transformers, motors, generators, and power distribution',
    difficulty: 'HARD',
    questions: [
      { question: 'In a transformer, what determines the voltage ratio?', questionType: 'MCQ', optionA: 'Core material', optionB: 'Turns ratio', optionC: 'Frequency', optionD: 'Load resistance', correctOption: 'B', explanation: 'V₂/V₁ = N₂/N₁ — the voltage ratio equals the turns ratio of primary to secondary windings.', difficulty: 'HARD', points: 20 },
      { question: 'A synchronous motor always runs at synchronous speed.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Synchronous motors lock to the rotating magnetic field and run at exactly synchronous speed (Ns = 120f/P).', difficulty: 'HARD', points: 20 },
      { question: 'What is the standard frequency of AC power in most of the world?', questionType: 'MCQ', optionA: '50 Hz', optionB: '60 Hz', optionC: '100 Hz', optionD: '25 Hz', correctOption: 'A', explanation: 'Most countries use 50 Hz. The US, Canada, and some others use 60 Hz.', difficulty: 'HARD', points: 20 },
      { question: 'What causes skin effect in conductors at high frequencies?', questionType: 'MCQ', optionA: 'Temperature', optionB: 'Magnetic field pushing current to the surface', optionC: 'Voltage drop', optionD: 'Resistance increase', correctOption: 'B', explanation: 'At high frequencies, the magnetic field pushes current toward the conductor surface, increasing effective resistance.', difficulty: 'HARD', points: 20 },
      { question: 'Power factor correction improves the efficiency of power systems.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Correcting power factor reduces reactive power, improving system efficiency and reducing losses.', difficulty: 'HARD', points: 20 },
      { question: 'What type of motor is most commonly used in household appliances?', questionType: 'MCQ', optionA: 'DC series motor', optionB: 'Synchronous motor', optionC: 'Induction motor', optionD: 'Stepper motor', correctOption: 'C', explanation: 'Single-phase induction motors are widely used in fans, pumps, washing machines, etc.', difficulty: 'HARD', points: 20 },
      { question: 'Three-phase power is more efficient than single-phase for power transmission.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Three-phase delivers constant power, uses less conductor material for the same power, and is more efficient.', difficulty: 'HARD', points: 20 },
      { question: 'What is the purpose of a circuit breaker?', questionType: 'MCQ', optionA: 'Step up voltage', optionB: 'Protect against overcurrent', optionC: 'Store energy', optionD: 'Convert AC to DC', correctOption: 'B', explanation: 'Circuit breakers automatically interrupt current flow when it exceeds a safe threshold.', difficulty: 'HARD', points: 20 },
      { question: 'The slip of an induction motor at no-load is approximately zero.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'At no-load, the rotor almost matches synchronous speed, so slip ≈ 0.', difficulty: 'HARD', points: 20 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BUSINESS ADMINISTRATION
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Management & Marketing',
    department: 'BA',
    icon: '📈',
    description: 'Management principles, marketing strategies, and organizational behavior',
    difficulty: 'EASY',
    questions: [
      { question: 'What are the 4 Ps of marketing?', questionType: 'MCQ', optionA: 'Price, Product, Place, Promotion', optionB: 'People, Process, Plan, Profit', optionC: 'Product, Price, Performance, Position', optionD: 'Plan, Produce, Promote, Profit', correctOption: 'A', explanation: 'The 4 Ps (Marketing Mix): Product, Price, Place, Promotion.', difficulty: 'EASY', points: 10 },
      { question: 'SWOT analysis stands for Strengths, Weaknesses, ____, and Threats.', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Opportunities', explanation: 'SWOT = Strengths, Weaknesses, Opportunities, Threats.', difficulty: 'EASY', points: 10 },
      { question: 'Maslow\'s hierarchy of needs starts with physiological needs at the base.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Maslow\'s pyramid starts with physiological needs (food, water, shelter) at the bottom.', difficulty: 'EASY', points: 10 },
      { question: 'Which management style involves minimal direct supervision?', questionType: 'MCQ', optionA: 'Autocratic', optionB: 'Laissez-faire', optionC: 'Democratic', optionD: 'Bureaucratic', correctOption: 'B', explanation: 'Laissez-faire management gives employees maximum freedom with minimal supervision.', difficulty: 'EASY', points: 10 },
      { question: 'What is B2B marketing?', questionType: 'MCQ', optionA: 'Business to Buyer', optionB: 'Business to Business', optionC: 'Brand to Brand', optionD: 'Backend to Backend', correctOption: 'B', explanation: 'B2B (Business-to-Business) marketing involves selling products/services to other businesses.', difficulty: 'EASY', points: 10 },
      { question: 'ROI stands for Return on Investment.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'ROI measures the profitability of an investment relative to its cost.', difficulty: 'EASY', points: 10 },
      { question: 'What is a unique selling proposition (USP)?', questionType: 'MCQ', optionA: 'A legal document', optionB: 'What makes a product different from competitors', optionC: 'A pricing strategy', optionD: 'A supply chain method', correctOption: 'B', explanation: 'USP is the unique factor that differentiates a product from its competitors.', difficulty: 'EASY', points: 10 },
      { question: 'The term "brand equity" refers to the value a brand adds to a product.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Brand equity is the premium value a company generates from a product with a recognizable name.', difficulty: 'EASY', points: 10 },
      { question: 'Which leadership theory suggests that leaders are born, not made?', questionType: 'MCQ', optionA: 'Transformational theory', optionB: 'Great Man theory', optionC: 'Situational theory', optionD: 'Servant leadership', correctOption: 'B', explanation: 'The Great Man theory proposes that leadership is inherent and great leaders are born, not made.', difficulty: 'EASY', points: 10 },
    ],
  },
  {
    name: 'Accounting & Finance',
    department: 'BA',
    icon: '💰',
    description: 'Financial statements, accounting principles, and corporate finance',
    difficulty: 'MEDIUM',
    questions: [
      { question: 'What is the accounting equation?', questionType: 'MCQ', optionA: 'Revenue - Expenses = Profit', optionB: 'Assets = Liabilities + Equity', optionC: 'Sales × Price = Revenue', optionD: 'Cash In - Cash Out = Net Income', correctOption: 'B', explanation: 'The fundamental accounting equation: Assets = Liabilities + Owner\'s Equity.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Depreciation reduces the book value of an asset over time.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Depreciation systematically allocates the cost of an asset over its useful life.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What does GDP stand for?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Gross Domestic Product', explanation: 'GDP measures the total monetary value of all goods and services produced in a country.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Which financial statement shows a company\'s financial position at a point in time?', questionType: 'MCQ', optionA: 'Income Statement', optionB: 'Cash Flow Statement', optionC: 'Balance Sheet', optionD: 'Statement of Retained Earnings', correctOption: 'C', explanation: 'The Balance Sheet shows assets, liabilities, and equity at a specific date.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Compound interest is calculated on the initial principal and accumulated interest.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Compound interest = interest on interest, unlike simple interest which is only on the principal.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is the break-even point?', questionType: 'MCQ', optionA: 'Maximum profit point', optionB: 'Where total revenue equals total costs', optionC: 'Minimum sales target', optionD: 'When debt is zero', correctOption: 'B', explanation: 'Break-even point is where total revenue = total costs, resulting in zero profit or loss.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What is the time value of money principle?', questionType: 'MCQ', optionA: 'Money loses value over time due to inflation', optionB: 'A dollar today is worth more than a dollar tomorrow', optionC: 'Money gains value when saved', optionD: 'All currencies have equal value', correctOption: 'B', explanation: 'TVM: money available now is worth more than the same amount in the future due to earning potential.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Accounts Receivable is considered a current asset.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Accounts Receivable (money owed to the company) is a current asset expected within a year.', difficulty: 'MEDIUM', points: 15 },
      { question: 'What does EBITDA stand for?', questionType: 'FILL_BLANK', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'Earnings Before Interest Taxes Depreciation and Amortization', explanation: 'EBITDA measures operating profitability before non-cash expenses and financing costs.', difficulty: 'MEDIUM', points: 15 },
      { question: 'Liquidity refers to how quickly an asset can be converted to cash.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'High liquidity means an asset can be quickly sold without significantly affecting its price.', difficulty: 'MEDIUM', points: 15 },
    ],
  },
  {
    name: 'Economics & Strategy',
    department: 'BA',
    icon: '🌐',
    description: 'Micro/macroeconomics, game theory, and strategic management',
    difficulty: 'HARD',
    questions: [
      { question: 'What is the law of diminishing marginal utility?', questionType: 'MCQ', optionA: 'Utility decreases as price increases', optionB: 'Additional consumption yields less additional satisfaction', optionC: 'Total utility always decreases', optionD: 'Marginal cost increases over time', correctOption: 'B', explanation: 'Each additional unit consumed provides less satisfaction than the previous one.', difficulty: 'HARD', points: 20 },
      { question: 'In game theory, the Nash Equilibrium occurs when no player benefits from changing strategy.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'At Nash Equilibrium, each player\'s strategy is optimal given the other players\' strategies.', difficulty: 'HARD', points: 20 },
      { question: 'What is Porter\'s Five Forces framework used for?', questionType: 'MCQ', optionA: 'Financial analysis', optionB: 'Industry competitiveness analysis', optionC: 'Marketing planning', optionD: 'Human resource management', correctOption: 'B', explanation: 'Porter\'s Five Forces analyzes industry competition: threat of new entrants, bargaining power of buyers/suppliers, threat of substitutes, competitive rivalry.', difficulty: 'HARD', points: 20 },
      { question: 'What causes inflation?', questionType: 'MCQ', optionA: 'Decrease in money supply', optionB: 'General increase in price levels', optionC: 'Increase in production', optionD: 'Deflation in wages', correctOption: 'B', explanation: 'Inflation is the sustained increase in general price levels, reducing purchasing power.', difficulty: 'HARD', points: 20 },
      { question: 'Opportunity cost is the value of the next best alternative forgone.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'True', explanation: 'Opportunity cost represents what you give up when choosing one option over another.', difficulty: 'HARD', points: 20 },
      { question: 'What is a monopoly?', questionType: 'MCQ', optionA: 'Many sellers, many buyers', optionB: 'Single seller, no close substitutes', optionC: 'Few sellers, differentiated products', optionD: 'Single buyer, many sellers', correctOption: 'B', explanation: 'A monopoly exists when one firm dominates the market with no close substitutes.', difficulty: 'HARD', points: 20 },
      { question: 'Fiscal policy is controlled by the central bank.', questionType: 'TRUE_FALSE', optionA: 'True', optionB: 'False', optionC: '', optionD: '', correctOption: 'False', explanation: 'Fiscal policy (taxation & spending) is controlled by the government. Monetary policy is controlled by the central bank.', difficulty: 'HARD', points: 20 },
      { question: 'What is the Pareto Principle (80/20 rule)?', questionType: 'MCQ', optionA: '80% effort produces 20% results', optionB: '80% of outcomes come from 20% of causes', optionC: '20% of people do 80% of the talking', optionD: 'Prices drop 80% in 20 years', correctOption: 'B', explanation: 'The Pareto Principle suggests 80% of effects come from 20% of causes — applicable in business, economics, and management.', difficulty: 'HARD', points: 20 },
      { question: 'What does comparative advantage mean in international trade?', questionType: 'MCQ', optionA: 'Producing everything cheaper than others', optionB: 'Producing at a lower opportunity cost', optionC: 'Having more natural resources', optionD: 'Using advanced technology', correctOption: 'B', explanation: 'Comparative advantage means producing a good at a lower opportunity cost than other countries, enabling beneficial trade.', difficulty: 'HARD', points: 20 },
    ],
  },
];

export async function seedQuizData(): Promise<{ success: boolean; message: string; counts?: Record<string, number> }> {
  const counts: Record<string, number> = {};
  let totalQuestions = 0;
  let totalCategories = 0;

  for (const catData of SEED_DATA) {
    // Upsert category
    const existing = await db.quizCategory.findFirst({
      where: { name: catData.name, department: catData.department },
    });

    let categoryId: string;
    if (existing) {
      categoryId = existing.id;
      // Delete old questions for this category to allow re-seeding
      await db.quizQuestion.deleteMany({ where: { categoryId } });
    } else {
      const category = await db.quizCategory.create({
        data: {
          name: catData.name,
          department: catData.department,
          icon: catData.icon,
          description: catData.description,
          difficulty: catData.difficulty,
        },
      });
      categoryId = category.id;
      totalCategories++;
    }

    // Create questions
    for (const q of catData.questions) {
      await db.quizQuestion.create({
        data: {
          categoryId,
          question: q.question,
          questionType: q.questionType,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          explanation: q.explanation || null,
          difficulty: q.difficulty,
          points: q.points,
        },
      });
      totalQuestions++;
    }

    counts[`${catData.department}-${catData.name}`] = catData.questions.length;
  }

  return {
    success: true,
    message: `Seeded ${totalCategories} new categories, ${totalQuestions} total questions across ${SEED_DATA.length} categories`,
    counts,
  };
}
