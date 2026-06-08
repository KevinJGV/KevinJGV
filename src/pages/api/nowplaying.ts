import type { APIRoute } from "astro";
import { lastfmTrack, itunes, deezerPreview } from "../../lib/lastfm";
import type { TrackInfo } from "../../lib/lastfm";

export const prerender = false;

const EMPTY: TrackInfo = { title: "", artist: "", albumArt: null, spotifyUrl: null, previewUrl: null, isPlaying: false };

function json(data: TrackInfo): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
  });
}

export const GET: APIRoute = async () => {
  const t = await lastfmTrack();
  if (!t) return json(EMPTY);
  const fromItunes = await itunes(t.title, t.artist);
  const previewUrl = fromItunes.preview ?? (await deezerPreview(t.title, t.artist));
  const albumArt = fromItunes.art ?? t.art;
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${t.artist}`)}`;
  return json({ title: t.title, artist: t.artist, albumArt, spotifyUrl, previewUrl, isPlaying: t.isPlaying });
};
