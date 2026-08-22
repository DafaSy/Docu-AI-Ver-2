import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  DEFAULT_PREFERENCES,
  applyThemeToElement,
  loadPreferences,
  readStoredPreferences,
  resolveTheme,
  savePreferences,
  storePreferences,
  type WorkspaceLanguage,
  type WorkspacePreferences,
  type WorkspaceTheme,
  type WorkspaceDensity,
} from '../lib/preferences';
import { getWorkspaceCopy, type WorkspaceCopy } from '../locales/workspace';

export function useWorkspacePreferences(user: User | null) {
  const [preferences, setPreferences] = useState<WorkspacePreferences>(
    () => readStoredPreferences() ?? DEFAULT_PREFERENCES
  );
  const [isReady, setIsReady] = useState(false);

  const appliedTheme = useMemo(() => resolveTheme(preferences.theme), [preferences.theme]);
  const copy: WorkspaceCopy = useMemo(() => getWorkspaceCopy(preferences.language), [preferences.language]);

  // Keep DOM theme attributes, styles, and classList completely synchronized
  useEffect(() => {
    applyThemeToElement(appliedTheme);
  }, [appliedTheme]);

  // Listen to preference changes from any source (cross-tab or other components)
  useEffect(() => {
    const handleSync = (event?: Event) => {
      const customEvent = event as CustomEvent<WorkspacePreferences> | undefined;
      const next = customEvent?.detail ?? readStoredPreferences();
      if (next) {
        setPreferences(next);
      }
    };

    window.addEventListener('docuai:preferences-changed', handleSync as EventListener);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('docuai:preferences-changed', handleSync as EventListener);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Sync with Supabase on user load
  useEffect(() => {
    if (!user) {
      setIsReady(true);
      return;
    }
    let cancelled = false;

    void loadPreferences(user.id)
      .then((remote) => {
        if (cancelled) return;
        const local = readStoredPreferences();
        if (remote) {
          setPreferences(remote);
          storePreferences(remote);
        } else if (local) {
          void savePreferences(user.id, local).catch(() => undefined);
        }
      })
      .catch(() => {
        const local = readStoredPreferences();
        if (local && !cancelled) setPreferences(local);
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updatePreferences = useCallback(
    (updater: Partial<WorkspacePreferences> | ((prev: WorkspacePreferences) => WorkspacePreferences)) => {
      setPreferences((current) => {
        const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        storePreferences(next);
        applyThemeToElement(resolveTheme(next.theme));
        if (user && isReady) {
          void savePreferences(user.id, next).catch(() => undefined);
        }
        return next;
      });
    },
    [user, isReady]
  );

  const updateTheme = useCallback((theme: WorkspaceTheme) => {
    updatePreferences({ theme });
  }, [updatePreferences]);

  const updateLanguage = useCallback((language: WorkspaceLanguage) => {
    updatePreferences({ language });
  }, [updatePreferences]);

  const updateDensity = useCallback((density: WorkspaceDensity) => {
    updatePreferences({ density });
  }, [updatePreferences]);

  return {
    preferences,
    appliedTheme,
    copy,
    isReady,
    updatePreferences,
    updateTheme,
    updateLanguage,
    updateDensity,
  };
}
