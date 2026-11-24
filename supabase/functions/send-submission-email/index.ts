// Sends the branded confirmation email for a form submission through Resend.
// The browser only passes a submission id; recipient, project and the
// notification switch are all read server-side with the service role key.

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
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_FROM = 'admin@cardlify.site';

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

const serialPrefix = (title: string) => {
  const words = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .filter((word) => !/^\d+$/.test(word));
  if (words.length === 0) return 'CARD';
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words.slice(0, 3).map((word) => word[0]).join('').toUpperCase();
};

const serialCode = (title: string) => {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${serialPrefix(title)}-${suffix}`;
};

const findRecipient = (fieldValues: unknown) => {
  if (!fieldValues || typeof fieldValues !== 'object') return '';
  for (const raw of Object.values(fieldValues as Record<string, unknown>)) {
    for (const candidate of Array.isArray(raw) ? raw : [raw]) {
      if (typeof candidate === 'string' && EMAIL_PATTERN.test(candidate.trim())) {
        return candidate.trim();
      }
    }
  }
  return '';
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });

interface EmailContent {
  senderName: string;
  recipientName: string;
  projectTitle: string;
  serialCode: string;
  submittedAt: string;
  formUrl: string;
}

const renderEmail = (content: EmailContent) => {
  const sender = esc(content.senderName);
  const recipient = esc(content.recipientName);
  const title = esc(content.projectTitle);
  const code = esc(content.serialCode);
  const submittedAt = esc(content.submittedAt);
  const link = esc(content.formUrl);

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="color-scheme" content="light" /><title>${code} · ${title}</title></head>
<body style="margin:0;padding:0;background:#f1eee5;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Your entry is confirmed. Serial code ${code}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1eee5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e3ded0;border-radius:20px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<tr><td style="height:6px;background:#c9ff3f;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:26px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#8d887a;">${sender}</td>
    <td align="right" style="font-size:12px;color:#a8a294;">Cardlify</td>
  </tr></table>
</td></tr>
<tr><td style="padding:26px 32px 0;">
  <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#8d887a;">Submission confirmed</p>
  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;font-weight:400;color:#1a1915;">You're in, ${recipient}.</h1>
  <p style="margin:16px 0 0;font-size:15px;line-height:1.65;color:#5c584d;">Thanks for answering <strong style="color:#1a1915;">${title}</strong>. Your response is with the organiser, and this email is your receipt.</p>
</td></tr>
<tr><td style="padding:24px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f4ea;border:1px dashed #d3ccb8;border-radius:16px;"><tr><td align="center" style="padding:22px 20px;">
    <p style="margin:0;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#8d887a;">Your serial code</p>
    <p style="margin:8px 0 0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;letter-spacing:.16em;color:#1a1915;">${code}</p>
    <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#8d887a;">Keep this code in case the organiser asks for it.</p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:22px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#5c584d;">
    <tr><td style="padding:9px 0;border-bottom:1px solid #efeade;">Form</td><td align="right" style="padding:9px 0;border-bottom:1px solid #efeade;color:#1a1915;font-weight:500;">${title}</td></tr>
    <tr><td style="padding:9px 0;border-bottom:1px solid #efeade;">Submitted</td><td align="right" style="padding:9px 0;border-bottom:1px solid #efeade;color:#1a1915;font-weight:500;">${submittedAt}</td></tr>
    <tr><td style="padding:9px 0;">Reply to</td><td align="right" style="padding:9px 0;color:#1a1915;font-weight:500;">${sender}</td></tr>
  </table>
</td></tr>
<tr><td style="padding:26px 32px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#1a1915;border-radius:999px;"><a href="${link}" style="display:inline-block;padding:13px 24px;font-size:13px;font-weight:600;color:#f7f4ea;text-decoration:none;">View the form again</a></td></tr></table>
</td></tr>
<tr><td style="padding:26px 32px 0;"><p style="margin:0;font-size:12px;line-height:1.6;color:#a8a294;">Didn't submit this? You can safely ignore this email.</p></td></tr>
<tr><td style="padding:22px 32px 28px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #efeade;"><tr><td style="padding-top:16px;font-size:11px;line-height:1.6;color:#a8a294;">Sent by ${sender} with <a href="https://cardlify.site" style="color:#8d887a;text-decoration:underline;">Cardlify</a> · admin@cardlify.site</td></tr></table>
</td></tr>
</table>
<p style="margin:16px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#b3ada0;">${title} · ${code}</p>
</td></tr></table></body></html>`;

  const text = [
    `You're in, ${content.recipientName}.`,
    '',
    `Thanks for answering ${content.projectTitle}. Your response is with the organiser.`,
    '',
    `YOUR SERIAL CODE: ${content.serialCode}`,
    '',
    `Form: ${content.projectTitle}`,
    `Submitted: ${content.submittedAt}`,
    `Reply to: ${content.senderName}`,
    `Form link: ${content.formUrl}`,
    '',
    "Didn't submit this? You can safely ignore this email.",
    '',
    `Sent by ${content.senderName} with Cardlify · admin@cardlify.site`,
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

  if (!supabaseUrl || !serviceKey || !resendKey) {
    console.error('Email function is missing Supabase or Resend configuration');
    return json({ error: 'Email is not configured' }, 500);
  }

  let submissionId = '';
  try {
    const body = await request.json();
    submissionId = typeof body?.submissionId === 'string' ? body.submissionId : '';
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId)) {
    return json({ error: 'Invalid submission id' }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select('id, project_id, participant_name, serial_code, email_sent_at, field_values, created_at')
    .eq('id', submissionId)
    .maybeSingle();

  if (submissionError) {
    console.error('Could not read submission:', submissionError);
    return json({ error: 'Could not read the submission' }, 500);
  }
  if (!submission) return json({ error: 'Submission not found' }, 404);
  if (submission.email_sent_at) return json({ skipped: 'already-sent' });

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, project_name, form_title, email_notifications_enabled, email_sender_name, user_id')
    .eq('id', submission.project_id)
    .maybeSingle();

  if (projectError) {
    console.error('Could not read project:', projectError);
    return json({ error: 'Could not read the project' }, 500);
  }
  if (!project || !project.email_notifications_enabled) return json({ skipped: 'not-enabled' });

  // Confirmation emails are an Elite feature — enforce it here, not just in the UI.
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('user_id', project.user_id)
    .maybeSingle();

  if (ownerProfile?.subscription_tier !== 'elite') return json({ skipped: 'not-elite' });

  const recipient = findRecipient(submission.field_values);
  if (!recipient) return json({ skipped: 'no-recipient' });

  const projectTitle = (project.form_title || project.project_name || 'your form').trim();
  const senderName =
    sanitizeName(project.email_sender_name) || project.project_name || 'Cardlify';
  const code = submission.serial_code || serialCode(projectTitle);

  let replyTo: string | undefined;
  if (project.user_id) {
    const { data: owner } = await supabase.auth.admin.getUserById(project.user_id);
    const ownerEmail = owner?.user?.email?.trim();
    if (ownerEmail && EMAIL_PATTERN.test(ownerEmail)) replyTo = ownerEmail;
  }

  const { html, text } = renderEmail({
    senderName,
    recipientName: (submission.participant_name || 'there').trim(),
    projectTitle,
    serialCode: code,
    submittedAt: formatDate(submission.created_at),
    formUrl: `${appUrl}/submit/${project.id}`,
  });

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${senderName.replace(/[\\"]/g, '')} <${fromAddress}>`,
        to: [recipient],
        reply_to: replyTo,
        subject: `${code} — your ${projectTitle} confirmation`,
        html,
        text,
        headers: { 'X-Entity-Ref-ID': submission.id },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error('Resend request failed:', error);
    return json({ error: 'Could not reach the email provider' }, 502);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Resend rejected the message:', response.status, body);
    return json({ error: 'The email provider rejected the message' }, 502);
  }

  const { error: updateError } = await supabase
    .from('submissions')
    .update({ serial_code: code, email_sent_at: new Date().toISOString() })
    .eq('id', submission.id)
    .is('email_sent_at', null);

  if (updateError) console.error('Email sent but the submission was not updated:', updateError);

  return json({ sent: true, id: body?.id ?? null, serialCode: code });
});
