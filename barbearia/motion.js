'use strict';
/* Entradas determinísticas, sem depender do primeiro quadro do navegador.
   A preferência do sistema é respeitada; o visitante pode escolher no rodapé. */
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const buttons = Array.from(document.querySelectorAll('[data-motion-toggle]'));
  const records = [];
  const running = new Set();
  let observer, heroObserver, generation = 0, reduced = true, choice = 'auto';
  try { const saved = localStorage.getItem('barbearia-motion'); if (saved === 'full' || saved === 'reduced') choice = saved; } catch (_) {}
  const listen = (query, listener) => { if (typeof query.addEventListener === 'function') query.addEventListener('change', listener); else if (typeof query.addListener === 'function') query.addListener(listener); };
  function register(element, mode = 'rise', delay = 0) {
    if (!element || records.some(record => record.element === element)) return;
    element.classList.add('reveal', 'reveal--' + mode);
    element.style.setProperty('--reveal-delay', delay + 'ms');
    records.push({element, mode, delay, entered: false, animation: null});
  }
  function words(heading) {
    if (!heading) return;
    if (!heading.querySelector('.word-inner')) {
      heading.setAttribute('aria-label', Array.from(heading.childNodes).map(node => node.nodeName === 'BR' ? ' ' : node.textContent).join('').replace(/\s+/g, ' ').trim());
      const fragment = document.createDocumentFragment(); let index = 0;
      Array.from(heading.childNodes).forEach(node => {
        if (node.nodeType !== Node.TEXT_NODE) { fragment.append(node.cloneNode(true)); return; }
        node.textContent.split(/(\s+)/).forEach(token => {
          if (!token) return;
          if (/^\s+$/.test(token)) { fragment.append(document.createTextNode(token)); return; }
          const mask = document.createElement('span'); mask.className = 'word-mask'; mask.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span'); inner.className = 'word-inner'; inner.textContent = token; inner.style.setProperty('--word-index', index++);
          mask.append(inner); fragment.append(mask);
        });
      }); heading.replaceChildren(fragment);
    }
    register(heading, 'words');
  }
  function animate(element, frames, options) {
    if (typeof element.animate !== 'function') return null;
    const animation = element.animate(frames, options); running.add(animation);
    if (animation.finished && typeof animation.finished.then === 'function') animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    return animation;
  }
  function show(record) { record.element.classList.remove('is-pending'); record.element.classList.add('is-visible'); }
  function play(record, immediate = false) {
    if (record.animation) record.animation.cancel();
    record.entered = true; show(record);
    if (reduced || immediate) return;
    record.element.classList.toggle('motion-api', typeof record.element.animate === 'function');
    const options = {duration: 850, delay: record.delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards'};
    if (record.mode === 'words') {
      record.element.querySelectorAll('.word-inner').forEach((word, index) => animate(word, [{opacity:0, transform:'translateY(105%)'},{opacity:1, transform:'translateY(0)'}], {...options,duration:760,delay:record.delay + index * 65}));
    } else {
      const first = record.mode === 'fade' ? {opacity:0} : record.mode === 'mask' ? {opacity:0,clipPath:'inset(0 100% 0 0)'} : {opacity:0,transform:'translateY(28px)'};
      const last = record.mode === 'mask' ? {opacity:1,clipPath:'inset(0 0 0 0)'} : record.mode === 'fade' ? {opacity:1} : {opacity:1,transform:'translateY(0)'};
      record.animation = animate(record.element, [first,last], options);
    }
    // Compatibilidade com navegadores sem Web Animations API.
    if (typeof record.element.animate !== 'function') {
      record.element.classList.add('is-pending');
      requestAnimationFrame(() => requestAnimationFrame(() => show(record)));
    }
  }
  function stop() {
    generation++; if (observer) observer.disconnect(); if (heroObserver) heroObserver.disconnect();
    running.forEach(animation => animation.cancel()); running.clear();
    records.forEach(record => { record.animation = null; record.element.classList.remove('motion-api'); show(record); });
  }
  function start() {
    stop();
    reduced = choice === 'reduced' || (choice === 'auto' && preference.matches);
    root.setAttribute('data-motion', reduced ? 'reduced' : 'enabled');
    if (choice === 'full') root.setAttribute('data-motion-choice', 'full'); else root.removeAttribute('data-motion-choice');
    buttons.forEach(button => { button.textContent = reduced ? 'Ativar animações' : 'Reduzir animações'; button.setAttribute('aria-pressed', String(!reduced)); });
    const clipper = document.querySelector('.hero-clipper'); if (clipper) clipper.style.animationPlayState = reduced ? 'paused' : 'running';
    if (reduced) return;
    records.forEach(record => { record.entered = false; record.element.classList.remove('is-visible'); record.element.classList.add('is-pending'); });
    const ticket = generation;
    // Dois quadros garantem que o estado inicial seja pintado também no desktop.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (ticket !== generation || reduced) return;
      if (!('IntersectionObserver' in window)) { records.forEach(record => play(record)); return; }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const record = records.find(item => item.element === entry.target); if (!record) return;
          if (entry.isIntersecting && !record.entered) play(record);
          else if (!entry.isIntersecting && entry.boundingClientRect && (entry.boundingClientRect.bottom < -60 || entry.boundingClientRect.top > window.innerHeight + 60)) record.entered = false;
        });
      }, {threshold: 0, rootMargin:'0px 0px -18px 0px'});
      records.forEach(record => observer.observe(record.element));
      heroObserver = new IntersectionObserver(entries => { if (clipper) clipper.style.animationPlayState = entries[0].isIntersecting && !reduced ? 'running' : 'paused'; });
      const hero = document.querySelector('.hero'); if (hero) heroObserver.observe(hero);
    }));
  }
  window.openBarberDialog = (dialog, source) => {
    const from = source ? source.getBoundingClientRect() : null; dialog.showModal();
    if (reduced) return;
    const to = dialog.getBoundingClientRect();
    const x = from ? from.left + from.width/2 - to.left - to.width/2 : 0;
    const y = from ? from.top + from.height/2 - to.top - to.height/2 : 20;
    animate(dialog,[{opacity:0,transform:`translate(${x}px,${y}px) scale(.8)`},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:440,easing:'cubic-bezier(.22,1,.36,1)'});
  };
  try {
    register(document.querySelector('.header'),'fade'); register(document.querySelector('#hero-title'),'mask',80);
    register(document.querySelector('.hero-clipper'),'fade',180); register(document.querySelector('.hero-script'),'fade',280); register(document.querySelector('.hero-social'),'fade',360);
    words(document.querySelector('.hero-tagline')); register(document.querySelector('.hero-copy > p:nth-child(2)'),'rise',280); register(document.querySelector('.hero-copy .button'),'rise',380);
    document.querySelectorAll('.about h2,.section-heading h2,.team-copy h2,.styles-heading h2,.booking-copy h2').forEach(words);
    document.querySelectorAll('.about-copy .eyebrow,.section-heading .eyebrow,.styles-heading .eyebrow,.booking-copy .eyebrow').forEach(element=>register(element,'fade'));
    document.querySelectorAll('.about-copy > p:not(.eyebrow),.section-heading > p,.team-copy > p,.booking-copy > p:not(.eyebrow)').forEach(element=>register(element,'rise',90));
    register(document.querySelector('.about-phone'),'rise',140);register(document.querySelector('.about-copy .button'),'rise',180);register(document.querySelector('.about-portrait'),'fade',120);register(document.querySelector('.about-signature'),'fade',190);
    document.querySelectorAll('.service').forEach((element,index)=>register(element,'rise',(index%3)*100));
    register(document.querySelector('.gold-line'),'fade');register(document.querySelector('.team-copy .button'),'rise',130);register(document.querySelector('.hours'),'rise',150);
    const columns = window.matchMedia('(max-width:600px)').matches ? 1 : window.matchMedia('(max-width:1000px)').matches ? 2 : 3;
    document.querySelectorAll('.cut-card').forEach((element,index)=>register(element,'rise',(index%columns)*110));
    document.querySelectorAll('.cuts-intro,.cuts-note,.booking-form,.booking-info').forEach(element=>register(element,'rise',110));
    document.querySelectorAll('.footer-brand,.contact-details,.newsletter,.footer-social').forEach((element,index)=>register(element,'fade',index*65));
    document.querySelectorAll('.cut-card').forEach(card=>{
      card.addEventListener('pointermove',event=>{
        if (reduced || !finePointer.matches) return;
        const r=card.getBoundingClientRect();
        card.style.setProperty('--card-rx', ((.5-(event.clientY-r.top)/r.height)*2).toFixed(2)+'deg');
        card.style.setProperty('--card-ry', (((event.clientX-r.left)/r.width-.5)*2).toFixed(2)+'deg');
      });
      card.addEventListener('pointerleave',()=>{card.style.setProperty('--card-rx','0deg');card.style.setProperty('--card-ry','0deg');});
    });
    buttons.forEach(button => button.addEventListener('click',()=>{
      choice = reduced ? 'full' : 'reduced'; try {localStorage.setItem('barbearia-motion',choice);} catch (_) {} start();
    }));
    listen(preference,()=>{if(choice==='auto')start();});
    window.addEventListener('pageshow',event=>{if(event.persisted)start();});
    document.addEventListener('focusin',event=>{const record=records.find(item=>item.element.contains(event.target));if(record)play(record,true);});
    document.addEventListener('visibilitychange',()=>{const clipper=document.querySelector('.hero-clipper');if(clipper)clipper.style.animationPlayState=document.hidden||reduced?'paused':'running';});
    start();
  } catch(error) {
    stop();root.removeAttribute('data-motion');
    if(window.console && console.warn)console.warn('Animações em modo de compatibilidade:',error);
  }
})();
