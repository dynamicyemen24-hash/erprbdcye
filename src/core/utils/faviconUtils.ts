/**
 * Dynamically updates the browser's favicon using the active organization's logo URL.
 * 
 * @param logoUrl The URL of the logo to set as the favicon.
 */
export function updateFavicon(logoUrl?: string) {
  if (typeof window === 'undefined') return;

  const url = logoUrl || '/UAMEX_ERPLOGO.png';

  // Find or create the shortcut icon link
  let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  // Set the dynamic type depending on standard extensions
  if (url.endsWith('.png')) {
    link.type = 'image/png';
  } else if (url.endsWith('.svg')) {
    link.type = 'image/svg+xml';
  } else if (url.endsWith('.ico')) {
    link.type = 'image/x-icon';
  }

  link.href = url;
}
