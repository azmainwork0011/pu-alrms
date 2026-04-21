'use client';

import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query-client';

/**
 * React Query provider — wraps the app with QueryClientProvider.
 * Place this at the root level to enable React Query throughout the app.
 */
export function ApiProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per component lifecycle (survives re-renders)
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
