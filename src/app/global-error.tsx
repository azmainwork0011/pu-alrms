'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error and display on page for debugging
    const errInfo = `GLOBAL ERROR: ${error.message}\n\nStack:\n${error.stack}\n\nDigest: ${error.digest || 'N/A'}`;
    console.error(errInfo);

    // Show error on page
    const pre = document.createElement('pre');
    pre.id = 'debug-error';
    pre.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#111;color:#0f0;padding:20px;overflow:auto;white-space:pre-wrap;font-size:12px;font-family:monospace;margin:0;';
    pre.textContent = errInfo;
    document.body.appendChild(pre);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ padding: 40 }}>
          <h2 style={{ color: '#c00' }}>Global Error: {error.message}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 20, marginTop: 20, maxHeight: '80vh', overflow: 'auto', fontSize: 13 }}>
            {error.stack}
          </pre>
          <button
            onClick={reset}
            style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer', fontSize: 16 }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
