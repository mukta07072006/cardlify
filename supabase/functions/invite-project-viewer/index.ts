// Invites someone by email to read one project's registrations (read-only).
// The caller must own the project; the invite row is written server-side and
// the invitation is delivered through Resend.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DEFAULT_FROM = 'admin@cardlify.site';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const esc = (value: string) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeName = (name: unknown) =>
  String(name ?? '')
    .replace(/[<>"\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

const renderInvite = (content: {
  projectTitle: string;
  organiser: string;
  invitee: string;
  link: string;
}) => {
  const title = esc(content.projectTitle);
  const organiser = esc(content.organiser);
  const invitee = esc(content.invitee);
  const link = esc(content.link);

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="color-scheme" content="light" /><title>${title} · registrations</title></head>
<body style="margin:0;padding:0;background:#f1eee5;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">You can now view the registrations for ${title}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1eee5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e3ded0;border-radius:20px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<tr><td style="height:6px;background:#c9ff3f;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:26px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#8d887a;">${organiser}</td>
    <td align="right" style="font-size:12px;color:#a8a294;">Cardlify</td>
  </tr></table>
</td></tr>
<tr><td style="padding:26px 32px 0;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#8d887a;">Read-only access</p>
  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.25;font-weight:400;color:#1a1915;">Registrations for ${title}</h1>
  <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#5c584d;">${organiser} gave you access to the registration list. You can read every response and export it as a spreadsheet — you cannot change or delete anything.</p>
</td></tr>
<tr><td style="padding:24px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f4ea;border:1px dashed #d3ccb8;border-radius:16px;"><tr><td style="padding:18px 20px;">
    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#8d887a;">Sign in with this address</p>
    <p style="margin:8px 0 0;font-size:15px;font-weight:600;color:#1a1915;">${invitee}</p>
    <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#8d887a;">No Cardlify account yet? Create one with this exact email address and the link will open.</p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:26px 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#1a1915;border-radius:999px;"><a href="${link}" style="display:inline-block;padding:13px 24px;font-size:13px;font-weight:600;color:#f7f4ea;text-decoration:none;">View the registrations</a></td></tr></table>
</td></tr>
<tr><td style="padding:22px 32px 0;"><p style="margin:0;font-size:12px;line-height:1.6;color:#a8a294;">If you were not expecting this, you can ignore this email — nothing is shared until you sign in.</p></td></tr>
<tr><td style="padding:22px 32px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #efeade;"><tr><td style="padding-top:16px;font-size:11px;line-height:1.6;color:#a8a294;">Sent by ${organiser} with <a href="https://cardlify.site" style="color:#8d887a;text-decoration:underline;">Cardlify</a> · admin@cardlify.site</td></tr></table>
</td></tr>
</table>
<p style="margin:16px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#b3ada0;">${title} · read-only access</p>
</td></tr></table></body></html>`;

  const text = [
    `Registrations for ${content.projectTitle}`,
    '',
    `${content.organiser} gave you read-only access to the registration list.`,
    'You can read every response and export it as a spreadsheet — you cannot change or delete anything.',
    '',
    `Sign in with this address: ${content.invitee}`,
    'No Cardlify account yet? Create one with this exact email address and the link will open.',
    '',
    `Open the registrations: ${content.link}`,
    '',
    "If you were not expecting this, you can ignore this email.",
    '',
    `Sent by ${content.organiser} with Cardlify · admin@cardlify.site`,
  ].join('\n');

  return { html, text };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const fromAddress = Deno.env.get('RESEND_FROM_EMAIL') || DEFAULT_FROM;
  const appUrl = (Deno.env.get('APP_URL') || 'https://cardlify.site').replace(/\/+$/, '');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!supabaseUrl || !serviceKey) {
    console.error('Viewer invite function is missing Supabase configuration');
    return json({ error: 'Invites are not configured' }, 500);
  }

  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Sign in to invite someone' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the caller with an anon client so the token is validated, not trusted.
  const asUser = createClient(supabaseUrl, anonKey || serviceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await asUser.auth.getUser(token);
  const caller = authData?.user;
  if (authError || !caller) return json({ error: 'Sign in again to invite someone' }, 401);

  let projectId = '';
  let rawEmail = '';
  try {
    const body = await request.json();
    projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : '';
    rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!UUID_PATTERN.test(projectId)) return json({ error: 'Invalid project' }, 400);
  const email = rawEmail.toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return json({ error: 'Enter a valid email address' }, 400);
  if (caller.email && caller.email.toLowerCase() === email) {
    return json({ error: 'That is your own email address' }, 400);
  }

  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('id, project_name, form_title, user_id')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    console.error('Could not read the project:', projectError);
    return json({ error: 'Could not read the project' }, 500);
  }
  if (!project) return json({ error: 'Project not found' }, 404);
  if (project.user_id !== caller.id) {
    return json({ error: 'Only the project owner can invite people' }, 403);
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('name, email')
    .eq('user_id', caller.id)
    .maybeSingle();

  const organiser =
    sanitizeName(profile?.name) || sanitizeName(caller.email?.split('@')[0]) || 'The organiser';
  const projectTitle = sanitizeName(project.form_title) || sanitizeName(project.project_name) || 'your form';

  const { data: viewer, error: inviteError } = await admin
    .from('project_viewers')
    .upsert(
      {
        project_id: projectId,
        email,
        invited_by: caller.id,
        invited_by_name: organiser,
      },
      { onConflict: 'project_id,email' },
    )
    .select('id, email, created_at')
    .single();

  if (inviteError) {
    console.error('Could not save the invite:', inviteError);
    return json({ error: 'Could not save this invite' }, 500);
  }

  const link = `${appUrl}/project/${projectId}/viewer`;
  const { html, text } = renderInvite({
    projectTitle,
    organiser,
    invitee: email,
    link,
  });

  if (!resendKey) {
    return json({
      invited: true,
      emailed: false,
      viewer,
      link,
      error: 'Invite saved, but email is not configured',
    });
  }

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${organiser.replace(/[\\"]/g, '')} <${fromAddress}>`,
        to: [email],
        reply_to: caller.email || fromAddress,
        subject: `You can view the registrations for ${projectTitle}`,
        html,
        text,
        headers: { 'X-Entity-Ref-ID': `viewer-${viewer.id}` },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error('Resend request failed:', error);
    return json({ invited: true, emailed: false, viewer, link, error: 'Could not reach the email provider' });
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Resend rejected the invite:', response.status, body);
    return json({
      invited: true,
      emailed: false,
      viewer,
      link,
      error: 'The email provider rejected the message',
    });
  }

  return json({ invited: true, emailed: true, viewer, link, id: body?.id ?? null });
});
