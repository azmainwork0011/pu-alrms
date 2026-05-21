import { NextResponse } from 'next/server';
import { getProviderStatuses, getModesList } from '@/lib/ai/router';

// ═══════════════════════════════════════════════════════════════════
// AI MODELS — Public endpoint listing available modes & providers
// No authentication required (public info).
// ═══════════════════════════════════════════════════════════════════

// ─── Mode definitions with icons & descriptions ────────────
const MODE_DEFINITIONS = [
  {
    mode: 'academic',
    label: 'Academic',
    icon: 'GraduationCap',
    description: 'Assignments, lab reports, research',
  },
  {
    mode: 'coding',
    label: 'Coding',
    icon: 'Code',
    description: 'Programming help & debugging',
  },
  {
    mode: 'math',
    label: 'Mathematics',
    icon: 'Calculator',
    description: 'Step-by-step math solutions',
  },
  {
    mode: 'assignment',
    label: 'Assignment',
    icon: 'FileText',
    description: 'Essay & assignment help',
  },
  {
    mode: 'labReport',
    label: 'Lab Report',
    icon: 'FlaskConical',
    description: 'Lab report writing assistance',
  },
  {
    mode: 'fastChat',
    label: 'Fast Chat',
    icon: 'Zap',
    description: 'Quick answers, ultra-fast',
  },
  {
    mode: 'reasoning',
    label: 'Reasoning',
    icon: 'Brain',
    description: 'Deep analysis & logical reasoning',
  },
  {
    mode: 'bangla',
    label: 'বাংলা',
    icon: 'Globe',
    description: 'Bangla academic assistance',
  },
] as const;

// ─── Provider model mapping (never expose API keys) ────────
const PROVIDER_MODELS: Record<string, string> = {
  Gemini: 'gemini-2.0-flash',
  Groq: 'llama-3.1-8b-instant',
  OpenRouter: 'llama-3.1-8b-instruct:free',
};

const FALLBACK_ORDER = ['Gemini', 'Groq', 'OpenRouter'];

// ═══════════════════════════════════════════════════════════════════
// GET: Return available modes and provider statuses
// ═══════════════════════════════════════════════════════════════════
export async function GET() {
  try {
    // Fetch live provider statuses from router
    const providerStatuses = getProviderStatuses();

    // Build modes list — use router's getModesList if available,
    // otherwise fall back to our static definitions
    let modes: Array<{
      mode: string;
      label: string;
      icon: string;
      description: string;
    }>;

    try {
      const dynamicModes = getModesList();
      modes = dynamicModes.map((m: { mode: string; label: string; icon: string; description?: string }) => ({
        mode: m.mode,
        label: m.label,
        icon: m.icon,
        description: m.description ?? '',
      }));
    } catch {
      // Fallback to static definitions if getModesList is not yet available
      modes = MODE_DEFINITIONS.map((m) => ({
        mode: m.mode,
        label: m.label,
        icon: m.icon,
        description: m.description,
      }));
    }

    // Build providers list from live statuses
    const providers = providerStatuses.map(
      (p: { name: string; available: boolean }) => ({
        name: p.name,
        available: p.available,
        model: PROVIDER_MODELS[p.name] ?? 'unknown',
      }),
    );

    return NextResponse.json({
      modes,
      providers,
      fallbackOrder: FALLBACK_ORDER,
    });
  } catch (error) {
    console.error(
      '[AI Models] Error fetching model list:',
      error instanceof Error ? error.message : error,
    );

    // Even on error, return a useful response with static data
    return NextResponse.json({
      modes: MODE_DEFINITIONS.map((m) => ({
        mode: m.mode,
        label: m.label,
        icon: m.icon,
        description: m.description,
      })),
      providers: [
        { name: 'Gemini', available: false, model: PROVIDER_MODELS['Gemini'] },
        { name: 'Groq', available: false, model: PROVIDER_MODELS['Groq'] },
        { name: 'OpenRouter', available: false, model: PROVIDER_MODELS['OpenRouter'] },
      ],
      fallbackOrder: FALLBACK_ORDER,
    });
  }
}
