export function normalizeRemoteImageUrl(value: string | null | undefined): string {
  const raw = value?.trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    if (url.hostname === 'drive.google.com') {
      const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = pathMatch?.[1] || url.searchParams.get('id');
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1600`;
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}
