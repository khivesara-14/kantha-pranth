'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Kantha Pranth root layout failed:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', background: '#fbf7f1', color: '#241b18', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ width: '100%', maxWidth: 420, padding: 28, border: '1px solid #eadfd3', borderRadius: 20, background: '#fffdf9', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>☀</div>
            <h1 style={{ margin: '0 0 10px', color: '#7c1d25', fontSize: 24 }}>Kantha Pranth couldn’t load</h1>
            <p style={{ color: '#766b65', lineHeight: 1.6 }}>A startup error interrupted the app. Try loading it again.</p>
            {error?.digest && <p style={{ fontSize: 12, color: '#766b65' }}>Reference: {error.digest}</p>}
            <button onClick={() => reset()} style={{ marginTop: 12, padding: '12px 18px', border: 0, borderRadius: 10, background: '#7c1d25', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
            <button onClick={() => window.location.reload()} style={{ display: 'block', margin: '12px auto 0', padding: 8, border: 0, background: 'transparent', color: '#7c1d25', fontWeight: 600, cursor: 'pointer' }}>Reload homepage</button>
            {error?.message && <details style={{ marginTop: 18, textAlign: 'left', color: '#766b65', fontSize: 12 }}><summary>Technical details</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{error.message}</pre></details>}
          </section>
        </main>
      </body>
    </html>
  );
}
