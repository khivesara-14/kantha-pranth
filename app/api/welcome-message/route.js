import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Welcome messaging is not configured on the server' }, { status: 503 });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData?.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const user = authData.user;
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, full_name, welcome_message_sent_at')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) return NextResponse.json({ ok: false, pending: 'profile_not_ready' }, { status: 202 });
  if (profile.welcome_message_sent_at) return NextResponse.json({ ok: true, alreadySent: true });

  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from('profiles')
    .update({ welcome_message_sent_at: claimedAt })
    .eq('id', user.id)
    .is('welcome_message_sent_at', null)
    .select('id');
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  if (!claimed?.length) return NextResponse.json({ ok: true, alreadySent: true });

  const { data: privateProfile } = await admin
    .from('profile_private')
    .select('mobile_number, phone')
    .eq('id', user.id)
    .maybeSingle();

  const email = user.email;
  const rawPhone = privateProfile?.mobile_number || privateProfile?.phone || user.user_metadata?.mobile_number || '';
  const digits = String(rawPhone).replace(/\D/g, '');
  const whatsappNumber = digits.length === 10 ? '91' + digits : (digits.length === 12 && digits.startsWith('91') ? digits : '');
  const name = profile.full_name || user.user_metadata?.full_name || 'there';

  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.WELCOME_EMAIL_FROM || process.env.RESEND_FROM_EMAIL;
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const waTemplate = process.env.WHATSAPP_TEMPLATE_NAME;
  const waLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en';
  const outcomes = { email: 'not_configured', whatsapp: 'not_configured' };

  if (email && resendKey && emailFrom) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailFrom,
          to: [email],
          subject: 'Welcome to Kantha Pranth Jain Community',
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#241b18"><h1 style="color:#7c1d25">Jai Jinendra, ${escapeHtml(name)}!</h1><p>We’re delighted to welcome you to the Kantha Pranth Jain Community in Bengaluru.</p><p>You can now connect with community members, discover local businesses and services, explore events, and support one another.</p><p>Please keep your profile details up to date and help us maintain a respectful, trusted community.</p><p style="color:#7c1d25;font-weight:bold">Connect • Support • Grow</p><p>With regards,<br/>Kantha Pranth Community Team</p></div>`
        })
      });
      outcomes.email = response.ok ? 'sent' : 'failed';
    } catch { outcomes.email = 'failed'; }
  }

  if (!whatsappNumber) {
    if (waToken && waPhoneId && waTemplate) outcomes.whatsapp = 'skipped_no_valid_number';
  } else if (waToken && waPhoneId && waTemplate) {
    try {
      const response = await fetch(`https://graph.facebook.com/v23.0/${encodeURIComponent(waPhoneId)}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: whatsappNumber,
          type: 'template',
          template: {
            name: waTemplate,
            language: { code: waLanguage },
            components: [{ type: 'body', parameters: [{ type: 'text', text: String(name).slice(0, 60) }] }]
          }
        })
      });
      outcomes.whatsapp = response.ok ? 'sent' : 'failed';
    } catch { outcomes.whatsapp = 'failed'; }
  }

  const delivered = outcomes.email === 'sent' || outcomes.whatsapp === 'sent';
  if (!delivered) {
    await admin
      .from('profiles')
      .update({ welcome_message_sent_at: null })
      .eq('id', user.id)
      .eq('welcome_message_sent_at', claimedAt);
  }

  return NextResponse.json({ ok: delivered, outcomes });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
