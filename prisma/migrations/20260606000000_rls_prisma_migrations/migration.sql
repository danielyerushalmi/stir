-- Enable RLS on Prisma's internal migration tracking table.
-- This table sits in the public schema (which PostgREST exposes), so without RLS
-- any request with an anon/authenticated key could read or modify migration history.
-- Prisma connects as the postgres/service role which bypasses RLS, so this has
-- no effect on migrations themselves.
-- No policies are added — the table is intentionally inaccessible via PostgREST.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
