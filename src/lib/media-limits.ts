// src/lib/media-limits.ts
//
// Limites des médias du profil, partagées entre le site et l'API.

/** Photos de galerie (en plus de la photo de profil). */
export const MAX_PROFILE_PHOTOS = 6;

/** Courtes vidéos de profil. */
export const MAX_PROFILE_VIDEOS = 2;
export const MAX_VIDEO_SECONDS = 15;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 Mo
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
