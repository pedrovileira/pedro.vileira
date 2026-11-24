'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { TransitionLink } from './TransitionLink';

// ✏️ PEDRO: ALTERE OS ITENS DO MENU AQUI
// `mobile` = mesmo texto com hifens opcionais (\u00AD) nas fronteiras silábicas do português (tra-ba-lhos, or-ça-men-to).
// Só são usados se a tela for estreita demais (ver `.menu__item` no globals.css); normalmente a palavra aparece inteira.
const links = [{ href: '/', label: 'HOME' }, { href: '/work', label: 'TRABALHOS', mobile: 'TRA\u00ADBA\u00ADLHOS' }, { href: '/lab/editor', label: 'IMAGE LAB' }, { href: '/contact', label: 'CONTACT', mobile: 'CON\u00ADTACT' }, { href: '/quote', label: 'ORÇAMENTO', mobile: 'OR\u00ADÇA\u00ADMEN\u00ADTO' }] as { href: string; label: string; mobile?: string }[];

export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [open]);
  return (
    <>
      <header className="nav">
        <TransitionLink href="/" className="nav__logo" label="PEDRO VILEIRA" onNavigate={() => setOpen(false)} aria-label="Pedro Vileira — Home">PV</TransitionLink>
        <nav aria-label="Main" className="nav__links">
          {links.map((l) => (
            <TransitionLink key={l.href} href={l.href} label={l.label} aria-current={(l.href === '/' ? path === '/' : path.startsWith(l.href)) ? 'page' : undefined}>{l.label}</TransitionLink>
          ))}
        </nav>
        <button className="nav__btn" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>{open ? 'CLOSE' : 'MENU'}</button>
      </header>
      <div id="menu" className={`menu ${open ? 'is-open' : ''}`} inert={!open}>
        <nav aria-label="Mobile">
          {links.map((l, i) => (
            <TransitionLink key={l.href} href={l.href} label={l.label} onNavigate={() => setOpen(false)} className="menu__item t-headline" style={{ '--i': i } as CSSProperties}>{l.mobile ?? l.label}</TransitionLink>
          ))}
        </nav>
      </div>
    </>
  );
}
