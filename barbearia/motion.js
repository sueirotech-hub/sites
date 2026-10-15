'use strict';
/* Adaptações próprias dos efeitos do catálogo naocodei.com:
   aparecer, subir e aparecer, cascata, cortina, palavras e inclinação.
   Nenhuma biblioteca, rolagem interceptada ou cursor substituído. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const targets = [];
  let observer;
  let heroObserver;

  function register(element, mode = 'rise', delay = 0) {
    if (!element || element.classList.contains('reveal')) return;
    element.classList.add('reveal', 'reveal--' + mode);
    element.style.setProperty('--reveal-delay', delay + 'ms');
    targets.push(element);
  }
  function words(heading) {
    if (!heading) return;
    const label = Array.from(heading.childNodes).map(node => node.nodeName === 'BR' ? ' ' : node.textContent).join('').replace(/\s+/g, ' ').trim();
    heading.setAttribute('aria-label', label);
    const fragment = document.createDocumentFragment();
    let index = 0;
    Array.from(heading.childNodes).forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) { fragment.append(node.cloneNode(true)); return; }
      node.textContent.split(/(\s+)/).forEach(token => {
        if (!token) return;
        if (/^\s+$/.test(token)) { fragment.append(document.createTextNode(token)); return; }
        const mask = document.createElement('span'); mask.className = 'word-mask'; mask.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span'); inner.className = 'word-inner'; inner.textContent = token; inner.style.setProperty('--word-index', index++);
        mask.append(inner); fragment.append(mask);
      });
    });
    heading.replaceChildren(fragment);
    register(heading, 'words');
  }
  function showAll() {
    root.removeAttribute('data-motion');
    targets.forEach(element => element.classList.add('is-visible'));
    if (observer) observer.disconnect();
    if (heroObserver) heroObserver.disconnect();
    const clipper = document.querySelector('.hero-clipper');
    if (clipper) clipper.style.animationPlayState = '';
    document.querySelectorAll('.style-tile').forEach(tile => {
      tile.style.setProperty('--tilt-x', '0deg'); tile.style.setProperty('--tilt-y', '0deg');
    });
  }

  // A janela nasce do elemento acionado e mantém o comportamento nativo do diálogo.
  window.openBarberDialog = (dialog, source) => {
    const start = source ? source.getBoundingClientRect() : null;
    dialog.showModal();
    if (preference.matches || typeof dialog.animate !== 'function') return;
    const end = dialog.getBoundingClientRect();
    const dx = start ? start.left + start.width / 2 - end.left - end.width / 2 : 0;
    const dy = start ? start.top + start.height / 2 - end.top - end.height / 2 : 16;
    const scaleX = start ? Math.min(1, Math.max(.35, start.width / Math.max(1, end.width))) : .96;
    const scaleY = start ? Math.min(1, Math.max(.35, start.height / Math.max(1, end.height))) : .96;
    dialog.animate([
      { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})` },
      { opacity: 1, transform: 'translate(0, 0) scale(1, 1)' }
    ], { duration: 440, easing: 'cubic-bezier(.22,1,.36,1)' });
  };

  try {
    register(document.querySelector('.header'), 'fade');
    register(document.querySelector('#hero-title'), 'mask', 100);
    register(document.querySelector('.hero-clipper'), 'fade', 240);
    register(document.querySelector('.hero-script'), 'fade', 360);
    register(document.querySelector('.hero-social'), 'fade', 420);
    words(document.querySelector('.hero-tagline'));
    register(document.querySelector('.hero-copy > p:nth-child(2)'), 'rise', 350);
    register(document.querySelector('.hero-copy .button'), 'rise', 450);
    document.querySelectorAll('.about h2, .section-heading h2, .team-copy h2, .styles-heading h2').forEach(words);
    document.querySelectorAll('.about-copy .eyebrow, .section-heading .eyebrow, .styles-heading .eyebrow').forEach(element => register(element, 'fade'));
    document.querySelectorAll('.about-copy > p:not(.eyebrow), .section-heading > p, .team-copy > p, .styles-heading > p').forEach(element => register(element, 'rise', 90));
    register(document.querySelector('.about-phone'), 'rise', 140);
    register(document.querySelector('.about-copy .button'), 'rise', 180);
    register(document.querySelector('.about-portrait'), 'fade', 150);
    register(document.querySelector('.about-signature'), 'fade', 240);
    const columns = window.matchMedia('(max-width: 760px)').matches ? 2 : 3;
    document.querySelectorAll('.service').forEach((element, index) => register(element, 'rise', (index % columns) * 95));
    register(document.querySelector('.gold-line'), 'fade', 90);
    register(document.querySelector('.team-copy .button'), 'rise', 180);
    register(document.querySelector('.hours'), 'rise', 130);
    const cutColumns = window.matchMedia('(max-width: 600px)').matches ? 1 : window.matchMedia('(max-width: 1000px)').matches ? 2 : 3;
    document.querySelectorAll('.cut-card').forEach((card, index) => register(card, 'rise', (index % cutColumns) * 95));
    register(document.querySelector('.cuts-intro'), 'rise', 90);
    register(document.querySelector('.cuts-note'), 'fade', 120);
    document.querySelectorAll('.style-tile').forEach((tile, index) => {
      register(tile, 'fade', index * 110);
      let frame = 0;
      tile.addEventListener('pointermove', event => {
        if (!finePointer.matches || preference.matches || !tile.classList.contains('is-visible')) return;
        const bounds = tile.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
        const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          tile.style.setProperty('--tilt-x', (-y * 3).toFixed(2) + 'deg');
          tile.style.setProperty('--tilt-y', (x * 3).toFixed(2) + 'deg'); frame = 0;
        });
      });
      tile.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame); frame = 0;
        tile.style.setProperty('--tilt-x', '0deg'); tile.style.setProperty('--tilt-y', '0deg');
      });
    });
    document.querySelectorAll('.footer-brand, .contact-details, .newsletter, .footer-social').forEach((element, index) => register(element, 'fade', index * 65));

    if (preference.matches || !('IntersectionObserver' in window)) { showAll(); return; }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .06, rootMargin: '0px 0px -24px 0px' });
    targets.forEach(element => observer.observe(element));
    root.setAttribute('data-motion', 'enabled');
    heroObserver = new IntersectionObserver(entries => {
      const clipper = document.querySelector('.hero-clipper');
      if (clipper) clipper.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
    });
    heroObserver.observe(document.querySelector('.hero'));
    preference.addEventListener('change', event => {
      if (event.matches) {
        showAll();
        if (typeof document.getAnimations === 'function') document.getAnimations().forEach(animation => animation.cancel());
      }
    });
    // Conteúdo focado pelo teclado é revelado imediatamente.
    document.addEventListener('focusin', event => {
      const target = event.target.closest('.reveal');
      if (target) { target.classList.add('is-visible'); observer.unobserve(target); }
    });
  } catch (error) {
    showAll();
  }
})();
