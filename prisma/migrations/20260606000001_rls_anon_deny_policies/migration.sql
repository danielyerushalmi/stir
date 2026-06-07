-- Explicit RESTRICTIVE deny policies for the anon role on every public-schema table.
--
-- Why RESTRICTIVE (not the default PERMISSIVE)?
--   Permissive policies are OR-combined: one passing policy grants access.
--   Restrictive policies are AND-combined with everything else: they can never be
--   overridden by a later PERMISSIVE allow policy. This means even if a developer
--   accidentally adds a broad PERMISSIVE policy for anon in the future, the anon
--   role still cannot access these tables via PostgREST.
--
-- Why add these if RLS already defaults to deny-all?
--   Explicit intent is auditable, satisfies security scanners, and documents that
--   the anon lockout is deliberate rather than accidental omission.

CREATE POLICY "anon_deny" ON "User"           AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "Restaurant"     AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "VoiceSample"    AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "Platform"       AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "Review"         AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "ReviewResponse" AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "Insight"        AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "Subscription"   AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "anon_deny" ON "_prisma_migrations" AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
