import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0d14 0%, #0d1117 40%, #111827 100%)' }}>
      <div className="text-center max-w-md w-full">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <span className="text-4xl font-bold text-emerald-500">404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 mb-6 text-sm">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.25)' }}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
