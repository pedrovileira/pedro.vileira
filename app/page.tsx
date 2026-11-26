import type { Metadata } from 'next';
import { siteConfig, homeBlocks } from '@/config/site';
import { projects } from '@/data/projects';
import { ContactHeroTitle, ChaosText } from '@/components/ContactHeroTitle';
import { ImageReveal } from '@/components/ImageReveal';
import { TransitionLink } from '@/components/TransitionLink';
import { HeroStickers } from '@/components/HeroStickers';
import { HeroStage } from '@/components/HeroStage';
import { LocalTime } from '@/components/LocalTime';

// 🖼️ PEDRO — retrato do hero (proporção 4:5). Troque o arquivo em /public/images/home/ ou mude o caminho aqui.
const HERO_PORTRAIT = '/images/home/pedro-02.png';

export const metadata: Metadata = {
  title: 'Pedro Vileira | Designer Gráfico e Diretor de Arte',
  description: siteConfig.description,
  alternates: { canonical: '/' },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Pedro Vileira",
  "alternateName": "pedrovileira.com",
  "url": "https://pedrovileira.com/"
};

export default function Home() {
  const featured = projects.filter((p) => p.featured);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c'),
        }}
      />
      {/* HERO — título em caos tipográfico ocupando toda a largura, retrato inclinado, adesivos e formas flutuantes (parallax no mouse) */}
      <HeroStage className="hero hero--home" aria-label="Apresentação">
        <div className="hero__row t-micro"><span>{siteConfig.role}</span><span>{siteConfig.location}</span><span>2026</span></div>

        <div className="hero__stage">
          {/* ✏️ PEDRO: ALTERE SEU NOME AQUI (uma string por linha) — `fit` faz o nome preencher a largura da tela */}
          <div className="hero__name">
            <figure className="hero__portrait">
              <div className="hero__tilt">
                <div className="hero__frame">
                  <ImageReveal src={HERO_PORTRAIT} alt="Retrato de Pedro Vileira" ratio="4 / 5" priority sizes="(min-width:1024px) 20vw, 60vw" />
                </div>
                <figcaption className="hero__cap t-micro"><span>( RETRATO )</span><LocalTime /></figcaption>
              </div>
            </figure>
            <ContactHeroTitle lines={['PEDRO', 'VILEIRA']} wait fit fitMaxVh={76} className="t-display hero__title" />
            {/* ✏️ PEDRO: ALTERE O TEXTO EM HeroStickers.tsx; as cores ficam em globals.css (.sticker--a/b/c) */}
            <HeroStickers />
          </div>

          {/* Formas flutuantes — decorativas */}
          <span className="hfl hfl--star" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" /></svg></span>
          <span className="hfl hfl--ring" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" /><path d="M50 0v100M0 50h100" /></svg></span>
          <span className="hfl hfl--wave" aria-hidden="true"><svg viewBox="0 0 120 24"><path d="M2 12Q17-4 32 12T62 12T92 12T118 12" /></svg></span>
        </div>

        <div className="hero__row t-micro"><span>ROLE PARA EXPLORAR ↓</span><span>SELECIONE UM PROJETO (01–{String(featured.length).padStart(2, '0')})</span></div>
      </HeroStage>
      {/* ✏️ PEDRO: textos e fotos dos blocos ficam em config/site.ts (homeBlocks). Bloco 1: foto à esquerda; bloco 2: foto à direita */}
      {homeBlocks.map((b, i) => (
        <section key={b.label} className={`grid hblock ${i % 2 ? 'hblock--flip' : ''}`} aria-label={b.label}>
          <div className="c-half-l hblock__img"><ImageReveal src={b.image} alt={b.alt} ratio="4 / 5" sizes="(min-width:1024px) 50vw, 100vw" /></div>
          <div className="c-half-r hblock__text">
            <span className="t-micro hblock__label">( {b.label} )</span>
            <ChaosText as="h2" lines={[b.title]} inView className="t-headline hblock__title" />
            <p className="t-subtitle">{b.text}</p>
            {b.list.length > 0 && <ul className="hblock__list t-micro">{b.list.map((a) => <li key={a}>{a}</li>)}</ul>}
            {b.link && <TransitionLink href={b.link.href} label="ABOUT" className="t-micro hblock__more" data-cursor="view" data-cursor-label="ABOUT">{b.link.label}</TransitionLink>}
          </div>
        </section>
      ))}
      <section className="hcta" aria-label="Trabalhos">
        <ChaosText as="h2" lines={['VEJA OS MEUS', 'TRABALHOS!']} inView fit fitMaxVh={60} className="t-display hcta__title" />
        <TransitionLink href="/work" label="TRABALHOS" className="qform__submit" data-cursor="view" data-cursor-label="GO">TRABALHOS →</TransitionLink>
      </section>
    </>
  );
}
