'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const nav = [
  ['▦', 'Dashboard'], ['♙', 'Members'], ['◈', 'Posts'], ['⌂', 'Businesses'],
  ['⚒', 'Services'], ['🛒', 'Marketplace'], ['▣', 'Events'], ['⚑', 'Reports'], ['⌖', 'Localities'],
];

export default function AdminPage() {
  const [checking, setChecking] = useState(true), [admin, setAdmin] = useState(false);
  const [session, setSession] = useState(null), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [active, setActive] = useState('Dashboard');
  const [stats, setStats] = useState({ members: 0, posts: 0, businesses: 0, events: 0 }), [statsLoading, setStatsLoading] = useState(true), [statsError, setStatsError] = useState('');
  const [members, setMembers] = useState([]), [membersLoading, setMembersLoading] = useState(false), [memberSearch, setMemberSearch] = useState('');
  const [memberLocality, setMemberLocality] = useState('All'), [localities, setLocalities] = useState([]), [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (!supabase) { setChecking(false); setError('Supabase is not configured.'); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data?.session;
      setSession(s || null); setAdmin(s?.user?.app_metadata?.role === 'admin'); setChecking(false);
      if (s?.user?.app_metadata?.role === 'admin') { loadStats(); loadMembers(); }
    }).catch(() => { if (mounted) { setChecking(false); setError('Could not initialize admin authentication.'); } });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s || null); setAdmin(s?.user?.app_metadata?.role === 'admin');
    });
    return () => { mounted = false; data?.subscription?.unsubscribe?.(); };
  }, []);

  async function login(e) {
    e.preventDefault(); setError('');
    if (!supabase) return;
    if (!email.trim() || !password) { setError('Enter your admin email and password.'); return; }
    setBusy(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (authError) { setError(authError.message || 'Sign in failed.'); return; }
    if (data?.user?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut(); setError('This account is not authorized as an administrator.'); return;
    }
    setSession(data.session); setAdmin(true); loadStats(); loadMembers();
  }

  async function loadStats() {
    if (!supabase) return;
    setStatsLoading(true); setStatsError('');
    try {
      const [members, posts, businesses, events] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('businesses').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true })
      ]);
      const firstError = members.error || posts.error || businesses.error || events.error;
      if (firstError) throw firstError;
      setStats({ members: members.count || 0, posts: posts.count || 0, businesses: businesses.count || 0, events: events.count || 0 });
    } catch (e) { setStatsError(e?.message || 'Could not load dashboard statistics.'); }
    finally { setStatsLoading(false); }
  }

  async function loadMembers() {
    if (!supabase) return;
    setMembersLoading(true);
    const [{ data: profileRows, error: profileError }, { data: localityRows, error: localityError }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, locality_id, avatar_url, bio, is_verified, created_at').order('created_at', { ascending: false }),
      supabase.from('localities').select('id, name').order('name')
    ]);
    if (profileError) { setStatsError(profileError.message || 'Could not load members.'); setMembers([]); }
    else {
      const map = new Map((localityRows || []).map(x => [x.id, x.name]));
      setMembers((profileRows || []).map(x => ({ ...x, locality_name: map.get(x.locality_id) || 'Not set' })));
    }
    if (!localityError) setLocalities(localityRows || []);
    setMembersLoading(false);
  }

  async function toggleVerification(member) {
    if (!supabase) return;
    const next = !member.is_verified;
    const { error: updateError } = await supabase.from('profiles').update({ is_verified: next }).eq('id', member.id);
    if (updateError) { setStatsError(updateError.message || 'Could not update verification.'); return; }
    setMembers(prev => prev.map(x => x.id === member.id ? { ...x, is_verified: next } : x));
    setSelectedMember(prev => prev?.id === member.id ? { ...prev, is_verified: next } : prev);
  }

  async function logout() { await supabase?.auth.signOut(); setSession(null); setAdmin(false); }

  if (checking) return <main style={styles.loading}><div style={styles.logo}>☀</div><b>KANTHA PRANTH ADMIN</b><small>Checking administrator access…</small></main>;

  if (!session || !admin) return (
    <main style={styles.loginScreen}><div style={styles.loginCard}>
      <div style={styles.adminMark}>⌘</div><div style={styles.eyebrow}>KANTHA PRANTH</div><h1 style={styles.loginTitle}>Admin Portal</h1>
      <p style={styles.muted}>Secure administration for the Bengaluru Jain Community.</p>
      <form onSubmit={login} style={styles.form}>
        <label style={styles.label}>Admin email<input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="admin@example.com" /></label>
        <label style={styles.label}>Password<input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Your password" /></label>
        {error && <div style={styles.error}>{error}</div>}
        <button disabled={busy} style={styles.primary}>{busy ? 'Signing in…' : 'Admin Sign In'}</button>
      </form><div style={styles.security}>🔐 Access is restricted to authorized administrators.</div>
    </div></main>
  );

  const filteredMembers = members.filter(m => {
    const q = memberSearch.trim().toLowerCase();
    return (!q || (m.full_name || '').toLowerCase().includes(q) || (m.phone || '').includes(q)) &&
      (memberLocality === 'All' || m.locality_name === memberLocality);
  });

  return <main style={styles.app}>
    <aside style={styles.sidebar}>
      <div style={styles.sideBrand}><div style={styles.sideLogo}>☀</div><div><b>KANTHA PRANTH</b><small>ADMIN PORTAL</small></div></div>
      <nav style={styles.nav}>{nav.map(([icon, label]) => <button key={label} onClick={() => setActive(label)} style={{...styles.navItem, ...(active === label ? styles.navActive : {})}}><span>{icon}</span>{label}</button>)}</nav>
      <div style={styles.sideBottom}><div style={styles.adminBadge}>ADMIN</div><button onClick={logout} style={styles.logout}>↪ Sign out</button></div>
    </aside>
    <section style={styles.main}>
      <header style={styles.header}><div><div style={styles.eyebrow}>ADMINISTRATION</div><h1 style={styles.heading}>{active}</h1></div><div style={styles.profile}><span style={styles.avatar}>A</span><div><b>{session.user.email}</b><small>Administrator</small></div></div></header>

      {active === 'Dashboard' && <>
        <div style={styles.welcome}><div><div style={styles.eyebrow}>OVERVIEW</div><h2>Good to see you.</h2><p>Manage and grow the Kantha Pranth community from one place.</p></div><div style={styles.sun}>☀</div></div>
        <div style={styles.stats}>{[['👥','Members',statsLoading?'…':stats.members.toLocaleString()],['📝','Posts',statsLoading?'…':stats.posts.toLocaleString()],['🏪','Businesses',statsLoading?'…':stats.businesses.toLocaleString()],['📅','Events',statsLoading?'…':stats.events.toLocaleString()]].map(([icon,title,value]) => <div key={title} style={styles.stat}><span style={styles.statIcon}>{icon}</span><small>{title}</small><strong>{value}</strong><em>Live Supabase count</em></div>)}</div>
        {statsError && <div style={styles.errorBanner}>{statsError}</div>}
        <div style={styles.grid}><div style={styles.panel}><h3>Quick actions</h3><div style={styles.actions}>{['Review reports','Approve businesses','Manage members','Create event'].map(x => <button key={x} onClick={() => setActive(x.includes('business')?'Businesses':x.includes('member')?'Members':x.includes('event')?'Events':'Reports')} style={styles.action}>{x}<span>→</span></button>)}</div></div><div style={styles.panel}><h3>System status</h3><div style={styles.status}><span>●</span> Authentication connected</div><div style={styles.status}><span>●</span> Admin authorization enabled</div><div style={styles.status}><span>●</span> Community app connected</div></div></div>
      </>}

      {active === 'Members' && <div>
        <div style={styles.memberToolbar}><input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="Search by name or phone…" style={styles.searchInput}/><select value={memberLocality} onChange={e=>setMemberLocality(e.target.value)} style={styles.select}><option>All</option>{localities.map(x=><option key={x.id}>{x.name}</option>)}</select><button onClick={loadMembers} style={styles.refresh}>↻ Refresh</button></div>
        {statsError && <div style={styles.errorBanner}>{statsError}</div>}
        <div style={styles.memberList}>
          {membersLoading ? <div style={styles.empty}>Loading members…</div> : filteredMembers.map(m=><button key={m.id} onClick={()=>setSelectedMember(m)} style={styles.memberRow}><span style={styles.memberAvatar}>{(m.full_name||'?').charAt(0).toUpperCase()}</span><span style={styles.memberInfo}><b>{m.full_name||'Unnamed member'}</b><small>{m.locality_name} · {m.phone||'No phone'}</small></span><span style={{...styles.verifyPill,...(m.is_verified?styles.verified:{})}}>{m.is_verified?'✓ Verified':'Unverified'}</span><span style={styles.chevron}>›</span></button>)}
          {!membersLoading && filteredMembers.length === 0 && <div style={styles.empty}>No member profiles found.</div>}
        </div>
        {selectedMember && <div style={styles.modalBackdrop} onClick={()=>setSelectedMember(null)}><div style={styles.modal} onClick={e=>e.stopPropagation()}><button style={styles.modalClose} onClick={()=>setSelectedMember(null)}>×</button><div style={styles.detailAvatar}>{(selectedMember.full_name||'?').charAt(0).toUpperCase()}</div><h2>{selectedMember.full_name||'Unnamed member'}</h2><p style={styles.detailMuted}>{selectedMember.locality_name}</p><div style={styles.detailGrid}>
          <div><small>Phone</small><b>{selectedMember.phone||'Not provided'}</b></div><div><small>Status</small><b>{selectedMember.is_verified?'Verified':'Unverified'}</b></div><div><small>Joined</small><b>{new Date(selectedMember.created_at).toLocaleDateString()}</b></div><div><small>Bio</small><b>{selectedMember.bio||'No bio added'}</b></div>
        </div><button onClick={()=>toggleVerification(selectedMember)} style={styles.verifyButton}>{selectedMember.is_verified?'Remove verification':'Verify member'}</button></div></div>}
      </div>}

      {!['Dashboard','Members'].includes(active) && <div style={styles.coming}><div>◈</div><h2>{active}</h2><p>This management module is ready to be connected to the live Supabase data next.</p></div>}
    </section>
  </main>;
}

