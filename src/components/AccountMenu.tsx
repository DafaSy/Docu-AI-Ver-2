import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Files,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { EditProfileModal, type AccountTab } from './EditProfileModal';

type AccountMenuProps = {
  mobile?: boolean;
  showSignOut?: boolean;
  onAction?: () => void;
};

export function AccountMenu({ mobile = false, showSignOut = false, onAction }: AccountMenuProps) {
  const { user, displayName, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [modalTab, setModalTab] = useState<AccountTab | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', escape);
    };
  }, [open]);

  if (!user) return null;

  const name = displayName || user.email?.split('@')[0] || 'Account';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const destination = isAdmin ? '/admin' : '/app';

  const run = (action: () => void) => {
    setOpen(false);
    action();
    onAction?.();
  };

  return (
    <>
      <div ref={rootRef} className={`relative ${mobile ? 'w-full' : ''}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={`group flex items-center gap-3 rounded-xl border text-left transition duration-200 ${open ? 'border-brand-400/35 bg-brand-500/10 shadow-[0_12px_38px_rgba(0,0,0,0.24)]' : 'border-white/10 bg-white/5 hover:border-brand-400/30 hover:bg-white/[0.075]'} ${mobile ? 'w-full px-3.5 py-3' : 'max-w-[190px] px-2.5 py-2'}`}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 text-xs font-bold text-white shadow-[0_8px_22px_rgba(51,128,252,0.24)]">
            {initials || <UserRound size={16} />}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b1019] bg-success-400" />
          </span>
          <span className={`min-w-0 flex-1 ${mobile ? '' : 'hidden sm:block'}`}>
            <span className="block truncate text-sm font-semibold text-white">{name}</span>
            <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.12em] text-ink-500">{isAdmin ? 'Administrator' : 'Personal workspace'}</span>
          </span>
          <ChevronDown size={14} className={`shrink-0 text-ink-500 transition duration-200 group-hover:text-ink-200 ${mobile ? '' : 'hidden sm:block'} ${open ? 'rotate-180 text-brand-300' : ''}`} />
        </button>

        <div
          role="menu"
          className={`z-[90] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f18]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition duration-200 ${mobile ? 'mt-2 w-full origin-top' : 'absolute right-0 top-[calc(100%+10px)] w-72 origin-top-right'} ${open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-[0.98] opacity-0'}`}
        >
          <div className="mb-2 rounded-xl border border-white/[0.07] bg-gradient-to-br from-brand-500/10 to-accent-500/[0.05] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{name}</p><p className="mt-0.5 truncate text-xs text-ink-500">{user.email}</p></div>
              {isAdmin && <span className="inline-flex items-center gap-1 rounded-full border border-brand-400/20 bg-brand-500/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-brand-200"><ShieldCheck size={10} /> Admin</span>}
            </div>
          </div>

          <MenuButton
            icon={isAdmin ? LayoutDashboard : Files}
            title={isAdmin ? 'Dashboard' : 'Document Library'}
            description={isAdmin ? 'Monitor platform activity' : 'Open your private workspace'}
            onClick={() => run(() => navigate(destination))}
          />
          <div className="my-1.5 h-px bg-white/[0.07]" />
          <MenuButton icon={UserRound} title="Change username" description="Update your display identity" onClick={() => run(() => setModalTab('profile'))} />
          <MenuButton icon={KeyRound} title="Change password" description="Secure your account access" onClick={() => run(() => setModalTab('password'))} />
          {showSignOut && (
            <>
              <div className="my-1.5 h-px bg-white/[0.07]" />
              <MenuButton danger icon={LogOut} title="Log out" description="End this session securely" onClick={() => run(() => { void signOut().then(() => navigate('/')); })} />
            </>
          )}
        </div>
      </div>

      <EditProfileModal isOpen={modalTab !== null} initialTab={modalTab ?? 'profile'} onClose={() => setModalTab(null)} />
    </>
  );
}

function MenuButton({ icon: Icon, title, description, onClick, danger = false }: { icon: typeof UserRound; title: string; description: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${danger ? 'hover:bg-danger-500/10' : 'hover:bg-white/[0.055]'}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${danger ? 'border-danger-500/15 bg-danger-500/[0.07] text-danger-300' : 'border-white/[0.07] bg-white/[0.035] text-ink-400 group-hover:border-brand-400/20 group-hover:bg-brand-500/10 group-hover:text-brand-300'}`}><Icon size={16} /></span>
      <span className="min-w-0"><span className={`block text-sm font-medium ${danger ? 'text-danger-200' : 'text-ink-200 group-hover:text-white'}`}>{title}</span><span className="mt-0.5 block text-[11px] text-ink-600">{description}</span></span>
    </button>
  );
}
