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
    function navOffset() {
        const nav = document.querySelector('.navbar');
        if (!nav) return 80;
        const had = nav.classList.contains('scrolled');
        if (!had) nav.classList.add('scrolled');
        const h = nav.getBoundingClientRect().height;   // same frame, so no flicker
        if (!had) nav.classList.remove('scrolled');
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

    // Video autoplay functionality - with visibility-based loading/unloading
    const allVideos = document.querySelectorAll('.autoplay-video, .hero-video');

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

        // The rail is vertical and revealed with clip-path (see styles.css), so
        // this writes a percentage rather than setting a width. --glow-intensity
        // is gone with the blur layers it used to drive.
        const p = Math.min(100, Math.max(0, this.currentProgress));
        this.ribbon.style.setProperty('--p', `${p}%`);
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

// Initialize testimonials carousel - Fixed version
function initTestimonialsCarousel() {
    console.log('Initializing testimonials carousel...');
    
    const track = document.getElementById('testimonials-track');
    const prevBtn = document.getElementById('testimonials-prev');
    const nextBtn = document.getElementById('testimonials-next');
    const dotsContainer = document.getElementById('testimonials-dots');
    
    console.log('Elements found:', { track, prevBtn, nextBtn, dotsContainer });
    
    if (!track || !prevBtn || !nextBtn || !dotsContainer) {
        console.error('Testimonials carousel elements not found');
        return;
    }
    
    const cards = track.querySelectorAll('.testimonial-card');
    const dots = dotsContainer.querySelectorAll('.dot');
    
    console.log('Cards found:', cards.length);
    console.log('Dots found:', dots.length);
    
    if (cards.length === 0) {
        console.error('No testimonial cards found');
        return;
    }
    
    let currentIndex = 0;
    let isTransitioning = false;
    let autoPlayInterval;
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    
    // Auto-play settings
    const autoPlayDelay = 8000; // 8 seconds
    const transitionDuration = 800; // 0.8 seconds
    
    function updateCarousel(index, animate = true) {
        console.log('Updating carousel to index:', index);
        
        if (isTransitioning || index < 0 || index >= cards.length) {
            console.log('Transition blocked or invalid index');
            return;
        }
        
        currentIndex = index;
        
        if (animate) {
            isTransitioning = true;
            track.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        } else {
            track.style.transition = 'none';
        }
        
        const translateX = -currentIndex * 100;
        track.style.transform = `translateX(${translateX}%)`;
        
        console.log('Applied transform:', `translateX(${translateX}%)`);
        
        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        // Update navigation buttons
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex === cards.length - 1 ? '0.5' : '1';
        
        if (animate) {
            setTimeout(() => {
                isTransitioning = false;
                console.log('Transition complete');
            }, transitionDuration);
        }
    }
    
    function goToNext() {
        console.log('Going to next slide');
        if (currentIndex < cards.length - 1) {
            updateCarousel(currentIndex + 1);
        } else {
            updateCarousel(0); // Loop to first
        }
    }
    
    function goToPrev() {
        console.log('Going to previous slide');
        if (currentIndex > 0) {
            updateCarousel(currentIndex - 1);
        } else {
            updateCarousel(cards.length - 1); // Loop to last
        }
    }
    
    function startAutoPlay() {
        console.log('Starting auto-play');
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
        autoPlayInterval = setInterval(() => {
            if (!isDragging && !isTransitioning) {
                console.log('Auto-play: going to next');
                goToNext();
            }
        }, autoPlayDelay);
    }
    
    function stopAutoPlay() {
        console.log('Stopping auto-play');
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    function restartAutoPlay() {
        stopAutoPlay();
        setTimeout(startAutoPlay, 1000); // Wait 1 second before restarting
    }
    
    // Event listeners
    nextBtn.addEventListener('click', (e) => {
        console.log('Next button clicked');
        e.preventDefault();
        if (!isTransitioning) {
            goToNext();
            restartAutoPlay();
        }
    });
    
    prevBtn.addEventListener('click', (e) => {
        console.log('Previous button clicked');
        e.preventDefault();
        if (!isTransitioning) {
            goToPrev();
            restartAutoPlay();
        }
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            console.log('Dot clicked:', index);
            e.preventDefault();
            if (!isTransitioning && index !== currentIndex) {
                updateCarousel(index);
                restartAutoPlay();
            }
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.testimonials-carousel') || e.target === document.body) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (!isTransitioning) {
                    goToPrev();
                    restartAutoPlay();
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (!isTransitioning) {
                    goToNext();
                    restartAutoPlay();
                }
            }
        }
    });
    
    // Touch/swipe support
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
        stopAutoPlay();
    }, { passive: true });
    
    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    track.addEventListener('touchend', () => {
        if (!isDragging) return;
        
        const swipeThreshold = 75;
        const swipeDistance = touchStartX - touchEndX;
        
        if (Math.abs(swipeDistance) > swipeThreshold && !isTransitioning) {
            if (swipeDistance > 0) {
                goToNext();
            } else {
                goToPrev();
            }
        }
        
        isDragging = false;
        restartAutoPlay();
    });
    
    // Mouse events for desktop
    track.addEventListener('mouseenter', stopAutoPlay);
    track.addEventListener('mouseleave', () => {
        if (!isDragging) {
            startAutoPlay();
        }
    });
    
    // Pause/resume on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoPlay();
        } else if (!isDragging) {
            startAutoPlay();
        }
    });
    
    // Initialize
    console.log('Initializing carousel at index 0');
    updateCarousel(0, false);
    
    // Start auto-play after a delay
    setTimeout(() => {
        console.log('Starting delayed auto-play');
        startAutoPlay();
    }, 3000);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        updateCarousel(currentIndex, false);
    });
    
    console.log('Testimonials carousel initialized successfully');
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
        SiteAudio.level = slider.value / 100;
        host.level();
    });

    slider.addEventListener('pointerdown', () => {
        dragging = true;
        root.classList.add('is-dragging');
    });
    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        root.classList.remove('is-dragging');
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
    const video = hero && hero.querySelector('.hero-video');
    if (!root || !video) return;

    const FADE_MS = 650;
    let on = false;        // the visitor has asked for hero sound
    let presence = 1;      // 0..1, how much of the hero is on screen

    // Everything routes through this, so scrolling away dims the sound in
    // proportion rather than switching it off at a trip-wire.
    const levelFor = () => SiteAudio.target(video) * presence;
    const audible = () => on && presence > 0;

    // Come up from zero every time, so returning to the hero is never a blast.
    function liftIn(ms) {
        SiteAudio.stopRamp(video);
        video.volume = 0;
        video.muted = false;
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
        SiteAudio.ramp(video, levelFor(), ms === undefined ? FADE_MS : ms);
    }

    function turnOff() {
        on = false;
        SiteAudio.mute();          // the level goes to zero with it
        SiteAudio.ramp(video, 0, 320, () => { video.muted = true; video.volume = 1; });
        paint(false);
    }

    function turnOn() {
        SiteAudio.claim('hero');
        on = true;
        SiteAudio.unmute();        // back to whatever the level was before
        paint(true);
        if (presence <= 0) return;
        SiteAudio.stopRamp(video);
        video.volume = 0;
        video.muted = false;
        const p = video.play();
        const up = () => SiteAudio.ramp(video, levelFor(), FADE_MS);
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

    const ui = volumeUI(root, {
        onLabel: 'Turn hero sound off',
        offLabel: 'Turn hero sound on',
        noneLabel: 'This video has no sound',
        toggle: () => { if (on) turnOff(); else turnOn(); },
        // A short glide rather than a snap: stepping the gain straight to a new
        // value on every input event is audible as a zip.
        level: () => {
            if (!on) turnOn();
            else if (audible()) SiteAudio.ramp(video, levelFor(), 90);
        },
    });
    const paint = ui.paint;

    SiteAudio.register('hero', {
        silence: () => { if (on) turnOff(); },
        apply: () => {
            if (audible()) SiteAudio.ramp(video, levelFor(), 90);
            paint(on);
        },
    });

    paint(false);

    // Grey the control out if this file turns out to carry no sound.
    const checkAudio = () => ui.setAvailable(clipHasAudio(video));
    if (video.readyState >= 1) checkAudio();
    video.addEventListener('loadedmetadata', checkAudio);

    // Scrolling away dims the hero in proportion to how much of it is still on
    // screen, across 21 thresholds, each one easing to the next over 240ms. The
    // result is a continuous fade tied to the scroll rather than a cut.
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach(e => {
                presence = document.hidden ? 0 : presenceOf(e);
                if (!on) return;
                if (presence > 0) {
                    if (video.muted || video.paused) liftIn(240);
                    else SiteAudio.ramp(video, levelFor(), 240);
                } else {
                    // Already near zero from the ramp above; this just lands it
                    // and mutes, so nothing bleeds once the hero is gone.
                    SiteAudio.ramp(video, 0, 200, () => {
                        if (presence <= 0) video.muted = true;
                    });
                }
            });
        }, { threshold: AUDIO_THRESHOLDS }).observe(hero);
    }

    // The global background-video handler replays everything when the tab comes
    // back. Parking the volume at zero on the way out means that can never land
    // as a blast, whichever listener runs first.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            presence = 0;
            SiteAudio.stopRamp(video);
            video.volume = 0;
        } else {
            const r = hero.getBoundingClientRect();
            const vh = window.innerHeight;
            const shown = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
            presence = presenceOf({
                boundingClientRect: r,
                intersectionRatio: r.height > 0 ? shown / r.height : 0,
                rootBounds: { height: vh },
            });
            if (on && presence > 0) liftIn();
        }
    });
})();

