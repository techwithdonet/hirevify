import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const selectors = [
      '[data-reveal]',
      'header + section h1',
      'header + section p',
      'header + section button',
      'header + section a',
      'header + section hr',
      'header + section [class*="grid"] > *',
      'section[id="features"] h2',
      'section[id="features"] p',
      'section[id="features"] [class*="grid"] > *',
      'section[id="how-it-works"] h2',
      'section[id="how-it-works"] p',
      'section[id="how-it-works"] [class*="grid"] > *',
      'section[id="testimonials"] h2',
      'section[id="testimonials"] p',
      'section[id="testimonials"] [class*="grid"] > *',
      'section:last-of-type h2',
      'section:last-of-type p',
      'section:last-of-type button',
      'section:last-of-type a',
      'section:last-of-type [class*="grid"] > *',
      'footer > div'
    ].join(',');

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors));
    const uniqueElements = Array.from(new Set(elements));

    uniqueElements.forEach((element, index) => {
      element.classList.add('hv-reveal');

      const parent = element.parentElement;
      const isGridChild = parent?.className?.toString().includes('grid');

      if (isGridChild) {
        element.style.setProperty('--hv-delay', String(Math.min(index % 6, 5)));
      }
    });

    const dashboardCard = document.querySelector<HTMLElement>('header + section [class*="shadow-2xl"]');
    dashboardCard?.classList.add('hv-float');

    if (prefersReducedMotion) {
      uniqueElements.forEach((element) => element.classList.add('hv-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          element.classList.add('hv-revealed');
          observer.unobserve(element);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -70px 0px',
      }
    );

    uniqueElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}
