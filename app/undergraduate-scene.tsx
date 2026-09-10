import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { profile } from '../lib/profile';

type Connection = { x: number; y: number; targetX: number; targetY: number; visible: boolean };

// Individual points on the four papers in the source frame (before object-fit cropping).
const paperPoints = [[0.43, 0.82], [0.49, 0.76], [0.535, 0.9], [0.595, 0.86]];

export function UndergraduateScene({ time, offset }: { time: number; offset: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLLIElement | null)[]>([]);
  const [geometry, setGeometry] = useState<{ width: number; height: number; connections: Connection[] }>({ width: 1, height: 1, connections: [] });

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const layout = layoutRef.current!;
    const measure = () => {
      const rect = root.getBoundingClientRect();
      const video = document.querySelector('video');
      if (!video) return;
      const scale = Math.max(rect.width / (video.videoWidth || 1600), rect.height / (video.videoHeight || 900));
      const videoWidth = (video.videoWidth || 1600) * scale;
      const videoHeight = (video.videoHeight || 900) * scale;
      const position = getComputedStyle(video).objectPosition.split(' ').map(parseFloat);
      const cropX = (rect.width - videoWidth) * (position[0] / 100);
      const cropY = (rect.height - videoHeight) * (position[1] / 100);
      const bounds = layout.getBoundingClientRect();
      const compact = rect.width <= 900 || rect.height <= 600;
      const connections = cardsRef.current.map((card, i) => {
        const box = card!.getBoundingClientRect();
        const left = compact || i % 2 === 1;
        return {
          x: Math.min(rect.width - 12, Math.max(12, paperPoints[i][0] * videoWidth + cropX)),
          y: Math.min(rect.height - 12, paperPoints[i][1] * videoHeight + cropY),
          targetX: (left ? box.left : box.right) - rect.left,
          targetY: box.top - rect.top + Math.min(40, box.height / 2),
          visible: box.top + Math.min(40, box.height / 2) >= bounds.top && box.top + Math.min(40, box.height / 2) <= bounds.bottom,
        };
      });
      setGeometry({ width: rect.width, height: rect.height, connections });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(layout);
    cardsRef.current.forEach(card => card && observer.observe(card));
    layout.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => { observer.disconnect(); layout.removeEventListener('scroll', measure); };
  }, []);

  const motion = (index: number) => {
    const progress = Math.max(0, Math.min(1, (time - 5 - index * 0.065) / 0.36));
    const eased = 1 - (1 - progress) ** 3;
    const connection = geometry.connections[index];
    return {
      progress,
      dx: connection ? (connection.x - connection.targetX) * (1 - eased) : 0,
      dy: connection ? (connection.y - connection.targetY) * (1 - eased) + offset : offset,
    };
  };

  return <div ref={rootRef} className="undergraduate-scene">
    <svg className="paper-connections" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true" focusable="false">
      {geometry.connections.map((connection, index) => {
        const { progress, dx, dy } = motion(index);
        const x = connection.targetX + dx;
        const y = connection.targetY + dy;
        const elbow = x + (connection.x > x ? 24 : -24);
        return <g key={index} className="paper-connection" style={{ opacity: connection.visible ? progress : 0 }}>
          <path d={`M ${connection.x} ${connection.y} L ${elbow} ${y} L ${x} ${y}`} />
          <circle cx={connection.x} cy={connection.y} r="4" />
        </g>;
      })}
    </svg>
    <div ref={layoutRef} className="undergraduate-layout" tabIndex={0} role="group" aria-label="Undergraduate education and research. Scroll to read all four entries on smaller screens.">
      <div className="undergraduate-intro">
        <p className="section-kicker">01 / UNDERGRADUATE EDUCATION</p>
        <h2 id="publications-heading">Where two<br />disciplines met.</h2>
        <p>{profile.undergraduate.introduction}</p>
      </div>
      <ol className="research-papers" role="list" aria-label="Undergraduate research and projects">
        {profile.undergraduate.work.map((item, index) => {
          const { progress, dx, dy } = motion(index);
          return <li key={item.title} className={`research-paper-slot paper-slot-${index + 1}`} ref={node => { cardsRef.current[index] = node; }}>
            <article className="research-paper" style={{ opacity: progress, transform: `translate(${dx}px, ${dy}px)` }}>
              <div className="paper-meta"><span className="paper-number">0{index + 1}</span><p>{item.type}</p></div>
              <h3>{item.href ? <a href={item.href} target="_blank" rel="noreferrer">{item.title}<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : item.title}</h3>
              {item.description && <p className="paper-description">{item.description}</p>}
            </article>
          </li>;
        })}
      </ol>
    </div>
  </div>;
}
