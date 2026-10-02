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
  ['Community', '📰'], ['Events', '📅'], ['Buy & Sell', '🛒'], ['Services', '🛠️'], ['Businesses', '🏪'], ['Help', '🆘'],
];

function Avatar({ initials, large = false }) { return <div className={`avatar ${large ? 'avatar-lg' : ''}`}>{initials}</div>; }

function Pill({ children, tone = '' }) { return <span className={`pill ${tone}`}>{children}</span>; }

export default function Home() {
  const [active, setActive] = useState('home');
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
  const [phone, setPhone] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('kp-demo') || '{}');
      if (saved.locality) setLocality(saved.locality);
      if (saved.posts) setPosts(saved.posts);
      if (saved.listings) setListings(saved.listings);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem('kp-demo', JSON.stringify({ locality, posts, listings }));
  }, [locality, posts, listings]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredListings = useMemo(() => listings.filter(x => `${x.title} ${x.category} ${x.area}`.toLowerCase().includes(search.toLowerCase())), [listings, search]);
  const filteredServices = useMemo(() => services.filter(x => `${x.name} ${x.category} ${x.area}`.toLowerCase().includes(search.toLowerCase())), [search]);

  async function sendOtp(e) {
    e.preventDefault();
    if (!phone.trim()) return setToast('Enter your mobile number');
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}` });
      if (error) return setToast(error.message);
      setToast('OTP sent. Check your phone.');
    } else setToast('Demo login ready — Supabase will be connected next.');
    setShowLogin(false);
  }

  function addPost(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title')?.toString().trim();
    const text = fd.get('text')?.toString().trim();
    const type = fd.get('type')?.toString() || 'Discussion';
    if (!title || !text) return setToast('Add a title and message');
    setPosts([{ id: Date.now(), type, author: 'Manav Jain', time: 'now', area: locality, title, text, likes: 0, comments: 0, avatar: 'MJ' }, ...posts]);
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
    ['home', '⌂', 'Home'], ['community', '◎', 'Community'], ['marketplace', '🛒', 'Market'], ['services', '✦', 'Services'], ['profile', '◉', 'Profile'],
  ];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">☀</div>
          <div><div className="brand">KANTHA PRANTH</div><div className="brand-sub">Jain Community · Bengaluru</div></div>
        </div>
        <div className="top-actions"><button className="icon-btn" onClick={() => setToast('Notifications are coming in the next build')}>♧</button><button className="avatar mini" onClick={() => setActive('profile')}>MJ</button></div>
      </header>

      <section className="content">
        <div className="location-row"><button className="location-pill">⌖ {locality} <span>⌄</span></button><button className="soft-btn" onClick={() => setShowLogin(true)}>Sign in</button></div>

        {active === 'home' && <>
          <section className="hero">
            <div><p className="eyebrow">YOUR COMMUNITY, CLOSER</p><h1>Good evening,<br /><span>Manav</span> 👋</h1><p className="hero-copy">Discover what's happening around your Jain community in Bengaluru.</p></div>
            <div className="hero-symbol">🙏</div>
          </section>
          <div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people, services, events..." /></div>
          <div className="quick-grid">{quickActions.map(([label, icon]) => <button key={label} className="quick-card" onClick={() => setActive(label === 'Community' ? 'community' : label === 'Buy & Sell' ? 'marketplace' : label === 'Services' || label === 'Businesses' ? 'services' : label === 'Events' ? 'events' : 'help')}><span>{icon}</span><b>{label}</b></button>)}</div>
          <SectionHeader title="Latest updates" action="View all" onClick={() => setActive('community')} />
          {posts.slice(0, 2).map(post => <PostCard key={post.id} post={post} onToast={setToast} />)}
          <SectionHeader title="Coming up" action="All events" onClick={() => setActive('events')} />
          <EventCard event={events[0]} onClick={() => setSelectedEvent(events[0])} />
        </>}

        {active === 'community' && <Page title="Community" subtitle="What's happening around Bengaluru?" action={<button className="primary small" onClick={() => setShowPost(true)}>＋ Post</button>}><div className="filter-row"><Pill tone="active">All</Pill><Pill>Announcements</Pill><Pill>Help</Pill><Pill>Local</Pill></div>{posts.map(post => <PostCard key={post.id} post={post} onToast={setToast} />)}</Page>}

        {active === 'marketplace' && <Page title="Buy & Sell" subtitle={`${filteredListings.length} listings around Bengaluru`} action={<button className="primary small" onClick={() => setShowListing(true)}>＋ Sell</button>}><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marketplace" /></div><div className="category-scroll">{['All','Property','Vehicles','Electronics','Furniture','Books','Business'].map(x => <Pill key={x} tone={x === 'All' ? 'active' : ''}>{x}</Pill>)}</div><div className="listing-grid">{filteredListings.map(item => <button className="listing" key={item.id} onClick={() => setSelectedListing(item)}><div className="listing-img">{item.emoji}</div><div className="listing-body"><div className="listing-title">{item.title}</div><div className="price">{item.price}</div><div className="meta">⌖ {item.area} · {item.condition}</div></div></button>)}</div></Page>}

        {active === 'services' && <Page title="Services" subtitle="Trusted people & businesses in your community"><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors, CA, lawyers..." /></div><div className="service-grid">{['Doctors','CA','Lawyers','Education','Home Services','Travel','Catering','Other'].map(x => <button className="service-cat" key={x}><span>{x === 'Doctors' ? '🩺' : x === 'CA' ? '📊' : x === 'Lawyers' ? '⚖️' : x === 'Travel' ? '✈️' : '✦'}</span><b>{x}</b></button>)}</div><SectionHeader title="Featured services" action="See all" />{filteredServices.map(s => <ServiceCard key={s.name} service={s} onToast={setToast} />)}</Page>}

        {active === 'events' && <Page title="Events" subtitle="Meet, celebrate and contribute"><div className="event-tabs"><Pill tone="active">Upcoming</Pill><Pill>My events</Pill><Pill>Past</Pill></div>{events.map(e => <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} />)}</Page>}

        {active === 'profile' && <Page title="My Profile" subtitle="Your community identity"><div className="profile-card"><Avatar initials="MJ" large /><h2>Manav Jain</h2><p>Kantha Pranth member · {locality}</p><div className="profile-stats"><div><b>{posts.filter(p => p.author === 'Manav Jain').length}</b><span>Posts</span></div><div><b>0</b><span>Listings</span></div><div><b>1</b><span>Events</span></div></div></div><div className="settings-list">{['Edit profile','My listings','Saved posts','Privacy & visibility','Help & support'].map(x => <button key={x} onClick={() => setToast(`${x} will be available in the next build`)}><span>{x}</span><b>›</b></button>)}</div><button className="outline full" onClick={() => setShowLogin(true)}>Sign in / Create account</button></Page>}

        {active === 'help' && <Page title="Community Help" subtitle="Support one another"><div className="help-grid">{[['🩸','Blood requirement'],['🔎','Lost & found'],['🤝','Volunteer'],['❤️','Support request']].map(([i,x]) => <button key={x} className="help-card" onClick={() => setToast('Help request flow coming next') }><span>{i}</span><b>{x}</b><small>Post to your local community</small></button>)}</div><div className="info-banner"><b>Safety first</b><p>Important help requests will be moderated. Never share sensitive personal or financial information publicly.</p></div></Page>}
      </section>

      <button className="fab" onClick={() => setShowPost(true)}>＋</button>
      <nav className="bottom-nav">{nav.map(([id, icon, label]) => <button key={id} className={active === id ? 'selected' : ''} onClick={() => setActive(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>

      {showPost && <Modal title="Create a community post" close={() => setShowPost(false)}><form onSubmit={addPost} className="form"><label>Post type<select name="type" defaultValue="Discussion"><option>Discussion</option><option>Announcement</option><option>Local Information</option><option>Help</option><option>Buy & Sell</option></select></label><label>Title<input name="title" placeholder="What would you like to share?" /></label><label>Message<textarea name="text" rows="4" placeholder="Add details for the community..." /></label><button className="primary full">Publish post</button></form></Modal>}
      {showListing && <Modal title="Sell something" close={() => setShowListing(false)}><form onSubmit={addListing} className="form"><label>Product name<input name="title" placeholder="e.g. Study table" /></label><label>Price<input name="price" inputMode="numeric" placeholder="2500" /></label><label>Category<select name="category"><option>Furniture</option><option>Electronics</option><option>Books</option><option>Vehicles</option><option>Property</option><option>Other</option></select></label><button className="primary full">Publish listing</button></form></Modal>}
      {showLogin && <Modal title="Join Kantha Pranth" close={() => setShowLogin(false)}><form onSubmit={sendOtp} className="form"><div className="login-intro"><div className="brand-mark big">☀</div><p>Connect with your Jain community in Bengaluru.</p></div><label>Mobile number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98765 43210" /></label><button className="primary full">Send OTP</button><div className="or">or</div><button type="button" className="outline full" onClick={() => setToast('Google sign-in will be enabled with Supabase Auth')}>Continue with Google</button></form></Modal>}
      {selectedEvent && <Modal title={selectedEvent.title} close={() => setSelectedEvent(null)}><div className="detail-hero">{selectedEvent.emoji}</div><Pill>{selectedEvent.tag}</Pill><h2>{selectedEvent.date} · {selectedEvent.time}</h2><p>📍 {selectedEvent.area}, Bengaluru</p><p>Join the community for a meaningful evening of connection, learning and fellowship.</p><button className="primary full" onClick={() => { setSelectedEvent(null); setToast('You are marked as interested'); }}>Interested</button></Modal>}
      {selectedListing && <Modal title={selectedListing.title} close={() => setSelectedListing(null)}><div className="detail-hero listing-detail">{selectedListing.emoji}</div><div className="price huge">{selectedListing.price}</div><p>📍 {selectedListing.area} · {selectedListing.condition}</p><p>Listed by a Kantha Pranth community member.</p><button className="primary full" onClick={() => { setSelectedListing(null); setToast('Seller contact flow coming next'); }}>Message seller</button></Modal>}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

function Page({ title, subtitle, action, children }) { return <div className="page"><div className="page-head"><div><p className="eyebrow">KANTHA PRANTH</p><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>{children}</div>; }
function SectionHeader({ title, action, onClick }) { return <div className="section-head"><h2>{title}</h2>{action && <button onClick={onClick}>{action} ›</button>}</div>; }
function PostCard({ post, onToast }) { return <article className="post-card"><div className="post-top"><Avatar initials={post.avatar} /><div className="post-author"><b>{post.author}</b><span>{post.time} · {post.area}</span></div><button className="more">•••</button></div><Pill tone={post.type === 'Help' ? 'help' : ''}>{post.type}</Pill><h3>{post.title}</h3><p>{post.text}</p><div className="post-actions"><button onClick={() => onToast('Post liked')}>♡ {post.likes}</button><button onClick={() => onToast('Comments are coming next')}>◌ {post.comments}</button><button onClick={() => onToast('Share link copied')}>↗ Share</button></div></article>; }
function EventCard({ event, onClick }) { return <button className="event-card" onClick={onClick}><div className="event-date"><b>{event.date.split(' ')[0]}</b><span>{event.date.split(' ')[1]}</span></div><div className="event-icon">{event.emoji}</div><div className="event-info"><Pill>{event.tag}</Pill><h3>{event.title}</h3><p>◷ {event.time} · ⌖ {event.area}</p></div><span className="chevron">›</span></button>; }
function ServiceCard({ service, onToast }) { return <article className="service-card"><div className="service-icon">{service.icon}</div><div className="service-info"><div className="service-title"><h3>{service.name}</h3>{service.verified && <span className="verified">✓ Verified</span>}</div><p>{service.category}</p><small>⌖ {service.area} · ★ {service.rating}</small></div><button className="call" onClick={() => onToast('Contact flow coming next')}>Call</button></article>; }
function Modal({ title, close, children }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>; }
