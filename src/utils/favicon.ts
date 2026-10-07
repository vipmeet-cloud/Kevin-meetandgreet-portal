/**
 * Favicon Management Utility
 * Allows dynamic favicon switching via Management Portal Settings
 * and persists to browser document head.
 */

export const FAVICON_PRESETS = [
  {
    id: 'default',
    name: 'VIP Gold Shield',
    description: 'Executive Gold Shield with Crown Crest',
    url: '/favicon.svg',
  },
  {
    id: 'crown',
    name: 'Royal VIP Crown',
    description: 'Monarch triple-peak gold crown',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%23080A0F" stroke="%23D4AF37" stroke-width="2"/%3E%3Cpath d="M14 44 L18 20 L27 32 L32 16 L37 32 L46 20 L50 44 Z" fill="%23D4AF37"/%3E%3Ccircle cx="18" cy="18" r="2.5" fill="%23FFF"/%3E%3Ccircle cx="32" cy="14" r="3" fill="%23FFF"/%3E%3Ccircle cx="46" cy="18" r="2.5" fill="%23FFF"/%3E%3C/svg%3E',
  },
  {
    id: 'star',
    name: 'Celebrity Star',
    description: 'Hollywood gold prestige five-point star',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%23080A0F" stroke="%23D4AF37" stroke-width="2"/%3E%3Cpolygon points="32,10 38,25 54,25 41,36 46,51 32,41 18,51 23,36 10,25 26,25" fill="%23D4AF37"/%3E%3C/svg%3E',
  },
  {
    id: 'crest',
    name: 'VIP Monogram Crest',
    description: 'Gold luxury VIP typography seal',
    url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%23080A0F" stroke="%23D4AF37" stroke-width="2"/%3E%3Ccircle cx="32" cy="32" r="22" fill="none" stroke="%23D4AF37" stroke-width="2" stroke-dasharray="3 2"/%3E%3Ctext x="32" y="38" font-family="serif" font-size="18" font-weight="bold" fill="%23D4AF37" text-anchor="middle"%3EVIP%3C/text%3E%3C/svg%3E',
  },
] as const;

export function applyFavicon(faviconUrl?: string | null): void {
  if (typeof document === 'undefined') return;

  const resolvedUrl = (faviconUrl && faviconUrl.trim().length > 0) ? faviconUrl.trim() : '/favicon.svg';

  try {
    // 1. Primary standard icon
    let primaryLink = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!primaryLink) {
      primaryLink = document.querySelector('link[rel="icon"]');
    }
    if (!primaryLink) {
      primaryLink = document.createElement('link');
      primaryLink.id = 'app-favicon';
      primaryLink.rel = 'icon';
      document.head.appendChild(primaryLink);
    }
    
    // Determine mime type
    if (resolvedUrl.endsWith('.svg') || resolvedUrl.includes('image/svg+xml')) {
      primaryLink.type = 'image/svg+xml';
    } else if (resolvedUrl.endsWith('.png') || resolvedUrl.includes('image/png')) {
      primaryLink.type = 'image/png';
    } else {
      primaryLink.type = 'image/x-icon';
    }
    
    primaryLink.href = resolvedUrl;

    // 2. Apple touch icon
    let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = resolvedUrl;

    // 3. Shortcut icon for legacy browsers
    let shortcutLink = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = resolvedUrl;
  } catch (err) {
    console.warn('Could not update document favicon:', err);
  }
}
