'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const nav = [
  ['▦', 'Dashboard'],
  ['♙', 'Members'],
  ['◈', 'Posts'],
  ['⌂', 'Businesses'],
  ['⚒', 'Services'],
  ['🛒', 'Marketplace'],
  ['▣', 'Events'],
  ['⚑', 'Reports'],
  ['⌖', 'Localities'],
];

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState('Dashboard');
  const [stats, setStats] = useState({ members: 0, posts: 0, businesses: 0, events: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      setError('Supabase is not configured.');
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data?.session;
      setSession(s || null);
      setAdmin(s?.user?.app_metadata?.role === 'admin');
      setChecking(false);
    }).catch(() => {
      if (mounted) {
        setChecking(false);
        setError('Could not initialize admin authentication.');
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s || null);
      setAdmin(s?.user?.app_metadata?.role === 'admin');
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  async function login(e) {
    e.preventDefault();
    setError('');

    if (!supabase) return;
    if (!email.trim() || !password) {
      setError('Enter your admin email and password.');
      return;
    }

    setBusy(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    setBusy(false);

    if (authError) {
      setError(authError.message || 'Sign in failed.');
      return;
    }

    if (data?.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('This account is not authorized as an administrator.');
      return;
    }

    setSession(data.session);
    setAdmin(true);
    loadStats();
  }

  async function loadStats() {
    if (!supabase) return;
    setStatsLoading(true);
    setStatsError('');

    try {
      const [members, posts, businesses, events] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true })
      ]);

      const firstError = members.error || posts.error || businesses.error || events.error;
      if (firstError) throw firstError;

      setStats({
        members: members.count || 0,
        posts: posts.count || 0,
        businesses: businesses.count || 0,
        events: events.count || 0
      });
    } catch (e) {
      setStatsError(e?.message || 'Could not load dashboard statistics.');
    } finally {
      setStatsLoading(false);
    }
  }

  async function logout() {
    await supabase?.auth.signOut();
    setSession(null);
    setAdmin(false);
  }

  if (checking) {
    return <main style={styles.loading}><div style={styles.logo}>☀</div><b>KANTHA PRANTH ADMIN</b><small>Checking administrator access…</small></main>;
  }

  if (!session || !admin) {
    return (
      <main style={styles.loginScreen}>
        <div style={styles.loginCard}>
          <div style={styles.adminMark}>⌘</div>
          <div style={styles.eyebrow}>KANTHA PRANTH</div>
          <h1 style={styles.loginTitle}>Admin Portal</h1>
          <p style={styles.muted}>Secure administration for the Bengaluru Jain Community.</p>
          <form onSubmit={login} style={styles.form}>
            <label style={styles.label}>Admin email
              <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="admin@example.com" />
            </label>
            <label style={styles.label}>Password
              <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Your password" />
            </label>
            {error && <div style={styles.error}>{error}</div>}
            <button disabled={busy} style={styles.primary}>{busy ? 'Signing in…' : 'Admin Sign In'}</button>
          </form>
          <div style={styles.security}>🔐 Access is restricted to authorized administrators.</div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.sideBrand}>
          <div style={styles.sideLogo}>☀</div>
          <div><b>KANTHA PRANTH</b><small>ADMIN PORTAL</small></div>
        </div>

        <nav style={styles.nav}>
          {nav.map(([icon, label]) => (
            <button key={label} onClick={() => setActive(label)} style={{...styles.navItem, ...(active === label ? styles.navActive : {})}}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>

        <div style={styles.sideBottom}>
          <div style={styles.adminBadge}>ADMIN</div>
          <button onClick={logout} style={styles.logout}>↪ Sign out</button>
        </div>
      </aside>

      <section style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>ADMINISTRATION</div>
            <h1 style={styles.heading}>{active}</h1>
          </div>
          <div style={styles.profile}><span style={styles.avatar}>A</span><div><b>{session.user.email}</b><small>Administrator</small></div></div>
        </header>

        {active === 'Dashboard' ? (
          <>
            <div style={styles.welcome}><div><div style={styles.eyebrow}>OVERVIEW</div><h2>Good to see you.</h2><p>Manage and grow the Kantha Pranth community from one place.</p></div><div style={styles.sun}>☀</div></div>
            <div style={styles.stats}>
              {[
                ['👥', 'Members', statsLoading ? '…' : stats.members.toLocaleString(), 'Live Supabase count'],
                ['📝', 'Posts', statsLoading ? '…' : stats.posts.toLocaleString(), 'Live Supabase count'],
                ['🏪', 'Businesses', statsLoading ? '…' : stats.businesses.toLocaleString(), 'Live Supabase count'],
                ['📅', 'Events', statsLoading ? '…' : stats.events.toLocaleString(), 'Live Supabase count']
              ].map(([icon, title, value, note]) => (
                <div key={title} style={styles.stat}><span style={styles.statIcon}>{icon}</span><small>{title}</small><strong>{value}</strong><em>{note}</em></div>
              ))}
            </div>
            {statsError && <div style={styles.errorBanner}>{statsError}</div>}
            <div style={styles.grid}>
              <div style={styles.panel}><h3>Quick actions</h3><div style={styles.actions}>{['Review reports','Approve businesses','Manage members','Create event'].map(x => <button key={x} onClick={() => setActive(x.includes('business') ? 'Businesses' : x.includes('member') ? 'Members' : x.includes('event') ? 'Events' : 'Reports')} style={styles.action}>{x}<span>→</span></button>)}</div></div>
              <div style={styles.panel}><h3>System status</h3><div style={styles.status}><span>●</span> Authentication connected</div><div style={styles.status}><span>●</span> Admin authorization enabled</div><div style={styles.status}><span>●</span> Community app connected</div></div>
            </div>
          </>
        ) : (
          <div style={styles.coming}><div>◈</div><h2>{active}</h2><p>This management module is ready to be connected to the live Supabase data next.</p></div>
        )}
      </section>
    </main>
  );
}

const styles = {
  loading:{minHeight:'100vh',display:'grid',placeContent:'center',justifyItems:'center',gap:10,background:'#f8f4ed',color:'#7c1d25',fontFamily:'Arial,sans-serif'},
  loginScreen:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'#f3eee6',fontFamily:'Arial,sans-serif'},
  loginCard:{width:'100%',maxWidth:430,background:'#fffdf9',padding:34,borderRadius:24,boxShadow:'0 20px 70px rgba(50,30,20,.13)',boxSizing:'border-box'},
  adminMark:{width:62,height:62,borderRadius:20,display:'grid',placeItems:'center',margin:'0 auto 15px',background:'#7c1d25',color:'#fff',fontSize:28},
  eyebrow:{fontSize:10,fontWeight:800,letterSpacing:'.16em',color:'#9a6a22'},
  loginTitle:{fontSize:28,color:'#281b18',margin:'8px 0'},
  muted:{fontSize:12,lineHeight:1.5,color:'#766b65'},
  form:{display:'grid',gap:14,marginTop:24},
  label:{display:'grid',gap:7,fontSize:11,fontWeight:700,color:'#281b18'},
  input:{height:50,border:'1px solid #ded1c3',borderRadius:13,padding:'0 14px',fontSize:14,outline:'none'},
  primary:{height:52,border:0,borderRadius:13,background:'#7c1d25',color:'#fff',fontWeight:800,cursor:'pointer'},
  error:{background:'#fff0ed',border:'1px solid #efc9c2',borderRadius:10,padding:10,color:'#8e2926',fontSize:11},
  errorBanner:{marginTop:14,background:'#fff8e8',border:'1px solid #ead9ad',borderRadius:12,padding:'11px 14px',color:'#76551d',fontSize:11},
  security:{marginTop:18,textAlign:'center',fontSize:10,color:'#8b7d75'},
  logo:{fontSize:42},
  app:{minHeight:'100vh',display:'flex',background:'#f5f1ea',fontFamily:'Arial,sans-serif',color:'#281b18'},
  sidebar:{width:240,background:'#fffdf9',borderRight:'1px solid #e5dbd0',display:'flex',flexDirection:'column',padding:22,boxSizing:'border-box'},
  sideBrand:{display:'flex',gap:10,alignItems:'center',paddingBottom:24,borderBottom:'1px solid #eee5dc'},
  sideLogo:{width:40,height:40,borderRadius:13,display:'grid',placeItems:'center',background:'#7c1d25',color:'#fff',fontSize:21},
  'sideBrand b':{fontSize:11,color:'#7c1d25',display:'block',letterSpacing:'.08em'},
  'sideBrand small':{fontSize:8,color:'#9a8b82',letterSpacing:'.12em'},
  nav:{display:'grid',gap:5,marginTop:20},
  navItem:{border:0,background:'transparent',textAlign:'left',padding:'11px 12px',borderRadius:11,color:'#766b65',fontSize:12,cursor:'pointer',display:'flex',gap:12,alignItems:'center'},
  navActive:{background:'#f5e9e7',color:'#7c1d25',fontWeight:800},
  sideBottom:{marginTop:'auto'},
  adminBadge:{display:'inline-block',fontSize:8,fontWeight:900,letterSpacing:'.12em',background:'#efe4d5',color:'#7c1d25',padding:'5px 8px',borderRadius:6},
  logout:{display:'block',marginTop:12,border:0,background:'transparent',color:'#7c1d25',fontSize:11,cursor:'pointer',padding:0},
  main:{flex:1,minWidth:0,padding:32,boxSizing:'border-box'},
  header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,marginBottom:26},
  heading:{fontSize:28,margin:'5px 0 0'},
  profile:{display:'flex',alignItems:'center',gap:9,fontSize:10},
  'profile b':{display:'block',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'},
  'profile small':{display:'block',color:'#8b7d75',marginTop:3},
  avatar:{width:34,height:34,borderRadius:12,display:'grid',placeItems:'center',background:'#e8d4b1',color:'#7c1d25',fontWeight:900},
  welcome:{background:'#7c1d25',color:'#fff',borderRadius:22,padding:'26px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'},
  'welcome h2':{fontSize:24,margin:'7px 0'},
  'welcome p':{fontSize:12,opacity:.8,margin:0},
  sun:{fontSize:48,opacity:.75},
  stats:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginTop:18},
  stat:{background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:18,padding:18,display:'flex',flexDirection:'column',gap:5},
  statIcon:{fontSize:22},
  'stat small':{fontSize:10,color:'#8b7d75'},
  'stat strong':{fontSize:25,color:'#7c1d25'},
  'stat em':{fontSize:9,color:'#a09289',fontStyle:'normal'},
  grid:{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:18,marginTop:18},
  panel:{background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:18,padding:20},
  'panel h3':{margin:'0 0 14px',fontSize:14},
  actions:{display:'grid',gap:8},
  action:{display:'flex',justifyContent:'space-between',border:'1px solid #eee3da',background:'#faf6f1',borderRadius:10,padding:'12px',textAlign:'left',fontSize:11,cursor:'pointer',color:'#3b2d28'},
  status:{padding:'11px 0',borderBottom:'1px solid #eee5dc',fontSize:11,color:'#5f534d'},
  'status span':{color:'#3b8a56',marginRight:8},
  coming:{background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:22,padding:50,textAlign:'center',minHeight:300},
  'coming h2':{color:'#7c1d25'},
  'coming p':{fontSize:12,color:'#766b65'}
};
