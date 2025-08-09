document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Hamburger menu functionality
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navOverlay = document.getElementById('nav-overlay');

    // Toggle mobile menu
    function toggleMobileMenu() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        navOverlay.classList.toggle('active');
        
        // Pause/resume tour scroller when menu opens/closes
        if (window.tourScroller) {
            if (navLinks.classList.contains('active')) {
                window.tourScroller.pause();
                document.body.style.overflow = 'hidden';
            } else {
                window.tourScroller.resume();
                document.body.style.overflow = '';
            }
        } else {
            document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
        }
    }

    // Close mobile menu
    function closeMobileMenu() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        if (window.tourScroller) {
            window.tourScroller.resume();
        }
    }

    // Event listeners for mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on navigation links
    if (navLinks) {
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // Close menu when window is resized to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offset = 80; // Navbar height
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    function highlightUpcomingDates() {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let nextShow = null;
    let smallestTimeDiff = Infinity;
    let currentlyPlayingShow = null;
    
    // Remove all existing highlights
    document.querySelectorAll('.tour-date').forEach(dateElement => {
        dateElement.classList.remove('highlight', 'currently-playing', 'active');
    });
    
    // Process each tour date card
    document.querySelectorAll('.tour-date').forEach(dateElement => {
        const timeElement = dateElement.querySelector('time');
        const eventTimeElement = dateElement.querySelector('.event-time');
        
        if (!timeElement || !eventTimeElement) return;
        
        const datetime = timeElement.getAttribute('datetime');
        if (!datetime) return;
        
        // Parse event date
        const eventDate = new Date(datetime + 'T00:00:00');
        if (isNaN(eventDate.getTime())) return;
        
        // Parse event time
        const timeText = eventTimeElement.textContent.trim();
        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        
        if (!timeMatch) return;
        
        const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
        
        function parseTime(hour, minute, period, baseDate) {
            let hours = parseInt(hour);
            const minutes = parseInt(minute);
            
            if (period.toUpperCase() === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period.toUpperCase() === 'AM' && hours === 12) {
                hours = 0;
            }
            
            const date = new Date(baseDate);
            date.setHours(hours, minutes, 0, 0);
            return date;
        }
        
        // Create start and end datetime objects
        const startDateTime = parseTime(startHour, startMin, startPeriod, eventDate);
        const endDateTime = parseTime(endHour, endMin, endPeriod, eventDate);
        
        // Check if show is currently happening
        if (now >= startDateTime && now <= endDateTime) {
            currentlyPlayingShow = dateElement;
        }
        
        // Check if show is in the future
        if (endDateTime > now) {
            const timeDiff = startDateTime - now;
            
            // Find the next upcoming show (closest to now but still in future)
            if (timeDiff < smallestTimeDiff) {
                smallestTimeDiff = timeDiff;
                nextShow = dateElement;
            }
        }
    });
    
    // Apply highlighting
    if (currentlyPlayingShow) {
        currentlyPlayingShow.classList.add('currently-playing', 'active');
        
        // Set timeout to switch when current show ends
        const eventTimeElement = currentlyPlayingShow.querySelector('.event-time');
        const timeText = eventTimeElement.textContent.trim();
        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        
        if (timeMatch) {
            const [, , , , endHour, endMin, endPeriod] = timeMatch;
            const datetime = currentlyPlayingShow.querySelector('time').getAttribute('datetime');
            const eventDate = new Date(datetime + 'T00:00:00');
            const endDateTime = parseTime(endHour, endMin, endPeriod, eventDate);
            
            const timeUntilEnd = endDateTime - now;
            
            if (timeUntilEnd > 0) {
                setTimeout(highlightUpcomingDates, timeUntilEnd);
            }
        }
    } else if (nextShow) {
        nextShow.classList.add('highlight', 'active');
        
        // Set timeout to check again at show start time
        const timeElement = nextShow.querySelector('time');
        const eventTimeElement = nextShow.querySelector('.event-time');
        const datetime = timeElement.getAttribute('datetime');
        const eventDate = new Date(datetime + 'T00:00:00');
        const timeText = eventTimeElement.textContent.trim();
        const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        
        if (timeMatch) {
            const [startHour, startMin, startPeriod] = timeMatch.slice(1, 4);
            const startDateTime = parseTime(startHour, startMin, startPeriod, eventDate);
            const timeUntilStart = startDateTime - now;
            
            if (timeUntilStart > 0) {
                setTimeout(highlightUpcomingDates, timeUntilStart);
            }
        }
    } else {
        // No future shows, highlight most recent past show
        let mostRecentPast = null;
        let smallestPastDiff = Infinity;
        
        document.querySelectorAll('.tour-date').forEach(dateElement => {
            const timeElement = dateElement.querySelector('time');
            const eventTimeElement = dateElement.querySelector('.event-time');
            
            if (!timeElement || !eventTimeElement) return;
            
            const datetime = timeElement.getAttribute('datetime');
            if (!datetime) return;
            
            const eventDate = new Date(datetime + 'T00:00:00');
            if (isNaN(eventDate.getTime())) return;
            
            // Parse end time for comparison
            const timeText = eventTimeElement.textContent.trim();
            const timeMatch = timeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            
            if (timeMatch) {
                const [, , , , endHour, endMin, endPeriod] = timeMatch;
                const endDateTime = parseTime(endHour, endMin, endPeriod, eventDate);
                const timeDiff = now - endDateTime;
                
                if (timeDiff > 0 && timeDiff < smallestPastDiff) {
                    smallestPastDiff = timeDiff;
                    mostRecentPast = dateElement;
                }
            }
        });
        
        if (mostRecentPast) {
            mostRecentPast.classList.add('highlight', 'active');
        }
    }
    
    // Helper function to parse time
    function parseTime(hour, minute, period, baseDate) {
        let hours = parseInt(hour);
        const minutes = parseInt(minute);
        
        if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }
        
        const date = new Date(baseDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }
}

// Auto-run on page load and every minute
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(highlightUpcomingDates, 100);
    setInterval(highlightUpcomingDates, 60000); // Check every minute
});

