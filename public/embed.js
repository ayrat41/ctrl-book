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

    // 5. Watch for URL Parameter Changes (Popstate)
    window.addEventListener('popstate', function() {
      try {
        const parentUrl = new URL(window.location.href);
        const url = new URL(iframe.src);
        let changed = false;

        const syncParam = (name) => {
          if (parentUrl.searchParams.has(name)) {
            if (url.searchParams.get(name) !== parentUrl.searchParams.get(name)) {
              url.searchParams.set(name, parentUrl.searchParams.get(name));
              changed = true;
            }
          } else if (url.searchParams.has(name)) {
            url.searchParams.delete(name);
            changed = true;
          }
        };

        syncParam('date');
        syncParam('promo');

        if (changed) {
          // Update internal iframe src state so we don't desync
          const newSrc = url.toString();
          if (iframe.src !== newSrc) {
            // Update the URL without reloading the iframe (if supported by the browser)
            // But to be safe, we just send a postMessage to dynamically update the React state
            iframe.contentWindow.postMessage({
              type: 'ctrl-book-update-params',
              date: url.searchParams.get('date'),
              promo: url.searchParams.get('promo')
            }, '*');
            
            // Only update iframe.src if it's the very first time or if it's completely missing
            // This prevents the iframe from doing a hard reload
            if (!iframe.src || iframe.src === 'about:blank') {
              iframe.src = newSrc;
            }
          }
        }
      } catch (e) {
        console.warn('[Ctrl-Book] Could not sync URL params on popstate:', e);
      }
    });

    // 6. Intercept anchor links with URL parameters targeting the widget
    document.addEventListener('click', function(e) {
      const a = e.target.closest('a');
      if (!a) return;

      const href = a.getAttribute('href');
      // If it's a link to the widget with parameters (e.g. /?date=2026-05-04#booking-widget)
      if (href && (href.includes('date=') || href.includes('promo=')) && (href.includes('#booking-widget') || href.includes('#ctrl-book-widget'))) {
        e.preventDefault(); // Prevent browser default
        e.stopPropagation(); // Stop event bubbling
        
        try {
          const linkUrl = new URL(a.href, window.location.origin);
          
          // Framer's router is extremely aggressive and will rewrite the URL to '/' 
          // discarding our parameters because it thinks it's the home page.
          // We use a short timeout to let Framer finish its routing, and then we RESTORE the correct URL!
          setTimeout(() => {
            // Restore the correct URL with parameters without reloading the page
            window.history.replaceState({}, '', linkUrl.toString());
            
            // Send message directly to iframe to avoid waiting for popstate logic
            const currentIframe = document.getElementById(SCRIPT_NAME);
            if (currentIframe && currentIframe.contentWindow) {
              currentIframe.contentWindow.postMessage({
                type: 'ctrl-book-update-params',
                date: linkUrl.searchParams.get('date'),
                promo: linkUrl.searchParams.get('promo')
              }, '*');
            }
            
            // Smooth scroll to the widget
            const widgetId = href.split('#')[1];
            const widget = document.getElementById(widgetId);
            if (widget) {
              widget.scrollIntoView({ behavior: 'smooth' });
            } else if (currentIframe) {
              currentIframe.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
          
        } catch (err) {
          console.warn('[Ctrl-Book] Error handling parametrized link click:', err);
        }
      }
    }, true); // Use capture phase to intercept BEFORE React does

    // 7. Watchdog to handle SPA dynamic remounts
    // Framer's React router might destroy and recreate the iframe on navigation
    setInterval(() => {
      const currentIframe = document.getElementById(SCRIPT_NAME);
      if (!currentIframe) return;
      
      const parentUrl = new URL(window.location.href);
      try {
        const url = new URL(currentIframe.src);
        let needsSync = false;

        ['date', 'promo'].forEach(param => {
          if (parentUrl.searchParams.has(param) && url.searchParams.get(param) !== parentUrl.searchParams.get(param)) {
            url.searchParams.set(param, parentUrl.searchParams.get(param));
            needsSync = true;
          }
        });

        if (needsSync) {
          // Framer remounted a fresh iframe without the URL params. We must force the src to include them.
          currentIframe.src = url.toString();
        }
      } catch (err) {
        // ignore invalid urls
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
