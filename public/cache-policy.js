export function isCacheableAppRequest(requestUrl, appOrigin) {
  const url = new URL(requestUrl)
  return url.origin === appOrigin && (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/manifest.webmanifest' || url.pathname === '/icon.svg' || url.pathname.startsWith('/assets/'))
}
