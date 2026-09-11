// Cue times were checked against frames in the assembled portrait-interactive.mp4.
export const storyCues = [
  { id: 'publications', start: 5.0, end: 6.95, anchor: 5.65, fade: 0.2 },
  { id: 'education', start: 7.65, end: 8.95, anchor: 8.15, fade: 0.16 },
  { id: 'experience', start: 9.2, end: 10.25, anchor: 9.37, fade: 0.16 },
  { id: 'contact', start: 12.25, end: 343 / 24, anchor: 12.85, fade: 0.45, hold: true },
];

export function sceneAtTime(time) {
  const cue = storyCues.find(item => time >= item.start && (time < item.end || (item.hold && time <= item.end)));
  if (!cue) return null;
  const progress = Math.min(1, Math.max(0, (time - cue.start) / (cue.end - cue.start)));
  const opacity = Math.min(1, (time - cue.start) / cue.fade, cue.hold ? 1 : (cue.end - time) / cue.fade);
  return { id: cue.id, opacity, offset: cue.id === 'contact' ? 64 - progress * 92 : 28 - progress * 56 };
}

export function cueScrollProgress(id, firstEnd, end) {
  const cue = storyCues.find(item => item.id === id);
  return cue ? (cue.anchor - firstEnd) / (end - firstEnd) : 0;
}
