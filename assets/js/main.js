/* =========================================================
   ChanohtJakkawan — main.js (shared for landing)
   Responsibilities:
   - Smooth scroll for in-page anchors
   - Back-to-top visibility & keyboard focus support
   - Navbar behaviors (shadow on scroll, auto-collapse on link click)
   - Year auto-inject in footer
   - Defensive (runs safely even if certain elements are missing)
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

  // ---------- Back to Top visibility ----------
  const backToTop = $('.back-to-top');
  const toggleBackToTop = () => {
    if (!backToTop) return;
    const show = window.scrollY > 280;
    backToTop.classList.toggle('d-none', !show);
  };
  // Start hidden until user scrolls
  if (backToTop) backToTop.classList.add('d-none');
  on(window, 'scroll', throttle(toggleBackToTop, 100));
  toggleBackToTop();

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
      // Collapse only if toggler is visible (mobile)
      const togglerStyle = window.getComputedStyle($('.navbar-toggler'));
      if (togglerStyle && togglerStyle.display !== 'none') collapse();
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