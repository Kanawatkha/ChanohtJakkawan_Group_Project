/* =========================================================
   ChanohtJakkawan — main.js (UPDATED)
   Scope kept from baseline; changes in this patch ONLY:
   - Payment page: Populate DEED PREVIEW (name, address, items, order no., issued at, images)
   - NEW: When 2+ objects are selected, do NOT fallback to Solar.png
   - FIX: Ensure #deedImage is unhidden (remove 'd-none'/hidden) for SET or SINGLE selections
   - NEW: Contact page — enable/disable Send, reset on submit, success tick flash
   - PATCH: Contact page — robust selectors so #contactSend OR #contactSendBtn both work
   - Non‑targeted logic remains identical to previous version
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
  $$('.fab-menu-panel .fab-link').forEach(link => on(link, 'click', () => closePanel()))

  // =========================================================
  // Payment page: populate total from localStorage (non-invasive)
  // =========================================================
  ;(function initPaymentTotal() {
    const out = document.getElementById('payTotal');
    if (!out) return; // not on payment page
    try {
      const raw  = localStorage.getItem('orderTotal');
      const unit = localStorage.getItem('orderUnit'); // e.g., "Googolplexianth"
      if (raw && !isNaN(Number(raw))) {
        out.textContent = unit ? `${Number(raw)} ${unit}` : String(Number(raw));
      } else {
        out.textContent = '—';
      }
    } catch (e) {
      out.textContent = '—';
    }
  })();

  // =========================================================
  // Payment page: DEED PREVIEW population (name, address, items, order no., issued at, images)
  // =========================================================
  ;(function initPaymentDeedPreview(){
    // Detect payment page by presence of key preview fields
    const nameEl = document.getElementById('deedName');
    const addrEl = document.getElementById('deedAddress');
    const itemsEl = document.getElementById('deedItems');
    const titleEl = document.getElementById('deedTitle');
    const orderNoEl = document.getElementById('deedOrderNo');
    const issuedEl  = document.getElementById('deedIssuedAt');
    const anyPreview = nameEl || addrEl || itemsEl || titleEl || orderNoEl || issuedEl;
    if (!anyPreview) return; // not on payment page

    // --- Load persisted data ---
    let fields = {};
    let products = [];
    try { fields = JSON.parse(localStorage.getItem('orderFields') || '{}') || {}; } catch(_) { fields = {}; }
    try { products = JSON.parse(localStorage.getItem('orderProducts') || '[]') || []; } catch(_) { products = []; }

    // --- Name ---
    if (nameEl) {
      const full = (fields.fullName || '').toString().trim();
      nameEl.textContent = full || '—';
    }

    // --- Address (combine gracefully) ---
    if (addrEl) {
      const parts = [fields.addr1, fields.addr2, fields.city, fields.state, fields.zip, fields.country]
        .map(v => (v || '').toString().trim())
        .filter(Boolean);
      addrEl.textContent = parts.length ? parts.join(', ') : '—';
    }

    // --- Items text ---
    const ALL = ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
    const selected = Array.isArray(products) ? products.filter(k => ALL.includes(k)) : [];
    if (itemsEl) {
      let txt = '—';
      if (selected.length === ALL.length) txt = 'Solar System Set (9 objects)';
      else if (selected.length === 1) txt = cap(selected[0]);
      else if (selected.length > 1) txt = selected.map(cap).join(', ');
      itemsEl.textContent = txt;
    }

    // --- Title ---
    if (titleEl) {
      let title = 'Solar System Title Deed';
      if (selected.length === 1) {
        title = (selected[0] === 'sun') ? 'Star Title Deed' : `${cap(selected[0])} Title Deed`;
      } else if (selected.length > 1 && selected.length < ALL.length) {
        title = 'Multi‑Object Title Deed';
      } else if (selected.length === 0) {
        title = 'Title Deed Preview';
      }
      titleEl.textContent = title;
    }

    // --- Order No. (13 digits, group as 3 3 3 4). Persist per session so refresh keeps same ---
    let orderNo = null;
    try { orderNo = sessionStorage.getItem('deedOrderNo'); } catch(_) {}
    if (!orderNo) {
      orderNo = genOrderNo13();
      try { sessionStorage.setItem('deedOrderNo', orderNo); } catch(_) {}
    }
    if (orderNoEl) orderNoEl.textContent = orderNo || '—';

    // --- Issued At (always NOW when page is opened) ---
    if (issuedEl) issuedEl.textContent = formatIssuedAt(new Date());

    // --- Images ---
    renderDeedImages(selected);
  })();

  // =========================================================
  // Payment page: Finish button clears stored order state, then redirects
  // =========================================================
  ;(function initPaymentFinishClear(){
    // Detect payment page via #payTotal presence
    const isPayment = !!document.getElementById('payTotal');
    if (!isPayment) return;

    // Prefer the exact primary CTA used on payment page
    const finishBtn = document.querySelector('.payment-actions .btn.btn-primary.hero-buy');
    if (!finishBtn) return;

    on(finishBtn, 'click', function(e){
      // Keep default navigation only after we clear state
      e.preventDefault();
      try {
        // Clear all keys we used for persistence
        const keys = ['orderTotal','orderUnit','orderFields','orderProducts','deedOrderNo'];
        keys.forEach(k => {
          try { localStorage.removeItem(k); } catch(_) {}
          try { sessionStorage.removeItem(k); } catch(_) {}
        });
      } finally {
        // Redirect to original href after clearing
        const href = finishBtn.getAttribute('href') || '../index.html';
        window.location.href = href;
      }
    });
  })();

  // =========================================================
  // Index → Order preselect capture on index (unchanged)
  // =========================================================
  ;(function initIndexBuyPreselect(){
    const KEY = 'indexPreselectProduct';
    // Capture clicks from HERO Buy Now and each planet Buy button
    $$('.btn[data-role="index-buy"][data-product], a[data-role="index-buy"][data-product]').forEach(btn => {
      on(btn, 'click', () => {
        const prod = btn.getAttribute('data-product');
        if (!prod) return;
        try { sessionStorage.setItem(KEY, prod); } catch (_) {}
      });
    });
  })();

  // =========================================================
  // Index → Order preselect apply (post-restore scheduling; unchanged apart from comments)
  // =========================================================
  ;(function scheduleOrderPreselect(){
    const KEY = 'indexPreselectProduct';

    // Run only on order page: require at least one [data-product] checkbox
    const hasProducts = document.querySelector('input[type="checkbox"][data-product]');
    if (!hasProducts) return;

    let selected = null;
    try { selected = sessionStorage.getItem(KEY); } catch(_) {}
    if (!selected) return; // nothing to override

    const productKeys = ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];

    const getCb = (k) => document.querySelector(
      `input[type="checkbox"][data-product="${k}"], #prod-${k}, input[type="checkbox"][value="${k}"]`
    );

    const setCb = (k, checked) => {
      const cb = getCb(k);
      if (cb && cb.checked !== checked) {
        cb.checked = checked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    const setAll = (checked) => productKeys.forEach(k => setCb(k, checked));

    const setMaster = (checked) => {
      const master = document.querySelector(
        'input[type="checkbox"][data-product="set"], #prod-set, input[type="checkbox"][value="set"]'
      );
      if (master && master.checked !== checked) {
        master.checked = checked;
        master.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // Try after DOM & any restore() logic — retry briefly to beat timing races
    let tries = 10;
    const attempt = () => {
      const ready = !!document.querySelector('input[type="checkbox"][data-product]');
      if (!ready && --tries > 0) return setTimeout(attempt, 60);

      // --- Override with latest intent from index ---
      if (selected === 'set') {
        setAll(true);
        setMaster(true);
      } else if (productKeys.includes(selected)) {
        setAll(false);
        setCb(selected, true);
        setMaster(false);
      }

      // Open the product dropdown/collapse (if present) so user can see the result
      const collapsible = document.getElementById('productDropdown') || document.querySelector('[data-product-dropdown]');
      if (collapsible && collapsible.classList.contains('collapse')) {
        try { new bootstrap.Collapse(collapsible, { toggle: true }); } catch (_) {}
      }

      // Recompute totals / persist latest state (call if functions exist)
      try { if (typeof window.updateTotals === 'function') window.updateTotals(); } catch(_){ }
      try { if (typeof window.saveState    === 'function') window.saveState(); } catch(_){ }
      try { if (typeof window.validate     === 'function') window.validate(); } catch(_){ }

      // One-shot: remove so refresh doesn't re-apply
      try { sessionStorage.removeItem(KEY); } catch(_) {}
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attempt, { once: true });
    } else {
      setTimeout(attempt, 0);
    }
  })();

  // ---------- Local helpers (used by payment DEED PREVIEW) ----------
  function cap(k){ return k ? (k.charAt(0).toUpperCase() + k.slice(1)) : ''; }

  function genOrderNo13(){
    let s = '';
    for (let i=0;i<13;i++) s += Math.floor(Math.random()*10);
    return `${s.slice(0,3)} ${s.slice(3,6)} ${s.slice(6,9)} ${s.slice(9,13)}`;
  }

  function pad2(n){ return n < 10 ? '0'+n : ''+n; }
  function formatIssuedAt(d){
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  function planetSrc(key){
    const c = cap(key);
    // Try a few common paths; browser will fallback via handler below
    return [
      `../assets/img/${c}.png`,
      `../assets/img/${c}.webp`,
      `../assets/img/planets/${c}.png`,
      `../assets/img/planets/${c}.webp`,
      `../assets/img/${key}.png`,
      `../assets/img/${key}.webp`,
    ];
  }

  // PATCH: allow opting out of Solar.png fallback (used when multiple items are selected)
  function setImgWithFallback(img, sources, opts){
    const options = Object.assign({ fallbackToSolar: true, onFail: null }, opts);
    let i = 0;
    const tryNext = () => {
      if (i >= sources.length) {
        if (options.fallbackToSolar) {
          img.src = '../assets/img/Solar.png';
        } else {
          // no fallback for multi-selection: remove or hide this image
          if (typeof options.onFail === 'function') options.onFail(img);
          else img.style.display = 'none';
        }
        return;
      }
      const src = sources[i++];
      img.onerror = tryNext;
      img.src = src;
    };
    tryNext();
  }

  function renderDeedImages(selected){
    const single = document.getElementById('deedImage'); // may or may not exist
    const parent = (single && single.parentElement) || $('#deedImage')?.parentElement || document.querySelector('.deed-visual') || document.querySelector('#deedPreview') || document.body;

    const ALL = ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
    const isSet = selected.length === ALL.length;

    // Remove previous multi-group if any
    const oldGroup = document.getElementById('deedImages');
    if (oldGroup) oldGroup.remove();

    // Helper to ensure single image element
    const ensureSingle = () => {
      let img = document.getElementById('deedImage');
      if (!img) {
        img = document.createElement('img');
        img.id = 'deedImage';
        img.className = 'img-fluid d-block mx-auto';
        img.alt = 'Deed preview';
        parent.prepend(img);
      }
      // NEW: make sure it's visible if markup had 'd-none' or 'hidden'
      img.classList.remove('d-none', 'visually-hidden');
      img.removeAttribute('hidden');
      img.style.display = '';
      // ensure centering classes
      if (!img.classList.contains('mx-auto')) img.classList.add('mx-auto');
      if (!img.classList.contains('d-block')) img.classList.add('d-block');
      if (!img.classList.contains('img-fluid')) img.classList.add('img-fluid');
      return img;
    };

    if (isSet || selected.length === 0) {
      const img = ensureSingle();
      img.alt = 'Solar System preview';
      setImgWithFallback(img, ['../assets/img/Solar.png','../assets/img/solar.png'], { fallbackToSolar: true });
      return;
    }

    if (selected.length === 1) {
      const img = ensureSingle();
      const key = selected[0];
      img.alt = `${cap(key)} preview`;
      setImgWithFallback(img, planetSrc(key), { fallbackToSolar: true });
      return;
    }

    // Multiple images: hide single, create a centered wrap (NO Solar fallback)
    if (single) {
      single.classList.remove('mx-auto','d-block');
      single.style.display = 'none';
    }
    const wrap = document.createElement('div');
    wrap.id = 'deedImages';
    wrap.className = 'deed-images d-flex flex-wrap justify-content-center align-items-center gap-3';

    selected.forEach(key => {
      const img = document.createElement('img');
      img.className = 'img-fluid d-block';
      img.style.maxWidth = '120px';
      img.style.height = 'auto';
      img.alt = `${cap(key)} preview`;
      setImgWithFallback(img, planetSrc(key), {
        fallbackToSolar: false,
        onFail: (node) => node.remove()
      });
      wrap.appendChild(img);
    });

    parent.prepend(wrap);
  }

  // =========================================================
  // Contact page — enable/disable Send, reset on submit, success tick flash
  // (Patched to be tolerant to HTML id variants: #contactSend OR #contactSendBtn)
  // =========================================================
  (function initContactForm() {
    // รอให้ DOM พร้อม 100% (กันเคสโหลดสคริปต์เร็วกว่า DOM)
    const boot = () => {
      const form = document.getElementById('contactForm');
      if (!form) return; // หน้าอื่น ๆ ที่ไม่มีฟอร์ม ให้ข้ามไป

      // เลือก element แบบยืดหยุ่น: รองรับทั้ง id ตระกูล cName/... และ contactName/... และ name=""
      const pick = (...sels) => {
        for (const s of sels) {
          if (!s) continue;
          const el = form.querySelector(s) || document.querySelector(s);
          if (el) return el;
        }
        return null;
      };

      const nameEl  = pick('#cName',  '#contactName',  '[name="name"]');
      const phoneEl = pick('#cPhone', '#contactPhone', '[name="phone"]');
      const mailEl  = pick('#cEmail', '#contactEmail', '[name="email"]');
      const subjEl  = pick('#cSubject', '#contactSubject', '[name="subject"]');
      const msgEl   = pick('#cMessage', '#contactMessage', 'textarea[name="message"]', '[name="message"]');

      const sendBtn = pick('#contactSendBtn', '#contactSend');
      const success = document.getElementById('contactSuccess');

      // ตรวจครบ + อีเมลรูปแบบพื้นฐาน
      const emailOk = v => /\S+@\S+\.\S+/.test((v || '').trim());
      const filled  = el => !!(el && typeof el.value === 'string' && el.value.trim().length > 0);

      const updateBtn = () => {
        const ok =
          filled(nameEl) &&
          filled(phoneEl) &&
          emailOk(mailEl && mailEl.value) &&
          filled(subjEl) &&
          filled(msgEl);

        if (!sendBtn) return;
        // เปิด/ปิดปุ่มอย่างถูกต้อง ทั้ง disabled attribute และคลาส bootstrap
        sendBtn.disabled = !ok;
        sendBtn.setAttribute('aria-disabled', String(!ok));
        sendBtn.classList.toggle('disabled', !ok);
      };

      // ฟังทุกช่องแบบละเอียด + ฟังทั้งฟอร์ม (เผื่อ autofill/paste จาก browser)
      const fields = [nameEl, phoneEl, mailEl, subjEl, msgEl].filter(Boolean);
      ['input', 'change', 'keyup', 'paste'].forEach(ev => {
        fields.forEach(el => el.addEventListener(ev, updateBtn, false));
        form.addEventListener(ev, updateBtn, false);
      });

      // ส่งฟอร์ม (mock) — แสดงเครื่องหมายถูก, ล้างค่า, แล้วปิดปุ่มอีกครั้ง
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        updateBtn();
        if (sendBtn && sendBtn.disabled) return;

        // แสดง success tick สั้น ๆ
        if (success) {
          success.classList.remove('visually-hidden', 'd-none', 'hide');
          success.classList.add('show');            // ตรงกับ index.css animations
          setTimeout(() => success.classList.add('fade-in'), 10);
          setTimeout(() => {
            success.classList.remove('show', 'fade-in');
            success.classList.add('visually-hidden');
          }, 1500);
        }

        // รีเซ็ตค่า + ปิดปุ่มกลับเป็นจาง
        form.reset();
        updateBtn();
      }, false);

      // สถานะเริ่มต้น
      updateBtn();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  })();
})();

/* ===================== LOGIN PAGE APPEND =====================
   Scope: Only runs on Login_html/login.html (body.login-page)
   Purpose: Toggle sign-in/sign-up panels, manage submit enable state,
            redirect to ../index.html on successful Sign in, and
            reset + flip back to Sign in after successful Sign up.
   Notes: Appended safely; guards ensure no effect on other pages. */

