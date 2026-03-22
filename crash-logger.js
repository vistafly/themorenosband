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
        var lazyMaps = document.querySelectorAll('.lazy-map').length;
        var lazyWithSrc = document.querySelectorAll('.lazy-map[src]').length;
        var videos = document.querySelectorAll('video').length;
        var videosPlaying = 0;
        document.querySelectorAll('video').forEach(function(v) { if (!v.paused) videosPlaying++; });
        var animations = 0;
        try { animations = document.getAnimations ? document.getAnimations().length : '?'; } catch(e) {}
        var nodes = document.querySelectorAll('*').length;
        var mapContainers = document.querySelectorAll('.venue-map-container').length;
        var containersWithIframe = document.querySelectorAll('.venue-map-container iframe').length;
        var images = document.querySelectorAll('img').length;
        var imagesLoading = document.querySelectorAll('img[loading="lazy"]').length;

        return 'iframes_DOM:' + iframesInDOM +
            ' iframes_src:' + iframesWithSrc +
            ' maps_total:' + mapContainers +
            ' maps_loaded:' + containersWithIframe +
            ' lazy:' + lazyMaps +
            ' lazy_src:' + lazyWithSrc +
            ' videos:' + videos + '(playing:' + videosPlaying + ')' +
            ' imgs:' + images + '(lazy:' + imagesLoading + ')' +
            ' animations:' + animations +
            ' nodes:' + nodes +
            ' mem:' + memMB();
    }

    function addLog(msg) {
        var entry = '[' + ts() + '] ' + msg;
        log.push(entry);
        if (log.length > 800) log.shift();
        try { localStorage.setItem('_crashLog', JSON.stringify({ time: new Date().toISOString(), entries: log })); } catch(e) {}
    }

    // Detect crash vs clean reload:
    // On clean exit (pagehide/beforeunload), we set _cleanExit=true.
    // On next load, if _cleanExit is missing, the previous session crashed.
    var wasCrash = false;
    var prevCrash = null;
    try {
        var cleanExit = localStorage.getItem('_cleanExit');
        prevCrash = localStorage.getItem('_crashLog');
        if (prevCrash && cleanExit !== 'true') {
            // Previous session did NOT exit cleanly = crash
            wasCrash = true;
            localStorage.setItem('_prevCrashLog', prevCrash);
        }
        // Clear the flag for this session (will be set again on clean exit)
        localStorage.removeItem('_cleanExit');
    } catch(e) {}

    addLog('PAGE LOAD START | ' + snapshot());

    window.addEventListener('DOMContentLoaded', function() {
        addLog('DOM CONTENT LOADED | ' + snapshot());

        // Log which code path the MapLazyLoader chose
        addLog('DETECT: screen.width=' + screen.width +
            ' window.innerWidth=' + window.innerWidth +
            ' isMobile(screen<=768)=' + (screen.width <= 768) +
            ' DPR=' + window.devicePixelRatio +
            ' UA_mobile=' + /Mobile|iPhone|Android/i.test(navigator.userAgent));

        // Check if mapLoader exists and what mode it's in
        setTimeout(function() {
            if (window.mapLoader) {
                addLog('MAP_LOADER: isMobile=' + window.mapLoader.isMobile +
                    ' loadedMap.size=' + window.mapLoader.loadedMap.size +
                    ' cardEntries=' + window.mapLoader.cardEntries.length +
                    ' preloadDone=' + window.mapLoader.preloadDone);
            } else {
                addLog('MAP_LOADER: NOT FOUND on window');
            }
        }, 500);

        // Log all setIntervals active (patch to count)
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

        // List all scripts loaded
        var scripts = document.querySelectorAll('script[src]');
        var scriptList = [];
        scripts.forEach(function(s) { scriptList.push(s.src.split('/').pop()); });
        addLog('SCRIPTS: ' + (scriptList.join(', ') || 'none external'));

        // List stylesheets
        var sheets = document.querySelectorAll('link[rel="stylesheet"]');
        var sheetList = [];
        sheets.forEach(function(s) { sheetList.push(s.href.split('/').pop()); });
        addLog('STYLESHEETS: ' + (sheetList.join(', ') || 'none'));

        // Log map loader state after load
        setTimeout(function() {
            if (window.mapLoader) {
                addLog('MAP_LOADER POST-LOAD: isMobile=' + window.mapLoader.isMobile +
                    ' loadedMap.size=' + window.mapLoader.loadedMap.size +
                    ' preloadDone=' + window.mapLoader.preloadDone);
            }
        }, 2000);

        // Only show crash modal if previous session actually crashed
        if (wasCrash) {
            var prev = null;
            try { prev = localStorage.getItem('_prevCrashLog'); } catch(e) {}
            if (prev) {
                showCrashModal(prev);
            }
        }
    });

    // Log errors with stack traces
    window.addEventListener('error', function(e) {
        var stack = '';
        if (e.error && e.error.stack) stack = ' STACK: ' + e.error.stack.substring(0, 300);
        addLog('ERROR: ' + (e.message || 'unknown') + ' at ' + (e.filename || '?') + ':' + (e.lineno || '?') + ':' + (e.colno || '?') + stack);
    });
    window.addEventListener('unhandledrejection', function(e) {
        addLog('UNHANDLED REJECTION: ' + String(e.reason).substring(0, 300));
    });

    // Full snapshot every 2 seconds, include map loader state
    setInterval(function() {
        var mapInfo = '';
        if (window.mapLoader) {
            mapInfo = ' | ML:loaded=' + window.mapLoader.loadedMap.size +
                ' scrolling=' + window.mapLoader.isScrolling;
        }
        addLog('TICK | ' + snapshot() + mapInfo);
    }, 2000);

    // Log tour-grid scroll with iframe detail
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
                    // Find which cards have iframes loaded
                    var loadedCards = [];
                    document.querySelectorAll('.tour-date').forEach(function(card, i) {
                        if (card.querySelector('iframe[src]')) loadedCards.push(i);
                    });
                    var mlInfo = '';
                    if (window.mapLoader) {
                        mlInfo = ' ML:size=' + window.mapLoader.loadedMap.size +
                            ' scrolling=' + window.mapLoader.isScrolling;
                    }
                    addLog('SCROLL #' + scrollCount +
                        ' pos:' + Math.round(grid.scrollLeft) + '/' + (grid.scrollWidth - grid.clientWidth) +
                        ' card:~' + Math.round(grid.scrollLeft / 320) +
                        ' | maps_loaded:' + loadedCards.length +
                        ' cards_with_maps:[' + loadedCards.join(',') + ']' +
                        mlInfo);
                }
            }, { passive: true });
        }

        // Log page vertical scroll
        var lastPageScroll = 0;
        window.addEventListener('scroll', function() {
            var now = Date.now();
            if (now - lastPageScroll > 2000) {
                lastPageScroll = now;
                addLog('PAGE_SCROLL y:' + Math.round(window.scrollY) + '/' + (document.body.scrollHeight - window.innerHeight) + ' | ' + snapshot());
            }
        }, { passive: true });
    });

    document.addEventListener('visibilitychange', function() {
        addLog('VISIBILITY: ' + document.visibilityState + ' | ' + snapshot());
    });
    window.addEventListener('pagehide', function() {
        addLog('PAGEHIDE | ' + snapshot());
        // Mark clean exit so next load knows it wasn't a crash
        try { localStorage.setItem('_cleanExit', 'true'); } catch(e) {}
    });
    window.addEventListener('beforeunload', function() {
        try { localStorage.setItem('_cleanExit', 'true'); } catch(e) {}
    });

    // Performance observer for long tasks (>50ms)
    try {
        if (window.PerformanceObserver) {
            var longTaskObserver = new PerformanceObserver(function(list) {
                list.getEntries().forEach(function(entry) {
                    if (entry.duration > 100) {
                        addLog('LONG TASK: ' + entry.duration.toFixed(0) + 'ms name:' + entry.name);
                    }
                });
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
    } catch(e) {}

    // Resource loading monitor - log heavy resources
    try {
        if (window.PerformanceObserver) {
            var resObserver = new PerformanceObserver(function(list) {
                list.getEntries().forEach(function(entry) {
                    // Log large resources (>100KB) or iframes
                    if (entry.transferSize > 100000 || entry.initiatorType === 'iframe') {
                        addLog('RESOURCE: ' + entry.initiatorType + ' ' +
                            (entry.transferSize / 1024).toFixed(0) + 'KB ' +
                            entry.duration.toFixed(0) + 'ms ' +
                            entry.name.substring(0, 100));
                    }
                });
            });
            resObserver.observe({ entryTypes: ['resource'] });
        }
    } catch(e) {}

    // Monitor map-progress events (desktop preload)
    window.addEventListener('map-progress', function(e) {
        addLog('MAP_PROGRESS: ' + e.detail.loaded + '/' + e.detail.total);
    });

    // Show modal with download button after a crash reload
    function showCrashModal(prevLog) {
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;' +
            'background:rgba(0,0,0,0.85);z-index:999999;display:flex;' +
            'align-items:center;justify-content:center;padding:20px;';

        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a1a;border:2px solid #ff3333;border-radius:12px;' +
            'padding:24px;max-width:340px;width:100%;text-align:center;color:#fff;font-family:sans-serif;';

        box.innerHTML = '<h3 style="color:#ff3333;margin:0 0 12px;font-size:18px;">Crash Log Captured</h3>' +
            '<p style="color:#ccc;font-size:14px;margin:0 0 20px;">The page crashed or reloaded. ' +
            'Download the log and send it for debugging.</p>';

        var dlBtn = document.createElement('button');
        dlBtn.textContent = 'Download Crash Log';
        dlBtn.style.cssText = 'background:#ff3333;color:#fff;border:none;padding:14px 24px;' +
            'border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;width:100%;margin-bottom:10px;';
        dlBtn.addEventListener('click', function() {
            var parsed = {};
            try { parsed = JSON.parse(prevLog); } catch(e) { parsed = { raw: prevLog }; }
            var content = '=== CRASH LOG ===\n' +
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
                'Connection: ' + (navigator.connection ? navigator.connection.effectiveType + ' downlink:' + navigator.connection.downlink + 'Mbps' : 'N/A') + '\n' +
                'HW Concurrency: ' + (navigator.hardwareConcurrency || 'N/A') + '\n' +
                'Device Memory: ' + (navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'N/A') + '\n' +
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
