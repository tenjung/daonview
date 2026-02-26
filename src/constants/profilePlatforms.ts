export const CREATOR_PLATFORM_OPTIONS = [
  { id: 'BLOG', name: '블로거', icon: '📝' },
  { id: 'YOUTUBE', name: '유튜버', icon: '🎥' },
  { id: 'INSTAGRAM', name: '인스타그래머', icon: '📸' },
  { id: 'TIKTOK', name: '틱톡커', icon: '🎵' },
] as const;

export const PURCHASE_REVIEW_PLATFORM = 'PURCHASE' as const;

export const PROFILE_MODES = {
  CREATOR: 'CREATOR',
  REVIEWER: 'REVIEWER',
} as const;

export type ProfileMode = (typeof PROFILE_MODES)[keyof typeof PROFILE_MODES];
export type CreatorPlatformId = (typeof CREATOR_PLATFORM_OPTIONS)[number]['id'];

const CREATOR_PLATFORM_SET = new Set<string>(
  CREATOR_PLATFORM_OPTIONS.map((platform) => platform.id)
);

export function normalizeCreatorPlatforms(raw: unknown): CreatorPlatformId[] {
  if (!Array.isArray(raw)) return [];

  const normalized = raw
    .map((platform) => String(platform || '').toUpperCase())
    .filter((platform): platform is CreatorPlatformId => CREATOR_PLATFORM_SET.has(platform));

  return Array.from(new Set(normalized));
}

export function resolveProfileModeFromPlatforms(raw: unknown): ProfileMode {
  if (!Array.isArray(raw)) return PROFILE_MODES.CREATOR;

  const normalized = raw.map((platform) => String(platform || '').toUpperCase());
  const hasCreatorPlatform = normalized.some((platform) => CREATOR_PLATFORM_SET.has(platform));
  const hasPurchaseOnly =
    normalized.includes(PURCHASE_REVIEW_PLATFORM) && !hasCreatorPlatform;

  if (hasPurchaseOnly) return PROFILE_MODES.REVIEWER;
  return PROFILE_MODES.CREATOR;
}

export function buildPreferredPlatforms(
  mode: ProfileMode,
  creatorPlatforms: CreatorPlatformId[]
): string[] {
  if (mode === PROFILE_MODES.REVIEWER) return [PURCHASE_REVIEW_PLATFORM];
  return creatorPlatforms;
}
