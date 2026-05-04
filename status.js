'use strict';

// ============================================================
//  MALO CAFE — status.js
//  Used by: status-loading.html, status-offline.html, 404.html
//  Each section is null-guarded so it only runs when the
//  relevant elements actually exist on the page.
// ============================================================

window.addEventListener('load', function () {

  // ── 1. Scroll to top on every status page ──────────────────
  // Prevents the browser restoring a previous scroll position
  // when navigating to an error or offline page.
  window.scrollTo(0, 0);


  // ── 2. Loading screen reveal (status-loading.html only) ────
  // Guards against null so this is safe on 404 and offline pages
  // which do NOT have #loading-screen or #main-content.
  var loadingScreen = document.getElementById('loading-screen');
  var mainContent   = document.getElementById('main-content');

  if (loadingScreen && mainContent) {
    var loadTimer = setTimeout(function () {
      // Respect reduced-motion: skip transition, reveal instantly
      var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        loadingScreen.style.display = 'none';
        mainContent.style.display   = 'block';
      } else {
        loadingScreen.classList.add('hidden');

        // Wait for the CSS fade-out transition to finish
        var hideTimer = setTimeout(function () {
          loadingScreen.style.display = 'none';
          mainContent.style.display   = 'block';
        }, 500);

        // Clean up if user navigates away before transition ends
        window.addEventListener('pagehide', function () {
          clearTimeout(hideTimer);
        }, { once: true });
      }
    }, 5000);

    // Clean up the main timer too if user navigates away early
    window.addEventListener('pagehide', function () {
      clearTimeout(loadTimer);
    }, { once: true });
  }

});


// ── 3. Online detection — redirect home when connection returns
// FIX: Uses absolute root path so it works regardless of the
// directory the status page is served from.
window.addEventListener('online', function () {
  window.location.href = '/index.html';
});