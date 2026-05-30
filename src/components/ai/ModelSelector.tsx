'use client';

import { motion } from 'framer-motion';
import {
  GraduationCap, Code, Calculator, FileText,
  FlaskConical, Zap, Brain, Globe,
  type LucideIcon,
} from 'lucide-react';
import AIStatusBadge from './AIStatusBadge';

interface ModelSelectorProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  disabled?: boolean;
}

interface ModeConfig {
  mode: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const MODES: ModeConfig[] = [
  { mode: 'academic', label: 'Academic', icon: GraduationCap, color: 'emerald' },
  { mode: 'coding', label: 'Coding', icon: Code, color: 'violet' },
  { mode: 'math', label: 'Math', icon: Calculator, color: 'sky' },
  { mode: 'assignment', label: 'Assignment', icon: FileText, color: 'amber' },
  { mode: 'labReport', label: 'Lab Report', icon: FlaskConical, color: 'rose' },
  { mode: 'fastChat', label: 'Fast Chat', icon: Zap, color: 'orange' },
  { mode: 'reasoning', label: 'Reasoning', icon: Brain, color: 'cyan' },
  { mode: 'bangla', label: '\u09AC\u09BE\u0982\u09B2\u09BE', icon: Globe, color: 'teal' },
];

const COLOR_MAP: Record<string, {
  activeBg: string;
  activeText: string;
  activeBorder: string;
}> = {
  emerald: {
    activeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    activeBorder: 'border-emerald-300 dark:border-emerald-700',
  },
  violet: {
    activeBg: 'bg-violet-100 dark:bg-violet-900/40',
    activeText: 'text-violet-700 dark:text-violet-300',
    activeBorder: 'border-violet-300 dark:border-violet-700',
  },
  sky: {
    activeBg: 'bg-sky-100 dark:bg-sky-900/40',
    activeText: 'text-sky-700 dark:text-sky-300',
    activeBorder: 'border-sky-300 dark:border-sky-700',
  },
  amber: {
    activeBg: 'bg-amber-100 dark:bg-amber-900/40',
    activeText: 'text-amber-700 dark:text-amber-300',
    activeBorder: 'border-amber-300 dark:border-amber-700',
  },
  rose: {
    activeBg: 'bg-rose-100 dark:bg-rose-900/40',
    activeText: 'text-rose-700 dark:text-rose-300',
    activeBorder: 'border-rose-300 dark:border-rose-700',
  },
  orange: {
    activeBg: 'bg-orange-100 dark:bg-orange-900/40',
    activeText: 'text-orange-700 dark:text-orange-300',
    activeBorder: 'border-orange-300 dark:border-orange-700',
  },
  cyan: {
    activeBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    activeText: 'text-cyan-700 dark:text-cyan-300',
    activeBorder: 'border-cyan-300 dark:border-cyan-700',
  },
  teal: {
    activeBg: 'bg-teal-100 dark:bg-teal-900/40',
    activeText: 'text-teal-700 dark:text-teal-300',
    activeBorder: 'border-teal-300 dark:border-teal-700',
  },
};

export default function ModelSelector({ currentMode, onModeChange, disabled }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      {/* Label row with status badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Mode
        </span>
        <AIStatusBadge />
      </div>

      {/* Mode pills - horizontal scroll on mobile, wrap on desktop */}
      <div
        className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-xl p-2 border border-gray-200/60 dark:border-gray-700/60 scrollbar-none"
      >
        {MODES.map(({ mode, label, icon: Icon, color }) => {
          const isActive = mode === currentMode;
          const colors = COLOR_MAP[color];

          return (
            <motion.button
              key={mode}
              onClick={() => !disabled && onModeChange(mode)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.04 } : undefined}
              whileTap={!disabled ? { scale: 0.96 } : undefined}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap
                transition-all duration-200 shrink-0 cursor-pointer select-none
                ${isActive
                  ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder} shadow-sm`
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/60'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
