// Reserve document scroll travel for reading the roles while the portrait holds.
export const EXPERIENCE_HOLD_TIME = 9.8;
export const EXPERIENCE_SCROLL_VH = 180;
export function experienceScroll(y, viewport, sequence) {
  const base = sequence.scrollVh * viewport / 100;
  const reading = EXPERIENCE_SCROLL_VH * viewport / 100;
  const start = (EXPERIENCE_HOLD_TIME - sequence.firstEnd) / (sequence.end - sequence.firstEnd) * base;
  const consumed = Math.max(0, Math.min(reading, y - start));
  return { videoY: y - consumed, base, progress: consumed / reading };
}
export function storyAnchorVh(time, sequence) {
  return (time - sequence.firstEnd) / (sequence.end - sequence.firstEnd) * sequence.scrollVh
    + (time > EXPERIENCE_HOLD_TIME ? EXPERIENCE_SCROLL_VH : 0);
}
