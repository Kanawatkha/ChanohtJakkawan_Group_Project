/* =========================================================
   ChanohtJakkawan — main.js (UPDATED: desktop-enabled FAB + anti-overlap + Payment total)
   Scope kept from baseline; changes:
   - FAB (floating hamburger) works on ALL viewports (desktop/tablet/mobile)
   - When FAB panel opens, temporarily hide/dim Back-to-Top to avoid overlap
   - NEW: Payment page total auto-population from localStorage (#payTotal)
   - All existing behaviors preserved: smooth scroll, navbar shadow, back-to-top
     animation, auto-collapse mobile nav, a11y for overlay View buttons
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

  if (backToTop) {
    backToTop.classList.add('hide'); // start hidden; CSS animates when toggled
    on(window, 'scroll', throttle(handleBackToTop, 80));
    handleBackToTop();
  }

  // Click on back-to-top should also focus #top (a11y)
  if (backToTop) {
    on(backToTop, 'click', () => {
      const target = $('#top');
      if (target) {
        target.setAttribute('tabindex', '-1');
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

  // =========================================================
  // Floating hamburger FAB + Mini overlay menu (ALL viewports)
  // =========================================================
  const fabBtn = $('#fabMenuBtn');
  const fabPanel = $('#fabMenuPanel');
  const header = $('.site-header');
  let fabVisible = false;
  let panelOpen = false;

  const isHeaderOffScreen = () => {
    if (!header) return window.scrollY > 160; // fallback threshold
    const rect = header.getBoundingClientRect();
    return rect.bottom <= 0; // header (navbar) is above viewport
  };

  const showFab = () => {
    if (!fabBtn) return;
    if (!fabVisible) {
      fabBtn.classList.remove('hide');
      fabBtn.classList.add('show');
      fabVisible = true;
    }
  };

  const hideFab = () => {
    if (!fabBtn) return;
    if (fabVisible) {
      fabBtn.classList.remove('show');
      fabBtn.classList.add('hide');
      fabVisible = false;
    }
  };

  const dimBackToTop = (dim) => {
    if (!backToTop) return;
    if (dim) {
      backToTop.style.opacity = '0';
      backToTop.style.pointerEvents = 'none';
    } else {
      backToTop.style.opacity = '';
      backToTop.style.pointerEvents = '';
    }
  };

  const openPanel = () => {
    if (!fabPanel || !fabBtn) return;
    fabPanel.classList.add('open');
    fabPanel.setAttribute('aria-hidden', 'false');
    fabBtn.setAttribute('aria-expanded', 'true');
    panelOpen = true;
    dimBackToTop(true); // prevent overlap/conflict while panel is open
    // Focus first link for a11y
    const firstLink = $('.fab-link', fabPanel);
    if (firstLink) firstLink.focus({ preventScroll: true });
  };

  const closePanel = () => {
    if (!fabPanel || !fabBtn) return;
    fabPanel.classList.remove('open');
    fabPanel.setAttribute('aria-hidden', 'true');
    fabBtn.setAttribute('aria-expanded', 'false');
    panelOpen = false;
    dimBackToTop(false); // restore back-to-top visibility/interaction
  };

  const handleFabVisibility = () => {
    if (!fabBtn) return;
    // Show when header is off-screen and user scrolled a bit
    if (window.scrollY > 160 && isHeaderOffScreen()) showFab();
    else { hideFab(); closePanel(); }
  };

  if (fabBtn) {
    fabBtn.classList.add('hide'); // start hidden
    on(window, 'scroll', throttle(handleFabVisibility, 80));
    on(window, 'resize', throttle(handleFabVisibility, 120));
    handleFabVisibility();

    // Toggle panel on FAB click
    on(fabBtn, 'click', () => {
      panelOpen ? closePanel() : openPanel();
    });
  }

  // Close panel on outside click
  on(document, 'click', (e) => {
    if (!panelOpen) return;
    if (!fabPanel || !fabBtn) return;
    const isInsidePanel = fabPanel.contains(e.target);
    const isFab = fabBtn.contains(e.target);
    if (!isInsidePanel && !isFab) closePanel();
  });

  // Close panel on Esc
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  // Close panel when navigating via panel links
  $$('.fab-menu-panel .fab-link').forEach(link => on(link, 'click', () => closePanel()));

  // =========================================================
  // Payment page: populate total from localStorage (non-invasive)
  // =========================================================
  (function initPaymentTotal() {
    const out = document.getElementById('payTotal');
    if (!out) return; // not on payment page
    try {
      const raw  = localStorage.getItem('orderTotal');
      const unit = localStorage.getItem('orderUnit'); // e.g., "million million million"
      if (raw && !isNaN(Number(raw))) {
        out.textContent = unit ? `${Number(raw)} ${unit}` : String(Number(raw));
      } else {
        out.textContent = '—';
      }
    } catch (e) {
      out.textContent = '—';
    }
  })();

})();