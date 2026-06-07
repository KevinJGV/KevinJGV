// Constraints for the hexagonal tech honeycomb in HomeTechs.
// Used both server-side (initial render in HomeTechs.astro frontmatter) and
// client-side (re-shuffle on astro:page-load).

export const TECH_PER_LOCKED = 1.4;
export const MAX_CONSECUTIVE_TECH = 3;
export const MAX_CONSECUTIVE_LOCKED = 2;

export function computeLockedCount(techCount: number): number {
  return Math.round(techCount / TECH_PER_LOCKED);
}

/**
 * Random sequence of length techCount + lockedCount.
 * `true` = locked slot, `false` = tech slot.
 * Respects max-consecutive caps. Greedy with restart-on-stuck.
 * Returns null if no valid arrangement is found within MAX_ATTEMPTS
 * (caller can fall back to existing order).
 */
export function generateLayout(
  techCount: number,
  lockedCount: number
): boolean[] | null {
  const MAX_ATTEMPTS = 500;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result: boolean[] = [];
    let techRem = techCount;
    let lockedRem = lockedCount;
    let last: boolean | null = null;
    let run = 0;
    let stuck = false;
    while (techRem > 0 || lockedRem > 0) {
      const canTech =
        techRem > 0 && (last !== false || run < MAX_CONSECUTIVE_TECH);
      const canLocked =
        lockedRem > 0 && (last !== true || run < MAX_CONSECUTIVE_LOCKED);
      let pickLocked: boolean;
      if (canTech && canLocked) {
        pickLocked = Math.random() >= techRem / (techRem + lockedRem);
      } else if (canTech) {
        pickLocked = false;
      } else if (canLocked) {
        pickLocked = true;
      } else {
        stuck = true;
        break;
      }
      result.push(pickLocked);
      if (pickLocked) {
        lockedRem--;
        run = last === true ? run + 1 : 1;
      } else {
        techRem--;
        run = last === false ? run + 1 : 1;
      }
      last = pickLocked;
    }
    if (!stuck) return result;
  }
  return null;
}

export function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
