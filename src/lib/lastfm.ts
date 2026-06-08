// Shared Last.fm / iTunes / Deezer helpers.
// import.meta.env (dev / build-inlined) con fallback a process.env (runtime
// de la función serverless en Vercel).

export interface TrackInfo {
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string | null;
  previewUrl: string | null;
  isPlaying: boolean;
}

interface LfmImage { "#text": string; size: string }
interface LfmTrack {
  name?: string;
  artist?: { "#text"?: string; name?: string };
  image?: LfmImage[];
  "@attr"?: { nowplaying?: string };
}

export async function lastfmTrack(): Promise<{ title: string; artist: string; art: string | null; isPlaying: boolean } | null> {
  const key = import.meta.env.LASTFM_API_KEY ?? process.env.LASTFM_API_KEY;
  const user = import.meta.env.LASTFM_USER ?? process.env.LASTFM_USER;
  if (!key || !user) return null;
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks` +
    `&user=${encodeURIComponent(user)}&api_key=${key}&format=json&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const j = await res.json();
  const t: LfmTrack | undefined = j?.recenttracks?.track?.[0];
  if (!t?.name) return null;
  const title = t.name;
  const artist = t.artist?.["#text"] ?? t.artist?.name ?? "";
  const art = t.image?.length ? (t.image[t.image.length - 1]["#text"] || null) : null;
  const isPlaying = t["@attr"]?.nowplaying === "true";
  return { title, artist, art, isPlaying };
}

// iTunes: preview de 30s + carátula (mejor calidad que la de Last.fm).
export async function itunes(title: string, artist: string): Promise<{ preview: string | null; art: string | null }> {
  const term = encodeURIComponent(`${title} ${artist}`);
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const j = await r.json();
      const it = j?.results?.[0];
      if (it) {
        const art = (it.artworkUrl100 as string | undefined)?.replace("100x100", "300x300") ?? null;
        return { preview: it.previewUrl ?? null, art };
      }
    }
  } catch { /* ignore */ }
  return { preview: null, art: null };
}

export async function deezerPreview(title: string, artist: string): Promise<string | null> {
  const term = encodeURIComponent(`${title} ${artist}`);
  try {
    const r = await fetch(`https://api.deezer.com/search?q=${term}&limit=1`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) { const j = await r.json(); return j?.data?.[0]?.preview ?? null; }
  } catch { /* ignore */ }
  return null;
}
