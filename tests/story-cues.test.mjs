import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneAtTime, storyCues, cueScrollProgress } from '../lib/story-cues.mjs';
import { scrollTime } from '../lib/scrubber.mjs';

test('overlays match papers, graduation, and laptop frames in either direction', () => {
  const samples = [
    [2, null], [4.5, null], [5.5, 'publications'], [6.8, 'publications'],
    [7.1, null], [8.15, 'education'], [9.05, null], [9.7, 'experience'], [10.24, 'experience'], [10.5, null], [12.2, null], [12.75, 'contact'], [14.25, 'contact'],
  ];
  for (const [time, id] of [...samples, ...samples.toReversed()]) {
    assert.equal(sceneAtTime(time)?.id ?? null, id);
  }
  assert.equal(sceneAtTime(343 / 24 - 1 / 24).opacity, 1, 'contact stays visible on the final paused frame');
  assert.equal(sceneAtTime(10.25), null, 'v6 begins without contact text');
  assert.equal(sceneAtTime(12.25).opacity, 0, 'contact begins fading upward two seconds into v6');
  assert.equal(sceneAtTime(12.75).opacity, 1, 'contact is fully visible after its entrance');
  assert.equal(sceneAtTime(6.95), null, 'publication titles leave before the graduation transition');
  assert.equal(sceneAtTime(8.95), null, 'education leaves before the laptop transition');
});

test('text travels upward with the frame and navigation lands on fully visible cues', () => {
  for (const cue of storyCues) {
    const maxScroll = 5400;
    const y = cueScrollProgress(cue.id, 4, 343 / 24) * maxScroll;
    const scene = sceneAtTime(scrollTime(y, maxScroll, 4, 343 / 24));
    assert.equal(scene.id, cue.id);
    assert.equal(scene.opacity, 1);
    assert.ok(sceneAtTime(cue.start + 0.1).offset > sceneAtTime(cue.end - 0.1).offset);
  }
});
