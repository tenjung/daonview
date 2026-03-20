BEGIN;

-- 1) 캠페인별 구매링크 풀
CREATE TABLE IF NOT EXISTS public.campaign_purchase_links (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  option_label TEXT NOT NULL,
  purchase_link_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaign_purchase_links_option_key_upper_chk CHECK (option_key = UPPER(option_key))
);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_purchase_links_unique_link
  ON public.campaign_purchase_links (campaign_id, option_key, purchase_link_url);

CREATE INDEX IF NOT EXISTS campaign_purchase_links_campaign_option_active_idx
  ON public.campaign_purchase_links (campaign_id, option_key, is_active);

CREATE INDEX IF NOT EXISTS campaign_purchase_links_campaign_active_idx
  ON public.campaign_purchase_links (campaign_id, is_active);

-- 2) 신청서 할당 스냅샷
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS assigned_option_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_option_label TEXT NULL,
  ADD COLUMN IF NOT EXISTS assigned_purchase_link_id BIGINT NULL REFERENCES public.campaign_purchase_links(id),
  ADD COLUMN IF NOT EXISTS assigned_purchase_link_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS link_assigned_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS link_updated_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS applications_assigned_purchase_link_id_idx
  ON public.applications (assigned_purchase_link_id);

CREATE INDEX IF NOT EXISTS applications_campaign_status_assigned_link_idx
  ON public.applications (campaign_id, status, assigned_purchase_link_id);

-- 3) 옵션 키 정규화 함수
CREATE OR REPLACE FUNCTION public.normalize_option_key(p_option_label TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT UPPER(TRIM(REGEXP_REPLACE(COALESCE(p_option_label, ''), '\s+', ' ', 'g')));
$$;

-- 4) 선정 + 링크배정 원자 처리
CREATE OR REPLACE FUNCTION public.select_application_with_link(
  p_application_id BIGINT,
  p_campaign_id BIGINT,
  p_actor_user_id UUID,
  p_is_admin BOOLEAN,
  p_target_status TEXT,
  p_assigned_option_label TEXT,
  p_manual_link_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  application_id BIGINT,
  assigned_purchase_link_id BIGINT,
  assigned_purchase_link_url TEXT,
  assigned_option_key TEXT,
  assigned_option_label TEXT,
  status TEXT,
  review_deadline TIMESTAMPTZ,
  link_assigned_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_target_status TEXT := UPPER(TRIM(COALESCE(p_target_status, '')));
  v_option_label TEXT := TRIM(REGEXP_REPLACE(COALESCE(p_assigned_option_label, ''), '\s+', ' ', 'g'));
  v_option_key TEXT := public.normalize_option_key(p_assigned_option_label);
  v_campaign RECORD;
  v_application RECORD;
  v_assigned_link RECORD;
  v_product_url_individual BOOLEAN := FALSE;
  v_next_review_deadline TIMESTAMPTZ := NULL;
BEGIN
  IF v_target_status NOT IN ('SELECTED', 'APPROVED') THEN
    RAISE EXCEPTION 'target status must be SELECTED or APPROVED';
  END IF;

  IF v_option_key = '' THEN
    RAISE EXCEPTION 'assigned option label is required';
  END IF;

  SELECT c.id, c.created_by, c.type, c.is_always, c.campaign_options
    INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign not found';
  END IF;

  IF NOT p_is_admin AND v_campaign.created_by <> p_actor_user_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT a.*
    INTO v_application
  FROM public.applications a
  WHERE a.id = p_application_id
    AND a.campaign_id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found';
  END IF;

  IF UPPER(COALESCE(v_application.status, '')) <> 'PENDING' THEN
    RAISE EXCEPTION 'only pending applications can be selected';
  END IF;

  v_product_url_individual := LOWER(
    COALESCE(
      v_campaign.campaign_options -> 'step1Data' ->> 'productUrlIndividual',
      v_campaign.campaign_options -> 0 -> 'step1Data' ->> 'productUrlIndividual',
      v_campaign.campaign_options ->> 'productUrlIndividual',
      'false'
    )
  ) IN ('true', 't', '1', 'yes', 'on');

  IF v_product_url_individual THEN
    IF p_manual_link_id IS NOT NULL THEN
      SELECT l.*
        INTO v_assigned_link
      FROM public.campaign_purchase_links l
      WHERE l.id = p_manual_link_id
        AND l.campaign_id = p_campaign_id
        AND l.option_key = v_option_key
        AND l.is_active = TRUE
      FOR UPDATE;
    ELSE
      SELECT l.*
        INTO v_assigned_link
      FROM public.campaign_purchase_links l
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS usage_count
        FROM public.applications a
        WHERE a.campaign_id = p_campaign_id
          AND a.assigned_purchase_link_id = l.id
          AND UPPER(COALESCE(a.status, '')) IN ('SELECTED', 'APPROVED')
      ) usage ON TRUE
      WHERE l.campaign_id = p_campaign_id
        AND l.option_key = v_option_key
        AND l.is_active = TRUE
      ORDER BY COALESCE(usage.usage_count, 0) ASC, l.id ASC
      FOR UPDATE OF l
      LIMIT 1;
    END IF;

    IF v_assigned_link.id IS NULL THEN
      RAISE EXCEPTION 'no available purchase link for option %', v_option_label;
    END IF;
  END IF;

  IF UPPER(COALESCE(v_campaign.type, '')) = 'VISIT' AND COALESCE(v_campaign.is_always, FALSE) = TRUE THEN
    v_next_review_deadline := v_now + INTERVAL '14 days';
  END IF;

  RETURN QUERY
  UPDATE public.applications a
  SET
    status = v_target_status,
    selected_at = COALESCE(a.selected_at, v_now),
    review_deadline = COALESCE(v_next_review_deadline, a.review_deadline),
    assigned_option_key = v_option_key,
    assigned_option_label = v_option_label,
    assigned_purchase_link_id = CASE WHEN v_product_url_individual THEN v_assigned_link.id ELSE NULL END,
    assigned_purchase_link_url = CASE WHEN v_product_url_individual THEN v_assigned_link.purchase_link_url ELSE NULL END,
    link_assigned_at = CASE
      WHEN v_product_url_individual THEN COALESCE(a.link_assigned_at, v_now)
      ELSE NULL
    END,
    link_updated_at = CASE WHEN v_product_url_individual THEN v_now ELSE NULL END
  WHERE a.id = p_application_id
  RETURNING
    a.id,
    a.assigned_purchase_link_id,
    a.assigned_purchase_link_url,
    a.assigned_option_key,
    a.assigned_option_label,
    a.status,
    a.review_deadline,
    a.link_assigned_at;
