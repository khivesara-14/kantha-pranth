'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Kantha Pranth page failed to render:', error);
  }, [error]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#fbf7f1', color: '#241b18', fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: 420, padding: 28, border: '1px solid #eadfd3', borderRadius: 20, background: '#fffdf9', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>☀</div>
        <h1 style={{ margin: '0 0 10px', color: '#7c1d25', fontSize: 24 }}>Kantha Pranth couldn’t load this page</h1>
        <p style={{ color: '#766b65', lineHeight: 1.6 }}>A temporary error interrupted the page. Try again; your account data has not been changed by this screen.</p>
        {error?.digest && <p style={{ fontSize: 12, color: '#766b65' }}>Reference: {error.digest}</p>}
        <button onClick={() => reset()} style={{ marginTop: 12, padding: '12px 18px', borderRadius: 10, background: '#7c1d25', color: '#fff', fontWeight: 700 }}>Try again</button>
        <button onClick={() => window.location.reload()} style={{ display: 'block', margin: '12px auto 0', padding: 8, color: '#7c1d25', fontWeight: 600 }}>Reload homepage</button>
        {error?.message && <details style={{ marginTop: 18, textAlign: 'left', color: '#766b65', fontSize: 12 }}><summary>Technical details</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{error.message}</pre></details>}
      </section>
    </main>
  );
}
