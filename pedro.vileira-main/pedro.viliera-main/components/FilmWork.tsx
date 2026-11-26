'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { filmWork } from '@/data/film-work';
import { TextReveal } from './TextReveal';

const pad = (n: number) => String(n).padStart(2, '0');

// Espaço reservado quando o arquivo de vídeo ainda não existe (ou falha ao carregar).
function Placeholder({ n, src }: { n: number; src: string }) {
  return <div className="fallback t-micro" role="img" aria-label={`Vídeo ${pad(n)} — espaço reservado`}>VÍDEO {pad(n)}<br />{src}</div>;
}

// ===== Faixa de vídeos em movimento contínuo (direita → esquerda, loop infinito, sem áudio) =====
function CarouselItem({ n, src, poster, hidden }: { n: number; src: string; poster?: string; hidden?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="fw-strip__item" aria-hidden={hidden || undefined}>
      {failed
        ? <Placeholder n={n} src={src} />
        : <video className="media" src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" tabIndex={-1} onError={() => setFailed(true)} />}
    </div>
  );
}

function Strip() {
  const root = useRef<HTMLDivElement>(null);
  // Economiza o aparelho: quando a faixa sai da tela, os vídeos dela pausam; ao voltar, retomam.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.querySelectorAll('video').forEach((v) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); });
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const style = { '--fw-strip-s': `${filmWork.carouselSeconds}s` } as React.CSSProperties;
  return (
    <div ref={root} className="fw-strip" style={style} role="group" aria-label="Faixa de vídeos Film Work">
      <div className="fw-strip__track">
        {/* duas cópias idênticas: a animação anda exatamente metade da faixa e recomeça, sem emenda perceptível */}
        {[false, true].map((dup) => filmWork.projects.map((p, i) => <CarouselItem key={`${dup}-${i}`} n={i + 1} src={p.video} poster={p.poster} hidden={dup} />))}
      </div>
    </div>
  );
}

// ===== Projetos individuais (alternados) =====
export function FilmWork() {
  const { projects, labels } = filmWork;
  const [active, setActive] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const failed = useRef<Set<number>>(new Set());
  const [, force] = useState(0);
  const ratios = useRef<number[]>(projects.map(() => 0));

  // Intersection Observer: o vídeo que ocupa a faixa central da tela é o "em destaque". Só um por vez.
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { const i = wraps.current.indexOf(e.target as HTMLDivElement); if (i >= 0) ratios.current[i] = e.isIntersecting ? e.intersectionRatio : 0; });
      let best = -1, max = 0;
      ratios.current.forEach((r, i) => { if (r > max) { max = r; best = i; } });
      setActive(best >= 0 ? best : null);
    }, { rootMargin: '-30% 0px -30% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }); // ⚡ faixa central de 40% da tela
    wraps.current.forEach((w) => w && io.observe(w));
    return () => io.disconnect();
  }, []);

  // Reprodução: pausa todos, toca apenas o ativo. Começa sempre sem áudio; o áudio só liga se o visitante pediu.
  useEffect(() => {
    vids.current.forEach((v, i) => { if (v && i !== active) v.pause(); });
    const v = active !== null ? vids.current[active] : null;
    if (!v) return;
    v.muted = !sound;
    v.play().catch(() => { v.muted = true; setSound(false); v.play().catch(() => {}); }); // se o navegador bloquear o áudio, volta ao mudo
  }, [active, sound]);

  // Aba em segundo plano: pausa; ao voltar, retoma o ativo.
  useEffect(() => {
    const vis = () => {
      if (document.hidden) vids.current.forEach((v) => v?.pause());
      else if (active !== null) vids.current[active]?.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [active]);

  const markFailed = useCallback((i: number) => { failed.current.add(i); force((n) => n + 1); }, []);

  return (
    <>
      <section className="grid fw-overview" aria-label="Overview">
        <span className="t-micro fw-overview__label c-half-l">( {filmWork.overviewLabel} )</span>
        <p className="t-subtitle fw-overview__text c-half-r">{filmWork.overview}</p>
      </section>

      <Strip />

      {projects.map((p, i) => {
        const text = (
          <div className="fw-text">
            <span className="t-micro fw-text__idx">{pad(i + 1)} / {pad(projects.length)}</span>
            <TextReveal as="h2" lines={[p.brand]} className="t-headline fw-text__name" />
            <p className="t-subtitle fw-text__desc">{p.description}</p>
            <dl className="fw-meta t-caption">
              <div><dt className="t-micro">{labels.role}</dt><dd>{p.role}</dd></div>
              <div><dt className="t-micro">{labels.tools}</dt><dd>{p.tools}</dd></div>
              <div><dt className="t-micro">{labels.credits}</dt><dd>{p.credits.split(' / ').map((c) => <span key={c} className="fw-meta__line">{c}</span>)}</dd></div>
            </dl>
          </div>
        );
        const video = (
          <div className="fw-video" ref={(el) => { wraps.current[i] = el; }}>
            {failed.current.has(i)
              ? <Placeholder n={i + 1} src={p.video} />
              : <video ref={(el) => { vids.current[i] = el; }} className="media" src={p.video} poster={p.poster} muted loop playsInline preload="metadata" aria-label={`${p.brand} — vídeo do projeto`} onError={() => markFailed(i)} />}
            <button type="button" className="fw-sound" aria-pressed={sound} aria-label={sound ? 'Desativar áudio' : 'Ativar áudio'} onClick={() => setSound((s) => !s)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" />{sound ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" /> : <path d="M16 9l5 6M21 9l-5 6" />}</svg>
            </button>
          </div>
        );
        const odd = i % 2 === 0; // 01, 03, 05: descrição à esquerda · 02, 04: vídeo à esquerda
        return (
          <section key={p.brand + i} className={`grid fw-project ${odd ? "fw-project--text-l" : "fw-project--video-l"}${i === projects.length - 1 ? " fw-project--last" : ""}`} aria-label={`Projeto ${pad(i + 1)} — ${p.brand}`}>
            {odd ? <>{text}{video}</> : <>{video}{text}</>}
          </section>
        );
      })}
    </>
  );
}
