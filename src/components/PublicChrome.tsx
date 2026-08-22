import { useEffect, useState } from 'react';
import { ArrowRight, LogOut, Menu, MoonStar, ShieldCheck, SunMedium, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { CreatorSocialLinks, DocuAIBrand } from './DocuAIBrand';
import { AccountMenu } from './AccountMenu';
import { DEFAULT_PREFERENCES, applyThemeToElement, readStoredPreferences, resolveTheme, storePreferences } from '../lib/preferences';

export function PublicHeader() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const start = () => navigate(user ? '/app' : '/signup');
  const navItems = [
    ['Home', '/'],
    ['Workspace', '/app'],
    ['About', '/about'],
    ['Pricing', '/pricing'],
    ['Community', '/community'],
    ...(isAdmin ? [['Admin', '/admin']] : []),
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <>
      <header className="relative z-40 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
        <Link to="/" aria-label="DocuAI home" className="rounded-xl outline-none ring-brand-400/50 focus-visible:ring-2">
          <DocuAIBrand size="sm" />
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 text-sm text-ink-400 lg:flex">
          {navItems.map(([label, href]) => (
            <Link key={label} to={href} className="rounded-full px-3 py-1.5 transition hover:bg-white/[0.06] hover:text-white">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:gap-3 lg:flex">
          <ThemeToggle />
          {user ? (
            <>
              <AccountMenu />
              <button onClick={() => void handleSignOut()} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-ink-300 transition hover:border-danger-500/40 hover:text-danger-300">
                <LogOut size={14} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-ink-300 transition hover:text-white">Sign in</Link>
              <button onClick={start} className="rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-ink-950 transition hover:bg-brand-100">Try now</button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-200 transition hover:border-brand-400/30 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <Menu size={19} />
        </button>
      </header>

      <div className={`fixed inset-0 z-[80] overflow-hidden transition-[visibility] duration-300 lg:hidden ${mobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-300'}`} aria-hidden={!mobileOpen}>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          id="public-mobile-navigation"
          aria-label="Mobile navigation"
          className={`absolute right-0 top-0 flex h-full w-[min(88vw,390px)] flex-col border-l border-white/10 bg-[#090d15]/95 shadow-[-24px_0_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <DocuAIBrand size="sm" />
            <button autoFocus={mobileOpen} type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-ink-300 transition hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <nav aria-label="Mobile primary navigation" className="flex-1 overflow-y-auto px-4 py-5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-600">Navigate</p>
            <div className="mt-3 space-y-1">
              {navItems.map(([label, href]) => {
                const active = href === '/' ? location.pathname === '/' && !location.hash : href.startsWith('/#') ? location.hash === href.slice(1) : location.pathname.startsWith(href);
                return (
                  <Link key={label} to={href} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-brand-500/12 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`}>
                    <span className="flex items-center gap-2.5">
                      {label === 'Admin' && <ShieldCheck size={15} className="text-brand-300" />}
                      {label}
                    </span>
                    {label === 'Admin' && <span className="rounded-full border border-brand-400/20 bg-brand-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-200">Admin</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <ThemeToggle mobile />
            {user ? (
              <div className="mt-3 space-y-3">
                <AccountMenu mobile showSignOut onAction={() => setMobileOpen(false)} />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/login" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-ink-200 transition hover:bg-white/5">Sign in</Link>
                <Link to="/signup" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-ink-950 transition hover:bg-brand-100">Try now</Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => resolveTheme(readStoredPreferences()?.theme ?? DEFAULT_PREFERENCES.theme));

  useEffect(() => {
    const sync = () => setTheme(resolveTheme(readStoredPreferences()?.theme ?? DEFAULT_PREFERENCES.theme));
    window.addEventListener('docuai:preferences-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('docuai:preferences-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const stored = readStoredPreferences() ?? DEFAULT_PREFERENCES;
    storePreferences({ ...stored, theme: next });
    applyThemeToElement(next);
    setTheme(next);
  };

  return (
    <button type="button" onClick={toggle} className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-ink-300 transition hover:border-brand-400/30 hover:bg-white/10 hover:text-white ${mobile ? 'w-full px-4 py-3 text-sm' : 'h-10 w-10'}`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      {mobile && <span>{theme === 'dark' ? 'Use light mode' : 'Use dark mode'}</span>}
    </button>
  );
}

export function PublicFooter() {
  const features = ['Multi-document chat', 'Page-level citations', 'Document activity', 'Team workspaces'];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#070a10]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(51,128,252,0.12),transparent_30%),radial-gradient(circle_at_88%_100%,rgba(6,182,212,0.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="mb-12 flex flex-col justify-between gap-5 rounded-2xl border border-brand-400/15 bg-gradient-to-r from-brand-500/10 via-white/[0.035] to-accent-500/[0.08] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">Bring your documents into focus.</p>
            <p className="mt-1.5 text-sm text-ink-400">Build a private, searchable workspace from the files you already have.</p>
          </div>
          <Link
            to="/app"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-brand-100 sm:w-auto"
          >
            Open workspace <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <div>
            <DocuAIBrand subtitle="Private document intelligence" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              A focused AI workspace for organizing documents, retrieving context, and producing grounded answers.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-success-400/15 bg-success-500/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-300">
              <span className="h-1.5 w-1.5 rounded-full bg-success-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              Platform operational
            </span>
          </div>

          <FooterGroup title="Explore" links={[['Home', '/'], ['About', '/about'], ['Pricing', '/pricing'], ['Community', '/community']]} />
          <FooterGroup title="Coming next" links={features.map((feature) => [feature, '/pricing'])} />
          <FooterGroup title="Workspace" links={[['Create account', '/signup'], ['Sign in', '/login'], ['Admin login', '/login?mode=admin'], ['Open workspace', '/app']]} />
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs text-ink-600 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} DocuAI. All rights reserved.</span>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="font-medium text-ink-400">by Daff</span>
            <CreatorSocialLinks compact />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-300">{title}</p>
      <div className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <Link key={label} to={href} className="block text-sm text-ink-500 transition hover:translate-x-0.5 hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
