BEGIN;

-- Supabase Security Advisor: rls_disabled_in_public remediation.
-- Data API exposure must be explicit: GRANT controls object access, RLS controls row access.

-- AI usage logs: signed-in users may only read and create their own log rows.
ALTER TABLE public.ai_writing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_landing_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_writing_logs FROM anon;
REVOKE ALL ON TABLE public.ai_landing_logs FROM anon;
REVOKE ALL ON TABLE public.ai_writing_logs FROM authenticated;
REVOKE ALL ON TABLE public.ai_landing_logs FROM authenticated;

GRANT SELECT, INSERT ON TABLE public.ai_writing_logs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.ai_landing_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_writing_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_landing_logs TO service_role;

DROP POLICY IF EXISTS ai_writing_logs_select_own ON public.ai_writing_logs;
CREATE POLICY ai_writing_logs_select_own
  ON public.ai_writing_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_writing_logs_insert_own ON public.ai_writing_logs;
CREATE POLICY ai_writing_logs_insert_own
  ON public.ai_writing_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ai_landing_logs_select_own ON public.ai_landing_logs;
CREATE POLICY ai_landing_logs_select_own
  ON public.ai_landing_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_landing_logs_insert_own ON public.ai_landing_logs;
CREATE POLICY ai_landing_logs_insert_own
  ON public.ai_landing_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Purchase links are sensitive campaign operation data. App access must go through server APIs.
ALTER TABLE public.campaign_purchase_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.campaign_purchase_links FROM anon;
REVOKE ALL ON TABLE public.campaign_purchase_links FROM authenticated;
REVOKE ALL ON SEQUENCE public.campaign_purchase_links_id_seq FROM anon;
REVOKE ALL ON SEQUENCE public.campaign_purchase_links_id_seq FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaign_purchase_links TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.campaign_purchase_links_id_seq TO service_role;

DROP POLICY IF EXISTS campaign_purchase_links_select_own_campaign ON public.campaign_purchase_links;
DROP POLICY IF EXISTS campaign_purchase_links_insert_own_campaign ON public.campaign_purchase_links;
DROP POLICY IF EXISTS campaign_purchase_links_update_own_campaign ON public.campaign_purchase_links;
DROP POLICY IF EXISTS campaign_purchase_links_delete_own_campaign ON public.campaign_purchase_links;

-- Video chapters are created and updated by the worker/server. Users may only read chapters for their own jobs.
ALTER TABLE public.ai_video_job_chapters ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ai_video_job_chapters FROM anon;
REVOKE ALL ON TABLE public.ai_video_job_chapters FROM authenticated;

GRANT SELECT ON TABLE public.ai_video_job_chapters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_video_job_chapters TO service_role;

DROP POLICY IF EXISTS ai_video_job_chapters_select_own_job ON public.ai_video_job_chapters;
CREATE POLICY ai_video_job_chapters_select_own_job
  ON public.ai_video_job_chapters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.ai_video_jobs jobs
      WHERE jobs.id = ai_video_job_chapters.job_id
        AND jobs.user_id = auth.uid()
    )
  );

COMMIT;
