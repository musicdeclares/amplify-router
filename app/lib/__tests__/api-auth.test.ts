import { isAdmin, canAccessArtist, canAccessTourByArtistId } from "../api-auth";
import type { ApiUser } from "../api-auth";

describe("isAdmin", () => {
  it("returns true for admin role", () => {
    const user: ApiUser = { id: "user-1", role: "admin", artistId: null };
    expect(isAdmin(user)).toBe(true);
  });

  it("returns false for artist role", () => {
    const user: ApiUser = { id: "user-1", role: "artist", artistId: "artist-1" };
    expect(isAdmin(user)).toBe(false);
  });
});

describe("canAccessArtist", () => {
  it("allows admin to access any artist", () => {
    const admin: ApiUser = { id: "user-1", role: "admin", artistId: null };
    expect(canAccessArtist(admin, "any-artist-id")).toBe(true);
    expect(canAccessArtist(admin, "another-artist-id")).toBe(true);
  });

  it("allows artist to access their own artist record", () => {
    const artist: ApiUser = {
      id: "user-1",
      role: "artist",
      artistId: "artist-123",
    };
    expect(canAccessArtist(artist, "artist-123")).toBe(true);
  });

  it("denies artist access to other artist records", () => {
    const artist: ApiUser = {
      id: "user-1",
      role: "artist",
      artistId: "artist-123",
    };
    expect(canAccessArtist(artist, "artist-456")).toBe(false);
    expect(canAccessArtist(artist, "other-artist")).toBe(false);
  });

  it("denies artist with null artistId access to any artist", () => {
    const artist: ApiUser = { id: "user-1", role: "artist", artistId: null };
    expect(canAccessArtist(artist, "artist-123")).toBe(false);
  });
});

describe("canAccessTourByArtistId", () => {
  it("allows admin to access any tour", () => {
    const admin: ApiUser = { id: "user-1", role: "admin", artistId: null };
    expect(canAccessTourByArtistId(admin, "any-artist-id")).toBe(true);
  });

  it("allows artist to access tours belonging to their artist", () => {
    const artist: ApiUser = {
      id: "user-1",
      role: "artist",
      artistId: "artist-123",
    };
    expect(canAccessTourByArtistId(artist, "artist-123")).toBe(true);
  });

  it("denies artist access to tours belonging to other artists", () => {
    const artist: ApiUser = {
      id: "user-1",
      role: "artist",
      artistId: "artist-123",
    };
    expect(canAccessTourByArtistId(artist, "artist-456")).toBe(false);
  });
});
