/** Preset profile picture keys. Must match backend AllowedProfilePictureKeys and files in public/avatars/. */
export const AVATAR_KEYS = [
  "avatar-1",
  "avatar-2",
  "avatar-3",
  "avatar-4",
  "avatar-5",
  "avatar-6",
  "avatar-7",
  "avatar-8",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export function getAvatarUrl(key: AvatarKey | string | null | undefined): string | null {
  if (!key || !AVATAR_KEYS.includes(key as AvatarKey)) return null;
  return `/avatars/${key}.svg`;
}
