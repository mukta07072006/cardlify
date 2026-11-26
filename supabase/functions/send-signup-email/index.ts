// Sends the branded Cardlify sign-up confirmation through Resend.
// Supabase still owns the verification: the link comes from the Auth admin API, so
// it stays single use, is tied to the new account and expires like any confirmation
// link. The browser only posts what the sign-up form already collected.

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
const SITE_URL = 'https://cardlify.site';
const MIN_PASSWORD_LENGTH = 6;

const esc = (value: string) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const firstNameOf = (name: unknown) => {
  const cleaned = String(name ?? '')
    .replace(/[<>\r\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned.split(' ')[0].slice(0, 40);
};

interface EmailContent {
  firstName: string;
  email: string;
  actionLink: string;
}

const renderEmail = ({ firstName, email, actionLink }: EmailContent) => {
  const greeting = firstName ? `Welcome to Cardlify, ${esc(firstName)}.` : 'Welcome to Cardlify.';
  const link = esc(actionLink);
  const recipient = esc(email);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>Confirm your Cardlify account</title>
</head>
<body style="margin:0;padding:0;background:#f1eee5;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">One click confirms ${recipient} and unlocks your Cardlify studio.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1eee5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e3ded0;border-radius:20px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<tr><td style="height:6px;background:#c9ff3f;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:24px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-size:13px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#1a1915;">Cardlify</td>
    <td align="right" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a8a294;">Account</td>
  </tr></table>
</td></tr>
<tr><td style="padding:26px 32px 0;">
  <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#8d887a;">Confirm your email</p>
  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.25;font-weight:400;color:#1a1915;">${greeting}</h1>
  <p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:#5c584d;">Confirm <strong style="color:#1a1915;">${recipient}</strong> to activate your studio &mdash; the template editor, unlimited participant links and the whole export pipeline.</p>
</td></tr>
<tr><td style="padding:22px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f4ea;border:1px solid #e7e1d2;border-radius:16px;">
    <tr><td style="padding:18px 22px;font-size:13px;line-height:1.9;color:#5c584d;">
      100 free cards on the free plan<br />
      1 month of Elite free to claim<br />
      Participants never need an account
    </td></tr>
  </table>
</td></tr>
<tr><td align="center" style="padding:26px 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="background:#1a1915;border-radius:999px;"><a href="${link}" style="display:inline-block;padding:14px 30px;font-size:14px;font-weight:600;color:#f7f4ea;text-decoration:none;">Confirm email address</a></td>
  </tr></table>
</td></tr>
<tr><td style="padding:22px 32px 0;">
  <p style="margin:0;font-size:12px;line-height:1.7;color:#a8a294;">Button not working? Paste this link into your browser:<br /><a href="${link}" style="color:#5c584d;word-break:break-all;">${link}</a></p>
</td></tr>
<tr><td style="padding:16px 32px 0;">
  <p style="margin:0;font-size:12px;line-height:1.7;color:#a8a294;">This link expires in 1 hour and works once. If you didn't sign up to Cardlify, you can safely ignore this email.</p>
</td></tr>
<tr><td style="padding:20px 32px 26px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #efeade;"><tr>
    <td style="padding-top:16px;font-size:11px;line-height:1.6;color:#a8a294;">Sent by Cardlify &middot; <a href="${SITE_URL}" style="color:#8d887a;text-decoration:underline;">cardlify.site</a> &middot; <a href="mailto:admin@cardlify.site" style="color:#8d887a;text-decoration:none;">admin@cardlify.site</a></td>
  </tr></table>
</td></tr>
</table>
<p style="margin:16px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#b3ada0;">Cardlify &middot; card forms without the spreadsheet</p>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `Welcome to Cardlify${firstName ? `, ${firstName}` : ''}.`,
    '',
    `Confirm ${email} to activate your studio.`,
    '',
    'CONFIRM YOUR EMAIL:',
    actionLink,
    '',
    '100 free cards on the free plan',
    '1 month of Elite free to claim',
    'Participants never need an account',
    '',
    'This link expires in 1 hour and works once.',
    "If you didn't sign up to Cardlify, you can safely ignore this email.",
    '',
    'Sent by Cardlify · cardlify.site · admin@cardlify.site',
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

  if (!supabaseUrl || !serviceKey || !resendKey) {
    console.error('Sign-up email function is missing Supabase or Resend configuration');
    return json({ error: 'Email is not configured' }, 500);
  }

  let email = '';
  let password = '';
  let name = '';
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    password = typeof body?.password === 'string' ? body.password : '';
    name = typeof body?.name === 'string' ? body.name : '';
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return json({ error: 'Enter a valid email address' }, 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` }, 400);
  }
  if (password.length > 200) {
    return json({ error: 'Password is too long' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Creates the unconfirmed account (or re-issues a link for an unconfirmed one)
  // without asking Supabase's own mailer to send anything.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: { data: { name: name.trim().slice(0, 120) } },
  });

  if (linkError) {
    console.error('Could not generate a confirmation link:', linkError.message);
    const alreadyRegistered = /already|registered|exist/i.test(linkError.message ?? '');
    return json(
      {
        error: alreadyRegistered
          ? 'This email already has a Cardlify account. Sign in or reset your password.'
          : 'Could not create your account. Please try again.',
      },
      alreadyRegistered ? 409 : 502,
    );
  }

  const actionLink = linkData?.properties?.action_link ?? '';
  if (!actionLink) {
    console.error('Auth API returned no action link for', email);
    return json({ error: 'Could not create your confirmation link' }, 502);
  }

  const { html, text } = renderEmail({
    firstName: firstNameOf(name),
    email,
    actionLink,
  });

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Cardlify <${fromAddress}>`,
        to: [email],
        subject: 'Confirm your Cardlify account',
        html,
        text,
        headers: { 'X-Entity-Ref-ID': `signup-${Date.now()}` },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error('Resend request failed:', error);
    return json({ error: 'Could not reach the email provider' }, 502);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Resend rejected the sign-up email:', response.status, body);
    return json({ error: 'The email provider rejected the message' }, 502);
  }

  return json({ sent: true, id: body?.id ?? null });
});
