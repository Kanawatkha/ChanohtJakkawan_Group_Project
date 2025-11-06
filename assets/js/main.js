/* =========================================================
   ChanohtJakkawan — main.js (UPDATED per improvement spec)
   Scope of changes:
   - Back-to-Top: use .show/.hide classes for animated appear/disappear
   - Keep previous behaviors: smooth scroll, navbar shadow, auto-collapse, a11y for overlay View
   - Do not alter unrelated logic
   ========================================================= */

(function () {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts || false);
  const throttle = (fn, wait = 100) => {
    let t = 0;
    return (...args) => {
      const now = Date.now();
      if (now - t >= wait) { t = now; fn.apply(null, args); }
    };
  };

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Year in footer ----------
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Smooth scroll for anchors with [data-scroll] ----------
  const anchorLinks = $$('a[data-scroll]');
  anchorLinks.forEach(a => on(a, 'click', (e) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') && href.length > 1) {
      const target = $(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        // Close mobile nav if open
        const navMenu = $('#navMenu');
        const bsCollapse = navMenu && bootstrap.Collapse.getInstance(navMenu);
        if (bsCollapse) bsCollapse.hide();
        // Manage focus for a11y
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  }));

  // ---------- Back to Top (enhanced animation control) ----------
  const backToTop = $('.back-to-top');
  const threshold = 280;
  let isShown = false;

  const showBackToTop = () => {
    if (!backToTop) return;
    if (!isShown) {
      backToTop.classList.remove('hide');
      backToTop.classList.add('show');
      isShown = true;
    }
  };

  const hideBackToTop = () => {
    if (!backToTop) return;
    if (isShown) {
      backToTop.classList.remove('show');
      backToTop.classList.add('hide');
      isShown = false;
    }
  };

  const handleBackToTop = () => {
    if (!backToTop) return;
    if (window.scrollY > threshold) showBackToTop();
    else hideBackToTop();
  };

  // Initialize back-to-top state
  if (backToTop) {
    backToTop.classList.add('hide'); // start hidden; CSS animates when toggled
    on(window, 'scroll', throttle(handleBackToTop, 80));
    handleBackToTop();
  }

  // Click on back-to-top should also focus #top (a11y)
  if (backToTop) {
    on(backToTop, 'click', (e) => {
      const target = $('#top');
      if (target) {
        target.setAttribute('tabindex', '-1');
        // Let browser jump via href; then focus after a tick
        setTimeout(() => target.focus({ preventScroll: true }), 50);
      }
    });
  }

  // ---------- Navbar shadow on scroll ----------
  const navbar = $('#navbar');
  const setNavShadow = () => {
    if (!navbar) return;
    const method = window.scrollY > 4 ? 'add' : 'remove';
    navbar.classList[method]('shadow-sm');
  };
  on(window, 'scroll', throttle(setNavShadow, 100));
  setNavShadow();

  // ---------- Auto-collapse mobile nav when clicking nav links/CTAs ----------
  const navMenu = $('#navMenu');
  if (navMenu) {
    const collapse = () => {
      const bsCollapse = bootstrap.Collapse.getInstance(navMenu);
      if (bsCollapse) bsCollapse.hide();
    };
    $$('.navbar-nav .nav-link, .navbar .btn').forEach(el => on(el, 'click', () => {
      const toggler = $('.navbar-toggler');
      if (!toggler) return;
      const display = window.getComputedStyle(toggler).display;
      if (display && display !== 'none') collapse();
    }));
  }

  // ---------- Keyboard support for overlay "View" buttons (enter/space) ----------
  $$('.card-overlay-btn').forEach(btn => {
    btn.setAttribute('tabindex', '0');
    on(btn, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const href = btn.getAttribute('href');
        if (href) window.location.href = href;
      }
    });
  });

})();
