'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const localities = ['Nagarbhavi', 'Chandra Layout', 'Vijayanagar', 'Rajajinagar', 'Jayanagar', 'Basavanagudi', 'Malleshwaram', 'Indiranagar', 'Yelahanka', 'Whitefield'];

const initialPosts = [
  { id: 1, type: 'Announcement', author: 'Nagarbhavi Jain Community', time: '2h', area: 'Nagarbhavi', title: 'Jain Community Meeting', text: 'Community meeting this Sunday at 5 PM. Everyone is welcome.', likes: 42, comments: 8, avatar: 'NJ', featured: true },
  { id: 2, type: 'Help', author: 'Jain Youth Bengaluru', time: '5h', area: 'Nagarbhavi', title: 'Blood Donation Camp', text: 'Blood donation camp this Sunday at Shree Jain Temple, Nagarbhavi. 9 AM – 2 PM.', likes: 76, comments: 12, avatar: 'JY' },
  { id: 3, type: 'Buy & Sell', author: 'Priya Jain', time: '1d', area: 'Nagarbhavi', title: 'Study table for sale', text: 'Used study table in good condition. ₹2,500. Pickup from Nagarbhavi.', likes: 9, comments: 3, avatar: 'PJ' },
];

const initialListings = [
  { id: 1, title: 'Study Table', price: '₹2,500', area: 'Nagarbhavi', condition: 'Good condition', category: 'Furniture', emoji: '🪑' },
  { id: 2, title: 'Sofa Set', price: '₹8,000', area: 'Chandra Layout', condition: 'Used', category: 'Furniture', emoji: '🛋️' },
  { id: 3, title: 'iPhone 13', price: '₹28,000', area: 'Nagarbhavi', condition: 'Good condition', category: 'Electronics', emoji: '📱' },
];

const services = [
  { name: 'ABC Jain & Associates', category: 'Chartered Accountant', area: 'Vijayanagar', rating: '5.0', verified: true, icon: '⚖️' },
  { name: 'Jain Family Clinic', category: 'Healthcare', area: 'Nagarbhavi', rating: '4.9', verified: true, icon: '🩺' },
  { name: 'Shree Jain Caterers', category: 'Catering', area: 'Rajajinagar', rating: '4.8', verified: false, icon: '🍽️' },
  { name: 'Jain Travels Bengaluru', category: 'Travel', area: 'Vijayanagar', rating: '4.7', verified: true, icon: '✈️' },
];

const events = [
  { id: 1, title: 'Jain Community Meet', date: '12 Oct', time: '6:00 PM', area: 'Nagarbhavi', tag: 'Community', emoji: '🙏' },
  { id: 2, title: 'Blood Donation Camp', date: '20 Oct', time: '9:00 AM', area: 'Nagarbhavi', tag: 'Help', emoji: '🩸' },
  { id: 3, title: 'Youth Networking Evening', date: '27 Oct', time: '5:30 PM', area: 'Vijayanagar', tag: 'Youth', emoji: '🤝' },
];

const quickActions = [
  ['Community', '📰'], ['Family', '👨‍👩‍👧‍👦'], ['Events', '📅'], ['Buy & Sell', '🛒'], ['Services', '🛠️'], ['Help', '🆘'],
];

function Avatar({ initials, large = false }) { return <div className={`avatar ${large ? 'avatar-lg' : ''}`}>{initials}</div>; }

function Pill({ children, tone = '' }) { return <span className={`pill ${tone}`}>{children}</span>; }

