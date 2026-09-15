/* BRG Creative Group — site.js
   Shared behavior: nav state, mobile menu, dropdown, scroll reveal,
   scroll-triggered video playback, reel sound toggle. No dependencies. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav: hairline appears once the page has scrolled ---- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var hero = document.querySelector('[data-hero]');
    var darkUntil = 0;
    var measure = function () { darkUntil = hero ? hero.offsetHeight - nav.offsetHeight : 0; };
    var setScrolled = function () {
      var y = window.scrollY;
      nav.classList.toggle('scrolled', y > 8);
      if (hero) nav.classList.toggle('on-dark', y < darkUntil);
    };
    measure(); setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
    window.addEventListener('resize', function () { measure(); setScrolled(); }, { passive: true });
  }

  /* ---- Mobile menu ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    var closeMenu = function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (nav) nav.classList.remove('menu-open');
      document.body.style.overflow = '';
    };
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (nav) nav.classList.toggle('menu-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---- Resources dropdown (click on touch, hover on desktop via CSS) ---- */
  document.querySelectorAll('.dd').forEach(function (dd) {
    var btn = dd.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = dd.getAttribute('data-open') === 'true';
      dd.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) {
        dd.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });

  /* ---- Scroll reveal: once, from an already-legible offset ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            ro.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { ro.observe(el); });
    }
  }

  /* ---- Videos: play in view, pause out of view. Poster stays if blocked. ---- */
  var videos = document.querySelectorAll('video[data-autoplay]');
  /* Lazy sources: a video with data-src downloads nothing until it is near the viewport */
  var loadSrc = function (v) {
    if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster;
    if (v.dataset.src && !v.dataset.loaded) {
      v.src = v.dataset.src;
      v.dataset.loaded = '1';
      v.load();
    }
  };
  /* The hero loop starts after the first paint so the poster and text land first */
  var eager = document.querySelector('video[data-eager]');
  if (eager && !reduceMotion) {
    var startHero = function () { loadSrc(eager); var p = eager.play(); if (p !== undefined) p.catch(function () {}); };
    if (document.readyState === 'complete') setTimeout(startHero, 150);
    else window.addEventListener('load', function () { setTimeout(startHero, 150); });
  }
  var tryPlay = function (v) {
    loadSrc(v);
    var p = v.play();
    if (p !== undefined) p.catch(function () {});
  };
  if (videos.length && !reduceMotion) {
    if (!('IntersectionObserver' in window)) {
      videos.forEach(tryPlay);
    } else {
      var vo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) tryPlay(v);
          else if (!v.paused) v.pause();
        });
      }, { threshold: 0.05, rootMargin: '240px 0px' });
      videos.forEach(function (v) { vo.observe(v); });
    }
    var unlock = function () {
      videos.forEach(function (v) { if (v.paused && (v.dataset.loaded || !v.dataset.src)) tryPlay(v); });
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock);
  }

  /* ---- Reel sound toggle: one reel with audio at a time ---- */
  var soundBtns = document.querySelectorAll('.sound-btn');
  soundBtns.forEach(function (btn) {
    var wrap = btn.closest('.reel');
    var video = wrap && wrap.querySelector('video');
    if (!video) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var turningOn = video.muted;
      if (turningOn) {
        document.querySelectorAll('.reel video').forEach(function (v) { if (v !== video) v.muted = true; });
        soundBtns.forEach(function (b) { if (b !== btn) { b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); } });
        video.muted = false;
        tryPlay(video);
      } else {
        video.muted = true;
      }
      btn.classList.toggle('is-on', !video.muted);
      btn.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
    });
  });
})();
