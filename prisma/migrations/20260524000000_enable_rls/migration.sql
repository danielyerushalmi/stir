-- Enable Row Level Security on all public tables.
-- Prisma connects via a direct Postgres connection (service role) which bypasses RLS,
-- so application behaviour is unchanged. This closes the PostgREST/anon-key exposure
-- that Supabase flags when tables are public without RLS.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Restaurant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoiceSample" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Platform" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Insight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