export default function Home() {
  const [active, setActive] = useState('home');
  const [families, setFamilies] = useState([]);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [familySearch, setFamilySearch] = useState('');
  const [familyBusy, setFamilyBusy] = useState(false);
  const [locality, setLocality] = useState('Nagarbhavi');
  const [posts, setPosts] = useState(initialPosts);
  const [listings, setListings] = useState(initialListings);
  const [showPost, setShowPost] = useState(false);
  const [showListing, setShowListing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authBusy, setAuthBusy] = useState(false);
  const [userName, setUserName] = useState('');
  const [profileLocality, setProfileLocality] = useState('Nagarbhavi');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('kp-demo') || '{}');
      if (saved.locality) setLocality(saved.locality);
      if (saved.posts) setPosts(saved.posts);
      if (saved.listings) setListings(saved.listings);
      if (saved.userName) setUserName(saved.userName);
      if (saved.profileLocality) setProfileLocality(saved.profileLocality);
      if (!supabase && saved.demoAuthenticated) setAuthenticated(true);
    } catch {}

    let unsubscribe = () => {};
    if (supabase) {
      supabase.auth.getSession().then(async ({ data }) => {
        if (data?.session) {
          setAuthenticated(true);
          setGuestMode(false);
          await loadUserProfile(data.session);
          await loadFamilies();
        } else {
          setAuthenticated(false);
          setGuestMode(false);
          setNeedsProfile(false);
        }
        setAuthChecked(true);
      }).catch(() => {
        setAuthenticated(false);
        setNeedsProfile(false);
        setAuthChecked(true);
      });

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setAuthenticated(!!session);
        setGuestMode(false);
        if (session) {
          await loadUserProfile(session);
          await loadFamilies();
        }
      });
      unsubscribe = () => listener?.subscription?.unsubscribe?.();
    } else {
      setAuthChecked(true);
    }
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem('kp-demo', JSON.stringify({
      locality, posts, listings, userName, profileLocality,
      demoAuthenticated: authenticated
    }));
  }, [locality, posts, listings, userName, profileLocality, authenticated]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredListings = useMemo(() => listings.filter(x => `${x.title} ${x.category} ${x.area}`.toLowerCase().includes(search.toLowerCase())), [listings, search]);
  const filteredServices = useMemo(() => services.filter(x => `${x.name} ${x.category} ${x.area}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const filteredFamilies = useMemo(() => families.filter(f => `${f.family_name} ${f.localities?.name || ''}`.toLowerCase().includes(familySearch.toLowerCase())), [families, familySearch]);

  async function loadUserProfile(session) {
    const user = session?.user;
    if (!user) return;

    const metadataName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    if (metadataName) setUserName(metadataName);

    if (!supabase) {
      if (!metadataName) setNeedsProfile(true);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, locality_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.full_name) {
      setUserName(profile.full_name);
    }

    if (profile?.locality_id) {
      const { data: loc } = await supabase
        .from('localities')
        .select('name')
        .eq('id', profile.locality_id)
        .maybeSingle();
      if (loc?.name) {
        setLocality(loc.name);
        setProfileLocality(loc.name);
      }
    }

    setNeedsProfile(!profile?.full_name);
  }

  async function loadFamilies() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('families')
      .select('id, family_name, locality_id, visibility, owner_id, localities(name), family_members(id, member_name, relationship)')
      .order('created_at', { ascending: false });
    if (!error && data) setFamilies(data);
  }

  async function createFamily(e) {
    e.preventDefault();
    if (!supabase) return setToast('Family Directory requires a signed-in account');
    const fd = new FormData(e.currentTarget);
    const familyName = fd.get('family_name')?.toString().trim();
    const localityName = fd.get('locality')?.toString();
    const visibility = fd.get('visibility')?.toString() || 'community';
    const membersText = fd.get('members')?.toString().trim() || '';
    if (!familyName) return setToast('Enter a family name');

    setFamilyBusy(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) {
      setFamilyBusy(false);
      return setToast('Please sign in to create a family');
    }

    const { data: localityRow } = await supabase.from('localities').select('id').eq('name', localityName).single();
    if (!localityRow) {
      setFamilyBusy(false);
      return setToast('Could not find that locality');
    }

    const { data: family, error } = await supabase.from('families').insert({
      owner_id: user.id,
      family_name: familyName,
      locality_id: localityRow.id,
      visibility,
    }).select('id, family_name, locality_id, visibility, owner_id').single();

    if (error) {
      setFamilyBusy(false);
      return setToast(error.message || 'Could not create family');
    }

    const members = membersText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
      const parts = line.split(/\s+[—|-]\s+/);
      return { family_id: family.id, member_name: parts[0].trim(), relationship: (parts[1] || 'Family member').trim() };
    });

    if (members.length) {
      const { error: memberError } = await supabase.from('family_members').insert(members);
      if (memberError) {
        await supabase.from('families').delete().eq('id', family.id);
        setFamilyBusy(false);
        return setToast(memberError.message || 'Could not add family members');
      }
    }

    setFamilyBusy(false);
    setShowFamilyForm(false);
    await loadFamilies();
    setToast('Family added to the directory');
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setToast('Enter a valid email address');
    }
    if (password.length < 8) {
      return setToast('Password must be at least 8 characters');
    }

    setAuthBusy(true);

    if (!supabase) {
      setAuthenticated(true);
      setNeedsProfile(true);
      setShowLogin(false);
      setAuthBusy(false);
      return setToast('Demo account created');
    }

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      setAuthBusy(false);

      if (error) return setToast(error.message || 'Could not create account');

      if (!data.session) {
        return setToast('Account created. Check your email to confirm, then sign in.');
      }

      setAuthenticated(true);
      setShowLogin(false);
      setNeedsProfile(true);
      setToast('Account created');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setAuthBusy(false);

    if (error) return setToast(error.message || 'Could not sign in');

    setAuthenticated(true);
    setShowLogin(false);
    await loadUserProfile(data.session);
    setToast('Welcome back to Kantha Pranth');
  }

  async function saveProfile(e) {
    e.preventDefault();
    const cleanName = userName.trim();

    if (cleanName.length < 2) return setToast('Please enter your full name');
    if (!profileLocality) return setToast('Please select your locality');

    setProfileBusy(true);

    if (!supabase) {
      setLocality(profileLocality);
      setNeedsProfile(false);
      setProfileBusy(false);
      return setToast('Profile saved');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setProfileBusy(false);
      return setToast('Please sign in again');
    }

    const { data: localityRow, error: localityError } = await supabase
      .from('localities')
      .select('id')
      .eq('name', profileLocality)
      .single();

    if (localityError || !localityRow) {
      setProfileBusy(false);
      return setToast('Could not find that locality');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: cleanName,
        locality_id: localityRow.id,
      });

    if (profileError) {
      setProfileBusy(false);
      return setToast(profileError.message || 'Could not save your profile');
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: cleanName, name: cleanName },
    });

    setProfileBusy(false);

    if (metadataError) {
      console.warn('Profile saved but metadata update failed:', metadataError.message);
    }

    setLocality(profileLocality);
    setNeedsProfile(false);
    setToast('Welcome to Kantha Pranth');
  }


  function continueAsGuest() {
    setAuthenticated(true);
    setGuestMode(true);
    setNeedsProfile(false);
    setUserName('');
    setShowLogin(false);
    setToast('You are browsing as a guest');
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setAuthenticated(false);
    setGuestMode(false);
    setUserName('');
    localStorage.removeItem('kp-demo');
    setActive('home');
  }


  function addPost(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title')?.toString().trim();
    const text = fd.get('text')?.toString().trim();
    const type = fd.get('type')?.toString() || 'Discussion';
    if (!title || !text) return setToast('Add a title and message');
    setPosts([{ id: Date.now(), type, author: userName || 'Community Member', time: 'now', area: locality, title, text, likes: 0, comments: 0, avatar: initialsFromName(userName || 'Community Member') }, ...posts]);
    setShowPost(false); setActive('community'); setToast('Post published to the community');
  }

  function addListing(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title')?.toString().trim();
    const price = fd.get('price')?.toString().trim();
    const category = fd.get('category')?.toString() || 'Other';
    if (!title || !price) return setToast('Add a title and price');
    setListings([{ id: Date.now(), title, price: `₹${price}`, area: locality, condition: 'Good condition', category, emoji: category === 'Electronics' ? '📱' : category === 'Furniture' ? '🪑' : '📦' }, ...listings]);
    setShowListing(false); setActive('marketplace'); setToast('Your listing is live');
  }

  const nav = [
    ['home', '⌂', 'Home'], ['community', '◎', 'Community'], ['family', '👨‍👩‍👧‍👦', 'Family'], ['marketplace', '🛒', 'Market'], ['profile', '◉', 'Profile'],
  ];

  if (!authChecked) return <AuthScreen loading />;
  if (!authenticated) return <AuthScreen onLogin={() => setShowLogin(true)} onGuest={continueAsGuest} />;

  if (needsProfile) {
    return <ProfileSetupScreen
      userName={userName}
      setUserName={setUserName}
      profileLocality={profileLocality}
      setProfileLocality={setProfileLocality}
      onSubmit={saveProfile}
      busy={profileBusy}
    />;
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">☀</div>
          <div><div className="brand">KANTHA PRANTH</div><div className="brand-sub">Jain Community · Bengaluru</div></div>
        </div>
        <div className="top-actions"><button className="icon-btn" onClick={() => setToast('Notifications are coming in the next build')}>♧</button><button className="avatar mini" onClick={() => setActive('profile')}>{initialsFromName(userName || 'Guest')}</button></div>
      </header>

      <section className="content">
        <div className="location-row"><button className="location-pill">⌖ {locality} <span>⌄</span></button><button className="soft-btn" onClick={() => setShowLogin(true)}>Sign in</button></div>

        {active === 'home' && <>
          <section className="hero">
            <div><p className="eyebrow">YOUR COMMUNITY, CLOSER</p><h1>Good evening,<br /><span>{userName || 'there'}</span> 👋</h1><p className="hero-copy">Discover what's happening around your Jain community in Bengaluru.</p></div>
            <div className="hero-symbol">🙏</div>
          </section>
          <div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people, services, events..." /></div>
          <div className="quick-grid">{quickActions.map(([label, icon]) => <button key={label} className="quick-card" onClick={() => setActive(label === 'Community' ? 'community' : label === 'Family' ? 'family' : label === 'Buy & Sell' ? 'marketplace' : label === 'Services' || label === 'Businesses' ? 'services' : label === 'Events' ? 'events' : 'help')}><span>{icon}</span><b>{label}</b></button>)}</div>
          <SectionHeader title="Latest updates" action="View all" onClick={() => setActive('community')} />
          {posts.slice(0, 2).map(post => <PostCard key={post.id} post={post} onToast={setToast} />)}
          <SectionHeader title="Coming up" action="All events" onClick={() => setActive('events')} />
          <EventCard event={events[0]} onClick={() => setSelectedEvent(events[0])} />
        </>}

        {active === 'community' && <Page title="Community" subtitle="What's happening around Bengaluru?" action={<button className="primary small" onClick={() => setShowPost(true)}>＋ Post</button>}><div className="filter-row"><Pill tone="active">All</Pill><Pill>Announcements</Pill><Pill>Help</Pill><Pill>Local</Pill></div>{posts.map(post => <PostCard key={post.id} post={post} onToast={setToast} />)}</Page>}

        {active === 'family' && <Page title="Family Directory" subtitle="Connect with Jain families in your community" action={authenticated && !guestMode && supabase ? <button className="primary small" onClick={() => setShowFamilyForm(true)}>＋ Add family</button> : null}>
          <div className="directory-banner"><div className="directory-icon">👨‍👩‍👧‍👦</div><div><b>A community family directory</b><p>Choose what your family shares. Phone numbers and private details are never displayed by default.</p></div></div>
          <div className="search"><span>⌕</span><input value={familySearch} onChange={e => setFamilySearch(e.target.value)} placeholder="Search family or locality" /></div>
          {!supabase && <div className="info-banner"><b>Demo mode</b><p>Connect Supabase to create and store real family profiles.</p></div>}
          {supabase && (!authenticated || guestMode) && <div className="info-banner"><b>Sign in required</b><p>Sign in to view the private community directory and add your family.</p></div>}
          {filteredFamilies.length ? filteredFamilies.map(f => <button className="family-card" key={f.id} onClick={() => setSelectedFamily(f)}><div className="family-avatar">👨‍👩‍👧‍👦</div><div className="family-info"><h3>{f.family_name}</h3><p>⌖ {f.localities?.name || 'Bengaluru'}</p><small>{f.family_members?.length || 0} family member{(f.family_members?.length || 0) === 1 ? '' : 's'} · {f.visibility === 'private' ? 'Private' : 'Community visible'}</small></div><span className="chevron">›</span></button>) : <div className="empty-state"><div>👨‍👩‍👧‍👦</div><h3>No families found</h3><p>Be one of the first families to join the directory.</p>{authenticated && !guestMode && supabase && <button className="primary" onClick={() => setShowFamilyForm(true)}>Add my family</button>}</div>}
        </Page>}

        {active === 'marketplace' && <Page title="Buy & Sell" subtitle={`${filteredListings.length} listings around Bengaluru`} action={<button className="primary small" onClick={() => setShowListing(true)}>＋ Sell</button>}><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marketplace" /></div><div className="category-scroll">{['All','Property','Vehicles','Electronics','Furniture','Books','Business'].map(x => <Pill key={x} tone={x === 'All' ? 'active' : ''}>{x}</Pill>)}</div><div className="listing-grid">{filteredListings.map(item => <button className="listing" key={item.id} onClick={() => setSelectedListing(item)}><div className="listing-img">{item.emoji}</div><div className="listing-body"><div className="listing-title">{item.title}</div><div className="price">{item.price}</div><div className="meta">⌖ {item.area} · {item.condition}</div></div></button>)}</div></Page>}

        {active === 'services' && <Page title="Services" subtitle="Trusted people & businesses in your community"><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors, CA, lawyers..." /></div><div className="service-grid">{['Doctors','CA','Lawyers','Education','Home Services','Travel','Catering','Other'].map(x => <button className="service-cat" key={x}><span>{x === 'Doctors' ? '🩺' : x === 'CA' ? '📊' : x === 'Lawyers' ? '⚖️' : x === 'Travel' ? '✈️' : '✦'}</span><b>{x}</b></button>)}</div><SectionHeader title="Featured services" action="See all" />{filteredServices.map(s => <ServiceCard key={s.name} service={s} onToast={setToast} />)}</Page>}

        {active === 'events' && <Page title="Events" subtitle="Meet, celebrate and contribute"><div className="event-tabs"><Pill tone="active">Upcoming</Pill><Pill>My events</Pill><Pill>Past</Pill></div>{events.map(e => <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} />)}</Page>}

        {active === 'profile' && <Page title="My Profile" subtitle="Your community identity"><div className="profile-card"><Avatar initials={initialsFromName(userName || 'Guest')} large /><h2>{userName || 'Guest Member'}</h2><p>Kantha Pranth member · {locality}</p><div className="profile-stats"><div><b>{posts.filter(p => p.author === (userName || 'Community Member')).length}</b><span>Posts</span></div><div><b>0</b><span>Listings</span></div><div><b>1</b><span>Events</span></div></div></div><div className="settings-list">{['Edit profile','My listings','Saved posts','Privacy & visibility','Help & support'].map(x => <button key={x} onClick={() => setToast(`${x} will be available in the next build`)}><span>{x}</span><b>›</b></button>)}</div>{authenticated ? <button className="outline full" onClick={signOut}>Sign out</button> : <button className="outline full" onClick={() => setShowLogin(true)}>Sign in / Create account</button>}</Page>}

        {active === 'help' && <Page title="Community Help" subtitle="Support one another"><div className="help-grid">{[['🩸','Blood requirement'],['🔎','Lost & found'],['🤝','Volunteer'],['❤️','Support request']].map(([i,x]) => <button key={x} className="help-card" onClick={() => setToast('Help request flow coming next') }><span>{i}</span><b>{x}</b><small>Post to your local community</small></button>)}</div><div className="info-banner"><b>Safety first</b><p>Important help requests will be moderated. Never share sensitive personal or financial information publicly.</p></div></Page>}
      </section>

      <button className="fab" onClick={() => setShowPost(true)}>＋</button>
      <nav className="bottom-nav">{nav.map(([id, icon, label]) => <button key={id} className={active === id ? 'selected' : ''} onClick={() => setActive(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>

      {showPost && <Modal title="Create a community post" close={() => setShowPost(false)}><form onSubmit={addPost} className="form"><label>Post type<select name="type" defaultValue="Discussion"><option>Discussion</option><option>Announcement</option><option>Local Information</option><option>Help</option><option>Buy & Sell</option></select></label><label>Title<input name="title" placeholder="What would you like to share?" /></label><label>Message<textarea name="text" rows="4" placeholder="Add details for the community..." /></label><button className="primary full">Publish post</button></form></Modal>}
      {showListing && <Modal title="Sell something" close={() => setShowListing(false)}><form onSubmit={addListing} className="form"><label>Product name<input name="title" placeholder="e.g. Study table" /></label><label>Price<input name="price" inputMode="numeric" placeholder="2500" /></label><label>Category<select name="category"><option>Furniture</option><option>Electronics</option><option>Books</option><option>Vehicles</option><option>Property</option><option>Other</option></select></label><button className="primary full">Publish listing</button></form></Modal>}
      {showFamilyForm && <Modal title="Add your family" close={() => setShowFamilyForm(false)}><form onSubmit={createFamily} className="form"><div className="info-banner"><b>Privacy first</b><p>Your family is visible only to signed-in community members when you choose “Community”. You can keep it private.</p></div><label>Family name<input name="family_name" placeholder="e.g. Jain Family" required /></label><label>Locality<select name="locality" defaultValue={locality}>{localities.map(x => <option key={x}>{x}</option>)}</select></label><label>Visibility<select name="visibility" defaultValue="community"><option value="community">Community members</option><option value="private">Private — only me</option></select></label><label>Family members<small className="field-help">One member per line. Example: Rajesh Jain — Father</small><textarea name="members" rows="5" placeholder="Rajesh Jain — Father&#10;Sunita Jain — Mother&#10;Aarav Jain — Son"></textarea></label><button className="primary full" disabled={familyBusy}>{familyBusy ? 'Saving…' : 'Add family to directory'}</button></form></Modal>}
      {selectedFamily && <Modal title={selectedFamily.family_name} close={() => setSelectedFamily(null)}><div className="family-detail-head"><div className="family-avatar large">👨‍👩‍👧‍👦</div><div><h2>{selectedFamily.family_name}</h2><p>⌖ {selectedFamily.localities?.name || 'Bengaluru'}</p></div></div><div className="member-list">{(selectedFamily.family_members || []).map(m => <div className="member-row" key={m.id}><Avatar initials={initialsFromName(m.member_name)} /><div><b>{m.member_name}</b><span>{m.relationship}</span></div></div>)}</div><div className="info-banner"><b>Privacy</b><p>Contact details are not shown here. A future connection request feature can let families connect without exposing phone numbers.</p></div></Modal>}
      {showLogin && <Modal title={authMode === 'signup' ? 'Create your account' : 'Welcome back'} close={() => setShowLogin(false)}>
        <form onSubmit={handleEmailAuth} className="form">
          <div className="login-intro">
            <div className="brand-mark big">☀</div>
            <p>{authMode === 'signup' ? 'Create a free Kantha Pranth account with your email.' : 'Sign in to your Jain community account.'}</p>
          </div>
          <label>Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label>Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
          </label>
          <button className="primary full" disabled={authBusy}>
            {authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create free account' : 'Sign in'}
          </button>
          <button
            type="button"
            className="text-btn"
            onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
          >
            {authMode === 'signup' ? 'Already have an account? Sign in' : 'New to Kantha Pranth? Create an account'}
          </button>
          <div className="or">or</div>
          <button type="button" className="outline full" onClick={continueAsGuest}>Continue as guest</button>
          <small className="auth-note">
            {authMode === 'signup' ? 'You may need to confirm your email before signing in.' : 'Use the same email and password you registered with.'}
          </small>
        </form>
      </Modal>}
      {selectedEvent && <Modal title={selectedEvent.title} close={() => setSelectedEvent(null)}><div className="detail-hero">{selectedEvent.emoji}</div><Pill>{selectedEvent.tag}</Pill><h2>{selectedEvent.date} · {selectedEvent.time}</h2><p>📍 {selectedEvent.area}, Bengaluru</p><p>Join the community for a meaningful evening of connection, learning and fellowship.</p><button className="primary full" onClick={() => { setSelectedEvent(null); setToast('You are marked as interested'); }}>Interested</button></Modal>}
      {selectedListing && <Modal title={selectedListing.title} close={() => setSelectedListing(null)}><div className="detail-hero listing-detail">{selectedListing.emoji}</div><div className="price huge">{selectedListing.price}</div><p>📍 {selectedListing.area} · {selectedListing.condition}</p><p>Listed by a Kantha Pranth community member.</p><button className="primary full" onClick={() => { setSelectedListing(null); setToast('Seller contact flow coming next'); }}>Message seller</button></Modal>}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}


function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'KP';
  return parts.slice(0, 2).map(x => x[0]).join('').toUpperCase();
}

function AuthScreen({ loading = false, onLogin, onGuest }) {
  return <main className="auth-screen">
    <div className="auth-card">
      <div className="auth-logo">☀</div>
      <p className="eyebrow">JAIN COMMUNITY · BENGALURU</p>
      <h1>KANTHA PRANTH</h1>
      <p className="auth-copy">Connect with your community, discover local services, share updates and support one another.</p>
      {loading ? <div className="auth-loading">Loading your community…</div> : <>
        <button className="primary full auth-main-btn" onClick={onLogin}>Sign in / Create account</button>
        <button className="outline full" onClick={onGuest}>Continue as guest</button>
        <div className="auth-features"><span>📍 Bengaluru</span><span>👥 Community</span><span>🛒 Marketplace</span></div>
        <small>Free email login · No SMS required</small>
      </>}
    </div>
  </main>;
}

function ProfileSetupScreen({ userName, setUserName, profileLocality, setProfileLocality, onSubmit, busy }) {
  return <main className="auth-screen">
    <div className="auth-card profile-setup-card">
      <div className="auth-logo">🙏</div>
      <p className="eyebrow">ONE LAST STEP</p>
      <h1>Complete your profile</h1>
      <p className="auth-copy">Tell the community who you are and where you're based. You can change this later.</p>
      <form onSubmit={onSubmit} className="form auth-profile-form">
        <label>Your full name
          <input
            value={userName}
            onChange={e => setUserName(e.target.value)}
            autoComplete="name"
            placeholder="Enter your name"
            minLength={2}
            required
          />
        </label>
        <label>Your locality
          <select value={profileLocality} onChange={e => setProfileLocality(e.target.value)}>
            {localities.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
        <button className="primary full auth-main-btn" disabled={busy}>
          {busy ? 'Saving…' : 'Continue to Kantha Pranth'}
        </button>
      </form>
    </div>
  </main>;
}

function Page({ title, subtitle, action, children }) { return <div className="page"><div className="page-head"><div><p className="eyebrow">KANTHA PRANTH</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>{children}</div>; }
function SectionHeader({ title, action, onClick }) { return <div className="section-head"><h2>{title}</h2>{action && <button onClick={onClick}>{action} ›</button>}</div>; }
function PostCard({ post, onToast }) { return <article className="post-card"><div className="post-top"><Avatar initials={post.avatar} /><div className="post-author"><b>{post.author}</b><span>{post.time} · {post.area}</span></div><button className="more">•••</button></div><Pill tone={post.type === 'Help' ? 'help' : ''}>{post.type}</Pill><h3>{post.title}</h3><p>{post.text}</p><div className="post-actions"><button onClick={() => onToast('Post liked')}>♡ {post.likes}</button><button onClick={() => onToast('Comments are coming next')}>◌ {post.comments}</button><button onClick={() => onToast('Share link copied')}>↗ Share</button></div></article>; }
function EventCard({ event, onClick }) { return <button className="event-card" onClick={onClick}><div className="event-date"><b>{event.date.split(' ')[0]}</b><span>{event.date.split(' ')[1]}</span></div><div className="event-icon">{event.emoji}</div><div className="event-info"><Pill>{event.tag}</Pill><h3>{event.title}</h3><p>◷ {event.time} · ⌖ {event.area}</p></div><span className="chevron">›</span></button>; }
function ServiceCard({ service, onToast }) { return <article className="service-card"><div className="service-icon">{service.icon}</div><div className="service-info"><div className="service-title"><h3>{service.name}</h3>{service.verified && <span className="verified">✓ Verified</span>}</div><p>{service.category}</p><small>⌖ {service.area} · ★ {service.rating}</small></div><button className="call" onClick={() => onToast('Contact flow coming next')}>Call</button></article>; }
function Modal({ title, close, children }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>; }
