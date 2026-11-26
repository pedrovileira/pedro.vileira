'use client';
import { Fragment, useEffect, useState } from 'react';
import { Permanent_Marker, Bebas_Neue, Caveat, Press_Start_2P, Playfair_Display, Rubik_Mono_One } from 'next/font/google';
import { useInView } from '@/lib/hooks';

// Fontes só para o efeito de "caos tipográfico" no título do Contact — não afetam o resto do site.
const f1 = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-c1' });
const f2 = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-c2' });
const f3 = Caveat({ subsets: ['latin'], weight: '700', variable: '--font-c3' });
const f4 = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-c4' });
const f5 = Playfair_Display({ subsets: ['latin'], weight: '700', style: 'italic', variable: '--font-c5' });
const f6 = Rubik_Mono_One({ subsets: ['latin'], weight: '400', variable: '--font-c6' });
const FONT_VARS = ['--font-c1', '--font-c2', '--font-c3', '--font-c4', '--font-c5', '--font-c6'];
// 🎨 PEDRO — cores do caos tipográfico (uma por letra, em sequência)
const COLORS = ['#ff4d6d', '#4dd0ff', '#ffce45', '#8b5cf6', '#2dd4bf', '#f97316'];
// ✏️ PEDRO — símbolos decorativos que substituem algumas letras durante o efeito (puramente visual)
const GLYPHS = ['Ж', 'ロ', '貝', 'ش', 'Ɵ', '大'];

// Título do Contact. Cada letra é um <span> independente: o hover (via CSS :hover, sem JS) muda
// SÓ a letra sob o mouse — as demais ficam intocadas. No celular, uma classe no título dispara
// a mesma transformação em todas as letras uma única vez, simulando o hover (sem precisar de toque).
// Também serve para qualquer texto de destaque (Home, About, encerramento): `as` troca a tag (h1, h2, p...) e
// `inView` faz a prévia do celular começar só quando o texto aparece na tela. Sem essas props, nada muda.
//
// ⚡ PEDRO — `fit`: o título ocupa TODA a largura disponível (o tamanho da fonte é calculado pela linha mais larga, e se ajusta
// sozinho ao redimensionar a tela ou quando a fonte termina de carregar). `fitMax` limita o tamanho em vw (útil para palavras curtas
// como "TOTÓ") e `fitMaxVh` limita a ALTURA total do título a uma fração da tela (em vh), para ele nunca estourar a primeira dobra.
export function ContactHeroTitle({ lines, className = '', wait = false, as: Tag = 'h1', inView = false, fit = false, fitMax, fitMaxVh }: { lines: string[]; className?: string; wait?: boolean; as?: React.ElementType; inView?: boolean; fit?: boolean; fitMax?: number; fitMaxVh?: number }) {
  // `wait` = espera o Loader terminar (usado no título da Home). Sem ele, o comportamento é o mesmo de antes.
  const { ref, on } = useInView<HTMLHeadingElement>(wait);
  const [preview, setPreview] = useState(false);
  const [done, setDone] = useState(false);
  const ready = !(wait || inView) || on; // sem `wait` (Contact) vale sempre true: o efeito abaixo roda como antes

  useEffect(() => {
    const touch = !matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!touch || done || !ready) return; // na Home, a prévia só começa depois que o título aparece
    // ⚡ PEDRO — tempo de espera e duração do easter egg no celular (ms)
    const t1 = setTimeout(() => setPreview(true), 700);
    const t2 = setTimeout(() => { setPreview(false); setDone(true); }, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [done, ready]);

  const nLines = lines.length;
  // Ajuste de largura (só quando `fit` está ligado). Mede a largura natural de cada linha (.tr__in = max-content) e escala a fonte.
  useEffect(() => {
    if (!fit) return;
    const el = ref.current;
    if (!el) return;
    let lastW = 0;
    const run = () => {
      const w = el.clientWidth;
      if (!w) return;
      let widest = 0;
      el.querySelectorAll<HTMLElement>('.tr__in').forEach((n) => { widest = Math.max(widest, n.getBoundingClientRect().width); });
      if (!widest) return;
      const cs = getComputedStyle(el);
      const cur = parseFloat(cs.fontSize);
      if (!cur) return;
      let next = cur * (w / widest);
      if (fitMax) next = Math.min(next, (window.innerWidth * fitMax) / 100);
      if (fitMaxVh) {
        const lh = parseFloat(cs.lineHeight) / cur || 0.85;
        next = Math.min(next, (window.innerHeight * fitMaxVh) / 100 / (nLines * (lh + 0.08)));
      }
      el.style.fontSize = `${next.toFixed(2)}px`;
    };
    lastW = el.clientWidth;
    run();
    // só reajusta quando a LARGURA muda (evita "pulos" no celular quando a barra do navegador some/aparece)
    const ro = new ResizeObserver(() => { const w = el.clientWidth; if (Math.abs(w - lastW) > 0.5) { lastW = w; run(); } });
    ro.observe(el);
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(run);
    fonts?.addEventListener?.('loadingdone', run);
    return () => { ro.disconnect(); fonts?.removeEventListener?.('loadingdone', run); };
  }, [fit, fitMax, fitMaxVh, nLines]);

  let gi = -1;
  return (
    <Tag
      ref={ref}
      className={`tr ${fit ? 'tr--fit' : ''} ${on ? 'is-in' : ''} ${f1.variable} ${f2.variable} ${f3.variable} ${f4.variable} ${f5.variable} ${f6.variable} ${preview ? 'is-chaos-preview' : ''} ${className}`}
      aria-label={lines.join(' ')}
    >
      {lines.map((line, li) => (
        <span className="tr__line" key={li} aria-hidden="true">
          <span className="tr__in" style={{ transitionDelay: `calc(var(--stagger) * ${li})` }}>
            {line.split(' ').map((word, wi, words) => {
              const chars = word.split('').map((ch) => {
                gi += 1;
                const i = gi;
                const glyph = i % 5 === 3 ? GLYPHS[i % GLYPHS.length] : undefined;
                const style = {
                  ['--cf' as string]: `var(${FONT_VARS[i % FONT_VARS.length]})`,
                  ['--cc' as string]: COLORS[i % COLORS.length],
                  ['--r' as string]: `${((i * 37) % 24) - 12}deg`,
                  ['--s' as string]: `${0.85 + ((i * 53) % 30) / 100}`,
                  ['--d' as string]: `calc(var(--stagger) * ${i} / 3)`,
                };
                return (
                  <span key={i} className="chaos__ch" style={style} data-glyph={glyph} data-ch={ch}>
                    {ch}
                  </span>
                );
              });
              if (words.length === 1) return chars; // linha sem espaços (ex.: Contact): mesma estrutura de sempre
              // frases: cada palavra fica inteira (não quebra no meio) e o espaço entre elas é um espaço normal
              return <Fragment key={wi}><span className="chaos__w">{chars}</span>{wi < words.length - 1 ? ' ' : null}</Fragment>;
            })}
          </span>
        </span>
      ))}
    </Tag>
  );
}

// Nome neutro para usar fora do Contact (é o mesmo componente).
export const ChaosText = ContactHeroTitle;
