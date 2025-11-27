/* =========================================================
   ChanohtJakkawan — main.js (v5.3 Final - Content Enhanced)
   Full Stack SPA Logic: Router, Live Stats, Social Share
   ========================================================= */

(function () {
    "use strict";

    // ---------------------------------------------------------
    // 1. Helpers & Utilities
    // ---------------------------------------------------------
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const formatCurrency = (val) => `${val} GD`;
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

    // ---------------------------------------------------------
    // 2. Router System (Single Page Application Core)
    // ---------------------------------------------------------
    window.router = function(pageName) {
        // 1. Hide all pages
        $$('.page-section').forEach(section => {
            section.classList.remove('active-section');
            section.classList.add('d-none');
        });

        // 2. Show target page
        const target = $(`#page-${pageName}`);
        if (target) {
            target.classList.remove('d-none');
            // Tiny delay to trigger CSS transition
            setTimeout(() => {
                target.classList.add('active-section');
            }, 10);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 3. Navbar & Footer Visibility
        const navbar = $('#main-header');
        const footer = $('#main-footer');
        
        // Hide on Login, 3D View, or Payment Success Modal
        if (pageName === 'login' || pageName === 'view-3d') {
            navbar.style.display = 'none';
            if(footer) footer.style.display = 'none';
        } else {
            navbar.style.display = 'block';
            if(footer) footer.style.display = 'block';
        }

        // 4. Trigger Specific Page Logic
        if (pageName === 'payment') initPaymentPage();
        if (pageName === 'order') updateOrderTotals();
        
        // 5. Close mobile menu if open
        const navMenu = $('#navMenu');
        const toggler = $('.navbar-toggler');
        if (navMenu && navMenu.classList.contains('show')) {
            toggler.click();
        }
    };

    // ---------------------------------------------------------
    // 3. Hamburger Menu: Click Outside to Close
    // ---------------------------------------------------------
    document.addEventListener('click', function(e) {
        const navMenu = $('#navMenu');
        const toggler = $('.navbar-toggler');
        
        // If menu is open, and click is NOT on menu and NOT on toggler
        if (navMenu && navMenu.classList.contains('show') && 
            !navMenu.contains(e.target) && !toggler.contains(e.target)) {
            toggler.click(); // Close it
        }
    });

    // ---------------------------------------------------------
    // 4. Mobile Touch Interaction (Tap to Show Overlay)
    // ---------------------------------------------------------
    // On mobile, hover doesn't work well. We use 'tap-active' class.
    const touchCards = $$('.product-img-wrapper, .team-img-wrapper, .sun-wrapper');
    
    touchCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // If clicking the button itself, let it pass
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
            
            // Toggle active class
            const isActive = this.classList.contains('tap-active');
            
            // Remove active from all others first (Exclusive selection)
            touchCards.forEach(c => c.classList.remove('tap-active'));
            
            if (!isActive) {
                this.classList.add('tap-active');
            }
        });
    });

    // Click anywhere else to close all active cards
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.product-img-wrapper') && 
            !e.target.closest('.team-img-wrapper') &&
            !e.target.closest('.sun-wrapper')) {
            touchCards.forEach(c => c.classList.remove('tap-active'));
        }
    });

    // ---------------------------------------------------------
    // 5. Order Logic (Calculation & Persistence)
    // ---------------------------------------------------------
    const productCheckboxes = $$('.product'); 
    const selectAllCheckbox = $('#selectAll');
    
    function updateOrderTotals() {
        if (!productCheckboxes.length) return;

        let total = 0;
        const summaryList = $('#summaryList');
        if (summaryList) summaryList.innerHTML = '';
        
        let selectedItems = [];

        productCheckboxes.forEach(cb => {
            if (cb.checked) {
                const price = parseInt(cb.getAttribute('data-price') || 0);
                const name = cb.id; // sun, mercury, etc.
                total += price;
                selectedItems.push(name);

                // Add to summary
                const li = document.createElement('li');
                li.className = "d-flex justify-content-between text-muted-light";
                li.innerHTML = `<span>${capitalize(name)}</span> <span class="text-gold">${price} GD</span>`;
                summaryList.appendChild(li);
            }
        });

        // Update Text
        $('#totalPrice').textContent = total;
        $('#summaryTotal').textContent = formatCurrency(total);

        // Update Select All State
        if (selectAllCheckbox) {
            const allChecked = productCheckboxes.every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }

        // Save to LocalStorage
        const orderData = {
            items: selectedItems,
            total: total
        };
        localStorage.setItem('cj_order', JSON.stringify(orderData));

        // Enable/Disable Confirm Button
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

    // Listeners
    productCheckboxes.forEach(cb => cb.addEventListener('change', updateOrderTotals));

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            productCheckboxes.forEach(cb => cb.checked = isChecked);
            updateOrderTotals();
        });
    }

    // Input Validation Listeners
    $$('.order-container input').forEach(input => {
        input.addEventListener('input', validateOrderForm);
        input.addEventListener('change', validateOrderForm);
    });

    // "Buy Now" & "Preselect" Logic
    window.preselectAndGo = function(productId) {
        // Reset all checks first
        productCheckboxes.forEach(cb => cb.checked = false);
        
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

    // Confirm Order -> Go to Payment
    const confirmBtn = $('#confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            // Save Customer Info
            const customerData = {
                name: $('#fullName').value,
                address: `${$('#addr1').value}, ${$('#city').value}, ${$('#country').value}`,
                orderNo: 'ORD-' + Math.floor(Math.random() * 1000000)
            };
            localStorage.setItem('cj_customer', JSON.stringify(customerData));
            
            router('payment');
        });
    }

    // ---------------------------------------------------------
    // 6. Payment & Deed Logic (Updated with Social Share)
    // ---------------------------------------------------------
    function initPaymentPage() {
        const orderData = JSON.parse(localStorage.getItem('cj_order') || '{"items":[], "total":0}');
        const custData = JSON.parse(localStorage.getItem('cj_customer') || '{"name":"-", "address":"-", "orderNo":"-"}');

        // Fill Deed Text
        $('#deedName').textContent = custData.name;
        $('#deedAddress').textContent = custData.address;
        $('#deedOrderNo').textContent = custData.orderNo;
        $('#deedItems').textContent = orderData.items.map(capitalize).join(', ');
        $('#payTotal').textContent = formatCurrency(orderData.total);

        // Render Deed Images
        const grid = $('#deedImageGrid');
        const singleImg = $('#deedImage');
        grid.innerHTML = '';
        singleImg.classList.add('d-none');

        // Special Case: Solar System (Full Set - 9 items)
        if (orderData.items.length === 9) {
            singleImg.src = "assets/img/Solar.png";
            singleImg.classList.remove('d-none');
            $('#deedItems').textContent = "Complete Solar System Set (9 Objects)";
        } 
        else if (orderData.items.length === 1) {
            // Single Item
            singleImg.src = `assets/img/${capitalize(orderData.items[0])}.png`;
            singleImg.classList.remove('d-none');
        } 
        else if (orderData.items.length > 0) {
            // Multiple Items Grid
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

        // Initialize Share Buttons Logic (Dynamic binding)
        initSocialShare();
    }

    // Social Share Button Logic
    function initSocialShare() {
        const shareBtns = $$('#page-payment .btn-outline-light.rounded-pill');
        shareBtns.forEach(btn => {
            // Avoid adding double listeners
            if(btn.dataset.hasListener) return;
            
            btn.addEventListener('click', function() {
                const icon = this.innerHTML; // Keep original icon
                const originalText = this.textContent.trim();
                
                // Simulation
                this.innerHTML = '<i class="bi bi-check2"></i> Sent!';
                this.classList.replace('btn-outline-light', 'btn-light');
                
                setTimeout(() => {
                    this.innerHTML = icon;
                    this.classList.replace('btn-light', 'btn-outline-light');
                    // Optional alert for fun
                    // alert(`Successfully broadcasted to ${originalText}!`);
                }, 2000);
            });
            
            btn.dataset.hasListener = 'true';
        });
    }

    // Payment Success Modal
    window.showPaymentSuccess = function() {
        const modal = $('#paymentSuccessModal');
        modal.classList.remove('d-none');
        // Hide navbar just for cleaner look (optional)
        $('#main-header').style.display = 'none';
    };

    // Reset All Data & Go Home
    window.finishOrder = function() {
        // 1. Clear Storage
        localStorage.removeItem('cj_order');
        localStorage.removeItem('cj_customer');

        // 2. Reset Forms
        $$('input').forEach(input => {
            if (input.type === 'checkbox') input.checked = false;
            else input.value = '';
        });

        // 3. Hide Modal
        $('#paymentSuccessModal').classList.add('d-none');

        // 4. Go Home
        router('home');
    };

    // ---------------------------------------------------------
    // 7. 3D View Logic
    // ---------------------------------------------------------
    window.open3DView = function(planetId) {
        const title = $('#view-3d-title');
        const container = $('#3d-container');
        
        if (title) title.textContent = planetId === 'solar' ? 'Solar System' : capitalize(planetId);
        
        // Mock Loading
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

    // ---------------------------------------------------------
    // 8. Login & Contact Logic
    // ---------------------------------------------------------
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

    // Login Submit
    $$('.login-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            router('home');
        });
    });

    // Contact Submit
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
                
                setTimeout(() => {
                    successMsg.classList.add('d-none');
                }, 4000);
            }, 1500);
        });
    }

    // ---------------------------------------------------------
    // 9. Back To Top & Scroll Effects
    // ---------------------------------------------------------
    const backToTopBtn = $('.back-to-top');

    window.addEventListener('scroll', function() {
        const header = $('#main-header');
        
        // Navbar Frosted Effect
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');

        // Back to Top Visibility
        if (window.scrollY > 300) backToTopBtn.classList.add('show');
        else backToTopBtn.classList.remove('show');
    });

    // ---------------------------------------------------------
    // 10. NEW: Live Cosmic Stats System
    // ---------------------------------------------------------
    function initLiveStats() {
        const deedsEl = $('#stat-deeds');
        const popEl = $('#stat-pop');
        const valEl = $('#stat-val');

        if(!deedsEl || !popEl || !valEl) return;

        // 1. Deeds Increment (Slow)
        setInterval(() => {
            if(Math.random() > 0.6) { // 40% chance to update
                let val = parseInt(deedsEl.innerText.replace(/,/g, ''));
                deedsEl.innerText = (val + 1).toLocaleString();
            }
        }, 3000);

        // 2. Population Increment (Fast)
        setInterval(() => {
            if(Math.random() > 0.3) { // 70% chance to update
                let val = parseInt(popEl.innerText.replace(/,/g, ''));
                const increase = Math.floor(Math.random() * 3) + 1; // +1 to +3
                popEl.innerText = (val + increase).toLocaleString();
            }
        }, 2000);

        // 3. Market Cap Fluctuation (Ticker Style)
        // Static for now as "900T" implies stable huge value, 
        // but we can make it blink occasionally to show "Live" status
    }

    // ---------------------------------------------------------
    // 11. Initialization
    // ---------------------------------------------------------
    router('home');
    initLiveStats(); // Start the numbers

})();