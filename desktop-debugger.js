// =============================================
// DESKTOP TOUR CARD DEBUGGER
// Diagnoses: laggy initial load, cards/maps disappearing,
// iframe overload, IntersectionObserver behavior.
//
// TO ENABLE:  <script src="desktop-debugger.js"></script>
//             (add right before </body> or after script.js)
// TO DISABLE: Remove that <script> tag.
//
// Target device: ASUS ZenBook / laptops (>768px)
// =============================================
(function () {
    'use strict';

    // Only run on desktop (>768px)
    if (window.innerWidth <= 768) return;

    var log = [];
    var startTime = performance.now();
    var MAX_LOG = 1200;
    var panelVisible = true;

    // ---- Helpers ----
    function ts() {
        return ((performance.now() - startTime) / 1000).toFixed(2) + 's';
    }

    function memMB() {
        if (performance && performance.memory) {
            return {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(1),
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(1),
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0)
            };
        }
        return null;
    }

    function addLog(msg, level) {
        var entry = { t: ts(), msg: msg, level: level || 'info' };
        log.push(entry);
        if (log.length > MAX_LOG) log.shift();
        updateLogDisplay();
    }

    // ---- Snapshot ----
    function snapshot() {
        var iframesAll = document.querySelectorAll('iframe');
        var iframesWithSrc = document.querySelectorAll('iframe[src]');
        var lazyMaps = document.querySelectorAll('.lazy-map');
        var lazyWithSrc = document.querySelectorAll('.lazy-map[src]');
        var lazyWithDataSrc = document.querySelectorAll('.lazy-map[data-src]');
        var tourCards = document.querySelectorAll('.tour-date');
        var mapContainers = document.querySelectorAll('.venue-map-container');
        var containersWithIframe = document.querySelectorAll('.venue-map-container iframe');
        var containersWithSrcIframe = document.querySelectorAll('.venue-map-container iframe[src]');
        var nodes = document.querySelectorAll('*').length;
        var videos = document.querySelectorAll('video');
        var videosPlaying = 0;
        videos.forEach(function (v) { if (!v.paused) videosPlaying++; });
        var animations = 0;
        try { animations = document.getAnimations ? document.getAnimations().length : '?'; } catch (e) { }

        var mem = memMB();

        return {
            iframes: { total: iframesAll.length, withSrc: iframesWithSrc.length },
            maps: {
                containers: mapContainers.length,
                withIframe: containersWithIframe.length,
                withSrcIframe: containersWithSrcIframe.length,
                lazyTotal: lazyMaps.length,
                lazyWithSrc: lazyWithSrc.length,
                lazyPlaceholders: lazyWithDataSrc.length
            },
            tourCards: tourCards.length,
            dom: nodes,
            videos: { total: videos.length, playing: videosPlaying },
            animations: animations,
            mem: mem
        };
    }

    function snapshotStr() {
        var s = snapshot();
        var parts = [
            'iframes:' + s.iframes.total + '(src:' + s.iframes.withSrc + ')',
            'maps:' + s.maps.withSrcIframe + '/' + s.maps.containers,
            'lazy:' + s.maps.lazyTotal + '(src:' + s.maps.lazyWithSrc + ')',
            'cards:' + s.tourCards,
            'dom:' + s.dom,
            'anim:' + s.animations
        ];
        if (s.mem) parts.push('mem:' + s.mem.used + '/' + s.mem.total + 'MB');
        return parts.join(' | ');
    }

    // ---- FPS Counter ----
    var fpsFrames = 0;
    var fpsLast = performance.now();
    var fpsCurrent = 60;
    var fpsMin = 60;
    var fpsDrops = [];

    function fpsLoop() {
        fpsFrames++;
        var now = performance.now();
        if (now - fpsLast >= 1000) {
            fpsCurrent = Math.round(fpsFrames * 1000 / (now - fpsLast));
            if (fpsCurrent < fpsMin) fpsMin = fpsCurrent;
            if (fpsCurrent < 30) {
                fpsDrops.push({ t: ts(), fps: fpsCurrent });
                addLog('FPS DROP: ' + fpsCurrent + ' fps', 'warn');
            }
            fpsFrames = 0;
            fpsLast = now;
            updateStatsDisplay();
        }
        requestAnimationFrame(fpsLoop);
    }
    requestAnimationFrame(fpsLoop);

    // ---- Track Map Load/Unload Events ----
    var mapEvents = [];

    function watchMapMutations() {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                // Iframes added
                m.addedNodes.forEach(function (node) {
                    if (node.tagName === 'IFRAME' || (node.querySelector && node.querySelector('iframe'))) {
                        var iframe = node.tagName === 'IFRAME' ? node : node.querySelector('iframe');
                        if (iframe) {
                            var container = iframe.closest('.venue-map-container');
                            var card = iframe.closest('.tour-date');
                            var cardIndex = card ? Array.from(document.querySelectorAll('.tour-date')).indexOf(card) : -1;
                            var hasSrc = !!iframe.src && iframe.src !== 'about:blank';
                            var evt = { t: ts(), action: 'ADDED', cardIndex: cardIndex, hasSrc: hasSrc, src: (iframe.src || '').substring(0, 60) };
                            mapEvents.push(evt);
                            addLog('MAP ' + evt.action + ' card#' + cardIndex + (hasSrc ? ' [src loaded]' : ' [placeholder]'), 'map');
                        }
                    }
                });
                // Iframes removed
                m.removedNodes.forEach(function (node) {
                    if (node.tagName === 'IFRAME' || (node.querySelector && node.querySelector('iframe'))) {
                        var iframe = node.tagName === 'IFRAME' ? node : node.querySelector('iframe');
                        if (iframe) {
                            var hasSrc = !!iframe.src && iframe.src !== 'about:blank';
                            var evt = { t: ts(), action: 'REMOVED', hasSrc: hasSrc };
                            mapEvents.push(evt);
                            addLog('MAP ' + evt.action + (hasSrc ? ' [had src]' : ' [placeholder]'), 'map');
                        }
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        addLog('MutationObserver watching for iframe add/remove', 'info');
    }

    // ---- Track IntersectionObserver ----
    // Patch IntersectionObserver to log when map containers enter/leave
    var OrigIO = window.IntersectionObserver;
    var ioInstances = [];

    window.IntersectionObserver = function (callback, options) {
        var id = ioInstances.length;
        var rootMargin = (options && options.rootMargin) || '0px';
        var threshold = (options && options.threshold) || 0;

        addLog('IO#' + id + ' created rootMargin:"' + rootMargin + '" threshold:' + threshold, 'io');

        var wrappedCallback = function (entries, obs) {
            entries.forEach(function (entry) {
                var isMapContainer = entry.target.classList.contains('venue-map-container');
                var isTourSection = entry.target.classList.contains('tour-section');
                if (isMapContainer || isTourSection) {
                    var card = entry.target.closest('.tour-date');
                    var cardIndex = card ? Array.from(document.querySelectorAll('.tour-date')).indexOf(card) : -1;
                    var label = isTourSection ? 'tour-section' : 'map#' + cardIndex;
                    addLog('IO#' + id + ' ' + label + ' ' + (entry.isIntersecting ? 'ENTER' : 'EXIT') +
                        ' ratio:' + entry.intersectionRatio.toFixed(2), 'io');
                }
            });
            return callback(entries, obs);
        };

        var instance = new OrigIO(wrappedCallback, options);
        ioInstances.push({ id: id, options: options, instance: instance });
        return instance;
    };
    window.IntersectionObserver.prototype = OrigIO.prototype;

    // ---- Tour Grid Scroll Tracking ----
    function watchTourGridScroll() {
        var grid = document.querySelector('.tour-grid');
        if (!grid) return;

        var lastLog = 0;
        var scrollCount = 0;

        grid.addEventListener('scroll', function () {
            scrollCount++;
            var now = Date.now();
            if (now - lastLog > 400) {
                lastLog = now;
                var loadedCards = [];
                document.querySelectorAll('.tour-date').forEach(function (card, i) {
                    if (card.querySelector('iframe[src]')) loadedCards.push(i);
                });
                var maxScroll = grid.scrollWidth - grid.clientWidth;
                var pct = maxScroll > 0 ? Math.round((grid.scrollLeft / maxScroll) * 100) : 0;
                addLog('SCROLL #' + scrollCount + ' pos:' + Math.round(grid.scrollLeft) + '/' + maxScroll +
                    ' (' + pct + '%) maps_loaded:[' + loadedCards.join(',') + '] (' + loadedCards.length + ' total)', 'scroll');
            }
        }, { passive: true });

        addLog('Tour grid scroll watcher active', 'info');
    }

    // ---- Long Tasks ----
    function watchLongTasks() {
        try {
            if (window.PerformanceObserver) {
                new PerformanceObserver(function (list) {
                    list.getEntries().forEach(function (entry) {
                        if (entry.duration > 50) {
                            addLog('LONG TASK: ' + entry.duration.toFixed(0) + 'ms', entry.duration > 150 ? 'warn' : 'info');
                        }
                    });
                }).observe({ entryTypes: ['longtask'] });
            }
        } catch (e) { }
    }

    // ---- Heavy Resource Loading ----
    function watchResources() {
        try {
            if (window.PerformanceObserver) {
                new PerformanceObserver(function (list) {
                    list.getEntries().forEach(function (entry) {
                        if (entry.transferSize > 50000 || entry.initiatorType === 'iframe') {
                            addLog('RESOURCE: ' + entry.initiatorType + ' ' +
                                (entry.transferSize / 1024).toFixed(0) + 'KB ' +
                                entry.duration.toFixed(0) + 'ms ' +
                                entry.name.substring(0, 80), 'resource');
                        }
                    });
                }).observe({ entryTypes: ['resource'] });
            }
        } catch (e) { }
    }

    // ---- Layout Shifts ----
    var clsTotal = 0;
    function watchLayoutShifts() {
        try {
            if (window.PerformanceObserver) {
                new PerformanceObserver(function (list) {
                    list.getEntries().forEach(function (entry) {
                        if (!entry.hadRecentInput && entry.value > 0.01) {
                            clsTotal += entry.value;
                            addLog('LAYOUT SHIFT: ' + entry.value.toFixed(4) + ' (CLS total: ' + clsTotal.toFixed(4) + ')', 'warn');
                        }
                    });
                }).observe({ entryTypes: ['layout-shift'] });
            }
        } catch (e) { }
    }

    // ---- Periodic Snapshot ----
    setInterval(function () {
        addLog('TICK | ' + snapshotStr(), 'tick');
    }, 3000);

    // ---- Error Capture ----
    window.addEventListener('error', function (e) {
        var stack = '';
        if (e.error && e.error.stack) stack = ' STACK: ' + e.error.stack.substring(0, 200);
        addLog('ERROR: ' + (e.message || 'unknown') + ' at ' + (e.filename || '?') + ':' + (e.lineno || '?') + stack, 'error');
    });
    window.addEventListener('unhandledrejection', function (e) {
        addLog('UNHANDLED REJECTION: ' + String(e.reason).substring(0, 200), 'error');
    });

    // =============================================
    // DEBUG PANEL UI
    // =============================================
    function createPanel() {
        var panel = document.createElement('div');
        panel.id = 'desktop-debugger';
        panel.innerHTML = '' +
            '<style>' +
            '#desktop-debugger {' +
            '  position:fixed; bottom:0; right:0; width:480px; max-height:55vh;' +
            '  background:rgba(10,10,15,0.95); color:#ddd; font:11px/1.4 "Consolas","Monaco",monospace;' +
            '  z-index:999999; border-top:2px solid #9b59b6; border-left:2px solid #9b59b6;' +
            '  border-radius:8px 0 0 0; display:flex; flex-direction:column; box-shadow: -4px -4px 20px rgba(0,0,0,0.5);' +
            '}' +
            '#desktop-debugger.collapsed { max-height:36px; }' +
            '#desktop-debugger.collapsed .dbg-body { display:none; }' +
            '#desktop-debugger .dbg-header {' +
            '  display:flex; align-items:center; justify-content:space-between;' +
            '  padding:6px 12px; background:rgba(155,89,182,0.2); cursor:pointer; flex-shrink:0;' +
            '  border-bottom:1px solid rgba(155,89,182,0.3); user-select:none;' +
            '}' +
            '#desktop-debugger .dbg-header h4 { margin:0; color:#9b59b6; font-size:12px; font-weight:700; }' +
            '#desktop-debugger .dbg-stats {' +
            '  padding:8px 12px; background:rgba(0,0,0,0.3); flex-shrink:0;' +
            '  display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px 12px; border-bottom:1px solid rgba(255,255,255,0.05);' +
            '}' +
            '#desktop-debugger .stat { font-size:10px; }' +
            '#desktop-debugger .stat-val { color:#9b59b6; font-weight:bold; }' +
            '#desktop-debugger .stat-warn { color:#e74c3c; font-weight:bold; }' +
            '#desktop-debugger .dbg-filters {' +
            '  padding:4px 12px; display:flex; gap:6px; flex-wrap:wrap; flex-shrink:0;' +
            '  border-bottom:1px solid rgba(255,255,255,0.05);' +
            '}' +
            '#desktop-debugger .filter-btn {' +
            '  padding:2px 8px; border:1px solid rgba(255,255,255,0.15); border-radius:3px;' +
            '  background:transparent; color:#888; font-size:10px; cursor:pointer;' +
            '}' +
            '#desktop-debugger .filter-btn.active { color:#fff; border-color:#9b59b6; background:rgba(155,89,182,0.2); }' +
            '#desktop-debugger .dbg-log {' +
            '  overflow-y:auto; flex:1; padding:6px 12px; min-height:0;' +
            '}' +
            '#desktop-debugger .log-entry { padding:1px 0; border-bottom:1px solid rgba(255,255,255,0.03); white-space:pre-wrap; word-break:break-all; }' +
            '#desktop-debugger .log-entry .log-time { color:#666; }' +
            '#desktop-debugger .log-entry.level-warn { color:#f39c12; }' +
            '#desktop-debugger .log-entry.level-error { color:#e74c3c; }' +
            '#desktop-debugger .log-entry.level-map { color:#2ecc71; }' +
            '#desktop-debugger .log-entry.level-io { color:#3498db; }' +
            '#desktop-debugger .log-entry.level-scroll { color:#1abc9c; }' +
            '#desktop-debugger .log-entry.level-resource { color:#e67e22; }' +
            '#desktop-debugger .log-entry.level-tick { color:#555; }' +
            '#desktop-debugger .dbg-actions {' +
            '  padding:6px 12px; display:flex; gap:6px; flex-shrink:0; border-top:1px solid rgba(255,255,255,0.05);' +
            '}' +
            '#desktop-debugger .action-btn {' +
            '  padding:4px 10px; border:1px solid rgba(155,89,182,0.4); border-radius:4px;' +
            '  background:rgba(155,89,182,0.15); color:#ccc; font-size:10px; cursor:pointer; font-family:inherit;' +
            '}' +
            '#desktop-debugger .action-btn:hover { background:rgba(155,89,182,0.3); color:#fff; }' +
            '#desktop-debugger .action-btn.danger { border-color:rgba(231,76,60,0.4); background:rgba(231,76,60,0.15); }' +
            '#desktop-debugger .action-btn.danger:hover { background:rgba(231,76,60,0.3); }' +
            '</style>' +
            '<div class="dbg-header">' +
            '  <h4>DESKTOP TOUR DEBUGGER</h4>' +
            '  <span class="dbg-toggle" style="color:#888;font-size:14px;">&#9660;</span>' +
            '</div>' +
            '<div class="dbg-body">' +
            '  <div class="dbg-stats" id="dbg-stats"></div>' +
            '  <div class="dbg-filters" id="dbg-filters"></div>' +
            '  <div class="dbg-log" id="dbg-log"></div>' +
            '  <div class="dbg-actions" id="dbg-actions"></div>' +
            '</div>';

        document.body.appendChild(panel);

        // Toggle collapse
        panel.querySelector('.dbg-header').addEventListener('click', function () {
            panel.classList.toggle('collapsed');
            panel.querySelector('.dbg-toggle').innerHTML = panel.classList.contains('collapsed') ? '&#9650;' : '&#9660;';
        });

        // Filters
        var filters = ['all', 'map', 'io', 'scroll', 'warn', 'error', 'resource', 'tick'];
        var activeFilter = 'all';
        var filtersEl = document.getElementById('dbg-filters');

        filters.forEach(function (f) {
            var btn = document.createElement('button');
            btn.className = 'filter-btn' + (f === 'all' ? ' active' : '');
            btn.textContent = f;
            btn.dataset.filter = f;
            btn.addEventListener('click', function () {
                activeFilter = f;
                filtersEl.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                updateLogDisplay();
            });
            filtersEl.appendChild(btn);
        });

        // Actions
        var actionsEl = document.getElementById('dbg-actions');

        var dlBtn = document.createElement('button');
        dlBtn.className = 'action-btn';
        dlBtn.textContent = 'Download Log';
        dlBtn.addEventListener('click', downloadLog);
        actionsEl.appendChild(dlBtn);

        var snapBtn = document.createElement('button');
        snapBtn.className = 'action-btn';
        snapBtn.textContent = 'Snapshot Now';
        snapBtn.addEventListener('click', function () {
            addLog('MANUAL SNAPSHOT | ' + snapshotStr(), 'info');
        });
        actionsEl.appendChild(snapBtn);

        var clearBtn = document.createElement('button');
        clearBtn.className = 'action-btn danger';
        clearBtn.textContent = 'Clear Log';
        clearBtn.addEventListener('click', function () {
            log = [];
            mapEvents = [];
            updateLogDisplay();
        });
        actionsEl.appendChild(clearBtn);

        var forceUnloadBtn = document.createElement('button');
        forceUnloadBtn.className = 'action-btn danger';
        forceUnloadBtn.textContent = 'Force Unload All Maps';
        forceUnloadBtn.addEventListener('click', function () {
            var removed = 0;
            document.querySelectorAll('.venue-map-container iframe[src]').forEach(function (iframe) {
                iframe.remove();
                removed++;
            });
            addLog('FORCED UNLOAD: removed ' + removed + ' map iframes', 'warn');
        });
        actionsEl.appendChild(forceUnloadBtn);

        // Store references
        window._dbgActiveFilter = function () { return activeFilter; };
    }

    function updateStatsDisplay() {
        var el = document.getElementById('dbg-stats');
        if (!el) return;

        var s = snapshot();
        var fpsColor = fpsCurrent < 30 ? 'stat-warn' : 'stat-val';
        var mapsColor = s.maps.withSrcIframe > 6 ? 'stat-warn' : 'stat-val';
        var iframeColor = s.iframes.withSrc > 8 ? 'stat-warn' : 'stat-val';

        el.innerHTML = '' +
            '<div class="stat">FPS: <span class="' + fpsColor + '">' + fpsCurrent + '</span> (min: ' + fpsMin + ')</div>' +
            '<div class="stat">Maps Loaded: <span class="' + mapsColor + '">' + s.maps.withSrcIframe + '/' + s.maps.containers + '</span></div>' +
            '<div class="stat">Iframes: <span class="' + iframeColor + '">' + s.iframes.withSrc + ' active</span></div>' +
            '<div class="stat">DOM Nodes: <span class="stat-val">' + s.dom + '</span></div>' +
            '<div class="stat">CLS: <span class="' + (clsTotal > 0.1 ? 'stat-warn' : 'stat-val') + '">' + clsTotal.toFixed(4) + '</span></div>' +
            (s.mem ? '<div class="stat">Memory: <span class="stat-val">' + s.mem.used + '/' + s.mem.total + 'MB</span></div>' : '<div class="stat">Memory: N/A</div>') +
            '<div class="stat">Videos: <span class="stat-val">' + s.videos.playing + '/' + s.videos.total + '</span></div>' +
            '<div class="stat">Animations: <span class="stat-val">' + s.animations + '</span></div>' +
            '<div class="stat">FPS Drops: <span class="' + (fpsDrops.length > 0 ? 'stat-warn' : 'stat-val') + '">' + fpsDrops.length + '</span></div>';
    }

    function updateLogDisplay() {
        var el = document.getElementById('dbg-log');
        if (!el) return;

        var filter = window._dbgActiveFilter ? window._dbgActiveFilter() : 'all';
        var filtered = filter === 'all' ? log : log.filter(function (e) { return e.level === filter; });

        // Show last 150 entries
        var recent = filtered.slice(-150);
        var html = '';
        for (var i = 0; i < recent.length; i++) {
            var e = recent[i];
            html += '<div class="log-entry level-' + e.level + '"><span class="log-time">[' + e.t + ']</span> ' + e.msg + '</div>';
        }
        el.innerHTML = html;

        // Auto-scroll to bottom
        el.scrollTop = el.scrollHeight;
    }

    function downloadLog() {
        var s = snapshot();
        var content = '=== DESKTOP TOUR CARD DEBUG LOG ===\n' +
            'Generated: ' + new Date().toISOString() + '\n' +
            'Session duration: ' + ts() + '\n\n' +
            '=== DEVICE INFO ===\n' +
            'UA: ' + navigator.userAgent + '\n' +
            'Screen: ' + screen.width + 'x' + screen.height + '\n' +
            'Window: ' + window.innerWidth + 'x' + window.innerHeight + '\n' +
            'DPR: ' + window.devicePixelRatio + '\n' +
            'HW Concurrency: ' + (navigator.hardwareConcurrency || 'N/A') + '\n' +
            'Device Memory: ' + (navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'N/A') + '\n' +
            'Connection: ' + (navigator.connection ? navigator.connection.effectiveType + ' downlink:' + navigator.connection.downlink + 'Mbps' : 'N/A') + '\n\n' +
            '=== FINAL SNAPSHOT ===\n' +
            JSON.stringify(s, null, 2) + '\n\n' +
            '=== FPS STATS ===\n' +
            'Current: ' + fpsCurrent + ' | Min: ' + fpsMin + '\n' +
            'Drops (<30fps): ' + fpsDrops.length + '\n' +
            JSON.stringify(fpsDrops, null, 2) + '\n\n' +
            '=== CLS TOTAL ===\n' +
            clsTotal.toFixed(4) + '\n\n' +
            '=== MAP EVENTS (' + mapEvents.length + ') ===\n' +
            mapEvents.map(function (e) { return '[' + e.t + '] ' + e.action + (e.cardIndex !== undefined ? ' card#' + e.cardIndex : '') + (e.hasSrc ? ' [src]' : ' [empty]'); }).join('\n') + '\n\n' +
            '=== IntersectionObserver INSTANCES ===\n' +
            ioInstances.map(function (io) { return 'IO#' + io.id + ' rootMargin:"' + (io.options && io.options.rootMargin || '0px') + '" threshold:' + (io.options && io.options.threshold || 0); }).join('\n') + '\n\n' +
            '=== FULL LOG (' + log.length + ' entries) ===\n' +
            log.map(function (e) { return '[' + e.t + '] [' + e.level + '] ' + e.msg; }).join('\n') + '\n';

        var blob = new Blob([content], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'morenos-desktop-debug-' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addLog('Log downloaded', 'info');
    }

    // ---- Initialize everything ----
    addLog('DESKTOP DEBUGGER INIT | screen:' + screen.width + 'x' + screen.height +
        ' window:' + window.innerWidth + 'x' + window.innerHeight +
        ' dpr:' + window.devicePixelRatio +
        ' cores:' + (navigator.hardwareConcurrency || '?') +
        ' mem:' + (navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '?'));

    addLog('INITIAL | ' + snapshotStr());

    watchMapMutations();
    watchLongTasks();
    watchResources();
    watchLayoutShifts();

    window.addEventListener('DOMContentLoaded', function () {
        addLog('DOM CONTENT LOADED | ' + snapshotStr());
        watchTourGridScroll();
    });

    window.addEventListener('load', function () {
        addLog('WINDOW LOAD | ' + snapshotStr());

        // Delayed check — what does the DOM look like 3s after load?
        setTimeout(function () {
            addLog('POST-LOAD +3s | ' + snapshotStr());

            // Specifically check: are cards missing that should be visible?
            var grid = document.querySelector('.tour-grid');
            if (grid) {
                var cards = document.querySelectorAll('.tour-date');
                var visibleCount = 0;
                var hiddenCards = [];
                cards.forEach(function (card, i) {
                    var rect = card.getBoundingClientRect();
                    var style = window.getComputedStyle(card);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || rect.width === 0 || rect.height === 0) {
                        hiddenCards.push(i);
                    } else {
                        visibleCount++;
                    }
                });
                if (hiddenCards.length > 0) {
                    addLog('WARNING: ' + hiddenCards.length + ' tour cards are hidden/invisible: [' + hiddenCards.join(',') + ']', 'warn');
                }
                addLog('CARD CHECK: ' + visibleCount + ' visible, ' + hiddenCards.length + ' hidden, ' + cards.length + ' total', 'info');
            }
        }, 3000);

        // Create the UI panel after DOM is ready
        createPanel();
        updateStatsDisplay();
    });

    // Page visibility
    document.addEventListener('visibilitychange', function () {
        addLog('VISIBILITY: ' + document.visibilityState + ' | ' + snapshotStr());
    });

    // Log before unload
    window.addEventListener('beforeunload', function () {
        try {
            localStorage.setItem('_desktopDebugLog', JSON.stringify({
                time: new Date().toISOString(),
                duration: ts(),
                entries: log.map(function (e) { return '[' + e.t + '] [' + e.level + '] ' + e.msg; }),
                mapEvents: mapEvents,
                fpsDrops: fpsDrops,
                cls: clsTotal,
                finalSnapshot: snapshot()
            }));
        } catch (e) { }
    });

    // Check for previous session log on load
    window.addEventListener('load', function () {
        try {
            var prev = localStorage.getItem('_desktopDebugLog');
            if (prev) {
                addLog('PREVIOUS SESSION LOG FOUND - check localStorage._desktopDebugLog', 'warn');
                localStorage.removeItem('_desktopDebugLog');
            }
        } catch (e) { }
    });

})();
