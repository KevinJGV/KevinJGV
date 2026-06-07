// Ripple-Shader fiel (Akash1000x/Ripple-Shader) en Three.js VANILLA, montado con
// un <script> de Astro (no React island). Mismo pipeline que el repo: pool de
// brushes que se estampan a lo largo del trazo del cursor y decaen en un FBO, y
// un shader que corre la UV de la imagen según ese desplazamiento → ripple
// líquido. Adaptado a UNA imagen (la foto) que llena el canvas.
import * as THREE from "three";

const vertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Idéntico al repo salvo winResolution vec4 → vec2 (sólo se usa .xy).
const fragment = `
  uniform sampler2D uTexture;
  uniform sampler2D uDisplacement;
  uniform vec2 winResolution;
  varying vec2 vUv;
  float PI = 3.141592653589793238;
  void main() {
    vec2 vUvScreen = gl_FragCoord.xy / winResolution.xy;
    vec4 displacement = texture2D(uDisplacement, vUvScreen);
    float theta = displacement.r * 2.0 * PI;
    vec2 dir = vec2(sin(theta), cos(theta));
    vec2 uv = vUvScreen + dir * displacement.r * 0.1;
    gl_FragColor = texture2D(uTexture, uv);
  }
`;

const MAX = 100; // pool de brushes (igual que el repo)

