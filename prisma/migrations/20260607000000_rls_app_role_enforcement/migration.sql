-- M1: Real RLS enforcement via a dedicated, non-BYPASSRLS application role.
--
-- Background
--   Until now RLS was ENABLED on every table but the app connected as a
--   service/owner role with BYPASSRLS, so policies never applied — tenant
--   isolation rested entirely on application-level `where: { userId }` filters.
--   This migration adds a real, database-enforced isolation layer keyed to a
--   per-request session variable (`app.clerk_user_id`) set by the application
--   inside each query's transaction (see lib/db.ts).
--
-- Rollout (these steps are intentionally NOT in this migration so secrets stay
-- out of git, and so the cutover is reversible):
--   1. In Supabase SQL editor, give the role a login + password:
--        ALTER ROLE stir_app WITH LOGIN PASSWORD '<generated-strong-password>';
--   2. Point the app's DATABASE_URL at this role (keep DIRECT_URL on the
--      postgres/service role for migrations + seed).
--   3. Set RLS_ENFORCED=true in the app environment and redeploy.
--   To roll back: unset RLS_ENFORCED (app reverts to prior behaviour). The role
--   and policies are harmless while the app still connects as service_role.
--
-- Migrations and the seed run via DIRECT_URL (service role, BYPASSRLS), so they
-- are unaffected by everything below.

-- ---------------------------------------------------------------------------
-- 1. Dedicated application role (no LOGIN/password here — see rollout step 1)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stir_app') THEN
    CREATE ROLE stir_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO stir_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stir_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO stir_app;

-- _prisma_migrations has RLS enabled with no policy for stir_app, so the grant
-- above is inert for it (deny-by-default). Revoke anyway to make intent explicit.
REVOKE ALL ON "_prisma_migrations" FROM stir_app;

-- ---------------------------------------------------------------------------
-- 2. Ownership-resolution helpers (SECURITY DEFINER → run as owner, which
--    bypasses RLS, so they resolve the clerkId→user→restaurant chain without
--    recursing into the policies that call them).
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA app TO stir_app;

-- Current request's Clerk user id (NULL when unset → policies deny by default).
CREATE OR REPLACE FUNCTION app.current_clerk_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.clerk_user_id', true), '') $$;

-- Current request's internal User.id.
CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT id FROM "User" WHERE "clerkId" = app.current_clerk_id() $$;

-- Does the given restaurant belong to the current user?
CREATE OR REPLACE FUNCTION app.owns_restaurant(rid text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM "Restaurant" r
      WHERE r.id = rid AND r."userId" = app.current_user_id()
    )
  $$;

-- Does the given review belong to a restaurant owned by the current user?
CREATE OR REPLACE FUNCTION app.owns_review(rid text) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM "Review" rv
      WHERE rv.id = rid AND app.owns_restaurant(rv."restaurantId")
    )
  $$;

REVOKE EXECUTE ON FUNCTION
  app.current_clerk_id(), app.current_user_id(),
  app.owns_restaurant(text), app.owns_review(text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION
  app.current_clerk_id(), app.current_user_id(),
  app.owns_restaurant(text), app.owns_review(text)
  TO stir_app;

-- ---------------------------------------------------------------------------
-- 3. Per-tenant policies for the application role.
--    USING gates reads/updates/deletes; WITH CHECK gates inserts/updated rows.
-- ---------------------------------------------------------------------------
CREATE POLICY "stir_app_User" ON "User" TO stir_app
  USING ("clerkId" = app.current_clerk_id())
  WITH CHECK ("clerkId" = app.current_clerk_id());

CREATE POLICY "stir_app_Restaurant" ON "Restaurant" TO stir_app
  USING ("userId" = app.current_user_id())
  WITH CHECK ("userId" = app.current_user_id());

CREATE POLICY "stir_app_VoiceSample" ON "VoiceSample" TO stir_app
  USING (app.owns_restaurant("restaurantId"))
  WITH CHECK (app.owns_restaurant("restaurantId"));

CREATE POLICY "stir_app_Platform" ON "Platform" TO stir_app
  USING (app.owns_restaurant("restaurantId"))
  WITH CHECK (app.owns_restaurant("restaurantId"));

CREATE POLICY "stir_app_Review" ON "Review" TO stir_app
  USING (app.owns_restaurant("restaurantId"))
  WITH CHECK (app.owns_restaurant("restaurantId"));

CREATE POLICY "stir_app_ReviewResponse" ON "ReviewResponse" TO stir_app
  USING (app.owns_review("reviewId"))
  WITH CHECK (app.owns_review("reviewId"));

CREATE POLICY "stir_app_Insight" ON "Insight" TO stir_app
  USING (app.owns_restaurant("restaurantId"))
  WITH CHECK (app.owns_restaurant("restaurantId"));

CREATE POLICY "stir_app_Subscription" ON "Subscription" TO stir_app
  USING (app.owns_restaurant("restaurantId"))
  WITH CHECK (app.owns_restaurant("restaurantId"));
