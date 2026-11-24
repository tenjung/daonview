// 1회용: public `files/reviews/**` 증빙을 private `review-proofs` 버킷으로 복사하고 DB 참조를 경로로 바꾼다.
// 기본은 dry-run. `--apply`일 때만 복사·DB 갱신. 원본 삭제는 하지 않는다(검증 후 별도 승인).
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local', quiet: true });
const SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
if (new URL(SUPABASE_URL).hostname !== 'whpyftpktolpaspeuocg.supabase.co') throw new Error('Unexpected database target');
const db = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes('--apply');
const SOURCE_BUCKET = 'files';
const TARGET_BUCKET = 'review-proofs';
const LEGACY_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${SOURCE_BUCKET}/`;

const listAll = async (prefix) => {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(SOURCE_BUCKET).list(prefix, { limit: 100, offset });
    if (error) throw new Error(`list ${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id) out.push(path);
      else out.push(...await listAll(path));
    }
    if (data.length < 100) break;
  }
  return out;
};

const toPath = (value) => (typeof value === 'string' && value.startsWith(`${LEGACY_PREFIX}reviews/`) ? value.slice(LEGACY_PREFIX.length) : value);

// 1) 파일 복사
const objects = await listAll('reviews');
let copied = 0;
for (const path of objects) {
  if (!APPLY) continue;
  const { data: blob, error: downloadError } = await db.storage.from(SOURCE_BUCKET).download(path);
  if (downloadError) throw new Error(`download ${path}: ${downloadError.message}`);
  const { error: uploadError } = await db.storage.from(TARGET_BUCKET).upload(path, blob, { contentType: blob.type || undefined, upsert: true });
  if (uploadError) throw new Error(`upload ${path}: ${uploadError.message}`);
  copied++;
}

// 2) DB 참조 갱신 대상 수집
const { data: apps, error: appsError } = await db.from('applications').select('id, review_media_urls').not('review_media_urls', 'is', null);
if (appsError) throw appsError;
const appUpdates = (apps || [])
  .filter((row) => Array.isArray(row.review_media_urls) && row.review_media_urls.some((v) => toPath(v) !== v))
  .map((row) => ({ id: row.id, review_media_urls: row.review_media_urls.map(toPath) }));

const { data: reviews, error: reviewsError } = await db.from('reviews').select('id, thumbnail_url').like('thumbnail_url', `${LEGACY_PREFIX}reviews/%`);
if (reviewsError) throw reviewsError;

// 참조 파일이 모두 복사 대상에 있는지 확인 후에만 DB를 바꾼다.
const objectSet = new Set(objects);
const missing = appUpdates.flatMap((row) => row.review_media_urls).filter((p) => p.startsWith('reviews/') && !objectSet.has(p));
console.log(JSON.stringify({ mode: APPLY ? 'APPLY' : 'DRY_RUN', objects: objects.length, copied, applications: appUpdates.length, reviewThumbnails: (reviews || []).length, missingReferencedFiles: missing.length }));
if (missing.length) throw new Error('Referenced proof files are missing; DB not updated');

if (APPLY) {
  for (const row of appUpdates) {
    const { error } = await db.from('applications').update({ review_media_urls: row.review_media_urls }).eq('id', row.id);
    if (error) throw new Error(`application ${row.id}: ${error.message}`);
  }
  // 증빙 리뷰는 공개 썸네일을 두지 않는다(관리 화면은 applications.review_media_urls로 열람).
  const ids = (reviews || []).map((row) => row.id);
  if (ids.length) {
    const { error } = await db.from('reviews').update({ thumbnail_url: null }).in('id', ids);
    if (error) throw new Error(`reviews thumbnail: ${error.message}`);
  }
  console.log(JSON.stringify({ updatedApplications: appUpdates.length, clearedReviewThumbnails: ids.length }));
}
