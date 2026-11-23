-- =============================================
-- Confirmation emails for form projects
-- =============================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS email_sender_name TEXT;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS serial_code TEXT;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.projects.email_notifications_enabled IS
  'When true, a confirmation email with a serial code is sent to each submitter.';
COMMENT ON COLUMN public.projects.email_sender_name IS
  'Display name used in the From header; the address is always admin@cardlify.site.';
COMMENT ON COLUMN public.submissions.serial_code IS
  'Reference code printed in the confirmation email, e.g. ADS-K7QP.';
COMMENT ON COLUMN public.submissions.email_sent_at IS
  'Set by the send-submission-email edge function after Resend accepts the message.';
