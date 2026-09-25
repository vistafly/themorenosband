document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Scroll spy - highlight active nav link
    const navAnchors = document.querySelectorAll('.nav-links a');
    const sections = [];
    navAnchors.forEach(a => {
        const id = a.getAttribute('href').substring(1);
        const el = document.getElementById(id);
        if (el) sections.push({ id, el, link: a });
    });

    function updateActiveNav() {
        const scrollY = window.scrollY + 150;
        let current = sections[0];
        for (const s of sections) {
            if (scrollY >= s.el.offsetTop) current = s;
        }
        navAnchors.forEach(a => a.classList.remove('active'));
        if (current) current.link.classList.add('active');
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();

    // Hamburger menu functionality
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navOverlay = document.getElementById('nav-overlay');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.querySelector('.navbar');
    const nextShowLink = document.getElementById('nav-next-show');

    // Fill the "Next Show" teaser from the highlighted (or first) tour card
    function updateNextShow() {
        if (!nextShowLink) return;
        const card = document.querySelector('.tour-date.currently-playing, .tour-date.highlight') ||
                     document.querySelector('.tour-date');
        if (!card) { nextShowLink.hidden = true; return; }
        const month = card.querySelector('.month')?.textContent.trim() || '';
        const day = card.querySelector('.day')?.textContent.trim() || '';
        const venue = card.querySelector('.venue-header h3')?.textContent.trim() || '';
        const time = card.querySelector('.event-time')?.textContent.trim() || '';
        const start = time === 'TBD' ? '' : time.split(/\s*[-–—]\s*/)[0].replace(/\s*Show$/i, '');
        const playing = card.classList.contains('currently-playing');
        nextShowLink.querySelector('.nav-next-label').textContent = playing ? 'Playing Now' : 'Next Show';
        const details = nextShowLink.querySelector('.nav-next-details');
        const when = document.createElement('span');
        const where = document.createElement('span');
        when.className = 'nav-next-when';
        where.className = 'nav-next-venue';
        when.textContent = [`${month.charAt(0)}${month.slice(1).toLowerCase()} ${day}`, start].filter(Boolean).join(' · ');
        where.textContent = venue;
        details.replaceChildren(when, where);
        nextShowLink.hidden = false;
    }

    function setMenuOpen(open) {
        hamburger.classList.toggle('active', open);
        navLinks.classList.toggle('active', open);
        navOverlay.classList.toggle('active', open);
        if (navMenu) navMenu.classList.toggle('open', open);
        if (navbar) navbar.classList.toggle('menu-open', open);
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.style.overflow = open ? 'hidden' : '';

        // Pause/resume tour scroller when menu opens/closes
        if (window.tourScroller) {
            open ? window.tourScroller.pause() : window.tourScroller.resume();
        }
        if (open) updateNextShow();
    }

    // Toggle mobile menu
    function toggleMobileMenu() {
        setMenuOpen(!navLinks.classList.contains('active'));
    }

    // Close mobile menu
    function closeMobileMenu() {
        if (navLinks.classList.contains('active')) setMenuOpen(false);
    }

    // Event listeners for mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
        hamburger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMobileMenu();
            }
        });
    }
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on navigation links (and the next-show teaser)
    if (navMenu) {
        navMenu.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // Close menu when window is resized to desktop (matches the 1236px CSS breakpoint)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1236) {
            closeMobileMenu();
        }
    });

    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // How far a scrolled-to section must clear the fixed navbar.
    //
    // This was a hardcoded 80px "Navbar height", but the bar is not 80px at any
    // breakpoint - it is ~50px scrolled on desktop, 82px in the 769-1236px
    // hamburger band and 60px on mobile. At 900-1236px that meant a clicked
    // section landed about 2px ABOVE the bottom of the navbar, i.e. tucked
    // behind it.
    //
    // Measured from the navbar with .scrolled applied, because the page is
    // always in that state by the time a jump finishes. Reading it live means
    // it keeps working if the navbar padding is ever changed again.
    //
    // Transitions are switched off around the measurement. The navbar animates
    // its padding, so with them on, adding .scrolled and reading the height in
    // the same breath returned the height at the START of the transition - the
    // unscrolled one. On a phone that read 80px at load and 74px on the first
    // resize (the address bar sliding away), so the hero volume control, which
    // is placed from this value, visibly jumped 6px as you began to scroll.
    function navOffset() {
        const nav = document.querySelector('.navbar');
        if (!nav) return 80;
        const had = nav.classList.contains('scrolled');
        const transition = nav.style.transition;
        nav.style.transition = 'none';
        if (!had) nav.classList.add('scrolled');
        const h = nav.getBoundingClientRect().height;   // same frame, so no flicker
        if (!had) nav.classList.remove('scrolled');
        void nav.offsetHeight;                          // settle back while transitions are still off
        nav.style.transition = transition;
        return Math.round(h) + 14;                      // + a small breathing gap
    }

    // Publish it for scroll-margin-top (styles.css) so native hash landings
    // and programmatic scrollIntoView clear the bar too.
    function syncNavOffset() {
        document.documentElement.style.setProperty('--nav-offset', navOffset() + 'px');
    }
    syncNavOffset();
    window.addEventListener('resize', syncNavOffset);

    // Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');

        // Skip if href is just "#" or empty
        if (targetId === '#' || targetId.length <= 1) {
            return;
        }

        e.preventDefault();

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const offset = navOffset();
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

            window.scrollTo({
                top: Math.max(0, targetPosition),
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
    
    // Process each tour date card (single pass: clear + evaluate)
    const allTourDates = document.querySelectorAll('.tour-date');
    allTourDates.forEach(dateElement => {
        dateElement.classList.remove('highlight', 'currently-playing', 'active');
    });

    allTourDates.forEach(dateElement => {
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

        let startDateTime, endDateTime;

        if (timeMatch) {
            const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = timeMatch;
            startDateTime = parseTime(startHour, startMin, startPeriod, eventDate);
            endDateTime = parseTime(endHour, endMin, endPeriod, eventDate);
        } else {
            // TBD or unparseable time — use start/end of event date
            startDateTime = new Date(eventDate);
            startDateTime.setHours(0, 0, 0, 0);
            endDateTime = new Date(eventDate);
            endDateTime.setHours(23, 59, 59, 999);
        }

        // Check if show is currently happening
        if (timeMatch && now >= startDateTime && now <= endDateTime) {
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
        
        allTourDates.forEach(dateElement => {
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

            let endDateTime;
            if (timeMatch) {
                const [, , , , endHour, endMin, endPeriod] = timeMatch;
                endDateTime = parseTime(endHour, endMin, endPeriod, eventDate);
            } else {
                endDateTime = new Date(eventDate);
                endDateTime.setHours(23, 59, 59, 999);
            }
            const timeDiff = now - endDateTime;

            if (timeDiff > 0 && timeDiff < smallestPastDiff) {
                smallestPastDiff = timeDiff;
                mostRecentPast = dateElement;
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

    function throttle(fn, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return fn.apply(this, args);
            }
        };
    }

    class TourAutoScroll {
        constructor() {
            this.tourGrid = document.querySelector('.tour-grid');
            this.tourSection = document.querySelector('.tour-section');
            this.tourCards = [];
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

            // Dots removed - using scrollbar instead

            // Start on mobile only
            this.checkIfShouldRun();

            // Listen for resize
            window.addEventListener('resize', this.checkIfShouldRun.bind(this));

            // Add interaction listeners
            this.addTourListeners();
        }

        // Dots functionality removed - using scrollbar instead

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
        }

        checkIfShouldRun() {
            // Auto-scroll only on mobile (horizontal scrolling works on all sizes)
            const isMobile = window.innerWidth <= 768;

            if (isMobile && !this.isActive) {
                this.start();
            } else if (!isMobile && this.isActive) {
                this.stop();
            }
        }

        start() {
            if (this.isActive || this.tourCards.length <= 1) return;
            
            this.isActive = true;
            
            // Only reset currentIndex if we haven't interacted yet
            if (!this.hasInteracted) {
                this.currentIndex = this.findUpcomingIndex();
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

            // Move to next visible card (skip hidden past gigs)
            this.currentIndex = this.nextVisibleIndex(this.currentIndex);
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

            const throttledInteraction = throttle(handleInteraction, 150);

            this.tourGrid.addEventListener('touchstart', handleInteraction, { passive: true });
            this.tourGrid.addEventListener('scroll', throttledInteraction, { passive: true });
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
        }

        isCardHidden(card) {
            return !card || card.classList.contains('tour-card-hidden') || card.offsetParent === null;
        }

        nextVisibleIndex(fromIndex) {
            const n = this.tourCards.length;
            for (let step = 1; step <= n; step++) {
                const idx = (fromIndex + step) % n;
                if (!this.isCardHidden(this.tourCards[idx])) return idx;
            }
            return fromIndex;
        }

        findUpcomingIndex() {
            const now = Date.now();
            let fallback = 0;
            for (let i = 0; i < this.tourCards.length; i++) {
                const card = this.tourCards[i];
                if (this.isCardHidden(card)) continue;
                fallback = i;
                const end = getTourCardEnd(card);
                if (end && end.getTime() >= now) return i;
            }
            return fallback;
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

    // =============================================
    // TOUR LIST: hide gigs older than 7 days + land on the upcoming card
    // Cards stay in the HTML (for SEO/structured data); we just toggle a class.
    // =============================================
    const TOUR_HIDE_DAYS = 7;

    function getTourCardEnd(card) {
        const timeEl = card.querySelector('time');
        if (!timeEl) return null;
        const datetime = timeEl.getAttribute('datetime');
        if (!datetime) return null;
        const base = new Date(datetime + 'T00:00:00');
        if (isNaN(base.getTime())) return null;

        const eventTimeEl = card.querySelector('.event-time');
        const txt = eventTimeEl ? eventTimeEl.textContent.trim() : '';
        const m = txt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);

        const end = new Date(base);
        if (m) {
            const to24 = (h, period) => {
                h = parseInt(h, 10);
                period = period.toUpperCase();
                if (period === 'PM' && h !== 12) h += 12;
                else if (period === 'AM' && h === 12) h = 0;
                return h;
            };
            const startH = to24(m[1], m[3]);
            const endH = to24(m[4], m[6]);
            // Overnight end (e.g. 9:00PM - 12:00AM) rolls into the next day
            if (endH < startH) end.setDate(end.getDate() + 1);
            end.setHours(endH, parseInt(m[5], 10), 0, 0);
        } else {
            // TBD / unparseable time — treat the whole event day as the window
            end.setHours(23, 59, 59, 999);
        }
        return end;
    }

    function applyTourListFilter() {
        const cards = document.querySelectorAll('.tour-date');
        if (!cards.length) return;
        const cutoff = new Date();
        cutoff.setHours(0, 0, 0, 0);
        cutoff.setDate(cutoff.getDate() - TOUR_HIDE_DAYS);

        cards.forEach(card => {
            const timeEl = card.querySelector('time');
            const datetime = timeEl ? timeEl.getAttribute('datetime') : null;
            if (!datetime) return;
            const d = new Date(datetime + 'T00:00:00');
            if (isNaN(d.getTime())) return;
            if (d.getTime() < cutoff.getTime()) {
                card.classList.add('tour-card-hidden');
            } else {
                card.classList.remove('tour-card-hidden');
            }
        });
    }

    function centerUpcomingCard() {
        const grid = document.querySelector('.tour-grid');
        if (!grid) return;
        const cards = Array.from(grid.querySelectorAll('.tour-date'))
            .filter(c => !c.classList.contains('tour-card-hidden'));
        if (!cards.length) return;

        const now = Date.now();
        let target = cards[cards.length - 1]; // fallback: most recent still-visible gig
        for (const c of cards) {
            const end = getTourCardEnd(c);
            if (end && end.getTime() >= now) { target = c; break; }
        }

        const scrollTo = target.offsetLeft + (target.offsetWidth / 2) - (grid.offsetWidth / 2);
        grid.scrollLeft = Math.max(0, scrollTo);
    }

    function initUpcomingTourView() {
        applyTourListFilter();
        // Defer measurement until layout settles so offsets are accurate
        requestAnimationFrame(() => {
            centerUpcomingCard();
            if (window.tourScroller && typeof window.tourScroller.findUpcomingIndex === 'function') {
                window.tourScroller.currentIndex = window.tourScroller.findUpcomingIndex();
            }
        });
    }

    if (document.querySelector('.tour-grid')) {
        initUpcomingTourView();
        window.addEventListener('load', () => setTimeout(initUpcomingTourView, 150));
    }

    // =============================================
    // MAP LAZY LOADER - Performance optimization
    // Mobile: scroll-position based, loads max 3, unloads distant.
    // Desktop: preloads ALL maps staggered behind the loading screen.
    //          Once loaded, maps stay permanently in the DOM.
    // =============================================
    class MapLazyLoader {
        constructor() {
            this.isMobile = screen.width <= 768;
            this.loadedMap = new Map(); // container -> iframe
            this.cardEntries = []; // ordered: { card, container, src, label }
            this.scrollTimer = null;
            this.isScrolling = false;
            this.preloadDone = false;

            document.querySelectorAll('.lazy-map').forEach(iframe => {
                const container = iframe.closest('.venue-map-container');
                const card = iframe.closest('.tour-date');
                if (container && card) {
                    this.cardEntries.push({
                        card,
                        container,
                        src: iframe.dataset.src || '',
                        label: iframe.getAttribute('aria-label') || ''
                    });
                }
            });

            this.init();
        }

        init() {
            if (this.cardEntries.length === 0) return;

            // Remove ALL placeholder iframes — create real ones on demand
            document.querySelectorAll('.lazy-map').forEach(iframe => iframe.remove());

            if (this.isMobile) {
                this.initMobile();
            } else {
                this.preloadAll();
            }
        }

        // MOBILE: single reused iframe. Only loads a map for the
        // most-centered visible card after scrolling stops.
        // One iframe = one Google Maps process = minimal memory.
        initMobile() {
            const grid = document.querySelector('.tour-grid');
            if (!grid) return;

            // Single permanent iframe
            this.mobileIframe = document.createElement('iframe');
            this.mobileIframe.className = 'lazy-map';
            this.mobileIframe.style.border = '0';
            this.mobileIframe.setAttribute('allowfullscreen', '');
            this.mobileIframe.src = 'about:blank';
            this.mobileAssignedTo = null;
            this.mobileCurrentSrc = '';

            grid.addEventListener('scroll', () => {
                this.isScrolling = true;
                clearTimeout(this.scrollTimer);
                this.scrollTimer = setTimeout(() => {
                    this.isScrolling = false;
                    this.assignMobileMap(grid);
                }, 600);
            }, { passive: true });

            const tourSection = document.querySelector('.tour-section');
            if (tourSection) {
                new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting && !this.isScrolling) {
                        this.assignMobileMap(grid);
                    } else if (!entries[0].isIntersecting) {
                        this.parkMobileMap();
                    }
                }, { threshold: 0 }).observe(tourSection);
            }
        }

        // Find the most-centered card and show its map
        assignMobileMap(grid) {
            const gridCenter = grid.scrollLeft + grid.offsetWidth / 2;

            // Find the card closest to center
            let best = null;
            let bestDist = Infinity;
            for (const entry of this.cardEntries) {
                const cardCenter = entry.card.offsetLeft + entry.card.offsetWidth / 2;
                const dist = Math.abs(cardCenter - gridCenter);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = entry;
                }
            }

            if (!best) return;

            // Already showing this card's map — skip
            if (this.mobileAssignedTo === best.container && this.mobileCurrentSrc === best.src) return;

            // Move iframe to new container
            if (this.mobileIframe.parentNode) {
                this.mobileIframe.parentNode.removeChild(this.mobileIframe);
            }
            this.mobileIframe.setAttribute('aria-label', best.label);
            best.container.appendChild(this.mobileIframe);

            // Only change src if it's a different map
            if (this.mobileCurrentSrc !== best.src) {
                this.mobileIframe.src = best.src;
                this.mobileCurrentSrc = best.src;
            }

            this.mobileAssignedTo = best.container;

            // Update loadedMap for crash logger
            this.loadedMap.clear();
            this.loadedMap.set(best.container, this.mobileIframe);
        }

        // Park the iframe when tour section leaves viewport
        parkMobileMap() {
            if (this.mobileIframe.parentNode) {
                this.mobileIframe.parentNode.removeChild(this.mobileIframe);
            }
            this.mobileIframe.src = 'about:blank';
            this.mobileAssignedTo = null;
            this.mobileCurrentSrc = '';
            this.loadedMap.clear();
        }

        // DESKTOP: create iframes in small batches spaced 100ms apart.
        // Iframes start hidden and fade in when their content loads,
        // so the user never sees a blank white rectangle.
        preloadAll() {
            const total = this.cardEntries.length;
            let created = 0;
            let index = 0;

            const createBatch = () => {
                if (index >= total) return;

                const end = Math.min(index + 2, total);
                for (let i = index; i < end; i++) {
                    const iframe = this.createIframe(this.cardEntries[i]);
                    created++;
                    window.dispatchEvent(new CustomEvent('map-progress', {
                        detail: { loaded: created, total }
                    }));
                }
                index = end;

                if (index < total) {
                    setTimeout(createBatch, 100);
                }
            };

            createBatch();
        }

        createIframe(entry) {
            if (this.loadedMap.has(entry.container)) return null;
            entry.container.querySelectorAll('.lazy-map:not([src])').forEach(el => el.remove());

            const iframe = document.createElement('iframe');
            iframe.className = 'lazy-map';
            iframe.src = entry.src;
            iframe.setAttribute('aria-label', entry.label);
            iframe.style.border = '0';
            iframe.setAttribute('allowfullscreen', '');
            entry.container.appendChild(iframe);
            this.loadedMap.set(entry.container, iframe);
            return iframe;
        }
    }

    // Initialize map lazy loader
    window.mapLoader = new MapLazyLoader();

    // =============================================
    // TOUR GRID INTERACTION
    //
    // Cards always come to rest centred, but the landing is a JS tween rather
    // than CSS scroll-snap.
    //
    // Native `scroll-snap-type: mandatory` is what made this feel harsh: its
    // animation timing is not controllable, it fires the moment a scroll ends
    // no matter how far it has to travel, and re-arming it after a programmatic
    // scroll re-snaps instantly, so any sub-pixel drift showed up as a jerk.
    // Chrome's own `behavior: 'smooth'` has the same problem in miniature - one
    // fixed curve whatever the distance.
    //
    // So snapping is turned off and the settle is owned here: an ease-out over
    // a duration that scales with how far it has to go. Short corrections are
    // quick and almost invisible, long ones glide. One engine serves drag,
    // flick, wheel, trackpad and touch, so every input settles identically.
    // =============================================
    (function () {
        const grid = document.querySelector('.tour-grid');
        if (!grid) return;

        const isDesktop = screen.width > 768;
        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Hand snapping over to JS. The CSS keeps `x mandatory` as a no-script
        // fallback; from here on this code owns where a card comes to rest.
        grid.style.scrollSnapType = 'none';

        let settleRaf = null;
        let idleTimer = null;
        let pointerHeld = false;
        let touchHeld = false;
        // True while the desktop drag's momentum is driving the scroll. The
        // idle-settle below must not fire during it - both would be writing
        // scrollLeft on the same frames and the card landed ~80px out.
        let coasting = false;

        // ---- geometry ------------------------------------------------------
        // Measured from bounding rects, NOT offsetLeft: .tour-section is
        // position:relative, so it is the cards' offsetParent and offsetLeft is
        // relative to the section rather than to this scroller. clientWidth is
        // the padding box, which is what a centred card is centred against.
        function cardCentres() {
            const max = grid.scrollWidth - grid.clientWidth;
            const gr = grid.getBoundingClientRect();
            return Array.prototype.slice.call(grid.querySelectorAll('.tour-date'))
                .filter(c => c.offsetWidth > 0)
                .map(c => {
                    const r = c.getBoundingClientRect();
                    return grid.scrollLeft + (r.left - gr.left) + r.width / 2 - grid.clientWidth / 2;
                })
                .map(v => Math.max(0, Math.min(v, max)));
        }

        function nearestCentre(to) {
            const list = cardCentres();
            if (!list.length) return null;
            return list.reduce((a, b) => Math.abs(b - to) < Math.abs(a - to) ? b : a);
        }

        // ---- the settle tween ----------------------------------------------
        function stopSettle() {
            if (settleRaf) { cancelAnimationFrame(settleRaf); settleRaf = null; }
        }

        function settle() {
            const target = nearestCentre(grid.scrollLeft);
            if (target === null) return;

            const start = grid.scrollLeft;
            const dist = target - start;
            if (Math.abs(dist) < 0.5) return;

            if (reduceMotion) { grid.scrollLeft = target; return; }

            // Distance-proportional duration. A 10px nudge should not take the
            // same 400ms as a half-card correction - that fixed duration is a
            // big part of why a snap reads as a yank.
            const duration = Math.min(820, Math.max(300, Math.abs(dist) * 2.8));
            const t0 = performance.now();

            // easeInOutCubic - soft at BOTH ends. An ease-out alone still
            // lurches on its first frame (a 120px correction moved 34px in one
            // frame), and that initial jolt is exactly what reads as a snap.
            // Starting gently means the card appears to drift into place.
            const ease = t => t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;

            stopSettle();
            settleRaf = requestAnimationFrame(function step(now) {
                const p = Math.min((now - t0) / duration, 1);
                grid.scrollLeft = start + dist * ease(p);
                if (p < 1) {
                    settleRaf = requestAnimationFrame(step);
                } else {
                    settleRaf = null;
                }
            });
        }

        // ---- settle whenever scrolling goes quiet ---------------------------
        // Covers wheel, trackpad and native touch momentum as well as the drag
        // below, so every way of moving the row ends the same way.
        function scheduleSettle(delay) {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (pointerHeld || touchHeld || coasting || settleRaf) return;
                settle();
            }, delay);
        }

        grid.addEventListener('scroll', () => {
            // Ignore the scroll events our own tween or momentum generates.
            if (settleRaf || pointerHeld || coasting) return;
            scheduleSettle(touchHeld ? 260 : 150);
        }, { passive: true });

        grid.addEventListener('touchstart', () => {
            touchHeld = true;
            clearTimeout(idleTimer);
            stopSettle();
        }, { passive: true });

        grid.addEventListener('touchend', () => {
            touchHeld = false;
            // Momentum carries on after the finger lifts; the scroll handler
            // keeps pushing the timer out until it actually stops.
            scheduleSettle(260);
        }, { passive: true });

        // ---- desktop click-drag --------------------------------------------
        // Touch is left to native scrolling, which has better momentum than
        // anything reproducible here; it just borrows the settle above.
        if (!isDesktop) return;

        let dragging = false;
        let hasDragged = false;
        let startX = 0;
        let scrollStart = 0;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;
        let coastId = null;

        const FRICTION = 0.95;
        const MAX_V = 55;      // px per frame
        // Hand over to the settle once momentum is down to ~1px a frame. Below
        // that the coast is an imperceptible crawl that was adding ~300ms of
        // dead time before the card started moving to centre - and because the
        // settle eases in, the hand-over itself is invisible.
        const STOP_V = 1.2;

        grid.style.cursor = 'grab';

        function coast() {
            grid.scrollLeft += velocity;
            velocity *= FRICTION;

            // Kill momentum at the ends instead of grinding against them
            const max = grid.scrollWidth - grid.clientWidth;
            if (grid.scrollLeft <= 0 || grid.scrollLeft >= max - 0.5) velocity = 0;

            if (Math.abs(velocity) < STOP_V) {
                coastId = null;
                coasting = false;
                settle();
                return;
            }
            coastId = requestAnimationFrame(coast);
        }

        grid.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse') return;      // touch stays native
            if (e.target.tagName === 'IFRAME') return;  // let maps have their drags
            if (e.button !== 0) return;

            dragging = true;
            pointerHeld = true;
            hasDragged = false;
            startX = e.clientX;
            scrollStart = grid.scrollLeft;
            lastX = e.clientX;
            lastTime = performance.now();
            velocity = 0;

            if (coastId) { cancelAnimationFrame(coastId); coastId = null; }
            coasting = false;
            clearTimeout(idleTimer);
            stopSettle();

            grid.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            // NO preventDefault() here. On pointerdown it suppresses the
            // compatibility mouse events AND the click, so every plain click
            // inside the grid was swallowed. Text selection is handled by
            // user-select above; native image/link dragging by dragstart below.
        });

        // Stop the browser starting a native drag of a card image or link
        grid.addEventListener('dragstart', (e) => e.preventDefault());

        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;

            const dx = e.clientX - startX;
            if (Math.abs(dx) > 3) hasDragged = true;

            // 1:1 with the cursor
            grid.scrollLeft = scrollStart - dx;

            const now = performance.now();
            const dt = now - lastTime;
            if (dt > 0) {
                // Blend with the previous reading so one jittery frame cannot
                // throw the whole gesture.
                const v = (lastX - e.clientX) / dt * 16;
                velocity = velocity * 0.7 + v * 0.3;
                lastX = e.clientX;
                lastTime = now;
            }
        }, { passive: true });

        function endDrag() {
            if (!dragging) return;
            dragging = false;
            pointerHeld = false;
            grid.style.cursor = 'grab';
            document.body.style.userSelect = '';

            velocity = Math.max(-MAX_V, Math.min(MAX_V, velocity));

            if (Math.abs(velocity) > STOP_V) {
                coasting = true;
                coastId = requestAnimationFrame(coast);
            } else if (hasDragged) {
                settle();
            }
        }

        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);

        // Block click events that fire after a drag
        grid.addEventListener('click', (e) => {
            if (hasDragged) {
                e.preventDefault();
                e.stopPropagation();
                hasDragged = false;
            }
        }, true);
    })();

    // =============================================
    // FACEBOOK EMBED MOBILE FIT
    // Adjust the Facebook plugin URL width to match the container on mobile
    // so it renders at the correct size natively (no CSS scaling needed).
    // Must run BEFORE the lazy loader below sets iframe.src.
    // =============================================
    if (window.innerWidth <= 768) {
        const fbEmbed = document.querySelector('.facebook-embed');
        if (fbEmbed) {
            const fbIframe = fbEmbed.querySelector('iframe');
            if (fbIframe) {
                const fbWidth = Math.round(fbEmbed.clientWidth);
                const fbHeight = Math.round(fbWidth * 1.4);
                var src = fbIframe.dataset.src;
                if (src) {
                    src = src.replace(/width=\d+/, 'width=' + fbWidth)
                             .replace(/height=\d+/, 'height=' + fbHeight);
                    fbIframe.dataset.src = src;
                }
                fbIframe.setAttribute('width', fbWidth);
                fbIframe.setAttribute('height', fbHeight);
                fbIframe.style.cssText = 'border:none;overflow:hidden;width:100%;max-width:' + fbWidth + 'px;';

                // Match Instagram wrapper height to Facebook embed height
                var igWrapper = document.querySelector('.instagram-post-wrapper');
                if (igWrapper) {
                    igWrapper.style.maxHeight = fbHeight + 'px';
                }
            }
        }
    }

    // SOCIAL EMBED LAZY LOADER (mobile only)
    // On desktop, the loading screen handles social embeds.
    // On mobile, load when visible, UNLOAD when scrolled away
    // to free memory for map iframes.
    // =============================================
    if (screen.width <= 768) {
        const socialEmbeds = document.querySelectorAll('.lazy-social[data-src]');
        if (socialEmbeds.length > 0) {
            // Store original src for each embed so we can reload later
            const socialSrcMap = new Map();
            socialEmbeds.forEach(iframe => {
                socialSrcMap.set(iframe, iframe.dataset.src);
            });

            const socialObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const iframe = entry.target;
                    const originalSrc = socialSrcMap.get(iframe);
                    if (!originalSrc) return;

                    if (entry.isIntersecting) {
                        // Load if not already loaded
                        if (!iframe.src || iframe.src === 'about:blank') {
                            iframe.src = originalSrc;
                        }
                    } else {
                        // Unload when scrolled away to free memory
                        if (iframe.src && iframe.src !== 'about:blank') {
                            iframe.src = 'about:blank';
                        }
                    }
                });
            }, { rootMargin: '200px', threshold: 0 });

            socialEmbeds.forEach(iframe => socialObserver.observe(iframe));
        }
    }

    // Video autoplay functionality - with visibility-based loading/unloading.
    //
    // .hero-video is deliberately NOT in this list any more. The hero is a
    // two-clip sequence now and its own controller owns play/pause, preload
    // and muting; letting this handler "play every video" would run both hero
    // clips at once and undo the cross-fade.
    const allVideos = document.querySelectorAll('.autoplay-video');

    // On mobile, only play videos that are visible on screen
    const isMobileDevice = window.innerWidth <= 768;

    if (isMobileDevice) {
        // Pause all videos initially, let IntersectionObserver manage them
        allVideos.forEach(video => {
            video.muted = true;
            video.removeAttribute('controls');
            video.setAttribute('preload', 'none');
            video.pause();
        });

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // Only load and play when visible
                    if (video.getAttribute('preload') === 'none') {
                        video.setAttribute('preload', 'auto');
                        video.load();
                    }
                    video.play().catch(e => {});
                } else {
                    // Pause and unload when offscreen to free memory
                    video.pause();
                }
            });
        }, { rootMargin: '50px', threshold: 0 });

        allVideos.forEach(video => videoObserver.observe(video));
    } else {
        // Desktop: play all videos as before
        allVideos.forEach(video => {
            video.muted = true;
            video.removeAttribute('controls');
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Autoplay prevented:', error);
                });
            }
        });
    }

    // Pause videos when tab is inactive
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            allVideos.forEach(video => video.pause());
        } else {
            // Only resume visible videos on mobile
            if (!isMobileDevice) {
                allVideos.forEach(video => video.play().catch(e => {}));
            }
        }
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
        
        const errorMsg = !isValid && showError ? 'Expired or invalid date' : '';
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
                color: 'black',   // PayPal preset - 'blue' clashed with the rose/ink palette
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
        const merchItem = this.closest('.merch-showcase');
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
        this.travel = 0; // Distance scrolled in the current direction
        this.ticking = false;
        this.mobileMenuOpen = false; // Track mobile menu state
        this.pinnedUntil = 0; // Keep navbar visible until this timestamp
        // Tuning: how far to scroll before hiding / showing
        this.hideAfter = 250; // px scrolled down in one go
        this.showAfter = 40;  // px scrolled up in one go
        this.showOnStop = 600; // ms without scrolling before navbar reappears
        this.stopTimer = null;
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

        // Keep navbar visible while a nav link smooth-scrolls to its section
        document.addEventListener('click', (e) => {
            if (e.target.closest('a[href^="#"]')) this.pin(1500);
        });

        // Desktop: reveal navbar when the mouse moves to the top of the window
        document.addEventListener('mousemove', (e) => {
            if (e.clientY < 80 && this.navbar.classList.contains('hidden')) this.pin(0);
        }, { passive: true });

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

        // A scrub (SectionScrubber) sweeps up and down the page far faster
        // than anyone scrolls, and following it would flap the bar in and out.
        // Hold it where it is, keep the bookkeeping current, and let it come
        // back on stop as usual.
        if (document.documentElement.classList.contains('is-scrubbing')) {
            const atTop = window.scrollY < 10;
            this.navbar.classList.toggle('at-top', atTop);
            this.navbar.classList.toggle('scrolled', !atTop);
            this.lastScrollY = window.scrollY;
            this.travel = 0;
            clearTimeout(this.stopTimer);
            this.stopTimer = setTimeout(() => this.pin(0), this.showOnStop);
            return;
        }

        this.scrollDelta = window.scrollY - this.lastScrollY;
        const direction = Math.sign(this.scrollDelta);
        // Accumulate distance while direction holds; reset when it flips
        this.travel = direction === this.scrollDirection ? this.travel + Math.abs(this.scrollDelta) : Math.abs(this.scrollDelta);
        if (direction !== 0) this.scrollDirection = direction;
        this.lastScrollY = window.scrollY;

        // Bring the navbar back once scrolling stops
        clearTimeout(this.stopTimer);
        this.stopTimer = setTimeout(() => this.pin(0), this.showOnStop);

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
        const pinned = Date.now() < this.pinnedUntil || this.navbar.matches(':hover, :focus-within');
        const shouldHide = !pinned && this.scrollDirection > 0 && this.travel > this.hideAfter && window.scrollY > 300;
        const shouldShow = atTop || pinned || (this.scrollDirection < 0 && this.travel > this.showAfter);

        this.navbar.classList.toggle('at-top', atTop);
        this.navbar.classList.toggle('scrolled', !atTop);

        if (shouldShow) {
            this.navbar.classList.remove('hidden');
        } else if (shouldHide) {
            this.navbar.classList.add('hidden');
        }
    }

    // Show the navbar and keep it visible for `ms` milliseconds
    pin(ms) {
        this.pinnedUntil = Date.now() + ms;
        this.travel = 0;
        this.navbar.classList.remove('hidden');
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



// =============================================
// SECTION SCRUBBER
// =============================================
// The scroll progress rail on the right edge, grown into a way to move through
// the page. The rail is cut into one segment per section - chapters, like a
// video timeline - each as long as its section and filling as it is read.
// Hover it, or touch and hold it on a phone, and it grows taller and a name
// pill appears beside each segment, so the rail reads as a map of the page.
// Drag to scrub; click a pill, or a point on the rail, to go there; let go
// close to where a section starts and it settles onto its heading.
//
// Sections opt in with data-scrub="Label" in index.html. This replaced the old
// ProgressBar, which only drew the fill and ran its animation loop on every
// frame forever to do it - this loop sleeps whenever nothing is moving.
//
// The input model, because it is the part that is easy to get wrong:
//   mouse / pen  Pointer Events with capture. The thumb sits under the
//                pointer (absolute), until the pointer wanders left into fine
//                mode, where movement goes relative at half or quarter speed.
//   touch        Touch Events, because only a non-passive touchmove can stop
//                the page panning once the scrub owns the gesture. A finger
//                must be held still for HOLD_MS before it scrubs; move sooner
//                and it is an ordinary scroll, left entirely alone. Touch
//                scrubs are relative: the finger covers the rail, and the rail
//                grows under it as it opens, so absolute would jump the page.
//   keyboard     The rail is a focusable slider. Arrows and Page keys step
//                section to section; Home and End go to the ends.
const SCRUB = {
    HOLD_MS: 280,             // touch-and-hold before a finger scrubs instead of scrolling
    SLOP: 8,                  // px a finger may drift during the hold and still count as held
    DRAG_AFTER: 4,            // px a mouse must move with the button down to be a drag, not a click
    OPEN_DELAY: 70,           // hover intent: brushing the edge on the way elsewhere does not open it
    CLOSE_AFTER: 450,         // linger after the pointer leaves
    CLOSE_AFTER_TOUCH: 1200,  // longer after a touch scrub, so a name can still be tapped
    FOLLOW_MS: 55,            // time constant of the page catching up with a mouse drag
    TOUCH_TRACK_S: 0.04,      // a finger drag: how quickly the page picks up the finger's speed ...
    TOUCH_EASE_S: 0.045,      // ... the ease that closes whatever gap is left ...
    TOUCH_MAX_V: 8000,        // ... never faster than this, px/s (a wild flick; ordinary drags stay under it) ...
    TOUCH_MAX_A: 60000,       // ... and getting up to speed no quicker than this, px/s²
    FILL_MS: 70,              // time constant of the fill catching up with ordinary scrolling
    SNAP_PX: 12,              // let go within this many px of a segment's top and it settles on its heading
    SNAP_PX_TOUCH: 18,
    FINE: [110, 220],         // px left of the rail where a drag drops to half, then quarter speed
    FINE_TOUCH: [80, 160],
    PILL_GAP: 8,              // minimum px of air between two pills on the open rail
    PILL_GAP_TOUCH: 10,
    PILL_EDGE: 12,            // px from the rail to the pills' edge: right of it scrubs, left of it picks a pill
    KNOB_MS: 40,              // time constant of the knob gliding to a new place
    MAG: 0.1,                 // dock magnification: extra scale right at the thumb ...
    MAG_TOUCH: 0.14,
    MAG_R: 70,                // ... falling away to nothing this many px from it
    MAG_R_TOUCH: 90
};

const clamp01 = v => Math.min(1, Math.max(0, v));

class SectionScrubber {
    constructor(root) {
        this.root = root;
        this.rail = root.querySelector('.scrubber-rail');
        this.segs = root.querySelector('.scrubber-segs');
        this.thumb = root.querySelector('.scrubber-thumb');
        this.index = root.querySelector('.scrubber-index');
        this.chip = root.querySelector('.scrubber-chip');
        this.probe = root.querySelector('.scrubber-probe');
        this.html = document.documentElement;
        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.coarse = window.matchMedia('(pointer: coarse)');

        this.sections = [];      // { el, label, start, enter, end, frac, at, seg, track, item, name, scale, fill }
        this.maxScroll = 0;
        this.rect = null;        // the rail's box, re-read each frame while it can be moving

        this.open = false;
        this.pointer = null;     // a hovering mouse / pen, or the scrubbing finger: { x, y }
        this.picking = false;    // the pointer is over the pills rather than the rail
        this.press = null;       // a mouse / pen button held down on the scrubber
        this.touch = null;       // a finger on the scrubber, arming or armed

        this.mode = 'idle';      // 'idle' | 'drag' | 'chase' (a finger let go, page still catching up) | 'glide'
        this.vel = 0;            // touch drag / chase: the page's speed, px/s
        this.tv = 0;             // touch drag: the finger's own speed, as page px/s, smoothed
        this.lastTo = 0;         // touch drag: last frame's target, to measure that speed
        this.byTouch = false;    // the current (or last) drag is a finger's
        this.at = 0;             // drag: where the page has been eased to (px)
        this.to = 0;             // drag: where it is headed (px)
        this.frac = 0;           // drag: the thumb, 0..1 down the rail
        this.anchor = null;      // drag: origin of relative scrubbing
        this.speed = 1;          // drag: 1, 0.5 or 0.25
        this.glide = null;       // { from, to, t0, dur }

        this.shown = 0;          // the fill as drawn, eased toward the page
        this.cur = -1;           // the section the page is in
        this.tgt = -1;           // the section the knob points at
        this.pointing = false;
        this.knobY = 0;          // where the knob is drawn, px down the rail
        this.knobOn = false;     // it was showing last frame (else it appears in place, no glide)
        this.aria = '';

        this.raf = 0;
        this.last = 0;
        this.openTimer = 0;
        this.closeTimer = 0;
        this.holdTimer = 0;
        this.morphUntil = 0;     // keep painting until then: the rail is changing size
        this.measureQueued = false;
        this.frame = this.frame.bind(this);

        root.style.setProperty('--hold', SCRUB.HOLD_MS + 'ms');
        this.build();
        if (!this.sections.length) return;
        this.bind();
        this.measure();
    }

    // ---- structure ------------------------------------------------------------

    build() {
        const segs = document.createDocumentFragment();
        const names = document.createDocumentFragment();
        document.querySelectorAll('[data-scrub]').forEach((el, i) => {
            const seg = document.createElement('span');
            seg.className = 'scrubber-seg';
            const track = document.createElement('span');
            track.className = 'scrubber-track';
            const fill = document.createElement('span');
            fill.className = 'scrubber-fill';
            track.append(fill);
            seg.append(track);

            const item = document.createElement('li');
            item.className = 'scrubber-label';
            item.dataset.i = i;
            item.style.setProperty('--i', i);
            const name = document.createElement('span');
            name.className = 'scrubber-name';
            name.textContent = el.dataset.scrub;
            item.append(name);

            segs.append(seg);
            names.append(item);
            this.sections.push({ el, label: el.dataset.scrub, start: 0, enter: 0, end: 0, frac: 0, at: 0,
                                 seg, track, item, name, scale: 1, fill: -1 });
        });
        this.segs.replaceChildren(segs);
        this.index.replaceChildren(names);
    }

    // Two scroll positions per section:
    //   start  where it LANDS: its top just clear of the navbar, by the same
    //          clearance the nav links use (--nav-offset, kept live by
    //          syncNavOffset). Clicks, keys and snaps go here.
    //   enter  where it becomes the section you are IN: its top crossing the
    //          middle of the visible page. The segments, their fills and
    //          "which section" all follow this. Using start for that as well
    //          said "Merch" while Follow Us already filled most of the screen
    //          and only its heading had yet to reach the navbar.
    measure() {
        this.measureQueued = false;
        const html = this.html;
        const max = this.maxScroll = Math.max(0, html.scrollHeight - window.innerHeight);
        const clearance = parseFloat(getComputedStyle(html).getPropertyValue('--nav-offset')) || 80;
        const lead = Math.max(0, (window.innerHeight - clearance) / 2);
        const within = v => Math.min(max, Math.max(0, v));
        const y = window.scrollY;
        let prevStart = 0, prevEnter = 0;
        for (const s of this.sections) {
            const land = s.el.getBoundingClientRect().top + y - clearance;
            // Clamped into the scrollable range and kept in page order, so the
            // last sections - which can start below the final scroll position -
            // sit at the bottom of the rail rather than off the end of it.
            s.start = prevStart = Math.max(prevStart, within(land));
            s.enter = prevEnter = Math.max(prevEnter, within(land - lead));
        }
        this.root.hidden = this.maxScroll < 1;
        this.layout();
        this.wake();
    }

    remeasure() {
        if (this.measureQueued) return;
        this.measureQueued = true;
        requestAnimationFrame(() => this.measure());
    }

    // Every section gets an EQUAL share of the rail, whatever its height;
    // within its segment the rail maps evenly onto the stretch of scrolling
    // during which that section is the one on screen (enter to the next
    // enter). See railToScroll. Each pill sits beside the middle of its
    // segment, nudged apart only if two would touch on the OPEN rail - which,
    // with equal segments, only happens if there are too many to fit.
    layout() {
        const secs = this.sections, n = secs.length;
        secs.forEach((s, i) => {
            s.end = i + 1 < n ? secs[i + 1].enter : this.maxScroll;
            s.frac = i / n;
            s.seg.style.setProperty('--a', (s.frac * 100).toFixed(3) + '%');
            s.seg.style.setProperty('--len', (100 / n).toFixed(3) + '%');
            s.fill = -1;                          // repaint the fills against the new ranges
        });

        const h = this.probe.offsetHeight || 400;
        const pill = secs[0].item.offsetHeight || 26;
        const step = pill + (this.coarse.matches ? SCRUB.PILL_GAP_TOUCH : SCRUB.PILL_GAP);
        const lo = pill / 2, hi = h - pill / 2;   // keep whole pills within the rail's height
        const ys = secs.map((s, i) => (i + 0.5) / n * h);
        ys[0] = Math.max(ys[0], lo);
        for (let i = 1; i < n; i++) ys[i] = Math.max(ys[i], ys[i - 1] + step);
        ys[n - 1] = Math.min(ys[n - 1], hi);
        for (let i = n - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - step);
        // More pills than the rail has room for at that spacing: share it out
        if (ys[0] < lo) for (let i = 0; i < n; i++) ys[i] = n > 1 ? lo + (hi - lo) * i / (n - 1) : h / 2;
        secs.forEach((s, i) => {
            s.at = ys[i] / h;
            s.item.style.setProperty('--y', (s.at * 100).toFixed(3) + '%');
        });
    }

    // Rail position (0..1) <-> scroll position (px). Equal segments, each
    // mapped evenly onto its own section. Proportional segments - each as long
    // as its section is tall - ran from 6% of the rail to 25% on a phone, and
    // Performances got 8%: the reel scrolled out of view, and its sound faded
    // away, in 45px of finger travel (74px now), while Book Now took an age.
    // This way a tall section scrubs a little faster and a short one a little
    // slower, and every chapter gets the same room under the finger.
    railToScroll(f) {
        const secs = this.sections, n = secs.length;
        const x = clamp01(f) * n;
        const i = Math.min(n - 1, Math.floor(x));
        return secs[i].enter + (x - i) * (secs[i].end - secs[i].enter);
    }

    scrollToRail(y) {
        const i = this.sectionAt(y), s = this.sections[i];
        const t = s.end > s.enter ? clamp01((y - s.enter) / (s.end - s.enter)) : 1;
        return (i + t) / this.sections.length;
    }

    railSection(f) {
        return Math.min(this.sections.length - 1, Math.floor(clamp01(f) * this.sections.length));
    }

    bind() {
        const root = this.root;
        window.addEventListener('scroll', () => this.wake(), { passive: true });
        window.addEventListener('resize', () => this.remeasure(), { passive: true });
        window.addEventListener('load', () => this.remeasure());
        // Videos, maps, fonts and the gig list all change the page's height late
        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => this.remeasure()).observe(document.body);
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.remeasure());

        // Mouse and pen
        root.addEventListener('pointerenter', e => {
            if (e.pointerType === 'touch') return;
            this.pointer = { x: e.clientX, y: e.clientY };
            this.openSoon();
            this.wake();
        });
        root.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            this.pointer = { x: e.clientX, y: e.clientY };
            const p = this.press;
            if (p && !p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) > SCRUB.DRAG_AFTER) {
                p.moved = true;
                this.startDrag(false);
            }
            this.wake();
        });
        root.addEventListener('pointerleave', e => {
            if (e.pointerType === 'touch' || this.press) return;
            this.pointer = null;
            this.closeSoon();
            this.wake();
        });
        root.addEventListener('pointerdown', e => this.pointerDown(e));
        root.addEventListener('pointerup', e => this.pointerUp(e, false));
        root.addEventListener('pointercancel', e => this.pointerUp(e, true));
        root.addEventListener('lostpointercapture', e => this.pointerUp(e, true));

        // Touch
        root.addEventListener('touchstart', e => this.touchStart(e), { passive: true });
        root.addEventListener('touchmove', e => this.touchMove(e), { passive: false });
        root.addEventListener('touchend', e => this.touchEnd(e, false));
        root.addEventListener('touchcancel', e => this.touchEnd(e, true));
        // A long press would otherwise raise the context menu or the callout
        root.addEventListener('contextmenu', e => e.preventDefault());

        // Keyboard
        this.rail.addEventListener('keydown', e => this.key(e));
        this.rail.addEventListener('focus', () => {
            if (this.rail.matches(':focus-visible')) this.openNow();
        });
        this.rail.addEventListener('blur', () => {
            if (!this.pointer) this.closeSoon();
        });

        // Any other attempt to scroll takes the page back from a glide in flight
        const takeBack = e => {
            if ((this.mode === 'glide' || this.mode === 'chase') && !root.contains(e.target)) this.stopGlide();
        };
        window.addEventListener('wheel', takeBack, { passive: true });
        window.addEventListener('touchstart', takeBack, { passive: true });
        window.addEventListener('pointerdown', takeBack, { passive: true });
        window.addEventListener('keydown', takeBack);
    }

    // The mobile menu and the cart both freeze the page, and so does this
    blocked() {
        const b = document.body;
        return b.classList.contains('body-no-scroll') || b.style.overflow === 'hidden';
    }

    // ---- open / close -----------------------------------------------------------

    openNow() {
        clearTimeout(this.openTimer);
        clearTimeout(this.closeTimer);
        if (this.open) return;
        this.open = true;
        this.root.classList.add('is-open');
        this.morphing();
    }

    // The rail grows and shrinks over .55s (styles.css). Everything laid out
    // in px against it - the thumb, the magnification - has to be repainted
    // through that, even with the pointer holding still, or it stays placed
    // for the size the rail was when the animation began.
    morphing() {
        this.morphUntil = performance.now() + 650;
        this.wake();
    }

    openSoon() {
        clearTimeout(this.closeTimer);
        if (this.open) return;
        clearTimeout(this.openTimer);
        this.openTimer = setTimeout(() => this.openNow(), SCRUB.OPEN_DELAY);
    }

    closeSoon(ms = SCRUB.CLOSE_AFTER) {
        clearTimeout(this.openTimer);
        clearTimeout(this.closeTimer);
        this.closeTimer = setTimeout(() => this.close(), ms);
    }

    close() {
        // Never out from under a drag, a finger, a hovering pointer or keyboard focus
        if (this.mode === 'drag' || this.touch || this.press || this.pointer ||
            this.rail.matches(':focus-visible')) return;
        this.open = false;
        this.root.classList.remove('is-open');
        this.morphing();
    }

    // ---- mouse and pen ------------------------------------------------------------

    pointerDown(e) {
        if (e.pointerType === 'touch' || e.button !== 0 || this.blocked()) return;
        e.preventDefault();                   // no text selection, and no focus ring for a click
        this.stopGlide();
        this.byTouch = false;
        this.pointer = { x: e.clientX, y: e.clientY };
        this.press = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, name: this.pickAt(e.clientX, e.clientY) };
        try { this.root.setPointerCapture(e.pointerId); } catch (_) { /* pointer already gone */ }
        this.openNow();
    }

    pointerUp(e, cancelled) {
        const p = this.press;
        if (!p || p.id !== e.pointerId) return;
        this.press = null;
        if (this.root.hasPointerCapture(e.pointerId)) this.root.releasePointerCapture(e.pointerId);
        if (p.moved) {
            this.endDrag();
        } else if (!cancelled) {
            // A click: a name goes to its section, the rail to that point in the page
            if (p.name >= 0) this.glideTo(this.sections[p.name].start);
            else this.glideTo(this.snap(this.railToScroll(this.fracAt(e.clientY))));
        }
        // Let go somewhere else: nothing is hovering the scrubber any more
        const over = document.elementFromPoint(e.clientX, e.clientY);
        if (!over || !this.root.contains(over)) {
            this.pointer = null;
            this.closeSoon();
        }
        this.wake();
    }

    fracAt(clientY) {
        const r = this.rail.getBoundingClientRect();
        return r.height ? clamp01((clientY - r.top) / r.height) : 0;
    }

    // Which pill a point is picking, if any. Decided purely by WHERE the point
    // is, never by which element is under it: the pills grow as the pointer
    // nears them, and hit-testing their moving edges flipped the choice - and
    // the knob with it - back and forth under a pointer that was barely
    // moving. Right of the pills' edge is the rail, which scrubs to a
    // position; left of it, the nearest pill by height is the one picked.
    pickAt(x, y) {
        if (!this.open) return -1;
        const r = this.rect || this.rail.getBoundingClientRect();
        if (!r.height || x > r.left - SCRUB.PILL_EDGE) return -1;
        const f = (y - r.top) / r.height;
        let best = -1, bestD = Infinity;
        this.sections.forEach((s, i) => {
            const d = Math.abs(f - s.at);
            if (d < bestD) { bestD = d; best = i; }
        });
        return best;
    }

    // ---- touch --------------------------------------------------------------------

    touchStart(e) {
        if (this.touch || e.touches.length !== 1 || this.blocked()) return;
        const t = e.changedTouches[0];
        this.stopGlide();
        this.touch = { id: t.identifier, x: t.clientX, y: t.clientY, armed: false, name: this.pickAt(t.clientX, t.clientY) };
        this.root.classList.add('is-arming');
        clearTimeout(this.holdTimer);
        this.holdTimer = setTimeout(() => this.arm(), SCRUB.HOLD_MS);
    }

    touchOf(e) {
        if (!this.touch) return null;
        for (const t of e.changedTouches) if (t.identifier === this.touch.id) return t;
        return null;
    }

    touchMove(e) {
        const T = this.touch, t = this.touchOf(e);
        if (!t) return;
        if (!T.armed) {
            // Moved before the hold completed: this is a scroll. Hands off.
            if (Math.hypot(t.clientX - T.x, t.clientY - T.y) > SCRUB.SLOP) this.disarm();
            return;
        }
        // The browser has already started panning - not ours to stop any more
        if (!e.cancelable) { this.touchEnd(e, true); return; }
        e.preventDefault();
        this.pointer = { x: t.clientX, y: t.clientY };
        this.wake();
    }

    touchEnd(e, cancelled) {
        const T = this.touch;
        if (!T || !this.touchOf(e)) return;
        clearTimeout(this.holdTimer);
        this.touch = null;
        this.root.classList.remove('is-arming');
        if (T.armed) {
            this.pointer = null;
            this.endDrag();
            this.closeSoon(SCRUB.CLOSE_AFTER_TOUCH);
        } else if (!cancelled && T.name >= 0) {
            // A tap on a name while the index is still up after a scrub
            if (e.cancelable) e.preventDefault();   // and no ghost click on the page beneath
            this.glideTo(this.sections[T.name].start);
            this.closeSoon(SCRUB.CLOSE_AFTER_TOUCH);
        }
    }

    arm() {
        const T = this.touch;
        if (!T || T.armed) return;
        T.armed = true;
        this.root.classList.remove('is-arming');
        this.pointer = { x: T.x, y: T.y };
        this.openNow();
        this.startDrag(true);
        this.buzz(12);
    }

    disarm() {
        clearTimeout(this.holdTimer);
        this.touch = null;
        this.root.classList.remove('is-arming');
    }

    // Android only: iOS has no vibration API for the web. Skipped until the
    // visitor has tapped the page, since Chrome refuses it before then and
    // logs an intervention warning each time.
    buzz(ms) {
        const ua = navigator.userActivation;
        if (!navigator.vibrate || (ua && !ua.hasBeenActive)) return;
        try { navigator.vibrate(ms); } catch (_) { /* not allowed here */ }
    }

    // ---- keyboard -----------------------------------------------------------------

    // Down goes to the next section heading below where the page is, up to
    // the nearest one above - by landing position, not by which section is
    // current, so a heading still on its way up the screen is not skipped.
    key(e) {
        const secs = this.sections;
        const base = this.mode === 'glide' ? this.glide.to : this.mode === 'chase' ? this.to : window.scrollY;
        let to;
        switch (e.key) {
            case 'ArrowDown': case 'ArrowRight': case 'PageDown': {
                const next = secs.find(s => s.start > base + 2);
                to = next ? next.start : this.maxScroll;
                break;
            }
            case 'ArrowUp': case 'ArrowLeft': case 'PageUp': {
                let prev = null;
                for (const s of secs) if (s.start < base - 2) prev = s;
                to = prev ? prev.start : 0;
                break;
            }
            case 'Home': to = 0; break;
            case 'End': to = this.maxScroll; break;
            default: return;
        }
        e.preventDefault();
        this.openNow();
        this.glideTo(to);
    }

    // ---- moving the page ------------------------------------------------------------

    startDrag(byTouch) {
        this.stopGlide();
        this.mode = 'drag';
        this.byTouch = byTouch;
        this.vel = this.tv = 0;
        this.at = this.to = this.lastTo = window.scrollY;
        this.frac = this.scrollToRail(this.at);
        this.anchor = null;
        this.speed = 1;
        this.root.classList.add('is-dragging');
        this.html.classList.add('is-scrubbing', 'is-scrub-drag');
        this.wake();
    }

    // The pointer, turned into a place in the page. Absolute for a mouse near
    // the rail: the thumb is wherever the pointer is. Relative for a finger,
    // and for either once it wanders left into fine mode, where each px of
    // movement is worth only half or a quarter of what it is on the rail.
    steer(r) {
        const { x, y } = this.pointer;
        const [half, quarter] = this.byTouch ? SCRUB.FINE_TOUCH : SCRUB.FINE;
        const away = r.left - x;
        const speed = away > quarter ? 0.25 : away > half ? 0.5 : 1;
        if (speed === 1 && !this.byTouch) {
            this.anchor = null;
            this.frac = clamp01((y - r.top) / r.height);
        } else {
            if (!this.anchor || this.anchor.speed !== speed) this.anchor = { y, frac: this.frac, speed };
            const raw = this.anchor.frac + (y - this.anchor.y) / r.height * speed;
            this.frac = clamp01(raw);
            // Pinned against an end: re-anchor there, so turning back moves it at once
            if (raw !== this.frac) this.anchor = { y, frac: this.frac, speed };
        }
        if (speed !== this.speed) {
            this.speed = speed;
            this.root.classList.toggle('is-fine', speed < 1);
            if (speed < 1) this.chip.textContent = speed === 0.5 ? 'Half-speed scrub' : 'Quarter-speed scrub';
        }
        this.to = this.railToScroll(this.frac);
    }

    endDrag() {
        if (this.mode !== 'drag') return;
        this.mode = 'idle';
        this.speed = 1;
        this.anchor = null;
        this.root.classList.remove('is-dragging', 'is-fine');
        this.html.classList.remove('is-scrub-drag');
        const to = this.snap(this.to);
        if (this.byTouch && !this.reduced.matches) {
            // A finger usually lets go with the page still catching up. Keep
            // chasing at the same capped speed rather than handing over to a
            // glide: its ease-out starts fast, and would lurch the page forward
            // at the very moment of release.
            // The finger has stopped, so stop carrying its speed: the rest is
            // closing the gap, which then never runs the wrong way towards a
            // snap point behind it.
            this.to = this.lastTo = to;
            this.tv = 0;
            this.mode = 'chase';
            this.wake();
        } else {
            this.glideTo(to);
        }
    }

    // A finger drag. The page moves WITH the finger - at the finger's own
    // speed, measured frame to frame - and an ease closes whatever gap is left.
    // A first version only chased the gap, so the page had to fall behind
    // before it moved at all, and fell further behind the faster the finger
    // went: a quarter of a second late, half a second to catch up.
    //
    // Two limits keep it smooth: a top speed, and a cap on how quickly it gets
    // up to speed. A finger can fling the target the length of the page in one
    // frame, and following that 1:1 moved the page hundreds of px a frame,
    // which on a phone reads as judder, not speed. Ordinary drags stay under
    // both. Slowing down and turning round are never held back, and it never
    // steps past the target, so it stops where the finger does. True while
    // still moving.
    chase(dt) {
        const s = dt / 1000;
        if (s > 0) {
            const raw = (this.to - this.lastTo) / s;
            this.tv += (raw - this.tv) * (1 - Math.exp(-s / SCRUB.TOUCH_TRACK_S));
        }
        this.lastTo = this.to;
        const gap = this.to - this.at;
        // Caught up. Carry on at the finger's speed rather than stopping dead:
        // from a standstill it would have to speed up again under the cap
        // next frame, and stop-start every frame is a stutter.
        if (Math.abs(gap) < 0.5) { this.at = this.to; this.vel = this.tv; return Math.abs(this.tv) > 5; }
        const want = Math.max(-SCRUB.TOUCH_MAX_V, Math.min(SCRUB.TOUCH_MAX_V, this.tv + gap / SCRUB.TOUCH_EASE_S));
        if (Math.sign(want) !== Math.sign(this.vel)) this.vel = 0;           // turning round: from a standstill
        if (Math.abs(want) > Math.abs(this.vel)) {                           // speeding up: limited
            this.vel += Math.sign(want) * Math.min(SCRUB.TOUCH_MAX_A * dt / 1000, Math.abs(want) - Math.abs(this.vel));
        } else {
            this.vel = want;                                                  // slowing down: not
        }
        const next = this.at + this.vel * s;
        this.at = gap > 0 ? Math.min(next, this.to) : Math.max(next, this.to);   // never past the target
        if (this.at === this.to) this.vel = Math.sign(this.tv) === Math.sign(gap) ? this.tv : 0;
        return this.at !== this.to || Math.abs(this.tv) > 5;
    }

    // Let go at the top of a segment - anywhere from just above it down to
    // where its heading lands, a little way inside it - and the page settles
    // with that heading just under the navbar. Anywhere else, it stays
    // exactly where it was let go.
    // Measured on the rail, where the finger is, not in page px: segments are
    // equal on the rail but map onto very different amounts of page.
    snap(y) {
        const h = this.rect ? this.rect.height : this.rail.getBoundingClientRect().height;
        if (!h) return y;
        const tol = (this.byTouch ? SCRUB.SNAP_PX_TOUCH : SCRUB.SNAP_PX) / h;
        const f = this.scrollToRail(y);
        for (const s of this.sections) {
            if (f >= s.frac - tol && f <= this.scrollToRail(s.start) + tol) return s.start;
        }
        return y;
    }

    // Clicks, keys and snaps glide rather than jump: an ease-out that covers
    // most of the distance at once and then lands softly, longer for further.
    glideTo(y) {
        y = Math.min(this.maxScroll, Math.max(0, y));
        const from = window.scrollY, d = Math.abs(y - from);
        if (d < 1 || this.reduced.matches) {
            window.scrollTo(0, y);
            this.mode = 'idle';
            this.glide = null;
            this.settle();
            return;
        }
        this.html.classList.add('is-scrubbing');
        this.glide = { from, to: y, t0: performance.now(), dur: Math.min(900, 360 + d * 0.045) };
        this.mode = 'glide';
        this.wake();
    }

    // Stops a glide, or the chase after a finger let go
    stopGlide() {
        if (this.mode !== 'glide' && this.mode !== 'chase') return;
        this.mode = 'idle';
        this.glide = null;
        this.vel = 0;
        this.settle();
    }

    // Scrub over: the page goes back to ordinary scrolling
    settle() {
        if (this.mode !== 'idle') return;
        this.html.classList.remove('is-scrubbing', 'is-scrub-drag');
        this.wake();
    }

    sectionAt(y) {
        const secs = this.sections;
        let i = 0;
        while (i + 1 < secs.length && secs[i + 1].enter <= y + 1) i++;
        return i;
    }

    // ---- the frame ------------------------------------------------------------------

    wake() {
        if (this.raf) return;
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.frame);
    }

    frame(now) {
        this.raf = 0;
        const dt = Math.min(50, Math.max(0, now - this.last));
        this.last = now;
        const instant = this.reduced.matches;
        let busy = now < this.morphUntil;

        // The rail's box moves while it opens and closes. One read per frame,
        // before anything below writes, so it never forces a second layout.
        if (this.open || this.mode !== 'idle' || busy) this.rect = this.rail.getBoundingClientRect();

        if (this.mode === 'drag' || this.mode === 'chase') {
            if (this.mode === 'drag' && this.pointer) this.steer(this.rect);
            if (instant) {
                this.at = this.to;
                this.vel = 0;
            } else if (this.byTouch) {
                if (this.chase(dt)) busy = true;
            } else {
                // A mouse: eased rather than 1:1. A long page over a short rail
                // turns one px of pointer into ten or more of page, and jumping
                // that far on every event reads as judder; 55ms is too short to
                // be felt as lag.
                const k = 1 - Math.exp(-dt / SCRUB.FOLLOW_MS);
                this.at += (this.to - this.at) * k;
                if (Math.abs(this.to - this.at) < 0.5) this.at = this.to; else busy = true;
            }
            window.scrollTo(0, this.at);
            if (this.mode === 'chase' && this.at === this.to) { this.mode = 'idle'; this.settle(); }
        } else if (this.mode === 'glide') {
            const g = this.glide;
            const t = clamp01((now - g.t0) / g.dur);
            const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);   // ease-out expo
            window.scrollTo(0, g.from + (g.to - g.from) * e);
            if (t < 1) busy = true;
            else { this.mode = 'idle'; this.glide = null; this.settle(); }
        }

        const y = this.mode === 'drag' ? this.at : window.scrollY;
        const p = this.maxScroll ? clamp01(y / this.maxScroll) : 0;
        const k = instant || this.mode !== 'idle' ? 1 : 1 - Math.exp(-dt / SCRUB.FILL_MS);
        this.shown += (p - this.shown) * k;
        if (Math.abs(p - this.shown) < 0.0005) this.shown = p; else busy = true;

        // Each chapter's fill: how far through it the (eased) page is. Only the
        // one being read is ever part-way; the rest sit at 0 or 1 and are left
        // alone once written.
        const ys = this.shown * this.maxScroll;
        for (const s of this.sections) {
            const f = s.end > s.enter ? clamp01((ys - s.enter) / (s.end - s.enter)) : (ys >= s.enter ? 1 : 0);
            if (Math.abs(f - s.fill) > 0.0005) {
                s.fill = f;
                s.seg.style.setProperty('--f', f.toFixed(4));
            }
        }

        if (this.paint(y, p, dt)) busy = true;
        if (busy) this.wake();
    }

    // Everything the rail shows, from where the page is (y) and, when there is
    // one, where the knob is. Only touches the DOM where something changed.
    // Returns true while the knob is still gliding.
    paint(y, p, dt) {
        const secs = this.sections, r = this.rect;
        const cur = this.sectionAt(y);

        // The knob: the scrub's target while dragging. Otherwise, with the
        // index open: under the pointer on the rail, or - over the pills -
        // level with the picked pill, where its hairline meets the rail. Not
        // at its section's start, even though that is where a click lands:
        // the pill sits beside the MIDDLE of its segment, so a knob at the
        // start floated above the very pill it was pointing out. The lit
        // segment already shows which chapter a click goes to. (The pick is
        // by index, not position, because sections squeezed together at the
        // bottom of the page share a position.)
        let tf = -1, tgt = -1, pick = -1;
        if (this.mode === 'drag') {
            tf = this.frac;
            tgt = this.railSection(tf);
        } else if (this.pointer && this.open && r && r.height) {
            pick = this.pickAt(this.pointer.x, this.pointer.y);
            if (pick >= 0) { tgt = pick; tf = secs[pick].at; }
            else { tf = clamp01((this.pointer.y - r.top) / r.height); tgt = this.railSection(tf); }
        }
        const pointing = tf >= 0;
        if ((pick >= 0) !== this.picking) {
            this.picking = pick >= 0;
            this.root.classList.toggle('is-picking', this.picking);
        }

        if (cur !== this.cur) {
            if (this.cur >= 0) secs[this.cur].item.classList.remove('is-current');
            secs[cur].item.classList.add('is-current');
            this.cur = cur;
        }
        if (tgt !== this.tgt) {
            if (this.tgt >= 0) {
                secs[this.tgt].item.classList.remove('is-target');
                secs[this.tgt].seg.classList.remove('is-target');
            }
            if (tgt >= 0) {
                secs[tgt].item.classList.add('is-target');
                secs[tgt].seg.classList.add('is-target');
                if (this.mode === 'drag' && this.tgt >= 0) this.crossed(secs[tgt]);
            }
            this.tgt = tgt;
        }
        if (pointing !== this.pointing) {
            this.pointing = pointing;
            this.root.classList.toggle('is-pointing', pointing);
        }

        let gliding = false;
        const h = r ? r.height : 0;
        if (pointing && h) {
            // The knob glides to a new place rather than jumping - from the
            // pointer to a section's start as the pointer crosses onto the
            // pills, and along with the rail as it grows. Held in a drag it is
            // the thing in the hand, so 1:1; and it appears where it belongs
            // rather than sliding in from wherever it was last seen.
            const want = tf * h;
            if (!this.knobOn || this.mode === 'drag' || this.reduced.matches) this.knobY = want;
            else {
                this.knobY += (want - this.knobY) * (1 - Math.exp(-dt / SCRUB.KNOB_MS));
                if (Math.abs(want - this.knobY) < 0.3) this.knobY = want; else gliding = true;
            }
            this.knobOn = true;
            this.thumb.style.transform = `translate3d(0, ${this.knobY.toFixed(1)}px, 0)`;

            // Dock magnification, smoothstep falloff. Centred on the POINTER
            // while hovering: centring it on the knob moved the pills under a
            // pointer that was standing still. Centred on the knob while
            // dragging, where the pointer can be off in fine mode or under a
            // finger.
            const cy = this.mode === 'drag' || !this.pointer ? want : this.pointer.y - r.top;
            const touch = this.byTouch && this.mode === 'drag';
            const mag = touch ? SCRUB.MAG_TOUCH : SCRUB.MAG;
            const reach = touch ? SCRUB.MAG_R_TOUCH : SCRUB.MAG_R;
            for (const sec of secs) {
                const k = Math.max(0, 1 - Math.abs(cy - sec.at * h) / reach);
                this.scaleTo(sec, 1 + mag * k * k * (3 - 2 * k));
            }
        } else {
            this.knobOn = false;
            for (const sec of secs) this.scaleTo(sec, 1);
        }

        // The fine-scrub chip rides just above the pointer
        if (this.speed < 1 && this.pointer) {
            this.chip.style.transform =
                `translate3d(${Math.round(this.pointer.x)}px, ${Math.round(this.pointer.y)}px, 0) translate(-50%, -190%)`;
        }

        const pct = Math.round(p * 100);
        const text = `${secs[cur].label}, ${pct}%`;
        if (text !== this.aria) {
            this.aria = text;
            this.rail.setAttribute('aria-valuenow', pct);
            this.rail.setAttribute('aria-valuetext', text);
        }
        return gliding;
    }

    scaleTo(sec, s) {
        if (Math.abs(s - sec.scale) < 0.002) return;
        sec.scale = s;
        sec.item.style.setProperty('--s', s.toFixed(3));
    }

    // Scrubbing across into another section: its segment swells for a beat,
    // its name nudges, and on Android the phone gives a tick you can feel.
    crossed(sec) {
        if (this.byTouch) this.buzz(6);
        if (this.reduced.matches || !sec.track.animate) return;
        const ease = { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
        sec.track.animate([{ transform: 'scaleX(2)' }, { transform: 'none' }], ease);
        sec.name.animate([{ transform: 'translateX(-4px)' }, { transform: 'none' }], ease);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('scrubber');
    if (root) new SectionScrubber(root);
});

