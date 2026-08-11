import { supabase } from './supabase';

export type WorkspaceTheme = 'dark' | 'light' | 'system';
export type WorkspaceLanguage = 'id' | 'en';

export interface WorkspacePreferences {
  theme: WorkspaceTheme;
  language: WorkspaceLanguage;
}

const STORAGE_KEY = 'docuai.workspace.preferences';

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
  theme: 'dark',
  language: 'id',
};

export function resolveTheme(theme: WorkspaceTheme): 'dark' | 'light' {
  if (theme === 'dark' || theme === 'light') {
    return theme;
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function readStoredPreferences(): WorkspacePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspacePreferences>;
    if ((parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system') && (parsed.language === 'id' || parsed.language === 'en')) {
      return { theme: parsed.theme, language: parsed.language };
    }
  } catch {
    return null;
  }
  return null;
}

export function storePreferences(preferences: WorkspacePreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent('docuai:preferences-changed', { detail: preferences }));
}

export function applyStoredTheme() {
  if (typeof document === 'undefined') return 'dark' as const;
  const resolved = resolveTheme(readStoredPreferences()?.theme ?? DEFAULT_PREFERENCES.theme);
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

export async function loadPreferences(userId: string): Promise<WorkspacePreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, language')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    theme: (data.theme as WorkspaceTheme) ?? DEFAULT_PREFERENCES.theme,
    language: (data.language as WorkspaceLanguage) ?? DEFAULT_PREFERENCES.language,
  };
}

export async function savePreferences(userId: string, preferences: WorkspacePreferences) {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      theme: preferences.theme,
      language: preferences.language,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
}
