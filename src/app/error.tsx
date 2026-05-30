'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the full error details so we can see it in the server console
    console.error('=== CLIENT-SIDE ERROR CAUGHT BY ERROR BOUNDARY ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error digest:', error.digest);
    console.error('Error name:', error.name);
    console.error('Error cause:', error.cause);
    console.error('=== END ERROR DETAILS ===');

    // Also display the error on the page for debugging
    const pre = document.createElement('pre');
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#111;color:#0f0;padding:20px;overflow:auto;white-space:pre-wrap;font-size:12px;font-family:monospace;';
    pre.textContent = `ERROR: ${error.message}\n\nSTACK:\n${error.stack}\n\nDIGEST: ${error.digest || 'N/A'}\n\nNAME: ${error.name}`;
    document.body.appendChild(pre);
  }, [error]);

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h2 style={{ color: 'red' }}>Error: {error.message}</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 20, marginTop: 20, maxHeight: '80vh', overflow: 'auto' }}>
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer' }}
      >
        Try Again
      </button>
    </div>
  );
}
