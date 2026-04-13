import { Server } from 'socket.io';

const PORT = 3004;

const io = new Server(PORT, {
  cors: {
    origin: ['http://localhost:3000', '*'],
    methods: ['GET', 'POST'],
  },
});

// Battle rooms
interface BattleRoom {
  id: string;
  player1: { id: string; name: string; avatar?: string };
  player2: { id: string; name: string; avatar?: string } | null;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  language: string;
  totalRounds: number;
  timePerRound: number;
  currentRound: number;
  player1HP: number;
  player2HP: number;
  player1Score: number;
  player2Score: number;
  createdAt: number;
  questions: any[];
}

const rooms = new Map<string, BattleRoom>();

function generateRoomId(): string {
  return 'BR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate questions based on language
function generateQuestions(language: string, count: number): any[] {
  const sampleQuestions = [
    { type: 'MCQ', question: 'What is the output of: 2 + 3 * 4?', options: ['20', '14', '12', '24'], correctAnswer: 'B' },
    { type: 'MCQ', question: 'Which keyword is used to define a function?', options: ['func', 'def', 'function', 'fn'], correctAnswer: 'C' },
    { type: 'MCQ', question: 'What does API stand for?', options: ['Application Protocol Interface', 'Application Programming Interface', 'Applied Programming Interface', 'Application Process Integration'], correctAnswer: 'B' },
    { type: 'MCQ', question: 'Which data structure uses FIFO?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctAnswer: 'B' },
    { type: 'MCQ', question: 'What is O(n log n)?', options: ['Linear time', 'Quadratic time', 'Log-linear time', 'Constant time'], correctAnswer: 'C' },
    { type: 'MCQ', question: 'Which loop checks condition first?', options: ['do-while', 'while', 'for-each', 'goto'], correctAnswer: 'B' },
    { type: 'MCQ', question: 'What is a pointer?', options: ['A data type', 'A variable storing memory address', 'A function', 'A class'], correctAnswer: 'B' },
    { type: 'MCQ', question: 'Which sort algorithm has O(n²) worst case?', options: ['Merge sort', 'Quick sort', 'Bubble sort', 'Heap sort'], correctAnswer: 'C' },
    { type: 'MCQ', question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Language'], correctAnswer: 'A' },
    { type: 'MCQ', question: 'What is recursion?', options: ['A loop', 'A function calling itself', 'A class method', 'An interface'], correctAnswer: 'B' },
  ];

  const shuffled = [...sampleQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

io.on('connection', (socket) => {
  console.log(`[Battle] Connected: ${socket.id}`);

  // Create a new battle room
  socket.on('create-room', (data: { language: string; totalRounds?: number; timePerRound?: number; player: { id: string; name: string; avatar?: string } }) => {
    const room: BattleRoom = {
      id: generateRoomId(),
      player1: data.player,
      player2: null,
      status: 'WAITING',
      language: data.language,
      totalRounds: data.totalRounds || 10,
      timePerRound: data.timePerRound || 12,
      currentRound: 0,
      player1HP: 100,
      player2HP: 100,
      player1Score: 0,
      player2Score: 0,
      createdAt: Date.now(),
      questions: generateQuestions(data.language, data.totalRounds || 10),
    };

    rooms.set(room.id, room);
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = data.player.id;
    socket.data.playerSlot = 'player1';

    socket.emit('room-created', { room: { id: room.id, language: room.language, totalRounds: room.totalRounds } });
    console.log(`[Battle] Room created: ${room.id} by ${data.player.name}`);
  });

  // Join an existing room
  socket.on('join-room', (data: { roomId: string; player: { id: string; name: string; avatar?: string } }) => {
    const room = rooms.get(data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.player2) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    room.player2 = data.player;
    room.status = 'IN_PROGRESS';
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.data.playerId = data.player.id;
    socket.data.playerSlot = 'player2';

    // Notify both players
    io.to(room.id).emit('battle-start', {
      room: {
        id: room.id,
        player1: room.player1,
        player2: room.player2,
        language: room.language,
        totalRounds: room.totalRounds,
        timePerRound: room.timePerRound,
      },
      firstQuestion: room.questions[0],
    });

    console.log(`[Battle] ${data.player.name} joined room ${room.id}`);
  });

  // Player answers a question
  socket.on('answer', (data: { answer: string; timeLeft: number }) => {
    const roomId = socket.data.roomId;
    const room = rooms.get(roomId);
    if (!room || room.status !== 'IN_PROGRESS') return;

    const playerSlot = socket.data.playerSlot;
    const isCorrect = data.answer === room.questions[room.currentRound]?.correctAnswer;

    // Calculate damage
    const damage = isCorrect ? (10 + Math.floor(Math.random() * 11)) : (5 + Math.floor(Math.random() * 6));
    const timeoutDamage = data.timeLeft <= 0 ? 15 : 0;

    if (isCorrect) {
      if (playerSlot === 'player1') {
        room.player2HP = Math.max(0, room.player2HP - damage);
        room.player1Score += 1;
      } else {
        room.player1HP = Math.max(0, room.player1HP - damage);
        room.player2Score += 1;
      }
    } else {
      if (playerSlot === 'player1') {
        room.player1HP = Math.max(0, room.player1HP - damage - timeoutDamage);
      } else {
        room.player2HP = Math.max(0, room.player2HP - damage - timeoutDamage);
      }
    }

    // Notify about the answer result
    socket.emit('answer-result', { correct: isCorrect, damage, selfDamage: isCorrect ? 0 : damage + timeoutDamage });

    // Check if battle should end
    if (room.player1HP <= 0 || room.player2HP <= 0) {
      room.status = 'COMPLETED';
      const winner = room.player1HP > 0 ? room.player1 : room.player2HP > 0 ? room.player2 : null;

      io.to(room.id).emit('battle-end', {
        winner,
        player1HP: room.player1HP,
        player2HP: room.player2HP,
        player1Score: room.player1Score,
        player2Score: room.player2Score,
        totalRounds: room.currentRound + 1,
      });
      return;
    }

    // Check if all rounds completed
    room.currentRound += 1;
    if (room.currentRound >= room.totalRounds) {
      room.status = 'COMPLETED';
      const winner = room.player1HP > room.player2HP ? room.player1 : room.player2HP > room.player1HP ? room.player2 : null;

      io.to(room.id).emit('battle-end', {
        winner,
        player1HP: room.player1HP,
        player2HP: room.player2HP,
        player1Score: room.player1Score,
        player2Score: room.player2Score,
        totalRounds: room.totalRounds,
      });
      return;
    }

    // Send next question to both players
    io.to(room.id).emit('next-round', {
      round: room.currentRound + 1,
      totalRounds: room.totalRounds,
      question: room.questions[room.currentRound],
      player1HP: room.player1HP,
      player2HP: room.player2HP,
    });
  });

  // Get available rooms
  socket.on('get-rooms', () => {
    const available = Array.from(rooms.values())
      .filter(r => r.status === 'WAITING')
      .map(r => ({ id: r.id, language: r.language, player1: r.player1, totalRounds: r.totalRounds }));
    socket.emit('rooms-list', { rooms: available });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Battle] Disconnected: ${socket.id}`);
    const roomId = socket.data.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room && room.status === 'IN_PROGRESS') {
        room.status = 'COMPLETED';
        io.to(roomId).emit('player-disconnected', { playerId: socket.data.playerId });
      }
      if (room && room.status === 'WAITING') {
        rooms.delete(roomId);
      }
    }
  });
});

console.log(`[Battle Service] Running on port ${PORT}`);
