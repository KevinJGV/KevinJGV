// Renderer WebGL de UNA gema hexagonal (cabuchón) — fundación de la versión de
// producción. Raw WebGL, 0 dependencias. Replica el showcase CSS:
//  - frustum hexagonal 3D (table + 6 facetas con normal plana por cara)
//  - refracción del fondo por faceta (se quiebra en aristas) + fresnel
//  - iluminación dinámica (Blinn-Phong) con la luz = cursor global
//  - logo encapsulado en la table con fisheye en reposo; en hover EMERGE limpio
//    sobre la gema + glow (una sola imagen → sin doble logo)
//  - tilt + crecimiento en hover con springs; render on-demand (sin loop infinito)

// ─────────────────────────── mat4 (column-major) ───────────────────────────
type M4 = Float32Array;
const m4 = {
  ident(): M4 {
    const o = new Float32Array(16); o[0] = o[5] = o[10] = o[15] = 1; return o;
  },
  mul(a: M4, b: M4): M4 {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  },
  perspective(fovy: number, aspect: number, near: number, far: number): M4 {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    const o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf;
    o[11] = -1; o[14] = 2 * far * near * nf; return o;
  },
  translate(x: number, y: number, z: number): M4 {
    const o = m4.ident(); o[12] = x; o[13] = y; o[14] = z; return o;
  },
  rotX(a: number): M4 {
    const o = m4.ident(), c = Math.cos(a), s = Math.sin(a);
    o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o;
  },
  rotY(a: number): M4 {
    const o = m4.ident(), c = Math.cos(a), s = Math.sin(a);
    o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o;
  },
  scale(s: number): M4 {
    const o = m4.ident(); o[0] = o[5] = o[10] = s; return o;
  },
  ortho(l: number, r: number, b: number, tp: number, near: number, far: number): M4 {
    const o = new Float32Array(16);
    o[0] = 2 / (r - l); o[5] = 2 / (tp - b); o[10] = -2 / (far - near);
    o[12] = -(r + l) / (r - l); o[13] = -(tp + b) / (tp - b);
    o[14] = -(far + near) / (far - near); o[15] = 1; return o;
  },
};

// ─────────────────────────── geometría del frustum ───────────────────────────
const R = 150, IN = 63, K = 0.75, H = 38;
// Outer hex (pointy-top, y arriba), z=0
const V: [number, number][] = [
  [0, R], [R, IN], [R, -IN], [0, -R], [-R, -IN], [-R, IN],
];
const T: [number, number][] = V.map(([x, y]) => [x * K, y * K]); // table (z=H)

