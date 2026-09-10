import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneAtTime, storyCues, cueScrollProgress } from '../lib/story-cues.mjs';
import { scrollTime } from '../lib/scrubber.mjs';

test('overlays match papers, graduation, and laptop frames in either direction', () => {
  const samples = [
    [2, null], [4.5, null], [5.5, 'publications'], [6.8, 'publications'],
    [7.1, null], [8.15, 'education'], [9.05, null], [9.7, 'experience'],
  ];
  for (const [time, id] of [...samples, ...samples.toReversed()]) {
    assert.equal(sceneAtTime(time)?.id ?? null, id);
  }
  assert.equal(sceneAtTime(10.25 - 1 / 24).opacity, 1, 'work stays visible on the final paused frame');
  assert.equal(sceneAtTime(6.95), null, 'publication titles leave before the graduation transition');
  assert.equal(sceneAtTime(8.95), null, 'education leaves before the laptop transition');
});

test('text travels upward with the frame and navigation lands on fully visible cues', () => {
  for (const cue of storyCues) {
    const maxScroll = 5400;
    const y = cueScrollProgress(cue.id, 4, 10.25) * maxScroll;
    const scene = sceneAtTime(scrollTime(y, maxScroll, 4, 10.25));
    assert.equal(scene.id, cue.id);
    assert.equal(scene.opacity, 1);
    assert.ok(sceneAtTime(cue.start + 0.1).offset > sceneAtTime(cue.end - 0.1).offset);
  }
});
