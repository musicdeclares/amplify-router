import { headers } from "next/headers";

export interface ApiUser {
  id: string;
  role: "admin" | "artist";
  artistId: string | null;
}

/**
 * Get the authenticated user from request headers set by middleware.
 * Returns null if user is not authenticated.
 */
export async function getApiUser(): Promise<ApiUser | null> {
  const headerList = await headers();
  const userId = headerList.get("x-user-id");
  const role = headerList.get("x-user-role") as "admin" | "artist" | null;
  const artistId = headerList.get("x-user-artist-id");

  if (!userId || !role) {
    return null;
  }

  return {
    id: userId,
    role,
    artistId: artistId || null,
  };
}

/**
 * Check if the user is an admin.
 */
export function isAdmin(user: ApiUser): boolean {
  return user.role === "admin";
}

/**
 * Check if the user can access an artist's data.
 * Admins can access all artists, artists can only access their own.
 */
export function canAccessArtist(user: ApiUser, artistId: string): boolean {
  if (user.role === "admin") {
    return true;
  }
  return user.artistId === artistId;
}

/**
 * Check if the user can access a tour.
 * Requires fetching the tour to get the artist_id.
 */
export function canAccessTourByArtistId(
  user: ApiUser,
  tourArtistId: string,
): boolean {
  if (user.role === "admin") {
    return true;
  }
  return user.artistId === tourArtistId;
}
