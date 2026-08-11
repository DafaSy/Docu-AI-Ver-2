import { FileText, Github, Linkedin, Mail, Sparkles } from 'lucide-react';

type BrandSize = 'sm' | 'md';

export function DocuAIBrand({
  size = 'md',
  subtitle,
}: {
  size?: BrandSize;
  subtitle?: string;
}) {
  const compact = size === 'sm';

  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={`relative shrink-0 rounded-[14px] bg-gradient-to-br from-brand-300 via-brand-600 to-accent-400 p-px shadow-[0_10px_32px_rgba(51,128,252,0.28)] ${
          compact ? 'h-9 w-9' : 'h-10 w-10'
        }`}
      >
        <span className="flex h-full w-full items-center justify-center rounded-[13px] bg-[#09101d]/95 text-white">
          <FileText size={compact ? 17 : 19} strokeWidth={2} />
        </span>
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-brand-400 to-accent-500 text-white shadow-[0_0_16px_rgba(34,211,238,0.55)]">
          <Sparkles size={8} strokeWidth={2.4} />
        </span>
      </span>

      <span className="min-w-0">
        <span className={`${compact ? 'text-[15px]' : 'text-base'} block font-semibold leading-tight tracking-[-0.025em] text-white`}>
          Docu<span className="bg-gradient-to-r from-brand-300 to-accent-400 bg-clip-text text-transparent">AI</span>
        </span>
        {subtitle && <span className="mt-0.5 block truncate text-[11px] leading-tight text-ink-500">{subtitle}</span>}
      </span>
    </span>
  );
}

const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/search/results/people/?keywords=Dafa%20Syachrullah',
    icon: Linkedin,
  },
  {
    label: 'Gmail',
    href: 'mailto:dafadafa2211@gmail.com',
    icon: Mail,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/search?q=Dafa+Syachrullah&type=users',
    icon: Github,
  },
] as const;

export function CreatorSocialLinks({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {socialLinks.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
          aria-label={label}
          title={label}
          className={`group inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-ink-400 transition duration-300 hover:-translate-y-0.5 hover:border-brand-400/35 hover:bg-brand-500/10 hover:text-white hover:shadow-[0_10px_24px_rgba(51,128,252,0.14)] ${
            compact ? 'h-8 w-8' : 'h-9 w-9'
          }`}
        >
          <Icon size={compact ? 14 : 15} strokeWidth={1.9} />
        </a>
      ))}
    </span>
  );
}