// Backup for window load
window.addEventListener('load', function() {
    setTimeout(highlightUpcomingDates, 100);
});

    class TourAutoScroll {
        constructor() {
            this.tourGrid = document.querySelector('.tour-grid');
            this.tourSection = document.querySelector('.tour-section');
            this.tourCards = [];
            this.dotsContainer = null;
            this.dots = [];
            this.isActive = false;
            this.intervalId = null;
            this.currentIndex = 0;
            this.isPaused = false;
            this.lastUserAction = 0;
            this.hasInteracted = false;
            
            // Settings
            this.scrollSpeed = 3000; // 3 seconds
            this.pauseTime = 4000; // 4 seconds after user interaction
            
            this.init();
        }

        init() {
            // Find tour cards
            this.tourCards = Array.from(document.querySelectorAll('.tour-date'));
            
            if (!this.tourGrid || this.tourCards.length === 0) {
                return;
            }
            
            // Create dots container
            this.createDots();
            
            // Start on mobile only
            this.checkIfShouldRun();
            
            // Listen for resize
            window.addEventListener('resize', this.checkIfShouldRun.bind(this));
            
            // Add interaction listeners
            this.addTourListeners();
        }

        createDots() {
            // Create dots container
            this.dotsContainer = document.createElement('div');
            this.dotsContainer.className = 'tour-dots';
            
            // Style the dots container (mobile only)
            this.dotsContainer.style.display = 'none';
            this.dotsContainer.style.justifyContent = 'center';
            this.dotsContainer.style.alignItems = 'center';
            this.dotsContainer.style.marginTop = '.5rem';
            this.dotsContainer.style.padding = '0 0px';
            
            // Create dots
            this.tourCards.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'tour-dot';
                dot.setAttribute('aria-label', `Go to card ${index + 1}`);
                
                // Style the dots
                dot.style.width = '10px';
                dot.style.height = '10px';
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                dot.style.border = 'none';
                dot.style.cursor = 'pointer';
                dot.style.padding = '0';
                dot.style.transition = 'background-color 0.3s ease';
                
                dot.addEventListener('click', () => {
                    this.goToCard(index);
                });
                
                this.dotsContainer.appendChild(dot);
                this.dots.push(dot);
            });
            
            // Add dots container to the tour section
            if (this.tourSection) {
                this.tourSection.appendChild(this.dotsContainer);
            }
            
            // Update dot visibility based on screen size
            this.updateDotsVisibility();
        }

        updateDotsVisibility() {
            const isMobile = window.innerWidth <= 768;
            if (this.dotsContainer) {
                this.dotsContainer.style.display = isMobile ? 'flex' : 'none';
            }
        }

        updateActiveDot() {
            this.dots.forEach((dot, index) => {
                if (index === this.currentIndex) {
                    dot.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    dot.style.transform = 'scale(1.2)';
                } else {
                    dot.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    dot.style.transform = 'scale(1)';
                }
            });
        }

        goToCard(index) {
            if (index < 0 || index >= this.tourCards.length) return;
            
            this.currentIndex = index;
            const targetCard = this.tourCards[this.currentIndex];
            
            if (!targetCard) return;
            
            // Scroll to center the card
            const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
            const gridCenter = this.tourGrid.offsetWidth / 2;
            const scrollTo = cardCenter - gridCenter;
            
            this.tourGrid.scrollTo({
                left: Math.max(0, scrollTo),
                behavior: 'smooth'
            });
            
            // Update interaction state
            this.lastUserAction = Date.now();
            this.hasInteracted = true;
            if (this.tourSection) {
                this.tourSection.classList.add('user-interacted');
            }
            
            // Update active dot
            this.updateActiveDot();
        }

        checkIfShouldRun() {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile && !this.isActive) {
                this.start();
            } else if (!isMobile && this.isActive) {
                this.stop();
            }
            
            this.updateDotsVisibility();
        }

        start() {
            if (this.isActive || this.tourCards.length <= 1) return;
            
            this.isActive = true;
            
            // Only reset currentIndex if we haven't interacted yet
            if (!this.hasInteracted) {
                this.currentIndex = 0;
            }
            
            // Wait 2 seconds then start scrolling
            setTimeout(() => {
                if (this.isActive) {
                    this.intervalId = setInterval(() => {
                        this.autoScroll();
                    }, this.scrollSpeed);
                }
            }, 2000);
        }

        stop() {
            this.isActive = false;
            
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        autoScroll() {
            if (this.isPaused || (Date.now() - this.lastUserAction < this.pauseTime)) {
                return;
            }

            // Move to next card
            this.currentIndex = (this.currentIndex + 1) % this.tourCards.length;
            const targetCard = this.tourCards[this.currentIndex];
            
            if (!targetCard) return;
            
            // Scroll to center the card
            const cardCenter = targetCard.offsetLeft + (targetCard.offsetWidth / 2);
            const gridCenter = this.tourGrid.offsetWidth / 2;
            const scrollTo = cardCenter - gridCenter;
            
            this.tourGrid.scrollTo({
                left: Math.max(0, scrollTo),
                behavior: 'smooth'
            });
            
            // Update active dot
            this.updateActiveDot();
        }

        addTourListeners() {
            if (!this.tourGrid) return;

            const handleInteraction = () => {
                this.lastUserAction = Date.now();
                
                if (!this.hasInteracted && this.tourSection) {
                    this.hasInteracted = true;
                    this.tourSection.classList.add('user-interacted');
                }
                
                // When user interacts, find the current visible card
                this.updateCurrentIndex();
            };

            this.tourGrid.addEventListener('touchstart', handleInteraction, { passive: true });
            this.tourGrid.addEventListener('touchmove', handleInteraction, { passive: true });
            this.tourGrid.addEventListener('scroll', handleInteraction, { passive: true });
            this.tourGrid.addEventListener('mousedown', handleInteraction);

            this.tourCards.forEach(card => {
                card.addEventListener('click', handleInteraction);
            });
        }

        updateCurrentIndex() {
            // Find which card is currently most visible
            const gridRect = this.tourGrid.getBoundingClientRect();
            const gridCenter = gridRect.left + (gridRect.width / 2);
            
            let closestCardIndex = 0;
            let smallestDistance = Infinity;
            
            this.tourCards.forEach((card, index) => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + (cardRect.width / 2);
                const distance = Math.abs(cardCenter - gridCenter);
                
                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    closestCardIndex = index;
                }
            });
            
            this.currentIndex = closestCardIndex;
            this.updateActiveDot();
        }

        pause() {
            this.isPaused = true;
        }

        resume() {
            this.isPaused = false;
        }
    }

    // Initialize the tour auto-scroll
    if (document.querySelector('.tour-grid')) {
        window.tourScroller = new TourAutoScroll();
    }

    // Video autoplay functionality
    const videos = document.querySelectorAll('.autoplay-video');
    
    // Autoplay all videos muted (no sound possible)
    videos.forEach(video => {
        video.muted = true; // Force mute (even if attribute changes)
        video.removeAttribute('controls'); // Ensure no controls appear
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Autoplay prevented:', error);
            });
        }
    });

    // Pause videos when tab is inactive
    document.addEventListener('visibilitychange', function() {
        videos.forEach(video => {
            document.hidden ? video.pause() : video.play().catch(e => {});
        });
    });

    // =============================================
    // SHOPPING CART FUNCTIONALITY - ENHANCED
    // =============================================
    
    // Initialize cart with proper validation
    let cart = [];
    try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            if (Array.isArray(parsedCart)) {
                cart = parsedCart.filter(item => 
                    item && 
                    item.id && 
                    typeof item.price === 'number' && 
                    typeof item.quantity === 'number'
                );
            }
        }
    } catch (e) {
        console.error('Error loading cart from storage:', e);
        localStorage.removeItem('cart');
    }

        // =============================================
        // DOM Elements - Updated Selectors
        // =============================================
        const cartBtn = document.getElementById('cart-btn');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartSidebar = document.getElementById('cart-sidebar');
        const closeCartBtn = document.getElementById('close-cart');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartCountElement = document.getElementById('cart-count');
        const totalPriceElement = document.getElementById('total-price');
        const checkoutBtn = document.getElementById('checkout-btn');
        const checkoutFormContainer = document.getElementById('checkout-form'); // The container div
        const checkoutFormElement = checkoutFormContainer.querySelector('form'); // The actual form inside
        const cancelCheckoutBtn = document.getElementById('cancel-checkout');
        const completeOrderBtn = document.getElementById('complete-order');

        // Credit Card Form Elements
        const creditCardForm = document.getElementById('credit-card-form');
        const paymentForm = document.getElementById('payment-form');
        const backToShippingBtn = document.getElementById('back-to-shipping');
        const backToCheckoutBtn = document.getElementById('back-to-checkout');
        const processPaymentBtn = document.getElementById('process-payment');
    
    // Card elements
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvcInput = document.getElementById('card-cvc');
    const cardholderNameInput = document.getElementById('cardholder-name');
    
    // Card preview elements
    const cardNumberDisplay = document.getElementById('card-number-display');
    const cardHolderDisplay = document.getElementById('card-holder-display');
    const cardExpiryDisplay = document.getElementById('card-expiry-display');
    const cardBrandIcon = document.getElementById('card-brand-icon');
    const inputBrandIcon = document.getElementById('input-brand-icon');
    const cardFront = document.querySelector('.card-front');
    
    // Billing elements
    const sameAsShippingCheckbox = document.getElementById('same-as-shipping');
    const billingFields = document.getElementById('billing-fields');
    
    // Summary elements
    const toggleSummaryBtn = document.getElementById('toggle-summary');
    const summaryContent = document.getElementById('summary-content');
    const paymentSummaryItems = document.getElementById('payment-summary-items');
    const paymentSubtotal = document.getElementById('payment-subtotal');
    const paymentShipping = document.getElementById('payment-shipping');
    const paymentTax = document.getElementById('payment-tax');
    const paymentTotal = document.getElementById('payment-total');
    const paymentBtnAmount = document.getElementById('payment-btn-amount');
    
    // Payment method tabs
    const methodTabs = document.querySelectorAll('.method-tab');
    const cardContent = document.getElementById('card-content');
    const paypalContent = document.getElementById('paypal-content');

    // Initialize credit card checkout
    function initCreditCardCheckout() {
        setupCreditCardEventListeners();
        setupCardValidation();
        setupBillingToggle();
        setupPaymentMethods();
        initializePayPal();
        setupAccessibility();
    }

    function setupCreditCardEventListeners() {
    // Main navigation
    if (completeOrderBtn) {
        completeOrderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (validateShippingForm()) {
                showCreditCardForm();
            }
        });
    }
    
    if (backToShippingBtn) {
        backToShippingBtn.addEventListener('click', function() {
            hideCreditCardForm();
        });
    }
    
    if (backToCheckoutBtn) {
        backToCheckoutBtn.addEventListener('click', function() {
            hideCreditCardForm();
        });
    }
    
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', handlePaymentSubmission);
    }
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePaymentSubmission();
        });
    }
        
        // Summary toggle
        if (toggleSummaryBtn) {
            toggleSummaryBtn.addEventListener('click', toggleOrderSummary);
        }
    }

  // Validate shipping form before proceeding to payment
    function validateShippingForm() {
        const email = document.getElementById('checkout-email')?.value;
        const phone = document.getElementById('checkout-phone')?.value;
        const shippingName = document.getElementById('shipping-name')?.value;
        const shippingAddress1 = document.getElementById('shipping-address1')?.value;
        const shippingCity = document.getElementById('shipping-city')?.value;
        const shippingState = document.getElementById('shipping-state')?.value;
        const shippingZip = document.getElementById('shipping-zip')?.value;
        const shippingCountry = document.getElementById('shipping-country')?.value;

        const requiredFields = [
            { value: email, name: 'Email' },
            { value: phone, name: 'Phone' },
            { value: shippingName, name: 'Full Name' },
            { value: shippingAddress1, name: 'Address' },
            { value: shippingCity, name: 'City' },
            { value: shippingState, name: 'State' },
            { value: shippingZip, name: 'ZIP' },
            { value: shippingCountry, name: 'Country' }
        ];

        for (const field of requiredFields) {
            if (!field.value) {
                alert(`Please fill in the ${field.name} field`);
                return false;
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }

        return true;
    }

    function showCreditCardForm() {
        if (creditCardForm && checkoutForm) {
            checkoutForm.style.display = 'none';
            creditCardForm.style.display = 'block';
            creditCardForm.classList.add('active');
            
            // Update order summary
            updateOrderSummary();
            
            // Focus first input
            setTimeout(() => {
                if (cardNumberInput) {
                    cardNumberInput.focus();
                }
            }, 300);
        }
    }

    function hideCreditCardForm() {
        if (creditCardForm && checkoutForm) {
            creditCardForm.classList.remove('active');
            setTimeout(() => {
                creditCardForm.style.display = 'none';
                checkoutForm.style.display = 'block';
            }, 300);
        }
    }


    function setupCardValidation() {
        // Card number formatting and validation
        if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
        let cardType = detectCardType(value);
        
        // Format with spaces
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formattedValue += ' ';
            formattedValue += value[i];
        }
        
        e.target.value = formattedValue;
        updateCardDisplay(formattedValue, cardType);
        validateCardNumber(value); // Validate without showing error on input
        
        if (value.length >= 16) {
            cardExpiryInput?.focus();
        }
    });
    
    cardNumberInput.addEventListener('blur', function() {
        const value = this.value.replace(/\s/g, '');
        validateCardNumber(value, true); // Show error only on blur if invalid
    });
}

        // Expiry date formatting
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
                updateCardExpiry(value);
                validateExpiry(value);

                // Auto-advance to CVC when complete
                if (value.length >= 5) {
                    cardCvcInput?.focus();
                }
            });
            
            cardExpiryInput.addEventListener('blur', function() {
                validateExpiry(this.value, true);
            });
        }

        // CVC validation
        if (cardCvcInput) {
            cardCvcInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D/g, '');
                validateCvc(e.target.value);

                // Auto-advance to cardholder name when complete
                const cardType = detectCardType(cardNumberInput?.value.replace(/\s/g, '') || '');
                const expectedLength = cardType === 'amex' ? 4 : 3;
                if (this.value.length >= expectedLength) {
                    cardholderNameInput?.focus();
                }
            });
            
            cardCvcInput.addEventListener('blur', function() {
                validateCvc(this.value, true);
            });
        }

        // Cardholder name
        if (cardholderNameInput) {
            cardholderNameInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                updateCardHolder(e.target.value);
                validateCardholderName(e.target.value);
            });
            
            cardholderNameInput.addEventListener('blur', function() {
                validateCardholderName(this.value, true);
            });
        }
    }

    function detectCardType(number) {
        const patterns = {
            visa: /^4/,
            mastercard: /^5[1-5]|^2[2-7]/,
            amex: /^3[47]/,
            discover: /^6(?:011|5)/
        };

        for (let type in patterns) {
            if (patterns[type].test(number)) {
                return type;
            }
        }
        return 'unknown';
    }

    function updateCardDisplay(number, cardType) {
        if (cardNumberDisplay) {
            cardNumberDisplay.textContent = number || '•••• •••• •••• ••••';
        }
        
        // Update card brand icons
        const brandIcons = {
            visa: 'fab fa-cc-visa',
            mastercard: 'fab fa-cc-mastercard',
            amex: 'fab fa-cc-amex',
            discover: 'fab fa-cc-discover'
        };
        
        const iconClass = brandIcons[cardType] || 'fab fa-cc-visa';
        
        if (cardBrandIcon) {
            cardBrandIcon.className = `${iconClass} card-icon`;
        }
        
        if (inputBrandIcon) {
            inputBrandIcon.className = iconClass;
            inputBrandIcon.parentElement.classList.toggle('visible', cardType !== 'unknown');
        }
        
        // Update card design
        if (cardFront) {
            cardFront.className = `card-front ${cardType}`;
        }
    }

    function updateCardExpiry(expiry) {
        if (cardExpiryDisplay) {
            cardExpiryDisplay.textContent = expiry || 'MM/YY';
        }
    }

    function updateCardHolder(name) {
        if (cardHolderDisplay) {
            cardHolderDisplay.textContent = name.toUpperCase() || 'CARDHOLDER NAME';
        }
    }

    function validateCardNumber(number, showError = false) {
    const cleanNumber = number.replace(/\D/g, '');
    const isValidLength = cleanNumber.length >= 13 && cleanNumber.length <= 19;
    const isValidLuhn = cleanNumber.length > 0 ? luhnCheck(cleanNumber) : false;
    const isValid = cleanNumber.length > 0 && isValidLength && isValidLuhn;
    
    let errorMsg = '';
    if (showError) {
        if (cleanNumber.length === 0) {
            errorMsg = 'Card number is required';
        } else if (!isValidLength) {
            errorMsg = 'Input must be 13-19 digits';
        } else if (!isValidLuhn) {
            errorMsg = 'Invalid card number';
        }
    }
    
    updateFieldValidation('card-number', isValid, errorMsg);
    return isValid;
}

    function validateExpiry(expiry, showError = false) {
        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) {
            updateFieldValidation('card-expiry', false, showError ? 'Enter a valid expiry date' : '');
            return false;
        }
        
        const month = parseInt(match[1]);
        const year = parseInt('20' + match[2]);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        const isValid = month >= 1 && month <= 12 && 
                       (year > currentYear || (year === currentYear && month >= currentMonth));
        
        const errorMsg = !isValid && showError ? 'Card has expired or invalid date' : '';
        updateFieldValidation('card-expiry', isValid, errorMsg);
        return isValid;
    }

    function validateCvc(cvc, showError = false) {
        const cardType = detectCardType(cardNumberInput?.value.replace(/\s/g, '') || '');
        const expectedLength = cardType === 'amex' ? 4 : 3;
        const isValid = cvc.length === expectedLength && /^\d+$/.test(cvc);
        
        const errorMsg = !isValid && showError ? `Enter a valid ${expectedLength}-digit CVC` : '';
        updateFieldValidation('card-cvc', isValid, errorMsg);
        return isValid;
    }

    function validateCardholderName(name, showError = false) {
        const isValid = name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
        const errorMsg = !isValid && showError ? 'Enter a valid cardholder name' : '';
        updateFieldValidation('cardholder-name', isValid, errorMsg);
        return isValid;
    }

    function updateFieldValidation(fieldId, isValid, errorMessage) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + '-error');
        
        if (field) {
            field.classList.remove('valid', 'error');
            if (isValid) {
                field.classList.add('valid');
            } else if (errorMessage) {
                field.classList.add('error');
            }
        }
        
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.toggle('show', !!errorMessage);
        }
    }

    function luhnCheck(number) {
        let sum = 0;
        let isEven = false;
        
        for (let i = number.length - 1; i >= 0; i--) {
            let digit = parseInt(number.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    function setupBillingToggle() {
        if (sameAsShippingCheckbox && billingFields) {
            sameAsShippingCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    billingFields.style.display = 'none';
                    clearBillingFields();
                } else {
                    billingFields.style.display = 'block';
                    populateBillingFromShipping();
                }
            });
        }
    }

    function clearBillingFields() {
        if (!billingFields) return;
        const billingInputs = billingFields.querySelectorAll('input, select');
        billingInputs.forEach(input => {
            input.value = '';
            input.removeAttribute('required');
        });
    }

    function populateBillingFromShipping() {
        const shippingData = {
            name: document.getElementById('shipping-name')?.value || '',
            address1: document.getElementById('shipping-address1')?.value || '',
            address2: document.getElementById('shipping-address2')?.value || '',
            city: document.getElementById('shipping-city')?.value || '',
            state: document.getElementById('shipping-state')?.value || '',
            zip: document.getElementById('shipping-zip')?.value || '',
            country: document.getElementById('shipping-country')?.value || 'US'
        };
        
        // Populate billing fields
        const billingName = document.getElementById('billing-name');
        const billingAddress1 = document.getElementById('billing-address1');
        const billingAddress2 = document.getElementById('billing-address2');
        const billingCity = document.getElementById('billing-city');
        const billingState = document.getElementById('billing-state');
        const billingZip = document.getElementById('billing-zip');
        const billingCountry = document.getElementById('billing-country');
        
        if (billingName) billingName.value = shippingData.name;
        if (billingAddress1) billingAddress1.value = shippingData.address1;
        if (billingAddress2) billingAddress2.value = shippingData.address2;
        if (billingCity) billingCity.value = shippingData.city;
        if (billingState) billingState.value = shippingData.state;
        if (billingZip) billingZip.value = shippingData.zip;
        if (billingCountry) billingCountry.value = shippingData.country;
        
        // Set required attributes
        if (billingFields) {
            const requiredFields = billingFields.querySelectorAll('input[data-required], select[data-required]');
            requiredFields.forEach(field => field.setAttribute('required', ''));
        }
    }

    function setupPaymentMethods() {
        methodTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const method = this.dataset.method;
                
                // Update active tab
                methodTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Show/hide content
                if (method === 'card') {
                    if (cardContent) cardContent.style.display = 'block';
                    if (paypalContent) paypalContent.style.display = 'none';
                } else if (method === 'paypal') {
                    if (cardContent) cardContent.style.display = 'none';
                    if (paypalContent) paypalContent.style.display = 'block';
                }
            });
        });
    }

    function toggleOrderSummary() {
        if (toggleSummaryBtn && summaryContent) {
            const isExpanded = summaryContent.classList.contains('expanded');
            
            summaryContent.classList.toggle('expanded');
            toggleSummaryBtn.classList.toggle('expanded');
            
            const span = toggleSummaryBtn.querySelector('span');
            if (span) {
                span.textContent = isExpanded ? 'Show details' : 'Hide details';
            }
        }
    }

    function updateOrderSummary() {
        const cartItems = getCart();
        const subtotal = calculateSubtotal(cartItems);
        const shipping = 5.99;
        const tax = calculateTax(subtotal);
        const total = subtotal + shipping + tax;
        
        // Update summary items
        if (paymentSummaryItems) {
            paymentSummaryItems.innerHTML = '';
            cartItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'summary-item';
                itemElement.innerHTML = `
                    <span>${item.name} ${item.size ? `(${item.size})` : ''} × ${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                `;
                paymentSummaryItems.appendChild(itemElement);
            });
        }
        
        // Update totals
        if (paymentSubtotal) paymentSubtotal.textContent = `${subtotal.toFixed(2)}`;
        if (paymentShipping) paymentShipping.textContent = `${shipping.toFixed(2)}`;
        if (paymentTax) paymentTax.textContent = `${tax.toFixed(2)}`;
        if (paymentTotal) paymentTotal.textContent = `${total.toFixed(2)}`;
        if (paymentBtnAmount) paymentBtnAmount.textContent = `${total.toFixed(2)}`;
    }

    function getCart() {
        return cart;
    }

    function calculateSubtotal(cartItems) {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function calculateTax(subtotal) {
        // Simple 8.25% tax calculation - adjust based on your needs
        return subtotal * 0.0825;
    }

    async function handlePaymentSubmission() {
        if (!validateAllFields()) {
            return;
        }
        
        const paymentData = collectPaymentData();
        
        try {
            showPaymentProcessing();
            
            // Simulate payment processing
            await processPayment(paymentData);
            
            // Clear cart and show success
            cart = [];
            localStorage.removeItem('cart');
            showPaymentSuccess();
            
        } catch (error) {
            console.error('Payment error:', error);
            showPaymentError(error.message);
        } finally {
            hidePaymentProcessing();
        }
    }

    function validateAllFields() {
        const cardNumber = cardNumberInput?.value.replace(/\s/g, '') || '';
        const expiry = cardExpiryInput?.value || '';
        const cvc = cardCvcInput?.value || '';
        const cardholderName = cardholderNameInput?.value || '';
        
        const validations = [
            validateCardNumber(cardNumber, true),
            validateExpiry(expiry, true),
            validateCvc(cvc, true),
            validateCardholderName(cardholderName, true)
        ];
        
        // Validate billing if not same as shipping
        if (sameAsShippingCheckbox && !sameAsShippingCheckbox.checked && billingFields) {
            const billingFieldElements = billingFields.querySelectorAll('input[required], select[required]');
            billingFieldElements.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('error');
                    validations.push(false);
                } else {
                    field.classList.remove('error');
                }
            });
        }
        
        return validations.every(v => v);
    }

    function collectPaymentData() {
        const billingData = (sameAsShippingCheckbox && sameAsShippingCheckbox.checked) ? getShippingData() : getBillingData();
        
        return {
            cardNumber: cardNumberInput?.value.replace(/\s/g, '') || '',
            cardExpiry: cardExpiryInput?.value || '',
            cardCvc: cardCvcInput?.value || '',
            cardholderName: cardholderNameInput?.value || '',
            billingAddress: billingData,
            cart: getCart(),
            shippingAddress: getShippingData()
        };
    }

    function getShippingData() {
        return {
            name: document.getElementById('shipping-name')?.value || '',
            address1: document.getElementById('shipping-address1')?.value || '',
            address2: document.getElementById('shipping-address2')?.value || '',
            city: document.getElementById('shipping-city')?.value || '',
            state: document.getElementById('shipping-state')?.value || '',
            zip: document.getElementById('shipping-zip')?.value || '',
            country: document.getElementById('shipping-country')?.value || 'US'
        };
    }

    function getBillingData() {
        return {
            name: document.getElementById('billing-name')?.value || '',
            address1: document.getElementById('billing-address1')?.value || '',
            address2: document.getElementById('billing-address2')?.value || '',
            city: document.getElementById('billing-city')?.value || '',
            state: document.getElementById('billing-state')?.value || '',
            zip: document.getElementById('billing-zip')?.value || '',
            country: document.getElementById('billing-country')?.value || 'US'
        };
    }

    async function processPayment(paymentData) {
    // In a real implementation, you would:
    // 1. Tokenize the card data using a secure payment processor (Stripe, PayPal, etc.)
    // 2. Send the tokenized data to your backend
    // 3. Process the payment server-side
    
    const webhookUrl = 'https://hook.us2.make.com/n9ieq1a3q1nykcjjo8svmko73iul65lp';
    
    // Get all form elements with null checks
    const getElementValue = (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Element with ID ${id} not found`);
            return '';
        }
        return el.value;
    };

    const getElementChecked = (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Element with ID ${id} not found`);
            return false;
        }
        return el.checked;
    };

    // Safely get form values
    const sameAsShipping = getElementChecked('same-as-shipping');
    const cardNumber = getElementValue('card-number').replace(/\s+/g, '');
    
    const processedData = {
        contact: {
            email: getElementValue('checkout-email'),
            phone: getElementValue('checkout-phone')
        },
        shipping: {
            fullName: getElementValue('shipping-name'),
            address1: getElementValue('shipping-address1'),
            address2: getElementValue('shipping-address2'),
            city: getElementValue('shipping-city'),
            state: getElementValue('shipping-state'),
            zip: getElementValue('shipping-zip'),
            country: getElementValue('shipping-country')
        },
        billing: {
            sameAsShipping: sameAsShipping,
            // Only include billing fields if different from shipping
            ...(!sameAsShipping && {
                fullName: getElementValue('billing-name'),
                address1: getElementValue('billing-address1'),
                address2: getElementValue('billing-address2'),
                city: getElementValue('billing-city'),
                state: getElementValue('billing-state'),
                zip: getElementValue('billing-zip'),
                country: getElementValue('billing-country')
            })
        },
        payment: {
            method: 'credit_card',
            cardNumber: cardNumber,
            last4: cardNumber.slice(-4),
            cardType: detectCardType(cardNumber),
            cardholderName: getElementValue('cardholder-name'),
            expiry: getElementValue('card-expiry'),
            cvc: getElementValue('card-cvc')
        },
        cart: paymentData.cart,
        total: calculateSubtotal(paymentData.cart) + 5.99 + calculateTax(calculateSubtotal(paymentData.cart)),
        timestamp: new Date().toISOString(),
        paymentStatus: 'processed'
    };

    // Validate required fields before proceeding
    const requiredFields = [
        { value: processedData.contact.email, name: 'Email' },
        { value: processedData.contact.phone, name: 'Phone' },
        { value: processedData.shipping.fullName, name: 'Shipping Name' },
        { value: processedData.shipping.address1, name: 'Shipping Address' },
        { value: processedData.shipping.city, name: 'Shipping City' },
        { value: processedData.shipping.state, name: 'Shipping State' },
        { value: processedData.shipping.zip, name: 'Shipping ZIP' },
        { value: processedData.shipping.country, name: 'Shipping Country' },
        { value: processedData.payment.cardNumber, name: 'Card Number' },
        { value: processedData.payment.cardholderName, name: 'Cardholder Name' },
        { value: processedData.payment.expiry, name: 'Card Expiry' },
        { value: processedData.payment.cvc, name: 'Card CVC' }
    ];

    const missingFields = requiredFields.filter(field => !field.value);
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`);
    }

    try {
        showPaymentProcessing();
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(processedData),
        });
        
        if (!response.ok) {
            throw new Error('Payment processing failed. Please try again.');
        }
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return processedData;
    } catch (error) {
        console.error('Payment processing error:', error);
        throw error;
    } finally {
        hidePaymentProcessing();
    }
}

// The rest of your existing functions remain unchanged:
function showPaymentProcessing() {
    if (!processPaymentBtn) return;
    
    const btnText = processPaymentBtn.querySelector('.btn-text');
    const btnAmount = processPaymentBtn.querySelector('.btn-amount');
    const btnLoader = processPaymentBtn.querySelector('.btn-loader');
    
    if (btnText) btnText.style.display = 'none';
    if (btnAmount) btnAmount.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'block';
    
    processPaymentBtn.disabled = true;
}

function hidePaymentProcessing() {
    if (!processPaymentBtn) return;
    
    const btnText = processPaymentBtn.querySelector('.btn-text');
    const btnAmount = processPaymentBtn.querySelector('.btn-amount');
    const btnLoader = processPaymentBtn.querySelector('.btn-loader');
    
    if (btnText) btnText.style.display = 'inline';
    if (btnAmount) btnAmount.style.display = 'inline';
    if (btnLoader) btnLoader.style.display = 'none';
    
    processPaymentBtn.disabled = false;
}

    // =============================================
// Updated Payment Success Function
// =============================================

function showPaymentSuccess() {
    alert('🎉 Payment successful! Thank you for your order. You will receive a confirmation email shortly.');
    
    // Close cart and reset forms
    if (cartOverlay) cartOverlay.classList.remove('active');
    if (cartSidebar) cartSidebar.classList.remove('active');
    
    document.body.classList.remove('body-no-scroll');
    
    // Reset forms
    try {
        // Reset payment form if it exists
        if (paymentForm && typeof paymentForm.reset === 'function') {
            paymentForm.reset();
        }
        
        // Manually clear all checkout form fields
        if (checkoutFormContainer) {
            // Get all input elements in the container (since there's no form element)
            const inputs = checkoutFormContainer.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Skip checkboxes/radios if needed
                if (input.type !== 'checkbox' && input.type !== 'radio') {
                    input.value = '';
                }
                
                // Clear validation classes
                input.classList.remove('valid', 'error');
            });
            
            // Reset country select specifically
            const countrySelect = checkoutFormContainer.querySelector('#shipping-country');
            if (countrySelect) {
                countrySelect.value = '';
            }
            
            // Reset same-as-shipping checkbox
            if (sameAsShippingCheckbox) {
                sameAsShippingCheckbox.checked = true;
                if (billingFields) {
                    billingFields.style.display = 'none';
                }
            }
            
            // Clear any error messages
            const errorMessages = checkoutFormContainer.querySelectorAll('.error-message');
            errorMessages.forEach(msg => {
                msg.textContent = '';
                msg.classList.remove('show');
            });
        }
    } catch (e) {
        console.warn("Error resetting forms:", e);
    }
    
    // Update cart UI
    updateCartUI();
    
    // Return to initial state
    hideCreditCardForm();
    showCheckoutForm();
    
    // Show the checkout button again
    if (checkoutBtn) {
        checkoutBtn.style.display = 'block';
    }
}

    function showPaymentError(message) {
        alert(`❌ Payment failed: ${message}`);
    }

    // PayPal Integration
    function initializePayPal() {
        // Only load PayPal if the container exists
        if (!document.getElementById('paypal-button-container')) {
            return;
        }

        // Load PayPal SDK dynamically
        if (!window.paypal) {
            const script = document.createElement('script');
            script.src = 'https://www.paypal.com/sdk/js?client-id=ARj9RXajMUmu0G9PM_fKqxYF8vAOULf86OJyAVT-JesQOVFkLV58oWsorhCI9kIXtEeGFl12J2w4BwQz&currency=USD';
            script.onload = renderPayPalButtons;
            document.head.appendChild(script);
        } else {
            renderPayPalButtons();
        }
    }

    function renderPayPalButtons() {
        if (!window.paypal) return;

        const cartItems = getCart();
        const total = calculateSubtotal(cartItems) + 5.99 + calculateTax(calculateSubtotal(cartItems));

        window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal'
            },
            
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: total.toFixed(2),
                            currency_code: 'USD'
                        },
                        description: 'Merchandise Order'
                    }]
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    handlePayPalSuccess(details);
                });
            },
            
            onError: function(err) {
                console.error('PayPal error:', err);
                showPaymentError('PayPal payment failed. Please try again.');
            },
            
            onCancel: function(data) {
                console.log('PayPal payment cancelled:', data);
            }
            
        }).render('#paypal-button-container');
    }

    async function handlePayPalSuccess(details) {
        try {
            const paymentData = {
                payment: {
                    method: 'paypal',
                    transactionId: details.id,
                    payerId: details.payer.payer_id,
                    payerEmail: details.payer.email_address
                },
                shipping: getShippingData(),
                cart: getCart(),
                total: details.purchase_units[0].amount.value,
                timestamp: new Date().toISOString(),
                paymentStatus: 'completed'
            };

            const webhookUrl = 'https://hook.us2.make.com/n9ieq1a3q1nykcjjo8svmko73iul65lp';
            
            await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            });

            cart = [];
            localStorage.removeItem('cart');
            showPaymentSuccess();
            
        } catch (error) {
            console.error('Error processing PayPal payment:', error);
            showPaymentError('There was an error processing your PayPal payment.');
        }
    }

    // Accessibility and keyboard navigation
    function setupAccessibility() {
        // Add keyboard navigation for tabs
        methodTabs.forEach((tab, index) => {
            tab.setAttribute('tabindex', '0');
            tab.setAttribute('role', 'tab');
            
            tab.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tab.click();
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const nextIndex = e.key === 'ArrowRight' 
                        ? (index + 1) % methodTabs.length 
                        : (index - 1 + methodTabs.length) % methodTabs.length;
                    methodTabs[nextIndex].focus();
                }
            });
        });

        // Add ARIA labels
        if (cardNumberInput) {
            cardNumberInput.setAttribute('aria-describedby', 'card-number-error');
            cardNumberInput.setAttribute('autocomplete', 'cc-number');
        }
        if (cardExpiryInput) {
            cardExpiryInput.setAttribute('aria-describedby', 'card-expiry-error');
            cardExpiryInput.setAttribute('autocomplete', 'cc-exp');
        }
        if (cardCvcInput) {
            cardCvcInput.setAttribute('aria-describedby', 'card-cvc-error');
            cardCvcInput.setAttribute('autocomplete', 'cc-csc');
        }
        if (cardholderNameInput) {
            cardholderNameInput.setAttribute('aria-describedby', 'cardholder-name-error');
            cardholderNameInput.setAttribute('autocomplete', 'cc-name');
        }
    }

    // Security: Clear sensitive data on page unload
    window.addEventListener('beforeunload', function() {
        if (cardNumberInput) cardNumberInput.value = '';
        if (cardCvcInput) cardCvcInput.value = '';
    });

    // Initialize cart count display
    function initializeCartCount() {
        const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        if (cartCountElement) {
            cartCountElement.textContent = itemCount;
        }
    }

    // Toggle cart visibility with scroll prevention
    let scrollPosition = 0;
    
    function toggleCart() {
        if (cartOverlay && cartOverlay.classList.contains('active')) {
            // Closing cart - restore scroll position
            document.body.classList.remove('body-no-scroll');
            document.body.style.removeProperty('top');
            window.scrollTo(0, scrollPosition);
        } else {
            // Opening cart - save scroll position
            scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            document.body.style.top = `-${scrollPosition}px`;
            document.body.classList.add('body-no-scroll');
        }
        
        if (cartOverlay) cartOverlay.classList.toggle('active');
        if (cartSidebar) cartSidebar.classList.toggle('active');
    }

    // Update cart UI
    function updateCartUI() {
        if (!cartItemsContainer) return;
        
        // Clear existing items
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            if (totalPriceElement) totalPriceElement.textContent = '$0.00';
            if (cartCountElement) cartCountElement.textContent = '0';
            return;
        }

        let total = 0;
        let itemCount = 0;

        cart.forEach((item, index) => {
            if (!item || !item.price || !item.quantity) return;

            total += item.price * item.quantity;
            itemCount += item.quantity;

            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.dataset.index = index;
            cartItemElement.innerHTML = `
                <img src="${item.image || ''}" alt="${item.name || 'Product'}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name || 'Product'}</h4>
                    <div class="cart-item-price">${item.price.toFixed(2)}</div>
                    ${item.size ? `<div class="cart-item-size">Size: ${item.size}</div>` : ''}
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn increase">+</button>
                    </div>
                </div>
                <button class="cart-item-remove">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            cartItemsContainer.appendChild(cartItemElement);
        });

        if (totalPriceElement) totalPriceElement.textContent = `${total.toFixed(2)}`;
        if (cartCountElement) cartCountElement.textContent = itemCount;

        // Add event listeners to new elements
        document.querySelectorAll('.decrease').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.closest('.cart-item').dataset.index);
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                saveCart();
                updateCartUI();
            });
        });

        document.querySelectorAll('.increase').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.closest('.cart-item').dataset.index);
                cart[index].quantity += 1;
                saveCart();
                updateCartUI();
            });
        });

        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.closest('.cart-item').dataset.index);
                cart.splice(index, 1);
                saveCart();
                updateCartUI();
            });
        });
    }

    // Save cart to localStorage
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Add to cart function
    function addToCart(product) {
        if (!product || !product.id || typeof product.price !== 'number') {
            console.error('Invalid product:', product);
            return;
        }

        product.quantity = product.quantity || 1;

        const existingItemIndex = cart.findIndex(item => 
            item.id === product.id && 
            (!product.size || item.size === product.size)
        );

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += product.quantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name || 'Product',
                price: product.price,
                image: product.image || '',
                size: product.size,
                quantity: product.quantity
            });
        }

        saveCart();
        updateCartUI();

        // Add animation to cart button
        if (cartBtn) {
            cartBtn.classList.add('add-to-cart-animation');
            setTimeout(() => {
                cartBtn.classList.remove('add-to-cart-animation');
            }, 500);
        }
    }

    // Checkout form functions - Updated to work with credit card flow
