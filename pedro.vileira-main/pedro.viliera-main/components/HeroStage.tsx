'use client';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/hooks';

// Palco da Home: grava --mx / --my (−1…1) no elemento; o CSS usa esses valores para inclinar o retrato e
// mover as formas flutuantes em profundidades diferentes (só com mouse; no toque elas se movem sozinhas via CSS).
// ✏️ PEDRO — a suavidade do movimento é o 0.08 (maior = mais "colado" no mouse).
export function HeroStage({ children, className = '', ...rest }: React.ComponentPropsWithoutRef<'section'>) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, running = false;
    const loop = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); };
  }, []);

  return <section ref={root} className={className} {...rest}>{children}</section>;
}