const styles = {
  loading:{minHeight:'100vh',display:'grid',placeContent:'center',justifyItems:'center',gap:10,background:'#f8f4ed',color:'#7c1d25',fontFamily:'Arial,sans-serif'},
  loginScreen:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'#f3eee6',fontFamily:'Arial,sans-serif'},
  loginCard:{width:'100%',maxWidth:430,background:'#fffdf9',padding:34,borderRadius:24,boxShadow:'0 20px 70px rgba(50,30,20,.13)',boxSizing:'border-box'},
  adminMark:{width:62,height:62,borderRadius:20,display:'grid',placeItems:'center',margin:'0 auto 15px',background:'#7c1d25',color:'#fff',fontSize:28},
  eyebrow:{fontSize:10,fontWeight:800,letterSpacing:'.16em',color:'#9a6a22'}, loginTitle:{fontSize:28,color:'#281b18',margin:'8px 0'}, muted:{fontSize:12,lineHeight:1.5,color:'#766b65'},
  form:{display:'grid',gap:14,marginTop:24}, label:{display:'grid',gap:7,fontSize:11,fontWeight:700,color:'#281b18'}, input:{height:50,border:'1px solid #ded1c3',borderRadius:13,padding:'0 14px',fontSize:14,outline:'none'}, primary:{height:52,border:0,borderRadius:13,background:'#7c1d25',color:'#fff',fontWeight:800,cursor:'pointer'}, error:{background:'#fff0ed',border:'1px solid #efc9c2',borderRadius:10,padding:10,color:'#8e2926',fontSize:11}, errorBanner:{marginTop:14,background:'#fff8e8',border:'1px solid #ead9ad',borderRadius:12,padding:'11px 14px',color:'#76551d',fontSize:11},
  security:{marginTop:18,textAlign:'center',fontSize:10,color:'#8b7d75'}, logo:{fontSize:42}, app:{minHeight:'100vh',display:'flex',background:'#f5f1ea',fontFamily:'Arial,sans-serif',color:'#281b18'}, sidebar:{width:240,background:'#fffdf9',borderRight:'1px solid #e5dbd0',display:'flex',flexDirection:'column',padding:22,boxSizing:'border-box'}, sideBrand:{display:'flex',gap:10,alignItems:'center',paddingBottom:24,borderBottom:'1px solid #eee5dc'}, sideLogo:{width:40,height:40,borderRadius:13,display:'grid',placeItems:'center',background:'#7c1d25',color:'#fff',fontSize:21},
  'sideBrand b':{fontSize:11,color:'#7c1d25',display:'block',letterSpacing:'.08em'}, 'sideBrand small':{fontSize:8,color:'#9a8b82',letterSpacing:'.12em'}, nav:{display:'grid',gap:5,marginTop:20}, navItem:{border:0,background:'transparent',textAlign:'left',padding:'11px 12px',borderRadius:11,color:'#766b65',fontSize:12,cursor:'pointer',display:'flex',gap:12,alignItems:'center'}, navActive:{background:'#f5e9e7',color:'#7c1d25',fontWeight:800}, sideBottom:{marginTop:'auto'}, adminBadge:{display:'inline-block',fontSize:8,fontWeight:900,letterSpacing:'.12em',background:'#efe4d5',color:'#7c1d25',padding:'5px 8px',borderRadius:6}, logout:{display:'block',marginTop:12,border:0,background:'transparent',color:'#7c1d25',fontSize:11,cursor:'pointer',padding:0},
  main:{flex:1,minWidth:0,padding:32,boxSizing:'border-box'}, header:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,marginBottom:26}, heading:{fontSize:28,margin:'5px 0 0'}, profile:{display:'flex',alignItems:'center',gap:9,fontSize:10}, 'profile b':{display:'block',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}, 'profile small':{display:'block',color:'#8b7d75',marginTop:3}, avatar:{width:34,height:34,borderRadius:12,display:'grid',placeItems:'center',background:'#e8d4b1',color:'#7c1d25',fontWeight:900},
  welcome:{background:'#7c1d25',color:'#fff',borderRadius:22,padding:'26px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}, 'welcome h2':{fontSize:24,margin:'7px 0'}, 'welcome p':{fontSize:12,opacity:.8,margin:0}, sun:{fontSize:48,opacity:.75}, stats:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginTop:18}, stat:{background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:18,padding:18,display:'flex',flexDirection:'column',gap:5}, statIcon:{fontSize:22}, 'stat small':{fontSize:10,color:'#8b7d75'}, 'stat strong':{fontSize:25,color:'#7c1d25'}, 'stat em':{fontSize:9,color:'#a09289',fontStyle:'normal'}, grid:{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:18,marginTop:18}, panel:{background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:18,padding:20}, 'panel h3':{margin:'0 0 14px',fontSize:14},
  actions:{display:'grid',gap:8}, action:{display:'flex',justifyContent:'space-between',border:'1px solid #eee3da',background:'#faf6f1',borderRadius:10,padding:'12px',textAlign:'left',fontSize:11,cursor:'pointer',color:'#3b2d28'}, status:{padding:'11px 0',borderBottom:'1px solid #eee5dc',fontSize:11,color:'#5f534d'}, 'status span':{color:'#3b8a56',marginRight:8},
  memberToolbar:{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}, searchInput:{flex:'1 1 280px',minWidth:220,height:44,border:'1px solid #ded1c3',borderRadius:12,padding:'0 13px',fontSize:12,background:'#fffdf9'}, select:{height:44,border:'1px solid #ded1c3',borderRadius:12,padding:'0 12px',fontSize:12,background:'#fffdf9'}, refresh:{height:44,border:0,borderRadius:12,padding:'0 14px',background:'#7c1d25',color:'#fff',fontWeight:800,cursor:'pointer'}, memberList:{display:'grid',gap:8}, memberRow:{width:'100%',display:'flex',alignItems:'center',gap:12,border:'1px solid #e7ddd3',background:'#fffdf9',borderRadius:15,padding:12,textAlign:'left',cursor:'pointer'}, memberAvatar:{width:42,height:42,borderRadius:14,display:'grid',placeItems:'center',background:'#ead7b7',color:'#7c1d25',fontWeight:900,flexShrink:0},
  memberInfo:{flex:1,minWidth:0}, 'memberInfo b':{display:'block',fontSize:12,color:'#281b18}, 'memberInfo small':{display:'block',fontSize:10,color:'#8b7d75',marginTop:4}, verifyPill:{fontSize:9,padding:'5px 8px',borderRadius:8,background:'#f1ebe5',color:'#776b63',whiteSpace:'nowrap'}, verified:{background:'#e7f4ea',color:'#28733f'}, chevron:{fontSize:20,color:'#a09289'}, empty:{padding:50,textAlign:'center',color:'#8b7d75',background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:18},
  modalBackdrop:{position:'fixed',inset:0,background:'rgba(30,20,15,.45)',display:'grid',placeItems:'center',padding:20,zIndex:50}, modal:{position:'relative',width:'100%',maxWidth:480,background:'#fffdf9',borderRadius:22,padding:28,boxSizing:'border-box',boxShadow:'0 20px 80px rgba(0,0,0,.25)'}, modalClose:{position:'absolute',right:16,top:12,border:0,background:'transparent',fontSize:26,color:'#766b65',cursor:'pointer'}, detailAvatar:{width:62,height:62,borderRadius:20,display:'grid',placeItems:'center',background:'#7c1d25',color:'#fff',fontSize:24,fontWeight:900}, detailMuted:{fontSize:11,color:'#8b7d75'}, detailGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,margin:'20px 0'},
  'detailGrid div':{background:'#f8f4ed',borderRadius:12,padding:12}, 'detailGrid small':{display:'block',fontSize:9,color:'#8b7d75',marginBottom:5}, 'detailGrid b':{display:'block',fontSize:11,color:'#332522',lineHeight:1.4}, verifyButton:{width:'100%',height:46,border:0,borderRadius:12,background:'#7c1d25',color:'#fff',fontWeight:800,cursor:'pointer'},
  coming:{background:'#fffdf9',border:'1px solid #e7ddd3',borderRadius:22,padding:50,textAlign:'center',minHeight:300}, 'coming h2':{color:'#7c1d25'}, 'coming p':{fontSize:12,color:'#766b65'}
};
