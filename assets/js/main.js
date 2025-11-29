/* =========================================================
   ChanohtJakkawan — main.js (v5.6 Final - Overhaul Edition)
   Full Stack SPA Logic: Calculator, Dynamic ID Card, Ticker
   ========================================================= */

(function () {
    "use strict";

    // ---------------------------------------------------------
    // 1. Helpers & Utilities
    // ---------------------------------------------------------
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const formatCurrency = (val) => `${val.toLocaleString()} GD`;
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    // NEW: Generate Random Galactic ID
    const generateGalacticID = () => {
        const segment = () => Math.floor(1000 + Math.random() * 9000);
        return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    // NEW: Random Planet Origin
    const randomOrigin = () => {
        const origins = ['TERRA', 'MARS COLONY', 'TITAN BASE', 'EUROPA', 'KEPLER-186F', 'ANDROMEDA STATION'];
        return origins[Math.floor(Math.random() * origins.length)];
    };

    // ---------------------------------------------------------
    // 2. Router System (Single Page Application Core)
    // ---------------------------------------------------------
    window.router = function(pageName) {
        $$('.page-section').forEach(section => {
            section.classList.remove('active-section');
            section.classList.add('d-none');
        });

        const target = $(`#page-${pageName}`);
        if (target) {
            target.classList.remove('d-none');
            setTimeout(() => {
                target.classList.add('active-section');
            }, 10);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        const navbar = $('#main-header');
        const footer = $('#main-footer');
        
        if (pageName === 'login' || pageName === 'view-3d') {
            navbar.style.display = 'none';
            if(footer) footer.style.display = 'none';
        } else {
            navbar.style.display = 'block';
            if(footer) footer.style.display = 'block';
        }

        if (pageName === 'payment') initPaymentPage();
        if (pageName === 'order') updateOrderTotals();
        
        const navMenu = $('#navMenu');
        const toggler = $('.navbar-toggler');
        if (navMenu && navMenu.classList.contains('show')) {
            toggler.click();
        }
    };

    // ---------------------------------------------------------
    // 3. UI Interactions (Menu & Touch)
    // ---------------------------------------------------------
    document.addEventListener('click', function(e) {
        const navMenu = $('#navMenu');
        const toggler = $('.navbar-toggler');
        if (navMenu && navMenu.classList.contains('show') && 
            !navMenu.contains(e.target) && !toggler.contains(e.target)) {
            toggler.click();
        }
    });

    const touchCards = $$('.product-img-wrapper, .team-img-wrapper, .sun-wrapper');
    touchCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
            const isActive = this.classList.contains('tap-active');
            touchCards.forEach(c => c.classList.remove('tap-active'));
            if (!isActive) this.classList.add('tap-active');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.product-img-wrapper') && 
            !e.target.closest('.team-img-wrapper') &&
            !e.target.closest('.sun-wrapper')) {
            touchCards.forEach(c => c.classList.remove('tap-active'));
        }
    });

    // ---------------------------------------------------------
    // 4. Order Logic (Calculator & Storage)
    // ---------------------------------------------------------
    const productCheckboxes = $$('.product'); 
    const addonCheckboxes = $$('.product-addon');
    const selectAllCheckbox = $('#selectAll');
    
    function updateOrderTotals() {
        let total = 0;
        const summaryList = $('#summaryList');
        if (summaryList) summaryList.innerHTML = '';
        
        let selectedItems = [];
        let selectedAddons = [];

        // Products
        productCheckboxes.forEach(cb => {
            if (cb.checked) {
                const price = parseInt(cb.getAttribute('data-price') || 0);
                const name = cb.id;
                total += price;
                selectedItems.push(name);

                const li = document.createElement('li');
                li.className = "d-flex justify-content-between text-muted-light";
                li.innerHTML = `<span>${capitalize(name)}</span> <span class="text-gold">${price} GD</span>`;
                summaryList.appendChild(li);
            }
        });

        // Add-ons
        if (selectedItems.length > 0) { 
            addonCheckboxes.forEach(cb => {
                cb.disabled = false;
                if (cb.checked) {
                    const price = parseInt(cb.getAttribute('data-price') || 0);
                    // Get text from label inside span
                    let labelText = "Service";
                    const labelSpan = $(`label[for="${cb.id}"] span`);
                    if(labelSpan) labelText = labelSpan.innerText;

                    total += price;
                    selectedAddons.push({ id: cb.id, name: labelText, price: price });

                    const li = document.createElement('li');
                    li.className = "d-flex justify-content-between text-info small fst-italic";
                    li.innerHTML = `<span>+ ${labelText}</span> <span>${price} GD</span>`;
                    summaryList.appendChild(li);
                }
            });
        } else {
            addonCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.disabled = true;
            });
        }

        $('#totalPrice').textContent = total.toLocaleString();
        $('#summaryTotal').textContent = formatCurrency(total);

        if (selectAllCheckbox) {
            const allChecked = productCheckboxes.length > 0 && productCheckboxes.every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }

        const orderData = {
            items: selectedItems,
            addons: selectedAddons,
            total: total
        };
        localStorage.setItem('cj_order', JSON.stringify(orderData));

        validateOrderForm();
    }

    function validateOrderForm() {
        const confirmBtn = $('#confirmBtn');
        if (!confirmBtn) return;

        const hasItems = $$('.product:checked').length > 0;
        const hasContact = $('#fullName').value.trim() !== '' && $('#email').value.trim() !== '';
        const hasAddr = $('#addr1').value.trim() !== '' && $('#country').value.trim() !== '';
        const isAccepted = $('#accept').checked;

        if (hasItems && hasContact && hasAddr && isAccepted) {
            confirmBtn.removeAttribute('disabled');
        } else {
            confirmBtn.setAttribute('disabled', 'true');
        }
    }

    productCheckboxes.forEach(cb => cb.addEventListener('change', updateOrderTotals));
    addonCheckboxes.forEach(cb => cb.addEventListener('change', updateOrderTotals));

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            productCheckboxes.forEach(cb => cb.checked = isChecked);
            updateOrderTotals();
        });
    }

    $$('.order-container input:not([type="checkbox"])').forEach(input => {
        input.addEventListener('input', validateOrderForm);
        input.addEventListener('change', validateOrderForm);
    });
    
    const acceptCheckbox = $('#accept');
    if(acceptCheckbox) acceptCheckbox.addEventListener('change', validateOrderForm);

    window.preselectAndGo = function(productId) {
        productCheckboxes.forEach(cb => cb.checked = false);
        addonCheckboxes.forEach(cb => cb.checked = false);
        
        if (productId === 'set') {
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = true;
                productCheckboxes.forEach(cb => cb.checked = true);
            }
        } else {
            const target = $(`#${productId}`);
            if (target) target.checked = true;
        }
        
        updateOrderTotals();
        router('order');
    };

    const confirmBtn = $('#confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const customerData = {
                name: $('#fullName').value || 'Unknown Citizen',
                address: `${$('#addr1').value}, ${$('#city').value}, ${$('#country').value}`,
                orderNo: 'ORD-' + Math.floor(Math.random() * 1000000)
            };
            localStorage.setItem('cj_customer', JSON.stringify(customerData));
            router('payment');
        });
    }

    // ---------------------------------------------------------
    // 5. Payment Page Logic (Enhanced with ID Card)
    // ---------------------------------------------------------
    function initPaymentPage() {
        const orderData = JSON.parse(localStorage.getItem('cj_order') || '{"items":[], "addons":[], "total":0}');
        const custData = JSON.parse(localStorage.getItem('cj_customer') || '{"name":"-", "address":"-", "orderNo":"-"}');

        // Fill Text Info
        $('#deedName').textContent = custData.name;
        $('#deedAddress').textContent = custData.address;
        $('#deedOrderNo').textContent = custData.orderNo;
        
        let itemsText = orderData.items.map(capitalize).join(', ');
        if(orderData.addons && orderData.addons.length > 0) {
            itemsText += ` (+ ${orderData.addons.length} Extras)`;
        }
        $('#deedItems').textContent = itemsText;
        $('#payTotal').textContent = formatCurrency(orderData.total);

        // Fill Dynamic ID Card (NEW Logic)
        const cardNameEl = $('#cardName');
        const cardIDEl = $('#cardID');
        const cardPlanetEl = $('#cardPlanet');
        
        if(cardNameEl) cardNameEl.textContent = custData.name.toUpperCase();
        if(cardIDEl) cardIDEl.textContent = generateGalacticID();
        if(cardPlanetEl) cardPlanetEl.textContent = randomOrigin();

        // Render Product Images
        const grid = $('#deedImageGrid');
        const singleImg = $('#deedImage');
        grid.innerHTML = '';
        singleImg.classList.add('d-none');

        if (orderData.items.length === 9) {
            singleImg.src = "assets/img/Solar.png";
            singleImg.classList.remove('d-none');
            $('#deedItems').textContent = "Complete Solar System Set (+ Extras)";
        } 
        else if (orderData.items.length === 1) {
            singleImg.src = `assets/img/${capitalize(orderData.items[0])}.png`;
            singleImg.classList.remove('d-none');
        } 
        else if (orderData.items.length > 0) {
            orderData.items.forEach(item => {
                const img = document.createElement('img');
                img.src = `assets/img/${capitalize(item)}.png`;
                img.className = "img-fluid rounded border border-light border-opacity-25";
                img.style.width = "60px";
                img.style.height = "60px";
                img.style.objectFit = "contain";
                grid.appendChild(img);
            });
        }

        initSocialShare();
        initReferralCopy();
    }

    // Social Share
    function initSocialShare() {
        const shareBtns = $$('#page-payment .btn-outline-light.rounded-pill');
        shareBtns.forEach(btn => {
            if(btn.dataset.hasListener) return;
            if(btn.innerText.includes("Copy Referral")) return; 

            btn.addEventListener('click', function() {
                const icon = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check2"></i> Sent!';
                this.classList.replace('btn-outline-light', 'btn-light');
                setTimeout(() => {
                    this.innerHTML = icon;
                    this.classList.replace('btn-light', 'btn-outline-light');
                }, 2000);
            });
            btn.dataset.hasListener = 'true';
        });
    }

    // Referral Copy
    function initReferralCopy() {
        const refBtns = $$('.btn-outline-light.rounded-pill');
        refBtns.forEach(btn => {
            if(btn.textContent.includes("Copy Referral")) {
                if(btn.dataset.hasListener) return;
                btn.addEventListener('click', function() {
                    const originalText = this.textContent;
                    navigator.clipboard.writeText("Join ChanohtJakkawan with code: COSMOS-2025").catch(err => {});
                    this.textContent = "Copied!";
                    this.classList.add('bg-white', 'text-dark');
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.classList.remove('bg-white', 'text-dark');
                    }, 2000);
                });
                btn.dataset.hasListener = 'true';
            }
        });
    }

    window.showPaymentSuccess = function() {
        const modal = $('#paymentSuccessModal');
        modal.classList.remove('d-none');
        $('#main-header').style.display = 'none';
    };

    window.finishOrder = function() {
        localStorage.removeItem('cj_order');
        localStorage.removeItem('cj_customer');
        $$('input').forEach(input => {
            if (input.type === 'checkbox') input.checked = false;
            else input.value = '';
        });
        $('#paymentSuccessModal').classList.add('d-none');
        router('home');
    };

    // ---------------------------------------------------------
    // 6. View & Login Logic
    // ---------------------------------------------------------
    window.open3DView = function(planetId) {
        const title = $('#view-3d-title');
        const container = $('#3d-container');
        if (title) title.textContent = planetId === 'solar' ? 'Solar System' : capitalize(planetId);
        container.innerHTML = `
            <div class="text-center fade-in-up">
                <div class="spinner-border text-gold mb-4" style="width: 3rem; height: 3rem;" role="status"></div>
                <h3 class="h5 text-gold">Loading High-Fidelity Model...</h3>
                <p class="text-muted small">Rendering ${planetId === 'solar' ? 'Star System' : capitalize(planetId)} Surface Data</p>
                <img src="assets/img/${planetId === 'solar' ? 'Solar' : capitalize(planetId)}.png" 
                     class="d-block mx-auto mt-4 opacity-50 floating-anim" 
                     style="max-height: 250px; filter: grayscale(0.5);">
            </div>
        `;
        router('view-3d');
    };

    window.close3DView = function() {
        router('home');
    };

    window.toggleLoginMode = function() {
        const signInForm = $('.sign-in-form');
        const signUpForm = $('.sign-up-form');
        const toggleText = $('#toggle-text');
        const toggleBtn = $('#toggle-btn');

        if (signInForm.classList.contains('d-none')) {
            signInForm.classList.remove('d-none');
            signUpForm.classList.add('d-none');
            toggleText.textContent = "New here?";
            toggleBtn.textContent = "Sign Up";
        } else {
            signInForm.classList.add('d-none');
            signUpForm.classList.remove('d-none');
            toggleText.textContent = "One of us?";
            toggleBtn.textContent = "Sign In";
        }
    };

    $$('.login-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            router('home');
        });
    });

    const contactForm = $('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const successMsg = $('#contactSuccess');
            const btn = $('#contactSendBtn');
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Transmitting...';
            btn.disabled = true;
            setTimeout(() => {
                successMsg.classList.remove('d-none');
                btn.innerHTML = 'Send Message';
                btn.disabled = false;
                contactForm.reset();
                setTimeout(() => { successMsg.classList.add('d-none'); }, 4000);
            }, 1500);
        });
    }

    const emergencyBtn = $('.btn-outline-danger');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', function() {
            alert('🚨 EMERGENCY ALERT BROADCASTED 🚨\n\nInterstellar Rescue Team has been dispatched to your coordinates.');
        });
    }

    // ---------------------------------------------------------
    // 7. Scroll & Stats
    // ---------------------------------------------------------
    const backToTopBtn = $('.back-to-top');
    window.addEventListener('scroll', function() {
        const header = $('#main-header');
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
        if (window.scrollY > 300) backToTopBtn.classList.add('show');
        else backToTopBtn.classList.remove('show');
    });

    function initLiveStats() {
        const deedsEl = $('#stat-deeds');
        const popEl = $('#stat-pop');
        if(!deedsEl || !popEl) return;

        setInterval(() => {
            if(Math.random() > 0.6) { 
                let val = parseInt(deedsEl.innerText.replace(/,/g, ''));
                deedsEl.innerText = (val + 1).toLocaleString();
            }
        }, 3000);

        setInterval(() => {
            if(Math.random() > 0.3) { 
                let val = parseInt(popEl.innerText.replace(/,/g, ''));
                const increase = Math.floor(Math.random() * 3) + 1;
                popEl.innerText = (val + increase).toLocaleString();
            }
        }, 2000);
    }

    function initNewsletterLogic() {
        const btn = $('#newsletterBtn');
        const input = $('#newsletterEmail');
        const modal = $('#newsletterModal');
        const doneBtn = $('#newsletterDoneBtn');

        if (!btn || !input || !modal || !doneBtn) return;

        btn.addEventListener('click', function() {
            const email = input.value.trim();
            if (email === '' || !email.includes('@')) {
                input.style.borderColor = '#dc3545';
                input.style.boxShadow = '0 0 10px rgba(220, 53, 69, 0.5)';
                input.focus();
                setTimeout(() => {
                    input.style.borderColor = '';
                    input.style.boxShadow = '';
                }, 2000);
                return;
            }
            modal.classList.remove('d-none');
            input.value = '';
        });

        doneBtn.addEventListener('click', function() {
            const content = modal.querySelector('.glass-card');
            if(content) content.classList.add('fade-out-down');
            setTimeout(() => {
                modal.classList.add('d-none');
                if(content) content.classList.remove('fade-out-down');
            }, 400); 
        });
    }

    // ---------------------------------------------------------
    // 8. Initialization
    // ---------------------------------------------------------
    router('home');
    initLiveStats();
    initNewsletterLogic();

})();