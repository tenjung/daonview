import 'dotenv/config';
import { config as loadDotenv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

loadDotenv({ path: '.env.local', override: false });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIN_IMAGE_BYTES = 1_000_000;
const MAX_EDGE = 1200;
const WEBP_QUALITY = 78;
const PUBLIC_OBJECT_PREFIX = '/storage/v1/object/public/';
const MANIFEST_PATH = path.resolve(
  process.cwd(),
  `tmp/supabase-image-optimization-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const shouldApply = process.argv.includes('--apply');

function parsePublicStorageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (`${parsed.origin}` !== SUPABASE_URL) return null;
  if (!parsed.pathname.startsWith(PUBLIC_OBJECT_PREFIX)) return null;

  const remainder = decodeURIComponent(parsed.pathname.slice(PUBLIC_OBJECT_PREFIX.length));
  const slashIndex = remainder.indexOf('/');
  if (slashIndex <= 0) return null;

  return {
    bucket: remainder.slice(0, slashIndex),
    storagePath: remainder.slice(slashIndex + 1),
    publicUrl: `${parsed.origin}${parsed.pathname}`,
  };
}

function replaceUrlDeep(value, fromUrl, toUrl) {
  if (typeof value === 'string') {
    return value === fromUrl ? toUrl : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceUrlDeep(item, fromUrl, toUrl));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, replaceUrlDeep(nested, fromUrl, toUrl)])
    );
  }

  return value;
}

function collectStorageUrlsDeep(value, urls = new Set()) {
  if (typeof value === 'string') {
    if (parsePublicStorageUrl(value)) urls.add(value);
    return urls;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectStorageUrlsDeep(item, urls);
    return urls;
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStorageUrlsDeep(item, urls);
  }

  return urls;
}

function getOptimizedPath(bucket, storagePath) {
  const extensionlessName = storagePath
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '');

  if (!extensionlessName) return null;

  if (bucket === 'files' && storagePath.startsWith('campaigns/')) {
    return `campaigns/optimized/${extensionlessName}.webp`;
  }

  if (bucket === 'files' && storagePath.startsWith('reviews/')) {
    const directory = storagePath.split('/').slice(0, -1).join('/');
    return `${directory}/${extensionlessName}_optimized.webp`;
  }

  if (bucket === 'campaign-images') {
    return `optimized/${extensionlessName}.webp`;
  }

  return null;
}

async function getImageHeaders(url) {
  const response = await fetch(url, { method: 'HEAD' });
  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    contentLength: Number(response.headers.get('content-length') || '0'),
  };
}

async function collectReferencedUrls() {
  const referenced = new Map();

  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, thumbnail_url, campaign_images, campaign_image_variants');
  if (campaignsError) throw campaignsError;

  for (const campaign of campaigns ?? []) {
    if (campaign.thumbnail_url) {
      addReference(referenced, campaign.thumbnail_url, {
        table: 'campaigns',
        id: campaign.id,
        field: 'thumbnail_url',
      });
    }

    for (const imageUrl of campaign.campaign_images ?? []) {
      addReference(referenced, imageUrl, {
        table: 'campaigns',
        id: campaign.id,
        field: 'campaign_images',
      });
    }

    for (const url of collectStorageUrlsDeep(campaign.campaign_image_variants ?? [])) {
      addReference(referenced, url, {
        table: 'campaigns',
        id: campaign.id,
        field: 'campaign_image_variants',
      });
    }
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id, thumbnail_url');
  if (reviewsError) throw reviewsError;

  for (const review of reviews ?? []) {
    if (review.thumbnail_url) {
      addReference(referenced, review.thumbnail_url, {
        table: 'reviews',
        id: review.id,
        field: 'thumbnail_url',
      });
    }
  }

  return referenced;
}

function addReference(referenced, url, reference) {
  const storageRef = parsePublicStorageUrl(url);
  if (!storageRef) return;

  const item = referenced.get(storageRef.publicUrl) ?? {
    ...storageRef,
    references: [],
  };
  item.references.push(reference);
  referenced.set(storageRef.publicUrl, item);
}

async function buildTargets() {
  const referenced = await collectReferencedUrls();
  const targets = [];

  for (const item of referenced.values()) {
    const headers = await getImageHeaders(item.publicUrl);
    const optimizedPath = getOptimizedPath(item.bucket, item.storagePath);
    const isTarget =
      headers.ok &&
      headers.contentLength >= MIN_IMAGE_BYTES &&
      headers.contentType.startsWith('image/') &&
      headers.contentType !== 'image/gif' &&
      optimizedPath;

    if (!isTarget) continue;

    const { data } = supabase.storage.from(item.bucket).getPublicUrl(optimizedPath);
    targets.push({
      ...item,
      originalBytes: headers.contentLength,
      originalContentType: headers.contentType,
      optimizedPath,
      optimizedUrl: data.publicUrl,
      status: 'PENDING',
    });
  }

  return targets.sort((a, b) => b.originalBytes - a.originalBytes);
}

async function optimizeAndUpload(target) {
  const { data: sourceBlob, error: downloadError } = await supabase.storage
    .from(target.bucket)
    .download(target.storagePath);
  if (downloadError) throw downloadError;

  const sourceBuffer = Buffer.from(await sourceBlob.arrayBuffer());
  const optimizedBuffer = await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  if (optimizedBuffer.length >= sourceBuffer.length) {
    return {
      ...target,
      status: 'SKIPPED_NOT_SMALLER',
      optimizedBytes: optimizedBuffer.length,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from(target.bucket)
    .upload(target.optimizedPath, optimizedBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const verification = await getImageHeaders(target.optimizedUrl);
  if (!verification.ok || !verification.contentType.startsWith('image/')) {
    throw new Error(`Uploaded image failed public verification: ${target.optimizedUrl}`);
  }

  return {
    ...target,
    status: 'UPLOADED',
    optimizedBytes: optimizedBuffer.length,
    verifiedStatus: verification.status,
    verifiedContentType: verification.contentType,
    verifiedContentLength: verification.contentLength,
  };
}

async function applyDatabaseUpdates(uploadedTargets) {
  const updated = [];
  const skipped = [];

  for (const target of uploadedTargets) {
    const campaignIds = [
      ...new Set(
        target.references
          .filter((reference) => reference.table === 'campaigns')
          .map((reference) => reference.id)
      ),
    ];

    for (const id of campaignIds) {
      const { data: current, error: readError } = await supabase
        .from('campaigns')
        .select('id, thumbnail_url, campaign_images, campaign_image_variants')
        .eq('id', id)
        .single();
      if (readError) throw readError;

      const next = {};
      if (current.thumbnail_url === target.publicUrl) {
        next.thumbnail_url = target.optimizedUrl;
      }

      if ((current.campaign_images ?? []).includes(target.publicUrl)) {
        next.campaign_images = current.campaign_images.map((url) =>
          url === target.publicUrl ? target.optimizedUrl : url
        );
      }

      const variantText = JSON.stringify(current.campaign_image_variants ?? []);
      if (variantText.includes(target.publicUrl)) {
        next.campaign_image_variants = replaceUrlDeep(
          current.campaign_image_variants,
          target.publicUrl,
          target.optimizedUrl
        );
      }

      if (Object.keys(next).length === 0) {
        skipped.push({ table: 'campaigns', id, oldUrl: target.publicUrl, reason: 'CURRENT_VALUE_CHANGED' });
        continue;
      }

      const { error: updateError } = await supabase.from('campaigns').update(next).eq('id', id);
      if (updateError) throw updateError;
      updated.push({ table: 'campaigns', id, fields: Object.keys(next), oldUrl: target.publicUrl, newUrl: target.optimizedUrl });
    }

    const reviewIds = [
      ...new Set(
        target.references
          .filter((reference) => reference.table === 'reviews')
          .map((reference) => reference.id)
      ),
    ];

    for (const id of reviewIds) {
      const { data: current, error: readError } = await supabase
        .from('reviews')
        .select('id, thumbnail_url')
        .eq('id', id)
        .single();
      if (readError) throw readError;

      if (current.thumbnail_url !== target.publicUrl) {
        skipped.push({ table: 'reviews', id, oldUrl: target.publicUrl, reason: 'CURRENT_VALUE_CHANGED' });
        continue;
      }

      const { error: updateError } = await supabase
        .from('reviews')
        .update({ thumbnail_url: target.optimizedUrl })
        .eq('id', id);
      if (updateError) throw updateError;
      updated.push({ table: 'reviews', id, fields: ['thumbnail_url'], oldUrl: target.publicUrl, newUrl: target.optimizedUrl });
    }
  }

  return { updated, skipped };
}

async function verifyReferences(targets) {
  const after = await collectReferencedUrls();
  return targets.map((target) => ({
    oldUrl: target.publicUrl,
    newUrl: target.optimizedUrl,
    oldReferenceCount: after.get(target.publicUrl)?.references.length ?? 0,
    newReferenceCount: after.get(target.optimizedUrl)?.references.length ?? 0,
    expectedReferenceCount: target.references.length,
  }));
}

async function main() {
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });

  const targets = await buildTargets();
  const manifest = {
    generatedAt: new Date().toISOString(),
    mode: shouldApply ? 'apply' : 'dry-run',
    policy: {
      minImageBytes: MIN_IMAGE_BYTES,
      maxEdge: MAX_EDGE,
      webpQuality: WEBP_QUALITY,
      deleteOriginals: false,
    },
    targets,
    uploads: [],
    database: null,
    verification: null,
  };

  if (!shouldApply) {
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(JSON.stringify({ mode: 'dry-run', targetCount: targets.length, manifestPath: MANIFEST_PATH }, null, 2));
    return;
  }

  const uploads = [];
  for (const target of targets) {
    try {
      uploads.push(await optimizeAndUpload(target));
    } catch (error) {
      uploads.push({
        ...target,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const uploadedTargets = uploads.filter((upload) => upload.status === 'UPLOADED');
  const failedTargets = uploads.filter((upload) => upload.status === 'FAILED');
  if (failedTargets.length > 0) {
    manifest.uploads = uploads;
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    throw new Error(`Aborting DB updates because ${failedTargets.length} upload(s) failed. Manifest: ${MANIFEST_PATH}`);
  }

  const database = await applyDatabaseUpdates(uploadedTargets);
  const verification = await verifyReferences(uploadedTargets);

  manifest.uploads = uploads;
  manifest.database = database;
  manifest.verification = verification;
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(
    JSON.stringify(
      {
        mode: 'apply',
        targetCount: targets.length,
        uploadedCount: uploadedTargets.length,
        skippedUploadCount: uploads.filter((upload) => upload.status.startsWith('SKIPPED')).length,
        updatedRows: database.updated.length,
        skippedRows: database.skipped.length,
        unresolvedOldReferences: verification.filter((item) => item.oldReferenceCount > 0).length,
        manifestPath: MANIFEST_PATH,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
