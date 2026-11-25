-- 테스트 계정 표시(is_test_account)를 본인이 바꿀 수 없도록 보호 컬럼에 추가한다.
-- 관리자(is_admin)와 서버(service_role)는 기존처럼 변경 가능.
create or replace function public.guard_profile_protected_columns()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if upper(coalesce(new.role, 'INFLUENCER')) not in ('INFLUENCER', 'ADVERTISER') then
      raise exception 'PROFILE_ROLE_NOT_ALLOWED' using errcode = '42501';
    end if;
    if coalesce(new.biz_verification_status, 'NONE') not in ('NONE', 'PENDING') then
      raise exception 'PROFILE_BIZ_STATUS_NOT_ALLOWED' using errcode = '42501';
    end if;
    new.role := upper(coalesce(new.role, 'INFLUENCER'));
    new.point := 0;
    new.email_verified := false;
    new.is_test_account := false;
    return new;
  end if;
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.point is distinct from old.point
     or new.email is distinct from old.email
     or new.email_verified is distinct from old.email_verified
     or new.created_at is distinct from old.created_at
     or new.is_test_account is distinct from old.is_test_account then
    raise exception 'PROFILE_PROTECTED_COLUMN' using errcode = '42501';
  end if;
  if new.biz_verification_status is distinct from old.biz_verification_status
     and new.biz_verification_status is distinct from 'PENDING' then
    raise exception 'PROFILE_BIZ_STATUS_NOT_ALLOWED' using errcode = '42501';
  end if;
  if new.biz_rejection_reason is distinct from old.biz_rejection_reason
     and new.biz_rejection_reason is not null then
    raise exception 'PROFILE_BIZ_REASON_NOT_ALLOWED' using errcode = '42501';
  end if;
  return new;
end;
$function$;
