/* Meta Pixel helpers
 * Call initPixel(id) once after knowing the store's pixel ID.
 * Call trackPixel(event, data) anywhere to fire events safely.
 */

export function initPixel(pixelId) {
  if (!pixelId) return;
  if (window._pixelId === pixelId) return; // already initialised for this store

  // Inject the fbq stub + load fbevents.js
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;
    n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s);
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window._pixelId = pixelId;
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export function trackPixel(event, data) {
  if (typeof window.fbq === 'function') {
    window.fbq('track', event, data || {});
  }
}
