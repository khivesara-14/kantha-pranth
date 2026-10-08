'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data?.session || null);
        setChecking(false);
      }
    }).catch((error) => {
      if (mounted) {
        setMessage(error?.message || 'Could not initialize login.');
        setChecking(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession || null);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    setBusy(true);

    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { full_name: '' } }
          })
        : await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

      if (result.error) {
        setMessage(result.error.message || 'Authentication failed.');
        return;
      }

      if (mode === 'signup' && !result.data?.session) {
        setMessage('Account created. Check your email, confirm your account, then sign in.');
        setMode('login');
        setPassword('');
        return;
      }

      setSession(result.data?.session || null);
    } catch (error) {
      setMessage(error?.message || 'Something went wrong while signing in.');
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <main style={styles.screen}><div style={styles.splash}>☀<b>KANTHA PRANTH</b><small>Jain Community · Bengaluru</small></div></main>;
  }

  if (session) return children;

  return (
    <main style={styles.screen}>
      <div style={styles.card}>
        <div style={styles.icon}>🙏</div>
        <div style={styles.brand}>KANTHA PRANTH</div>
        <h1>{mode === 'signup' ? 'Create your account' : 'Welcome Back'}</h1>
        <p style={styles.sub}>Sign in to continue to your Jain community.</p>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>Email address
            <input value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="you@example.com" type="email" autoComplete="email" />
          </label>

          <label style={styles.label}>Password
            <input value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="Minimum 8 characters" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </label>

          {message && <div style={styles.message}>{message}</div>}

          <button type="submit" disabled={busy} style={styles.primary}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button type="button" disabled={busy} onClick={() => { setMessage(''); setMode(mode === 'login' ? 'signup' : 'login'); }} style={styles.link}>
          {mode === 'login' ? 'New to Kantha Pranth? Create an account' : 'Already have an account? Sign in'}
        </button>
      </div>
    </main>
  );
}

const styles = {
  screen:{minHeight:'100vh',background:'#f8f4ed',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Arial,sans-serif'},
  card:{width:'100%',maxWidth:430,background:'#fffdf9',borderRadius:24,padding:'34px 24px',boxShadow:'0 20px 60px rgba(55,30,20,.12)',boxSizing:'border-box'},
  splash:{display:'grid',gap:8,textAlign:'center',color:'#7c1d25',fontSize:22},
  icon:{width:64,height:64,borderRadius:20,margin:'0 auto 12px',background:'linear-gradient(145deg,#e9c77f,#9a6a22)',display:'grid',placeItems:'center',color:'#fff',fontSize:30},
  brand:{textAlign:'center',fontSize:10,fontWeight:800,letterSpacing:'.14em',color:'#7c1d25'},
  sub:{textAlign:'center',color:'#766b65',fontSize:12,lineHeight:1.5},
  form:{display:'grid',gap:14,marginTop:24},
  label:{display:'grid',gap:7,fontSize:11,fontWeight:700,color:'#241b18'},
  input:{width:'100%',height:50,boxSizing:'border-box',border:'1px solid #ded1c3',borderRadius:13,padding:'0 14px',fontSize:14,background:'#fff'},
  primary:{width:'100%',minHeight:52,border:0,borderRadius:13,background:'#7c1d25',color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer'},
  link:{display:'block',width:'100%',border:0,background:'none',color:'#7c1d25',fontSize:11,cursor:'pointer',padding:'14px 8px'},
  message:{background:'#fff0ed',border:'1px solid #efc9c2',color:'#8e2926',borderRadius:12,padding:10,fontSize:11,lineHeight:1.45}
};