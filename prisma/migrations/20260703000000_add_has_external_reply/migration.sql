-- Add hasExternalReply: tracks whether the review already has a public reply
-- on the source platform (e.g. written directly in Google's UI), so the app
-- can warn before postGoogleReply (PUT) silently overwrites it.
-- No new table, so no new RLS policies are needed; "Review" is already covered
-- by the policies from 20260601000000_add_rls_policies and later hardening.
ALTER TABLE "Review" ADD COLUMN "hasExternalReply" BOOLEAN NOT NULL DEFAULT false;