function showCheckoutForm() {
    if (checkoutFormContainer) {
        checkoutFormContainer.style.display = 'block';
    }
    if (creditCardForm) {
        creditCardForm.style.display = 'none';
    }
    if (checkoutBtn) {
        checkoutBtn.style.display = 'none';
    }
}

function hideCheckoutForm() {
    if (checkoutFormContainer) {
        checkoutFormContainer.style.display = 'none';
    }
    if (checkoutBtn) {
        checkoutBtn.style.display = 'block';
    }
}

function showCreditCardForm() {
    if (creditCardForm && checkoutFormContainer) {
        checkoutFormContainer.style.display = 'none';
        creditCardForm.style.display = 'block';
        creditCardForm.classList.add('active');
        
        updateOrderSummary();
        
        setTimeout(() => {
            if (cardNumberInput) cardNumberInput.focus();
        }, 300);
    }
}

function hideCreditCardForm() {
    if (creditCardForm && checkoutFormContainer) {
        creditCardForm.classList.remove('active');
        setTimeout(() => {
            creditCardForm.style.display = 'none';
            checkoutFormContainer.style.display = 'block';
        }, 300);
    }
}

    // Initialize everything
    initializeCartCount();
    updateCartUI();
    initCreditCardCheckout();

    // Event listeners with scroll prevention
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', function(e) {
            if (e.target === cartOverlay) {
                e.preventDefault();
                toggleCart();
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (cart.length === 0) {
                alert('Your cart is empty');
                return;
            }
            showCheckoutForm();
        });
    }

    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', hideCheckoutForm);
    }

