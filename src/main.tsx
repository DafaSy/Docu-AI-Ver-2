import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import App from './App.tsx';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { PricingPage } from './pages/PricingPage';
import { CommunityPage } from './pages/CommunityPage';
import { AdminPage } from './pages/AdminPage';
import { CommunityPostPage } from './pages/CommunityPostPage';
import { PublicFooter, PublicHeader } from './components/PublicChrome';
import type { ReactNode } from 'react';
import { applyStoredTheme, readStoredPreferences } from './lib/preferences';

function PublicPage({ children }: { children: ReactNode }) {
  return <RouteTransition><div className="public-page"><PublicHeader />{children}<PublicFooter /></div></RouteTransition>;
}

function RouteTransition({ children }: { children: ReactNode }) {
  const location = useLocation();

  return <div key={location.pathname} className="route-transition">{children}</div>;
}

function HashScroll() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [location.hash, location.pathname]);

  return null;
}

function GlobalThemeSync() {
  useEffect(() => {
    const sync = () => { applyStoredTheme(); };
    sync();
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const syncSystem = () => {
      if (readStoredPreferences()?.theme === 'system') sync();
    };
    window.addEventListener('storage', sync);
    window.addEventListener('docuai:preferences-changed', sync);
    media.addEventListener('change', syncSystem);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('docuai:preferences-changed', sync);
      media.removeEventListener('change', syncSystem);
    };
  }, []);
  return null;
}
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GlobalThemeSync />
        <HashScroll />
        <Routes>
          <Route path="/" element={<PublicPage><HomePage /></PublicPage>} />
          <Route path="/about" element={<PublicPage><AboutPage /></PublicPage>} />
          <Route path="/pricing" element={<PublicPage><PricingPage /></PublicPage>} />
          <Route path="/community" element={<PublicPage><CommunityPage /></PublicPage>} />
          <Route path="/community/post/:postId" element={<PublicPage><CommunityPostPage /></PublicPage>} />
          <Route path="/admin" element={<PublicPage><AdminPage /></PublicPage>} />
          <Route path="/app" element={<RouteTransition><App /></RouteTransition>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<PublicPage><HomePage /></PublicPage>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
