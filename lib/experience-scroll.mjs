import { storyCues } from './story-cues.mjs';

// Give the three roles extra reading distance while the video keeps advancing.
const readingVh = 240;
const cue = storyCues.find(item => item.id === 'experience');
const start = cue.start + cue.fade;
const end = cue.end - cue.fade;
const clamp = value => Math.max(0, Math.min(1, value));
export const storyScrollVh = sequence => sequence.scrollVh + readingVh;

export function experienceScroll(y, viewport, sequence) {
  const base = sequence.scrollVh * viewport / 100;
  const startY = storyAnchorVh(start, sequence) * viewport / 100;
  const endY = storyAnchorVh(end, sequence) * viewport / 100;
  const progress = clamp((y - startY) / (endY - startY));
  return { videoY: Math.max(0, y - progress * readingVh * viewport / 100), base, progress };
}
export function storyAnchorVh(time, sequence) {
  const baseVh = (time - sequence.firstEnd) / (sequence.end - sequence.firstEnd) * sequence.scrollVh;
  return baseVh + clamp((time - start) / (end - start)) * readingVh;
}