// Add to cart event listeners for merchandise items
document.querySelectorAll('.btn-cart').forEach(button => {
    button.addEventListener('click', function() {
        const merchItem = this.closest('.merch-item');
        const product = {
            id: merchItem.dataset.productId || generateProductId(merchItem),
            name: merchItem.dataset.productName || merchItem.querySelector('h3').textContent,
            price: parseFloat(merchItem.dataset.productPrice || 
                merchItem.querySelector('.merch-price').textContent.replace('$', '')),
            image: merchItem.querySelector('.merch-image').src,
            quantity: 1
        };

        // Handle size selection if available
        const sizeSelect = merchItem.querySelector('.merch-size');
        if (sizeSelect) {
            const selectedSize = sizeSelect.value;
            if (!selectedSize) {
                alert('Please select a size');
                return;
            }
            product.size = selectedSize;
        }

        addToCart(product);

        // Show cart if it's hidden
        if (cartSidebar && !cartSidebar.classList.contains('active')) {
            toggleCart();
        }
    });
});

// Helper function to generate product ID if not provided
function generateProductId(merchItem) {
    const name = merchItem.querySelector('h3').textContent;
    const sizeSelect = merchItem.querySelector('.merch-size');
    const size = sizeSelect ? sizeSelect.value : 'no-size';
    return `${name}-${size}`.toLowerCase().replace(/\s+/g, '-');
}