// Initialize testimonials carousel
// The track is a native scroll-snap scroller (see styles.css), so touch
// swiping is handled by the browser. This wires up arrows, dots, keyboard,
// the active-card highlight and a gentle autoplay.
function initTestimonialsCarousel() {
    const carousel = document.querySelector('.testimonials-carousel');
    const track = document.getElementById('testimonials-track');
    const prevBtn = document.getElementById('testimonials-prev');
    const nextBtn = document.getElementById('testimonials-next');
    const dotsContainer = document.getElementById('testimonials-dots');

    if (!carousel || !track || !prevBtn || !nextBtn || !dotsContainer) return;

    const cards = Array.from(track.querySelectorAll('.testimonial-card'));
    const dots = Array.from(dotsContainer.querySelectorAll('.dot'));
    if (cards.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoPlayDelay = 7000;
    let currentIndex = -1;
    let autoPlayTimer = null;
    let userInteracted = false;
    let isHovered = false;
    let inView = false;
    let scrollRaf = null;
    // While a button/autoplay scroll animates, hold the highlight on its target
    // so the dots don't flicker through every card it passes on the way
    let targetIndex = null;
    let targetTimer = null;

    function releaseTarget() {
        targetIndex = null;
        clearTimeout(targetTimer);
    }

    function setActive(index) {
        if (index === currentIndex) return;
        currentIndex = index;
        cards.forEach((card, i) => {
            const active = i === index;
            card.classList.toggle('is-active', active);
            card.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        dots.forEach((dot, i) => {
            const active = i === index;
            dot.classList.toggle('active', active);
            dot.setAttribute('aria-current', active ? 'true' : 'false');
        });
    }

    function goTo(index) {
        const i = (index + cards.length) % cards.length;
        const card = cards[i];
        const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
        targetIndex = i;
        clearTimeout(targetTimer);
        targetTimer = setTimeout(releaseTarget, 1200); // fallback if scrollend never fires
        setActive(i);
        track.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    // Work out which card is centred after any scroll (swipe, arrows, autoplay)
    function syncFromScroll() {
        scrollRaf = null;
        if (targetIndex !== null) return;
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((card, i) => {
            const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
            if (dist < bestDist) {
                bestDist = dist;
                best = i;
            }
        });
        setActive(best);
    }

    track.addEventListener('scroll', () => {
        if (!scrollRaf) scrollRaf = requestAnimationFrame(syncFromScroll);
    }, { passive: true });

    track.addEventListener('scrollend', () => {
        releaseTarget();
        syncFromScroll();
    });

    // Autoplay: only while visible, not hovered, and until the visitor takes over
    function canAutoPlay() {
        return !reduceMotion && !userInteracted && !isHovered && inView && !document.hidden;
    }

    function scheduleAutoPlay() {
        clearTimeout(autoPlayTimer);
        if (!canAutoPlay()) return;
        autoPlayTimer = setTimeout(() => {
            if (canAutoPlay()) goTo(currentIndex + 1);
            scheduleAutoPlay();
        }, autoPlayDelay);
    }

    function takeOver() {
        userInteracted = true;
        clearTimeout(autoPlayTimer);
    }

    nextBtn.addEventListener('click', () => { takeOver(); goTo(currentIndex + 1); });
    prevBtn.addEventListener('click', () => { takeOver(); goTo(currentIndex - 1); });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => { takeOver(); goTo(index); });
    });

    // Arrow keys only when focus is inside the carousel
    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            takeOver();
            goTo(currentIndex + (e.key === 'ArrowRight' ? 1 : -1));
        }
    });

    // A finger or trackpad on the track takes over from any running animation
    track.addEventListener('pointerdown', () => { takeOver(); releaseTarget(); }, { passive: true });
    track.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { takeOver(); releaseTarget(); }
    }, { passive: true });

    // Native scrolling stops at the last card, so a further forward swipe
    // that starts there wraps back to the first card
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeFromLast = false;

    track.addEventListener('touchstart', (e) => {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeFromLast = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        if (!swipeFromLast) return;
        swipeFromLast = false;
        const dx = e.changedTouches[0].clientX - swipeStartX;
        const dy = e.changedTouches[0].clientY - swipeStartY;
        if (dx < -40 && Math.abs(dx) > Math.abs(dy)) goTo(0);
    }, { passive: true });

    carousel.addEventListener('mouseenter', () => { isHovered = true; clearTimeout(autoPlayTimer); });
    carousel.addEventListener('mouseleave', () => { isHovered = false; scheduleAutoPlay(); });
    document.addEventListener('visibilitychange', scheduleAutoPlay);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting;
            scheduleAutoPlay();
        }, { threshold: 0.5 }).observe(carousel);
    } else {
        inView = true;
    }

    // Keep the current card centred when the layout changes
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const card = cards[currentIndex];
            track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: 'auto' });
        }, 150);
    });

    setActive(0);
    scheduleAutoPlay();
}

