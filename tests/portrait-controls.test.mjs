import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrubber, createPortraitControls, scrollTime } from '../lib/scrubber.mjs';

function fixture({ loaded = true, onFrame = () => {}, onProgress = () => {} } = {}) {
  const callbacks = new Map();
  let next = 0;
  globalThis.requestAnimationFrame = fn => { callbacks.set(++next, fn); return next; };
  globalThis.cancelAnimationFrame = id => callbacks.delete(id);
  class Video extends EventTarget {
    duration = 10.25; readyState = loaded ? 4 : 0; seeking = false;
    paused = false; autoplay = true; time = 0; writes = [];
    pause() { this.paused = true; }
    get currentTime() { return this.time; }
    set currentTime(value) {
      assert.equal(this.seeking, false, 'seeks must never interrupt one another');
      this.time = value; this.writes.push(value); this.seeking = true;
    }
    finish() { this.seeking = false; this.dispatchEvent(new Event('seeked')); }
  }
  const video = new Video();
  const scrubber = createScrubber(video, { firstEnd: 4, fps: 24, onFrame, onProgress });
  const controls = createPortraitControls(scrubber, { firstEnd: 4, end: 10.25 });
  const flush = () => { const current = [...callbacks.values()]; callbacks.clear(); current.forEach(fn => fn()); };
  const settle = () => { flush(); if (video.seeking) video.finish(); flush(); };
  return { video, scrubber, controls, flush, settle };
}

test('paused initialization and 0.8 relative sensitivity; ignore duplicate frame seeks', () => {
  const { video, scrubber, settle } = fixture();
  settle();
  assert.equal(video.paused, true);
  assert.equal(video.autoplay, false);
  assert.equal(Math.floor(video.currentTime * 24), 48);
  scrubber.move(100, 1000); settle();
  assert.ok(Math.abs(scrubber.getTarget() - 2.32) < 1e-9);
  assert.equal(Math.floor(video.currentTime * 24), Math.floor(2.32 * 24));
  const count = video.writes.length;
  // Three small inputs remain inside frame 55, and must not cause more decoding.
  for (let i = 0; i < 3; i++) { scrubber.move(1, 1000); settle(); }
  assert.equal(video.writes.length, count);
  // The accumulated subframe distances must still eventually reach a new frame.
  scrubber.move(4, 1000); settle();
  assert.equal(video.writes.length, count + 1);
  video.paused = false; video.dispatchEvent(new Event('play'));
  assert.equal(video.paused, true);
  scrubber.destroy();
});

test('rapid direction changes retain relative displacement while awaiting seeked', () => {
  const { video, scrubber, flush, settle } = fixture();
  settle();
  scrubber.move(100, 1000); flush();
  const count = video.writes.length;
  scrubber.move(200, 1000); scrubber.move(-400, 1000); flush();
  assert.equal(video.writes.length, count, 'new input waits for decode');
  assert.ok(Math.abs(scrubber.getTarget() - 1.68) < 1e-9);
  video.finish(); settle();
  assert.equal(video.writes.length, count + 1, 'decode only latest frame, no stale backlog');
  assert.equal(Math.floor(video.currentTime * 24), Math.floor(1.68 * 24));
  scrubber.move(10000, 1000); settle();
  assert.ok(video.currentTime < 4, 'horizontal movement cannot enter clip 2');
  scrubber.move(-20, 1000); settle();
  assert.ok(video.currentTime < 3.95, 'reverse immediately at the edge');
  scrubber.destroy();
});

test('progress tracks every relative input immediately and stale seeks never rewind it', () => {
  const progress = [];
  const { video, scrubber, flush, settle } = fixture({ onProgress: p => progress.push(p) });
  settle();
  scrubber.move(100, 1000); flush();
  scrubber.move(-50, 1000);
  scrubber.move(1, 1000);
  const latest = progress.at(-1);
  assert.ok(Math.abs(latest * video.duration - 2.1632) < 1e-9);
  const writes = video.writes.length;
  video.finish();
  assert.equal(progress.at(-1), latest, 'old decoded target cannot move the progress bar');
  assert.equal(video.writes.length, writes + 1, 'seeked immediately dispatches the latest target');
  settle();
  scrubber.destroy();
});

test('axes stay independent; return to the portrait without a cursor jump', () => {
  const { video, scrubber, controls, settle } = fixture();
  settle();
  controls.movePointer(300, 1000); settle();
  assert.equal(scrubber.getTarget(), 2, 'first position is a baseline');
  controls.movePointer(400, 1000); settle();
  const portrait = scrubber.getTarget();
  const count = video.writes.length;
  controls.movePointer(400, 1000); settle();
  assert.equal(video.writes.length, count, 'vertical-only mouse movement stays on same frame');
  controls.scroll(1, 3000); settle();
  assert.ok(video.currentTime >= 4, 'vertical scrolling goes directly to clip 2');
  controls.movePointer(900, 1000); controls.moveBy(-500, 1000); settle();
  assert.ok(video.currentTime >= 4, 'horizontal movement cannot override scroll mode');
  controls.scroll(1600, 3000); settle();
  assert.ok(video.currentTime > 6.9583, 'continue into clip 3');
  controls.scroll(400, 3000); settle();
  assert.ok(video.currentTime > 4 && video.currentTime < 6.9583, 'scroll upward reverses');
  controls.scroll(0, 3000); settle();
  assert.equal(scrubber.getTarget(), portrait, 'restore independent portrait time');
  controls.movePointer(100, 1000); settle();
  assert.equal(scrubber.getTarget(), portrait, 'mode switch resets relative baseline');
  controls.movePointer(150, 1000); settle();
  assert.ok(Math.abs(scrubber.getTarget() - portrait - 0.16) < 1e-9);
  controls.resetPointer(); controls.movePointer(900, 1000); settle();
  assert.ok(Math.abs(scrubber.getTarget() - portrait - 0.16) < 1e-9);
  scrubber.destroy();
});

test('scroll restored before metadata loads still selects the right clip; teardown cancels work', () => {
  const { video, scrubber, controls, flush, settle } = fixture({ loaded: false });
  controls.scroll(2000, 3000);
  video.readyState = 4; video.dispatchEvent(new Event('loadedmetadata')); settle();
  assert.ok(video.currentTime > 6.9583);
  const count = video.writes.length;
  scrubber.setTime(5); scrubber.destroy(); flush();
  assert.equal(video.writes.length, count);
  assert.equal(video.paused, true);
});

test('vertical timeline clamps within clips 2 and 3', () => {
  assert.equal(scrollTime(-10, 3000, 4, 10.25), 4);
  assert.equal(scrollTime(3000, 3000, 4, 10.25), 10.25);
  assert.equal(scrollTime(4000, 3000, 4, 10.25), 10.25);
  assert.ok(scrollTime(1, 3000, 4, 10.25) >= 4);
});

test('scene callbacks report decoded frames, never a pending seek target', () => {
  const frames = [];
  const { video, scrubber, flush, settle } = fixture({ onFrame: time => frames.push(time) });
  assert.deepEqual(frames, [], 'metadata does not show an unrendered scene');
  settle();
  const initial = [...frames];
  scrubber.setTime(5.6); flush();
  scrubber.setTime(8.2); flush();
  assert.deepEqual(frames, initial, 'overlays wait while the decoder is seeking');
  video.finish();
  assert.ok(frames.at(-1) > 5.5 && frames.at(-1) < 5.7);
  settle();
  assert.ok(frames.at(-1) > 8.1 && frames.at(-1) < 8.3);
  scrubber.destroy();
});
