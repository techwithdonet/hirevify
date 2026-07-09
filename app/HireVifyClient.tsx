'use client';

import { useEffect } from 'react';
import HireVifyApp from '../src/hirevify-app/App';

export default function HireVifyClient() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    scrollToTop();

    const frame = window.requestAnimationFrame(scrollToTop);
    const timer = window.setTimeout(scrollToTop, 80);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  return <HireVifyApp />;
}
