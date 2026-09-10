'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, MoveHorizontal } from 'lucide-react';
import { createScrubber, createPortraitControls } from '../lib/scrubber.mjs';
import { sceneAtTime, storyCues, cueScrollProgress } from '../lib/story-cues.mjs';
import { profile } from '../lib/profile';
import sequence from '../lib/video-sequence.json';
import { UndergraduateScene } from './undergraduate-scene';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const controlsRef = useRef<ReturnType<typeof createPortraitControls> | null>(null);
  const [status, setStatus] = useState('loading');
  const [isScrolled, setIsScrolled] = useState(false);
  const [storyActive, setStoryActive] = useState(false);
  const [sceneTime, setSceneTime] = useState(0);
  const scene = isScrolled ? sceneAtTime(sceneTime) : null;

  useEffect(() => {
    const video = videoRef.current!;
    const scrubber = createScrubber(video, {
      firstEnd: sequence.firstEnd,
      fps: sequence.fps,
      onReady: () => setStatus('ready'),
      onProgress: (fraction: number) => {
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${fraction})`;
      },
      // Update the overlay only after seeked, so it matches the decoded picture.
      onFrame: (time: number) => setSceneTime(time),
      onError: () => setStatus('error'),
    });
    const controls = createPortraitControls(scrubber, sequence);
    controlsRef.current = controls;
    const scroll = () => {
      const y = Math.max(0, window.scrollY);
      setIsScrolled(controls.scroll(y, document.documentElement.scrollHeight - window.innerHeight));
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
      <a href="#home" className="wordmark" aria-label="Peizhen Liao — Home">{profile.monogram}<span className="mark-dot" aria-hidden="true" /></a>
      <span className="header-caption" aria-hidden="true">A PERSONAL PORTRAIT</span>
      <nav aria-label="Primary">
        <a href="#publications" aria-current={scene?.id === 'publications' ? 'location' : undefined}>Undergraduate</a>
        <a href="#education" aria-current={scene?.id === 'education' ? 'location' : undefined}>Graduate</a>
        <a href="#experience" aria-current={scene?.id === 'experience' ? 'location' : undefined} className="contact-link">Experience <ArrowUpRight size={16} aria-hidden="true" /></a>
      </nav>
    </header>
    <main id="main-content" tabIndex={-1}>
      <div className="portrait" aria-hidden="true">
      <video ref={videoRef} src="/portrait-interactive.mp4" poster="/portrait-poster.jpg" preload="auto" muted playsInline autoPlay={false} disablePictureInPicture controls={false} />
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
        <div className="hero-note"><span className="note-symbol">✳</span><p>From interface<br />to infrastructure.</p><a href="#publications">Explore my story <ArrowDown size={17} /></a></div>
      </div>
      <footer className="hero-footer">
        <a href="#publications" className="discover">Scroll to explore <ArrowDown size={15} aria-hidden="true" /></a>
        <div className="motion-cue"><MoveHorizontal size={21} strokeWidth={1.3} aria-hidden="true" /><span role="status" aria-live="polite">{status === 'loading' ? 'Preparing your portrait' : status === 'error' ? 'Video unavailable · Static portrait' : 'Move left or right to turn the portrait'}</span></div>
        <span className="frame-label">INTERACTIVE PORTRAIT <span>01 / 04</span></span>
      </footer>
    </section>

    {/* Anchor positions share the same scroll-to-time mapping as the video. */}
    <div className="story-track" aria-hidden="true" />
    {storyCues.map(cue => <div key={cue.id} id={cue.id} className="story-anchor" style={{ top: `${cueScrollProgress(cue.id, sequence.firstEnd, sequence.end) * 540}svh` }} />)}

    <div className="story-overlay" data-scene={scene?.id ?? 'none'}>
      {scene && <section className={`scene scene-${scene.id}`} aria-labelledby={`${scene.id}-heading`} style={{ opacity: scene.opacity, transform: scene.id === 'publications' ? 'none' : `translateY(${scene.offset}px)` }}>
        {scene.id === 'publications' && <UndergraduateScene time={sceneTime} offset={scene.offset} />}
        {scene.id === 'education' && <div className="scene-panel education-panel">
          <p className="section-kicker">02 / GRADUATE EDUCATION</p>
          <p className="graduation-date">CLASS OF 2024 <span>↗</span></p>
          <h2 id="education-heading">{profile.graduate.university}</h2>
          <div className="degree"><p>{profile.graduate.degree}</p><h3>{profile.graduate.program}</h3></div>
          <p className="graduated">Graduated <time dateTime={profile.graduate.date}>{profile.graduate.graduated}</time></p>
          <article className="ta-experience"><div><span>TEACHING ASSISTANT</span><time>{profile.graduate.teachingAssistant.period}</time></div><h3>{profile.graduate.teachingAssistant.course}</h3><p className="ta-location">{profile.graduate.teachingAssistant.location}</p><p>{profile.graduate.teachingAssistant.description}</p></article>
        </div>}
        {scene.id === 'experience' && <div className="experience-layout">
          <div className="experience-heading"><p className="section-kicker">03 / EXPERIENCE</p><h2 id="experience-heading">Building what’s next.</h2></div>
          <div className="experience-cards" tabIndex={0} role="region" aria-label="Work experience entries. Scroll to read all three roles.">{profile.experience.map(item => <article className="scene-panel experience-panel" key={item.id}>
            <div className="experience-meta"><span>EXPERIENCE {item.id}</span><time>{item.period}</time></div>
            <h3>{item.title}</h3>
            <p className="organization">{item.href ? <a href={item.href} target="_blank" rel="noreferrer">{item.organization}<ArrowUpRight size={13} aria-hidden="true" /></a> : item.organization}</p>
            <p className="experience-location">{item.location}</p>
            <p className="experience-description">{item.description}</p>
          </article>)}</div>
        </div>}
      </section>}
    </div>
    {storyActive && scene?.id !== 'experience' && <p className="story-scroll-hint"><ArrowDown size={14} aria-hidden="true" /> Scroll to move through the story</p>}
    <div className="film-progress" aria-hidden="true"><span ref={progressRef} /></div>
    </main>
    {storyActive && scene?.id === 'experience' && <footer className="site-footer">
      <p><strong>Peizhen Liao</strong><span>Software Engineer · Full Stack / Site Reliability Engineering</span></p>
      <nav aria-label="Footer"><a href="#publications">Undergraduate</a><a href="#education">Graduate</a>{profile.email && <a href={`mailto:${profile.email}`}>Email</a>}</nav>
      <p><span>© 2026 Peizhen Liao</span><a href="#home">Back to top <span aria-hidden="true">↑</span></a></p>
    </footer>}
  </>;
}
