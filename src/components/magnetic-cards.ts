type Stage = HTMLElement;
type Card = HTMLElement;

interface BaseRect {
  left: number;
  top: number;
  w: number;
  h: number;
}

const MAX_PULL = 28;
// Fire trigger es "inside base bounding box" (no distance threshold).
// FIRE_EXIT sigue siendo distancia para histéresis al desfire (cursor lejos
// del centro tras salir del expanded bounds).
const FIRE_EXIT = 130;

// Extensión de la zona de atracción por lado, según la posición FÍSICA de la
// card en el contenedor (se calcula en runtime, ver computeZones):
//  - lado abierto (borde externo, sin vecina) → atracción grande
//  - lado con vecina → mínima (no interferir con la adyacente)
//  - card interior total (vecinas en los 4 lados) → leve en los 4 (se nota)
const ZONE_OUTER = 200;
const ZONE_NEIGHBOR = 14;
const ZONE_INTERIOR = 50;

interface ZoneExt { left: number; right: number; top: number; bottom: number; }

let firedCard: Card | null = null;
let rafId: number | null = null;
let pendingEvent: MouseEvent | null = null;

const bases = new Map<Card, BaseRect>();
const zonesByCard = new Map<Card, ZoneExt>();

let resizeCleanup: (() => void) | null = null;

function cacheBases(stage: Stage, cards: Card[]): void {
  const sr = stage.getBoundingClientRect();
  for (const c of cards) {
    const prevTransform = c.style.transform;
    const prevClass = c.className;
    c.style.transform = 'none';
    c.classList.remove('fired', 'attracting');
    const r = c.getBoundingClientRect();
    bases.set(c, {
      left: r.left - sr.left,
      top: r.top - sr.top,
      w: r.width,
      h: r.height,
    });
    c.style.transform = prevTransform;
    c.className = prevClass;
  }
  computeZones(cards);
}

// Deriva la zona de atracción de cada card de su POSICIÓN FÍSICA: detecta si
// tiene vecinas a cada lado (otra card a ese lado, solapada en el eje
// perpendicular = misma fila/columna). Lado abierto → grande; con vecina →
// mínima; card interior total → leve en los 4. Recalculado en cada cacheBases
// (init + resize), así fila↔columna reasigna zonas automáticamente.
function computeZones(cards: Card[]): void {
  zonesByCard.clear();
  const info = cards.map((c) => {
    const b = bases.get(c)!;
    return { c, l: b.left, r: b.left + b.w, t: b.top, btm: b.top + b.h, cx: b.left + b.w / 2, cy: b.top + b.h / 2 };
  });
  const EPS = 4;
  for (const a of info) {
    let hasLeft = false, hasRight = false, hasTop = false, hasBottom = false;
    for (const o of info) {
      if (o === a) continue;
      const sameRow = o.t < a.btm - EPS && o.btm > a.t + EPS;   // solape vertical
      const sameCol = o.l < a.r - EPS && o.r > a.l + EPS;       // solape horizontal
      if (sameRow && o.cx < a.cx - EPS) hasLeft = true;
      if (sameRow && o.cx > a.cx + EPS) hasRight = true;
      if (sameCol && o.cy < a.cy - EPS) hasTop = true;
      if (sameCol && o.cy > a.cy + EPS) hasBottom = true;
    }
    const interior = hasLeft && hasRight && hasTop && hasBottom;
    const ext = (hasNeighbor: boolean) =>
      interior ? ZONE_INTERIOR : hasNeighbor ? ZONE_NEIGHBOR : ZONE_OUTER;
    zonesByCard.set(a.c, {
      left: ext(hasLeft),
      right: ext(hasRight),
      top: ext(hasTop),
      bottom: ext(hasBottom),
    });
  }
}

function getZone(card: Card) {
  const b = bases.get(card)!;
  const z = zonesByCard.get(card) ?? { left: ZONE_OUTER, right: ZONE_OUTER, top: ZONE_OUTER, bottom: ZONE_OUTER };
  return {
    left: b.left - z.left,
    right: b.left + b.w + z.right,
    top: b.top - z.top,
    bottom: b.top + b.h + z.bottom,
    cx: b.left + b.w / 2,
    cy: b.top + b.h / 2,
  };
}

function getCurrentBounds(stage: Stage, card: Card) {
  const r = card.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  return {
    left: r.left - sr.left,
    right: r.right - sr.left,
    top: r.top - sr.top,
    bottom: r.bottom - sr.top,
  };
}

function updateSpecular(card: Card, e: MouseEvent): void {
  const cr = card.getBoundingClientRect();
  const rx = ((e.clientX - cr.left) / cr.width) * 100;
  const ry = ((e.clientY - cr.top) / cr.height) * 100;
  card.style.setProperty('--rx', `${rx}%`);
  card.style.setProperty('--ry', `${ry}%`);
}

function resetCard(card: Card): void {
  card.style.transform = 'translate(0,0) scale(1)';
  card.classList.remove('attracting');
  // NOTE: --rx/--ry NO se borran. El shine fade-out usa la última
  // posición del cursor para evitar el flash al snap a center (50%/50%).
  // Próximo mousemove sobre la card las sobrescribe.
}

function fireCard(card: Card): void {
  card.classList.add('fired');
  card.classList.remove('attracting');
  card.style.transform = 'translate(0,0) scale(1.02)';
}

