/* =========================================================
   ChanohtJakkawan — main.js (v1.2 - Node.js Ready Logic)
   Full Stack SPA Logic: Form Validation, Data Binding, & Simulation
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

    // Generate Random Galactic ID Segment (Fallback)
    const generateGalacticID = () => {
        const segment = () => Math.floor(1000 + Math.random() * 9000);
        return `${segment()}-${segment()}-${segment()}-${segment()}`;
    };

    // ---------------------------------------------------------
    // 2. Router System (Single Page Application Core)
    // ---------------------------------------------------------
    window.router = function(pageName) {
        // Hide all sections
        $$('.page-section').forEach(section => {
            section.classList.remove('active-section');
            section.classList.add('d-none');
        });

        // Show target section
        const target = $(`#page-${pageName}`);
        if (target) {
            target.classList.remove('d-none');
            setTimeout(() => {
                target.classList.add('active-section');
            }, 10);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Toggle Navbar/Footer visibility based on page
        const navbar = $('#main-header');
        const footer = $('#main-footer');
        
        if (pageName === 'login' || pageName === 'view-3d') {
            navbar.style.display = 'none';
            if(footer) footer.style.display = 'none';
        } else {
            navbar.style.display = 'block';
            if(footer) footer.style.display = 'block';
        }

        // Trigger Page Specific Logic
        if (pageName === 'payment') initPaymentPage();
        if (pageName === 'order') updateOrderTotals();
        
        // Auto-close mobile menu on navigation
        const navMenu = $('#navMenu');
        const toggler = $('.navbar-toggler');
        if (navMenu && navMenu.classList.contains('show')) {
            toggler.click();
        }
    };

    // ---------------------------------------------------------
    // 3. UI Interactions (Menu & Touch)
    // ---------------------------------------------------------
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        const navMenu = $('#navMenu');
        const toggler = $('.navbar-toggler');
        if (navMenu && navMenu.classList.contains('show') && 
            !navMenu.contains(e.target) && !toggler.contains(e.target)) {
            toggler.click();
        }
    });

    // Mobile tap effect for cards
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
    // 4. Order Logic (Calculator & Data Collection)
    // ---------------------------------------------------------
    const productCheckboxes = $$('.product'); 
    const addonCheckboxes = $$('.product-addon');
    const selectAllCheckbox = $('#selectAll');
    
    // Calculate Total Price and Update Summary List
    function updateOrderTotals() {
        let total = 0;
        const summaryList = $('#summaryList');
        if (summaryList) summaryList.innerHTML = '';
        
        let selectedItems = [];
        let selectedAddons = [];

        // Calculate Products
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

        // Calculate Add-ons
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

        // Update UI
        $('#totalPrice').textContent = total.toLocaleString();
        $('#summaryTotal').textContent = formatCurrency(total);

        // Update Select All State
        if (selectAllCheckbox) {
            const allChecked = productCheckboxes.length > 0 && productCheckboxes.every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }

        // Save Temporary Order Data
        const orderData = {
            items: selectedItems,
            addons: selectedAddons,
            total: total
        };
        localStorage.setItem('cj_order', JSON.stringify(orderData));

        validateOrderForm();
    }

    // New Validation Logic for 3 Blocks (Entity, Coordinates, Legacy)
    function validateOrderForm() {
        const confirmBtn = $('#confirmBtn');
        if (!confirmBtn) return;

        const hasItems = $$('.product:checked').length > 0;
        
        // Block 1: Entity
        const hasEntity = $('#entityName').value.trim() !== '' && 
                          $('#entityHash').value.trim() !== '';

        // Block 2: Coordinates
        const hasCoords = $('#coordSystem').value.trim() !== '' && 
                          $('#coordWormhole').value.trim() !== '';

        // Block 3: Legacy
        const hasLegacy = $('#legacyDynasty').value.trim() !== '' && 
                          $('#legacyHeir').value.trim() !== '';

        const isAccepted = $('#accept').checked;

        if (hasItems && hasEntity && hasCoords && hasLegacy && isAccepted) {
            confirmBtn.removeAttribute('disabled');
        } else {
            confirmBtn.setAttribute('disabled', 'true');
        }
    }

    // Event Listeners for Calculator
    productCheckboxes.forEach(cb => cb.addEventListener('change', updateOrderTotals));
    addonCheckboxes.forEach(cb => cb.addEventListener('change', updateOrderTotals));

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            productCheckboxes.forEach(cb => cb.checked = isChecked);
            updateOrderTotals();
        });
    }

    // Event Listeners for Validation
    $$('.order-container input, .order-container select').forEach(input => {
        input.addEventListener('input', validateOrderForm);
        input.addEventListener('change', validateOrderForm);
    });
    
    // Quick Buy Button Logic
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

    // Confirm Order: Data Collection (Node.js Payload Preparation)
    const confirmBtn = $('#confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            // Collect Data into a Structured Object for Node.js
            const payload = {
                entity: {
                    title: $('#entityTitle').value,
                    name: $('#entityName').value,
                    species: $('#entitySpecies').value,
                    hash: $('#entityHash').value
                },
                coordinates: {
                    quadrant: $('#coordQuadrant').value,
                    system: $('#coordSystem').value,
                    wormhole: $('#coordWormhole').value,
                    timeline: $('#coordTimeline').value
                },
                legacy: {
                    dynasty: $('#legacyDynasty').value,
                    heir: $('#legacyHeir').value,
                    succession: $('#legacySuccession').value,
                    motto: $('#legacyMotto').value
                },
                meta: {
                    orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
                    timestamp: new Date().toISOString()
                }
            };
            
            // Save to LocalStorage (Simulating DB transmission)
            localStorage.setItem('cj_payload', JSON.stringify(payload));
            router('payment');
        });
    }

    // ---------------------------------------------------------
    // 5. Payment Page Logic (Dynamic Rendering)
    // ---------------------------------------------------------
    function initPaymentPage() {
        const orderData = JSON.parse(localStorage.getItem('cj_order') || '{"items":[], "addons":[], "total":0}');
        const payload = JSON.parse(localStorage.getItem('cj_payload') || '{}');

        // Fallback if no data found
        if (!payload.entity) return;

        // 1. Fill Deed Information
        // Combine Title + Name
        $('#deedName').textContent = `${payload.entity.title} ${payload.entity.name}`;
        
        // Dynamic Fields for Deed
        if($('#deedDynasty')) $('#deedDynasty').textContent = payload.legacy.dynasty;
        if($('#deedQuadrant')) $('#deedQuadrant').textContent = `${payload.coordinates.quadrant} [${payload.coordinates.wormhole}]`;
        if($('#deedHeir')) $('#deedHeir').textContent = `${payload.legacy.heir} (${payload.legacy.succession})`;
        
        $('#deedOrderNo').textContent = payload.meta.orderId;
        
        // Format Items List
        let itemsText = orderData.items.map(capitalize).join(', ');
        if(orderData.addons && orderData.addons.length > 0) {
            itemsText += ` (+ ${orderData.addons.length} Enhancements)`;
        }
        $('#deedItems').textContent = itemsText;
        $('#payTotal').textContent = formatCurrency(orderData.total);

        // 2. Fill Galactic ID Card
        if($('#cardName')) $('#cardName').textContent = payload.entity.name.toUpperCase();
        // Use Hash or Generate ID
        if($('#cardID')) $('#cardID').textContent = payload.entity.hash || generateGalacticID();
        // Use Species or Planet System as Origin
        if($('#cardPlanet')) $('#cardPlanet').textContent = payload.entity.species.toUpperCase();

        // 3. Render Product Images
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

    // Social Share Button Effects
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

    // Referral Copy Logic
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

    // Complete Payment Modal
    window.showPaymentSuccess = function() {
        const modal = $('#paymentSuccessModal');
        modal.classList.remove('d-none');
        $('#main-header').style.display = 'none';
    };

    // Reset and Finish
    window.finishOrder = function() {
        localStorage.removeItem('cj_order');
        localStorage.removeItem('cj_payload');
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

    // Toggle Login/Register Forms
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

    // Contact Form Simulation
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

    // ---------------------------------------------------------
    // 7. Emergency & Newsletter Modals
    // ---------------------------------------------------------
    function initEmergencyLogic() {
        const btn = $('#emergencyBtn');
        const modal = $('#emergencyModal');
        const doneBtn = $('#emergencyDoneBtn');

        if (!btn || !modal || !doneBtn) return;

        btn.addEventListener('click', function() {
            modal.classList.remove('d-none');
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

    function initNewsletterLogic() {
        const btn = $('#newsletterBtn');
        const input = $('#newsletterEmail');
        const modal = $('#newsletterModal');
        const doneBtn = $('#newsletterDoneBtn');

        if (!btn || !input || !modal || !doneBtn) return;

        btn.addEventListener('click', function() {
            const email = input.value.trim();
            if (email === '' || !email.includes('@')) {
                // Shake / Error effect
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
    // 8. Scroll & Stats Logic
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

    // ---------------------------------------------------------
    // 9. Bootstrap Carousel Initializers
    // ---------------------------------------------------------
    function initTestimonialCarousel() {
        const carouselEl = document.querySelector('#testimonialCarousel');
        if (carouselEl && window.bootstrap) {
            const carousel = new bootstrap.Carousel(carouselEl, {
                interval: 7000, wrap: true, touch: true, pause: 'hover'
            });
            carousel.cycle();
        }
    }

    function initAwardsCarousel() {
        const carouselEl = document.querySelector('#awardsCarousel');
        if (carouselEl && window.bootstrap) {
            const carousel = new bootstrap.Carousel(carouselEl, {
                interval: 4000, wrap: true, touch: true, pause: 'hover'
            });
            carousel.cycle();
        }
    }

    // ---------------------------------------------------------
    // 10. Initialization
    // ---------------------------------------------------------
    // Start at Home
    router('home');
    
    // Init all features
    initLiveStats();
    initNewsletterLogic();
    initEmergencyLogic();
    initTestimonialCarousel();
    initAwardsCarousel();

})();