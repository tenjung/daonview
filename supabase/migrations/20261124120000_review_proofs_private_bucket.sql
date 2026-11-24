-- 리뷰 증빙(구매금액·구매평 스샷, 링크형 리뷰 첨부) 전용 private 버킷.
-- 읽기 정책은 만들지 않는다: anon/authenticated는 조회·목록 불가, 서버 service_role이 서명 URL로만 발급한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-proofs', 'review-proofs', false, 52428800, array['image/*', 'video/*'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 업로드: 로그인 사용자가 reviews/{campaignId}/{본인 uid}/ 폴더에만 새 파일을 올릴 수 있다(덮어쓰기·삭제 불가).
drop policy if exists "Users can upload own review proofs" on storage.objects;
create policy "Users can upload own review proofs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'review-proofs'
    and (storage.foldername(name))[1] = 'reviews'
    and (storage.foldername(name))[3] = (select auth.uid())::text
  );
