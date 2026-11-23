
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { ChaosText } from '@/components/ContactHeroTitle';

export const metadata: Metadata = {
  title: 'Sobre Pedro Vileira',
  description: siteConfig.description,
  alternates: {
    canonical: '/about',
  },
};

const profileJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: {
    '@type': 'Person',
    '@id': 'https://pedrovileira.com/about#pedro-vileira',
    name: 'Pedro Vileira',
    url: 'https://pedrovileira.com/',
    jobTitle: 'Designer, Diretor de Arte e Criador Visual',
    description: siteConfig.bio,
    sameAs: [
      siteConfig.instagram,
      siteConfig.linkedin,
      siteConfig.behance,
    ].filter(Boolean),
  },
};

export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <section className="page">
        {/* ✏️ PEDRO: ALTERE A FRASE PRINCIPAL AQUI */}
        <ChaosText
          as="h1"
          lines={['Ideias que viram realidade.']}
          className="t-headline"
        />

        <div className="grid about">
          <p className="t-subtitle c-half-l">
            {siteConfig.bio}
          </p>

          <div className="c-half-r about__cols t-caption">
            <div>
              <h2 className="t-micro">DISCIPLINAS</h2>
              <ul>
                {siteConfig.disciplines.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="t-micro">FERRAMENTAS</h2>
              <ul>
                {siteConfig.tools.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="t-micro">EXPERIÊNCIA</h2>
              <ul>
                {siteConfig.experience.map((e) => (
                  <li key={e.role}>
                    {e.period}
                    <br />
                    {e.role}, {e.place}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
