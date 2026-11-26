import { siteConfig, socials } from '@/config/site';
import { ChaosText } from '@/components/ContactHeroTitle';

export function Footer() {
  return (
    <footer className="footer grid">
      <p className="footer__name">
        <ChaosText as="span" lines={[siteConfig.name]} inView fit className="t-display footer__title" />
      </p>

      <ul className="footer__social c-right t-micro">
        {socials.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="t-micro full footer__base">
        <span>© 2026 {siteConfig.name}</span>
        <span>BUILT WITH INTENTION.</span>
      </p>
    </footer>
  );
}