// Make sure to call this function when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - initializing carousel');

    // Wait a bit to ensure all elements are rendered
    setTimeout(() => {
        initTestimonialsCarousel();
    }, 100);

    // Initialize tour calendar
    initTourCalendar();
});

// =============================================
// TOUR CALENDAR FUNCTIONALITY
// =============================================

class TourCalendar {
    constructor() {
        this.currentDate = new Date();
        this.tourDates = [];
        this.calendarView = document.querySelector('.tour-calendar-view');
        this.listView = document.querySelector('.tour-grid');
        this.monthYearElement = document.querySelector('.calendar-month-year');
        this.calendarDaysElement = document.querySelector('.calendar-days');
        this.prevMonthBtn = document.querySelector('.prev-month');
        this.nextMonthBtn = document.querySelector('.next-month');
        this.todayBtn = document.querySelector('.calendar-today-btn');
        this.viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
        this.popup = document.getElementById('calendar-popup');
        this.activeDay = null;
        this.closeTimer = null;

        this.init();
    }

    init() {
        if (!this.calendarView || !this.listView) {
            console.error('Calendar or list view elements not found');
            return;
        }

        // Extract tour dates from the DOM
        this.extractTourDates();

        // Set up event listeners
        this.setupEventListeners();

        // Render initial calendar (but keep it hidden)
        this.renderCalendar();
    }

