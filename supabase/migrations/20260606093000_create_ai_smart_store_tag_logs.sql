BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_smart_store_tag_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed_keyword TEXT NOT NULL,
  category_path TEXT NOT NULL,
  tag_count INTEGER NOT NULL DEFAULT 0 CHECK (tag_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_smart_store_tag_logs_user_created_idx
  ON public.ai_smart_store_tag_logs (user_id, created_at DESC);

ALTER TABLE public.ai_smart_store_tag_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_smart_store_tag_logs FROM anon;
REVOKE ALL ON TABLE public.ai_smart_store_tag_logs FROM authenticated;

GRANT SELECT, INSERT ON TABLE public.ai_smart_store_tag_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_smart_store_tag_logs TO service_role;

DROP POLICY IF EXISTS ai_smart_store_tag_logs_select_own ON public.ai_smart_store_tag_logs;
CREATE POLICY ai_smart_store_tag_logs_select_own
  ON public.ai_smart_store_tag_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_smart_store_tag_logs_insert_own ON public.ai_smart_store_tag_logs;
CREATE POLICY ai_smart_store_tag_logs_insert_own
  ON public.ai_smart_store_tag_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMIT;
