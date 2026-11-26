BEGIN;
CREATE TABLE public.app_snapshots (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
 data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_snapshots FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.app_snapshots TO authenticated;
CREATE POLICY snapshot_owner ON public.app_snapshots FOR ALL TO authenticated
 USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
COMMIT;