    extractTourDates() {
        const tourDateCards = document.querySelectorAll('.tour-date');
        this.tourDates = [];

        tourDateCards.forEach(card => {
            const timeElement = card.querySelector('time');
            const venueElement = card.querySelector('.venue-header h3');
            const venuePromoElement = card.querySelector('.venue-promo');
            const venueDescElement = card.querySelector('.venue-desc');
            const eventTimeElement = card.querySelector('.event-time');
            const eventAgeElement = card.querySelector('.event-age');
            const addressElement = card.querySelector('.venue-address');

            if (timeElement && venueElement) {
                const datetime = timeElement.getAttribute('datetime');
                const venue = venueElement.textContent.trim();
                const venuePromo = venuePromoElement ? venuePromoElement.textContent.trim() : '';
                const venueDesc = venueDescElement ? venueDescElement.textContent.trim() : '';
                const time = eventTimeElement ? eventTimeElement.textContent.trim() : 'TBD';
                const age = eventAgeElement ? eventAgeElement.textContent.trim() : '';
                const address = addressElement ? addressElement.textContent.trim() : '';

                if (datetime) {
                    this.tourDates.push({
                        date: new Date(datetime + 'T00:00:00'),
                        venue: venue,
                        venuePromo: venuePromo,
                        venueDesc: venueDesc,
                        time: time,
                        age: age,
                        address: address,
                        element: card
                    });
                }
            }
        });

        console.log('Extracted tour dates:', this.tourDates);
    }

