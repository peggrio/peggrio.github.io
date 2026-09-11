/** Relative pointer movement traverses 80% of the first clip per viewport. */
export const SENSITIVITY = 0.8;
export function scrollTime(scrollY, maxScroll, firstEnd, end) {
  const progress = Math.min(1, Math.max(0, scrollY) / Math.max(1, maxScroll));
  // Vertical input never traverses the first clip.
  return firstEnd + (end - firstEnd) * progress;
}
export function createScrubber(video, { firstEnd = Infinity, fps = 24, onReady = () => {}, onProgress = (_fraction) => {}, onFrame = (_time) => {}, onError = () => {} } = {}) {
  let target = 0, limit = 0, ready = false, busy = false, destroyed = false, frame = 0, pendingTime = null;
  let pointerEnd = 0, lastFrame = -1, requestedFrame = -1, announcedReady = false;
  const pause = () => video.pause();
  const frameIndex = time => Math.min(Math.ceil(video.duration * fps) - 1, Math.floor(time * fps + 1e-6));
  const reportReady = () => {
    if (!announcedReady) { announcedReady = true; onReady(); }
  };
  const seek = () => {
    frame = 0;
    if (destroyed || !ready || busy || video.seeking) return;
    const next = frameIndex(target);
    // Keep subframe relative deltas in target, but never decode the same frame twice.
    if (next === lastFrame) return;
    requestedFrame = next;
    busy = true; pause();
    // Seek inside the frame to avoid floating point rounding onto its predecessor.
    try { video.currentTime = Math.min(video.duration - 0.0001, (next + 0.5) / fps); }
    catch { busy = false; ready = false; onError(); }
  };
  const schedule = () => { if (!frame && !busy && !destroyed) frame = requestAnimationFrame(seek); };
  const metadata = () => {
    if (ready || !Number.isFinite(video.duration) || video.duration <= 0) return;
    pause(); limit = Math.max(0, video.duration - 1 / fps);
    pointerEnd = Math.min(firstEnd, video.duration);
    target = Math.min(limit, Math.max(0, pendingTime ?? pointerEnd / 2)); ready = true;
    onProgress(target / video.duration); schedule();
  };
  const seeked = () => {
    if (destroyed || !ready) return;
    lastFrame = requestedFrame;
    busy = false; pause(); onFrame(video.currentTime); reportReady();
    // Only seeked releases a pending target; pointer/scroll input never interrupts decoding.
    seek();
  };
  const error = () => { ready = false; busy = false; onError(); };
  video.autoplay = false; pause();
  video.addEventListener('play', pause);
  video.addEventListener('loadedmetadata', metadata);
  video.addEventListener('loadeddata', metadata);
  video.addEventListener('seeked', seeked);
  video.addEventListener('error', error);
  if (video.readyState >= 1) metadata();
  return {
    getTarget() { return ready ? target : (pendingTime ?? (Number.isFinite(firstEnd) ? firstEnd / 2 : 0)); },
    setTime(time) {
      if (destroyed || !Number.isFinite(time)) return;
      pendingTime = time;
      if (!ready) return;
      target = Math.min(limit, Math.max(0, time)); onProgress(target / video.duration); schedule();
    },
    move(deltaX, viewportWidth) {
      if (!ready || destroyed || !Number.isFinite(deltaX) || !Number.isFinite(viewportWidth) || viewportWidth <= 0 || deltaX === 0) return;
      target = Math.min(Math.max(0, pointerEnd - 1 / fps), Math.max(0, target + deltaX / viewportWidth * pointerEnd * SENSITIVITY));
      onProgress(target / video.duration);
      schedule();
    },
    destroy() {
      destroyed = true; cancelAnimationFrame(frame); pause();
      video.removeEventListener('play', pause);
      video.removeEventListener('loadedmetadata', metadata);
      video.removeEventListener('loadeddata', metadata);
      video.removeEventListener('seeked', seeked);
      video.removeEventListener('error', error);
    },
  };
}

/** Keep horizontal portrait state independent from vertical story progress. */
export function createPortraitControls(scrubber, { firstEnd, end }) {
  let previousX = null;
  let scrolling = false;
  let portraitTime = firstEnd / 2;
  return {
    movePointer(x, viewportWidth) {
      if (scrolling) return;
      if (previousX !== null) scrubber.move(x - previousX, viewportWidth);
      previousX = x;
    },
    moveBy(deltaX, viewportWidth) {
      if (!scrolling) scrubber.move(deltaX, viewportWidth);
    },
    resetPointer() { previousX = null; },
    scroll(y, maxScroll) {
      const nextScrolling = y > 0;
      if (nextScrolling !== scrolling) {
        previousX = null;
        if (nextScrolling) portraitTime = scrubber.getTarget();
        else scrubber.setTime(portraitTime);
        scrolling = nextScrolling;
      }
      if (scrolling) scrubber.setTime(scrollTime(y, maxScroll, firstEnd, end));
      return scrolling;
    },
  };
}
