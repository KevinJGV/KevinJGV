import type { APIRoute } from "astro";
import { lastfmTrack, itunes } from "../../lib/lastfm";

export const prerender = false;

// Escape XML special characters to prevent broken/malformed SVG.
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Truncate to max chars, appending ellipsis if needed.
function trunc(s: string, max = 28): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Fetch image bytes from URL and return a base64 data URI.
// Returns null if fetch fails or URL is empty.
async function toDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const buf = await r.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Convert to base64 without Buffer (available in both Node and edge runtimes).
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    // Detect JPEG vs PNG from magic bytes; default to jpeg (iTunes/Last.fm art is always JPEG).
    const mime = bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

// The static "not playing" / offline card SVG.
function offlineSvg(label = "Not playing"): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
  <defs>
    <clipPath id="art-clip">
      <rect x="16" y="16" width="88" height="88" rx="8"/>
    </clipPath>
    <clipPath id="card-clip">
      <rect x="0" y="0" width="400" height="120" rx="12"/>
    </clipPath>
  </defs>
  <!-- Card background -->
  <rect width="400" height="120" rx="12" fill="#121212"/>
  <!-- Placeholder album art rect -->
  <rect x="16" y="16" width="88" height="88" rx="8" fill="#282828"/>
  <!-- Music note placeholder -->
  <text x="60" y="68" font-size="32" text-anchor="middle" fill="#535353" font-family="system-ui, -apple-system, sans-serif">♪</text>
  <!-- Label -->
  <text x="120" y="38" font-size="11" fill="#b3b3b3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${xmlEscape(label)}</text>
  <!-- Title -->
  <text x="120" y="62" font-size="15" font-weight="bold" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif">—</text>
  <!-- Artist -->
  <text x="120" y="83" font-size="13" fill="#b3b3b3" font-family="system-ui, -apple-system, sans-serif">—</text>
  <!-- Border -->
  <rect width="399" height="119" rx="12" fill="none" stroke="#282828" stroke-width="1" x="0.5" y="0.5"/>
</svg>`;
}

function buildSvg(params: {
  title: string;
  artist: string;
  artDataUri: string | null;
  isPlaying: boolean;
}): string {
  const { title, artist, artDataUri, isPlaying } = params;

  const label = isPlaying ? "Now playing" : "Last played";
  const displayTitle = xmlEscape(trunc(title, 28));
  const displayArtist = xmlEscape(trunc(artist, 30));

  // Album art: either embedded base64 image or placeholder rect.
  const artElement = artDataUri
    ? `<image href="${artDataUri}" x="16" y="16" width="88" height="88" clip-path="url(#art-clip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="16" y="16" width="88" height="88" rx="8" fill="#282828"/>
  <text x="60" y="68" font-size="32" text-anchor="middle" fill="#535353" font-family="system-ui, -apple-system, sans-serif">♪</text>`;

  // Equalizer: animated when playing, static when not.
  const equalizerElement = isPlaying
    ? `<svg x="352" y="8" width="40" height="24" viewBox="0 0 24 24">
    <defs>
      <style>
        .eq-bar { fill: #1ed760; transform: scale(1,-1) translate(0,-24px); }
        .eq-bar--1 { animation: short-eq .5s infinite 0s; }
        .eq-bar--2 { animation: tall-eq  .5s infinite .17s; }
        .eq-bar--3 { animation: short-eq .5s infinite .34s; }
        @keyframes short-eq { 0%{height:8px} 50%{height:4px} 100%{height:8px} }
        @keyframes tall-eq  { 0%{height:16px} 50%{height:6px} 100%{height:16px} }
      </style>
    </defs>
    <rect class="eq-bar eq-bar--1" x="4"    y="4" width="3.7" height="8"/>
    <rect class="eq-bar eq-bar--2" x="10.2" y="4" width="3.7" height="16"/>
    <rect class="eq-bar eq-bar--3" x="16.3" y="4" width="3.7" height="11"/>
  </svg>`
    : `<svg x="352" y="8" width="40" height="24" viewBox="0 0 24 24">
    <rect x="4"    y="12" width="3.7" height="8" fill="#535353" transform="scale(1,-1) translate(0,-24)"/>
    <rect x="10.2" y="8"  width="3.7" height="12" fill="#535353" transform="scale(1,-1) translate(0,-24)"/>
    <rect x="16.3" y="10" width="3.7" height="10" fill="#535353" transform="scale(1,-1) translate(0,-24)"/>
  </svg>`;

  // Green accent dot next to label when playing.
  const dotElement = isPlaying
    ? `<circle cx="113" cy="35" r="4" fill="#1ed760"/>`
    : "";
  const labelX = isPlaying ? "122" : "113";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
  <defs>
    <clipPath id="art-clip">
      <rect x="16" y="16" width="88" height="88" rx="8"/>
    </clipPath>
  </defs>
  <!-- Card background -->
  <rect width="400" height="120" rx="12" fill="#121212"/>
  <!-- Album art -->
  ${artElement}
  <!-- Playing indicator dot -->
  ${dotElement}
  <!-- Label -->
  <text x="${labelX}" y="38" font-size="11" fill="#b3b3b3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${xmlEscape(label)}</text>
  <!-- Track title -->
  <text x="113" y="64" font-size="15" font-weight="bold" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif">${displayTitle}</text>
  <!-- Artist -->
  <text x="113" y="86" font-size="13" fill="#b3b3b3" font-family="system-ui, -apple-system, sans-serif">${displayArtist}</text>
  <!-- Equalizer icon (top-right) -->
  ${equalizerElement}
  <!-- Card border -->
  <rect width="399" height="119" rx="12" fill="none" stroke="#282828" stroke-width="1" x="0.5" y="0.5"/>
</svg>`;
}

export const GET: APIRoute = async () => {
  const headers = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=60, s-maxage=60",
  };

  try {
    const t = await lastfmTrack();
    if (!t) {
      return new Response(offlineSvg("Not playing"), { status: 200, headers });
    }

    // Fetch iTunes art (higher res). Fall back to Last.fm art URL.
    const fromItunes = await itunes(t.title, t.artist);
    const artUrl = fromItunes.art ?? t.art;

    // Embed art as base64 data URI (required for GitHub camo proxy rendering).
    const artDataUri = await toDataUri(artUrl);

    const svg = buildSvg({
      title: t.title,
      artist: t.artist,
      artDataUri,
      isPlaying: t.isPlaying,
    });

    return new Response(svg, { status: 200, headers });
  } catch {
    // Robust fallback: always return a valid 200 SVG.
    return new Response(offlineSvg("Not playing"), { status: 200, headers });
  }
};