    setupEventListeners() {
        // View toggle buttons
        this.viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Month navigation
        if (this.prevMonthBtn) {
            this.prevMonthBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changeMonth(-1);
                this.closePopup();
            });
        }

        if (this.nextMonthBtn) {
            this.nextMonthBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.changeMonth(1);
                this.closePopup();
            });
        }

        // Jump back to the current month
        if (this.todayBtn) {
            this.todayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.goToToday();
                this.closePopup();
            });
        }

        // Close popup when clicking outside calendar days or popup
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.calendar-day') && !e.target.closest('.calendar-event-popup')) {
                this.closePopup();
            }
        });

        // Allow closing popup by clicking on calendar background/grid
        if (this.calendarView) {
            this.calendarView.addEventListener('click', (e) => {
                // Close if clicking on calendar background, but not on days or popup
                if (e.target === this.calendarView ||
                    e.target.classList.contains('calendar-grid') ||
                    e.target.classList.contains('calendar-days') ||
                    e.target.classList.contains('calendar-weekdays')) {
                    this.closePopup();
                }
            });
        }

        // Close popup with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePopup();
            }
        });
    }

    switchView(view) {
        // Update button states
        this.viewToggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        // Show/hide views
        if (view === 'calendar') {
            this.calendarView.style.display = 'block';
            this.listView.style.display = 'none';
            this.renderCalendar();
        } else {
            this.calendarView.style.display = 'none';
            // Restore list view - remove inline style to use CSS defaults
            this.listView.style.display = '';
        }
    }

    changeMonth(delta) {
        // Pin to the 1st so e.g. Jan 31 + 1 month doesn't skip to March
        this.currentDate.setDate(1);
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
        const todayCell = this.calendarDaysElement.querySelector('.calendar-day.today');
        if (todayCell) {
            todayCell.classList.remove('today-flash');
            void todayCell.offsetWidth; // restart the animation
            todayCell.classList.add('today-flash');
        }
    }

    renderCalendar() {
        if (!this.monthYearElement || !this.calendarDaysElement) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update header
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        this.monthYearElement.textContent = `${monthNames[month]} ${year}`;

        // "Today" button is only useful when viewing another month
        if (this.todayBtn) {
            const now = new Date();
            const onCurrentMonth = year === now.getFullYear() && month === now.getMonth();
            this.todayBtn.disabled = onCurrentMonth;
            this.todayBtn.setAttribute('aria-label', onCurrentMonth ? 'Showing the current month' : 'Go to today');
        }

        // Clear previous days
        this.calendarDaysElement.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dimCutoff = new Date(today);
        dimCutoff.setDate(dimCutoff.getDate() - 7);

        // Add previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = this.createDayElement(day, true);
            this.calendarDaysElement.appendChild(dayElement);
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            currentDate.setHours(0, 0, 0, 0);

            const isToday = currentDate.getTime() === today.getTime();
            const events = this.getEventsForDate(currentDate);

            const dayElement = this.createDayElement(day, false, isToday, events);
            if (events.length > 0 && currentDate.getTime() < dimCutoff.getTime()) {
                dayElement.classList.add('past-dim');
            }
            this.calendarDaysElement.appendChild(dayElement);
        }

        // Add next month's leading days
        const totalCells = this.calendarDaysElement.children.length;
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days

        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createDayElement(day, true);
            this.calendarDaysElement.appendChild(dayElement);
        }
    }

    createDayElement(day, isOtherMonth = false, isToday = false, events = []) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        if (isOtherMonth) {
            dayDiv.classList.add('other-month');
        }

        if (isToday) {
            dayDiv.classList.add('today');
            dayDiv.setAttribute('aria-current', 'date');
            dayDiv.title = 'Today';
        }

        if (events.length > 0) {
            dayDiv.classList.add('has-event');
        }

        // Day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        // Event count and click handler
        if (events.length > 0) {
            const eventCount = document.createElement('div');
            eventCount.className = 'calendar-day-events';
            eventCount.textContent = events.length === 1 ? '1 show' : `${events.length} shows`;
            dayDiv.appendChild(eventCount);

            // Store events data
            dayDiv.dataset.events = JSON.stringify(events);

            // Click/tap: one show -> jump to its card in List View;
            // several shows -> popup so the visitor can pick one
            dayDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                if (events.length === 1 && this.canShowCard(events[0].element)) {
                    this.goToCard(events[0].element);
                } else {
                    this.cancelPopupClose();
                    this.showPopup(dayDiv, events);
                }
            });

            // Desktop hover to show popup
            dayDiv.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) {
                    this.cancelPopupClose();
                    this.showPopup(dayDiv, events);
                }
            });

            // Desktop mouse leave to schedule close
            dayDiv.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    this.schedulePopupClose();
                }
            });
        }

        return dayDiv;
    }

    // Past gigs older than a week are hidden from List View, so there's no card to show
    canShowCard(card) {
        return !!card && !card.classList.contains('tour-card-hidden');
    }

    // Switch to List View, bring the tour section into view and center the card
    goToCard(card) {
        this.closePopup();
        this.switchView('list');

        requestAnimationFrame(() => {
            const tour = document.getElementById('tour');
            if (tour) {
                window.scrollTo({ top: tour.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
            }

            // Reuse the auto-scroller so it also pauses after this "interaction"
            const scroller = window.tourScroller;
            const index = scroller ? scroller.tourCards.indexOf(card) : -1;
            if (index >= 0) {
                scroller.goToCard(index);
            } else {
                const grid = this.listView;
                const left = card.offsetLeft + card.offsetWidth / 2 - grid.offsetWidth / 2;
                grid.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            }

            // Light the card once the scrolling has settled, so the flash isn't
            // missed while the page is still moving
            let lit = false;
            const light = () => {
                if (lit) return;
                lit = true;
                card.classList.remove('card-spotlight');
                void card.offsetWidth; // restart the animation
                card.classList.add('card-spotlight');
                clearTimeout(card._spotlightTimer);
                card._spotlightTimer = setTimeout(() => card.classList.remove('card-spotlight'), 3000);
            };
            if ('onscrollend' in window) {
                window.addEventListener('scrollend', light, { once: true });
            }
            setTimeout(light, 700);
        });
    }

    getEventsForDate(date) {
        return this.tourDates.filter(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === date.getTime();
        });
    }

    showPopup(dayElement, events) {
        if (!this.popup || events.length === 0) return;

        // Clear previous content
        this.popup.innerHTML = '';

        // Build popup content
        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'popup-event';

            // Venue name
            const venue = document.createElement('div');
            venue.className = 'popup-venue';
            venue.textContent = event.venue;
            eventDiv.appendChild(venue);

            // Event time and age on same line
            const timeAge = document.createElement('div');
            timeAge.className = 'popup-time-age';
            timeAge.innerHTML = `<i class="fas fa-clock"></i> ${event.time}`;
            if (event.age) {
                timeAge.innerHTML += ` <span class="popup-age-inline">${event.age}</span>`;
            }
            eventDiv.appendChild(timeAge);

            // Address (compact)
            if (event.address) {
                const address = document.createElement('div');
                address.className = 'popup-address';
                address.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${event.address}`;
                eventDiv.appendChild(address);
            }

            // Click through to the card in List View
            if (this.canShowCard(event.element)) {
                eventDiv.classList.add('popup-event-link');
                eventDiv.setAttribute('role', 'button');
                eventDiv.tabIndex = 0;
                const cta = document.createElement('div');
                cta.className = 'popup-view-card';
                cta.innerHTML = 'View details <i class="fas fa-arrow-right"></i>';
                eventDiv.appendChild(cta);

                const open = (e) => {
                    e.stopPropagation();
                    this.goToCard(event.element);
                };
                eventDiv.addEventListener('click', open);
                eventDiv.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        open(e);
                    }
                });
            }

            this.popup.appendChild(eventDiv);
        });

        // Position and show popup
        this.positionAndShowPopup(dayElement);
        this.activeDay = dayElement;

        // Setup popup hover listeners (keep popup open when hovering over it)
        if (!this.popup.hasAttribute('data-listeners-added')) {
            this.popup.addEventListener('mouseenter', () => {
                this.cancelPopupClose();
            });

            this.popup.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) {
                    this.schedulePopupClose();
                }
            });

            this.popup.setAttribute('data-listeners-added', 'true');
        }
    }

    positionAndShowPopup(dayElement) {
        const dayRect = dayElement.getBoundingClientRect();
        const padding = 10;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Show popup to measure
        this.popup.style.visibility = 'visible';
        this.popup.style.opacity = '1';

        // Get popup dimensions
        const popupRect = this.popup.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;

        // Calculate horizontal position (centered on day)
        let left = dayRect.left + (dayRect.width / 2) - (popupWidth / 2);

        // Keep within horizontal bounds
        if (left < padding) {
            left = padding;
        } else if (left + popupWidth > viewportWidth - padding) {
            left = viewportWidth - popupWidth - padding;
        }

        // Calculate vertical position (try above first)
        let top = dayRect.top - popupHeight - padding;

        // If doesn't fit above, position below
        if (top < padding) {
            top = dayRect.bottom + padding;
        }

        // Apply position
        this.popup.style.left = `${Math.max(padding, left)}px`;
        this.popup.style.top = `${Math.max(padding, top)}px`;
    }

    schedulePopupClose() {
        this.cancelPopupClose();
        this.closeTimer = setTimeout(() => {
            this.closePopup();
        }, 200); // Small delay to allow moving to popup
    }

    cancelPopupClose() {
        if (this.closeTimer) {
            clearTimeout(this.closeTimer);
            this.closeTimer = null;
        }
    }

    closePopup() {
        if (!this.popup) return;

        this.cancelPopupClose();
        this.popup.style.visibility = 'hidden';
        this.popup.style.opacity = '0';
        this.activeDay = null;
    }
}

// Initialize tour calendar
function initTourCalendar() {
    // Wait for tour dates to be loaded
    if (document.querySelectorAll('.tour-date').length > 0) {
        new TourCalendar();
    } else {
        // Retry after a short delay if tour dates aren't loaded yet
        setTimeout(initTourCalendar, 500);
    }
}

// =============================================
// LOADING SCREEN CONTROLLER
// Polls the DOM every 100ms to count how many map
// iframes exist. Drives logo opacity + glow directly
// from that count. No events needed — can't miss anything.
// Dismisses once 50%+ maps created AND 2s minimum passed.
// =============================================
(function() {
    const loader = document.getElementById('site-loader');
    if (!loader) {
        // No preloader on the page - nothing will ever hand over, so release
        // the hero sweep immediately or it would never run at all.
        document.documentElement.classList.add('site-entered');
        return;
    }

    const logo = loader.querySelector('.loader-logo');
    // The logo sits inside a .logo-shimmer wrapper that carries the specular
    // sweep and the colour-reveal mask. --load goes on the WRAPPER so both the
    // greyscale <img> and the colour .loader-logo-fill read the same value.
    const logoFade = (logo && logo.closest('.logo-shimmer')) || logo;
    const isMobile = screen.width <= 768;
    let dismissed = false;
    let windowLoaded = false;
    let warmUpDone = false;

    // Preloader progress. Drives the colour-reveal: the logo sits greyscale
    // and its colour floods up from the bottom as --load goes 0 -> 1. The
    // sound-wave bars and the "Loading" caption that used to live here are
    // gone; the reveal is the whole loading indicator now.
    // The progress sources are lumpy: the desktop ramp ticks every 50ms (20fps)
    // and blends a stepped iframe count into a smooth time curve. Writing that
    // straight to --load makes the bloom visibly stutter. So progress only sets
    // a TARGET, and a rAF loop eases the displayed value toward it every frame.
    // That is what makes the spill silky rather than steppy.
    var targetLoad = 0;
    var shownLoad = 0;
    var rafId = null;

    function updateLogo(t) {
        if (!logo) return;
        // Never let the bloom retreat, even if a source reports lower.
        if (t > targetLoad) targetLoad = t;
    }

    function renderLoad() {
        var gap = targetLoad - shownLoad;
        // Exponential follow - fast enough to keep up, slow enough to smooth.
        shownLoad += gap * 0.075;
        if (gap < 0.0004) shownLoad = targetLoad;
        if (logoFade) logoFade.style.setProperty('--load', shownLoad.toFixed(4));
        matchHeroSize();   // keeps the mark locked on the hero through the warm-up scroll
        rafId = requestAnimationFrame(renderLoad);
    }

    function dismiss() {
        if (dismissed) return;
        dismissed = true;
        updateLogo(1);
        matchHeroSize();

        // Let the colour finish spilling before anything else happens. Without
        // this the fade can start while the bloom is still mid-flight and the
        // last of the reveal is never seen. Capped so a stalled frame can't
        // hang it.
        var waitStart = Date.now();
        (function awaitBloom() {
            if (shownLoad < 0.995 && Date.now() - waitStart < 900) {
                requestAnimationFrame(awaitBloom);
                return;
            }

            // Colour is home. One slow sweep plus the glow's breath, then hand
            // over. ENTRY_SWEEP_MS covers the longer of the two animations in
            // styles.css (loader-glow-breath, 1.35s).
            var ENTRY_SWEEP_MS = 1350;
            if (logoFade) logoFade.classList.add('reveal-done');

            setTimeout(() => {
                loader.classList.add('loaded');
                loader.classList.add('fade-out');
                // Releases the hero logo's ambient sweep (styles.css). Held
                // until now so its first pass is always keyframe 0% - leftward,
                // the opposite of the rightward hand-off sweep above.
                document.documentElement.classList.add('site-entered');
                setTimeout(() => {
                    if (rafId) cancelAnimationFrame(rafId);
                    loader.remove();
                }, 800);
            }, ENTRY_SWEEP_MS - 300); // let the fade start as the breath settles
        })();
    }

    // Lock the loader mark onto the hero mark.
    //
    // Matching width alone was not enough - the two were the same SIZE but not
    // in the same PLACE, because the loader centres its logo in the viewport
    // while the hero logo sits inside .hero-content with its own margins. So
    // instead of sizing, take the hero logo's real bounding rect and pin the
    // loader wrapper to it with position:fixed. The two marks are then exactly
    // one on one, and the hand-off at the end of loading is seamless.
    var lastRect = { l: NaN, t: NaN, w: NaN, h: NaN };

    function matchHeroSize() {
        var heroLogo = document.querySelector('.hero-logo-img');
        if (!heroLogo || !logo || !logoFade) return;
        var r = heroLogo.getBoundingClientRect();
        if (r.width <= 0) return;

        // DOCUMENT coordinates, not viewport ones.
        //
        // forceRenderMaps() warm-scrolls the page down to the tour section and
        // back to force the map iframes in. getBoundingClientRect() is
        // viewport-relative, so during that scroll the hero logo's rect goes
        // thousands of pixels negative - and because this mark is position:fixed
        // and re-synced every frame, it followed the hero straight off the top
        // of the screen and only came back when the scroll returned. That was
        // the logo "disappearing and reappearing" mid-load.
        //
        // Adding scrollY/scrollX makes the value scroll-invariant, and since the
        // page rests at the top when the loader hands over, it is also exactly
        // where the hero logo will be sitting at that moment.
        var docTop = r.top + window.scrollY;
        var docLeft = r.left + window.scrollX;

        if (Math.abs(docLeft - lastRect.l) < 0.5 && Math.abs(docTop - lastRect.t) < 0.5 &&
            Math.abs(r.width - lastRect.w) < 0.5 && Math.abs(r.height - lastRect.h) < 0.5) {
            return;
        }
        lastRect = { l: docLeft, t: docTop, w: r.width, h: r.height };

        logoFade.style.position = 'fixed';
        logoFade.style.left = docLeft + 'px';
        logoFade.style.top = docTop + 'px';
        logoFade.style.width = r.width + 'px';
        logoFade.style.height = r.height + 'px';
        logoFade.style.margin = '0';

        logo.style.width = '100%';
        logo.style.height = '100%';
        logo.style.maxWidth = 'none';
        logo.classList.add('sized');

        // The wrapper starts at opacity 0 (styles.css) so nothing shows before
        // the mark has been placed. Reveal it once, here - progress is carried
        // by --load from now on, not by opacity.
        logoFade.style.opacity = '1';
    }
    // Try immediately and on load. Started here rather than beside renderLoad()
    // because that loop calls matchHeroSize(), which reads lastRect - declared
    // just above, so the loop must not run before this point.
    matchHeroSize();
    window.addEventListener('load', matchHeroSize);
    window.addEventListener('resize', matchHeroSize);
    renderLoad();

    // Same ease-in-out the desktop ramp uses, so both paths fill identically.
    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    if (isMobile) {
        // Mobile used to sit at a flat 0.5 and then snap to 1 on load, which
        // left the colour fill frozen half way. Run a real time-based ramp so
        // the reveal actually animates. The dismiss triggers below are
        // untouched - only the visual progress changed.
        var mobileStart = Date.now();
        var mobileMinDisplay = 2500;
        var mobileRamp = 2600;

        updateLogo(0);
        var mobileRampId = setInterval(function () {
            if (dismissed) { clearInterval(mobileRampId); return; }
            var t = Math.min((Date.now() - mobileStart) / mobileRamp, 1);
            updateLogo(Math.min(easeInOut(t), 0.95)); // dismiss() sets 100%
        }, 50);

        function mobileDismiss() {
            var elapsed = Date.now() - mobileStart;
            if (elapsed < mobileMinDisplay) {
                setTimeout(dismiss, mobileMinDisplay - elapsed);
            } else {
                dismiss();
            }
        }
        window.addEventListener('load', mobileDismiss);
        setTimeout(dismiss, 5000);
        return;
    }

    // Load social embeds as soon as DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.lazy-social[data-src]').forEach(iframe => {
            iframe.src = iframe.dataset.src;
            iframe.removeAttribute('data-src');
            iframe.classList.remove('lazy-social');
        });
    });

    // Track window.load
    window.addEventListener('load', () => { windowLoaded = true; });
    if (document.readyState === 'complete') windowLoaded = true;

    // -------------------------------------------------------
    // ONE SINGLE SMOOTH RAMP from 0% → 95%
    // Runs from page start, updates every 50ms.
    // Progress = weighted average of:
    //   - Time elapsed (smooth baseline so it never stalls)
    //   - Iframes created (real creation progress)
    //   - Warm-up scroll done (boolean bump)
    // Dismiss when: ramp >= 95% AND window.load fired.
    // -------------------------------------------------------
    var startTime = Date.now();
    var expectedDuration = 10000; // 10 seconds for full ramp
    var totalMaps = 0;

    var rampId = setInterval(() => {
        if (dismissed) { clearInterval(rampId); return; }

        // Count maps
        if (totalMaps === 0) {
            totalMaps = document.querySelectorAll('.venue-map-container').length || 1;
        }
        var created = document.querySelectorAll('.venue-map-container iframe[src]').length;
        var creationProgress = Math.min(created / totalMaps, 1);

        // Time progress — ease-in-out so it starts slow, builds in the middle, slows at end
        var elapsed = Date.now() - startTime;
        var timeT = Math.min(elapsed / expectedDuration, 1);
        var timeEased = easeInOut(timeT);

        // Warm-up bump
        var warmUpBonus = warmUpDone ? 0.05 : 0;

        // Blend: 70% time-based (slow, steady) + 25% creation + 5% warm-up
        var blended = (timeEased * 0.7) + (creationProgress * 0.25) + warmUpBonus;
        // Cap at 95% — dismiss() sets 100%
        var progress = Math.min(blended, 0.95);

        updateLogo(progress);

        // Dismiss when we're at 93%+ AND window.load has fired
        if (progress >= 0.93 && windowLoaded) {
            clearInterval(rampId);
            dismiss();
        }
    }, 50);

    // Kick off warm-up scroll once all iframes are created
    var creationPoll = setInterval(() => {
        if (dismissed) { clearInterval(creationPoll); return; }
        var total = document.querySelectorAll('.venue-map-container').length;
        var created = document.querySelectorAll('.venue-map-container iframe[src]').length;
        if (total > 0 && created >= total) {
            clearInterval(creationPoll);
            forceRenderMaps();
        }
    }, 200);

    function forceRenderMaps() {
        var tourSection = document.getElementById('tour');
        if (!tourSection) { warmUpDone = true; return; }

        window.scrollTo(0, tourSection.offsetTop);

        var grid = document.querySelector('.tour-grid');
        if (!grid) { warmUpDone = true; return; }

        var saved = grid.style.scrollBehavior;
        grid.style.scrollBehavior = 'auto';
        var maxScroll = grid.scrollWidth - grid.clientWidth;
        var pos = 0;
        var step = Math.max(Math.ceil(maxScroll / 8), 1);

        var scrollId = setInterval(() => {
            pos += step;
            if (pos >= maxScroll) {
                grid.scrollLeft = maxScroll;
                clearInterval(scrollId);
                setTimeout(() => {
                    grid.scrollLeft = 0;
                    grid.style.scrollBehavior = saved;
                    window.scrollTo(0, 0);
                    warmUpDone = true;
                }, 300);
            } else {
                grid.scrollLeft = pos;
            }
        }, 150);
    }

    // Absolute failsafe
    setTimeout(dismiss, 12000);
})();

// =============================================
// AUDIO COORDINATOR
//
// Two things on this page can make noise - the hero background and the
// performances reel - and they must never do it at the same time. Whichever
// one is asked for sound claims it here and every other player is told to go
// quiet. The level is shared as well, so setting it in one place sets it in
// both, and each clip carries a data-gain trim measured from its own loudness
// (ffmpeg ebur128) so moving between them is a change of scene, not of volume.
// =============================================
const SiteAudio = (function () {
    const players = new Map();   // id -> { silence(), apply(gain) }
    const ramps = new WeakMap();
    let level = 0.8;             // 0..1, the slider's own position
    let restore = 0.8;           // where to come back to after a mute

    // Perceived loudness tracks roughly the square of amplitude, so a slider
    // sitting at half should be a quarter of the gain. A linear map feels dead
    // across the bottom half and barely moves across the top.
    const curve = p => p * p;

    const api = {
        register(id, player) { players.set(id, player); },

        // Only ever called from a user gesture. Everyone else goes quiet first.
        claim(id) { players.forEach((p, key) => { if (key !== id) p.silence(); }); },

        get level() { return level; },
        get gain() { return curve(level); },
        set level(p) {
            level = Math.max(0, Math.min(1, p));
            if (level > 0) restore = level;   // remember it for the next unmute
            players.forEach(player => player.apply(curve(level)));
        },

        // Muting takes the level to zero as well - a control reading 80% while
        // nothing can be heard is just wrong - and unmuting puts back whatever
        // it was before rather than guessing.
        mute() { api.level = 0; },
        unmute() { api.level = level > 0 ? level : (restore > 0 ? restore : 0.8); },

        // The per-clip trim written into the markup as data-gain.
        trim(v) {
            const g = v && v.dataset ? parseFloat(v.dataset.gain) : NaN;
            return isFinite(g) && g > 0 ? Math.min(1, g) : 1;
        },

        // What this particular clip's volume should be right now.
        target(v) { return curve(level) * api.trim(v); },

        stopRamp(v) {
            if (!v) return;
            const r = ramps.get(v);
            if (r) { cancelAnimationFrame(r); ramps.delete(v); }
        },

        // Volume is ramped, never snapped. Cutting a clip's audio dead while
        // its picture is still dissolving is the thing that makes a video
        // carousel feel cheap, and jumping straight to full lands as a thump.
        ramp(v, to, ms, done) {
            if (!v) return;
            api.stopRamp(v);
            const from = v.volume;
            const end = Math.max(0, Math.min(1, to));
            if (ms <= 0 || Math.abs(end - from) < 0.001) {
                v.volume = end;
                if (done) done();
                return;
            }
            const t0 = performance.now();
            const step = (now) => {
                const t = Math.min(1, (now - t0) / ms);
                const e = t * t * (3 - 2 * t);   // smoothstep: gentle at both ends
                v.volume = Math.max(0, Math.min(1, from + (end - from) * e));
                if (t < 1) {
                    ramps.set(v, requestAnimationFrame(step));
                } else {
                    ramps.delete(v);
                    if (done) done();
                }
            };
            ramps.set(v, requestAnimationFrame(step));
        },
    };

    return api;
})();

// Wires one .vol pill - mute button plus slider - and hands back the functions
// that repaint it. The host owns what on/off actually means for its video;
// this only knows how to show it and how to report that it was used.
function volumeUI(root, host) {
    if (!root) return { paint: function () {}, setAvailable: function () {} };
    const btn = root.querySelector('.vol-btn');
    const slider = root.querySelector('.vol-slider');
    if (!btn || !slider) return { paint: function () {}, setAvailable: function () {} };

    const sliderLabel = slider.getAttribute('aria-label') || 'Volume';
    let dragging = false;
    let available = true;
    let pendingOn = false;
    let frame = null;

    function render() {
        frame = null;
        const on = pendingOn;
        const pct = Math.round(SiteAudio.level * 100);
        root.classList.toggle('is-on', !!on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? host.onLabel : host.offLabel);

        // Each arc fades in across its own slice of the range, so the speaker
        // grows with the level rather than snapping from bare to three waves.
        // The cross-over bands overlap deliberately: at any given level at
        // least one arc is part way in, which is what reads as movement.
        const live = on && available;
        const band = (lo, hi) => live ? Math.max(0, Math.min(1, (SiteAudio.level - lo) / (hi - lo))) : 0;
        root.style.setProperty('--w1', band(0.01, 0.30).toFixed(3));
        root.style.setProperty('--w2', band(0.26, 0.64).toFixed(3));
        root.style.setProperty('--w3', band(0.60, 0.97).toFixed(3));
        // The cross only means "muted by choice". A clip with no audio shows a
        // bare speaker instead - nothing was switched off, there is just nothing
        // there - so those two states do not look the same.
        root.style.setProperty('--mute', (!on || (available && pct === 0)) ? '1' : '0');
        // Writing the value back into the slider the pointer is holding fights
        // the drag - the thumb stutters against its own input. The browser is
        // already drawing the right position there.
        if (!dragging && +slider.value !== pct) slider.value = pct;
        slider.setAttribute('aria-valuetext', pct + '%');
        slider.style.setProperty('--v', pct + '%');
    }

    // A drag fires input far faster than the screen refreshes; coalescing to
    // one write per frame is what keeps the fill gliding instead of thrashing.
    function paint(on) {
        pendingOn = !!on;
        if (frame) return;
        frame = requestAnimationFrame(render);
    }

    // Only the level is taken away on a silent clip - see the note on
    // .vol.is-unavailable in the stylesheet for why the button stays live.
    function setAvailable(yes) {
        available = !!yes;
        root.classList.toggle('is-unavailable', !available);
        slider.disabled = !available;
        slider.setAttribute('aria-label', available ? sliderLabel : host.noneLabel);
        root.setAttribute('title', available ? '' : host.noneLabel);
        paint(pendingOn);
    }

    btn.addEventListener('click', host.toggle);

    // Dragging or arrowing the slider is itself a user gesture, so a viewer who
    // reaches straight for the level while muted gets sound - which is plainly
    // what they were asking for.
    slider.addEventListener('input', () => {
        if (!available) return;
        // Setting the level is itself an interaction: hold it open, restart the
        // linger. Without this it could fold away under the cursor mid-adjust.
        openNow();
        closeSoon();
        SiteAudio.level = slider.value / 100;
        host.level();
    });

    // ---- lingering ----------------------------------------------------------
    // The level does not snap shut the moment the pointer leaves, and it
    // certainly does not vanish while it is being set. Any interaction opens it
    // and resets the clock; it folds itself away a couple of seconds after the
    // last one, and hovering brings it straight back.
    const LINGER_MS = 2200;
    let closeTimer = null;

    function openNow() {
        clearTimeout(closeTimer);
        root.classList.add('is-open');
    }

    function closeSoon(ms) {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            root.classList.remove('is-open');
        }, ms === undefined ? LINGER_MS : ms);
    }

    root.addEventListener('mouseenter', openNow);
    root.addEventListener('mouseleave', () => closeSoon());
    slider.addEventListener('focus', openNow);
    slider.addEventListener('blur', () => closeSoon());

    slider.addEventListener('pointerdown', () => {
        dragging = true;
        root.classList.add('is-dragging');
        openNow();
    });
    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        root.classList.remove('is-dragging');
        closeSoon();
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return { paint: paint, setAvailable: setAvailable };
}

// How much of an element is on screen, normalised 0..1 and eased, used as a
// loudness factor. An element taller than the viewport can never reach a ratio
// of 1, so the ratio is measured against the most it could possibly be.
const AUDIO_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

function presenceOf(entry) {
    const h = entry.boundingClientRect.height;
    const max = h > 0 ? Math.min(1, (entry.rootBounds ? entry.rootBounds.height : window.innerHeight) / h) : 1;
    const ratio = max > 0 ? Math.min(1, entry.intersectionRatio / max) : 0;
    // A wide window on purpose. Holding full volume until the player is half
    // gone and then dropping it over the last stretch is a lurch; starting to
    // dim as soon as it is genuinely on its way out spreads the same fade over
    // most of the scroll, which is what makes it feel like a fade at all.
    const LO = 0.10, HI = 0.85;
    if (ratio <= LO) return 0;
    if (ratio >= HI) return 1;
    const t = (ratio - LO) / (HI - LO);
    return t * t * (3 - 2 * t);
}

// Whether a clip actually carries sound. A missing audio track is detectable,
// though every engine spells it differently. A track that is present but
// silent is not detectable from script at all, so those carry data-audio="none"
// in the markup instead - measured offline with ffmpeg's ebur128 filter.
// The fallback is "assume sound": better than greying out a working control.
function clipHasAudio(v) {
    if (!v) return false;
    if (v.dataset && v.dataset.audio === 'none') return false;
    if (typeof v.mozHasAudio === 'boolean') return v.mozHasAudio;
    if (v.audioTracks && typeof v.audioTracks.length === 'number') return v.audioTracks.length > 0;
    return true;
}

// =============================================
// VIDEO DISSOLVE (WebGL) - the hero sequence and, on desktop, the reel
//
// The hand-over between clips. A noise field, biased outward from an origin
// (the hero's logo, the centre of the reel), is swept by a threshold:
// everything below it shows the incoming clip, and the seam carries a thin
// soft-white light with a trace of heat haze.
//
// The canvas is TRANSPARENT and only ever draws the incoming clip. The clip
// being watched is never re-rendered: it keeps playing as a native <video>,
// untouched, and simply shows through wherever the burn has not reached yet.
// An earlier version drew both clips on an opaque canvas, which meant the
// playing clip was taken over by WebGL before anything visibly dissolved - a
// frame behind the native path and scaled differently - and it read as the
// video glitching just before the transition.
//
// Cost is confined to the transition. The canvas is display:none the rest of
// the time and nothing is scheduled. While it runs, the incoming clip is
// uploaded once per decoded frame (requestVideoFrameCallback: 24 uploads a
// second for these clips, not one per display refresh), and the backing store
// is capped (1x DPR on phones, 1.5x elsewhere, 1600px on the long side).
//
// Once the incoming clip covers the whole frame the real element is swapped
// in underneath and the canvas fades off it, so the hand back to native
// playback happens on identical pictures.
//
// A clip that has not decoded a frame yet (the reel fetches on demand, so a
// click can land before the network does) is dissolved in from its poster,
// and the live frames take over the moment the first one arrives - the same
// thing the <video> element itself would show in that gap.
//
// opts: className  - for the canvas
//       clips      - selector for the host's clips; the canvas goes after them
//       origin     - selector for the element the burn starts from (centre if
//                    omitted or missing)
//       name       - console tag
// Returns null where WebGL is missing; the caller falls back.
// =============================================
function createVideoDissolve(host, opts) {
    const tag = '[' + (opts.name || 'dissolve') + ']';
    const canvas = document.createElement('canvas');
    canvas.className = opts.className;
    canvas.setAttribute('aria-hidden', 'true');

    let gl = null;
    try {
        gl = canvas.getContext('webgl', {
            alpha: true, premultipliedAlpha: true,
            antialias: false, depth: false, stencil: false,
            preserveDrawingBuffer: false,
        });
    } catch (_) {}
    if (!gl) return null;

    const VERT =
        'attribute vec2 aPos;varying vec2 vUv;' +
        'void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}';

    const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTo;
uniform vec2 uToFit;     // object-fit: cover
uniform vec2 uAspect;    // (w/h, 1) - square units for the noise
uniform vec2 uOrigin;    // where the reveal starts (the logo), in uv
uniform float uReach;    // farthest corner from the origin, square units
uniform float uP;        // eased progress 0..1
uniform float uTime;

// Sine-free hash: stable on mobile GPUs where sin() at large arguments is not.
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = r * p * 2.03 + 17.0; a *= 0.5; }
    return v / 0.9375;
}

void main() {
    vec2 st = vUv * uAspect;
    vec2 rel = (vUv - uOrigin) * uAspect;
    float d = length(rel) / uReach;

    // Domain-warped fbm, drifting slowly, so the edge reads as smoke not static.
    vec2 w = vec2(noise(st * 1.6 + uTime * 0.15), noise(st * 1.6 + 7.3 - uTime * 0.12));
    float n = fbm(st * 2.6 + w * 1.4 + vec2(0.0, -uTime * 0.08));
    // fbm bunches around 0.5; stretch it so the edge has real contour.
    n = clamp((n - 0.5) * 1.5 + 0.5, 0.0, 1.0);
    float field = mix(d, n, 0.55);

    // The field lives almost entirely in [0.12, 0.8] (measured on the real
    // clips), so the threshold sweeps that band across the duration - none of
    // it is spent on values the field never takes. The two ramps pin the
    // endpoints exactly: untouched at p=0, fully covered at p=1, whatever the
    // noise did.
    float t = mix(0.12, 0.8, uP)
            - 0.15 * (1.0 - smoothstep(0.0, 0.15, uP))
            + 0.15 * smoothstep(0.85, 1.0, uP);
    float e = field - t;                                  // < 0 : revealed
    float reveal = 1.0 - smoothstep(-0.012, 0.012, e);

    // The light only exists mid-flight; at p=0 the canvas is fully clear and
    // at p=1 it is exactly the incoming clip, which is what makes both ends
    // invisible.
    float env = smoothstep(0.0, 0.08, uP) * (1.0 - smoothstep(0.9, 1.0, uP));
    float core = 1.0 - smoothstep(0.0, 0.012, abs(e));
    float halo = 1.0 - smoothstep(0.0, 0.07, abs(e));
    halo *= halo;

    // Heat haze on the incoming side of the seam, pushed outward.
    vec2 dir = normalize(rel + 1e-4) / uAspect;
    vec2 haze = dir * (n - 0.5) * 0.012 * halo * env;

    // The incoming clip settles to rest as it arrives.
    float zt = 1.03 - 0.03 * uP;
    vec3 b = texture2D(uTo, 0.5 + (vUv - haze - 0.5) * uToFit / zt).rgb;

    // Premultiplied layers, back to front, over the live outgoing clip:
    // a faint shadow just ahead of the seam (it makes the light read
    // brighter), the incoming clip, then the light itself.
    float sh = 0.14 * halo * env * (1.0 - reveal);
    vec4 c = vec4(0.0, 0.0, 0.0, sh);
    c = vec4(b * reveal, reveal) + c * (1.0 - reveal);
    float g = clamp((core * 0.7 + halo * 0.14) * env, 0.0, 1.0);
    c = vec4(vec3(1.0, 0.985, 0.96) * g, g) + c * (1.0 - g);
    gl_FragColor = c;
}`;

    function shader(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn(tag + ' dissolve shader:', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    // One oversized triangle covers the viewport with no diagonal seam.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uTo', 'uToFit', 'uAspect', 'uOrigin', 'uReach', 'uP', 'uTime']
        .forEach(k => { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(U.uTo, 0);

    // NPOT textures are legal in WebGL1 with clamp and no mipmaps.
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    let lost = false;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; });

    // Straight after the clips, so it wins a z-index tie with the playing one
    // and loses one with anything the host layers on top (see the CSS).
    const clipsInHost = host.querySelectorAll(opts.clips);
    const lastClip = clipsInHost[clipsInHost.length - 1];
    host.insertBefore(canvas, lastClip ? lastClip.nextSibling : host.firstChild);

    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    let cssW = 0, cssH = 0;

    function size() {
        const w = host.clientWidth, h = host.clientHeight;
        if (w === cssW && h === cssH) return;
        cssW = w; cssH = h;
        const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
        const k = Math.min(dpr, 1600 / Math.max(w, h, 1));
        canvas.width = Math.max(1, Math.round(w * k));
        canvas.height = Math.max(1, Math.round(h * k));
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // object-fit: cover, computed against the element's own box rather than
    // the canvas: the reel's clips overscan their frame by a pixel each side,
    // and ignoring that shows as a 1px shift at the hand back.
    function fit(src, el) {
        const bw = el.clientWidth || cssW, bh = el.clientHeight || cssH;
        const A = bw / Math.max(bh, 1);
        const sw = src.videoWidth || src.naturalWidth || 16;
        const sh = src.videoHeight || src.naturalHeight || 9;
        const a = sw / sh;
        const f = a > A ? [A / a, 1] : [1, a / A];
        return [f[0] * cssW / bw, f[1] * cssH / bh];
    }

    // The poster stands in until the clip has a frame of its own.
    const posters = new Map();
    function posterOf(v) {
        const url = v.poster;
        if (!url) return null;
        let img = posters.get(url);
        if (!img) {
            img = new Image();
            img.decoding = 'async';
            img.src = url;     // already fetched for the <video>, so from cache
            posters.set(url, img);
        }
        return img.complete && img.naturalWidth ? img : null;
    }
    const hasFrame = v => v.readyState >= 2 && !v.seeking && v.videoWidth > 0;
    const sourceOf = v => hasFrame(v) ? v : posterOf(v);

    // Where the reveal blooms from: the origin element, if there is one.
    function origin() {
        const logo = opts.origin ? host.querySelector(opts.origin) : null;
        const hr = host.getBoundingClientRect();
        let x = 0.5, y = 0.5;
        if (logo && hr.width && hr.height) {
            const r = logo.getBoundingClientRect();
            x = (r.left + r.width / 2 - hr.left) / hr.width;
            y = 1 - (r.top + r.height / 2 - hr.top) / hr.height;   // GL y is up
        }
        x = Math.min(Math.max(x, 0), 1);
        y = Math.min(Math.max(y, 0), 1);
        const A = cssW / Math.max(cssH, 1);
        const far = Math.max(x, 1 - x) * A, farY = Math.max(y, 1 - y);
        return { x, y, reach: Math.hypot(far, farY) };
    }

    function upload(src) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    }

    // Sine in-out: soft at both ends without the long dead start of a cubic.
    const ease = p => 0.5 - 0.5 * Math.cos(Math.PI * p);
    const FADE_OUT = 240;
    const t0 = performance.now();
    const hasRVFC = typeof HTMLVideoElement !== 'undefined' &&
        'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    function draw(src, el, p) {
        gl.uniform2fv(U.uToFit, fit(src, el));
        gl.uniform2f(U.uAspect, cssW / Math.max(cssH, 1), 1);
        gl.uniform1f(U.uP, p);
        gl.uniform1f(U.uTime, (performance.now() - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    let finishRun = null;   // the running dissolve's finish(), for skip()
    let cancelRun = null;   // ...and its abort, for cancel()
    let runCore = 0;        // its linear progress, 0..1

    // run(to, ms, { onCovered, onDone }) -> false if it could not start.
    // onCovered fires once the canvas shows nothing but the incoming clip, so
    // the caller can swap the real elements underneath it; onDone gets the
    // mean frame time of the sweep, for the caller's capability check.
    function run(to, ms, cb) {
        if (finishRun) finishRun();
        let src = lost ? null : sourceOf(to);
        if (!src) return false;
        size();
        const o = origin();
        gl.uniform2f(U.uOrigin, o.x, o.y);
        gl.uniform1f(U.uReach, o.reach);
        try {
            // A cross-origin or file:// clip throws here - better now than
            // halfway through with the canvas already showing.
            upload(src);
        } catch (err) {
            console.warn(tag + ' dissolve unavailable, falling back:', err && err.name);
            lost = true;
            return false;
        }
        // Fully transparent at p=0, so showing it changes nothing on screen.
        draw(src, to, 0);
        canvas.style.opacity = '';
        canvas.classList.add('is-live');

        // Upload only when a new frame has actually been decoded. currentTime
        // is no use for this - it changes on every read.
        let fresh = false, live = true, frameReq = 0, lastT = to.currentTime;
        const onVideoFrame = () => {
            fresh = true;
            if (live) frameReq = to.requestVideoFrameCallback(onVideoFrame);
        };
        if (hasRVFC) frameReq = to.requestVideoFrameCallback(onVideoFrame);

        const start = performance.now();
        let prev = start, frames = 0, spent = 0, covered = false;

        function frame(now) {
            if (!live) return;          // ended early by skip() or cancel()
            if (lost) { finish(); return; }
            const el = now - start;
            const core = Math.min(Math.max(el / ms, 0), 1);
            runCore = core;

            try {
                size();
                const onPoster = src !== to;
                if (onPoster ? hasFrame(to) : (hasRVFC ? fresh : to.currentTime !== lastT)) {
                    src = to;
                    fresh = false;
                    lastT = to.currentTime;
                    upload(to);
                }
                draw(src, to, ease(core));
            } catch (_) { lost = true; finish(); return; }

            // Skip the first few frames: they are not representative.
            if (core < 1 && ++frames > 3) spent += now - prev;
            prev = now;

            if (core >= 1) {
                if (!covered) { covered = true; cb.onCovered(); }
                const out = (el - ms) / FADE_OUT;
                if (out >= 1) { finish(); return; }
                canvas.style.opacity = (1 - out).toFixed(3);
            }
            requestAnimationFrame(frame);
        }

        function stop() {
            live = false;
            finishRun = cancelRun = null;
            runCore = 0;
            if (hasRVFC && to.cancelVideoFrameCallback) to.cancelVideoFrameCallback(frameReq);
            canvas.classList.remove('is-live');
            canvas.style.opacity = '';
        }

        function finish() {
            if (!live) return;
            if (!covered) { covered = true; cb.onCovered(); }
            stop();
            cb.onDone(frames > 3 ? spent / (frames - 3) : 0);
        }

        finishRun = finish;
        cancelRun = () => { if (live) stop(); };
        runCore = 0;
        requestAnimationFrame(frame);
        return true;
    }

    // Jump a running dissolve straight to its end - onCovered and onDone both
    // fire before this returns - so a new one can start from a settled state.
    function skip() { if (finishRun) finishRun(); }

    // Abandon a running dissolve with no callbacks: the canvas simply goes,
    // leaving whatever is underneath it. For a change of mind so early that
    // almost nothing of the incoming clip has shown.
    function cancel() { if (cancelRun) cancelRun(); }

    // One throwaway draw now, while idle. Some drivers (ANGLE on D3D) finish
    // building the shader on its first draw rather than at link time, and that
    // belongs here, not in the first frame of the first transition.
    size();
    gl.uniform1f(U.uReach, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    return {
        run,
        skip,
        cancel,
        ok: () => !lost,
        running: () => !!finishRun,
        progress: () => runCore,
        prime: v => { posterOf(v); },   // start decoding a poster ahead of need
    };
}

// =============================================
// HERO BACKGROUND SOUND
//
// The hero video is wallpaper, so it autoplays muted the way every background
// video has to. This adds the option of hearing it, under the same rules as
// the reel: muted is only ever cleared inside the click, the level fades
// rather than snapping, and it drops to silence the moment the hero leaves the
// screen, the tab is hidden, or the reel takes the sound.
// =============================================
(function () {
    const hero = document.getElementById('home');
    const root = hero && hero.querySelector('.vol--hero');
    const clips = hero ? Array.from(hero.querySelectorAll('.hero-video')) : [];
    // Only the clips are essential. A missing volume control used to abort the
    // whole controller - sequence, glow and tuning panel with it - which is a
    // lot to lose over one optional button.
    if (!hero || !clips.length) return;

    const FADE_MS = 650;      // audio fades (sound on/off, scroll dimming)
    const XFADE_MS = 1600;    // clip dissolve - matches the CSS fallback's animation
    const FADE_XF_MS = 600;   // reduced-motion cross-fade - matches .is-fading
    const WARM_LEAD = 10;     // seconds ahead of the switch to start fetching

    let index = clips.findIndex(v => v.classList.contains('is-active'));
    if (index < 0) index = 0;
    let on = false;           // the visitor has asked for hero sound
    let presence = 1;         // 0..1, how much of the hero is on screen
    let switching = false;

    const cur = () => clips[index];
    // A single clip has nothing to hand over to, so it just loops itself.
    clips.forEach(v => { v.loop = clips.length < 2; });

    function play(v) {
        if (!v) return;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
    }

    function warm(v) {
        if (v && v.getAttribute('preload') === 'none') {
            v.setAttribute('preload', 'auto');
            v.load();
        }
    }

    // Everything routes through this, so scrolling away dims the sound in
    // proportion rather than switching it off at a trip-wire.
    const levelFor = (v) => SiteAudio.target(v || cur()) * presence;
    const audible = () => on && presence > 0;

    // Come up from zero every time, so returning to the hero is never a blast.
    function liftIn(ms) {
        const video = cur();
        SiteAudio.stopRamp(video);
        video.volume = 0;
        video.muted = false;
        play(video);
        SiteAudio.ramp(video, levelFor(video), ms === undefined ? FADE_MS : ms);
    }

    function turnOff() {
        const video = cur();
        on = false;
        SiteAudio.mute();          // the level goes to zero with it
        SiteAudio.ramp(video, 0, 320, () => { video.muted = true; video.volume = 1; });
        paint(false);
    }

    function turnOn() {
        const video = cur();
        SiteAudio.claim('hero');
        on = true;
        SiteAudio.unmute();        // back to whatever the level was before
        paint(true);
        startGlow();               // the halo only lives while the sound is on
        if (presence <= 0) return;
        SiteAudio.stopRamp(video);
        video.volume = 0;
        video.muted = false;
        const p = video.play();
        const up = () => SiteAudio.ramp(video, levelFor(video), FADE_MS);
        if (p && p.then) {
            p.then(up, () => {
                // The browser refused audible playback. Go back to muted rather
                // than leave a control claiming sound that nobody can hear.
                on = false;
                video.muted = true;
                video.volume = 1;
                paint(false);
            });
        } else {
            up();
        }
    }

    // ---- audio-reactive logo glow ------------------------------------------
    // Driven from a loudness track measured off each clip ahead of time rather
    // than from a live analyser. Two reasons: a muted media element feeds
    // silence into a Web Audio graph, so live analysis would show nothing until
    // someone unmutes; and routing the element through a MediaElementSource
    // would sit in front of the volume ramps this file already depends on.
    // A precomputed track is sample-accurate against currentTime, costs one
    // 3KB fetch, and cannot interfere with playback at all.
    // --glow and --hit are set on the logo wrapper; both glow layers inherit.
    const glowEl = hero.querySelector('.hero-logo');
    let envelopes = null, envLoading = false;
    let glowRaf = null, bodyVal = 0, hitVal = 0, gate = 0;
    let lastHitAt = 0;
    let rawBody = 0, rawHit = 0;   // pre-smoothing values, for the recorder
    let lastFrame = 0;             // for frame-rate independent smoothing
    const recent = [];   // rolling window for the extra runtime smoothing

    // Filled in each frame when the tuning panel is open; stays null otherwise,
    // so production pays one null check. Every intermediate stage is exposed
    // because a log of only the input and the output cannot say WHICH stage
    // flattened or delayed a response - which is exactly what went wrong before.
    let glowProbe = null;

    // The whole response in one place. The tuning panel edits this object live;
    // whatever is in here when the site ships is what visitors get.
    const GLOW = {
        // Tuned against a recorded 164fps log. A slow release turns this into
        // a peak-follower that never settles back to the envelope troughs - the
        // glow sat in a flat 0.35-0.70 band 66% of the time and read as a
        // lingering wash rather than a response. At 0.25 it tracks the music
        // down as well as up. Measured live on both clips afterwards, against
        // the source envelope put through this same floor transform:
        //   clip 1  correlation 0.82  flat 31% (song 22%)  dark 47% (song 55%)
        //   clip 2  correlation 0.81  flat 39% (song 31%)  dark 43% (song 50%)
        // i.e. the light is no flatter than the music it is following.
        //
        // The rendered glow runs ~35ms behind currentTime: that is the group
        // delay of the smoothing below, and correcting for it takes those
        // correlations to 0.93 and 0.92. It is deliberately NOT compensated
        // for. Audio reaches the ear later than currentTime too - 20-50ms on
        // wired output - so the two delays very nearly cancel where it counts.
        // Pulling the light 35ms earlier would fix the graph and break the
        // sync. offsetMs is there if headphones ever need it.
        bodyAttack: 0.34,     // how fast the bloom rises toward the signal
        bodyRelease: 0.250,   // and how quickly it falls away
        hitAttack: 0.80,
        hitRelease: 0.110,
        smoothFrames: 3,      // rolling mean over the body, kills micro-chatter
        // Back down after a 164fps log showed the rendered glow parked in a
        // flat 0.35-0.70 band 66% of the time while the source envelope was
        // below 0.25 for 35% of it. The lift was filling in every gap the
        // music actually had, which is what read as lingering.
        floor: 0.10,          // resting glow while the sound is on
        // Higher = reacts to more of the music, lower = only the loud moments.
        // Applied as pow(signal, 1/sensitivity), so 1 is neutral.
        sensitivity: 1.00,
        bodyGain: 1.00,
        hitGain: 1.00,
        // Shifts where in the song the glow is read from, in milliseconds.
        // The grid itself is accurate - measured against real note onsets it
        // sits within 5ms - but a browser plays currentTime while the sound
        // reaches the speakers later: ~20-50ms wired, and 150-300ms over
        // Bluetooth. That makes the light look early even when the data is
        // right. NEGATIVE delays the glow to meet late audio.
        offsetMs: 0,
        // Per-clip trim, keyed by filename. The clips are different recordings
        // with different mixes, so one may want lifting relative to the other
        // even after the envelopes are levelled.
        clipGain: {},
        hitThreshold: 0.28,   // ignore onsets weaker than this
        hitRefractoryMs: 140, // and refuse to re-fire within this
    };

    function loadEnvelopes() {
        if (envelopes || envLoading) return;
        envLoading = true;
        fetch('images/hero-audio-envelope.json')
            .then(r => (r.ok ? r.json() : null))
            .then(j => {
                if (!j) return;
                const bytes = (s) => {
                    const raw = atob(s);
                    const a = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i);
                    return a;
                };
                const out = {};
                Object.keys(j).forEach(k => {
                    out[k] = { hz: j[k].hz, beat: j[k].beat, conf: j[k].conf,
                               body: bytes(j[k].body), hit: bytes(j[k].hit) };
                });
                envelopes = out;
            })
            .catch(() => {});
    }

    function clipKey(v) {
        if (!v) return '';
        const src = (v.querySelector('source') && v.querySelector('source').src) || v.currentSrc || '';
        return src.split('/').pop().split('?')[0];
    }

    function envelopeFor(v) {
        if (!envelopes || !v) return null;
        return envelopes[clipKey(v)] || null;
    }

    function clipGainFor(v) {
        const g = GLOW.clipGain[clipKey(v)];
        return (typeof g === 'number' && isFinite(g)) ? g : 1;
    }

    function glowTick(now) {
        glowRaf = requestAnimationFrame(glowTick);
        if (!now) now = performance.now();
        const want = (on && presence > 0) ? 1 : 0;
        // The whole effect eases in and out, so turning sound on does not snap
        // a halo into existence.
        gate += (want - gate) * 0.055;

        let bodyT = 0, hitT = 0;
        let envIdx = -1;
        const v = cur();
        const env = envelopeFor(v);
        if (env && v && !v.paused) {
            // offsetMs slides the read head so the light can be lined up with
            // audio that reaches the ear later than currentTime says.
            const i = Math.round((v.currentTime + GLOW.offsetMs / 1000) * env.hz);
            if (i >= 0 && i < env.body.length) {
                envIdx = i;
                bodyT = env.body[i] / 255;
                hitT = env.hit[i] / 255;
            }
        }
        // Kept for the recorder, so a log carries the raw envelope alongside
        // the smoothed output and the two can be compared.
        rawBody = bodyT;
        rawHit = hitT;
        // A rolling mean on top of the baked-in smoothing. The envelope is
        // already averaged, but a dense passage can still chatter frame to
        // frame, and this is the knob that takes it out without dulling the
        // shape of the beat.
        // Sensitivity reshapes the curve before any gain: >1 lifts the quiet
        // parts so more of the music registers, <1 keeps only the peaks.
        const cg = clipGainFor(v);
        const sens = Math.max(0.05, GLOW.sensitivity);
        bodyT = Math.min(1, Math.pow(bodyT, 1 / sens) * GLOW.bodyGain * cg);
        // Averaged over a fixed SPAN OF TIME, not a fixed number of frames.
        // Counting frames made this the last frame-rate-dependent stage left:
        // three frames is 100ms at 30Hz but 18ms at 165Hz, so the same setting
        // smeared a beat on one machine and did nothing on another. The slider
        // still reads in frames-at-60fps; it is converted to seconds here.
        const span = Math.max(1, Math.round(GLOW.smoothFrames)) / 60;
        recent.push({ t: now, v: bodyT });
        while (recent.length > 1 && (now - recent[0].t) > span * 1000) recent.shift();
        let mean = 0;
        for (let k = 0; k < recent.length; k++) mean += recent[k].v;
        bodyT = mean / recent.length;

        // Onsets have to clear a threshold AND a refractory gap. Without them a
        // busy section reads as one continuous flicker instead of a pulse.
        const bodySm = bodyT;          // post-smoothing, pre attack/release
        hitT = Math.min(1, Math.pow(hitT, 1 / sens) * GLOW.hitGain * cg);
        let hitFired = 0;
        if (hitT < GLOW.hitThreshold || (now - lastHitAt) < GLOW.hitRefractoryMs) {
            hitT = 0;
        } else {
            hitFired = 1;
            lastHitAt = now;
        }

        // The two bands want different envelopes. The bloom swells and falls
        // away musically; the core stabs almost instantly and decays fast, which
        // is what separates "a flash on the beat" from "the halo throbbing".
        // Frame-rate independent smoothing. These used to be applied once per
        // frame, which meant the whole effect ran at a different speed on every
        // display - a recorded log came back at 164fps, where every constant
        // acted 2.7x faster per second than the 60fps they were tuned at. The
        // slider values still read as "this much per frame at 60fps"; they are
        // converted to a time constant and re-applied against the real frame
        // interval, so 30Hz, 60Hz and 165Hz all behave identically.
        const dt = Math.min(0.1, Math.max(0.001, (now - lastFrame) / 1000));
        lastFrame = now;
        const perFrame = (c) => {
            const k = Math.min(0.999, Math.max(0.001, c));
            return 1 - Math.exp(-dt / (-1 / (60 * Math.log(1 - k))));
        };
        bodyVal += (bodyT - bodyVal) * perFrame(bodyT > bodyVal ? GLOW.bodyAttack : GLOW.bodyRelease);
        hitVal  += (hitT  - hitVal)  * perFrame(hitT  > hitVal  ? GLOW.hitAttack  : GLOW.hitRelease);

        // Only a small resting floor, so the quiet moments really are quiet and
        // the peaks have somewhere to travel to.
        if (glowEl) {
            const f = GLOW.floor;
            glowEl.style.setProperty('--glow', (gate * (f + (1 - f) * bodyVal)).toFixed(3));
            glowEl.style.setProperty('--hit', (gate * hitVal).toFixed(3));
        }

        if (glowProbe) {
            const p = glowProbe;
            p.dtMs = dt * 1000;
            p.gate = gate;
            p.bodySm = bodySm;
            p.hitFired = hitFired;
            p.sinceHitMs = now - lastHitAt;
            p.envIdx = envIdx;
            // Where in the stored beat we are. A pulse that fires at a
            // consistent phase is locked to the grid; one that walks round
            // the phase is drifting against it.
            p.beatPhase = (env && env.beat && v)
                ? ((v.currentTime + GLOW.offsetMs / 1000) % env.beat) / env.beat : -1;
            p.vol = v ? v.volume : 0;
            p.muted = v ? (v.muted ? 1 : 0) : 1;
        }

        if (want === 0 && gate < 0.004) {
            if (glowEl) {
                glowEl.style.setProperty('--glow', '0');
                glowEl.style.setProperty('--hit', '0');
            }
            cancelAnimationFrame(glowRaf);
            glowRaf = null;
        }
    }

    function startGlow() {
        if (!glowEl) return;
        lastFrame = performance.now();
        loadEnvelopes();
        if (!glowRaf) glowRaf = requestAnimationFrame(glowTick);
    }

    // ---- the sequence -------------------------------------------------------
    // One clip runs out, the next fades in over it. There is no control for
    // this on purpose: it is a background, and a visitor skipping the scenery
    // behind the logo is not a thing anyone wants.

    // Nothing fades in until the incoming clip can actually paint. Starting the
    // dissolve on a video that has been asked to play but has not decoded a
    // frame yet is what makes a transition stutter or flash black - the element
    // is there, composited, and empty. The timeout is a safety valve so a
    // stalled fetch can never strand the sequence on one clip.
    function whenReady(v, cb) {
        if (v.readyState >= 3 && !v.seeking) { cb(); return; }
        let done = false;
        const fire = () => {
            if (done) return;
            done = true;
            v.removeEventListener('canplaythrough', fire);
            v.removeEventListener('canplay', check);
            v.removeEventListener('seeked', check);
            clearTimeout(timer);
            cb();
        };
        const check = () => { if (v.readyState >= 3 && !v.seeking) fire(); };
        v.addEventListener('canplaythrough', fire);
        v.addEventListener('canplay', check);
        v.addEventListener('seeked', check);
        const timer = setTimeout(fire, 2500);
    }

    // Three tiers, picked per transition:
    //   gl   - the WebGL burn-dissolve (createVideoDissolve)
    //   css  - a soft bloom from the logo, via an animated mask on the clip
    //   fade - a plain cross-fade, for reduced motion or no mask support
    // A device that cannot hold the frame rate through a gl dissolve drops to
    // css for the rest of the visit rather than stuttering every time.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const canMask = !!(window.CSS && CSS.supports &&
        (CSS.supports('mask-size', '1px') || CSS.supports('-webkit-mask-size', '1px')));
    const conn = navigator.connection;
    let lite = !!(conn && conn.saveData) ||
        (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4);
    const FRAME_BUDGET_MS = 25;    // ~40fps; slower than this and gl is retired

    let dissolve;                  // undefined: not tried yet, null: unavailable
    function getDissolve() {
        if (dissolve === undefined) {
            try {
                dissolve = createVideoDissolve(hero, {
                    className: 'hero-dissolve', clips: '.hero-video',
                    origin: '.hero-logo-img', name: 'hero',
                });
            } catch (_) { dissolve = null; }
        }
        return dissolve;
    }

    function modeNow() {
        if (reduceMotion && reduceMotion.matches) return 'fade';
        if (!lite) {
            const d = getDissolve();
            if (d && d.ok()) return 'gl';
        }
        return canMask ? 'css' : 'fade';
    }

    // Compile the shader while the page is idle, not in the frame the first
    // transition needs.
    if (clips.length > 1 && !lite && !(reduceMotion && reduceMotion.matches)) {
        if ('requestIdleCallback' in window) requestIdleCallback(getDissolve, { timeout: 4000 });
        else setTimeout(getDissolve, 3000);
    }

    // The real elements, put into their resting state: the incoming clip is
    // the active one, the outgoing one is hidden with transitions off (is-cut)
    // so it is instantly ready to be staged again next time round.
    function settle(from, to) {
        to.classList.remove('is-staged', 'is-revealing');
        to.classList.add('is-active');
        from.classList.add('is-cut');
        from.classList.remove('is-active', 'is-below', 'is-fading');
        SiteAudio.stopRamp(from);
        from.pause();
        from.muted = true;
        from.volume = 1;
        // If the hero was scrolled away mid-transition both clips were paused,
        // and the visibility handler skips resuming while switching is set.
        if (presence > 0 && !document.hidden && to.paused) play(to);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            from.classList.remove('is-cut');
        }));
    }

    function goTo(target) {
        if (switching || clips.length < 2) return;
        const next = ((target % clips.length) + clips.length) % clips.length;
        if (next === index) return;
        switching = true;

        const from = clips[index];
        const to = clips[next];

        warm(to);
        // Staged: fully opaque and decoding, but UNDER the playing clip (the
        // active clip sits a z-level above staged ones), so nothing on screen
        // changes. The playing clip itself is not touched at all here - no
        // class, no stacking change - until it is actually being replaced.
        to.classList.add('is-staged');
        try { to.currentTime = 0; } catch (_) {}
        to.muted = true;
        to.volume = 1;
        play(to);

        whenReady(to, () => {
            index = next;
            ui.setAvailable(clipHasAudio(to));

            let mode = modeNow();
            const rampAudio = (ms) => {
                if (!audible()) return;
                to.muted = false;
                to.volume = 0;
                SiteAudio.ramp(to, levelFor(to), ms);
                SiteAudio.ramp(from, 0, ms);
            };

            if (mode === 'gl') {
                // The canvas draws only the incoming clip, over the playing
                // one, which carries on natively underneath.
                const started = dissolve.run(to, XFADE_MS, {
                    // Canvas is showing only the new clip: swap underneath it.
                    onCovered: () => settle(from, to),
                    onDone: (avgMs) => {
                        switching = false;
                        if (avgMs > FRAME_BUDGET_MS) {
                            lite = true;
                            console.info('[hero] dissolve averaged ' + avgMs.toFixed(1) +
                                'ms/frame - using the CSS transition from now on');
                        }
                    },
                });
                if (started) { rampAudio(XFADE_MS); return; }
                mode = canMask ? 'css' : 'fade';
            }

            if (mode === 'css') {
                // The incoming clip goes on top behind a zero-size mask, so the
                // change of stacking is invisible; the animation then opens it.
                from.classList.add('is-below');
                to.classList.add('is-revealing');
                rampAudio(XFADE_MS);
                setTimeout(() => { settle(from, to); switching = false; }, XFADE_MS);
                return;
            }

            // fade: the outgoing clip, still on top (is-fading keeps its
            // z-level), fades away to reveal the incoming one underneath.
            from.classList.add('is-fading');
            from.classList.remove('is-active');
            rampAudio(FADE_XF_MS);
            setTimeout(() => { settle(from, to); switching = false; }, FADE_XF_MS);
        });
    }

    const advance = () => goTo(index + 1);

    // timeupdate fires about four times a second, so the hand-over is started a
    // little early - the incoming clip has to be fully covering by the time the
    // outgoing one runs out, or it freezes on its last frame in plain sight.
    // The extra 0.4s is headroom for whenReady on a slow connection.
    function watch() {
        const v = cur();
        if (switching || !v || !isFinite(v.duration) || v.duration <= 0) return;
        const left = v.duration - v.currentTime;
        if (left <= WARM_LEAD) warm(clips[(index + 1) % clips.length]);
        if (left <= (XFADE_MS + 400) / 1000 + 0.35) advance();
    }

    clips.forEach(v => {
        v.addEventListener('timeupdate', watch);
        // Backstop, in case timeupdate is throttled and the clip simply ends.
        v.addEventListener('ended', () => { if (v === cur() && !switching) advance(); });
    });

    // ==================== DEBUG ONLY - DELETE BEFORE PUBLISHING =============
    // Hero tuning panel. Only appears when the URL carries ?herodebug=1 , so a
    // visitor can never see it even if this is still here. Nothing outside this
    // block refers to any of it: delete from this banner down to the END DEBUG
    // banner and it is gone completely, leaving whatever values are baked into
    // GLOW above and the CSS fallbacks in styles.css.
    // A version stamp, so it is obvious whether the browser is running a fresh
    // script.js or a cached one. If you do not see this line in the console,
    // the file is cached - hard reload (Ctrl+Shift+R).
    console.log('[hero] controller ready · build 2026-09-23c · ' + clips.length +
        ' clips · add ?herodebug=1 to the URL, or press Ctrl+Shift+G, for the tuning panel');

    let panelMounted = false;

    function mountPanel() {
        if (panelMounted) return;
        panelMounted = true;
        // Visual knobs live in CSS as var(--x, fallback); the fallbacks are the
        // shipped values, so the panel starts exactly where the site is.
        const LOOK = {
            '--bloom-op':    { v: 0.92, min: 0, max: 1.5,  step: 0.01,  label: 'bloom opacity' },
            '--bloom-scale': { v: 0.11, min: 0, max: 0.30, step: 0.005, label: 'bloom scale' },
            '--bloom-blur':  { v: 10,   min: 0, max: 40,   step: 1, unit: 'px', label: 'bloom blur' },
            '--bloom-sat':   { v: 0.90, min: 0, max: 3,    step: 0.05,  label: 'bloom saturation pump' },
            '--bloom-bri':   { v: 0.30, min: 0, max: 1.5,  step: 0.05,  label: 'bloom brightness pump' },
            '--core-op':     { v: 0.80, min: 0, max: 1.5,  step: 0.01,  label: 'core opacity' },
            '--core-scale':  { v: 0.04, min: 0, max: 0.20, step: 0.005, label: 'core scale' },
            '--core-blur':   { v: 3,    min: 0, max: 24,   step: 1, unit: 'px', label: 'core blur' }
        };
        const RESPONSE = [
            ['offsetMs',       -300,   300,  5,     'TIMING offset (ms)'],
            ['sensitivity',     0.40,  2.5,  0.05,  'SENSITIVITY'],
            ['smoothFrames',    1,     16,   1,     'smoothing (frames)'],
            ['bodyAttack',      0.02,  1,    0.01,  'bloom attack'],
            ['bodyRelease',     0.005, 0.4,  0.005, 'bloom release'],
            ['floor',           0,     0.6,  0.01,  'resting floor'],
            ['bodyGain',        0.2,   2.5,  0.05,  'bloom gain'],
            ['hitThreshold',    0,     1,    0.01,  'hit threshold'],
            ['hitRefractoryMs', 0,     600,  10,    'hit refractory (ms)'],
            ['hitAttack',       0.05,  1,    0.01,  'hit attack'],
            ['hitRelease',      0.01,  0.6,  0.005, 'hit release'],
            ['hitGain',         0.2,   2.5,  0.05,  'hit gain']
        ];

        const panel = document.createElement('div');
        panel.setAttribute('data-debug', 'hero-glow');
        panel.style.cssText =
            // above #site-loader, which sits at z-index 1000000 and would
            // otherwise bury this for the whole preload
            'position:fixed;z-index:2000000;top:84px;right:16px;width:302px;' +
            'max-height:calc(100vh - 112px);overflow:auto;padding:14px;border-radius:14px;' +
            'border:1px solid rgba(255,255,255,.22);background:rgba(14,11,12,.93);color:#faf7f4;' +
            'backdrop-filter:blur(14px);font:12px/1.45 system-ui,-apple-system,sans-serif;' +
            'box-shadow:0 18px 50px -18px #000;';

        const chip = 'flex:1;padding:8px 6px;border-radius:9px;border:1px solid rgba(255,255,255,.28);' +
            'background:rgba(255,255,255,.10);color:#fff;cursor:pointer;font:inherit;font-weight:600;';

        function heading(t) {
            const e = document.createElement('div');
            e.textContent = t;
            e.style.cssText = 'font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
                'font-size:10px;opacity:.6;margin:14px 0 8px;';
            return e;
        }

        // Live meters, so the jitter is something you can see rather than guess at
        const meters = {};
        function meterRow(name, colour) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
            const lab = document.createElement('span');
            lab.textContent = name;
            lab.style.cssText = 'width:34px;opacity:.7;';
            const track = document.createElement('div');
            track.style.cssText = 'flex:1;height:8px;border-radius:9px;background:rgba(255,255,255,.14);overflow:hidden;';
            const fill = document.createElement('div');
            fill.style.cssText = 'height:100%;width:0;background:' + colour + ';';
            const num = document.createElement('span');
            num.style.cssText = 'width:32px;text-align:right;font-variant-numeric:tabular-nums;opacity:.85;';
            track.appendChild(fill);
            wrap.appendChild(lab); wrap.appendChild(track); wrap.appendChild(num);
            meters[name] = { fill: fill, num: num };
            return wrap;
        }

        const rate = document.createElement('div');
        rate.style.cssText = 'opacity:.65;margin:2px 0 4px;';

        // A rolling six-second trace. Numbers tell you the level; this tells you
        // the SHAPE - whether it is pulsing on the beat or skittering between.
        const scope = document.createElement('canvas');
        scope.width = 548; scope.height = 108;          // 2x for crispness
        scope.style.cssText = 'width:274px;height:54px;display:block;margin:4px 0 6px;' +
            'border-radius:7px;background:rgba(255,255,255,.07);';
        const sctx = scope.getContext('2d');
        const HISTORY = 120;                             // 120 x 50ms = 6s
        const hist = [];

        function drawScope() {
            const w = scope.width, h = scope.height;
            sctx.clearRect(0, 0, w, h);
            // midline
            sctx.strokeStyle = 'rgba(255,255,255,.14)';
            sctx.lineWidth = 2;
            sctx.beginPath(); sctx.moveTo(0, h / 2); sctx.lineTo(w, h / 2); sctx.stroke();
            if (hist.length < 2) return;
            const step = w / (HISTORY - 1);
            // hits as upright ticks, so a beat is unmistakable
            sctx.strokeStyle = 'rgba(255,255,255,.85)';
            sctx.lineWidth = 2;
            hist.forEach(function (p, i) {
                if (p.h <= 0.02) return;
                const x = i * step;
                sctx.beginPath(); sctx.moveTo(x, h); sctx.lineTo(x, h - p.h * h); sctx.stroke();
            });
            // glow as a filled trace
            sctx.beginPath();
            hist.forEach(function (p, i) {
                const x = i * step, y = h - p.g * h;
                if (i === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
            });
            sctx.strokeStyle = '#e0566f';
            sctx.lineWidth = 3;
            sctx.stroke();
        }

        function slider(label, value, min, max, step, onInput, suffix) {
            const row = document.createElement('div');
            row.style.cssText = 'margin-bottom:9px;';
            const top = document.createElement('div');
            top.style.cssText = 'display:flex;justify-content:space-between;gap:8px;margin-bottom:3px;';
            const l = document.createElement('span');
            l.textContent = label;
            l.style.opacity = '.78';
            const val = document.createElement('span');
            val.style.cssText = 'font-variant-numeric:tabular-nums;font-weight:600;';
            function show(x) { val.textContent = x + (suffix || ''); }
            show(value);
            top.appendChild(l); top.appendChild(val);
            const r = document.createElement('input');
            r.type = 'range';
            r.min = min; r.max = max; r.step = step; r.value = value;
            r.style.cssText = 'width:100%;accent-color:#e0566f;margin:0;';
            r.addEventListener('input', function () { show(+r.value); onInput(+r.value); });
            row.appendChild(top); row.appendChild(r);
            return { row: row, input: r, show: show };
        }

        const controls = [];

        // Header with its own close button, so it never needs a shortcut to
        // get rid of - some machines have those grabbed by other software.
        const bar = document.createElement('div');
        bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;' +
            'margin:-2px 0 2px;';
        const title = document.createElement('strong');
        title.textContent = 'HERO TUNING';
        title.style.cssText = 'letter-spacing:.09em;font-size:11px;';
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = '×';
        close.title = 'hide (Ctrl+Shift+G brings it back)';
        close.style.cssText = 'width:26px;height:26px;flex:none;border-radius:8px;cursor:pointer;' +
            'border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.10);color:#fff;' +
            'font:600 15px/1 system-ui;';
        close.addEventListener('click', function () { panel.style.display = 'none'; });
        bar.appendChild(title);
        bar.appendChild(close);
        panel.appendChild(bar);

        panel.appendChild(heading('live signal'));
        panel.appendChild(meterRow('glow', 'linear-gradient(90deg,#8a1530,#e0566f)'));
        panel.appendChild(meterRow('hit', 'linear-gradient(90deg,#adafb0,#ffffff)'));
        panel.appendChild(scope);
        panel.appendChild(rate);

        // ---- recorder -------------------------------------------------------
        // Captures glow and hit against the clip's own timeline, so a log can be
        // lined straight back up against the audio it came from.
        const log = [];
        let recording = false;

        // Every stage of the pipeline, so a log says WHICH one is responsible.
        glowProbe = { dtMs: 0, gate: 0, bodySm: 0, hitFired: 0, sinceHitMs: 0,
                      envIdx: -1, beatPhase: -1, vol: 0, muted: 1 };

        // ---- live audio tap -------------------------------------------------
        // The columns above all come from the envelope, so they can only ever
        // agree with it: a log made of them could never reveal that the
        // envelope itself was drifting against the music, which is precisely
        // the bug that took several passes to find. This measures the audio
        // actually coming out, so envelope-vs-reality is visible in one file.
        //
        // Verified in Chrome that element volume and mute are applied BEFORE
        // this tap (0.25 volume measures at 0.250 of full, mute measures exact
        // silence), so it cannot disturb the volume ramps. A source node is
        // permanent per element and may only be created once, hence the cache.
        const taps = new WeakMap();
        let actx = null;
        function tapFor(v) {
            if (!v) return null;
            if (taps.has(v)) return taps.get(v);
            try {
                if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
                if (actx.state === 'suspended') actx.resume();
                const src = actx.createMediaElementSource(v);
                const an = actx.createAnalyser();
                an.fftSize = 1024;
                an.smoothingTimeConstant = 0;
                src.connect(an);
                an.connect(actx.destination);   // keep the sound audible
                const t = { an, freq: new Uint8Array(an.frequencyBinCount),
                            time: new Float32Array(an.fftSize), prev: null };
                taps.set(v, t);
                return t;
            } catch (e) {
                console.warn('[hero] audio tap unavailable: ' + e.message);
                taps.set(v, null);
                return null;
            }
        }
        // Band edges as bin indices, matching the four bands the envelope
        // generator uses, so the two are directly comparable.
        function bandsOf(t) {
            const sr = actx ? actx.sampleRate : 48000;
            const n = t.an.frequencyBinCount;
            const bin = hz => Math.max(0, Math.min(n - 1, Math.round(hz * t.an.fftSize / sr)));
            const edges = [[30, 120], [120, 500], [500, 2000], [2000, 8000]];
            return edges.map(function (e) {
                let s = 0;
                const a = bin(e[0]), b = Math.max(bin(e[0]) + 1, bin(e[1]));
                for (let k = a; k < b; k++) s += t.freq[k];
                return s / (b - a) / 255;
            });
        }
        // Half-wave-rectified spectral flux: the same onset measure the
        // generator uses offline, so a peak here should line up with a hit.
        function fluxOf(t) {
            if (!t.prev) { t.prev = Uint8Array.from(t.freq); return 0; }
            let s = 0;
            for (let k = 0; k < t.freq.length; k++) {
                const d = t.freq[k] - t.prev[k];
                if (d > 0) s += d;
            }
            t.prev.set(t.freq);
            return s / t.freq.length / 255;
        }
        let tapOn = false;
        const tapBtn = document.createElement('button');
        tapBtn.type = 'button';
        tapBtn.style.cssText = chip;
        tapBtn.title = 'measure the real audio alongside the envelope';
        function paintTap() {
            tapBtn.textContent = tapOn ? 'audio tap ✓' : 'audio tap';
            tapBtn.style.borderColor = tapOn ? '#7fd8a0' : 'rgba(255,255,255,.28)';
        }
        tapBtn.addEventListener('click', function () {
            tapOn = !tapOn;
            if (tapOn && !tapFor(cur())) tapOn = false;
            paintTap();
        });
        paintTap();
        const recRow = document.createElement('div');
        recRow.style.cssText = 'display:flex;gap:6px;margin-bottom:4px;';
        const recBtn = document.createElement('button');
        recBtn.type = 'button';
        recBtn.style.cssText = chip;
        const logBtn = document.createElement('button');
        logBtn.type = 'button';
        logBtn.textContent = 'download csv';
        logBtn.style.cssText = chip;
        function paintRec() {
            recBtn.textContent = recording ? '■ stop (' + log.length + ')' : '● record';
            recBtn.style.borderColor = recording ? '#e0566f' : 'rgba(255,255,255,.28)';
        }
        // Recording runs on its own rAF loop at the real frame rate, not on the
        // 60ms panel timer - sampling a 60fps signal 16 times a second aliases
        // exactly the peaks you are trying to look at.
        let recRaf = null, recLast = 0;
        function recTick(now) {
            recRaf = requestAnimationFrame(recTick);
            const v = cur();
            if (!recording || !v) return;
            const fps = recLast ? 1000 / Math.max(1, now - recLast) : 60;
            recLast = now;
            let aR = 0, aF = 0, aB = [0, 0, 0, 0];
            if (tapOn) {
                const t = tapFor(v);
                if (t) {
                    t.an.getByteFrequencyData(t.freq);
                    t.an.getFloatTimeDomainData(t.time);
                    let s = 0;
                    for (let k = 0; k < t.time.length; k++) s += t.time[k] * t.time[k];
                    aR = Math.sqrt(s / t.time.length);
                    aB = bandsOf(t);
                    aF = fluxOf(t);
                }
            }
            const p = glowProbe;
            log.push({ clip: clipKey(v), t: v.currentTime,
                       g: +glowEl.style.getPropertyValue('--glow') || 0,
                       h: +glowEl.style.getPropertyValue('--hit') || 0,
                       rb: rawBody, rh: rawHit, off: GLOW.offsetMs, fps: fps,
                       dt: p.dtMs, gate: p.gate, bs: p.bodySm, hf: p.hitFired,
                       sh: p.sinceHitMs, ei: p.envIdx, bp: p.beatPhase,
                       vol: p.vol, mu: p.muted,
                       aR: aR, aF: aF, aB: aB });
            if (log.length > 200000) { recording = false; stopRec(); paintRec(); }
        }
        function startRec() { recLast = 0; if (!recRaf) recRaf = requestAnimationFrame(recTick); }
        function stopRec() { if (recRaf) { cancelAnimationFrame(recRaf); recRaf = null; } }

        recBtn.addEventListener('click', function () {
            recording = !recording;
            if (recording) { log.length = 0; startRec(); } else { stopRec(); }
            paintRec();
            if (!recording) {
                const secs = log.length ? (log[log.length - 1].t - log[0].t) : 0;
                console.log('[hero] recorded ' + log.length + ' frames over ' + secs.toFixed(1) +
                    's of clip - "download csv" to save it');
            }
        });
        function logCSV() {
            // audRms/audFlux/audLow..audHigh are MEASURED from the output; every
            // other column is derived from the envelope. Comparing the two
            // groups is what shows whether the envelope matches the music.
            const head = 'clip,time,glow,hit,rawBody,rawHit,offsetMs,fps,' +
                'dtMs,gate,bodySm,hitFired,sinceHitMs,envIdx,beatPhase,vol,muted,' +
                'audRms,audFlux,audLow,audLowMid,audHighMid,audHigh';
            return [head].concat(log.map(function (r) {
                return r.clip + ',' + r.t.toFixed(3) + ',' + r.g.toFixed(4) + ',' + r.h.toFixed(4) +
                    ',' + r.rb.toFixed(4) + ',' + r.rh.toFixed(4) + ',' + r.off + ',' + r.fps.toFixed(1) +
                    ',' + r.dt.toFixed(2) + ',' + r.gate.toFixed(4) + ',' + r.bs.toFixed(4) +
                    ',' + r.hf + ',' + Math.round(r.sh) + ',' + r.ei + ',' + r.bp.toFixed(4) +
                    ',' + r.vol.toFixed(3) + ',' + r.mu +
                    ',' + r.aR.toFixed(5) + ',' + r.aF.toFixed(5) +
                    ',' + r.aB.map(function (x) { return x.toFixed(4); }).join(',');
            })).join('\n');
        }
        logBtn.addEventListener('click', function () {
            // A real file, not the clipboard: a full-rate recording of a whole
            // clip is tens of thousands of rows and pasting that is miserable.
            const text = logCSV();
            const name = 'hero-glow-' + (log.length ? log[0].clip.replace(/\.mp4$/, '') : 'log') +
                '-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '') + '.csv';
            try {
                const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
                const a = document.createElement('a');
                a.href = url; a.download = name;
                document.body.appendChild(a); a.click();
                setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
                logBtn.textContent = 'saved ✓';
                console.log('[hero] saved ' + log.length + ' frames to ' + name);
            } catch (e) {
                console.log('[hero] ' + log.length + ' frames:\n' + text);
                logBtn.textContent = 'see console';
            }
            setTimeout(function () { logBtn.textContent = 'download csv'; }, 1600);
        });
        paintRec();
        recRow.appendChild(recBtn);
        recRow.appendChild(logBtn);
        recRow.appendChild(tapBtn);
        panel.appendChild(recRow);

        panel.appendChild(heading('clip'));
        const clipRow = document.createElement('div');
        clipRow.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:4px;';
        const clipTag = document.createElement('div');
        clipTag.style.cssText = 'text-align:center;opacity:.75;margin-bottom:8px;';
        // Per-clip gain, rebound whenever the showing clip changes - so the
        // slider always adjusts the video you are actually looking at.
        const clipSlider = slider('THIS CLIP gain', 1, 0.2, 3, 0.05, function (x) {
            GLOW.clipGain[clipKey(cur())] = x;
        });

        let labelled = false;

        function relabel() {
            const key = clipKey(cur());
            const env = envelopes && envelopes[key];
            clipTag.textContent = (index + 1) + '/' + clips.length + '  ' + key +
                (env ? '  · ' + Math.round(60 / env.beat) + ' BPM (conf ' + env.conf + ')' : '');
            const g = GLOW.clipGain[key];
            const val = (typeof g === 'number') ? g : 1;
            clipSlider.input.value = val;
            clipSlider.show(val);
        }
        function stepBtn(text, delta) {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = text; b.style.cssText = chip;
            b.addEventListener('click', function () {
                goTo(index + delta);
                let n = 0;
                const p = setInterval(function () { relabel(); if (++n > 24) clearInterval(p); }, 150);
            });
            return b;
        }
        clipRow.appendChild(stepBtn('‹ prev', -1));
        clipRow.appendChild(stepBtn('next ›', 1));
        panel.appendChild(clipRow);
        panel.appendChild(clipTag);
        panel.appendChild(clipSlider.row);
        relabel();

        panel.appendChild(heading('response'));
        RESPONSE.forEach(function (row) {
            const key = row[0];
            const s = slider(row[4], GLOW[key], row[1], row[2], row[3], function (x) { GLOW[key] = x; });
            controls.push({ kind: 'js', key: key, s: s, def: GLOW[key], unit: '' });
            panel.appendChild(s.row);
        });

        panel.appendChild(heading('look'));
        Object.keys(LOOK).forEach(function (prop) {
            const d = LOOK[prop];
            const s = slider(d.label, d.v, d.min, d.max, d.step, function (x) {
                glowEl.style.setProperty(prop, x + (d.unit || ''));
            }, d.unit || '');
            controls.push({ kind: 'css', key: prop, s: s, def: d.v, unit: d.unit || '' });
            panel.appendChild(s.row);
        });

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:6px;margin-top:14px;position:sticky;bottom:0;' +
            'padding-top:10px;background:linear-gradient(180deg,rgba(14,11,12,0),rgba(14,11,12,.95) 45%);';
        function act(text, fn) {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = text;
            b.style.cssText = chip + 'padding:10px 6px;';
            b.addEventListener('click', fn);
            actions.appendChild(b);
            return b;
        }

        function snapshot() {
            const js = {}, look = {};
            controls.forEach(function (c) {
                if (c.kind === 'js') js[c.key] = GLOW[c.key];
                else look[c.key] = c.s.input.value + c.unit;
            });
            js.clipGain = GLOW.clipGain;   // per-video trims travel with it
            return JSON.stringify({ response: js, look: look }, null, 2);
        }

        const copyBtn = act('copy settings', function () {
            const text = snapshot();
            function done() {
                copyBtn.textContent = 'copied ✓';
                setTimeout(function () { copyBtn.textContent = 'copy settings'; }, 1400);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copy this:', text); });
            } else {
                window.prompt('Copy this:', text);
            }
        });

        act('reset', function () {
            controls.forEach(function (c) {
                c.s.input.value = c.def;
                c.s.show(c.def);
                if (c.kind === 'js') GLOW[c.key] = c.def;
                else glowEl.style.removeProperty(c.key);
            });
        });

        panel.appendChild(actions);
        document.body.appendChild(panel);

        // hits/sec is the number that says whether it is pulsing or jittering
        let hits = [];
        setInterval(function () {
            const gv = +glowEl.style.getPropertyValue('--glow') || 0;
            const hv = +glowEl.style.getPropertyValue('--hit') || 0;
            meters.glow.fill.style.width = (gv * 100).toFixed(1) + '%';
            meters.glow.num.textContent = gv.toFixed(2);
            meters.hit.fill.style.width = (hv * 100).toFixed(1) + '%';
            meters.hit.num.textContent = hv.toFixed(2);
            const t = performance.now();
            if (hv > 0.45 && (!hits.length || t - hits[hits.length - 1] > 120)) hits.push(t);
            hits = hits.filter(function (x) { return t - x < 5000; });

            hist.push({ g: gv, h: hv });
            while (hist.length > HISTORY) hist.shift();
            drawScope();

            // The envelopes arrive asynchronously, after the panel is built, so
            // the first label has no tempo in it. Fill it in once they land.
            if (!labelled && envelopes) { labelled = true; relabel(); }

            const v = cur();
            if (recording) paintRec();

            const env = envelopes && envelopes[clipKey(v)];
            rate.textContent = 'hits ' + (hits.length / 5).toFixed(1) + '/sec' +
                (env ? '  ·  beat every ' + env.beat + 's' : '') + '  ·  needs sound ON';
        }, 50);

        console.log('[hero] tuning panel mounted (top right, above the preloader)');
    }

    // Stays out of the way now the glow is tuned: it no longer shows itself on
    // localhost. Ask for it explicitly when you need it -
    //   ?herodebug=1 on the URL, #herodebug, Ctrl+Shift+G, or
    //   localStorage.setItem('herodebug','1') to have it back every reload.
    const wantPanel =
        /[?&]herodebug(?:[=&]|$)/.test(location.search) ||
        /herodebug/.test(location.hash) ||
        (function () { try { return localStorage.getItem('herodebug') === '1'; } catch (_) { return false; } })();

    if (wantPanel) mountPanel();

    // ...and a shortcut that always works, flag or not. Ctrl+Shift+G.
    window.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
            e.preventDefault();
            if (panelMounted) {
                const p = document.querySelector('[data-debug="hero-glow"]');
                if (p) p.style.display = (p.style.display === 'none' ? '' : 'none');
            } else {
                mountPanel();
            }
        }
    });
    // ==================== END DEBUG ONLY ====================================

    const ui = volumeUI(root, {
        onLabel: 'Turn hero sound off',
        offLabel: 'Turn hero sound on',
        noneLabel: 'This video has no sound',
        toggle: () => { if (on) turnOff(); else turnOn(); },
        // A short glide rather than a snap: stepping the gain straight to a new
        // value on every input event is audible as a zip.
        level: () => {
            if (!on) turnOn();
            else if (audible()) SiteAudio.ramp(cur(), levelFor(), 90);
        },
    });
    const paint = ui.paint;

    SiteAudio.register('hero', {
        silence: () => { if (on) turnOff(); },
        apply: () => {
            if (audible()) SiteAudio.ramp(cur(), levelFor(), 90);
            paint(on);
        },
    });

    paint(false);

    // Grey the control out if whichever clip is showing carries no sound.
    const checkAudio = () => ui.setAvailable(clipHasAudio(cur()));
    if (cur().readyState >= 1) checkAudio();
    clips.forEach(v => v.addEventListener('loadedmetadata', () => {
        if (v === cur()) checkAudio();
    }));
    play(cur());

    // Scrolling away dims the hero in proportion to how much of it is still on
    // screen, across 21 thresholds, each one easing to the next over 240ms. The
    // result is a continuous fade tied to the scroll rather than a cut.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach(e => {
                presence = document.hidden ? 0 : presenceOf(e);
                const video = cur();
                // Off screen the sequence stops entirely - decoding video nobody
                // can see is the kind of thing that flattens a phone battery.
                if (presence <= 0) {
                    if (on) {
                        SiteAudio.ramp(video, 0, 200, () => {
                            if (presence <= 0) video.muted = true;
                        });
                    }
                    clips.forEach(v => v.pause());
                    return;
                }
                if (video.paused && !switching) play(video);
                if (!on) return;
                if (video.muted) liftIn(240);
                else SiteAudio.ramp(video, levelFor(video), 240);
            });
        }, { threshold: AUDIO_THRESHOLDS }).observe(hero);
    }

    // The global background-video handler replays everything when the tab comes
    // back. Parking the volume at zero on the way out means that can never land
    // as a blast, whichever listener runs first.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            presence = 0;
            SiteAudio.stopRamp(cur());
            cur().volume = 0;
            clips.forEach(v => v.pause());
        } else {
            const r = hero.getBoundingClientRect();
            const vh = window.innerHeight;
            const shown = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
            presence = presenceOf({
                boundingClientRect: r,
                intersectionRatio: r.height > 0 ? shown / r.height : 0,
                rootBounds: { height: vh },
            });
            if (presence > 0) {
                if (on) liftIn(); else play(cur());
            }
        }
    });
})();