function unfireCard(card: Card): void {
  card.classList.remove('fired');
  card.style.transform = 'translate(0,0) scale(1)';
}

function processMouseMove(stage: Stage, cards: Card[], e: MouseEvent): void {
  const sr = stage.getBoundingClientRect();
  const mx = e.clientX - sr.left;
  const my = e.clientY - sr.top;

  // Priority 1: if there's a firedCard, check expanded bounds first
  if (firedCard) {
    const eb = getCurrentBounds(stage, firedCard);
    const insideExpanded =
      mx >= eb.left && mx <= eb.right && my >= eb.top && my <= eb.bottom;
    if (insideExpanded) {
      updateSpecular(firedCard, e);
      for (const c of cards) if (c !== firedCard) resetCard(c);
      return;
    }
    const z = getZone(firedCard);
    const d = Math.hypot(mx - z.cx, my - z.cy);
    if (d <= FIRE_EXIT) {
      updateSpecular(firedCard, e);
      for (const c of cards) if (c !== firedCard) resetCard(c);
      return;
    }
    unfireCard(firedCard);
    firedCard = null;
  }

  // Priority 2: pick winner from base zones
  let winner: { card: Card; dx: number; dy: number; d: number; z: ReturnType<typeof getZone> } | null = null;
  let winnerDist = Infinity;
  for (const c of cards) {
    const z = getZone(c);
    if (mx < z.left || mx > z.right || my < z.top || my > z.bottom) continue;
    const dx = mx - z.cx;
    const dy = my - z.cy;
    const d = Math.hypot(dx, dy);
    if (d < winnerDist) {
      winnerDist = d;
      winner = { card: c, dx, dy, d, z };
    }
  }

  for (const c of cards) if (!winner || c !== winner.card) resetCard(c);

  if (winner) {
    const { card, dx, dy, d, z } = winner;
    const b = bases.get(card)!;
    // Fire si el cursor está DENTRO del bounding box base de la card
    // (no por distance threshold — más intuitivo: hover sobre la card = fire).
    const insideBaseBox =
      mx >= b.left && mx <= b.left + b.w && my >= b.top && my <= b.top + b.h;
    if (insideBaseBox) {
      fireCard(card);
      firedCard = card;
    } else {
      card.classList.add('attracting');
      const maxDist = Math.max(z.right - z.cx, z.cx - z.left, z.bottom - z.cy, z.cy - z.top);
      const pullFactor = Math.max(0, 1 - d / maxDist);
      const pull = pullFactor * MAX_PULL;
      const len = Math.max(d, 1);
      const tx = (dx / len) * pull;
      const ty = (dy / len) * pull;
      card.style.transform = `translate(${tx}px, ${ty}px) scale(${1 + pullFactor * 0.02})`;
    }
    updateSpecular(card, e);
  }
}

function onMouseMove(stage: Stage, cards: Card[]) {
  return (e: MouseEvent) => {
    pendingEvent = e;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (pendingEvent) {
        processMouseMove(stage, cards, pendingEvent);
        pendingEvent = null;
      }
    });
  };
}

function onMouseLeave(cards: Card[]) {
  return () => {
    for (const c of cards) {
      c.style.transform = 'translate(0,0) scale(1)';
      c.classList.remove('attracting', 'fired');
      // NOTE: --rx/--ry se conservan para que el fade-out del shine respete
      // la última posición del cursor (no snap to center).
    }
    firedCard = null;
  };
}

function onTouchEnd(cards: Card[]) {
  return (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const tappedCard = target.closest('.mg-card') as Card | null;

    if (tappedCard && cards.includes(tappedCard)) {
      if (tappedCard === firedCard) {
        // segundo tap en card fired → deja que <a> navegue (no preventDefault)
        return;
      }
      e.preventDefault();
      if (firedCard) unfireCard(firedCard);
      fireCard(tappedCard);
      firedCard = tappedCard;
    } else {
      if (firedCard) {
        unfireCard(firedCard);
        firedCard = null;
      }
    }
  };
}

export function initMagneticCards(): void {
  const stage = document.getElementById('casos');
  if (!stage) return;
  const cards = Array.from(stage.querySelectorAll<HTMLElement>('.mg-card'));
  if (cards.length === 0) return;

  // Reset module state from any previous init (Astro view transitions re-call this)
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  pendingEvent = null;
  firedCard = null;
  bases.clear();

  cacheBases(stage, cards);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouch) {
    stage.addEventListener('touchend', onTouchEnd(cards), { passive: false });
  } else if (!reducedMotion) {
    stage.addEventListener('mousemove', onMouseMove(stage, cards));
    stage.addEventListener('mouseleave', onMouseLeave(cards));
  }

  // Keyboard accessibility: focus mirror del fired state
  for (const c of cards) {
    c.addEventListener('focusin', () => {
      if (firedCard && firedCard !== c) unfireCard(firedCard);
      fireCard(c);
      firedCard = c;
    });
    c.addEventListener('focusout', () => {
      if (firedCard === c) {
        unfireCard(c);
        firedCard = null;
      }
    });
  }

  resizeCleanup?.();
  const onResize = () => cacheBases(stage, cards);
  window.addEventListener('resize', onResize);
  resizeCleanup = () => window.removeEventListener('resize', onResize);
}
