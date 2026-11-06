create function public.select_application_with_explicit_links(
  p_application_id bigint,
  p_campaign_id bigint,
  p_actor_user_id uuid,
  p_is_admin boolean,
  p_target_status text,
  p_assignments jsonb
)
returns table(
  application_id bigint,
  assigned_purchase_link_id bigint,
  assigned_purchase_link_url text,
  assigned_option_key text,
  assigned_option_label text,
  assigned_purchase_links jsonb,
  status text,
  review_deadline timestamptz,
  link_assigned_at timestamptz
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  v_now timestamptz := now();
  v_campaign record;
  v_options jsonb;
  v_assignment jsonb;
  v_option_label text;
  v_option_key text;
  v_link_id bigint;
  v_link_url text;
  v_resolved_assignments jsonb := '[]'::jsonb;
begin
  if p_assignments is null or jsonb_typeof(p_assignments) <> 'array' then
    raise exception 'one or two explicit option assignments are required';
  end if;
  if jsonb_array_length(p_assignments) not between 1 and 2 then
    raise exception 'one or two explicit option assignments are required';
  end if;

  -- Match the existing selector's lock order before writing to the link pool.
  select c.created_by, c.campaign_options into v_campaign
  from public.campaigns c
  where c.id = p_campaign_id
  for update;
  if not found then raise exception 'campaign not found'; end if;
  if p_is_admin is not true and v_campaign.created_by is distinct from p_actor_user_id then
    raise exception 'permission denied';
  end if;

  v_options := case when jsonb_typeof(v_campaign.campaign_options) = 'array'
    then v_campaign.campaign_options -> 0 else v_campaign.campaign_options end;
  if (v_options #>> '{step1Data,productUrlIndividual}') is distinct from 'true' then
    raise exception '이 캠페인은 옵션별 구매링크를 사용하지 않습니다.';
  end if;

  for v_assignment in select value from jsonb_array_elements(p_assignments)
  loop
    v_option_label := trim(regexp_replace(coalesce(v_assignment ->> 'optionLabel', ''), '\s+', ' ', 'g'));
    v_option_key := upper(v_option_label);
    v_link_id := nullif(v_assignment ->> 'manualLinkId', '')::bigint;
    v_link_url := nullif(trim(v_assignment ->> 'manualPurchaseLinkUrl'), '');
    if v_option_key = '' or (v_link_id is null) = (v_link_url is null) then
      raise exception '옵션 %: 등록 링크 선택 또는 직접 입력 중 하나를 지정해 주세요.', v_option_label;
    end if;

    if v_link_url is not null then
      if v_link_url !~* '^https?://[^/?#[:space:]]+' or v_link_url ~ '[[:space:]]' or strpos(v_link_url, chr(92)) > 0 then
        raise exception '옵션 %: 유효한 구매링크를 입력해 주세요.', v_option_label;
      end if;

      insert into public.campaign_purchase_links as links (
        campaign_id, option_key, option_label, purchase_link_url, is_active, created_by, updated_at
      ) values (
        p_campaign_id, v_option_key, v_option_label, v_link_url, true, p_actor_user_id, v_now
      )
      on conflict (campaign_id, option_key, purchase_link_url) do update
        set is_active = true, updated_at = excluded.updated_at
      returning links.id into v_link_id;
    end if;

    v_resolved_assignments := v_resolved_assignments || jsonb_build_array(
      jsonb_build_object('optionLabel', v_option_label, 'manualLinkId', v_link_id)
    );
  end loop;

  -- The existing selector validates link ownership and writes the selection.
  -- Any error here rolls back new link pool entries as well.
  return query
  select * from public.select_application_with_links(
    p_application_id, p_campaign_id, p_actor_user_id, p_is_admin, p_target_status, v_resolved_assignments
  );
end;
$function$;

revoke all on function public.select_application_with_explicit_links(bigint, bigint, uuid, boolean, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.select_application_with_explicit_links(bigint, bigint, uuid, boolean, text, jsonb)
  to service_role;
