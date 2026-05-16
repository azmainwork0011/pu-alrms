// Stub: notification sound system
export type SoundType = 'notification' | 'message' | 'achievement' | 'quiz' | 'battle';
export interface SoundOption { id: SoundType; label: string; icon: string; enabled: boolean; volume: number; }

export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'notification', label: 'Notifications', icon: '🔔', enabled: true, volume: 0.7 },
  { id: 'message', label: 'Messages', icon: '💬', enabled: true, volume: 0.7 },
  { id: 'achievement', label: 'Achievements', icon: '🏆', enabled: true, volume: 0.8 },
  { id: 'quiz', label: 'Quiz Sounds', icon: '❓', enabled: true, volume: 0.6 },
  { id: 'battle', label: 'Battle Sounds', icon: '⚔️', enabled: true, volume: 0.7 },
];

export function getSoundSettings(): Record<string, SoundOption> {
  try {
    const saved = localStorage.getItem('sound-settings');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  const defaults: Record<string, SoundOption> = {};
  SOUND_OPTIONS.forEach(opt => { defaults[opt.id] = opt; });
  return defaults;
}

export function saveSoundSettings(settings: Record<string, SoundOption>): void {
  try { localStorage.setItem('sound-settings', JSON.stringify(settings)); } catch { /* ignore */ }
}

export function previewSound(_type: SoundType): void {
  // No-op: sounds disabled
}

export function playNotificationSound(): void {
  // No-op: sounds disabled
}
