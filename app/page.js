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
  const [showFamilyEdit, setShowFamilyEdit] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [familySearch, setFamilySearch] = useState('');
  const [familyBusy, setFamilyBusy] = useState(false);
  const [familyPhotoPreview, setFamilyPhotoPreview] = useState('');
  const [locality, setLocality] = useState('Nagarbhavi');
  const [posts, setPosts] = useState(initialPosts);
  const [communityFilter, setCommunityFilter] = useState('All');
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberPosts, setMemberPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [listings, setListings] = useState(initialListings);
  const [showPost, setShowPost] = useState(false);
  const [postBusy, setPostBusy] = useState(false);
  const [postPhotoPreview, setPostPhotoPreview] = useState('');
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
  const [authFeedback, setAuthFeedback] = useState('');
  const [userName, setUserName] = useState('');
  const [profileLocality, setProfileLocality] = useState('Nagarbhavi');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
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
          setCurrentUserId(data.session.user.id);
          setGuestMode(false);
          await loadUserProfile(data.session);
          await loadPosts();
          await loadFamilies();
          await loadNotifications(data.session.user.id);
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
        setCurrentUserId(session?.user?.id || '');
        setGuestMode(false);
        if (session) {
          await loadUserProfile(session);
          await loadPosts();
          await loadFamilies();
          await loadNotifications(session.user.id);
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

  async function openMemberProfile(userId) {
    if (!supabase || !userId) return;
    const [{ data: profile, error: profileError }, { data: postRows }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url, bio, locality_id, is_verified, created_at').eq('id', userId).maybeSingle(),
      supabase.from('posts').select('id, author_id, locality_id, type, title, body, image_url, is_pinned, created_at').eq('author_id', userId).order('created_at', { ascending:false }).limit(10)
    ]);
    if (profileError || !profile) return setToast('Could not load member profile');
    let localityName = 'Bengaluru';
    if (profile.locality_id) {
      const { data } = await supabase.from('localities').select('name').eq('id', profile.locality_id).maybeSingle();
      localityName = data?.name || localityName;
    }
    setSelectedMember({ ...profile, localityName });
    setMemberPosts((postRows || []).map(p => ({ ...p, author_id:userId, author:profile.full_name || 'Community Member', area:localityName, time:formatPostTime(p.created_at), text:p.body, avatar:initialsFromName(profile.full_name || 'Community Member'), image_url:p.image_url || '' })));
  }

  async function loadNotifications(userId = currentUserId) {
    if (!supabase || !userId) return;
    const { data } = await supabase.from('notifications').select('id, type, post_id, message, read_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    setNotifications(data || []);
  }

  async function markNotificationsRead() {
    if (!supabase || !currentUserId) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', currentUserId).is('read_at', null);
    setNotifications(rows => rows.map(x => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
  }

  const unreadNotifications = notifications.filter(x => !x.read_at).length;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredCommunityPosts = useMemo(() => {
    const query = communitySearch.trim().toLowerCase();
    const type = communityFilter === 'Events' ? 'Event' : communityFilter;
    return posts.filter(p => {
      const matchesType = communityFilter === 'All' || p.type === type;
      const matchesSearch = !query || `${p.title || ''} ${p.text || ''} ${p.author || ''} ${p.area || ''}`.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    }).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  }, [posts, communityFilter, communitySearch]);

  const filteredListings = useMemo(() => listings.filter(x => `${x.title} ${x.category} ${x.area}`.toLowerCase().includes(search.toLowerCase())), [listings, search]);
  const filteredServices = useMemo(() => services.filter(x => `${x.name} ${x.category} ${x.area}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const filteredFamilies = useMemo(() => families.filter(f => `${f.family_name} ${f.localities?.name || ''}`.toLowerCase().includes(familySearch.toLowerCase())), [families, familySearch]);

  useEffect(() => {
    if (!authChecked || !posts.length || typeof window === 'undefined') return;
    const postId = new URLSearchParams(window.location.search).get('post');
    if (!postId) return;
    const match = posts.find(p => String(p.id) === postId);
    if (match) {
      setActive('community');
      setSelectedPost(match);
    }
  }, [authChecked, posts]);

  function whatsappUrl(phone) {
    if (!phone) return '#';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) digits = `91${digits}`;
    if (digits.startsWith('0') && digits.length === 11) digits = `91${digits.slice(1)}`;
    return `https://wa.me/${digits}`;
  }

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
      .select('full_name, locality_id, is_verified')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.full_name) {
      setUserName(profile.full_name);
    }
    setIsVerified(!!profile?.is_verified);
    setIsVerifiedUser(!!profile?.is_verified);

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

  async function loadPosts() {
    if (!supabase) return;

    const [
      { data: postRows, error: postError },
      { data: profileRows, error: profileError },
      { data: localityRows, error: localityError }
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('id, author_id, locality_id, type, title, body, image_url, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, avatar_url'),
      supabase.from('localities').select('id, name')
    ]);

    if (postError) {
      setToast(postError.message || 'Could not load community posts');
      return;
    }

    const profileMap = new Map((profileRows || []).map(x => [x.id, x]));
    const localityMap = new Map((localityRows || []).map(x => [x.id, x.name]));

    const mapped = (postRows || []).map(post => {
      const profile = profileMap.get(post.author_id);
      return {
        id: post.id,
        author_id: post.author_id,
        type: post.type || 'Discussion',
        author: profile?.full_name || 'Community Member',
        time: formatPostTime(post.created_at),
        area: localityMap.get(post.locality_id) || 'Bengaluru',
        title: post.title,
        text: post.body,
        image_url: post.image_url || '',
        is_pinned: !!post.is_pinned,
        likes: 0,
        comments: 0,
        avatar: initialsFromName(profile?.full_name || 'Community Member')
      };
    });

    setPosts(mapped);
  }

  async function loadFamilies() {
    if (!supabase) return;

    // Fetch families first, then fetch related records separately.
    // This avoids PostgREST relationship/schema-cache issues from hiding
    // otherwise valid family rows from the directory.
    const { data: familyRows, error: familyError } = await supabase
      .from('families')
      .select('id, family_name, locality_id, visibility, owner_id, phone, email, address, show_contact, photo_path, created_at')
      .order('created_at', { ascending: false });

    if (familyError) {
      setFamilies([]);
      setToast(familyError.message || 'Could not load families');
      return;
    }

    const rows = familyRows || [];
    if (!rows.length) {
      setFamilies([]);
      return;
    }

    const localityIds = [...new Set(rows.map(f => f.locality_id).filter(Boolean))];
    const familyIds = rows.map(f => f.id);

    const [{ data: localityRows }, { data: memberRows }] = await Promise.all([
      localityIds.length
        ? supabase.from('localities').select('id, name').in('id', localityIds)
        : Promise.resolve({ data: [] }),
      supabase.from('family_members').select('id, family_id, member_name, relationship').in('family_id', familyIds)
    ]);

    const localityMap = Object.fromEntries((localityRows || []).map(l => [l.id, l]));
    const membersByFamily = {};
    (memberRows || []).forEach(m => {
      if (!membersByFamily[m.family_id]) membersByFamily[m.family_id] = [];
      membersByFamily[m.family_id].push(m);
    });

    const enriched = await Promise.all(rows.map(async f => {
      let photo_url = '';
      if (f.photo_path) {
        const { data: signed } = await supabase.storage.from('family-photos').createSignedUrl(f.photo_path, 3600);
        photo_url = signed?.signedUrl || '';
      }
      return {
        ...f,
        photo_url,
        localities: localityMap[f.locality_id] || null,
        family_members: membersByFamily[f.id] || []
      };
    }));

    setFamilies(enriched);
  }

  async function createFamily(e) {
    e.preventDefault();
    if (!supabase) return setToast('Family Directory requires a signed-in account');
    const fd = new FormData(e.currentTarget);
    const hideFamilyName = fd.get('hide_family_name') === 'on';
    const familyName = hideFamilyName ? null : (fd.get('family_name')?.toString().trim() || null);
    const localityName = fd.get('locality')?.toString();
    const visibility = fd.get('visibility')?.toString() || 'community';
    const membersText = fd.get('members')?.toString().trim() || '';
    const phone = fd.get('phone')?.toString().trim() || null;
    const contactEmail = fd.get('email')?.toString().trim() || null;
    const address = fd.get('address')?.toString().trim() || null;
    const showContact = fd.get('show_contact') === 'on';
    const photoFile = fd.get('photo');

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
      phone,
      email: contactEmail,
      address,
      show_contact: showContact,
    }).select('id, family_name, locality_id, visibility, owner_id, phone, email, address, show_contact, photo_path').single();

    if (error) {
      setFamilyBusy(false);
      return setToast(error.message || 'Could not create family');
    }

    let photoWarning = '';
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      if (!photoFile.type.startsWith('image/')) {
        photoWarning = ' Family photo skipped because it is not an image.';
      } else if (photoFile.size > 5 * 1024 * 1024) {
        photoWarning = ' Family photo skipped because it is larger than 5 MB.';
      } else {
        const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${user.id}/${family.id}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('family-photos').upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (uploadError) {
          photoWarning = ` Family photo could not be uploaded: ${uploadError.message}`;
        } else {
          const { error: photoUpdateError } = await supabase.from('families').update({ photo_path: path }).eq('id', family.id).eq('owner_id', user.id);
          if (photoUpdateError) photoWarning = ` Family photo could not be saved: ${photoUpdateError.message}`;
        }
      }
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
    setFamilyPhotoPreview('');
    await loadFamilies();
    setToast(`Family added to the directory.${photoWarning}`);
  }

  async function updateFamily(e) {
    e.preventDefault();
    if (!supabase || !editingFamily) return;
    const fd = new FormData(e.currentTarget);
    const hideFamilyName = fd.get('hide_family_name') === 'on';
    const familyName = hideFamilyName ? null : (fd.get('family_name')?.toString().trim() || null);
    const localityName = fd.get('locality')?.toString();
    const visibility = fd.get('visibility')?.toString() || 'community';
    const phone = fd.get('phone')?.toString().trim() || null;
    const contactEmail = fd.get('email')?.toString().trim() || null;
    const address = fd.get('address')?.toString().trim() || null;
    const showContact = fd.get('show_contact') === 'on';
    const removePhoto = fd.get('remove_photo') === 'on';
    const photoFile = fd.get('photo');
    setFamilyBusy(true);

    const { data: localityRow } = await supabase.from('localities').select('id').eq('name', localityName).single();
    if (!localityRow) {
      setFamilyBusy(false);
      return setToast('Could not find that locality');
    }

    let photoPath = editingFamily.photo_path || null;
    if (removePhoto && photoPath) {
      await supabase.storage.from('family-photos').remove([photoPath]);
      photoPath = null;
    }
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      if (!photoFile.type.startsWith('image/') || photoFile.size > 5 * 1024 * 1024) {
        setFamilyBusy(false);
        return setToast('Please choose an image up to 5 MB');
      }
      const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      photoPath = `${currentUserId}/${editingFamily.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('family-photos').upload(photoPath, photoFile, { upsert: true, contentType: photoFile.type });
      if (uploadError) {
        setFamilyBusy(false);
        return setToast(uploadError.message || 'Could not upload photo');
      }
    }

    const { error } = await supabase.from('families').update({
      family_name: familyName,
      locality_id: localityRow.id,
      visibility,
      phone,
      email: contactEmail,
      address,
      show_contact: showContact,
      photo_path: photoPath,
    }).eq('id', editingFamily.id).eq('owner_id', currentUserId);

    if (error) {
      setFamilyBusy(false);
      return setToast(error.message || 'Could not update family');
    }

    setFamilyBusy(false);
    setShowFamilyEdit(false);
    setEditingFamily(null);
    setSelectedFamily(null);
    await loadFamilies();
    setToast('Family details updated');
  }

  async function handleEmailAuth(e) {
    e?.preventDefault?.();
    setAuthFeedback('');
    const cleanEmail = email.trim().toLowerCase();
    setAuthFeedback('');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setAuthFeedback('Please enter a valid email address.');
    }
    if (password.length < 8) {
      return setAuthFeedback('Password must be at least 8 characters.');
    }

    setAuthBusy(true);

    try {
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

      if (error) return setAuthFeedback(error.message || 'Could not create account.');

      if (!data.session) {
        setAuthFeedback('Account created. Please check your email, confirm your account, then sign in.');
        setAuthMode('login');
        setPassword('');
        return;
      }

      setAuthenticated(true);
      setShowLogin(false);
      setNeedsProfile(true);
      setAuthFeedback('');
      setToast('Account created');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setAuthBusy(false);

    if (error) return setAuthFeedback(error.message || 'Could not sign in.');

    setAuthenticated(true);
    setShowLogin(false);
    setAuthFeedback('');
    await loadUserProfile(data.session);
    setToast('Welcome back to Kantha Pranth');
    } catch (error) {
      setAuthBusy(false);
      setAuthFeedback(error?.message || 'Something went wrong. Please try again.');
    }
  }

  async function resetPassword() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return setAuthFeedback('Enter your email address first.');
    }
    if (!supabase) return setAuthFeedback('Password reset is available when Supabase is connected.');
    setAuthBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}`,
    });
    setAuthBusy(false);
    if (error) return setAuthFeedback(error.message || 'Could not send the reset email.');
    setAuthFeedback('Password reset email sent. Check your inbox.');
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
    setCurrentUserId('');
    setIsVerifiedUser(false);
    setGuestMode(false);
    setUserName('');
    localStorage.removeItem('kp-demo');
    setActive('home');
  }


  async function addPost(e) {
    e.preventDefault();

    if (!supabase || !authenticated || guestMode || !currentUserId) {
      return setToast('Please sign in to publish a community post');
    }
    if (!isVerified) {
      return setToast('Only verified community members can publish posts');
    }
    if (!isVerifiedUser) return setToast('Only verified community members can publish posts');

    const fd = new FormData(e.currentTarget);
    const title = fd.get('title')?.toString().trim();
    const body = fd.get('text')?.toString().trim();
    const type = fd.get('type')?.toString() || 'Discussion';
    const photoFile = fd.get('photo');

    if (!title || !body) return setToast('Add a title and message');

    setPostBusy(true);

    try {
      const { data: localityRow, error: localityError } = await supabase
        .from('localities')
        .select('id, name')
        .eq('name', locality)
        .maybeSingle();

      if (localityError || !localityRow) {
        return setToast('Could not find your locality');
      }

      let imageUrl = null;
      if (photoFile && photoFile instanceof File && photoFile.size > 0) {
        if (!photoFile.type.startsWith('image/')) return setToast('Please choose an image file');
        if (photoFile.size > 5 * 1024 * 1024) return setToast('Photo must be 5 MB or smaller');

        const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${currentUserId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('community-posts')
          .upload(path, photoFile, { contentType: photoFile.type, upsert: false });

        if (uploadError) return setToast(uploadError.message || 'Could not upload photo');

        const { data: publicData } = supabase.storage.from('community-posts').getPublicUrl(path);
        imageUrl = publicData?.publicUrl || null;
      }

      const { error: insertError } = await supabase.from('posts').insert({
        author_id: currentUserId,
        locality_id: localityRow.id,
        type,
        title,
        body,
        image_url: imageUrl
      });

      if (insertError) {
        return setToast(insertError.message || 'Could not publish post');
      }

      await loadPosts();
      setShowPost(false);
      setActive('community');
      setToast('Post published to the community');
    } finally {
      setPostBusy(false);
    }
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
  if (!authenticated) return <AuthScreen
    loading={false}
    loginOpen={showLogin}
    setLoginOpen={setShowLogin}
    authMode={authMode}
    setAuthMode={(mode) => { setAuthFeedback(''); setAuthMode(mode); }}
    email={email}
    setEmail={setEmail}
    password={password}
    setPassword={setPassword}
    authBusy={authBusy}
    authFeedback={authFeedback}
    onSubmit={handleEmailAuth}
    onResetPassword={resetPassword}
    onGuest={continueAsGuest}
  />;

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
        <div className="top-actions" style={{ position:'relative' }}><button className="icon-btn" onClick={() => { setNotificationOpen(x => !x); loadNotifications(); if (!notificationOpen) markNotificationsRead(); }}>♧{unreadNotifications > 0 && <span style={{ position:'absolute', top:0, right:32, minWidth:16, height:16, borderRadius:99, background:'#7c1d25', color:'#fff', fontSize:9, display:'grid', placeItems:'center', padding:'0 3px' }}>{unreadNotifications}</span>}</button><button className="avatar mini" onClick={() => setActive('profile')}>{initialsFromName(userName || 'Guest')}</button>{notificationOpen && <div style={{ position:'absolute', right:0, top:48, width:300, maxWidth:'calc(100vw - 32px)', background:'#fffdf9', border:'1px solid #eadfd3', borderRadius:16, padding:12, boxShadow:'0 16px 40px rgba(55,30,20,.15)', zIndex:50 }}><div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}><b>Notifications</b><button className="text-btn" onClick={markNotificationsRead}>Mark all read</button></div>{notifications.length ? notifications.map(n => <button key={n.id} type="button" onClick={() => { const match = posts.find(p => String(p.id) === String(n.post_id)); if (match) { setActive('community'); setSelectedPost(match); setNotificationOpen(false); } }} style={{ width:'100%', textAlign:'left', padding:'10px 4px', border:0, borderTop:'1px solid #f0e7df', background:'transparent', cursor:n.post_id ? 'pointer' : 'default', fontSize:12 }}>{n.message}<small style={{ display:'block', color:'#9a8e86', marginTop:3 }}>{formatPostTime(n.created_at)}</small></button>) : <small style={{ color:'#8c8179' }}>No notifications yet.</small>}</div>}</div>
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
          {posts.slice(0, 2).map(post => <PostCard key={post.id} post={post} onToast={setToast} currentUserId={currentUserId} authenticated={authenticated} guestMode={guestMode} isVerifiedUser={isVerifiedUser} />)}
          <SectionHeader title="Coming up" action="All events" onClick={() => setActive('events')} />
          <EventCard event={events[0]} onClick={() => setSelectedEvent(events[0])} />
        </>}

        {active === 'community' && <Page title="Community" subtitle="What's happening around Bengaluru?" action={<button className="primary small" onClick={() => isVerifiedUser ? setShowPost(true) : setToast('Only verified community members can publish posts')}>＋ Post</button>}><div className="search" style={{ marginTop:12 }}><span>⌕</span><input value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} placeholder="Search community posts..." /></div><div className="filter-row" style={{ marginTop:10 }}>{['All','Announcement','Help','Events','Buy & Sell','Local'].map(filter => <button key={filter} onClick={() => setCommunityFilter(filter)} style={{ border:0, background:'transparent', padding:0, cursor:'pointer' }}><Pill tone={communityFilter === filter ? 'active' : ''}>{filter}</Pill></button>)}</div>{filteredCommunityPosts.length ? filteredCommunityPosts.map(post => <PostCard key={post.id} post={post} onToast={setToast} currentUserId={currentUserId} authenticated={authenticated} guestMode={guestMode} isVerifiedUser={isVerifiedUser} onPostChanged={loadPosts} onProfile={openMemberProfile} />) : <div className="info-banner"><b>No posts found</b><p>Try another category or be the first to post.</p></div>}</Page>}

        {active === 'family' && <Page title="Family Directory" subtitle="Connect with Jain families in your community" action={authenticated && !guestMode && supabase ? <button className="primary small" onClick={() => setShowFamilyForm(true)}>＋ Add family</button> : null}>
          <div className="directory-banner"><div className="directory-icon">👨‍👩‍👧‍👦</div><div><b>A community family directory</b><p>Choose what your family shares. Phone numbers and private details are never displayed by default.</p></div></div>
          <div className="search"><span>⌕</span><input value={familySearch} onChange={e => setFamilySearch(e.target.value)} placeholder="Search family or locality" /></div>
          {!supabase && <div className="info-banner"><b>Demo mode</b><p>Connect Supabase to create and store real family profiles.</p></div>}
          {supabase && (!authenticated || guestMode) && <div className="info-banner"><b>Sign in required</b><p>Sign in to view the private community directory and add your family.</p></div>}
          {filteredFamilies.length ? filteredFamilies.map(f => <button className="family-card" key={f.id} onClick={() => setSelectedFamily(f)}><div className="family-avatar">{f.photo_url ? <img src={f.photo_url} alt="Family" /> : '👨‍👩‍👧‍👦'}</div><div className="family-info"><h3>{f.family_name || 'Jain Family'}</h3><p>⌖ {f.localities?.name || 'Bengaluru'}</p><small>{f.family_members?.length || 0} family member{(f.family_members?.length || 0) === 1 ? '' : 's'} · {f.visibility === 'private' ? 'Private' : 'Community visible'}</small></div><span className="chevron">›</span></button>) : <div className="empty-state"><div>👨‍👩‍👧‍👦</div><h3>No families found</h3><p>Be one of the first families to join the directory.</p>{authenticated && !guestMode && supabase && <button className="primary" onClick={() => setShowFamilyForm(true)}>Add my family</button>}</div>}
        </Page>}

        {active === 'marketplace' && <Page title="Buy & Sell" subtitle={`${filteredListings.length} listings around Bengaluru`} action={<button className="primary small" onClick={() => setShowListing(true)}>＋ Sell</button>}><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search marketplace" /></div><div className="category-scroll">{['All','Property','Vehicles','Electronics','Furniture','Books','Business'].map(x => <Pill key={x} tone={x === 'All' ? 'active' : ''}>{x}</Pill>)}</div><div className="listing-grid">{filteredListings.map(item => <button className="listing" key={item.id} onClick={() => setSelectedListing(item)}><div className="listing-img">{item.emoji}</div><div className="listing-body"><div className="listing-title">{item.title}</div><div className="price">{item.price}</div><div className="meta">⌖ {item.area} · {item.condition}</div></div></button>)}</div></Page>}

        {active === 'services' && <Page title="Services" subtitle="Trusted people & businesses in your community"><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors, CA, lawyers..." /></div><div className="service-grid">{['Doctors','CA','Lawyers','Education','Home Services','Travel','Catering','Other'].map(x => <button className="service-cat" key={x}><span>{x === 'Doctors' ? '🩺' : x === 'CA' ? '📊' : x === 'Lawyers' ? '⚖️' : x === 'Travel' ? '✈️' : '✦'}</span><b>{x}</b></button>)}</div><SectionHeader title="Featured services" action="See all" />{filteredServices.map(s => <ServiceCard key={s.name} service={s} onToast={setToast} />)}</Page>}

        {active === 'events' && <Page title="Events" subtitle="Meet, celebrate and contribute"><div className="event-tabs"><Pill tone="active">Upcoming</Pill><Pill>My events</Pill><Pill>Past</Pill></div>{events.map(e => <EventCard key={e.id} event={e} onClick={() => setSelectedEvent(e)} />)}</Page>}

        {selectedPost && <Modal title="Community Post" close={() => { setSelectedPost(null); if (typeof window !== 'undefined' && window.location.search) window.history.replaceState({}, '', window.location.pathname); }}><PostCard post={selectedPost} onToast={setToast} currentUserId={currentUserId} authenticated={authenticated} guestMode={guestMode} onPostChanged={loadPosts} onProfile={openMemberProfile} /></Modal>}

        {selectedMember && <Modal title="Community Profile" close={() => { setSelectedMember(null); setMemberPosts([]); }}><div style={{ textAlign:'center', padding:'8px 0 18px' }}><Avatar initials={initialsFromName(selectedMember.full_name || 'Community Member')} large /><h2 style={{ margin:'12px 0 4px' }}>{selectedMember.full_name || 'Community Member'} {selectedMember.is_verified && <span className="verified">✓ Verified</span>}</h2><p style={{ margin:0, color:'#8b7d75', fontSize:12 }}>⌖ {selectedMember.localityName}</p>{selectedMember.bio && <p style={{ fontSize:12, lineHeight:1.5, color:'#5f534d', marginTop:10 }}>{selectedMember.bio}</p>}<small style={{ color:'#9a8e86' }}>Member since {new Date(selectedMember.created_at).toLocaleDateString()}</small></div><h3 style={{ margin:'10px 0' }}>Recent posts</h3>{memberPosts.length ? memberPosts.map(p => <PostCard key={p.id} post={p} onToast={setToast} currentUserId={currentUserId} authenticated={authenticated} guestMode={guestMode} onPostChanged={loadPosts} onProfile={openMemberProfile} />) : <div className="info-banner">No posts yet.</div>}</Modal>}

        {active === 'profile' && <Page title="My Profile" subtitle="Your community identity"><div className="profile-card"><Avatar initials={initialsFromName(userName || 'Guest')} large /><h2>{userName || 'Guest Member'}</h2><p>Kantha Pranth member · {locality}</p><div className="profile-stats"><div><b>{posts.filter(p => p.author === (userName || 'Community Member')).length}</b><span>Posts</span></div><div><b>0</b><span>Listings</span></div><div><b>1</b><span>Events</span></div></div></div><div className="settings-list">{['Edit profile','My listings','Saved posts','Privacy & visibility','Help & support'].map(x => <button key={x} onClick={() => setToast(`${x} will be available in the next build`)}><span>{x}</span><b>›</b></button>)}</div>{authenticated ? <button className="outline full" onClick={signOut}>Sign out</button> : <button className="outline full" onClick={() => setShowLogin(true)}>Sign in / Create account</button>}</Page>}

        {active === 'help' && <Page title="Community Help" subtitle="Support one another"><div className="help-grid">{[['🩸','Blood requirement'],['🔎','Lost & found'],['🤝','Volunteer'],['❤️','Support request']].map(([i,x]) => <button key={x} className="help-card" onClick={() => setToast('Help request flow coming next') }><span>{i}</span><b>{x}</b><small>Post to your local community</small></button>)}</div><div className="info-banner"><b>Safety first</b><p>Important help requests will be moderated. Never share sensitive personal or financial information publicly.</p></div></Page>}
      </section>

      <button className="fab" onClick={() => isVerifiedUser ? setShowPost(true) : setToast('Only verified community members can publish posts')}>＋</button>
      <nav className="bottom-nav">{nav.map(([id, icon, label]) => <button key={id} className={active === id ? 'selected' : ''} onClick={() => setActive(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>

      {showPost && <Modal title="Create a community post" close={() => { setShowPost(false); setPostPhotoPreview(''); }}><form onSubmit={addPost} className="form"><label>Post type<select name="type" defaultValue="Discussion"><option>Discussion</option><option>Announcement</option><option>Local Information</option><option>Help</option><option>Buy & Sell</option></select></label><label>Title<input name="title" placeholder="What would you like to share?" required /></label><label>Message<textarea name="text" rows="4" placeholder="Add details for the community..." required /></label><label>Photo <small className="field-help">Optional · JPG, PNG or WEBP · up to 5 MB</small><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file=e.target.files?.[0]; setPostPhotoPreview(file ? URL.createObjectURL(file) : ''); }} /></label>{postPhotoPreview && <img className="family-photo-preview" src={postPhotoPreview} alt="Post preview" />}<button className="primary full" disabled={postBusy || !isVerifiedUser}>{postBusy ? 'Publishing…' : !isVerifiedUser ? 'Verification required' : 'Publish post'}</button></form></Modal>}
      {showListing && <Modal title="Sell something" close={() => setShowListing(false)}><form onSubmit={addListing} className="form"><label>Product name<input name="title" placeholder="e.g. Study table" /></label><label>Price<input name="price" inputMode="numeric" placeholder="2500" /></label><label>Category<select name="category"><option>Furniture</option><option>Electronics</option><option>Books</option><option>Vehicles</option><option>Property</option><option>Other</option></select></label><button className="primary full">Publish listing</button></form></Modal>}
      {showFamilyForm && <Modal title="Add your family" close={() => { setShowFamilyForm(false); setFamilyPhotoPreview(''); }}><form onSubmit={createFamily} className="form"><div className="info-banner"><b>Privacy first</b><p>All contact details are optional. They are shown only when you choose “Show contact details”.</p></div><label>Family photo <small className="field-help">Optional · JPG, PNG or WEBP · up to 5 MB</small><input name="photo" type="file" accept="image/*" onChange={e => { const file=e.target.files?.[0]; setFamilyPhotoPreview(file ? URL.createObjectURL(file) : ''); }} /></label>{familyPhotoPreview && <img className="family-photo-preview" src={familyPhotoPreview} alt="Family preview" />}<label>Family name <span className="optional">(optional)</span><input name="family_name" placeholder="e.g. Jain Family" /></label><label className="check-row"><input name="hide_family_name" type="checkbox" /> Don't display a family name</label><label>Locality<select name="locality" defaultValue={locality}>{localities.map(x => <option key={x}>{x}</option>)}</select></label><label>Detailed address <span className="optional">(optional)</span><textarea name="address" rows="3" placeholder="House / flat, street, landmark, area, Bengaluru"></textarea></label><div className="two-col"><label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" placeholder="+91 98765 43210" /></label><label>Email ID <span className="optional">(optional)</span><input name="email" type="email" placeholder="family@example.com" /></label></div><label className="check-row"><input name="show_contact" type="checkbox" /> Show phone, email & address to community members</label><label>Visibility<select name="visibility" defaultValue="community"><option value="community">Community members</option><option value="private">Private — only me</option></select></label><label>Family members<small className="field-help">One member per line. Example: Rajesh Jain — Father</small><textarea name="members" rows="5" placeholder="Rajesh Jain — Father&#10;Sunita Jain — Mother&#10;Aarav Jain — Son"></textarea></label><button className="primary full" disabled={familyBusy}>{familyBusy ? 'Saving…' : 'Add family to directory'}</button></form></Modal>}
      {showFamilyEdit && editingFamily && <Modal title="Edit family details" close={() => { setShowFamilyEdit(false); setEditingFamily(null); }}><form onSubmit={updateFamily} className="form"><div className="info-banner"><b>Update anytime</b><p>You can remove the family name, replace the photo, or change which contact details the community can see.</p></div><label>Family photo <small className="field-help">Optional · JPG, PNG or WEBP · up to 5 MB</small><input name="photo" type="file" accept="image/*" /></label>{editingFamily.photo_url && <img className="family-photo-preview" src={editingFamily.photo_url} alt="Current family" />}<label className="check-row"><input name="remove_photo" type="checkbox" /> Remove current family photo</label><label>Family name <span className="optional">(optional)</span><input name="family_name" defaultValue={editingFamily.family_name || ''} placeholder="e.g. Jain Family" /></label><label className="check-row"><input name="hide_family_name" type="checkbox" defaultChecked={!editingFamily.family_name} /> Don't display a family name</label><label>Locality<select name="locality" defaultValue={editingFamily.localities?.name || locality}>{localities.map(x => <option key={x}>{x}</option>)}</select></label><label>Detailed address <span className="optional">(optional)</span><textarea name="address" rows="3" defaultValue={editingFamily.address || ''} placeholder="House / flat, street, landmark, area, Bengaluru"></textarea></label><div className="two-col"><label>Phone number <span className="optional">(optional)</span><input name="phone" type="tel" defaultValue={editingFamily.phone || ''} placeholder="+91 98765 43210" /></label><label>Email ID <span className="optional">(optional)</span><input name="email" type="email" defaultValue={editingFamily.email || ''} placeholder="family@example.com" /></label></div><label className="check-row"><input name="show_contact" type="checkbox" defaultChecked={!!editingFamily.show_contact} /> Show phone, email & address to community members</label><label>Visibility<select name="visibility" defaultValue={editingFamily.visibility || 'community'}><option value="community">Community members</option><option value="private">Private — only me</option></select></label><button className="primary full" disabled={familyBusy}>{familyBusy ? 'Saving…' : 'Save family details'}</button></form></Modal>}
      {selectedFamily && <Modal title={selectedFamily.family_name || 'Jain Family'} close={() => setSelectedFamily(null)}><div className="family-detail-head"><div className="family-avatar large">{selectedFamily.photo_url ? <img src={selectedFamily.photo_url} alt="Family" /> : '👨‍👩‍👧‍👦'}</div><div><h2>{selectedFamily.family_name || 'Jain Family'}</h2><p>⌖ {selectedFamily.localities?.name || 'Bengaluru'}</p></div></div>{selectedFamily.show_contact && selectedFamily.address && <div className="contact-card"><b>Address</b><p>{selectedFamily.address}</p></div>}{selectedFamily.show_contact && (selectedFamily.phone || selectedFamily.email) && <div className="contact-card"><b>Contact</b>{selectedFamily.phone && <a href={`tel:${selectedFamily.phone}`}>📞 {selectedFamily.phone}</a>}{selectedFamily.email && <a href={`mailto:${selectedFamily.email}`}>✉️ {selectedFamily.email}</a>}<div className="contact-actions">{selectedFamily.phone && <a className="contact-action whatsapp" href={whatsappUrl(selectedFamily.phone)} target="_blank" rel="noreferrer">💬 WhatsApp</a>}{selectedFamily.email && <a className="contact-action email" href={`mailto:${selectedFamily.email}?subject=${encodeURIComponent('Hello from Kantha Pranth')}`}>✉️ Send Email</a>}</div></div>}<h3 className="detail-section-title">Family members</h3><div className="member-list">{(selectedFamily.family_members || []).map(m => <div className="member-row" key={m.id}><Avatar initials={initialsFromName(m.member_name)} /><div><b>{m.member_name}</b><span>{m.relationship}</span></div></div>)}</div>{selectedFamily.owner_id === currentUserId && <button className="outline full" onClick={() => { setEditingFamily(selectedFamily); setSelectedFamily(null); setShowFamilyEdit(true); }}>Edit family details</button>}<div className="info-banner"><b>Privacy</b><p>Contact details are shown only when the family chooses to share them with community members.</p></div></Modal>}
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



function formatPostTime(value) {
  if (!value) return 'now';
  const created = new Date(value);
  const diff = Math.max(0, Date.now() - created.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return created.toLocaleDateString();
}

function initialsFromName(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'KP';
  return parts.slice(0, 2).map(x => x[0]).join('').toUpperCase();
}

function AuthScreen({
  loading = false,
  loginOpen,
  setLoginOpen,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  authBusy,
  authFeedback,
  onSubmit,
  onResetPassword,
  onGuest,
}) {
  if (loading) {
    return <main className="auth-screen splash-auth"><div className="splash-logo">☀</div><div className="splash-name">KANTHA PRANTH</div><div className="splash-sub">Jain Community · Bengaluru</div></main>;
  }

  if (loginOpen) {
    const submitAuth = (e) => {
      e?.preventDefault?.();
      onSubmit(e);
    };

    return <main
      className="auth-screen"
      style={{ minHeight: '100vh', background: '#f8f4ed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        style={{ width: '100%', maxWidth: 430, background: '#fffdf9', borderRadius: 24, padding: '34px 24px', boxShadow: '0 20px 60px rgba(55,30,20,.12)', position: 'relative', zIndex: 9999 }}
      >
        <button
          type="button"
          onClick={() => setLoginOpen(false)}
          style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 12, border: '1px solid #eadfd3', background: '#fff', fontSize: 24, cursor: 'pointer' }}
        >‹</button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 12px', background: 'linear-gradient(145deg,#e9c77f,#9a6a22)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 30 }}>🙏</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', color: '#7c1d25' }}>KANTHA PRANTH</div>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#241b18', fontSize: 28, margin: '7px 0' }}>
            {authMode === 'signup' ? 'Create your account' : 'Welcome Back'}
          </h1>
          <p style={{ color: '#766b65', fontSize: 12, margin: 0 }}>
            {authMode === 'signup' ? 'Join the Jain community of Bengaluru.' : 'Sign in to continue to your Jain community.'}
          </p>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 7, fontSize: 11, fontWeight: 700 }}>
            Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              style={{ width: '100%', height: 50, boxSizing: 'border-box', border: '1px solid #ded1c3', borderRadius: 13, padding: '0 14px', fontSize: 14, background: '#fff' }}
            />
          </label>

          <label style={{ display: 'grid', gap: 7, fontSize: 11, fontWeight: 700 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="Minimum 8 characters"
              style={{ width: '100%', height: 50, boxSizing: 'border-box', border: '1px solid #ded1c3', borderRadius: 13, padding: '0 14px', fontSize: 14, background: '#fff' }}
            />
          </label>

          {authMode === 'login' && (
            <button type="button" onClick={onResetPassword} disabled={authBusy} style={{ justifySelf: 'end', color: '#7c1d25', fontSize: 11, fontWeight: 800, background: 'none', border: 0, cursor: 'pointer' }}>
              Forgot password?
            </button>
          )}

          {authFeedback && (
            <div style={{ background: '#fff0ed', border: '1px solid #efc9c2', color: '#8e2926', borderRadius: 12, padding: 10, fontSize: 11 }}>
              {authFeedback}
            </div>
          )}

          <button
            type="button"
            disabled={authBusy}
            onClick={submitAuth}
            style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 13, background: '#7c1d25', color: '#fff', fontSize: 14, fontWeight: 800, cursor: authBusy ? 'wait' : 'pointer', opacity: authBusy ? .65 : 1 }}
          >
            {authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => { setAuthFeedback(''); setAuthMode(authMode === 'signup' ? 'login' : 'signup'); }}
            style={{ border: 0, background: 'none', color: '#7c1d25', fontSize: 11, cursor: 'pointer', padding: 8 }}
          >
            {authMode === 'signup' ? 'Already have an account? Sign in' : 'New to Kantha Pranth? Create an account'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px', color: '#a3978f', fontSize: 9 }}>
          <span style={{ flex: 1, height: 1, background: '#eadfd3' }}></span><span>OR</span><span style={{ flex: 1, height: 1, background: '#eadfd3' }}></span>
        </div>

        <button
          type="button"
          onClick={onGuest}
          style={{ width: '100%', minHeight: 48, border: '1px solid #eadfd3', borderRadius: 13, background: '#fff', color: '#241b18', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
        >
          Continue as guest
        </button>
        <small style={{ display: 'block', textAlign: 'center', marginTop: 14, color: '#9a8e86', fontSize: 9 }}>
          Free email login · No SMS required
        </small>
      </div>
    </main>;
  }

  return <main className="auth-screen auth-welcome-screen">
    <div className="auth-mobile-shell welcome-shell">
      <div className="welcome-illustration"><div className="temple-line">☼</div><div className="temple-base">KANTHA<br/>PRANTH</div></div>
      <div className="welcome-logo">☀</div>
      <p className="eyebrow center">JAIN COMMUNITY · BENGALURU</p>
      <h1>KANTHA PRANTH</h1>
      <p className="welcome-tagline">A trusted platform for our Jain community</p>
      <div className="welcome-points"><span>Connect</span><i>•</i><span>Support</span><i>•</i><span>Grow</span></div>
      <div className="welcome-feature-grid">
        <div><span>👥</span><b>Connect</b><small>with members</small></div>
        <div><span>⌕</span><b>Discover</b><small>local services</small></div>
        <div><span>🛒</span><b>Buy & Sell</b><small>within community</small></div>
        <div><span>📅</span><b>Events</b><small>stay updated</small></div>
        <div><span>📍</span><b>Local</b><small>information</small></div>
        <div><span>♥</span><b>Support</b><small>each other</small></div>
      </div>
      <button className="primary full welcome-cta" onClick={() => { setAuthMode('login'); setAuthFeedback(''); setLoginOpen(true); }}>Get Started</button>
      <button className="guest-link" onClick={onGuest}>Continue as guest</button>
      <small className="welcome-foot">Built for the Jain Community of Bengaluru</small>
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
function PostCard({ post, onToast, currentUserId, authenticated, guestMode, isVerifiedUser, onPostChanged, onProfile }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [editBody, setEditBody] = useState(post.text || '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwnPost = !!currentUserId && currentUserId === post.author_id;

  useEffect(() => {
    let active = true;
    async function loadInteractions() {
      if (!supabase || !post.id || typeof post.id !== 'string') return;
      const [{ count: likes }, { count: commentsTotal }] = await Promise.all([
        supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id)
      ]);
      if (!active) return;
      setLikeCount(likes || 0);
      setCommentCount(commentsTotal || 0);
      if (currentUserId) {
        const [{ data: likeRow }, { data: savedRow }] = await Promise.all([
          supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle(),
          supabase.from('saved_posts').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle()
        ]);
        if (active) { setLiked(!!likeRow); setSaved(!!savedRow); }
      }
    }
    loadInteractions();
    return () => { active = false; };
  }, [post.id, currentUserId]);

  async function toggleLike() {
    if (!supabase || !authenticated || guestMode || !currentUserId) return onToast('Please sign in to like posts');
    setBusy(true);
    if (liked) {
      const { error } = await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      if (!error) { setLiked(false); setLikeCount(x => Math.max(0, x - 1)); } else onToast(error.message);
    } else {
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId });
      if (!error) { setLiked(true); setLikeCount(x => x + 1); } else onToast(error.message);
    }
    setBusy(false);
  }

  async function openComments() {
    setShowComments(true);
    if (!supabase || typeof post.id !== 'string') return;
    const { data, error } = await supabase.from('post_comments').select('id, body, created_at, user_id, parent_id').eq('post_id', post.id).order('created_at', { ascending: true });
    if (error) return onToast(error.message);
    const rows = data || [];
    const userIds = [...new Set(rows.map(x => x.user_id).filter(Boolean))];
    let profileMap = new Map();
    if (userIds.length) {
      const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
      if (profileError) return onToast(profileError.message);
      profileMap = new Map((profiles || []).map(x => [x.id, x]));
    }
    setComments(rows.map(comment => ({ ...comment, profiles: profileMap.get(comment.user_id) || null })));
  }

  async function addComment(e) {
    e.preventDefault();
    const body = commentText.trim();
    if (!body) return;
    if (!supabase || !currentUserId) return onToast('Please sign in to comment');
    if (!isVerifiedUser) return onToast('Only verified community members can comment');
    const { error } = await supabase.from('post_comments').insert({ post_id: post.id, user_id: currentUserId, body, parent_id: replyTo || null });
    if (error) return onToast(error.message);
    setCommentText('');
    setReplyTo(null);
    setCommentCount(x => x + 1);
    await openComments();
  }

  async function deleteComment(commentId) {
    if (!supabase || !currentUserId) return;
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId).eq('user_id', currentUserId);
    if (error) return onToast(error.message);
    await openComments();
    setCommentCount(x => Math.max(0, x - 1));
  }

  async function toggleSaved() {
    if (!supabase || !authenticated || guestMode || !currentUserId) return onToast('Please sign in to save posts');
    if (saved) {
      const { error } = await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', currentUserId);
      if (!error) { setSaved(false); onToast('Post removed from saved'); } else onToast(error.message);
    } else {
      const { error } = await supabase.from('saved_posts').insert({ post_id: post.id, user_id: currentUserId });
      if (!error) { setSaved(true); onToast('Post saved'); } else onToast(error.message);
    }
  }

  async function editPost(e) {
    e.preventDefault();
    if (!supabase || !isOwnPost) return;
    const title = editTitle.trim(), body = editBody.trim();
    if (!title || !body) return onToast('Title and message are required');
    const { error } = await supabase.from('posts').update({ title, body, updated_at: new Date().toISOString() }).eq('id', post.id).eq('author_id', currentUserId);
    if (error) return onToast(error.message);
    setEditing(false);
    onToast('Post updated');
    onPostChanged?.();
  }

  async function deletePost() {
    if (!supabase || !isOwnPost) return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('author_id', currentUserId);
    if (error) return onToast(error.message);
    onToast('Post deleted');
    onPostChanged?.();
  }

  async function reportPost() {
    if (!supabase || !authenticated || guestMode || !currentUserId) return onToast('Please sign in to report a post');
    const reason = window.prompt('Why are you reporting this post?\n\nExamples: Spam, inappropriate content, misinformation, other');
    if (!reason?.trim()) return;
    const { error } = await supabase.from('post_reports').insert({ post_id: post.id, reporter_id: currentUserId, reason: reason.trim() });
    if (error) return onToast(error.message);
    onToast('Report submitted to the community team');
    setShowMenu(false);
  }

  async function sharePost() {
    const url = window.location.origin + window.location.pathname + '?post=' + encodeURIComponent(post.id);
    try {
      if (navigator.share) await navigator.share({ title: post.title, text: post.text, url });
      else { await navigator.clipboard.writeText(url); onToast('Post link copied'); }
    } catch (error) { if (error?.name !== 'AbortError') onToast('Could not share post'); }
  }

  return <article className="post-card">
    <div className="post-top"><button type="button" onClick={() => post.author_id && onProfile?.(post.author_id)} style={{ display:'flex', alignItems:'center', gap:10, border:0, background:'transparent', padding:0, textAlign:'left', cursor:post.author_id ? 'pointer' : 'default' }}><Avatar initials={post.avatar} /><div className="post-author"><b>{post.author}</b><span>{post.time} · {post.area}</span></div></button><button className="more" onClick={() => setShowMenu(x => !x)}>•••</button></div>
    {showMenu && <div style={{ display:'flex', flexWrap:'wrap', gap:7, margin:'8px 0 10px', justifyContent:'flex-end' }}>
      {isOwnPost ? <><button className="soft-btn" onClick={() => { setEditing(true); setShowMenu(false); }}>✏️ Edit</button><button className="soft-btn" onClick={deletePost}>🗑️ Delete</button></> : <><button className="soft-btn" onClick={toggleSaved}>{saved ? '🔖 Saved' : '🔖 Save'}</button><button className="soft-btn" onClick={reportPost}>🚩 Report</button></>}
      <button className="soft-btn" onClick={sharePost}>↗ Copy/share</button>
    </div>}
    <div style={{ display:'flex', gap:7, alignItems:'center', marginTop:8 }}><Pill tone={post.type === 'Help' ? 'help' : ''}>{post.type}</Pill>{post.is_pinned && <Pill>📌 Pinned</Pill>}</div>
    {editing ? <form onSubmit={editPost} style={{ display:'grid', gap:9, marginTop:10 }}>
      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
      <textarea rows="4" value={editBody} onChange={e => setEditBody(e.target.value)} />
      <div style={{ display:'flex', gap:8 }}><button className="primary small">Save changes</button><button type="button" className="soft-btn" onClick={() => setEditing(false)}>Cancel</button></div>
    </form> : <><h3>{post.title}</h3><p>{post.text}</p></>}
    {post.image_url && <img src={post.image_url} alt="" style={{ width:'100%', maxHeight:360, objectFit:'cover', borderRadius:14, marginTop:10 }} />}
    <div className="post-actions">
      <button disabled={busy} onClick={toggleLike}>{liked ? '♥' : '♡'} {likeCount}</button>
      <button onClick={openComments}>◌ {commentCount}</button>
      <button onClick={sharePost}>↗ Share</button>
      <button onClick={toggleSaved}>{saved ? '🔖' : '＋'} {saved ? 'Saved' : 'Save'}</button>
    </div>
    {showComments && <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #eee3d8' }}>
      <div style={{ display:'grid', gap:9, maxHeight:240, overflowY:'auto' }}>
        {comments.length ? comments.filter(c => !c.parent_id).map(c => <div key={c.id} style={{ background:'#faf7f2', borderRadius:12, padding:'9px 11px' }}><div style={{ display:'flex', justifyContent:'space-between', gap:8 }}><b style={{ fontSize:11 }}>{c.profiles?.full_name || 'Community Member'}</b><div style={{ display:'flex', gap:6 }}>{authenticated && !guestMode && <button className="more" onClick={() => setReplyTo(c.id)}>↩</button>}{c.user_id === currentUserId && <button className="more" onClick={() => deleteComment(c.id)}>×</button>}</div></div><div style={{ fontSize:12, marginTop:3 }}>{c.body}</div>{comments.filter(r => r.parent_id === c.id).map(r => <div key={r.id} style={{ margin:'8px 0 0 18px', padding:'8px', background:'#fff', borderRadius:10 }}><b style={{ fontSize:10 }}>{r.profiles?.full_name || 'Community Member'}</b><div style={{ fontSize:11, marginTop:2 }}>{r.body}</div>{r.user_id === currentUserId && <button className="more" onClick={() => deleteComment(r.id)}>×</button>}</div>)}</div>) : <small style={{ color:'#8c8179' }}>No comments yet. Be the first.</small>}
      </div>
      {replyTo && <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:9, padding:'7px 9px', background:'#fff6e8', borderRadius:9, fontSize:10 }}><span>↩ Replying to a comment</span><button type="button" className="text-btn" onClick={() => setReplyTo(null)}>Cancel</button></div>}{(authenticated || guestMode) && currentUserId && <form onSubmit={addComment} style={{ display:'flex', gap:7, marginTop:10 }}><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={replyTo ? "Write a reply…" : "Write a comment…"} style={{ flex:1, minWidth:0 }} /><button className="primary small" disabled={!commentText.trim()}>Post</button></form>}
    </div>}
  </article>;
}
function EventCard({ event, onClick }) { return <button className="event-card" onClick={onClick}><div className="event-date"><b>{event.date.split(' ')[0]}</b><span>{event.date.split(' ')[1]}</span></div><div className="event-icon">{event.emoji}</div><div className="event-info"><Pill>{event.tag}</Pill><h3>{event.title}</h3><p>◷ {event.time} · ⌖ {event.area}</p></div><span className="chevron">›</span></button>; }
function ServiceCard({ service, onToast }) { return <article className="service-card"><div className="service-icon">{service.icon}</div><div className="service-info"><div className="service-title"><h3>{service.name}</h3>{service.verified && <span className="verified">✓ Verified</span>}</div><p>{service.category}</p><small>⌖ {service.area} · ★ {service.rating}</small></div><button className="call" onClick={() => onToast('Contact flow coming next')}>Call</button></article>; }
function Modal({ title, close, children }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && close()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>; }