// =============================================
// LIVE PERFORMANCES REEL
//
// Single-player showcase: one clip on screen, dissolving into the next when
// it finishes, with prev/next, swipe and dots. Owns its own playback - the videos use .reel-video, not
// .autoplay-video, so the global "play every video" handler above never
// touches them and two clips can never run at once.
//
// Clips are loaded on demand: only the visible one is fetched in full, and the
// next is warmed to metadata so the cross-fade has something to show.
//
// Sound is off until someone asks for it. Every browser refuses audible
// autoplay without a user gesture, so the clips carry `muted` in the markup -
// that is the only reason they play at all on arrival - and the only place
// muted is ever cleared is inside the sound button's click handler. Once it is
// on, the audio fades on the same curve as the picture. Muted or not, every
// clip runs to its natural end before the next one fades in.
// =============================================
(function () {
    const reel = document.getElementById('reel');
    if (!reel) return;

    const slides = Array.from(reel.querySelectorAll('.reel-slide'));
    if (!slides.length) return;

    const stage    = reel.querySelector('.reel-stage');
    const titleEl  = reel.querySelector('.reel-title');
    const subEl    = reel.querySelector('.reel-sub');
    const dotsWrap = reel.querySelector('.reel-dots');
    const fill     = reel.querySelector('.reel-timer-fill');
    const prevBtn  = reel.querySelector('.reel-prev');
    const nextBtn  = reel.querySelector('.reel-next');
    const volRoot  = reel.querySelector('.vol--reel');

    const DWELL = 9000;   // ms a muted clip holds before advancing
    const FADE_MS = 700;  // matches the .reel-slide transform transition exactly
    const reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let index = slides.findIndex(s => s.classList.contains('is-active'));
    if (index < 0) index = 0;

    let paused = false;      // pointer/focus is on the reel
    let offscreen = false;   // section scrolled out of view, or tab hidden
    let presence = 1;        // 0..1, how much of the stage is on screen
    let soundOn = false;     // only ever set true from a user gesture
    let elapsed = 0;
    let last = 0;
    let rafId = null;
    let handoff = null;      // timeout that retires the outgoing clip

    // ---- desktop dissolve ---------------------------------------------------
    // From 769px up, clips change with the same WebGL burn-dissolve as the
    // hero instead of the coverflow slide: the next clip is staged in place
    // under the playing one, the canvas burns it in, and the slides are only
    // re-placed once it covers the frame. Below 769px the coverflow stays -
    // the side slivers are the point of it on a phone. Decided per change, so
    // resizing across the breakpoint just works. No WebGL, a device that
    // cannot hold the frame rate, or reduced motion: the existing behaviour.
    const DISSOLVE_MS = 1600;
    const FRAME_BUDGET_MS = 25;    // ~40fps; slower than this and the slide returns
    const ABANDON_BEFORE = 0.3;    // see go(): early enough to drop, not settle
    let burning = null;            // { from, to } of the dissolve in flight
    const desktop = window.matchMedia && window.matchMedia('(min-width: 769px)');
    const conn = navigator.connection;
    let dissolveLite = !!(conn && conn.saveData) ||
        (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4);
    let dissolve;                  // undefined: not tried yet, null: unavailable

    function getDissolve() {
        if (dissolve === undefined) {
            try {
                dissolve = stage ? createVideoDissolve(stage, {
                    className: 'reel-dissolve', clips: '.reel-slide', name: 'reel',
                }) : null;
            } catch (_) { dissolve = null; }
            if (dissolve) slides.forEach(s => {
                const v = s.querySelector('video');
                if (v) dissolve.prime(v);
            });
        }
        return dissolve;
    }

    const wantsDissolve = () =>
        !reduceMotion && !dissolveLite && !!desktop && desktop.matches && dissolve !== null;

    function canDissolve() {
        if (!wantsDissolve()) return false;
        const d = getDissolve();
        return !!(d && d.ok());
    }

    // ---- dots -----------------------------------------------------------
    const dots = slides.map((slide, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'reel-dot';
        b.setAttribute('aria-label', 'Show ' + (slide.dataset.title || 'performance ' + (i + 1)));
        b.addEventListener('click', () => go(i, true));
        dotsWrap.appendChild(b);
        return b;
    });

    const videoOf = i => slides[i] && slides[i].querySelector('video');

    // ---- coverflow track ---------------------------------------------------
    // Every slide gets a data-pos: 0 in the middle, -1 / 1 either side (the
    // slivers on mobile), "far" for the rest. The CSS turns those into places
    // on one row, so changing clip just moves every slide one step and the
    // side clip glides into the middle. Tapping a side clip goes to it.
    function offsetOf(k, centre) {
        const n = slides.length;
        let o = ((k - centre) % n + n) % n;
        if (o > n / 2) o -= n;
        return o;
    }

    // instant: straight into place with no animation - first load, and the
    // desktop dissolve, which re-places the slides under a covering canvas.
    function place(centre, instant) {
        slides.forEach((slide, k) => {
            const o = offsetOf(k, centre);
            const pos = Math.abs(o) <= 1 ? String(o) : 'far';
            const was = slide.dataset.pos;
            // Wrapping round from one side to the other: appear at the new
            // spot with a fade instead of flying across the middle.
            const jump = was !== undefined && was !== 'far' && pos !== 'far' &&
                Math.abs(Number(was) - o) > 1;
            if (was === undefined || instant) {
                // Straight into position, no animation
                slide.style.transition = 'none';
                slide.dataset.pos = pos;
                void slide.offsetWidth;
                slide.style.transition = '';
            } else if (jump) {
                slide.style.transition = 'none';
                slide.classList.add('is-jumping');
                slide.dataset.pos = pos;
                void slide.offsetWidth;   // commit the new spot, invisibly
                slide.style.transition = '';
                slide.classList.remove('is-jumping');
            } else {
                slide.dataset.pos = pos;
            }
        });
    }

    slides.forEach((slide) => {
        slide.addEventListener('click', () => {
            if (slide.dataset.pos === '1') go(index + 1, true);
            else if (slide.dataset.pos === '-1') go(index - 1, true);
        });
    });

    function warm(i, level) {
        const v = videoOf(i);
        if (!v) return;
        if (v.getAttribute('preload') === 'none') {
            v.setAttribute('preload', level);
            if (level === 'auto') v.load();
        }
    }

    // ---- playback helpers ---------------------------------------------------
    // play() can reject - autoplay policy, or a load that was interrupted by a
    // fast click through the dots - and an unhandled rejection there shows up
    // as a console error on a page that is working fine. Always swallow it.
    function play(v) {
        if (!v) return;
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
    }

    // Ramps and the shared level live in SiteAudio, so the hero and the reel
    // fade on the same curve and answer to the same slider. presence folds the
    // scroll-away fade into every target, so nothing else has to think about it.
    const stopRamp = v => SiteAudio.stopRamp(v);
    const rampVolume = (v, to, ms, done) => SiteAudio.ramp(v, to, ms, done);
    const levelFor = v => SiteAudio.target(v) * presence;

    // Park a clip: silent, muted, paused, rewound volume. It is re-armed by go().
    function retire(v) {
        if (!v) return;
        stopRamp(v);
        v.pause();
        v.muted = true;
        v.volume = 1;
    }

    function go(i, manual) {
        // A dissolve still running when the next change arrives. If it has
        // barely begun - only the first specks of the incoming clip showing -
        // it is dropped and this change starts from the clip still on screen,
        // so two quick clicks read as one move. Past that, it is settled
        // first, so this change starts from one clip fully in place rather
        // than from half of each.
        if (dissolve && dissolve.running()) {
            if (burning && dissolve.progress() < ABANDON_BEFORE) {
                const b = burning;
                burning = null;
                dissolve.cancel();
                slides[b.to].classList.remove('is-staged');
                retire(videoOf(b.to));
                index = b.from;
            } else {
                dissolve.skip();
            }
        }

        const n = slides.length;
        const next = ((i % n) + n) % n;
        const from = index;
        const changing = next !== from;
        if (handoff) { clearTimeout(handoff); handoff = null; }

        const burn = changing && canDissolve();
        const xf = burn ? DISSOLVE_MS : FADE_MS;   // sound follows the picture

        if (burn) {
            // In place, opaque, under the playing clip. Nothing on screen moves.
            slides[next].classList.add('is-staged');
        } else {
            place(next);   // every slide moves one step along the track
        }

        slides.forEach((slide, k) => {
            const v = slide.querySelector('video');
            const on = k === next;
            slide.classList.toggle('is-active', on);
            if (!v) return;

            if (on) {
                warm(k, 'auto');
                stopRamp(v);
                // Every clip runs once and hands over at its own ending - see
                // tick() and the 'ended' backstop.
                v.loop = false;
                v.muted = !soundOn;
                if (changing) { try { v.currentTime = 0; } catch (_) {} }
                if (soundOn) {
                    v.volume = 0;
                    play(v);
                    rampVolume(v, levelFor(v), xf);
                } else {
                    v.volume = 1;
                    play(v);
                }
            } else if (k === from && changing) {
                // Leave the outgoing clip running while it slides aside (or is
                // burned away) so the picture stays live and the sound tails
                // off; it is retired once it can no longer be seen.
                rampVolume(v, 0, xf);
            } else {
                retire(v);
            }
        });

        if (changing) {
            const outgoing = videoOf(from);
            const incoming = videoOf(next);
            // Runs after the loop above, so the incoming clip is already
            // rewound and playing; until it has a frame the poster stands in.
            const started = burn && incoming && dissolve.run(incoming, DISSOLVE_MS, {
                // The canvas is showing only the new clip: re-place the real
                // slides underneath it, where the move cannot be seen.
                onCovered: () => {
                    place(next, true);
                    slides[next].classList.remove('is-staged');
                    retire(outgoing);
                },
                onDone: (avgMs) => {
                    burning = null;
                    if (avgMs > FRAME_BUDGET_MS) {
                        dissolveLite = true;
                        console.info('[reel] dissolve averaged ' + avgMs.toFixed(1) +
                            'ms/frame - using the slide from now on');
                    }
                },
            });
            if (started) burning = { from, to: next };
            if (!started) {
                if (burn) {
                    slides[next].classList.remove('is-staged');
                    place(next);
                }
                handoff = setTimeout(() => { handoff = null; retire(outgoing); }, FADE_MS);
            }
        }

        index = next;
        if (titleEl) titleEl.textContent = slides[next].dataset.title || '';
        if (subEl) subEl.textContent = slides[next].dataset.sub || '';
        dots.forEach((d, k) => d.setAttribute('aria-current', k === next ? 'true' : 'false'));
        // The control greys out on a clip with nothing to hear. soundOn is left
        // alone, so it comes straight back on the next clip that does have it.
        volUI.setAvailable(clipHasAudio(videoOf(next)));

        warm((next + 1) % n, 'metadata');   // ready the one after this
        resetTimer();
        if (manual) restart();
    }

    // ---- auto-advance timer ---------------------------------------------
    function resetTimer() {
        elapsed = 0;
        last = 0;
        if (fill) fill.style.width = '0%';
    }

    function tick(now) {
        if (!last) last = now;
        const dt = now - last;
        last = now;

        if (!offscreen) {
            const v = videoOf(index);
            // The clip itself is the timeline, muted or not: the bar tracks real
            // playback and the hand-over starts one slide-length before the end,
            // so the next clip is already coming in as this one finishes.
            // The 9s dwell is only a fallback while the duration is unknown.
            const byClip = v && isFinite(v.duration) && v.duration > 2;

            if (byClip) {
                // Note this runs even while held: the clip is genuinely still
                // playing under the cursor, so freezing the bar and then
                // snapping it forward on mouseleave would just be a lie. Only
                // the hand-over waits for the hold to end.
                if (fill) fill.style.width = Math.min(100, (v.currentTime / v.duration) * 100) + '%';
                // A dissolve needs the whole of its length (plus a little for
                // the next clip to start) before the end, or the outgoing clip
                // freezes on its last frame while it is still on show.
                const lead = (wantsDissolve() ? DISSOLVE_MS + 300 : FADE_MS) / 1000;
                if (!paused && (v.ended || v.duration - v.currentTime <= lead)) {
                    go(index + 1, false);
                    rafId = requestAnimationFrame(tick);
                    return;
                }
            } else if (!paused) {
                elapsed += dt;
                if (fill) fill.style.width = Math.min(100, (elapsed / DWELL) * 100) + '%';
                if (elapsed >= DWELL) {
                    go(index + 1, false);
                    rafId = requestAnimationFrame(tick);
                    return;
                }
            }
        }
        rafId = requestAnimationFrame(tick);
    }

    function restart() {
        if (rafId) cancelAnimationFrame(rafId);
        resetTimer();
        if (!reduceMotion) rafId = requestAnimationFrame(tick);
    }

    // ---- sound --------------------------------------------------------------
    // Chrome, Safari and Firefox all block audible playback that nobody asked
    // for, and Safari will additionally reject the play() promise outright. So:
    // muted is cleared only in here, inside the click, and if play() still
    // refuses we go straight back to muted instead of leaving a control that
    // claims sound is on while nothing is audible.
    function setSound(on) {
        const v = videoOf(index);
        soundOn = on;
        if (on) {
            SiteAudio.claim('reel');   // the hero cannot also be playing
            SiteAudio.unmute();        // back to whatever the level was before
        } else {
            SiteAudio.mute();          // the level goes to zero with it
        }
        paintVol(soundOn);
        if (!v) return;

        if (on) {
            stopRamp(v);
            v.volume = 0;
            v.muted = false;
            const p = v.play();
            const fadeUp = () => rampVolume(v, levelFor(v), FADE_MS);
            if (p && p.then) {
                p.then(fadeUp, () => {
                    soundOn = false;
                    v.muted = true;
                    v.volume = 1;
                    paintVol(false);
                });
            } else {
                fadeUp();
            }
        } else {
            rampVolume(v, 0, FADE_MS, () => { v.muted = true; v.volume = 1; });
        }

        // The dwell rule itself changes with sound, so start the clock over.
        restart();
    }

    const volUI = volRoot ? volumeUI(volRoot, {
        onLabel: 'Turn sound off',
        offLabel: 'Turn sound on',
        noneLabel: 'This clip has no sound',
        toggle: () => setSound(!soundOn),
        // A short glide, not a snap: stepping the gain straight to each new
        // value as the thumb moves is audible as a zip.
        level: () => {
            if (!soundOn) { setSound(true); return; }
            const v = videoOf(index);
            if (v) rampVolume(v, levelFor(v), 90);
        },
    }) : { paint: function () {}, setAvailable: function () {} };
    const paintVol = volUI.paint;

    SiteAudio.register('reel', {
        silence: () => { if (soundOn) setSound(false); },
        apply: () => {
            const v = videoOf(index);
            if (soundOn && v) rampVolume(v, levelFor(v), 90);
            paintVol(soundOn);
        },
    });

    // Re-arm audio without a jump-scare when a clip is resumed rather than started.
    function resume(v) {
        if (!v) return;
        if (soundOn) {
            stopRamp(v);
            v.muted = false;
            v.volume = 0;
            play(v);
            rampVolume(v, levelFor(v), FADE_MS);
        } else {
            play(v);
        }
    }

    // Backstop for the natural end of an audible clip. tick() normally hands
    // over a fade-length early, but with prefers-reduced-motion there is no
    // rAF loop at all, and without this the clip would simply stop dead.
    slides.forEach((slide, k) => {
        const v = slide.querySelector('video');
        if (!v) return;
        v.addEventListener('ended', () => {
            if (k !== index || offscreen) return;
            // Being held (hover, or keyboard focus) means "stay on this one", so
            // run it again rather than either advancing or freezing on the last
            // frame. loop is always off, so this is the only way back.
            if (paused) { try { v.currentTime = 0; } catch (_) {} play(v); return; }
            go(index + 1, false);
        });
    });

    // ---- input ------------------------------------------------------------
    if (prevBtn) prevBtn.addEventListener('click', () => go(index - 1, true));
    if (nextBtn) nextBtn.addEventListener('click', () => go(index + 1, true));

    // Hovering, or tabbing in with the keyboard, holds the current clip.
    //
    // Hover and focus are tracked separately on purpose. Treating any focusin
    // as "pause" meant a single mouse click on a dot or arrow left that control
    // focused, so `reel.contains(document.activeElement)` stayed true and the
    // reel never resumed cycling again. :focus-visible is only true for
    // keyboard focus, which is the case that actually wants the reel to wait.
    let hovering = false;
    let keyFocus = false;
    const syncPaused = () => { paused = hovering || keyFocus; };

    reel.addEventListener('mouseenter', () => { hovering = true; syncPaused(); });
    reel.addEventListener('mouseleave', () => { hovering = false; syncPaused(); });

    reel.addEventListener('focusin', () => {
        const el = document.activeElement;
        let visible = false;
        try { visible = !!(el && el.matches && el.matches(':focus-visible')); } catch (_) {}
        keyFocus = visible;
        syncPaused();
    });
    reel.addEventListener('focusout', () => { keyFocus = false; syncPaused(); });

    reel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, true); }
        if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, true); }
    });

    // Swipe on the stage to change clips (the arrows are hidden on mobile).
    // Mostly-horizontal swipes only, so scrolling the page past it still works,
    // and touches on the volume control are left alone.
    if (stage) {
        let swipeX = 0;
        let swipeY = 0;
        let swiping = false;

        stage.addEventListener('touchstart', (e) => {
            swiping = !(e.target.closest && e.target.closest('.vol'));
            swipeX = e.touches[0].clientX;
            swipeY = e.touches[0].clientY;
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            if (!swiping) return;
            swiping = false;
            const dx = e.changedTouches[0].clientX - swipeX;
            const dy = e.changedTouches[0].clientY - swipeY;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
            go(index + (dx < 0 ? 1 : -1), true);
        }, { passive: true });
    }

    // ---- only run while it is actually on screen --------------------------
    // 21 thresholds, so the sound dims in proportion to how much of the stage
    // is still showing instead of cutting out at a single trip-wire. Each step
    // eases to the next over 240ms, which is what joins them into one fade.
    if ('IntersectionObserver' in window && stage) {
        new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                presence = document.hidden ? 0 : presenceOf(entry);
                offscreen = presence <= 0;
                const v = videoOf(index);
                if (!v) return;
                if (presence > 0) {
                    if (v.paused) resume(v);
                    else if (soundOn) rampVolume(v, levelFor(v), 240);
                } else if (!v.paused) {
                    // Let the last of it die away before the picture stops, so
                    // scrolling past never clips the audio off mid-note.
                    rampVolume(v, 0, 260, () => { if (presence <= 0) v.pause(); });
                }
            });
        }, { threshold: AUDIO_THRESHOLDS }).observe(stage);
    }

    document.addEventListener('visibilitychange', () => {
        const v = videoOf(index);
        if (document.hidden) {
            offscreen = true;
            if (v) { stopRamp(v); v.pause(); }
        } else {
            offscreen = false;
            resume(v);
        }
    });

    // Crossing the breakpoint mid-dissolve: finish it, so the slides are in
    // their proper places for whichever layout is taking over.
    if (desktop) {
        const onBreakpoint = () => { if (dissolve && dissolve.running()) dissolve.skip(); };
        if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
        else if (desktop.addListener) desktop.addListener(onBreakpoint);
    }

    // ---- start ------------------------------------------------------------
    paintVol(false);
    go(index, false);
    if (!reduceMotion) rafId = requestAnimationFrame(tick);

    // Build the shader and decode the posters while the page is idle, not in
    // the frame the first change needs.
    if (wantsDissolve()) {
        if ('requestIdleCallback' in window) requestIdleCallback(getDissolve, { timeout: 5000 });
        else setTimeout(getDissolve, 3000);
    }
})();
