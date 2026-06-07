// Anima el retrato del hero con el visitante (puppeteering 2D PURO, sin eje Z).
// UNA sola malla continua cubre toda la imagen: los 468 landmarks faciales +
// anclas en el borde (fijas), unidos por un anillo triangulado (Delaunay). Así
// NO hay capa estática detrás: deformar la cara estira la PROPIA foto como una
// pieza, sin que el rostro se "despegue".
//
// Dos capas de movimiento:
//   1) Rígido 2D del retrato completo (grupo: traslación + roll + escala, acotado).
//   2) Expresión local: residual de landmarks tras quitar la similaridad 2D
//      (pose removida), congelado al girar en 3D.
import * as THREE from "three";
import Delaunator from "delaunator";
import { FACE_TRIANGULATION, FACE_OVAL } from "./faceMeshTriangulation";
import { createTracker, detectImageLandmarks, toVideoMode, detectVideo } from "./faceTrack";
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

const N = 468;
const EYE_R = 33, EYE_L = 263;
const NOSE = 1;
const SEG = 12;                 // puntos por borde → 4*SEG anclas
const M = SEG * 4;
const VTOTAL = N + M;

// Tunables
const GAIN = 1.3;
const SMOOTH = 0.45;
const EXPR_CLAMP = 0.45;
const MAXROLL = 0.21;           // ±12°
const SCALE_MIN = 0.95, SCALE_MAX = 1.08;
const MAXTRANS_X = 0.08, MAXTRANS_Y = 0.08;
const TRANS_K = 1.6;
const SCALE_FRONT = 0.6;        // frontalidad mínima para actualizar escala
const EW_LO = 0.55, EW_HI = 0.9; // ventana de peso de expresión (cae a 0 al girar)
const NEUTRAL_FRONT = 0.85;
const NEUTRAL_FRAMES = 6;
const RETURN = 0.12;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
function pointInPolygon(x: number, y: number, poly: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

interface PuppetCallbacks {
  onActive?: () => void;
  onError?: (e: unknown) => void;
}

function eyeFrame(lm: NormalizedLandmark[]) {
  const ax = lm[EYE_R].x, ay = lm[EYE_R].y, bx = lm[EYE_L].x, by = lm[EYE_L].y;
  const dx = bx - ax, dy = by - ay;
  return { mx: (ax + bx) / 2, my: (ay + by) / 2, ang: Math.atan2(dy, dx), dist: Math.hypot(dx, dy) || 1 };
}
function frontality(lm: NormalizedLandmark[], f: { mx: number; my: number; dist: number }): number {
  const yaw = Math.abs((lm[NOSE].x - f.mx) / f.dist);
  const pitch = Math.abs((lm[NOSE].y - f.my) / f.dist - 0.5);
  return (1 - smoothstep(0.12, 0.4, yaw)) * (1 - smoothstep(0.35, 0.7, pitch));
}

export async function initFacePuppet(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  video: HTMLVideoElement,
  cb: PuppetCallbacks = {},
): Promise<() => void> {
  let landmarker: FaceLandmarker;
  try {
    landmarker = await createTracker();
  } catch (e) { cb.onError?.(e); return () => {}; }

  const photoLM = detectImageLandmarks(landmarker, img);
  if (!photoLM || photoLM.length < N) {
    cb.onError?.(new Error("no face in portrait"));
    landmarker.close();
    return () => {};
  }
  await toVideoMode(landmarker);

  // ── anclas de borde (uv fijas) ──
  const anchorUV: number[][] = [];
  for (let s = 0; s < SEG; s++) anchorUV.push([s / SEG, 0]);        // top
  for (let s = 0; s < SEG; s++) anchorUV.push([1, s / SEG]);        // right
  for (let s = 0; s < SEG; s++) anchorUV.push([1 - s / SEG, 1]);    // bottom
  for (let s = 0; s < SEG; s++) anchorUV.push([0, 1 - s / SEG]);    // left

  // ── índice: triangulación facial + anillo cara→borde (Delaunay, una vez) ──
  function buildIndex(): number[] {
    const ovalN = FACE_OVAL.length;
    const pts: number[] = [];
    for (const idx of FACE_OVAL) pts.push(photoLM![idx].x, photoLM![idx].y);
    for (const a of anchorUV) pts.push(a[0], a[1]);
    const d = new Delaunator(Float64Array.from(pts));
    const tris = d.triangles;
    const poly = FACE_OVAL.map((idx) => [photoLM![idx].x, photoLM![idx].y]);
    const gidx = (local: number) => (local < ovalN ? FACE_OVAL[local] : N + (local - ovalN));
    const ring: number[] = [];
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t], b = tris[t + 1], c = tris[t + 2];
      const cx = (pts[a * 2] + pts[b * 2] + pts[c * 2]) / 3;
      const cy = (pts[a * 2 + 1] + pts[b * 2 + 1] + pts[c * 2 + 1]) / 3;
      if (pointInPolygon(cx, cy, poly)) continue; // dentro de la cara → ya cubierto
      ring.push(gidx(a), gidx(b), gidx(c));
    }
    return FACE_TRIANGULATION.concat(ring);
  }

  // ── Three.js ──
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  let W = Math.max(1, img.offsetWidth || Math.round(img.getBoundingClientRect().width));
  let H = Math.max(1, img.offsetHeight || Math.round(img.getBoundingClientRect().height));
  renderer.setSize(W, H, false);

  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000);
  cam.position.z = 2;

  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.NoColorSpace;
  tex.flipY = false;
  tex.needsUpdate = true;

  const scene = new THREE.Scene();
  const portrait = new THREE.Group();
  scene.add(portrait);

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(VTOTAL * 3);
  const uv = new Float32Array(VTOTAL * 2);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(buildIndex());
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.NoBlending, side: THREE.DoubleSide, depthTest: false });
  const mesh = new THREE.Mesh(geo, mat);
  portrait.add(mesh);

  const baseX = new Float32Array(N), baseY = new Float32Array(N);
  function buildBase() {
    // caras (deformables)
    for (let i = 0; i < N; i++) {
      uv[i * 2] = photoLM![i].x;
      uv[i * 2 + 1] = photoLM![i].y;
      baseX[i] = (photoLM![i].x - 0.5) * W;
      baseY[i] = (0.5 - photoLM![i].y) * H;
    }
    // anclas de borde (fijas)
    for (let k = 0; k < M; k++) {
      const u = anchorUV[k][0], v = anchorUV[k][1];
      uv[(N + k) * 2] = u;
      uv[(N + k) * 2 + 1] = v;
      pos[(N + k) * 3] = (u - 0.5) * W;
      pos[(N + k) * 3 + 1] = (0.5 - v) * H;
      pos[(N + k) * 3 + 2] = 0;
    }
    (geo.getAttribute("uv") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }
  let photoEyePx = 1;
  const computePhotoScale = () => {
    photoEyePx = Math.hypot((photoLM![EYE_R].x - photoLM![EYE_L].x) * W, (photoLM![EYE_R].y - photoLM![EYE_L].y) * H) || 1;
  };
  buildBase();
  computePhotoScale();
  for (let i = 0; i < N; i++) { pos[i * 3] = baseX[i]; pos[i * 3 + 1] = baseY[i]; pos[i * 3 + 2] = 0; }
  (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

  // ── estado ──
  const neutral = new Float32Array(N * 2);
  let nFrame: { mx: number; my: number; ang: number; dist: number } | null = null;
  let nYaw = 0, nPitch = 0; // posición de la nariz en el neutral (calibración de giro)
  let hasNeutral = false;
  let neutralCount = 0;
  let active = false;
  const exprCur = new Float32Array(N * 2);
  let gx = 0, gy = 0, grot = 0, gsc = 1;

  function neutralExpr(bs: Record<string, number> | null): boolean {
    if (!bs) return true;
    const open = bs["jawOpen"] ?? 0;
    const smile = Math.max(bs["mouthSmileLeft"] ?? 0, bs["mouthSmileRight"] ?? 0);
    const blink = Math.max(bs["eyeBlinkLeft"] ?? 0, bs["eyeBlinkRight"] ?? 0);
    return open < 0.15 && smile < 0.2 && blink < 0.4;
  }
  function setNeutral(lm: NormalizedLandmark[], f: { mx: number; my: number; ang: number; dist: number }) {
    for (let i = 0; i < N; i++) { neutral[i * 2] = lm[i].x; neutral[i * 2 + 1] = lm[i].y; }
    nFrame = f;
    // baseline de nariz (frontal) → para medir giro yaw/pitch calibrado a esta cara
    nYaw = (lm[NOSE].x - f.mx) / f.dist;
    nPitch = (lm[NOSE].y - f.my) / f.dist;
    hasNeutral = true;
  }

  const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
  function applyGroup() {
    portrait.position.set(gx, gy, 0);
    portrait.rotation.z = grot;
    portrait.scale.set(gsc, gsc, 1);
  }

  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (video.readyState < 2) { renderer.render(scene, cam); return; }

    const res = detectVideo(landmarker, video, performance.now());
    const lm = res.landmarks;

    if (!lm || lm.length < N) {
      gx += (0 - gx) * RETURN; gy += (0 - gy) * RETURN;
      grot += (0 - grot) * RETURN; gsc += (1 - gsc) * RETURN;
      for (let i = 0; i < N; i++) {
        exprCur[i * 2] += (0 - exprCur[i * 2]) * RETURN;
        exprCur[i * 2 + 1] += (0 - exprCur[i * 2 + 1]) * RETURN;
        pos[i * 3] += (baseX[i] - pos[i * 3]) * RETURN;
        pos[i * 3 + 1] += (baseY[i] - pos[i * 3 + 1]) * RETURN;
      }
      posAttr.needsUpdate = true; applyGroup(); renderer.render(scene, cam);
      return;
    }

    const f = eyeFrame(lm);
    const frontAbs = frontality(lm, f); // métrica absoluta (para calibrar el neutral)

    if (!hasNeutral) {
      if (frontAbs >= NEUTRAL_FRONT && neutralExpr(res.blendshapes)) {
        if (++neutralCount >= NEUTRAL_FRAMES) setNeutral(lm, f);
      } else neutralCount = 0;
      for (let i = 0; i < N; i++) {
        pos[i * 3] += (baseX[i] - pos[i * 3]) * RETURN;
        pos[i * 3 + 1] += (baseY[i] - pos[i * 3 + 1]) * RETURN;
      }
      posAttr.needsUpdate = true; applyGroup(); renderer.render(scene, cam);
      return;
    }
    if (!active) { active = true; cb.onActive?.(); }

    const nf = nFrame!;
    // Giro 3D calibrado a TU neutral (yaw horizontal, pitch vertical).
    const yawDev = Math.abs((lm[NOSE].x - f.mx) / f.dist - nYaw);
    const pitchDev = Math.abs((lm[NOSE].y - f.my) / f.dist - nPitch);
    // front 1=de frente, 0=girado; cae rápido con cualquier giro.
    const front = (1 - smoothstep(0.05, 0.18, yawDev)) * (1 - smoothstep(0.06, 0.18, pitchDev));
    // peso de expresión: 0 apenas hay giro → la deformación se anula al girar.
    const ew = smoothstep(EW_LO, EW_HI, front);

    // rígido 2D (espejado X): roll (inclinar) y traslación SIEMPRE (son en-plano).
    grot += (clamp(-(f.ang - nf.ang), -MAXROLL, MAXROLL) - grot) * SMOOTH;
    const txT = clamp(-(f.mx - nf.mx) * TRANS_K, -MAXTRANS_X, MAXTRANS_X) * W;
    const tyT = clamp((f.my - nf.my) * TRANS_K, -MAXTRANS_Y, MAXTRANS_Y) * H;
    gx += (txT - gx) * SMOOTH; gy += (tyT - gy) * SMOOTH;
    // escala: solo cuando estás de frente (el giro la corrompe por escorzo).
    if (front >= SCALE_FRONT) {
      gsc += (clamp(f.dist / nf.dist, SCALE_MIN, SCALE_MAX) - gsc) * SMOOTH;
    }

    // Expresión: residual sin similaridad, ATENUADO por `ew`. Al girar (ew→0) el
    // objetivo es 0 → la cara vuelve a neutro: ningún giro 3D deforma el retrato.
    {
      const c = Math.cos(-(f.ang - nf.ang)), s = Math.sin(-(f.ang - nf.ang));
      const inv = nf.dist / f.dist;
      for (let i = 0; i < N; i++) {
        const px = lm[i].x - f.mx, py = lm[i].y - f.my;
        const ax = (px * c - py * s) * inv + nf.mx;
        const ay = (px * s + py * c) * inv + nf.my;
        const ex = clamp((ax - neutral[i * 2]) / nf.dist, -EXPR_CLAMP, EXPR_CLAMP) * ew;
        const ey = clamp((ay - neutral[i * 2 + 1]) / nf.dist, -EXPR_CLAMP, EXPR_CLAMP) * ew;
        exprCur[i * 2] += (ex - exprCur[i * 2]) * SMOOTH;
        exprCur[i * 2 + 1] += (ey - exprCur[i * 2 + 1]) * SMOOTH;
      }
    }

    const S = photoEyePx * GAIN;
    for (let i = 0; i < N; i++) {
      const tx = baseX[i] - exprCur[i * 2] * S;
      const ty = baseY[i] - exprCur[i * 2 + 1] * S;
      pos[i * 3] += (tx - pos[i * 3]) * SMOOTH;
      pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * SMOOTH;
    }
    posAttr.needsUpdate = true; applyGroup(); renderer.render(scene, cam);
  }
  raf = requestAnimationFrame(frame);

  const ro = new ResizeObserver(() => {
    const nw = Math.max(1, img.offsetWidth), nh = Math.max(1, img.offsetHeight);
    if (nw === W && nh === H) return;
    W = nw; H = nh;
    renderer.setSize(W, H, false);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2;
    cam.updateProjectionMatrix();
    buildBase(); computePhotoScale();
  });
  ro.observe(img);

  return () => {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    landmarker.close();
    geo.dispose(); mat.dispose(); tex.dispose();
    renderer.dispose();
  };
}