function buildGem() {
  const pos: number[] = [], nrm: number[] = [], uv: number[] = [], isTable: number[] = [];
  const push = (p: number[], n: number[], u: number[], t: number) => {
    pos.push(...p); nrm.push(...n); uv.push(...u); isTable.push(t);
  };
  // Table: fan desde el centro (0,0,H), normal +Z
  const TB = R * K * 2; // ancho de la table
  const tuv = (x: number, y: number): number[] => [x / TB + 0.5, 0.5 - y / TB];
  for (let i = 0; i < 6; i++) {
    const a = T[i], b = T[(i + 1) % 6];
    push([0, 0, H], [0, 0, 1], [0.5, 0.5], 1);
    push([a[0], a[1], H], [0, 0, 1], tuv(a[0], a[1]), 1);
    push([b[0], b[1], H], [0, 0, 1], tuv(b[0], b[1]), 1);
  }
  // Facetas: quad (A=V[i], B=V[i+1], D=T[i+1], E=T[i]), normal plana
  for (let i = 0; i < 6; i++) {
    const A = [V[i][0], V[i][1], 0], B = [V[(i + 1) % 6][0], V[(i + 1) % 6][1], 0];
    const D = [T[(i + 1) % 6][0], T[(i + 1) % 6][1], H], E = [T[i][0], T[i][1], H];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const vx = E[0] - A[0], vy = E[1] - A[1], vz = E[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const L = Math.hypot(nx, ny, nz) || 1; const n = [nx / L, ny / L, nz / L];
    push(A, n, [0, 0], 0); push(B, n, [0, 0], 0); push(D, n, [0, 0], 0);
    push(A, n, [0, 0], 0); push(D, n, [0, 0], 0); push(E, n, [0, 0], 0);
  }
  return {
    pos: new Float32Array(pos), nrm: new Float32Array(nrm),
    uv: new Float32Array(uv), isTable: new Float32Array(isTable), count: pos.length / 3,
  };
}

// ─────────────────────────── shaders ───────────────────────────
// Fondo VIVO procedural compartido (fondo + refracción), evita texturas/CORS.
// Reproduce el ambiente del sitio: negro + grano + blobs verdes borrosos en
// movimiento (como los dots de dots.ts, color #6c8c65) → la gema refracta algo
// vivo, no estático. (Endgame producción: canvas full-viewport que se coma dots.ts.)
const NOISE_GLSL = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  vec3 livingBg(vec2 uv, vec2 res, float t, sampler2D noiseTex, float noiseScale, float scrollY){
    float asp = res.x / res.y;
    vec2 p = vec2(uv.x * asp, uv.y);
    // base = clase .noise (negro + PNG noise-transparent repetido). fract()+CLAMP
    // tilea la textura NPOT; composite sobre negro = rgb*a.
    // El ruido se ancla a la PÁGINA (no al viewport): coord en px de página, y
    // hacia abajo = scrollY + (1-uv.y)*res.y → se desplaza con el scroll igual
    // que body.noise. (Los dots de abajo siguen en coords de viewport = fijos.)
    vec2 npx = vec2(uv.x * res.x, scrollY + (1.0 - uv.y) * res.y);
    vec4 nz = texture2D(noiseTex, fract(npx / noiseScale));
    vec3 col = nz.rgb * nz.a;
    for (int i = 0; i < 6; i++){
      float fi = float(i);
      vec2 c = vec2(hash(vec2(fi, 1.0)) * asp, hash(vec2(fi, 7.0)));
      c += 0.16 * vec2(sin(t * 0.18 + fi * 1.7), cos(t * 0.15 + fi * 2.3));
      float r = 0.17 + 0.07 * hash(vec2(fi, 3.0));
      float g = smoothstep(r, 0.0, length(p - c));
      col += g * g * vec3(0.10, 0.15, 0.095);        // dots verdes (como dots.ts)
    }
    return max(col, 0.0);
  }
`;

// Fondo: dibuja el fondo VIVO (dots) en el canvas → la gema refracta lo mismo.
const BG_VS = `
  attribute vec2 aPos; varying vec2 vUv;
  void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const BG_FS = `
  precision highp float; varying vec2 vUv;
  uniform vec2 uRes; uniform float uTime, uNoiseScale, uScrollY; uniform sampler2D uNoise;
  ${NOISE_GLSL}
  void main(){ gl_FragColor = vec4(livingBg(vUv, uRes, uTime, uNoise, uNoiseScale, uScrollY), 1.0); }
`;

// Copia una textura a todo el quad (para volcar FBOs).
const COPY_FS = `
  precision highp float; varying vec2 vUv; uniform sampler2D uTex;
  void main(){ gl_FragColor = texture2D(uTex, vUv); }
`;

const GEM_VS = `
  attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV; attribute float aIsTable;
  uniform mat4 uProj, uView, uModel;
  varying vec3 vN, vWorld; varying vec2 vUV, vMapUV; varying float vTable;
  void main(){
    vec4 w = uModel * vec4(aPos, 1.0);
    vWorld = w.xyz;
    vN = normalize(mat3(uModel) * aNormal);
    vUV = aUV; vTable = aIsTable;
    vMapUV = aPos.xy / 300.0 + 0.5;   // uv del mapa de vidrio sobre el hex (objeto)
    gl_Position = uProj * uView * w;
  }
`;
const GEM_FS = `
  precision highp float;
  varying vec3 vN, vWorld; varying vec2 vUV, vMapUV; varying float vTable;
  uniform vec2 uRes; uniform vec3 uLightDir, uCamPos;
  uniform sampler2D uLogo, uMap, uNormalMap, uRough, uNoise, uScene;
  uniform float uFish, uEmerge, uHover, uTime, uWear, uTile, uNoiseScale, uUseScene, uScrollY;
  ${NOISE_GLSL}
  // Fisheye sobre la uv del logo (barrel suave escalado por uFish)
  vec2 fishUV(vec2 uv, float amt){
    vec2 d = uv - 0.5; float r2 = dot(d, d) * 4.0;
    return 0.5 + d * (1.0 - amt * 0.28 * r2);
  }
  void main(){
    vec3 N = normalize(vN);
    vec3 view = normalize(uCamPos - vWorld);
    vec2 suv = gl_FragCoord.xy / uRes;

    // ── IMPERFECCIONES: NORMAL MAP horneado (Blender) ──
    // perturba la normal con el desgaste real; uWear controla la fuerza.
    vec2 wuv = vMapUV * uTile;
    vec3 nm = texture2D(uNormalMap, wuv).xyz * 2.0 - 1.0;  // decodificar (OpenGL)
    vec3 Np = normalize(N + vec3(nm.xy * uWear, 0.0));
    // roughness: zonas gastadas mate, limpias glossy
    float rough = texture2D(uRough, wuv).r;

    // Refracción: mapa de vidrio (lente) + desgaste (Np) → la distorsión ondula
    // sobre rayones/abolladuras como vidrio real.
    vec2 mapd = (texture2D(uMap, vMapUV).rg - 0.5) * 0.16;
    vec2 ruv = suv + mapd + Np.xy * 0.10;
    // refracción: en modo RTT (uUseScene) muestrea la ESCENA renderizada (fondo
    // + otras gemas) → vidrio sobre vidrio; si no, el fondo procedural directo.
    vec3 refr = uUseScene > 0.5
      ? texture2D(uScene, clamp(ruv, 0.0, 1.0)).rgb
      : livingBg(ruv, uRes, uTime, uNoise, uNoiseScale, uScrollY);

    vec3 base = refr;
    if (vTable > 0.5) {
      // logo mapeado a una zona central (con margen) → no desborda el hex. Fuera
      // de [0,1] = transparente (sin smear de CLAMP).
      vec2 luv = (vUV - 0.5) / 0.6 + 0.5;
      vec4 logo = texture2D(uLogo, fishUV(luv, uFish));
      if (luv.x < 0.0 || luv.x > 1.0 || luv.y < 0.0 || luv.y > 1.0) logo.a = 0.0;
      // el logo de la table se desvanece a medida que EMERGE (sube el quad limpio)
      vec3 tableGlass = mix(refr, vec3(0.9), 0.04);   // veladura neutra mínima
      base = mix(mix(tableGlass, logo.rgb, logo.a), refr, uEmerge);
    }
    // Vidrio NEUTRO transparente: domina el fondo refractado; la luz lo interviene.
    vec3 col = mix(base, vec3(1.0), 0.03);
    vec3 hlf = normalize(uLightDir + view);
    float ndh = max(dot(Np, hlf), 0.0);
    float diff = max(dot(Np, uLightDir), 0.0);          // difuso = 3 grados (cursor)
    col += diff * 0.22;
    // especular modulado por ROUGHNESS: gastado = mate/ancho, limpio = nítido/brillante.
    // La cara frontal (table) se amortigua para que no deslumbre.
    float specPow = mix(8.0, 80.0, 1.0 - rough);
    float specInt = mix(0.10, 0.50, 1.0 - rough);
    float specDamp = (vTable > 0.5) ? 0.4 : 1.0;
    col += pow(ndh, specPow) * specInt * specDamp * (0.5 + uHover * 0.6);
    float glint = pow(ndh, 200.0) * (1.0 - rough) * specDamp; // destellos en zonas limpias
    col += glint * (0.25 + uHover * 0.35);
    float fres = pow(1.0 - max(dot(Np, view), 0.0), 3.0); // borde (fresnel)
    col += fres * 0.25;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Logo emergente (quad encima) + glow
const LOGO_VS = `
  attribute vec2 aPos; varying vec2 vUv;
  uniform mat4 uProj, uView, uModel; uniform float uZ, uScale;
  void main(){
    vUv = aPos * vec2(0.5, -0.5) + 0.5;   // flip V → orientación correcta (como la table)
    vec3 w = vec3(aPos * uScale, uZ);
    gl_Position = uProj * uView * uModel * vec4(w, 1.0);
  }
`;
const LOGO_FS = `
  precision highp float; varying vec2 vUv;
  uniform sampler2D uLogo; uniform float uOpacity;
  void main(){
    vec4 c = texture2D(uLogo, vUv);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  }
`;
const GLOW_FS = `
  precision highp float; varying vec2 vUv; uniform float uOpacity;
  void main(){
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vec3(0.82, 0.90, 1.0), a * a * 0.7 * uOpacity);
  }
