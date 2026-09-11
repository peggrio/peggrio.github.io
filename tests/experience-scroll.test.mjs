import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceScroll, storyAnchorVh } from '../lib/experience-scroll.mjs';
import { scrollTime } from '../lib/scrubber.mjs';
const sequence = { firstEnd:4, end:343/24, scrollVh:889.2 };
test('video advances while roles scroll, completes text before v6, and reverses continuously', () => {
  for (const viewport of [600, 1000]) {
    const startTime = 9.36;
    const endTime = 10.09;
    const start = storyAnchorVh(startTime, sequence) * viewport / 100;
    const travel = (storyAnchorVh(endTime, sequence) - storyAnchorVh(startTime, sequence)) * viewport / 100;
    for (const p of [0, .25, .75, 1, .75, .25, 0]) {
      const state = experienceScroll(start + travel*p, viewport, sequence);
      assert.ok(Math.abs(state.progress-p) < 1e-9);
      assert.ok(Math.abs(scrollTime(state.videoY,state.base,4,sequence.end)-(startTime + p * (endTime-startTime))) < 1e-9);
    }
    const contact = experienceScroll(storyAnchorVh(10.25, sequence)*viewport/100, viewport, sequence);
    assert.equal(contact.progress, 1);
    assert.ok(Math.abs(scrollTime(contact.videoY,contact.base,4,sequence.end)-10.25) < 1e-9);
    const finish = experienceScroll(sequence.scrollVh*viewport/100,viewport,sequence);
    assert.equal(scrollTime(finish.videoY,finish.base,4,sequence.end),sequence.end);
  }
});
