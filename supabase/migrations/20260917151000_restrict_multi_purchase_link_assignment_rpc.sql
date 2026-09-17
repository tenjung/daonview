revoke all on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) from public;
revoke all on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) from anon;
revoke all on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) from authenticated;
grant execute on function public.select_application_with_links(bigint, bigint, uuid, boolean, text, jsonb) to service_role;
