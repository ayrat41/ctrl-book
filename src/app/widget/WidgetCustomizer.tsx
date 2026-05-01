"use client";

import { useEffect } from "react";

export default function WidgetCustomizer() {
  useEffect(() => {
    // 1. Detect Environment & Apply Core Classes
    const params = new URLSearchParams(window.location.search);
    const isEmbedded = window.self !== window.top;
    const isDark = params.get('darkMode') === 'true';

    if (isEmbedded) {
      document.body.classList.add('is-embedded');
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else if (params.has('darkMode')) {
      // If parameter exists but is NOT 'true', ensure dark mode is off
      document.documentElement.classList.remove('dark');
    }

    // Resizing is disabled to keep the widget the same size always
    // 2. Communication with Parent (Resizing)
    // const sendHeight = () => {
    //   const height = document.documentElement.scrollHeight || document.body.scrollHeight;
    //   window.parent.postMessage({ type: 'ctrl-book-resize', height }, '*');
    // };

    // const resizeObserver = new ResizeObserver(() => {
    //   sendHeight();
    // });
    
    // resizeObserver.observe(document.body);
    // sendHeight();
    // window.addEventListener('resize', sendHeight);

    return () => {
      // resizeObserver.disconnect();
      // window.removeEventListener('resize', sendHeight);
    };
  }, []);

  return null;
}