(() => {
  const isLogin = document.body.classList.contains('login-page');
  if (!isLogin) return; // exit on non-login pages

  // ===== Panel toggle (from template) =====
  const container = document.querySelector('.container');
  const signInBtn  = document.querySelector('#sign-in-btn');
  const signUpBtn  = document.querySelector('#sign-up-btn');

  if (signUpBtn && container) {
    signUpBtn.addEventListener('click', () => {
      container.classList.add('sign-up-mode');
    });
  }
  if (signInBtn && container) {
    signInBtn.addEventListener('click', () => {
      container.classList.remove('sign-up-mode');
    });
  }

  // ===== Visual cue for filled inputs =====
  const allInputs = document.querySelectorAll('.input-field input, .input-field textarea, .input-field select');
  allInputs.forEach((inp) => {
    const wrap = inp.closest('.input-field');
    const update = () => {
      if (wrap) wrap.classList.toggle('has-value', inp.value.trim() !== '');
    };
    inp.addEventListener('input', update);
    update();
  });

  // ===== Utilities =====
  const getSubmitBtn = (form) => form && form.querySelector('button[type="submit"], input[type="submit"], .btn[type="submit"]');
  const getCheckFields = (form) => {
    // Prefer explicitly required fields; otherwise use all non-radio/checkbox inputs
    const req = form.querySelectorAll('input[required], textarea[required], select[required]');
    if (req.length) return req;
    return form.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), textarea, select');
  };
  const syncBtnStateFor = (form) => {
    if (!form) return;
    const submitBtn = getSubmitBtn(form);
    const fields = getCheckFields(form);
    const ok = Array.from(fields).every((el) => (el.value || '').trim() !== '');
    if (submitBtn) {
      submitBtn.disabled = !ok;
      submitBtn.classList.toggle('is-disabled', !ok);
      submitBtn.setAttribute('aria-disabled', String(!ok));
    }
  };
  const wireLiveValidation = (form) => {
    if (!form) return;
    form.addEventListener('input', () => syncBtnStateFor(form), true);
    syncBtnStateFor(form); // initial
  };

  // ===== Sign-in form =====
  const loginForm = document.querySelector('form.sign-in-form');
  wireLiveValidation(loginForm);
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = getSubmitBtn(loginForm);
      if (submitBtn && submitBtn.disabled) return; // guard
      // Redirect per spec (no extra reload logic here)
      window.location.href = '../index.html';
    });
  }

  // ===== Sign-up form =====
  const signupForm = document.querySelector('form.sign-up-form');
  wireLiveValidation(signupForm);
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = getSubmitBtn(signupForm);
      if (submitBtn && submitBtn.disabled) return; // guard

      // Reset data
      signupForm.reset();

      // Clear visual cues after reset
      signupForm.querySelectorAll('.input-field').forEach((w) => w.classList.remove('has-value'));

      // Re-disable submit after reset
      syncBtnStateFor(signupForm);

      // Flip animation back to Sign in
      if (container) container.classList.remove('sign-up-mode');

      // Optional: focus the first input of sign in for better UX
      const firstSignInInput = loginForm && loginForm.querySelector('input, textarea, select');
      if (firstSignInInput) firstSignInInput.focus();
    });
  }
})();