END;
$$;

-- 5) 링크 재할당 + 자동 재발송 트리거용 RPC
CREATE OR REPLACE FUNCTION public.reassign_application_link(
  p_application_id BIGINT,
  p_campaign_id BIGINT,
  p_actor_user_id UUID,
  p_is_admin BOOLEAN,
  p_assigned_option_label TEXT,
  p_manual_link_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  application_id BIGINT,
  assigned_purchase_link_id BIGINT,
  assigned_purchase_link_url TEXT,
  assigned_option_key TEXT,
  assigned_option_label TEXT,
  status TEXT,
  review_deadline TIMESTAMPTZ,
  link_assigned_at TIMESTAMPTZ,
  link_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_option_label TEXT := TRIM(REGEXP_REPLACE(COALESCE(p_assigned_option_label, ''), '\s+', ' ', 'g'));
  v_option_key TEXT := public.normalize_option_key(p_assigned_option_label);
  v_campaign RECORD;
  v_application RECORD;
  v_assigned_link RECORD;
  v_product_url_individual BOOLEAN := FALSE;
BEGIN
  IF v_option_key = '' THEN
    RAISE EXCEPTION 'assigned option label is required';
  END IF;

  SELECT c.id, c.created_by, c.campaign_options
    INTO v_campaign
  FROM public.campaigns c
  WHERE c.id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'campaign not found';
  END IF;

  IF NOT p_is_admin AND v_campaign.created_by <> p_actor_user_id THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  SELECT a.*
    INTO v_application
  FROM public.applications a
  WHERE a.id = p_application_id
    AND a.campaign_id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found';
  END IF;

  IF UPPER(COALESCE(v_application.status, '')) NOT IN ('SELECTED', 'APPROVED') THEN
    RAISE EXCEPTION 'application must be selected or approved';
  END IF;

  v_product_url_individual := LOWER(
    COALESCE(
      v_campaign.campaign_options -> 'step1Data' ->> 'productUrlIndividual',
      v_campaign.campaign_options -> 0 -> 'step1Data' ->> 'productUrlIndividual',
      v_campaign.campaign_options ->> 'productUrlIndividual',
      'false'
    )
  ) IN ('true', 't', '1', 'yes', 'on');

  IF NOT v_product_url_individual THEN
    RAISE EXCEPTION 'campaign is not configured for individual purchase links';
  END IF;

  IF p_manual_link_id IS NOT NULL THEN
    SELECT l.*
      INTO v_assigned_link
    FROM public.campaign_purchase_links l
    WHERE l.id = p_manual_link_id
      AND l.campaign_id = p_campaign_id
      AND l.option_key = v_option_key
      AND l.is_active = TRUE
    FOR UPDATE;
  ELSE
    SELECT l.*
      INTO v_assigned_link
    FROM public.campaign_purchase_links l
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS usage_count
      FROM public.applications a
      WHERE a.campaign_id = p_campaign_id
        AND a.assigned_purchase_link_id = l.id
        AND UPPER(COALESCE(a.status, '')) IN ('SELECTED', 'APPROVED')
    ) usage ON TRUE
    WHERE l.campaign_id = p_campaign_id
      AND l.option_key = v_option_key
      AND l.is_active = TRUE
    ORDER BY COALESCE(usage.usage_count, 0) ASC, l.id ASC
    FOR UPDATE OF l
    LIMIT 1;
  END IF;

  IF v_assigned_link.id IS NULL THEN
    RAISE EXCEPTION 'no available purchase link for option %', v_option_label;
  END IF;

  RETURN QUERY
  UPDATE public.applications a
  SET
    assigned_option_key = v_option_key,
    assigned_option_label = v_option_label,
    assigned_purchase_link_id = v_assigned_link.id,
    assigned_purchase_link_url = v_assigned_link.purchase_link_url,
    link_assigned_at = COALESCE(a.link_assigned_at, v_now),
    link_updated_at = v_now
  WHERE a.id = p_application_id
  RETURNING
    a.id,
    a.assigned_purchase_link_id,
    a.assigned_purchase_link_url,
    a.assigned_option_key,
    a.assigned_option_label,
    a.status,
    a.review_deadline,
    a.link_assigned_at,
    a.link_updated_at;
END;
$$;

COMMIT;