export function initRippleThree(canvas: HTMLCanvasElement, img: HTMLImageElement): () => void {
  // Passthrough total de color (como el repo / three antiguo): sin decode al
  // muestrear ni encode a la salida → la foto conserva su brillo original a
  // través de las pasadas por FBO. (Único consumidor de three; gemGL es WebGL crudo.)
  THREE.ColorManagement.enabled = false;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = true;
  // Pipeline passthrough (como el repo): sin conversiones de color en las pasadas
  // por FBO, si no la imagen sale oscura (lineal mostrada como sRGB).
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  // tamaño inicial = box renderizado de la <img>
  let W = Math.max(1, Math.round(img.getBoundingClientRect().width));
  let H = Math.max(1, Math.round(img.getBoundingClientRect().height));
  renderer.setSize(W, H, false);

  // Cámara ortográfica en píxeles (world = px, centrada).
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -1000, 1000);
  cam.position.z = 2;

  // Texturas: imagen (desde el <img> ya cargado) + brush (asset propio).
  const imgTex = new THREE.Texture(img);
  imgTex.colorSpace = THREE.NoColorSpace; // crudo → sin conversión en el muestreo
  imgTex.needsUpdate = true;
  const brushTex = new THREE.TextureLoader().load("/brush.png");

  const uniforms = {
    uDisplacement: { value: null as THREE.Texture | null },
    uTexture: { value: null as THREE.Texture | null },
    winResolution: { value: new THREE.Vector2(W * dpr, H * dpr) },
  };

  // FBOs (ping-pong).
  const makeFbo = () => new THREE.WebGLRenderTarget(Math.round(W * dpr), Math.round(H * dpr));
  let fboBase = makeFbo();
  let fboTexture = makeFbo();

  // Escena de brushes (pool).
  const brushScene = new THREE.Scene();
  const brushGeo = new THREE.PlaneGeometry(60, 60, 1, 1);
  const meshes: THREE.Mesh[] = [];
  for (let i = 0; i < MAX; i++) {
    const mat = new THREE.MeshBasicMaterial({ map: brushTex, transparent: true, depthTest: false, depthWrite: false });
    const m = new THREE.Mesh(brushGeo, mat);
    m.rotation.z = Math.random() * Math.PI * 2;
    m.visible = false;
    meshes.push(m);
    brushScene.add(m);
  }

  // Escena de la imagen (plano que llena el frustum).
  const imageScene = new THREE.Scene();
  // NoBlending: el plano llena el FBO y escribe RGBA RECTO (no premultiplica al
  // mezclar con el fondo limpio). Evita el doble premultiply que oscurecía la foto.
  const imageMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: imgTex, transparent: true, blending: THREE.NoBlending }),
  );
  imageScene.add(imageMesh);

  // Escena final (plano con el shader del ripple).
  const finalScene = new THREE.Scene();
  // NoBlending también acá: escribe RGBA recto al canvas; el navegador
  // (premultipliedAlpha:false) lo compone UNA vez sobre la página, igual que el <img>.
  const finalMat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, transparent: true, blending: THREE.NoBlending, uniforms });
  const finalMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), finalMat);
  finalScene.add(finalMesh);

  function applySize() {
    imageMesh.scale.set(W, H, 1);
    finalMesh.scale.set(W, H, 1);
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2;
    cam.updateProjectionMatrix();
    uniforms.winResolution.value.set(W * dpr, H * dpr);
  }
  applySize();

  // ── trail ──
  const prev = { x: 0, y: 0 };
  const pointer = { x: 0, y: 0, inside: false };
  let wave = 0;

  function setNewWave(x: number, y: number, idx: number) {
    const m = meshes[idx];
    m.position.set(x, y, 0);
    m.visible = true;
    (m.material as THREE.MeshBasicMaterial).opacity = 1;
    m.scale.set(2, 2, 1);
  }
  function track(x: number, y: number) {
    if (Math.abs(x - prev.x) > 0.1 || Math.abs(y - prev.y) > 0.1) {
      wave = (wave + 1) % MAX;
      setNewWave(x, y, wave);
    }
    prev.x = x; prev.y = y;
  }

  function onMove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const rx = e.clientX - r.left, ry = e.clientY - r.top;
    pointer.inside = rx >= 0 && rx <= r.width && ry >= 0 && ry <= r.height;
    pointer.x = rx - W / 2;        // px centrado
    pointer.y = H / 2 - ry;        // y hacia arriba
  }

  // ── loop ──
  let raf = 0;
  function frame() {
    if (pointer.inside) track(pointer.x, pointer.y);
    else { prev.x = pointer.x; prev.y = pointer.y; }

    for (const m of meshes) {
      if (!m.visible) continue;
      const mat = m.material as THREE.MeshBasicMaterial;
      m.rotation.z += 0.025;
      mat.opacity *= 0.95;
      m.scale.x = 0.98 * m.scale.x + 0.155;
      m.scale.y = 0.98 * m.scale.y + 0.155;
      if (mat.opacity < 0.002) m.visible = false;
    }

    uniforms.winResolution.value.set(W * dpr, H * dpr);
    // 1) brushes → fboBase
    renderer.setRenderTarget(fboBase);
    renderer.clear();
    renderer.render(brushScene, cam);
    uniforms.uTexture.value = fboTexture.texture;
    // 2) imagen → fboTexture
    renderer.setRenderTarget(fboTexture);
    renderer.render(imageScene, cam);
    uniforms.uDisplacement.value = fboBase.texture;
    // 3) final → pantalla
    renderer.setRenderTarget(null);
    renderer.render(finalScene, cam);

    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  // resize: re-medir el box de la <img>.
  const ro = new ResizeObserver(() => {
    const r = img.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    if (nw === W && nh === H) return;
    W = nw; H = nh;
    renderer.setSize(W, H, false);
    fboBase.dispose(); fboTexture.dispose();
    fboBase = makeFbo(); fboTexture = makeFbo();
    applySize();
  });
  ro.observe(img);

  function onVisibility() { if (document.hidden) stop(); else start(); }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  start();

  return () => {
    stop();
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVisibility);
    ro.disconnect();
    fboBase.dispose(); fboTexture.dispose();
    brushGeo.dispose();
    meshes.forEach((m) => (m.material as THREE.Material).dispose());
    imageMesh.geometry.dispose(); (imageMesh.material as THREE.Material).dispose();
    finalMesh.geometry.dispose(); finalMat.dispose();
    imgTex.dispose(); brushTex.dispose();
    renderer.dispose();
  };
}
