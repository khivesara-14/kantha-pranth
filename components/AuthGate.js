'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AuthGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState('welcome');
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [mobile, setMobile] = useState('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [parentsName, setParentsName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const pathname = usePathname();
  const isSpecialRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/reset-password');

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

  useEffect(() => {
    if (!session?.access_token || session?.guest || !session?.user?.id) return;
    fetch('/api/welcome-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      }
    }).catch(() => {});
  }, [session?.access_token, session?.user?.id, session?.guest]);

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setEmailConfirmationRequired(false);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (mode === 'signup') {
      if (!dob || !maritalStatus || !bloodGroup || !mobile.trim() || !occupation.trim() || !education || !parentsName.trim()) {
        setMessage('Please complete all registration details.');
        return;
      }
      if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
        setMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
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
            options: { data: {
              full_name: '',
              date_of_birth: dob,
              marital_status: maritalStatus,
              blood_group: bloodGroup,
              mobile_number: mobile.replace(/\D/g, ''),
              occupation,
              highest_education: education,
              parents_name: parentsName
            } }
          })
        : await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

      if (result.error) {
        if (mode === 'login' && /email not confirmed/i.test(result.error.message || '')) {
          setEmailConfirmationRequired(true);
          setMessage('Your email is not authenticated yet. Please authenticate your email using the confirmation link sent to your inbox before signing in. Check spam, or resend the confirmation email below.');
        } else {
          setMessage(result.error.message || 'Authentication failed.');
        }
        return;
      }

      if (mode === 'signup' && !result.data?.session) {
        setMessage('Registration successful! Please authenticate your email by opening the confirmation link sent to your email address. Then return here and sign in.');
        setMode('login');
        setPassword('');
        setDob('');
        setMaritalStatus('');
        setBloodGroup('');
        setMobile('');
        setOccupation('');
        setEducation('');
        setParentsName('');
        return;
      }

      localStorage.removeItem('kp-guest');
      setSession(result.data?.session || null);
    } catch (error) {
      setMessage(error?.message || 'Something went wrong while signing in.');
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    const cleanEmail = email.trim().toLowerCase();
    if (!supabase || !cleanEmail.includes('@')) {
      setMessage('Enter the email address for your account first.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin + '/reset-password' : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (error) setMessage(error.message || 'Could not send password reset email.');
      else {
        setResetMode(false);
        setMessage('Password reset email sent. Open the link in your email to choose a new password.');
      }
    } catch (error) {
      setMessage(error?.message || 'Could not send password reset email.');
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    const cleanEmail = email.trim().toLowerCase();
    if (!supabase || !cleanEmail.includes('@')) {
      setMessage('Enter the email address you used to register.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: cleanEmail });
      if (error) setMessage(error.message || 'Could not resend confirmation email.');
      else {
        setEmailConfirmationRequired(false);
        setMessage('Authentication email sent. Open it and click the confirmation link to authenticate your email, then return here to sign in.');
      }
    } catch (error) {
      setMessage(error?.message || 'Could not resend confirmation email.');
    } finally {
      setBusy(false);
    }
  }

  // The admin portal has its own authentication screen. Do not let the community
  // welcome gate block /admin before the admin page can perform its own check.
  if (isSpecialRoute) return children;

  if (checking) {
    return (
      <main style={styles.splashScreen}>
        <div style={styles.splashLogo}>☀</div>
        <div style={styles.splashName}>KANTHA PRANTH</div>
        <div style={styles.splashSub}>Jain Community · Bengaluru</div>
      </main>
    );
  }

  if (session) return children;

  if (screen === 'welcome') {
    return (
      <main className="auth-screen">
        <section className="auth-mobile-shell welcome-shell">
          <div className="welcome-illustration" aria-label="Kantha Pranth community welcome">
            <div className="temple-line" aria-hidden="true">☼</div>
            <div className="temple-base">KANTHA<br />PRANTH</div>
          </div>

          <div className="welcome-logo" aria-label="Kantha Pranth logo" role="img">☀</div>
          <p className="eyebrow">JAIN COMMUNITY · BENGALURU</p>
          <h1>KANTHA PRANTH</h1>
          <p className="welcome-tagline">A trusted platform for our Jain community</p>

          <div className="welcome-points">
            <span>Connect</span><i>•</i><span>Support</span><i>•</i><span>Grow</span>
          </div>

          <div className="welcome-feature-grid">
            {[
              ['👥', 'Connect', 'with members'],
              ['⌕', 'Discover', 'local services'],
              ['🛒', 'Buy & Sell', 'within community'],
              ['📅', 'Events', 'stay updated'],
              ['📍', 'Local', 'information'],
              ['♥', 'Support', 'each other']
            ].map(([icon, title, sub]) => (
              <div key={title}>
                <span>{icon}</span>
                <b>{title}</b>
                <small>{sub}</small>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="primary welcome-cta full"
            onClick={() => {
              setMessage('');
              setMode('login');
              setScreen('login');
            }}
          >
            Get Started
          </button>

          <small className="welcome-foot">Built for the Jain Community of Bengaluru</small>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-screen auth-login-screen">
      <section className="auth-mobile-shell">
        <button type="button" style={styles.back} onClick={() => setScreen('welcome')}>← Back</button>
        <div style={styles.welcomeLogo}>☀</div>
        <div style={styles.brand}>KANTHA PRANTH</div>
        <h1 style={styles.loginTitle}>{resetMode ? 'Reset your password' : mode === 'signup' ? 'Create your account' : 'Welcome Back'}</h1>
        <p style={styles.loginSub}>{resetMode ? 'Enter your registered email and we will send a password reset link.' : 'Sign in to continue to your Jain community.'}</p>

        <form onSubmit={resetMode ? (e) => { e.preventDefault(); sendPasswordReset(); } : submit} style={styles.form}>
          <label style={styles.label}>Email address
            <input value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="you@example.com" type="email" autoComplete="email" />
          </label>

          {!resetMode && <label style={styles.label}>Password
            <input value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="Minimum 8 characters" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </label>}
          {!resetMode && mode === 'login' && <div style={{ display:'flex', justifyContent:'flex-end', marginTop:-7, marginBottom:4 }}>
            <button type="button" disabled={busy} onClick={() => { setMessage(''); setEmailConfirmationRequired(false); setResetMode(true); }} style={{ border:0, background:'transparent', color:'#7c1d25', fontSize:13, fontWeight:800, textDecoration:'underline', cursor:'pointer', padding:'6px 0' }}>Forgot password?</button>
          </div>}

          {!resetMode && mode === 'signup' && (
            <div style={styles.signupDetails}>
              <div style={styles.sectionTitle}>Personal details</div>

              <label style={styles.label}>Date of birth
                <input value={dob} onChange={e => setDob(e.target.value)} style={styles.input} type="date" max={new Date().toISOString().split('T')[0]} />
              </label>

              <label style={styles.label}>Marital status
                <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} style={styles.input}>
                  <option value="">Select marital status</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Divorced</option>
                  <option>Widowed</option>
                  <option>Prefer not to say</option>
                </select>
              </label>

              <label style={styles.label}>Blood group
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={styles.input}>
                  <option value="">Select blood group</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(group => <option key={group}>{group}</option>)}
                </select>
              </label>

              <label style={styles.label}>Mobile number
                <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0,10))} style={styles.input} placeholder="10-digit mobile number" type="tel" inputMode="numeric" autoComplete="tel" />
              </label>

              <label style={styles.label}>Occupation
                <input value={occupation} onChange={e => setOccupation(e.target.value)} style={styles.input} placeholder="e.g. Business, Student, Professional" />
              </label>

              <label style={styles.label}>Highest education qualification
                <select value={education} onChange={e => setEducation(e.target.value)} style={styles.input}>
                  <option value="">Select qualification</option>
                  <option>School</option>
                  <option>PUC / 12th</option>
                  <option>Diploma</option>
                  <option>Undergraduate</option>
                  <option>Postgraduate</option>
                  <option>Doctorate</option>
                  <option>Other</option>
                </select>
              </label>

              <label style={styles.label}>Parents' name
                <input value={parentsName} onChange={e => setParentsName(e.target.value)} style={styles.input} placeholder="Parent / parents name" />
              </label>
            </div>
          )}

          {message && <div style={styles.message}>{message}</div>}
          {emailConfirmationRequired && <button type="button" disabled={busy} onClick={resendConfirmation} style={styles.link}>{busy ? 'Sending…' : 'Resend confirmation email'}</button>}

          <button type="submit" disabled={busy} style={styles.primary}>
            {busy ? 'Please wait…' : resetMode ? 'Send reset link' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {resetMode ? <button type="button" disabled={busy} onClick={() => { setMessage(''); setResetMode(false); }} style={styles.link}>Back to sign in</button> : <button type="button" disabled={busy} onClick={() => { setMessage(''); setEmailConfirmationRequired(false); setMode(mode === 'login' ? 'signup' : 'login'); }} style={styles.link}>
          {mode === 'login' ? 'New to Kantha Pranth? Create an account' : 'Already have an account? Sign in'}
        </button>}
      </section>
    </main>
  );
}

const styles = {
  splashScreen: { minHeight:'100vh', background:'#f8f4ed', display:'grid', placeContent:'center', textAlign:'center', color:'#7c1d25', fontFamily:'Arial,sans-serif' },
  splashLogo: { fontSize:48, marginBottom:10 },
  splashName: { fontSize:20, fontWeight:800, letterSpacing:'.14em' },
  splashSub: { marginTop:8, fontSize:11, color:'#766b65' },
  welcomeScreen: { minHeight:'100vh', background:'#f8f4ed', display:'flex', justifyContent:'center', overflowY:'auto', fontFamily:'Arial,sans-serif', color:'#241b18' },
  welcomeShell: { width:'100%', maxWidth:520, minHeight:'100vh', boxSizing:'border-box', padding:'28px 22px 24px', display:'flex', flexDirection:'column', alignItems:'center' },
  illustration: { width:'100%', height:112, display:'grid', placeItems:'center', color:'#7c1d25', marginBottom:4 },
  templeLine: { fontSize:44, lineHeight:1, color:'#b58a42' },
  templeBase: { marginTop:-2, textAlign:'center', fontSize:10, fontWeight:800, letterSpacing:'.22em', lineHeight:1.35, color:'#7c1d25' },
  welcomeLogo: { width:62, height:62, borderRadius:20, display:'grid', placeItems:'center', background:'linear-gradient(145deg,#e9c77f,#9a6a22)', color:'#fff', fontSize:31, boxShadow:'0 10px 25px rgba(100,65,25,.16)', marginBottom:12 },
  eyebrow: { margin:'0 0 7px', fontSize:10, fontWeight:800, letterSpacing:'.16em', color:'#8b6b4a', textAlign:'center' },
  welcomeTitle: { margin:'0', color:'#7c1d25', fontSize:28, letterSpacing:'.08em', fontWeight:900, textAlign:'center' },
  tagline: { margin:'9px 0 12px', color:'#766b65', fontSize:13, textAlign:'center' },
  points: { display:'flex', gap:12, alignItems:'center', color:'#7c1d25', fontSize:11, fontWeight:800, marginBottom:24 },
  'points i': { fontStyle:'normal', color:'#c39a54' },
  featureGrid: { width:'100%', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:22 },
  feature: { background:'#fffdf9', border:'1px solid #eadfd3', borderRadius:18, padding:'15px 12px', minHeight:90, boxSizing:'border-box', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 5px 18px rgba(55,30,20,.045)' },
  featureIcon: { fontSize:22, marginBottom:7 },
  'feature b': { fontSize:12, color:'#332522' },
  'feature small': { marginTop:3, fontSize:10, color:'#8b7d75' },
  primary: { width:'100%', minHeight:52, border:0, borderRadius:14, background:'#7c1d25', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 8px 20px rgba(124,29,37,.18)' },
  guest: { marginTop:12, border:0, background:'transparent', color:'#7c1d25', fontSize:11, fontWeight:700, cursor:'pointer', padding:8 },
  foot: { marginTop:'auto', paddingTop:16, color:'#a09289', fontSize:9, textAlign:'center' },
  loginCard: { width:'100%', maxWidth:430, alignSelf:'center', background:'#fffdf9', borderRadius:24, padding:'24px', margin:'22px', boxSizing:'border-box', boxShadow:'0 20px 60px rgba(55,30,20,.12)', height:'fit-content' },
  back: { border:0, background:'transparent', color:'#7c1d25', fontSize:12, cursor:'pointer', padding:'0 0 16px' },
  brand: { textAlign:'center', fontSize:10, fontWeight:800, letterSpacing:'.14em', color:'#7c1d25' },
  loginTitle: { textAlign:'center', margin:'12px 0 6px', color:'#241b18', fontSize:24 },
  loginSub: { textAlign:'center', color:'#766b65', fontSize:12, lineHeight:1.5, margin:'0 0 18px' },
  form: { display:'grid', gap:14 },
  signupDetails: { display:'grid', gap:12, paddingTop:4 },
  sectionTitle: { color:'#7c1d25', fontSize:12, fontWeight:800, letterSpacing:'.04em', paddingBottom:2 },
  label: { display:'grid', gap:7, fontSize:11, fontWeight:700, color:'#241b18' },
  input: { width:'100%', height:50, boxSizing:'border-box', border:'1px solid #ded1c3', borderRadius:13, padding:'0 14px', fontSize:14, background:'#fff' },
  link: { display:'block', width:'100%', border:0, background:'none', color:'#7c1d25', fontSize:11, cursor:'pointer', padding:'14px 8px' },
  message: { background:'#fff0ed', border:'1px solid #efc9c2', color:'#8e2926', borderRadius:12, padding:10, fontSize:11, lineHeight:1.45 }
};