// =============================================
// LIVE PERFORMANCES REEL
//
// Single-player showcase: one clip on screen, cross-fading on a timer, with
// prev/next and dots. Owns its own playback - the videos use .reel-video, not
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
// on, the picture and the audio cross-fade on the same curve, and a clip runs
// to its natural end rather than being cut off at the 9s muted dwell.
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
    const FADE_MS = 650;  // matches the .reel-slide opacity transition exactly
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
        const n = slides.length;
        const next = ((i % n) + n) % n;
        const from = index;
        const changing = next !== from;

        if (handoff) { clearTimeout(handoff); handoff = null; }

        slides.forEach((slide, k) => {
            const v = slide.querySelector('video');
            const on = k === next;
            slide.classList.toggle('is-active', on);
            if (!v) return;

            if (on) {
                warm(k, 'auto');
                stopRamp(v);
                // Muted, a clip loops as wallpaper. Audible, it runs once and
                // hands over at its own ending - see tick().
                v.loop = !soundOn;
                v.muted = !soundOn;
                if (soundOn) {
                    if (changing) { try { v.currentTime = 0; } catch (_) {} }
                    v.volume = 0;
                    play(v);
                    rampVolume(v, levelFor(v), FADE_MS);
                } else {
                    v.volume = 1;
                    play(v);
                }
            } else if (k === from && changing) {
                // Leave the outgoing clip running underneath the dissolve so the
                // picture stays live and the sound tails off; retire() below
                // stops it once the cross-fade has finished.
                rampVolume(v, 0, FADE_MS);
            } else {
                retire(v);
            }
        });

        if (changing) {
            const outgoing = videoOf(from);
            handoff = setTimeout(() => { handoff = null; retire(outgoing); }, FADE_MS);
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
            // With sound on the clip itself is the timeline: the bar tracks real
            // playback and the hand-over starts one fade-length before the end,
            // so the next clip is already coming up as this one finishes rather
            // than the song being chopped off at nine seconds.
            // A silent clip has no performance to sit through, so it keeps the
            // 9s showcase dwell even when sound is on.
            const byClip = soundOn && v && clipHasAudio(v) && isFinite(v.duration) && v.duration > 2;

            if (byClip) {
                // Note this runs even while held: the clip is genuinely still
                // playing under the cursor, so freezing the bar and then
                // snapping it forward on mouseleave would just be a lie. Only
                // the hand-over waits for the hold to end.
                if (fill) fill.style.width = Math.min(100, (v.currentTime / v.duration) * 100) + '%';
                if (!paused && (v.ended || v.duration - v.currentTime <= FADE_MS / 1000)) {
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

        v.loop = !on;
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
                    v.loop = true;
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
            if (k !== index || !soundOn || offscreen) return;
            // Being held (hover, or keyboard focus) means "stay on this one", so
            // run it again rather than either advancing or freezing on the last
            // frame. loop is off while audible, so this is the only way back.
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

    // ---- start ------------------------------------------------------------
    paintVol(false);
    go(index, false);
    if (!reduceMotion) rafId = requestAnimationFrame(tick);
})();
