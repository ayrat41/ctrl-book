(function() {
  const SCRIPT_NAME = 'ctrl-book-widget';
  
  function init() {
    const iframe = document.getElementById(SCRIPT_NAME);
    if (!iframe) return;

    // 1. Initial State: Hidden to prevent flicker
    iframe.style.opacity = '0';
    iframe.style.transition = 'opacity 0.5s ease, height 0.3s ease';

    // 2. Auto-Detect Styling from Parent
    try {
      const parentStyle = window.getComputedStyle(iframe.parentElement);
      const parentFont = parentStyle.fontFamily;
      
      let isParentDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
      const bg = parentStyle.backgroundColor;
      
      // Ignore transparent backgrounds when detecting dark mode
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && !bg.includes('rgba(0, 0, 0, 0)')) {
        const rgb = bg.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 128) {
             isParentDark = true;
          }
        }
      }

      const url = new URL(iframe.src);
      
      // Auto-pass font if not manually set
      if (!url.searchParams.has('fontFamily')) {
        url.searchParams.set('fontFamily', parentFont);
      }
      
      // Auto-pass dark mode if not manually set
      if (!url.searchParams.has('darkMode') && isParentDark) {
        url.searchParams.set('darkMode', 'true');
      }

      // Pass return URL for Stripe
      url.searchParams.set('returnUrl', window.location.href.split('?')[0]); 

      // Check if parent has session_id (Stripe redirect)
      const parentUrl = new URL(window.location.href);
      if (parentUrl.searchParams.has('session_id')) {
        url.searchParams.set('session_id', parentUrl.searchParams.get('session_id'));
      }

      // Check if parent has date or promo params and pass them to the iframe
      if (parentUrl.searchParams.has('date')) {
        url.searchParams.set('date', parentUrl.searchParams.get('date'));
      }
      if (parentUrl.searchParams.has('promo')) {
        url.searchParams.set('promo', parentUrl.searchParams.get('promo'));
      }

      // Update iframe src with detected styles
      if (url.toString() !== iframe.src) {
        iframe.src = url.toString();
      }
    } catch (e) {
      console.warn('[Ctrl-Book] Could not auto-detect parent styles:', e);
    }

    // 3. Resize & Show Logic
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'ctrl-book-resize' && e.data.height) {
        if (iframe.contentWindow === e.source) {
          iframe.style.height = e.data.height + 'px';
          // Fade in once we have a valid height (prevents jumpy loading)
          iframe.style.opacity = '1';
        }
      }
    });

    // 4. Watch for Parent Dark Mode Changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
          const url = new URL(iframe.src);
          if (isDark && url.searchParams.get('darkMode') !== 'true') {
            url.searchParams.set('darkMode', 'true');
            iframe.src = url.toString();
          } else if (!isDark && url.searchParams.get('darkMode') === 'true') {
            url.searchParams.delete('darkMode');
            iframe.src = url.toString();
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.body, { attributes: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
