// Prepara los assets de MediaPipe para self-host (CSP 'self'):
//  - copia el fileset WASM desde node_modules → public/mediapipe/wasm
//  - descarga el modelo face_landmarker.task → public/mediapipe (si falta)
// Se ejecuta en `prebuild` (antes del build de Vercel) y se puede correr a mano
// para dev. Los archivos quedan fuera de git (ver .gitignore) por su peso.
import { cp, mkdir, access, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

const ROOT = new URL("..", import.meta.url);
const WASM_SRC = new URL("node_modules/@mediapipe/tasks-vision/wasm/", ROOT);
const OUT_DIR = new URL("public/mediapipe/", ROOT);
const WASM_OUT = new URL("wasm/", OUT_DIR);
const MODEL_OUT = new URL("face_landmarker.task", OUT_DIR);
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const exists = async (u) => access(u, constants.F_OK).then(() => true, () => false);

await mkdir(OUT_DIR, { recursive: true });

// 1) WASM fileset
await cp(WASM_SRC, WASM_OUT, { recursive: true });
console.log("[mediapipe] wasm copiado → public/mediapipe/wasm");

// 2) modelo (solo si falta, para no redescargar en cada build local)
if (await exists(MODEL_OUT)) {
  console.log("[mediapipe] modelo ya presente, ok");
} else {
  console.log("[mediapipe] descargando modelo…");
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`[mediapipe] fallo al descargar el modelo: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(MODEL_OUT, buf);
  console.log(`[mediapipe] modelo guardado (${(buf.length / 1e6).toFixed(1)} MB)`);
}