`;

// ─────────────────────────── helpers GL ───────────────────────────
function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p); return p;
}
function buffer(gl: WebGLRenderingContext, data: Float32Array): WebGLBuffer {
  const b = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b;
}

// Dibuja un logo (placeholder Vercel) a un canvas offscreen → textura.
function makeLogoTexture(gl: WebGLRenderingContext, size = 512): WebGLTexture {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const cx = size / 2, tri = size * 0.20;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx, cx - tri);
  ctx.lineTo(cx - tri, cx + tri * 0.6);
  ctx.lineTo(cx + tri, cx + tri * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.font = `bold ${size * 0.085}px sans-serif`;
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.fillText('Vercel', cx, cx + tri * 1.15);
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// Carga una imagen como textura (placeholder hasta cargar). POT → mipmaps.
function loadImageTexture(gl: WebGLRenderingContext, url: string, ph: Uint8Array): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ph);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D); // 2048² = POT
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  };
  img.src = url;
  return tex;
}

// Carga el logo de una gema desde una URL (crossOrigin para Cloudinary).
// Placeholder transparente; si CORS falla queda sin logo (no rompe).
function loadLogoTex(gl: WebGLRenderingContext, url: string): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Algunos SVG de Cloudinary no traen width/height intrínsecos → naturalWidth=0
    // → texImage2D(img) lanza INVALID_VALUE "bad image data". Rasterizamos a un
    // canvas con dimensiones explícitas (cuadrado) y subimos eso.
    const SIZE = 256;
    const cv = document.createElement('canvas');
    cv.width = SIZE; cv.height = SIZE;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    // Encajar el logo manteniendo aspecto; si el SVG no reporta tamaño, asumimos cuadrado.
    const iw = img.naturalWidth || img.width || SIZE;
    const ih = img.naturalHeight || img.height || SIZE;
    const scale = Math.min(SIZE / iw, SIZE / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  img.src = url;
  return tex;
}

// Point-in-hex (coords normalizadas −1..1, hex pointy-top)
function insideHex(nx: number, ny: number): boolean {
  const verts = V.map(([x, y]) => [x / R, y / R]);
  let inside = false;
  for (let i = 0, j = 5; i < 6; j = i++) {
    const xi = verts[i][0], yi = verts[i][1], xj = verts[j][0], yj = verts[j][1];
    if (((yi > ny) !== (yj > ny)) && (nx < ((xj - xi) * (ny - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

const REST_FISH = 0, HOVER_SCALE = 1.12, MAX_ANGLE = 18, DAMPING = 0.2;  // 0 = sin ojo de pescado
const CAM_Z = 700;
const WEAR = 1.5;   // fuerza del relieve del normal map (desgaste)
const TILE = 1;   // escala uv de los mapas de desgaste sobre la cara
const LIFT = 110;   // elevación en +Z al hover (panal): cuerpo + hundimiento del tilt
const NOISE_PX = 400; // tamaño del PNG /noise.png (para tilear como .noise)

export interface GemInstance { x: number; y: number; }
export interface GemGLOptions {
  instances?: GemInstance[];   // posiciones (px-mundo) de cada gema; default 1 centrada
  bg?: boolean;                // dibujar el fondo de dots en el canvas (modo simple)
  camZ?: number;               // distancia de cámara (perspectiva); default 700
  ortho?: boolean;             // proyección ortográfica (tamaño FIJO, sin perspectiva)
  seeThrough?: boolean;        // RTT: las gemas se refractan entre sí (vidrio sobre vidrio)
  layoutEls?: HTMLElement[];   // hexes del DOM como fuente de posición/tamaño (px) → reflow
  honeycomb?: { count: number; sizePx?: number; gapX?: number; gapY?: number }; // panal calculado en JS (reflow)
  fullViewport?: boolean;      // canvas fijo a pantalla completa (fondo global) → ortho
  perInstanceLogo?: boolean;   // usar el <img> de cada layoutEl como logo de su gema
  onLowPerf?: () => void;      // callback si el FPS es sostenidamente bajo (auto-fallback)
}

export function initGemGL(canvas: HTMLCanvasElement, opts: GemGLOptions = {}): () => void {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) { console.warn('WebGL no disponible'); return () => {}; }

  const fullVp = !!opts.fullViewport;
  const onLowPerf = opts.onLowPerf;
  const honey = (opts.honeycomb && opts.honeycomb.count) ? opts.honeycomb : null;
  // layoutEls puede venir vacío (fullViewport en una página sin techs → solo fondo).
  const layoutEls = opts.layoutEls ? opts.layoutEls : null;
  const INST: GemInstance[] = honey
    ? Array.from({ length: honey.count }, () => ({ x: 0, y: 0 }))
    : layoutEls
      ? layoutEls.map(() => ({ x: 0, y: 0 }))
      : ((opts.instances && opts.instances.length) ? opts.instances.map((p) => ({ x: p.x, y: p.y })) : [{ x: 0, y: 0 }]);
  const n = INST.length;
  const drawBg = !!opts.bg || fullVp;
  const ortho = !!opts.ortho || fullVp;
  const seeThrough = !!opts.seeThrough;
  const camZ = opts.camZ ?? CAM_Z;

  const gem = buildGem();
  const progGem = program(gl, GEM_VS, GEM_FS);
  const progLogo = program(gl, LOGO_VS, LOGO_FS);
  const progGlow = program(gl, LOGO_VS, GLOW_FS);
  const progBg = program(gl, BG_VS, BG_FS);
  const progCopy = program(gl, BG_VS, COPY_FS);

  const quad = buffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
  const bufPos = buffer(gl, gem.pos);
  const bufNrm = buffer(gl, gem.nrm);
  const bufUV = buffer(gl, gem.uv);
  const bufTab = buffer(gl, gem.isTable);
  const logoTex = makeLogoTexture(gl);
  // Logo POR INSTANCIA: si se pide, usa el <img> de cada hex del DOM como su logo.
  const logoTexes: WebGLTexture[] = INST.map(() => logoTex);
  if (opts.perInstanceLogo && layoutEls) {
    layoutEls.forEach((el, i) => {
      const src = el.querySelector('img')?.getAttribute('src');
      if (src) logoTexes[i] = loadLogoTex(gl!, src);
    });
  }

  // Mapa de desplazamiento de vidrio (liquid-glass-effect/map.png → /public).
  // Placeholder gris (0.5,0.5 = sin desplazamiento) hasta que la imagen carga.
  const mapTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, mapTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([128, 128, 128, 255]));
  for (const [k, v] of [
    [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
  ] as const) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const mapImg = new Image();
  mapImg.onload = () => {
    gl!.bindTexture(gl!.TEXTURE_2D, mapTex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, mapImg);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
  };

  // Desgaste horneado (Blender): normal map (plano = 128,128,255) + roughness (gris).
  const normalTex = loadImageTexture(gl, '/HexagonMaterial_Normal.png',
    new Uint8Array([128, 128, 255, 255]));
  const roughTex = loadImageTexture(gl, '/HexagonMaterial_Roughness.png',
    new Uint8Array([128, 128, 128, 255]));

  // Ruido del sitio (.noise → /public/noise.png, 400² NPOT → CLAMP + sin mipmap;
  // se tilea en el shader con fract()). Placeholder negro transparente.
  const noiseTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, noiseTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]));
  for (const [k, v] of [
    [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
  ] as const) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const noiseImg = new Image();
  noiseImg.onload = () => {
    gl!.bindTexture(gl!.TEXTURE_2D, noiseTex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, noiseImg);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
  };
  noiseImg.src = '/noise.png';

  // estado animado POR INSTANCIA
  const tRX = new Float32Array(n), tRY = new Float32Array(n);
  const cRX = new Float32Array(n), cRY = new Float32Array(n);
  const sCur = new Float32Array(n).fill(1), sTar = new Float32Array(n).fill(1);
  const eCur = new Float32Array(n), eTar = new Float32Array(n);
  const bscale = new Float32Array(n).fill(1);   // escala base = sizePx/300 (modo DOM)
  const ldir: number[][] = INST.map(() => [0.4, 0.5, 0.75]);
  const hovering = new Array(n).fill(false);
  let raf = 0, dpr = 1;
  const lift = n > 1 ? LIFT : 0;
  const ANG = MAX_ANGLE * Math.PI / 180;

  // Lee posiciones/tamaño desde el DOM (honeycomb CSS) → instancias en px centrados.
  function readLayout() {
    if (!layoutEls) return;
    const cr = canvas.getBoundingClientRect();
    const ccx = cr.left + cr.width / 2, ccy = cr.top + cr.height / 2;
    for (let i = 0; i < n; i++) {
      const r = layoutEls[i].getBoundingClientRect();
      INST[i].x = (r.left + r.width / 2) - ccx;
      INST[i].y = -((r.top + r.height / 2) - ccy);
      bscale[i] = r.width / 300;
    }
  }

  // Panal INTERLAZADO (pointy-top) calculado en JS, tamaño FIJO + reflow al ancho.
  // Setea la altura CSS del canvas para contener todas las filas.
  function layoutHoneycomb() {
    if (!honey) return;
    const sz = honey.sizePx ?? 120, gx = honey.gapX ?? 12, gy = honey.gapY ?? 12;
    const W = canvas.clientWidth || 600;
    const stepX = sz + gx, stepY = 0.75 * sz + gy, rowOff = stepX / 2;
    const perRow = Math.max(1, Math.floor((W - rowOff) / stepX));
    const rows = Math.ceil(n / perRow);
    const blockW = (perRow - 1) * stepX + (rows > 1 ? rowOff : 0) + sz;
    const blockH = (rows - 1) * stepY + sz;
    canvas.style.height = `${Math.ceil(blockH)}px`;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow), col = i % perRow;
      const x = col * stepX + (row % 2 ? rowOff : 0);
      const y = row * stepY;
      INST[i].x = x - blockW / 2 + sz / 2;
      INST[i].y = -(y - blockH / 2 + sz / 2);   // y arriba
      bscale[i] = sz / 300;
    }
  }

  // ── FBOs para RTT (vidrio sobre vidrio) ──
  let fboA: WebGLFramebuffer | null = null, texA: WebGLTexture | null = null;
  let fboB: WebGLFramebuffer | null = null, texB: WebGLTexture | null = null;
  let depthRB: WebGLRenderbuffer | null = null;
  function colorTex(W: number, Hh: number): WebGLTexture {
    const tx = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, tx);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, W, Hh, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return tx;
  }
  function setupFbos(W: number, Hh: number) {
    if (!seeThrough) return;
    [fboA, fboB].forEach((f) => f && gl!.deleteFramebuffer(f));
    [texA, texB].forEach((tx) => tx && gl!.deleteTexture(tx));
    if (depthRB) gl!.deleteRenderbuffer(depthRB);
    texA = colorTex(W, Hh); fboA = gl!.createFramebuffer();
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fboA);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texA, 0);
    texB = colorTex(W, Hh); fboB = gl!.createFramebuffer();
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fboB);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texB, 0);
    depthRB = gl!.createRenderbuffer();
    gl!.bindRenderbuffer(gl!.RENDERBUFFER, depthRB);
    gl!.renderbufferStorage(gl!.RENDERBUFFER, gl!.DEPTH_COMPONENT16, W, Hh);
    gl!.framebufferRenderbuffer(gl!.FRAMEBUFFER, gl!.DEPTH_ATTACHMENT, gl!.RENDERBUFFER, depthRB);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (honey) layoutHoneycomb();   // setea altura CSS + posiciones (usa clientWidth)
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    setupFbos(canvas.width, canvas.height);
    readLayout();
  }

  function setAttrib(prog: WebGLProgram, name: string, buf: WebGLBuffer, size: number) {
    const loc = gl!.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
    gl!.enableVertexAttribArray(loc);
    gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0);
  }

  // fov perspectiva (modo no-ortho): enmarca todas las instancias
  function computeFov(aspect: number): number {
    let hW = R * 1.25, hH = R * 1.25;
    for (const it of INST) { hW = Math.max(hW, Math.abs(it.x) + R * 1.15); hH = Math.max(hH, Math.abs(it.y) + R * 1.15); }
    return Math.max(2 * Math.atan(hH / camZ), 2 * Math.atan(hW / (camZ * aspect)));
  }

  function getProjView(W: number, Hh: number) {
    if (ortho) {
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      return { proj: m4.ortho(-cw / 2, cw / 2, -ch / 2, ch / 2, 1, 4000), view: m4.translate(0, 0, -2000), camPos: [0, 0, 2000] };
    }
    const aspect = W / Hh, fov = computeFov(aspect);
    return { proj: m4.perspective(fov, aspect, 1, 8000), view: m4.translate(0, 0, -camZ), camPos: [0, 0, camZ] };
  }

  function modelOf(i: number): M4 {
    return m4.mul(m4.translate(INST[i].x, INST[i].y, eCur[i] * lift),
      m4.mul(m4.mul(m4.rotX(cRX[i]), m4.rotY(cRY[i])), m4.scale(sCur[i] * bscale[i])));
  }

  function drawBgPass(t: number, W: number, Hh: number) {
    gl!.disable(gl!.DEPTH_TEST); gl!.depthMask(false); gl!.disable(gl!.BLEND);
    gl!.useProgram(progBg);
    gl!.uniform2f(gl!.getUniformLocation(progBg, 'uRes'), W, Hh);
    gl!.uniform1f(gl!.getUniformLocation(progBg, 'uTime'), t);
    gl!.uniform1f(gl!.getUniformLocation(progBg, 'uNoiseScale'), NOISE_PX * dpr);
    gl!.uniform1f(gl!.getUniformLocation(progBg, 'uScrollY'), fullVp ? window.scrollY * dpr : 0);
    gl!.activeTexture(gl!.TEXTURE4); gl!.bindTexture(gl!.TEXTURE_2D, noiseTex);
    gl!.uniform1i(gl!.getUniformLocation(progBg, 'uNoise'), 4);
    setAttrib(progBg, 'aPos', quad, 2);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }

  function copyTex(tex: WebGLTexture) {
    gl!.disable(gl!.DEPTH_TEST); gl!.depthMask(false); gl!.disable(gl!.BLEND);
    gl!.useProgram(progCopy);
    gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(gl!.getUniformLocation(progCopy, 'uTex'), 5);
    setAttrib(progCopy, 'aPos', quad, 2);
    gl!.drawArrays(gl!.TRIANGLES, 0, 6);
  }

  function drawGems(t: number, W: number, Hh: number, proj: M4, view: M4, camPos: number[], sceneTex: WebGLTexture | null) {
    gl!.enable(gl!.DEPTH_TEST); gl!.depthMask(true); gl!.disable(gl!.BLEND);
    gl!.useProgram(progGem);
    gl!.uniformMatrix4fv(gl!.getUniformLocation(progGem, 'uProj'), false, proj);
    gl!.uniformMatrix4fv(gl!.getUniformLocation(progGem, 'uView'), false, view);
    gl!.uniform2f(gl!.getUniformLocation(progGem, 'uRes'), W, Hh);
    gl!.uniform3f(gl!.getUniformLocation(progGem, 'uCamPos'), camPos[0], camPos[1], camPos[2]);
    gl!.uniform1f(gl!.getUniformLocation(progGem, 'uTime'), t);
    gl!.uniform1f(gl!.getUniformLocation(progGem, 'uWear'), WEAR);
    gl!.uniform1f(gl!.getUniformLocation(progGem, 'uTile'), TILE);
    gl!.uniform1f(gl!.getUniformLocation(progGem, 'uNoiseScale'), NOISE_PX * dpr);
    gl!.uniform1f(gl!.getUniformLocation(progGem, 'uScrollY'), fullVp ? window.scrollY * dpr : 0);
    gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, logoTex); gl!.uniform1i(gl!.getUniformLocation(progGem, 'uLogo'), 0);
    gl!.activeTexture(gl!.TEXTURE1); gl!.bindTexture(gl!.TEXTURE_2D, mapTex); gl!.uniform1i(gl!.getUniformLocation(progGem, 'uMap'), 1);
    gl!.activeTexture(gl!.TEXTURE2); gl!.bindTexture(gl!.TEXTURE_2D, normalTex); gl!.uniform1i(gl!.getUniformLocation(progGem, 'uNormalMap'), 2);
    gl!.activeTexture(gl!.TEXTURE3); gl!.bindTexture(gl!.TEXTURE_2D, roughTex); gl!.uniform1i(gl!.getUniformLocation(progGem, 'uRough'), 3);
    gl!.activeTexture(gl!.TEXTURE4); gl!.bindTexture(gl!.TEXTURE_2D, noiseTex); gl!.uniform1i(gl!.getUniformLocation(progGem, 'uNoise'), 4);
    gl!.uniform1f(gl!.getUniformLocation(progGem, 'uUseScene'), sceneTex ? 1 : 0);
    if (sceneTex) { gl!.activeTexture(gl!.TEXTURE5); gl!.bindTexture(gl!.TEXTURE_2D, sceneTex); gl!.uniform1i(gl!.getUniformLocation(progGem, 'uScene'), 5); }
    setAttrib(progGem, 'aPos', bufPos, 3);
    setAttrib(progGem, 'aNormal', bufNrm, 3);
    setAttrib(progGem, 'aUV', bufUV, 2);
    setAttrib(progGem, 'aIsTable', bufTab, 1);
    const uModelG = gl!.getUniformLocation(progGem, 'uModel');
    const uLightG = gl!.getUniformLocation(progGem, 'uLightDir');
    const uFishG = gl!.getUniformLocation(progGem, 'uFish');
    const uEmergeG = gl!.getUniformLocation(progGem, 'uEmerge');
    const uHoverG = gl!.getUniformLocation(progGem, 'uHover');
    for (let i = 0; i < n; i++) {
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, logoTexes[i]);
      gl!.uniformMatrix4fv(uModelG, false, modelOf(i));
      gl!.uniform3f(uLightG, ldir[i][0], ldir[i][1], ldir[i][2]);
      gl!.uniform1f(uFishG, REST_FISH * (1 - eCur[i]));
      gl!.uniform1f(uEmergeG, eCur[i]);
      gl!.uniform1f(uHoverG, eCur[i]);
      gl!.drawArrays(gl!.TRIANGLES, 0, gem.count);
    }
  }

  function drawLogos(proj: M4, view: M4) {
    let any = false; for (let i = 0; i < n; i++) if (eCur[i] > 0.001) { any = true; break; }
    if (!any) return;
    gl!.enable(gl!.BLEND);
    for (let i = 0; i < n; i++) {
      const e = eCur[i]; if (e <= 0.001) continue;
      const base = modelOf(i);
      const logoZ = H + 4 + e * 60;
      const logoScale = 70 * (1 + e * 0.08);   // ~tamaño del logo de la table (luv 0.6)
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE); gl!.depthMask(false);
      gl!.useProgram(progGlow);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(progGlow, 'uProj'), false, proj);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(progGlow, 'uView'), false, view);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(progGlow, 'uModel'), false, base);
      gl!.uniform1f(gl!.getUniformLocation(progGlow, 'uZ'), logoZ - 2);
      gl!.uniform1f(gl!.getUniformLocation(progGlow, 'uScale'), logoScale * 1.7);
      gl!.uniform1f(gl!.getUniformLocation(progGlow, 'uOpacity'), e);
      setAttrib(progGlow, 'aPos', quad, 2);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.useProgram(progLogo);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(progLogo, 'uProj'), false, proj);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(progLogo, 'uView'), false, view);
      gl!.uniformMatrix4fv(gl!.getUniformLocation(progLogo, 'uModel'), false, base);
      gl!.uniform1f(gl!.getUniformLocation(progLogo, 'uZ'), logoZ);
      gl!.uniform1f(gl!.getUniformLocation(progLogo, 'uScale'), logoScale);
      gl!.uniform1f(gl!.getUniformLocation(progLogo, 'uOpacity'), e);
      gl!.activeTexture(gl!.TEXTURE0); gl!.bindTexture(gl!.TEXTURE_2D, logoTexes[i]); gl!.uniform1i(gl!.getUniformLocation(progLogo, 'uLogo'), 0);
      setAttrib(progLogo, 'aPos', quad, 2);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    gl!.depthMask(true);
  }

  function draw(t: number) {
    const W = canvas.width, Hh = canvas.height;
    const { proj, view, camPos } = getProjView(W, Hh);
    if (seeThrough) {
      // A) fondo → texA
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fboA);
      gl!.viewport(0, 0, W, Hh); gl!.clearColor(0, 0, 0, 1); gl!.clear(gl!.COLOR_BUFFER_BIT);
      drawBgPass(t, W, Hh);
      // B) copia texA + gemas refractando texA → texB
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fboB);
      gl!.viewport(0, 0, W, Hh); gl!.clearColor(0, 0, 0, 1); gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
      copyTex(texA!);
      drawGems(t, W, Hh, proj, view, camPos, texA);
      // pantalla) copia texA + gemas refractando texB (= vidrio sobre vidrio) + logos
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, W, Hh); gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
      copyTex(texA!);
      drawGems(t, W, Hh, proj, view, camPos, texB);
      drawLogos(proj, view);
    } else {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, W, Hh); gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);
      if (drawBg) drawBgPass(t, W, Hh);
      drawGems(t, W, Hh, proj, view, camPos, null);
      drawLogos(proj, view);
    }
  }

  const t0 = performance.now();
  let fpsFrames = 0, fpsWinT = t0, lowWins = 0, perfChecked = false;
  function frame(now: number) {
    const t = (now - t0) / 1000;
    for (let i = 0; i < n; i++) {
      cRX[i] += (tRX[i] - cRX[i]) * DAMPING;
      cRY[i] += (tRY[i] - cRY[i]) * DAMPING;
      sCur[i] += (sTar[i] - sCur[i]) * DAMPING;
      eCur[i] += (eTar[i] - eCur[i]) * DAMPING;
    }
    draw(t);
    // Monitor de FPS: si 2 ventanas seguidas <38fps → fallback liviano.
    if (onLowPerf && !perfChecked) {
      fpsFrames++;
      if (now - fpsWinT >= 1000) {
        const fps = (fpsFrames * 1000) / (now - fpsWinT);
        fpsFrames = 0; fpsWinT = now;
        if (fps < 38) { if (++lowWins >= 2) { perfChecked = true; onLowPerf(); } }
        else lowWins = 0;
        if (now - t0 > 6000) perfChecked = true;   // tras 6s estable, dejar de chequear
      }
    }
    raf = requestAnimationFrame(frame);
  }

  // ─── interacción: cursor GLOBAL ───
  let rect = canvas.getBoundingClientRect();
  const measure = () => { rect = canvas.getBoundingClientRect(); };

  function onMove(ev: PointerEvent) {
    let mx: number, my: number;
    if (ortho) {
      // px centrados (CSS), igual que las posiciones del DOM
      mx = (ev.clientX - rect.left) - rect.width / 2;
      my = -((ev.clientY - rect.top) - rect.height / 2);
    } else {
      const aspect = rect.width / rect.height;
      const wh = Math.tan(computeFov(aspect) / 2) * camZ, ww = wh * aspect;
      mx = ((ev.clientX - rect.left) / rect.width * 2 - 1) * ww;
      my = -((ev.clientY - rect.top) / rect.height * 2 - 1) * wh;
    }
    let hit = -1;
    for (let i = 0; i < n; i++) {
      const half = ortho ? (R * bscale[i]) : R;     // semi-tamaño del hex en estas unidades
      const lx = (mx - INST[i].x) / half, ly = (my - INST[i].y) / half;
      const L = Math.hypot(lx, ly, 0.85) || 1;
      ldir[i] = [lx / L, ly / L, 0.85 / L];
      if (hit < 0 && lx >= -1 && lx <= 1 && ly >= -1 && ly <= 1 && insideHex(lx, ly)) hit = i;
    }
    for (let i = 0; i < n; i++) {
      if (i === hit) {
        hovering[i] = true; eTar[i] = 1; sTar[i] = HOVER_SCALE;
        const half = ortho ? (R * bscale[i]) : R;
        tRX[i] = ((my - INST[i].y) / half) * ANG;
        tRY[i] = -((mx - INST[i].x) / half) * ANG;
      } else {
        hovering[i] = false; eTar[i] = 0; sTar[i] = 1; tRX[i] = 0; tRY[i] = 0;
      }
    }
  }

  function onResize() { measure(); resize(); }
  function onScroll() { measure(); readLayout(); }
  function onVisibility() {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    else if (!raf) raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('pointermove', onMove);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(frame);

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    if (raf) cancelAnimationFrame(raf);
    // liberar GPU (importante para el auto-fallback)
    [progGem, progLogo, progGlow, progBg, progCopy].forEach((p) => gl!.deleteProgram(p));
    [quad, bufPos, bufNrm, bufUV, bufTab].forEach((b) => gl!.deleteBuffer(b));
    [logoTex, mapTex, normalTex, roughTex, noiseTex, ...logoTexes, texA, texB].forEach((tx) => tx && gl!.deleteTexture(tx));
    [fboA, fboB].forEach((f) => f && gl!.deleteFramebuffer(f));
    if (depthRB) gl!.deleteRenderbuffer(depthRB);
  };
}
