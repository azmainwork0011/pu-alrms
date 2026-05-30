'use client';

import { motion } from 'framer-motion';

interface TypingMessageProps {
  text?: string;
}

export default function TypingMessage({ text = 'Thinking...' }: TypingMessageProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500">{text}</span>
    </div>
  );
}
