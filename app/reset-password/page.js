'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setMessage('Password reset is not configured.');
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setReady(true);
      else setMessage('Open this page using the password reset link sent to your email.');
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  async function savePassword(e) {
    e.preventDefault();
    setMessage('');
    if (password.length < 8) return setMessage('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setMessage('Passwords do not match.');
    if (!supabase || !ready) return setMessage('Please open the valid password reset link from your email first.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(error.message || 'Could not update password.');
    setMessage('Password updated successfully. You can now sign in.');
    setTimeout(() => router.push('/'), 1200);
  }

  return <main style={{ minHeight:'100vh', background:'#f8f4ed', display:'grid', placeItems:'center', padding:20, fontFamily:'Arial,sans-serif', color:'#241b18' }}>
    <form onSubmit={savePassword} style={{ width:'100%', maxWidth:420, boxSizing:'border-box', background:'#fff', padding:26, borderRadius:20, boxShadow:'0 12px 40px rgba(50,30,20,.08)', display:'grid', gap:14 }}>
      <div style={{ textAlign:'center', color:'#9a6a22', fontSize:32 }}>☀</div>
      <h1 style={{ margin:0, textAlign:'center', color:'#7c1d25', fontSize:24 }}>Reset your password</h1>
      <p style={{ margin:0, textAlign:'center', color:'#766b65', fontSize:13 }}>Choose a new password for your Kantha Pranth account.</p>
      {ready && <>
        <label style={{ display:'grid', gap:6, fontSize:13, fontWeight:700 }}>New password
          <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} style={{ padding:12, border:'1px solid #e3d8ca', borderRadius:10, fontSize:14 }} />
        </label>
        <label style={{ display:'grid', gap:6, fontSize:13, fontWeight:700 }}>Confirm new password
          <input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} style={{ padding:12, border:'1px solid #e3d8ca', borderRadius:10, fontSize:14 }} />
        </label>
        <button disabled={busy} style={{ border:0, borderRadius:10, padding:13, background:'#7c1d25', color:'#fff', fontWeight:800, cursor:'pointer' }}>{busy ? 'Updating…' : 'Update password'}</button>
      </>}
      {message && <p role="status" style={{ margin:0, padding:10, borderRadius:9, background:'#faf5ed', color:'#7c1d25', fontSize:13 }}>{message}</p>}
      <button type="button" onClick={() => router.push('/')} style={{ border:0, background:'transparent', color:'#7c1d25', cursor:'pointer', fontWeight:700 }}>Back to sign in</button>
    </form>
  </main>;
}
