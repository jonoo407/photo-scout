-- Webhook shared secret (2026-09-24).
--
-- The three pg_net triggers (notify_shortlist_response, feedback_notify,
-- photo_report_notify) posted to the Worker with nothing but Content-Type,
-- and the Worker checked nothing, so anyone could drive the push + email legs
-- — and the email leg shares Resend's quota with password-reset mail. The
-- Worker now refuses any hook request whose `x-vantage-hook-secret` header
-- isn't SUPABASE_HOOK_SECRET; this migration makes the triggers send it.
--
-- The value is the EXISTING internal.config.worker_hook_secret, which already
-- has to equal the Worker secret SUPABASE_HOOK_SECRET for get_owner_email().
-- One shared value between the same two parties; rotate by updating both.
--
-- ROLLOUT ORDER: apply this BEFORE deploying the Worker that checks it. The old
-- Worker ignores the extra header; the new Worker refuses hooks without it.
--
-- The trigger bodies are patched in place from their LIVE definitions rather
-- than re-declared here, because the repo does not carry every body verbatim
-- (photo_report_notify lives only in its migration). CREATE OR REPLACE keeps
-- each function's owner and the EXECUTE lockdown from
-- supabase/function-access.ts. Re-running is a no-op.

create or replace function internal.worker_hook_headers()
returns jsonb
language sql
stable
security definer
set search_path = internal
as $$
  select jsonb_build_object(
    'Content-Type', 'application/json',
    'x-vantage-hook-secret',
    coalesce((select value from internal.config where key = 'worker_hook_secret'), '')
  );
$$;

revoke all on function internal.worker_hook_headers() from public;
revoke all on function internal.worker_hook_headers() from anon, authenticated;

do $$
declare
  fn text;
  def text;
  patched text;
begin
  if coalesce((select value from internal.config where key = 'worker_hook_secret'), '') = '' then
    raise exception 'internal.config.worker_hook_secret is not set. Set it to the same value as the Worker secret SUPABASE_HOOK_SECRET, then re-run.';
  end if;

  foreach fn in array array['notify_shortlist_response', 'feedback_notify', 'photo_report_notify'] loop
    def := pg_get_functiondef(format('public.%I()', fn)::regprocedure);
    if position('internal.worker_hook_headers()' in def) > 0 then
      continue;
    end if;
    patched := regexp_replace(
      def,
      'headers\s*:=\s*''\{\s*"Content-Type"\s*:\s*"application/json"\s*\}''::jsonb',
      'headers := internal.worker_hook_headers()',
      'g'
    );
    if patched = def then
      raise exception 'public.%() does not post the expected Content-Type-only headers; add internal.worker_hook_headers() to it by hand.', fn;
    end if;
    execute patched;
  end loop;
end
$$;
