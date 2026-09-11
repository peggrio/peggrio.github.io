import { storyCues } from './story-cues.mjs';

// Video and text share continuous document progress, with no held video interval.
export function experienceScroll(y, viewport, sequence) {
  const base = sequence.scrollVh * viewport / 100;
  const time = sequence.firstEnd + Math.max(0, Math.min(1, y / base)) * (sequence.end - sequence.firstEnd);
  const cue = storyCues.find(item => item.id === 'experience');
  const start = cue.start + cue.fade;
  const end = cue.end - cue.fade;
  return { videoY: y, base, progress: Math.max(0, Math.min(1, (time - start) / (end - start))) };
}
export function storyAnchorVh(time, sequence) {
  return (time - sequence.firstEnd) / (sequence.end - sequence.firstEnd) * sequence.scrollVh;
}
