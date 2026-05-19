const COOKIE_NAME = 'basera_loc';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export function saveLocationToCookie(loc) {
  if (!loc) return;
  try {
    const value = encodeURIComponent(JSON.stringify(loc));
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch { /* ignore */ }
}

export function loadLocationFromCookie() {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
    );
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match[1]));
  } catch { return null; }
}

export function clearLocationCookie() {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
}
