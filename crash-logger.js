// =============================================
// CRASH LOGGER - Debug tool
// Captures performance data and saves to localStorage.
// Shows a download modal after a crash/reload.
//
// TO ENABLE: Add this line right after <body> in index.html:
//   <script src="crash-logger.js"></script>
//
// TO DISABLE: Remove that <script> tag.
// =============================================
(function() {
    var log = [];
    var startTime = Date.now();
    var totalMapLoads = 0; // cumulative count of map src changes
    var totalSrcChanges = 0; // cumulative count of ANY iframe src changes

    function ts() { return ((Date.now() - startTime) / 1000).toFixed(2) + 's'; }
    function memMB() {
        if (performance && performance.memory) {
            return (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB';
        }
        return 'N/A';
    }

    function snapshot() {
        var iframesInDOM = document.querySelectorAll('iframe').length;
        var iframesWithSrc = document.querySelectorAll('iframe[src]').length;
        var iframesBlanked = document.querySelectorAll('iframe[src="about:blank"]').length;
        var lazyMaps = document.querySelectorAll('.lazy-map').length;
        var lazyWithSrc = 0;
        document.querySelectorAll('.lazy-map').forEach(function(m) {
            if (m.src && m.src !== 'about:blank') lazyWithSrc++;
        });
        var videos = document.querySelectorAll('video').length;
        var videosPlaying = 0;
        var videosSrc = 0;
        document.querySelectorAll('video').forEach(function(v) {
            if (!v.paused) videosPlaying++;
            if (v.currentSrc) videosSrc++;
        });
        var animations = 0;
        try { animations = document.getAnimations ? document.getAnimations().length : '?'; } catch(e) {}
        var nodes = document.querySelectorAll('*').length;
        var mapContainers = document.querySelectorAll('.venue-map-container').length;
        var containersWithIframe = document.querySelectorAll('.venue-map-container iframe').length;
        var images = document.querySelectorAll('img').length;
        var canvases = document.querySelectorAll('canvas').length;

        // Count social iframes currently active
        var socialIframes = 0;
        document.querySelectorAll('iframe').forEach(function(f) {
            var s = f.src || '';
            if (s.indexOf('instagram') !== -1 || s.indexOf('facebook') !== -1 || s.indexOf('fillout') !== -1) {
                socialIframes++;
            }
        });

        return 'iframes:' + iframesInDOM + '(src:' + iframesWithSrc + ' blank:' + iframesBlanked + ')' +
            ' maps:' + containersWithIframe + '/' + mapContainers + '(active:' + lazyWithSrc + ')' +
            ' social:' + socialIframes +
            ' vids:' + videos + '(play:' + videosPlaying + ' loaded:' + videosSrc + ')' +
            ' anim:' + animations +
            ' nodes:' + nodes +
            ' canvas:' + canvases +
            ' mapLoads:' + totalMapLoads +
            ' mem:' + memMB();
    }

    function addLog(msg) {
        var entry = '[' + ts() + '] ' + msg;
        log.push(entry);
        if (log.length > 1000) log.shift();
        try { localStorage.setItem('_crashLog', JSON.stringify({ time: new Date().toISOString(), entries: log })); } catch(e) {}
    }

    // Detect crash vs clean reload
    var exitType = 'CRASH'; // assume crash unless proven otherwise
    try {
        var cleanExit = localStorage.getItem('_cleanExit');
        var prevCrash = localStorage.getItem('_crashLog');
        if (prevCrash) {
            localStorage.setItem('_prevCrashLog', prevCrash);
        }
        if (cleanExit === 'true') {
            exitType = 'MANUAL RELOAD';
        }
        localStorage.removeItem('_cleanExit');
    } catch(e) {}

    addLog('PAGE LOAD START | ' + snapshot());

    window.addEventListener('DOMContentLoaded', function() {
        addLog('DOM CONTENT LOADED | ' + snapshot());

        // Device & detection info
        addLog('DETECT: screen=' + screen.width + 'x' + screen.height +
            ' window=' + window.innerWidth + 'x' + window.innerHeight +
            ' isMobile(screen<=768)=' + (screen.width <= 768) +
            ' DPR=' + window.devicePixelRatio +
            ' UA_mobile=' + /Mobile|iPhone|Android/i.test(navigator.userAgent) +
            ' touch=' + ('ontouchstart' in window) +
            ' orientation=' + (screen.orientation ? screen.orientation.type : window.orientation));

        // Check mapLoader after it initializes
        setTimeout(function() {
            if (window.mapLoader) {
                var ml = window.mapLoader;
                addLog('MAP_LOADER: isMobile=' + ml.isMobile +
                    ' loadedMap.size=' + ml.loadedMap.size +
                    ' cardEntries=' + ml.cardEntries.length +
                    ' preloadDone=' + ml.preloadDone +
                    ' hasPool=' + !!ml.pool +
                    ' hasMobileIframe=' + !!ml.mobileIframe);
            } else {
                addLog('MAP_LOADER: NOT FOUND on window');
            }
        }, 500);

        // Patch setInterval to log creation
        var intervalCount = 0;
        var origSetInterval = window.setInterval;
        window.setInterval = function() {
            intervalCount++;
            addLog('setInterval CREATED (#' + intervalCount + ') delay:' + arguments[1] + 'ms');
            return origSetInterval.apply(window, arguments);
        };
    });

    window.addEventListener('load', function() {
        addLog('WINDOW LOAD | ' + snapshot());

        // Scripts
        var scripts = document.querySelectorAll('script[src]');
        var scriptList = [];
        scripts.forEach(function(s) { scriptList.push(s.src.split('/').pop()); });
        addLog('SCRIPTS: ' + (scriptList.join(', ') || 'none external'));

        // Stylesheets
        var sheets = document.querySelectorAll('link[rel="stylesheet"]');
        var sheetList = [];
        sheets.forEach(function(s) { sheetList.push(s.href.split('/').pop()); });
        addLog('STYLESHEETS: ' + (sheetList.join(', ') || 'none'));

        // Map loader state after load settles
        setTimeout(function() {
            if (window.mapLoader) {
                var ml = window.mapLoader;
                addLog('MAP_LOADER POST-LOAD: isMobile=' + ml.isMobile +
                    ' loadedMap.size=' + ml.loadedMap.size +
                    ' preloadDone=' + ml.preloadDone +
                    ' mobileCurrentSrc=' + (ml.mobileCurrentSrc ? ml.mobileCurrentSrc.substring(0, 60) + '...' : 'none'));
            }
        }, 2000);

        // Always show modal with previous session log
        var prev = null;
        try { prev = localStorage.getItem('_prevCrashLog'); } catch(e) {}
        if (prev) {
            showCrashModal(prev, exitType);
        }
    });

    // Error tracking
    window.addEventListener('error', function(e) {
        var stack = '';
        if (e.error && e.error.stack) stack = ' STACK: ' + e.error.stack.substring(0, 300);
        addLog('ERROR: ' + (e.message || 'unknown') + ' at ' + (e.filename || '?') + ':' + (e.lineno || '?') + ':' + (e.colno || '?') + stack);
    });
    window.addEventListener('unhandledrejection', function(e) {
        addLog('UNHANDLED REJECTION: ' + String(e.reason).substring(0, 300));
    });

    // Full snapshot every 2 seconds with extended ML info
    setInterval(function() {
        var mapInfo = '';
        if (window.mapLoader) {
            var ml = window.mapLoader;
            mapInfo = ' | ML:loaded=' + ml.loadedMap.size +
                ' scrolling=' + ml.isScrolling +
                ' assigned=' + (ml.mobileAssignedTo ? 'yes' : 'no');
        }
        addLog('TICK | ' + snapshot() + mapInfo);
    }, 2000);

    // Tour-grid scroll logging
    var scrollCount = 0;
    document.addEventListener('DOMContentLoaded', function() {
        var grid = document.querySelector('.tour-grid');
        if (grid) {
            var lastLog = 0;
            grid.addEventListener('scroll', function() {
                scrollCount++;
                var now = Date.now();
                if (now - lastLog > 500) {
                    lastLog = now;
                    var loadedCards = [];
                    document.querySelectorAll('.tour-date').forEach(function(card, i) {
                        var iframe = card.querySelector('iframe');
                        if (iframe && iframe.src && iframe.src !== 'about:blank') loadedCards.push(i);
                    });
                    var mlInfo = '';
                    if (window.mapLoader) {
                        mlInfo = ' ML:size=' + window.mapLoader.loadedMap.size +
                            ' scrolling=' + window.mapLoader.isScrolling;
                    }
                    addLog('SCROLL #' + scrollCount +
                        ' pos:' + Math.round(grid.scrollLeft) + '/' + (grid.scrollWidth - grid.clientWidth) +
                        ' card:~' + Math.round(grid.scrollLeft / 320) +
                        ' | maps_active:' + loadedCards.length +
                        ' on_cards:[' + loadedCards.join(',') + ']' +
                        ' cumMapLoads:' + totalMapLoads +
                        mlInfo);
                }
            }, { passive: true });
        }

        // Page vertical scroll
        var lastPageScroll = 0;
        window.addEventListener('scroll', function() {
            var now = Date.now();
            if (now - lastPageScroll > 2000) {
                lastPageScroll = now;
                addLog('PAGE_SCROLL y:' + Math.round(window.scrollY) + '/' + (document.body.scrollHeight - window.innerHeight) + ' | ' + snapshot());
            }
        }, { passive: true });
    });

    // Visibility and lifecycle
    document.addEventListener('visibilitychange', function() {
        addLog('VISIBILITY: ' + document.visibilityState + ' | ' + snapshot());
    });
    window.addEventListener('pagehide', function() {
        addLog('PAGEHIDE | ' + snapshot());
        try { localStorage.setItem('_cleanExit', 'true'); } catch(e) {}
    });
    window.addEventListener('beforeunload', function() {
        try { localStorage.setItem('_cleanExit', 'true'); } catch(e) {}
    });

    // Low memory warning (Safari-specific)
    if (window.onmemorywarning !== undefined) {
        window.addEventListener('memorywarning', function() {
            addLog('MEMORY WARNING fired | ' + snapshot());
        });
    }

    // Performance observer: long tasks
    try {
        if (window.PerformanceObserver) {
            new PerformanceObserver(function(list) {
                list.getEntries().forEach(function(entry) {
                    if (entry.duration > 100) {
                        addLog('LONG TASK: ' + entry.duration.toFixed(0) + 'ms name:' + entry.name);
                    }
                });
            }).observe({ entryTypes: ['longtask'] });
        }
    } catch(e) {}

    // Resource loading monitor - track iframes and large resources
    try {
        if (window.PerformanceObserver) {
            new PerformanceObserver(function(list) {
                list.getEntries().forEach(function(entry) {
                    var isIframe = entry.initiatorType === 'iframe';
                    var isLarge = entry.transferSize > 100000;
                    if (isIframe || isLarge) {
                        totalSrcChanges++;
                        if (isIframe && entry.name.indexOf('google.com/maps') !== -1) {
                            totalMapLoads++;
                        }
                        addLog('RESOURCE: ' + entry.initiatorType + ' ' +
                            (entry.transferSize / 1024).toFixed(0) + 'KB ' +
                            entry.duration.toFixed(0) + 'ms ' +
                            entry.name.substring(0, 100) +
                            (isIframe ? ' [cumMaps:' + totalMapLoads + ' cumSrc:' + totalSrcChanges + ']' : ''));
                    }
                });
            }).observe({ entryTypes: ['resource'] });
        }
    } catch(e) {}

    // Monitor map-progress events (desktop preload)
    window.addEventListener('map-progress', function(e) {
        addLog('MAP_PROGRESS: ' + e.detail.loaded + '/' + e.detail.total);
    });

    // Show modal with download button
    function showCrashModal(prevLog, type) {
        var isCrash = type === 'CRASH';
        var borderColor = isCrash ? '#ff3333' : '#f0a500';
        var titleColor = isCrash ? '#ff3333' : '#f0a500';
        var title = isCrash ? 'Crash Log Captured' : 'Session Log Available';
        var desc = isCrash
            ? 'The page crashed. Download the log for debugging.'
            : 'Manual reload detected. Download the previous session log.';

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;' +
            'background:rgba(0,0,0,0.85);z-index:999999;display:flex;' +
            'align-items:center;justify-content:center;padding:20px;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a1a;border:2px solid ' + borderColor + ';border-radius:12px;' +
            'padding:24px;max-width:340px;width:100%;text-align:center;color:#fff;font-family:sans-serif;';

        box.innerHTML = '<h3 style="color:' + titleColor + ';margin:0 0 12px;font-size:18px;">' + title + '</h3>' +
            '<p style="color:#ccc;font-size:14px;margin:0 0 20px;">' + desc + '</p>';

        var dlBtn = document.createElement('button');
        dlBtn.textContent = 'Download Crash Log';
        dlBtn.style.cssText = 'background:#ff3333;color:#fff;border:none;padding:14px 24px;' +
            'border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;width:100%;margin-bottom:10px;';
        dlBtn.addEventListener('click', function() {
            var parsed = {};
            try { parsed = JSON.parse(prevLog); } catch(e) { parsed = { raw: prevLog }; }
            var content = '=== ' + type + ' LOG ===\n' +
                'Exit type: ' + type + '\n' +
                'Captured at: ' + (parsed.time || 'unknown') + '\n' +
                'Downloaded at: ' + new Date().toISOString() + '\n\n' +
                '=== LOG ENTRIES ===\n' +
                (parsed.entries ? parsed.entries.join('\n') : prevLog) +
                '\n\n=== DEVICE INFO ===\n' +
                'UA: ' + navigator.userAgent + '\n' +
                'Screen: ' + screen.width + 'x' + screen.height + '\n' +
                'Window: ' + window.innerWidth + 'x' + window.innerHeight + '\n' +
                'DPR: ' + window.devicePixelRatio + '\n' +
                'isMobile(screen<=768): ' + (screen.width <= 768) + '\n' +
                'Touch: ' + ('ontouchstart' in window) + '\n' +
                'Orientation: ' + (screen.orientation ? screen.orientation.type : window.orientation) + '\n' +
                'Connection: ' + (navigator.connection ? navigator.connection.effectiveType + ' downlink:' + navigator.connection.downlink + 'Mbps' : 'N/A') + '\n' +
                'HW Concurrency: ' + (navigator.hardwareConcurrency || 'N/A') + '\n' +
                'Device Memory: ' + (navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'N/A') + '\n' +
                'Total Map Loads: ' + totalMapLoads + '\n' +
                'Total Src Changes: ' + totalSrcChanges + '\n' +
                '\n=== CURRENT SESSION (post-reload) ===\n' +
                log.join('\n') + '\n';
            var blob = new Blob([content], { type: 'text/plain' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'morenos-crash-log.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        var dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.style.cssText = 'background:transparent;color:#888;border:1px solid #444;' +
            'padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;width:100%;';
        dismissBtn.addEventListener('click', function() {
            overlay.remove();
            try { localStorage.removeItem('_prevCrashLog'); } catch(e) {}
        });

        box.appendChild(dlBtn);
        box.appendChild(dismissBtn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
})();
