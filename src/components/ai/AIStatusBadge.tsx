'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface ProviderStatus {
  name: string;
  available: boolean;
  error?: string;
}

interface StatusData {
  status: 'ok' | 'degraded' | 'down';
  providers: Record<string, ProviderStatus>;
}

export default function AIStatusBadge() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/status')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Badge variant="outline" className="text-xs gap-1.5 bg-transparent">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        Loading...
      </Badge>
    );
  }

  if (!data) return null;

  const colorMap = { ok: 'bg-emerald-500', degraded: 'bg-amber-500', down: 'bg-red-500' };
  const labelMap = { ok: 'Online', degraded: 'Fallback', down: 'Down' };

  return (
    <Badge variant="outline" className="text-xs gap-1.5 bg-transparent">
      <span className={`w-2 h-2 rounded-full ${colorMap[data.status]}`} />
      {labelMap[data.status]}
    </Badge>
  );
}
