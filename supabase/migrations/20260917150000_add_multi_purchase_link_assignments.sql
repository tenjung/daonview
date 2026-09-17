alter table public.applications
  add column if not exists assigned_purchase_links jsonb not null default '[]'::jsonb;

alter table public.applications
  drop constraint if exists applications_assigned_purchase_links_array_check;

alter table public.applications
  add constraint applications_assigned_purchase_links_array_check
  check (jsonb_typeof(assigned_purchase_links) = 'array');

create or replace function public.select_application_with_links(
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
security definer
set search_path = public, pg_temp
as $function$
declare
  v_now timestamptz := now();
  v_target_status text := upper(trim(coalesce(p_target_status, '')));
  v_campaign record;
  v_application record;
  v_assignment jsonb;
  v_option_label text;
  v_option_key text;
  v_manual_link_id bigint;
  v_link record;
  v_links jsonb := '[]'::jsonb;
  v_first jsonb;
  v_next_review_deadline timestamptz := null;
begin
  if v_target_status not in ('SELECTED', 'APPROVED') then
    raise exception 'target status must be SELECTED or APPROVED';
  end if;
  if jsonb_typeof(p_assignments) <> 'array' or jsonb_array_length(p_assignments) not between 1 and 2 then
    raise exception 'one or two option assignments are required';
  end if;

  select c.id, c.created_by, c.type, c.is_always, c.campaign_options
    into v_campaign
  from public.campaigns c
  where c.id = p_campaign_id
  for update;
  if not found then raise exception 'campaign not found'; end if;
  if not p_is_admin and v_campaign.created_by <> p_actor_user_id then raise exception 'permission denied'; end if;

  select a.* into v_application
  from public.applications a
  where a.id = p_application_id and a.campaign_id = p_campaign_id
  for update;
  if not found then raise exception 'application not found'; end if;
  if upper(coalesce(v_application.status, '')) <> 'PENDING' then raise exception 'only pending applications can be selected'; end if;

  for v_assignment in select value from jsonb_array_elements(p_assignments)
  loop
    v_option_label := trim(regexp_replace(coalesce(v_assignment ->> 'optionLabel', ''), '\s+', ' ', 'g'));
    v_option_key := upper(v_option_label);
    v_manual_link_id := nullif(v_assignment ->> 'manualLinkId', '')::bigint;
    if v_option_key = '' then raise exception 'assigned option label is required'; end if;
    if exists(select 1 from jsonb_array_elements(v_links) item where item ->> 'optionKey' = v_option_key) then
      raise exception 'duplicate option assignment';
    end if;

    if v_manual_link_id is not null then
      select l.* into v_link
      from public.campaign_purchase_links l
      where l.id = v_manual_link_id
        and l.campaign_id = p_campaign_id
        and l.option_key = v_option_key
        and l.is_active = true
      for update;
    else
      select l.* into v_link
      from public.campaign_purchase_links l
      left join lateral (
        select count(*) as usage_count
        from public.applications a
        left join lateral jsonb_array_elements(coalesce(a.assigned_purchase_links, '[]'::jsonb)) item on true
        where a.campaign_id = p_campaign_id
          and upper(coalesce(a.status, '')) in ('SELECTED', 'APPROVED', 'COMPLETED')
          and (
            item ->> 'linkId' = l.id::text
            or (jsonb_array_length(coalesce(a.assigned_purchase_links, '[]'::jsonb)) = 0 and a.assigned_purchase_link_id = l.id)
          )
      ) usage on true
      where l.campaign_id = p_campaign_id
        and l.option_key = v_option_key
        and l.is_active = true
      order by coalesce(usage.usage_count, 0), l.id
      for update of l
      limit 1;
    end if;

    if v_link.id is null then raise exception 'no available purchase link for option %', v_option_label; end if;
    v_links := v_links || jsonb_build_array(jsonb_build_object(
      'optionKey', v_option_key,
      'optionLabel', v_option_label,
      'linkId', v_link.id,
      'url', v_link.purchase_link_url
    ));
  end loop;

  v_first := v_links -> 0;
  if upper(coalesce(v_campaign.type, '')) = 'VISIT' and coalesce(v_campaign.is_always, false) then
    v_next_review_deadline := v_now + interval '14 days';
  end if;

  return query
  update public.applications a
  set
    status = v_target_status,
    selected_at = coalesce(a.selected_at, v_now),
    review_deadline = coalesce(v_next_review_deadline, a.review_deadline),
    assigned_option_key = v_first ->> 'optionKey',
    assigned_option_label = v_first ->> 'optionLabel',
    assigned_purchase_link_id = (v_first ->> 'linkId')::bigint,
    assigned_purchase_link_url = v_first ->> 'url',
    assigned_purchase_links = v_links,
    link_assigned_at = coalesce(a.link_assigned_at, v_now),
    link_updated_at = v_now
  where a.id = p_application_id
  returning
    a.id,
    a.assigned_purchase_link_id,
    a.assigned_purchase_link_url,
    a.assigned_option_key,
    a.assigned_option_label,
    a.assigned_purchase_links,
    a.status,
    a.review_deadline,
    a.link_assigned_at;
end;
$function$;

revoke all on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) from public;
revoke all on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) from anon;
revoke all on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) from authenticated;
grant execute on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) to service_role;
