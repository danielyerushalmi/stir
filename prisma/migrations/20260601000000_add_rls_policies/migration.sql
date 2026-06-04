-- Migration: Add explicit RLS policies for all tables
-- Context: RLS was enabled in 20260524000000_enable_rls but no policies were defined,
-- which blocks any direct Postgres connection without BYPASSRLS (e.g., anon key, reporting tools).
-- This adds permissive service_role policies as a baseline.

-- Allow service role full access (Prisma uses service role which has BYPASSRLS anyway,
-- but explicit policies prevent breakage if anon-key access is ever added)

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_User" ON "User" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "Restaurant" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_Restaurant" ON "Restaurant" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "VoiceSample" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_VoiceSample" ON "VoiceSample" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "Platform" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_Platform" ON "Platform" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_Review" ON "Review" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "ReviewResponse" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_ReviewResponse" ON "ReviewResponse" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "Insight" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_Insight" ON "Insight" TO service_role USING (true) WITH CHECK (true);

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_Subscription" ON "Subscription" TO service_role USING (true) WITH CHECK (true);
