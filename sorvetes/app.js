(() => {
  'use strict';
  const products = window.CreameryProducts;
  const $ = selector => document.querySelector(selector);
  const hero = $('#inicio');
  let heroImage = $('#hero-image');
  let readyHeroImage = $('#hero-buffer-image');
  const heroProduct = $('.hero-product');
  const previousPreview = $('.edge-preview-previous');
  const nextPreview = $('.edge-preview-next');
  const tilt = $('.product-tilt');
  const showcase = $('.product-showcase');
  const previousButton = $('#previous-product');
  const nextButton = $('#next-product');
  const previousImage = $('#previous-image');
  const nextImage = $('#next-image');
  const video = $('#background-video');
  const menuButton = $('.menu-toggle');
  const mobileMenu = $('#mobile-nav');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cards = [...document.querySelectorAll('.product-card')];
  const rainFields = [...document.querySelectorAll('.rain-field')];
  const saveData = Boolean(navigator.connection?.saveData);
  let currentIndex = 0;
  let requestedIndex = 0;
  let mousePaused = false;
  let focusPaused = false;
  let heroVisible = true;
  let autoplay = null;
  let switchToken = 0;
  let videoReadyToLoad = false;
  let videoLoaded = false;
  let videoPending = false;
  let videoBlocked = false;
  let pointerFrame = 0;
  let productTransitions = [];
  let edgeEntrances = [];
  const imageCache = new Map();

  const motionPaused = () => reducedMotion.matches || saveData;
  const wrap = index => (index % products.length + products.length) % products.length;
  const assetFor = product => product.image;

  function preloadAsset(asset) {
    if (imageCache.has(asset)) return imageCache.get(asset);
    const image = new Image();
    image.decoding = 'async';
    image.src = asset;
    const ready = (image.decode
      ? image.decode()
      : new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; }))
      .then(() => image, error => { imageCache.delete(asset); throw error; });
    imageCache.set(asset, ready);
    return ready;
  }

  function primeNearby(index) {
    for (const offset of [-2, -1, 1, 2]) {
      preloadAsset(assetFor(products[wrap(index + offset)])).catch(() => {});
    }
  }

  function waitForVisibleImage(image) {
    if (image.decode) return image.decode();
    if (image.complete) return image.naturalWidth ? Promise.resolve() : Promise.reject(new Error('Image unavailable'));
    return new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    });
  }

  function decodeEdges() {
    return Promise.all([previousImage, nextImage].map(waitForVisibleImage));
  }

  function revealReadyEdges() {
    if ([previousImage, nextImage].every(image => image.complete && image.naturalWidth > 0)) {
      showcase.classList.remove('is-updating-edges');
    }
  }

  function updateEdgePreviews() {
    const previous = products[wrap(currentIndex - 1)];
    const next = products[wrap(currentIndex + 1)];
    const previousAsset = assetFor(previous);
    const nextAsset = assetFor(next);
    if (previousImage.getAttribute('src') !== previousAsset) previousImage.src = previousAsset;
    if (nextImage.getAttribute('src') !== nextAsset) nextImage.src = nextAsset;
    $('#previous-name').textContent = previous.name;
    $('#next-name').textContent = next.name;
    previousButton.setAttribute('aria-label', 'Ver produto anterior: ' + previous.name);
    previousButton.setAttribute('title', 'Ver produto anterior: ' + previous.name);
    nextButton.setAttribute('aria-label', 'Ver próximo produto: ' + next.name);
    nextButton.setAttribute('title', 'Ver próximo produto: ' + next.name);
  }

  function cancelProductTransition() {
    productTransitions.forEach(animation => animation?.cancel?.());
    productTransitions = [];
    edgeEntrances.forEach(animation => animation?.cancel?.());
    edgeEntrances = [];
    previousPreview.classList.remove('is-entering');
    nextPreview.classList.remove('is-entering');
    showcase.classList.remove('is-switching');
  }

  async function fadeHeroCopy(show) {
    if (motionPaused()) return;
    const animations = [...document.querySelectorAll('.hero-copy')].map(element => {
      if (show) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
      }
      element.getAnimations?.().forEach(animation => animation.cancel());
      const animation = element.animate?.(
        show
          ? [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }]
          : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }],
        { duration: show ? 320 : 150, easing: show ? 'cubic-bezier(.16,1,.3,1)' : 'ease-out', fill: 'both' }
      );
      if (show && animation?.finished) animation.finished.finally(() => {
        element.style.opacity = '';
        element.style.transform = '';
      });
      return animation;
    }).filter(Boolean);
    try { await Promise.all(animations.map(animation => animation.finished).filter(Boolean)); } catch { /* A newer selection replaced this fade. */ }
  }

  async function animateProductFromEdge(direction) {
    if (motionPaused() || !heroProduct.animate) return;
    const source = direction > 0 ? nextPreview : previousPreview;
    const destination = direction > 0 ? previousPreview : nextPreview;
    source.classList.add('is-entering');
    const centerOf = element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const from = centerOf(source);
    const center = centerOf(heroProduct);
    const to = centerOf(destination);
    const scaleIn = heroProduct.offsetWidth / source.offsetWidth || 2.9;
    const scaleOut = destination.offsetWidth / heroProduct.offsetWidth || .34;
    const outgoing = heroProduct.animate([
      { transform: 'translate3d(0,0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${to.x - center.x}px,${to.y - center.y}px,0) scale(${scaleOut}) rotate(${-direction * 9}deg)`, opacity: .32 }
    ], { duration: 620, easing: 'cubic-bezier(.22,.8,.22,1)', fill: 'both' });
    const incoming = source.animate([
      { transform: `translate3d(0,0,0) scale(1) rotate(${direction * 9}deg)`, opacity: .48 },
      { transform: `translate3d(${center.x - from.x}px,${center.y - from.y}px,0) scale(${scaleIn}) rotate(0deg)`, opacity: 1 }
    ], { duration: 620, easing: 'cubic-bezier(.22,.8,.22,1)', fill: 'both' });
    productTransitions = [outgoing, incoming].filter(Boolean);
    const finished = productTransitions.map(animation => animation.finished).filter(Boolean);
    if (!finished.length) return;
    try { await Promise.all(finished); } catch { /* A newer navigation cancelled this transition. */ }
  }

  function bringInNewEdge(direction) {
    if (motionPaused()) return;
    const edge = direction > 0 ? nextPreview : previousPreview;
    const settledEdge = direction > 0 ? previousPreview : nextPreview;
    const angle = direction * 9;
    const incoming = edge.animate?.([
      { transform: `translate3d(${direction * 30}px,0,0) scale(.84) rotate(${angle * 1.4}deg)`, opacity: 0 },
      { transform: `translate3d(0,0,0) scale(1) rotate(${angle}deg)`, opacity: .48 }
    ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    const settled = settledEdge.animate?.([
      { transform: `rotate(${-angle}deg)`, opacity: .32 },
      { transform: `rotate(${-angle}deg)`, opacity: .48 }
    ], { duration: 280, easing: 'ease-out', fill: 'both' });
    edgeEntrances = [incoming, settled].filter(Boolean);
    edgeEntrances.forEach(animation => animation.finished?.then(() => {
      animation.cancel();
      edgeEntrances = edgeEntrances.filter(item => item !== animation);
    }).catch(() => {}));
  }

  function commitHeroImage(product) {
    heroImage.classList.remove('is-active');
    heroImage.alt = '';
    heroImage.setAttribute('aria-hidden', 'true');
    readyHeroImage.alt = product.name + ', ' + product.tag.toLowerCase();
    readyHeroImage.removeAttribute('aria-hidden');
    readyHeroImage.classList.add('is-active');
    heroImage.id = '';
    readyHeroImage.id = 'hero-image';
    heroImage.id = 'hero-buffer-image';
    [heroImage, readyHeroImage] = [readyHeroImage, heroImage];
  }

  function syncAutoplay() {
    if (autoplay !== null) { window.clearInterval(autoplay); autoplay = null; }
    if (motionPaused() || mousePaused || focusPaused || !heroVisible || document.hidden) return;
    autoplay = window.setInterval(() => showProduct(requestedIndex + 1, false, 1), 8500);
  }

  function resetTilt() {
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    tilt.style.setProperty('--pointer-x', '0px');
    tilt.style.setProperty('--pointer-y', '0px');
  }

  function syncVideo() {
    if (motionPaused() || document.hidden || !heroVisible || !videoReadyToLoad) {
      video.pause();
      return;
    }
    if (!videoLoaded) {
      const sources = [...video.querySelectorAll('source')];
      const source = sources.find(item => !item.media || window.matchMedia(item.media).matches);
      if (!source) return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      if (video.dataset.poster) video.poster = video.dataset.poster;
      const sourceUrl = source.dataset.src || source.getAttribute?.('src');
      if (!video.currentSrc && !video.src && sourceUrl) video.src = sourceUrl;
      video.load();
      videoLoaded = true;
    }
    if (!video.paused || videoPending) return;
    videoPending = true;
    const attempt = video.play();
    Promise.resolve(attempt).then(() => {
      videoBlocked = false;
      if (motionPaused() || document.hidden || !heroVisible) video.pause();
    }).catch(() => {
      // Safari's energy-saving mode may need a direct user gesture.
      videoBlocked = true;
    }).finally(() => {
      videoPending = false;
    });
  }

  function updateMotion() {
    const paused = motionPaused();
    document.documentElement.classList.toggle('motion-paused', paused);
    document.documentElement.classList.toggle('page-hidden', document.hidden);
    if (paused) resetTilt();
    syncAutoplay();
    syncVideo();
  }

  function renderCopy(product) {
    $('#hero-category').textContent = product.tag;
    $('#hero-name').textContent = product.name;
    $('#hero-description').textContent = product.description;
    $('#hero-detail').textContent = product.detail;
    $('#hero-image-caption').textContent = product.name;
  }

  function renderProduct(product, manual) {
    renderCopy(product);
    $('#slide-count').textContent = String(currentIndex + 1).padStart(2, '0') + ' / ' + products.length;
    heroImage.alt = product.name + ', ' + product.tag.toLowerCase();
    updateEdgePreviews();
    cards.forEach(card => card.classList.toggle('selected', card.dataset.productId === product.id));
    if (manual) $('#slide-status').textContent = product.name + '. Produto ' + (currentIndex + 1) + ' de ' + products.length + '.';
  }

  async function showProduct(index, manual = true, direction = 0) {
    requestedIndex = wrap(index);
    const target = requestedIndex;
    const product = products[target];
    const token = ++switchToken;
    showcase.classList.add('is-updating-edges');
    cancelProductTransition();
    updateEdgePreviews();
    hero.setAttribute('aria-busy', 'true');
    if (manual) syncAutoplay();
    if (target === currentIndex) {
      const textTransition = fadeHeroCopy(true);
      try { await Promise.all([decodeEdges(), textTransition]); } catch { /* Keep unavailable previews concealed. */ }
      if (token !== switchToken) return;
      renderCopy(product);
      revealReadyEdges();
      hero.setAttribute('aria-busy', 'false');
      return;
    }
    const incomingAsset = assetFor(product);
    readyHeroImage.srcset = '';
    if (readyHeroImage.getAttribute('src') !== incomingAsset) readyHeroImage.src = incomingAsset;
    try {
      await Promise.all([
        ...[-1, 0, 1].map(offset => preloadAsset(assetFor(products[wrap(target + offset)]))),
        decodeEdges(),
        waitForVisibleImage(readyHeroImage)
      ]);
    } catch {
      if (token !== switchToken) return;
      requestedIndex = currentIndex;
      revealReadyEdges();
      hero.setAttribute('aria-busy', 'false');
      if (manual) $('#slide-status').textContent = 'Não foi possível carregar esse sabor. Tente novamente.';
      return;
    }
    if (token !== switchToken) return;
    if (!direction) {
      const forward = wrap(target - currentIndex);
      const backward = wrap(currentIndex - target);
      direction = forward <= backward ? 1 : -1;
    }
    const sourceImage = direction > 0 ? nextImage : previousImage;
    if (sourceImage.getAttribute('src') !== incomingAsset) {
      sourceImage.src = incomingAsset;
      try { await waitForVisibleImage(sourceImage); } catch {
        if (token !== switchToken) return;
        requestedIndex = currentIndex;
        updateEdgePreviews();
        decodeEdges().then(() => { if (token === switchToken) revealReadyEdges(); }).catch(() => {});
        hero.setAttribute('aria-busy', 'false');
        if (manual) $('#slide-status').textContent = 'Não foi possível carregar esse sabor. Tente novamente.';
        return;
      }
      if (token !== switchToken) return;
    }
    revealReadyEdges();
    showcase.classList.add('is-switching');
    const visualTransition = animateProductFromEdge(direction);
    await fadeHeroCopy(false);
    if (token !== switchToken) return;
    renderCopy(product);
    const textTransition = fadeHeroCopy(true);
    await Promise.all([visualTransition, textTransition]);
    if (token !== switchToken) return;
    showcase.classList.add('is-updating-edges');
    cancelProductTransition();
    commitHeroImage(product);
    currentIndex = target;
    renderProduct(product, manual);
    try { await decodeEdges(); } catch { /* Leave incomplete previews concealed. */ }
    if (token !== switchToken) return;
    revealReadyEdges();
    bringInNewEdge(direction);
    primeNearby(currentIndex);
    hero.setAttribute('aria-busy', 'false');
  }

  function filterProducts(category) {
    const filter = ['all', 'acai', 'sorvete'].includes(category) ? category : 'all';
    let visible = 0;
    cards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) { visible += 1; card.classList.remove('is-waiting'); }
    });
    document.querySelectorAll('[data-filter]').forEach(button => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('#product-count').textContent = visible + ' sabores para descobrir';
  }

  function closeMenu(returnFocus = false) {
    const wasOpen = !mobileMenu.hidden;
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
    menuButton.setAttribute('title', 'Abrir menu');
    if (returnFocus && wasOpen) menuButton.focus();
  }

  previousButton.addEventListener('click', () => showProduct(requestedIndex - 1, true, -1));
  nextButton.addEventListener('click', () => showProduct(requestedIndex + 1, true, 1));
  hero.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' ? -1 : 1;
    showProduct(requestedIndex + direction, true, direction);
  });
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('pagehide', () => video.pause());
  window.addEventListener('pageshow', updateMotion);

  // Retry blocked inline playback on the first real tap, without autoplaying audio.
  const retryVideo = () => {
    if (videoBlocked && !motionPaused()) syncVideo();
  };
  document.addEventListener('pointerdown', retryVideo, { passive: true });
  document.addEventListener('keydown', retryVideo);

  hero.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') { mousePaused = true; syncAutoplay(); }
  });
  hero.addEventListener('pointerleave', () => { mousePaused = false; resetTilt(); syncAutoplay(); });
  hero.addEventListener('focusin', () => { focusPaused = true; syncAutoplay(); });
  hero.addEventListener('focusout', event => {
    if (!hero.contains(event.relatedTarget)) { focusPaused = false; syncAutoplay(); }
  });

  // Touch interaction remains vertical-scroll friendly.
  let touchStart = null;
  showcase.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && !event.target.closest('button')) touchStart = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  showcase.addEventListener('pointerup', event => {
    if (!touchStart) return;
    const x = event.clientX - touchStart.x;
    const y = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(x) > 55 && Math.abs(x) > Math.abs(y) * 1.5) {
      const direction = x < 0 ? 1 : -1;
      showProduct(requestedIndex + direction, true, direction);
    }
  }, { passive: true });
  showcase.addEventListener('pointercancel', () => { touchStart = null; });

  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => filterProducts(button.dataset.filter)));
  document.querySelectorAll('[data-filter-link]').forEach(link => link.addEventListener('click', () => { filterProducts(link.dataset.filterLink); closeMenu(); }));
  document.querySelectorAll('[data-show-product]').forEach(button => button.addEventListener('click', async () => {
    const index = products.findIndex(product => product.id === button.dataset.showProduct);
    if (index < 0) return;
    await showProduct(index);
    hero.scrollIntoView({ behavior: motionPaused() ? 'auto' : 'smooth', block: 'start' });
    hero.focus({ preventScroll: true });
  }));
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    mobileMenu.hidden = isOpen;
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    menuButton.setAttribute('title', isOpen ? 'Abrir menu' : 'Fechar menu');
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', () => closeMenu());

  if ('IntersectionObserver' in window) {
    const heroObserver = new window.IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      document.documentElement.classList.toggle('hero-offscreen', !heroVisible);
      syncAutoplay();
      syncVideo();
    }, { threshold: .12 });
    heroObserver.observe(hero);
    if (!reducedMotion.matches) {
      const revealObserver = new window.IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-waiting');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: .06, rootMargin: '0px 0px 35px 0px' });
      document.querySelectorAll('.reveal').forEach((element, index) => {
        element.classList.add('is-waiting');
        element.style.setProperty('--reveal-delay', (index % 4 * 45) + 'ms');
        revealObserver.observe(element);
      });
    }
    const rainObserver = new window.IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('rain-paused', !entry.isIntersecting));
    }, { threshold: .01, rootMargin: '180px 0px' });
    rainFields.forEach(field => rainObserver.observe(field));
  }

  if (finePointer.matches) {
    showcase.addEventListener('pointermove', event => {
      if (motionPaused() || !heroVisible) return;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        const bounds = showcase.getBoundingClientRect();
        tilt.style.setProperty('--pointer-x', ((event.clientX - bounds.left) / bounds.width - .5) * 9 + 'px');
        tilt.style.setProperty('--pointer-y', ((event.clientY - bounds.top) / bounds.height - .5) * 6 + 'px');
      });
    }, { passive: true });
    showcase.addEventListener('pointerleave', resetTilt);
  }

  // Keep the opening image and type ahead of the decorative video and carousel cache.
  window.addEventListener('load', () => {
    const afterIdle = callback => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 2500 });
      else window.setTimeout(callback, 600);
    };
    afterIdle(() => {
      videoReadyToLoad = true;
      syncVideo();
      afterIdle(() => primeNearby(currentIndex));
    });
  }, { once: true });
  $('#year').textContent = new Date().getFullYear();
  renderProduct(products[0], false);
  updateMotion();
})();
