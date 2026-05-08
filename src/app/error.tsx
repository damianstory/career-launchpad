'use client';

import { AlertTriangle } from 'lucide-react';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        background: '#F6F6FF',
        color: '#22224C',
        fontFamily: 'var(--font-primary)',
      }}
    >
      <section
        style={{
          width: 'min(420px, 100%)',
          border: '1px solid #E5E9F1',
          borderRadius: 8,
          background: '#FFFFFF',
          padding: 28,
          boxShadow: '0 16px 40px rgba(34, 34, 76, 0.12)',
        }}
      >
        <AlertTriangle size={28} color="#0092FF" />
        <h1 style={{ margin: '14px 0 8px', fontSize: 24, lineHeight: 1.1 }}>Content could not load</h1>
        <p style={{ margin: '0 0 20px', color: '#485163', lineHeight: 1.5 }}>
          Career LaunchPAD could not reach the content library. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: 0,
            borderRadius: 8,
            background: '#0092FF',
            color: '#FFFFFF',
            fontWeight: 800,
            padding: '12px 18px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </section>
    </main>
  );
}
