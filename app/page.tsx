'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, MoveHorizontal } from 'lucide-react';
import { createScrubber, createPortraitControls } from '../lib/scrubber.mjs';
import { sceneAtTime, storyCues } from '../lib/story-cues.mjs';
import { profile } from '../lib/profile';
import { experienceScroll, storyAnchorVh } from '../lib/experience-scroll.mjs';
import sequence from '../lib/video-sequence.json';
import { UndergraduateScene } from './undergraduate-scene';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const controlsRef = useRef<ReturnType<typeof createPortraitControls> | null>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [status, setStatus] = useState('loading');
  const [motionCueVisible, setMotionCueVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [storyActive, setStoryActive] = useState(false);
  const [sceneTime, setSceneTime] = useState(0);
  const scene = isScrolled ? sceneAtTime(sceneTime) : null;
  // The scrubber stops within the last frame, before the video's duration.
  const storyComplete = sceneTime >= sequence.end - 1 / sequence.fps;

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => {
      clearTimeout(fadeTimer);
      setMotionCueVisible(false);
    };
    const reveal = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || window.scrollY > 0) return;
      clearTimeout(fadeTimer);
      setMotionCueVisible(true);
      fadeTimer = setTimeout(hide, 700);
    };
    window.addEventListener('pointermove', reveal, { passive: true });
    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      clearTimeout(fadeTimer);
      window.removeEventListener('pointermove', reveal);
      window.removeEventListener('scroll', hide);
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  useLayoutEffect(() => {
    const cards = experienceRef.current;
    if (!cards) return;
    const position = () => { cards.scrollTop = readingProgress * Math.max(0, cards.scrollHeight - cards.clientHeight); };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(cards);
    Array.from(cards.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [readingProgress, scene?.id]);

  useEffect(() => {
    const video = videoRef.current!;
    const scrubber = createScrubber(video, {
      firstEnd: sequence.firstEnd,
      fps: sequence.fps,
      onReady: () => setStatus('ready'),
      onProgress: (fraction: number) => {
        const portraitEnd = sequence.firstEnd - 1 / sequence.fps;
        const portraitProgress = Math.max(0, Math.min(1, fraction * video.duration / portraitEnd));
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${portraitProgress})`;
      },
      // Update the overlay only after seeked, so it matches the decoded picture.
      onFrame: (time: number) => setSceneTime(time),
      onError: () => setStatus('error'),
    });
    const controls = createPortraitControls(scrubber, sequence);
    controlsRef.current = controls;
    const scroll = () => {
      const y = Math.max(0, window.scrollY);
      const timeline = experienceScroll(y, window.innerHeight, sequence);
      setReadingProgress(timeline.progress);
      setIsScrolled(controls.scroll(timeline.videoY, timeline.base));
      setStoryActive(y >= window.innerHeight * 0.65);
      if (heroRef.current) {
        const opacity = Math.max(0, 1 - y / (window.innerHeight * 0.65));
        heroRef.current.style.opacity = String(opacity);
        heroRef.current.inert = opacity === 0;
      }
    };
    let touchId: number | null = null;
    const reset = () => { controls.resetPointer(); touchId = null; };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.isPrimary) {
        touchId = e.pointerId;
        controls.resetPointer();
        controls.movePointer(e.clientX, window.innerWidth);
      }
    };
    const move = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType !== 'mouse' && e.pointerId !== touchId)) return;
      controls.movePointer(e.clientX, window.innerWidth);
    };
    const up = (e: PointerEvent) => { if (e.pointerType !== 'mouse') reset(); };
    const leave = (e: PointerEvent) => { if (!e.relatedTarget) reset(); };
    const visibility = () => { reset(); video.pause(); };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    scroll();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', reset);
    window.addEventListener('pointerout', leave);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      scrubber.destroy(); controlsRef.current = null;
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', scroll);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', reset);
      window.removeEventListener('pointerout', leave);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return <>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className={`site-header${storyActive ? ' site-header--story' : ''}`}>
      <a href="#home" className="wordmark" aria-label="PL Inspolab — Home">{profile.monogram}<span className="mark-dot" aria-hidden="true" /></a>
      <nav aria-label="Primary">
        <a href="#publications" aria-current={scene?.id === 'publications' ? 'location' : undefined}>Undergraduate</a>
        <a href="#education" aria-current={scene?.id === 'education' ? 'location' : undefined}>Graduate</a>
        <a href="#experience" aria-current={scene?.id === 'experience' ? 'location' : undefined} className="contact-link">Experience <ArrowUpRight size={16} aria-hidden="true" /></a>
        <a href="#contact" aria-current={scene?.id === 'contact' ? 'location' : undefined}>Contact</a>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <div className="portrait" aria-hidden="true">
      <video ref={videoRef} src="/portrait-interactive.mp4?v=6-soft-join" poster="/portrait-poster.jpg" preload="auto" muted playsInline autoPlay={false} disablePictureInPicture controls={false} />
      <div className="portrait-shade" />
      </div>
    <section ref={heroRef} className="hero" id="home" aria-label="Interactive portrait. Use the left and right arrow keys to turn the portrait." tabIndex={0} onKeyDown={e => {
      if (e.target !== e.currentTarget || window.scrollY > 0) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); controlsRef.current?.moveBy(e.key === 'ArrowRight' ? 40 : -40, window.innerWidth);
      }
    }}>
      <div className="hero-content">
        <div className="hero-title"><p className="eyebrow">HELLO, I’M</p><h1>{profile.name}</h1><p className="role">{profile.role}</p><p className="specialization">{profile.specialization}</p><ul className="tech-stack" aria-label="Core technology stack">{profile.techStack.map(technology => <li key={technology}>{technology}</li>)}</ul></div>
        <aside className="hero-note current-work" aria-labelledby="current-work-heading">
          <p className="section-kicker">CURRENTLY / SOFTWARE ENGINEER</p>
          <h2 id="current-work-heading">Databricks &amp;<br />AI agent orchestration.</h2>
          <p className="current-organization">{profile.currentWork.organization}</p>
          <p className="current-summary">{profile.currentWork.summary}</p>
          <a href="#experience">Explore my experience <ArrowDown size={17} aria-hidden="true" /></a>
        </aside>
      </div>
      <footer className="hero-footer">
        <a href="#publications" className="discover">Scroll to explore <ArrowDown size={15} aria-hidden="true" /></a>
        <div className={`motion-cue${motionCueVisible ? ' motion-cue--visible' : ''}`}><MoveHorizontal size={21} strokeWidth={1.3} aria-hidden="true" /><span role="status" aria-live="polite">{status === 'loading' ? 'Preparing your portrait' : status === 'error' ? 'Video unavailable · Static portrait' : 'Move left or right to turn the portrait'}</span></div>
      </footer>
    </section>

    {/* Anchor positions share the same scroll-to-time mapping as the video. */}
    <div className="story-track" style={{ height: `${sequence.scrollVh}vh` }} aria-hidden="true" />
    {storyCues.map(cue => <div key={cue.id} id={cue.id} className="story-anchor" style={{ top: `${storyAnchorVh(cue.anchor, sequence)}vh` }} />)}

    <div className="story-overlay" data-scene={scene?.id ?? 'none'}>
      {scene && <section className={`scene scene-${scene.id}`} aria-labelledby={`${scene.id}-heading`} style={{ opacity: scene.opacity, transform: scene.id === 'publications' ? 'none' : `translateY(${scene.offset}px)` }}>
        {scene.id === 'publications' && <UndergraduateScene time={sceneTime} offset={scene.offset} />}
        {scene.id === 'education' && <div className="scene-panel education-panel">
          <p className="section-kicker">02 / GRADUATE EDUCATION</p>
          <p className="graduation-date">CLASS OF 2024 <span>↗</span></p>
          <h2 id="education-heading">{profile.graduate.university}</h2>
          <div className="degree"><p>{profile.graduate.degree}</p><h3>{profile.graduate.program}</h3></div>
          <p className="graduated">Graduated <time dateTime={profile.graduate.date}>{profile.graduate.graduated}</time></p>
          <div className="graduate-courses"><p className="section-kicker">MAIN COURSES</p><p>{profile.graduate.courses.join(' · ')}</p></div>
          <article className="ta-experience"><div><span>TEACHING ASSISTANT</span><time>{profile.graduate.teachingAssistant.period}</time></div><h3>{profile.graduate.teachingAssistant.course}</h3><p className="ta-location">{profile.graduate.teachingAssistant.location}</p><p>{profile.graduate.teachingAssistant.description}</p></article>
        </div>}
        {scene.id === 'experience' && <div className="experience-layout">
          <div className="experience-heading"><p className="section-kicker">03 / EXPERIENCE</p><h2 id="experience-heading">Building what’s next.</h2></div>
          <div ref={experienceRef} className="experience-cards" role="region" aria-label="Work experience entries. Continue scrolling the page to read all three roles.">{profile.experience.map(item => <article className="scene-panel experience-panel" key={item.id}>
            <div className="experience-meta"><span>EXPERIENCE {item.id}</span><time>{item.period}</time></div>
            <h3>{item.title}</h3>
            <p className="organization">{item.organization}</p>
            <p className="experience-location">{item.location}</p>
            <p className="experience-description">{item.description}</p>
          </article>)}</div>
        </div>}
        {scene.id === 'contact' && <div className="scene-panel contact-panel">
          <p className="section-kicker">04 / CONTACT</p>
          <h2 id="contact-heading">Let’s connect.</h2>
          <p className="contact-intro">Find me on LinkedIn and X.</p>
          <div className="contact-socials">
            <a href="https://www.linkedin.com/in/peizhenliao/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={20} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
            <a href="https://x.com/aprilsandrqlr" target="_blank" rel="noopener noreferrer">X / Twitter <ArrowUpRight size={20} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>}
      </section>}
    </div>
    {storyActive && scene?.id !== 'experience' && scene?.id !== 'contact' && <p className="story-scroll-hint"><ArrowDown size={14} aria-hidden="true" /> Scroll to move through the story</p>}
    <div className="film-progress" hidden={isScrolled} aria-hidden="true"><span ref={progressRef} /></div>
    </main>
    {storyActive && storyComplete && <footer className="site-footer">
      <p><strong>Peizhen Liao</strong><span>Software Engineer · Full Stack / Site Reliability Engineering</span></p>
      <nav aria-label="Footer"><a href="#publications">Undergraduate</a><a href="#education">Graduate</a>{profile.email && <a href={`mailto:${profile.email}`}>Email</a>}</nav>
      <p><span>© 2026 Peizhen Liao</span><a href="#home">Back to top <span aria-hidden="true">↑</span></a></p>
    </footer>}
  </>;
}