// Export updateCartUI for global access
window.updateCartUI = updateCartUI;
});

// =============================================
// IMMERSIVE NAVIGATION CLASS
// =============================================

class ImmersiveNav {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.lastScrollY = window.scrollY;
        this.scrollDirection = 0;
        this.scrollDelta = 0;
        this.ticking = false;
        this.mobileMenuOpen = false; // Track mobile menu state
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Watch for mobile menu state changes
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        this.mobileMenuOpen = navLinks.classList.contains('active');
                        // Force navbar to show when mobile menu is open
                        if (this.mobileMenuOpen) {
                            this.navbar.classList.remove('hidden');
                        }
                    }
                });
            });
            observer.observe(navLinks, { attributes: true });
        }
    }

    handleScroll() {
        // Don't hide navbar if mobile menu is open
        if (this.mobileMenuOpen) return;

        this.scrollDelta = window.scrollY - this.lastScrollY;
        this.scrollDirection = Math.sign(this.scrollDelta);
        this.lastScrollY = window.scrollY;

        if (!this.ticking) {
            window.requestAnimationFrame(() => {
                this.updateNavState();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updateNavState() {
        // Skip if mobile menu is open
        if (this.mobileMenuOpen) return;

        const atTop = window.scrollY < 10;
        const scrolledEnough = Math.abs(this.scrollDelta) > 5;
        const shouldHide = this.scrollDirection > 0 && window.scrollY > 120;
        const shouldShow = this.scrollDirection < 0 || atTop;

        this.navbar.classList.toggle('at-top', atTop);
        this.navbar.classList.toggle('scrolled', !atTop);

        if (scrolledEnough) {
            if (shouldHide && !this.navbar.classList.contains('hidden')) {
                this.navbar.classList.add('hidden');
            } else if (shouldShow && this.navbar.classList.contains('hidden')) {
                this.navbar.classList.remove('hidden');
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ImmersiveNav();
});

// =============================================
// UTILITY FUNCTIONS FOR FORM VALIDATION
// =============================================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function isValidZip(zip, country = 'US') {
    if (country === 'US') {
        return /^\d{5}(-\d{4})?$/.test(zip);
    } else if (country === 'CA') {
        return /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(zip);
    }
    return zip.length >= 3; // Basic validation for other countries
}

// =============================================
// BODY SCROLL MANAGEMENT
// =============================================

// Get the elements
const cartOverlay = document.querySelector('.cart-overlay');
const cartSidebar = document.querySelector('.cart-sidebar');
const body = document.body;

// Function to handle scroll locking
function toggleBodyScroll() {
    if (cartOverlay && cartSidebar) {
        if (cartOverlay.classList.contains('active') || cartSidebar.classList.contains('active')) {
            body.classList.add('body-no-scroll');
        } else {
            body.classList.remove('body-no-scroll');
        }
    }
}

// MutationObserver to watch for class changes
if (cartOverlay && cartSidebar) {
    const observer = new MutationObserver(toggleBodyScroll);
    
    // Observe both elements
    observer.observe(cartOverlay, { attributes: true, attributeFilter: ['class'] });
    observer.observe(cartSidebar, { attributes: true, attributeFilter: ['class'] });
    
    // Initial check
    toggleBodyScroll();
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        luhnCheck: window.luhnCheck,
        detectCardType: window.detectCardType,
        isValidEmail,
        isValidPhone,
        isValidZip
    };
}

// Add this script to handle the checkbox toggle
document.addEventListener('DOMContentLoaded', function() {
    const checkbox = document.querySelector('.checkbox-wrapper input[type="checkbox"]');
    const billingForm = document.querySelector('.billing-address-form');
    
    if (checkbox && billingForm) {
        checkbox.addEventListener('change', function() {
            if (!this.checked) {
                billingForm.style.display = 'block';
                // Add animation if desired
                billingForm.style.animation = 'fadeIn 0.3s ease-out';
            } else {
                billingForm.style.display = 'none';
            }
        });
    }
});



// VELVET SMOOTH SCROLL HANDLER - IMPROVED VERSION
class ProgressBar {
  constructor() {
    this.progressTarget = 0;
    this.currentProgress = 0;
    this.animationSpeed = 0.15;
    this.ribbon = document.querySelector('.luxe-progress-ribbon');
    this.isAnimating = false;
    this.scrollHeight = 0;
    this.resizeObserver = null;
    
    this.init();
  }
  
  init() {
    if (!this.ribbon) {
      console.error('Progress ribbon element not found');
      return;
    }
    
    // Start animation loop
    this.startAnimation();
    
    // Set up scroll listener
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // Set up resize observer to handle dynamic content changes
    this.setupResizeObserver();
    
    // Initial update
    this.updateScrollMetrics();
    this.handleScroll();
  }
  
  startAnimation() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const animate = () => {
      // Smooth interpolation with minimum change threshold
      const diff = this.progressTarget - this.currentProgress;
      if (Math.abs(diff) > 0.01) {
        this.currentProgress += diff * this.animationSpeed;
        
        // Update width with eased ends
        this.ribbon.style.width = `${Math.min(100, Math.max(0, this.currentProgress))}%`;
        
        // Dynamic glow intensity with bounds checking
        const glowIntensity = Math.min(1, Math.max(0.7, 0.7 + (this.currentProgress / 120)));
        this.ribbon.style.setProperty('--glow-intensity', glowIntensity);
      }
      
      if (this.isAnimating) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  stopAnimation() {
    this.isAnimating = false;
  }
  
  handleScroll() {
    this.updateScrollMetrics();
    if (this.scrollHeight > 0) {
      this.progressTarget = (window.scrollY / this.scrollHeight) * 100;
    } else {
      this.progressTarget = 0;
    }
  }  
  
  updateScrollMetrics() {
    this.scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  }
  
  setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollMetrics();
        this.handleScroll();
      });
      
      this.resizeObserver.observe(document.body);
    } else {
      // Fallback for browsers without ResizeObserver
      window.addEventListener('resize', () => {
        this.updateScrollMetrics();
        this.handleScroll();
      }, { passive: true });
    }
  }
  
  destroy() {
    this.stopAnimation();
    window.removeEventListener('scroll', this.handleScroll);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// Initialize the progress bar
document.addEventListener('DOMContentLoaded', () => {
  new ProgressBar();
});