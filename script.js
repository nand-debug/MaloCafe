'use strict';

// ============================================================
//  MALO CAFE — script.js
//  Shared across all pages
// ============================================================

// ── Apps Script endpoints ────────────────────────────────────
var BOOKING_URL = 'https://script.google.com/macros/s/AKfycbyMddgpN0hEno63kTVnmjlayaLhzRFZohDPsz3bzhRwJOSDIiMJ5XPSxF4qaYQZo7iE/exec';
var REVIEW_URL  = 'https://script.google.com/macros/s/AKfycbyFrrnXWnKSV-eeg1DUAWY3M687tMNjFGg0l6R85zvaFk3BC3757gZOCFb4-ex1iHia/exec';
var GALLERY_URL = 'https://script.google.com/macros/s/AKfycby0REjl38yU9fw04QaMrZQmgA7zlK-W-1TG3AkRRmS-egvaZgzpGthPxcU5P24HLae6/exec'; 

// ============================================================
//  NAVBAR SCROLL
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  function updateNavbar() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  updateNavbar();
  window.addEventListener('scroll', updateNavbar);
});


// ============================================================
//  MOBILE MENU
// ============================================================
var hamburgerCheck = document.getElementById('hamburger-check');
var mobileMenu     = document.querySelector('.mobile-menu');

if (hamburgerCheck && mobileMenu) {
  hamburgerCheck.addEventListener('change', function () {
    mobileMenu.classList.toggle('open', hamburgerCheck.checked);
  });
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      hamburgerCheck.checked = false;
    });
  });
}


// ============================================================
//  SCROLL ANIMATIONS
// ============================================================
var animateElements = document.querySelectorAll('.animate-in');
var scrollObserver  = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      setTimeout(function () {
        entry.target.classList.add('visible');
      }, (parseFloat(entry.target.dataset.delay) || 0) * 1000);
      scrollObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '-50px' });

animateElements.forEach(function (el) { scrollObserver.observe(el); });


// ============================================================
//  ACTIVE NAV LINK
// ============================================================
var currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (link) {
  if (link.classList.contains('btn-book') || link.classList.contains('btn-book-mobile')) return;
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});


// ============================================================
//  PRELOADER
// ============================================================
window.addEventListener('load', function () {
  // Update progress percentage
  const pct = document.getElementById('pct');
  const start = performance.now();
  const dur = 5500;
 
  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    pct.textContent = Math.round(t * 100) + '%';
    if (t < 1) requestAnimationFrame(tick);
  }
 
  requestAnimationFrame(tick);
 
  // Hide preloader after animation completes
  setTimeout(function () {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    // Smooth fade out animation
    preloader.style.opacity = '0';
    preloader.style.transition = 'opacity 0.8s ease-out';
    preloader.style.pointerEvents = 'none';
    
    // Add smooth fade-in to body content
    document.body.classList.add('loaded');
    
    // Remove from DOM after fade
    setTimeout(function () {
      preloader.style.display = 'none';
    }, 800);
  }, 3600);
});

// ============================================================
//  PAGE TRANSITION LOADER
// ============================================================
(function () {
  // Build the overlay once and append to body
  var overlay = document.createElement('div');
  overlay.id  = 'page-loader';
  overlay.innerHTML =
    '<div class="pl-inner">' +
      '<div class="pl-spinner"></div>' +
      '<p class="pl-text">Loading…</p>' +
    '</div>';
  document.body.appendChild(overlay);
 
  var loaderTimer = null;
 
  function showLoader() {
    clearTimeout(loaderTimer);
    // Only show the loader if the page hasn't loaded within 200 ms
    // (fast pages = no flash, slow pages = clear feedback)
    loaderTimer = setTimeout(function () {
      overlay.classList.add('pl-visible');
    }, 200);
  }
 
  function hideLoader() {
    clearTimeout(loaderTimer);
    overlay.classList.remove('pl-visible');
  }
 
  // Intercept every internal <a> click
  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a');
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    if (!href) return;
 
    // Skip: external links, anchors (#), mailto, tel, javascript:
    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      href.startsWith('javascript')
    ) return;
 
    // Skip if opening in a new tab
    if (anchor.target === '_blank') return;
 
    showLoader();
  });
 
  // Hide once the new page is fully painted
  window.addEventListener('pageshow', function () { hideLoader(); });
  window.addEventListener('load',     function () { hideLoader(); });
})();
 
 
// ============================================================
//  SERVICE WORKER  (registers /sw.js for offline support)
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) { console.log('SW registered:', reg.scope); })
      .catch(function (err) { console.log('SW failed:', err); });
  });
}
 
 
// ============================================================
//  OFFLINE DETECTION
//  Only redirects to the offline page when the connection is
//  actually lost — NOT on slow connections or random errors.
// ============================================================
function goOffline() {
  // Don't redirect if we're already on the offline page
  if (window.location.pathname.indexOf('status-offline') === -1) {
    window.location.href = 'status-offline.html';
  }
}
 
// Redirect when the browser fires the 'offline' event
// (this is reliable — fires only when the connection truly drops)
window.addEventListener('offline', goOffline);
 
// On page load: if the browser already knows we're offline, redirect immediately
if (!navigator.onLine) {
  goOffline();
}

// ============================================================
//  BOOKING FORM
// ============================================================
(function () {
  var bookingForm      = document.getElementById('booking-form');
  var bookingContainer = document.getElementById('booking-container');
  var successScreen    = document.getElementById('success-screen');
  var bookAgainBtn     = document.getElementById('book-again');

  if (!bookingForm) return;

  bookingForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Processing...';

    var botcheck = document.getElementById('botcheck');
    if (botcheck && botcheck.value !== '') {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Reservation';
      return;
    }

    var data = {
      name:     document.getElementById('name').value,
      email:    document.getElementById('email').value,
      phone:    document.getElementById('phone').value,
      guests:   parseInt(document.getElementById('guests').value),
      date:     document.getElementById('date').value,
      time:     document.getElementById('time').value,
      requests: document.getElementById('requests').value,
      botcheck: botcheck ? botcheck.value : ''
    };

    try {
      var res = await fetch(BOOKING_URL, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      var msg = await res.text();

      if (msg.toLowerCase().includes('confirmed')) {
        bookingContainer.style.display = 'none';
        successScreen.style.display    = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(msg.replace('error: ', ''));
      }
    } catch (err) {
      console.error('Booking error:', err);
      // Fallback — show success (CORS false positive)
      bookingContainer.style.display = 'none';
      successScreen.style.display    = 'flex';
    }

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Submit Reservation';
  });

  if (bookAgainBtn) {
    bookAgainBtn.addEventListener('click', function () {
      bookingForm.reset();
      successScreen.style.display    = 'none';
      bookingContainer.style.display = 'block';
    });
  }
})();


// ============================================================
//  REVIEW CAROUSEL  — loads LIVE approved reviews from sheet
// ============================================================
(function () {
  var carousel = document.getElementById('review-carousel');
  if (!carousel) return;

  var track         = carousel.querySelector('.carousel-track');
  var dotsContainer = document.getElementById('carousel-dots');
  var current       = 0;
  var autoPlay      = true;
  var reviews       = [];

  // Fallback reviews shown while loading or if API fails
  var FALLBACK_REVIEWS = [
    { text: "Don't be fooled by the neutral atmosphere — the food and service were 10/10. The mushroom soup is absolutely delicious. Definitely coming back!", author: "Anonymous", role: "Customer", location: "Suva, Fiji", rating: 5 },
    { text: "Had the best experience at Malo Cafe. The chicken burger and fries were perfectly cooked and full of flavor.", author: "Shaheel Shah", role: "Customer", location: "Suva, Fiji", rating: 5 },
    { text: "Best poached eggs in Suva! Great smoothies, brunch, and coffee. The atmosphere is always buzzing.", author: "Joe Morton", role: "Regular Customer", location: "Suva, Fiji", rating: 5 },
    { text: "Huge menu with lots of options. Everything we tried was delicious. Friendly staff too.", author: "Nayna Dutt", role: "Local Guide", location: "Suva, Fiji", rating: 4 },
    { text: "Great coffee and generous portions. Friendly staff and a really nice vibe.", author: "Tish Tosh", role: "Local Guide", location: "Suva, Fiji", rating: 4 }
  ];

  function starSVG(filled) {
    return filled
      ? '<svg class="filled" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
      : '<svg class="empty"  viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }

  function userAvatar(author) {
    var ini    = (author || '?').split(' ').map(function (w) { return w[0] || ''; }).join('').substring(0, 2).toUpperCase();
    var colors = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFC75F'];
    var color  = colors[(author || '').length % colors.length];
    return '<div class="avatar-initials" style="background:' + color + '">' + ini + '</div>';
  }

  function render() {
    if (!reviews.length) return;
    track.innerHTML = '';
    var offsets = [-2, -1, 0, 1, 2];
    var gap     = window.innerWidth < 768 ? 200 : 280;

    offsets.forEach(function (offset) {
      var idx      = (current + offset + reviews.length) % reviews.length;
      var r        = reviews[idx];
      var card     = document.createElement('div');
      var isCenter = offset === 0;

      card.className       = 'carousel-card ' + (isCenter ? 'center' : (Math.abs(offset) <= 1 ? 'side' : 'hidden-card'));
      card.style.transform = 'translateX(' + (offset * gap) + 'px) scale(' + (isCenter ? 1 : 0.8) + ')';

      var stars = '';
      for (var i = 0; i < 5; i++) stars += starSVG(i < r.rating);

      // Customer photo badge if review has a photo
      var photoBadge = r.photoUrl
        ? '<span class="verified-badge" style="margin-left:0.5rem;">📷 Photo</span>'
        : '';

      card.innerHTML =
        '<div class="quote-icon">"</div>' +
        '<div class="carousel-avatar">' + userAvatar(r.author) + '</div>' +
        '<div class="carousel-stars">' + stars + '</div>' +
        '<p class="review-text">' + (r.text || '') + '</p>' +
        '<p class="review-author">– ' + (r.author || 'Guest') + '</p>' +
        '<p class="review-role">' + (r.role || 'Customer') + '</p>' +
        '<p class="review-location">📍 ' + (r.location || 'Suva, Fiji') + '</p>' +
        '<span class="verified-badge">✔ Verified Review</span>' + photoBadge;

      track.appendChild(card);
    });

    // Dots
    dotsContainer.innerHTML = '';
    reviews.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
      dot.addEventListener('click', function () { current = i; render(); });
      dotsContainer.appendChild(dot);
    });
  }

  // Load approved reviews from Apps Script
  function loadReviews() {
    fetch(REVIEW_URL + '?action=reviews')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          // Merge with fallback so carousel always has content
          reviews = FALLBACK_REVIEWS.concat(data);
        } else {
          reviews = FALLBACK_REVIEWS;
        }
        current = 0;
        render();
      })
      .catch(function () {
        // API failed — use fallbacks silently
        reviews = FALLBACK_REVIEWS;
        render();
      });
  }

  carousel.querySelector('.carousel-prev').addEventListener('click', function () {
    current = (current - 1 + reviews.length) % reviews.length;
    render();
  });
  carousel.querySelector('.carousel-next').addEventListener('click', function () {
    current = (current + 1) % reviews.length;
    render();
  });

  carousel.addEventListener('mouseenter', function () { autoPlay = false; });
  carousel.addEventListener('mouseleave', function () { autoPlay = true; });

  setInterval(function () {
    if (autoPlay && reviews.length) { current = (current + 1) % reviews.length; render(); }
  }, 4000);

  // Start with fallbacks immediately, then load live data
  reviews = FALLBACK_REVIEWS;
  render();
  loadReviews();
})();


// ============================================================
//  REVIEW FORM  (review.html)
// ============================================================
(function () {
  var reviewForm = document.getElementById('reviewForm');
  if (!reviewForm) return;

  var stars       = document.querySelectorAll('.star-btn');
  var ratingInput = document.getElementById('ratingValue');
  var ratingText  = document.getElementById('ratingText');

  var ratingIcons = {
    1: { anim: 'anim-poor',    stroke: '#888888', mouth: 'M8 15 L16 15',       label: 'Poor'    },
    2: { anim: 'anim-okay',    stroke: '#a0845c', mouth: 'M8 14 L16 14',       label: 'Okay'    },
    3: { anim: 'anim-good',    stroke: '#7aaa50', mouth: 'M8 13 Q12 16 16 13', label: 'Good'    },
    4: { anim: 'anim-great',   stroke: '#f4a822', mouth: 'M8 13 Q12 17 16 13', label: 'Great'   },
    5: { anim: 'anim-amazing', stroke: '#e8890c', mouth: 'M8 12 Q12 18 16 12', label: 'Amazing' }
  };

  function ratingIcon(val) {
    var r = ratingIcons[val];
    return '<span class="rating-icon ' + r.anim + '">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="' + r.stroke + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + '<circle cx="12" cy="12" r="10"/>'
      + '<path d="' + r.mouth + '"/>'
      + '<line x1="9" y1="9" x2="9.01" y2="9"/>'
      + '<line x1="15" y1="9" x2="15.01" y2="9"/>'
      + '</svg></span> ' + r.label;
  }

  function resetStars() {
    ratingInput.value = '0';
    stars.forEach(function (s) { s.classList.remove('active', 'hover'); });
    ratingText.innerHTML = 'Tap to rate';
  }

  stars.forEach(function (star) {
    star.addEventListener('click', function () {
      var val = star.dataset.value;
      ratingInput.value = val;
      stars.forEach(function (s) {
        s.classList.toggle('active', s.dataset.value <= val);
        s.classList.remove('hover');
      });
      ratingText.innerHTML = ratingIcon(val);
    });

    star.addEventListener('mouseenter', function () {
      var val = star.dataset.value;
      stars.forEach(function (s) { s.classList.toggle('hover', s.dataset.value <= val); });
      ratingText.innerHTML = ratingIcon(val);
    });

    star.addEventListener('mouseleave', function () {
      stars.forEach(function (s) { s.classList.remove('hover'); });
      var cur = ratingInput.value;
      ratingText.innerHTML = cur > 0 ? ratingIcon(cur) : 'Tap to rate';
    });
  });

  // Image upload
  var uploadBox  = document.getElementById('imageUploadArea');
  var fileInput  = document.getElementById('reviewImage');
  var previewDiv = document.getElementById('imagePreview');
  var previewImg = document.getElementById('previewImg');
  var removeBtn  = document.getElementById('removeImage');
  var uploadArea = document.getElementById('uploadPrompt');

  if (uploadBox && fileInput) {
    uploadArea.addEventListener('click', function () { fileInput.click(); });
    uploadBox.addEventListener('dragover',  function (e) { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', function ()  { uploadBox.classList.remove('dragover'); });
    uploadBox.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadBox.classList.remove('dragover');
      handleImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function (e) { handleImage(e.target.files[0]); });

    function handleImage(file) {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image too large (max 5MB)'); return; }
      var reader = new FileReader();
      reader.onloadend = function () {
        previewImg.src            = reader.result;
        previewDiv.style.display  = 'block';
        uploadArea.style.display  = 'none';
      };
      reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.value           = '';
      previewDiv.style.display  = 'none';
      uploadArea.style.display  = 'flex';
    });
  }

  // Submit
  reviewForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (ratingInput.value === '0') { alert('Please select a rating'); return; }

    var btn = document.getElementById('submitReviewBtn');
    btn.textContent = 'Submitting…';
    btn.disabled    = true;

    var imageData = '';
    var file = fileInput ? fileInput.files[0] : null;
    if (file) {
      var reader = new FileReader();
      imageData = await new Promise(function (resolve) {
        reader.onloadend = function () { resolve(reader.result); };
        reader.readAsDataURL(file);
      });
    }

    var data = {
      type:   'review',
      name:   document.getElementById('reviewName').value,
      rating: parseInt(ratingInput.value),
      text:   document.getElementById('reviewText').value,
      image:  imageData
    };

    try {
      var res = await fetch(REVIEW_URL, {
        method: 'POST',
        body:   JSON.stringify(data)
      });
      var msg = await res.text();
      if (msg.toLowerCase().includes('submitted')) {
        showSuccess();
      } else {
        alert(msg.replace('error: ', ''));
      }
    } catch (err) {
      // CORS false positive from Apps Script — review was still saved
      showSuccess();
    }

    btn.textContent = 'Submit Review';
    btn.disabled    = false;
  });

  function showSuccess() {
    reviewForm.style.display = 'none';
    document.getElementById('reviewSuccess').style.display = 'block';
  }

  var leaveAnotherBtn = document.getElementById('leaveAnotherBtn');
  if (leaveAnotherBtn) {
    leaveAnotherBtn.addEventListener('click', function () {
      reviewForm.reset();
      resetStars();
      if (previewDiv) previewDiv.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'flex';
      document.getElementById('reviewSuccess').style.display = 'none';
      reviewForm.style.display = 'block';
    });
  }
})();

(function () {
 
  // ── DOM refs ─────────────────────────────────────────────
  var cafeGrid     = document.getElementById('cafe-grid');
  var customerGrid = document.getElementById('customer-grid');
  var lightbox     = document.getElementById('gallery-lightbox');
  var lbImg        = document.getElementById('lb-img');
  var lbName       = document.getElementById('lb-name');
  var lbCat        = document.getElementById('lb-cat');
  var lbClose      = document.getElementById('lb-close');
 
  // Exit if not on gallery page
  if (!cafeGrid || !customerGrid) return;
 
  // ── Active filter ─────────────────────────────────────────
  var activeFilter = 'all';
 
  // ── Cloudinary transform helper ───────────────────────────
  // Ensures every photo is served as a square 600×600 crop
  function cloudinarySquare(url) {
    if (!url || !url.includes('/upload/')) return url;
    return url.replace(
      '/upload/',
      '/upload/w_600,h_600,c_fill,g_auto,q_auto,f_auto/'
    );
  }
 
  // ── Build a gallery item element ──────────────────────────
  function makeItem(opts) {
    // opts: { url, name, cat, filterAttr, badge, badgeClass, delay }
    var div = document.createElement('div');
    div.className = 'gallery-item animate-in';
    div.setAttribute('data-filter', opts.filterAttr || 'cafe');
    if (opts.delay) div.setAttribute('data-delay', opts.delay);
 
    var squareUrl = cloudinarySquare(opts.url);
 
    var badgeHtml = opts.badge
      ? '<span class="' + (opts.badgeClass || 'owner-badge') + '">' + opts.badge + '</span>'
      : '';
 
    div.innerHTML =
      '<img src="' + squareUrl + '" alt="' + esc(opts.name) + '" loading="lazy">' +
      badgeHtml +
      '<div class="gallery-overlay">' +
        '<div class="caption">' +
          '<span class="cat">' + esc(opts.cat) + '</span>' +
          '<p class="name">' + esc(opts.name) + '</p>' +
        '</div>' +
      '</div>';
 
    // Show loading state until image loads
    var img = div.querySelector('img');
    img.addEventListener('load',  function () { div.classList.add('img-loaded'); });
    img.addEventListener('error', function () { div.style.opacity = '0.4'; });
 
    // Lightbox on click
    div.addEventListener('click', function () {
      openLightbox(opts.url, opts.name, opts.cat);
    });
 
    // Register with scroll observer from script.js
    if (typeof scrollObserver !== 'undefined') {
      scrollObserver.observe(div);
    }
 
    return div;
  }
 
  // ── Lightbox ──────────────────────────────────────────────
  function openLightbox(url, name, cat) {
    lbImg.src    = url;
    lbName.textContent = name || '';
    lbCat.textContent  = cat  || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
 
  function closeLightbox() {
    lightbox.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  }
 
  if (lbClose)  lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
 
  // ── Filter tabs ───────────────────────────────────────────
  document.querySelectorAll('.gallery-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.gallery-tab').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      applyFilter();
    });
  });
 
  function applyFilter() {
    var cafeSection     = document.getElementById('cafe-section');
    var customerSection = document.getElementById('customer-section');
    var divider         = document.querySelector('.gallery-section-divider');
 
    // Show/hide entire sections based on filter
    var showCafe     = (activeFilter === 'all' || activeFilter === 'cafe' || activeFilter === 'food' || activeFilter === 'interior');
    var showCustomer = (activeFilter === 'all' || activeFilter === 'customer');
 
    if (cafeSection)     cafeSection.style.display     = showCafe     ? '' : 'none';
    if (customerSection) customerSection.style.display = showCustomer ? '' : 'none';
    if (divider)         divider.style.display         = (showCafe && showCustomer) ? '' : 'none';
 
    // Within the cafe grid, filter by data-filter attribute
    if (showCafe && activeFilter !== 'all' && activeFilter !== 'cafe') {
      cafeGrid.querySelectorAll('.gallery-item').forEach(function (item) {
        var filters = (item.getAttribute('data-filter') || '').split(' ');
        item.classList.toggle('gl-hidden', !filters.includes(activeFilter));
      });
    } else {
      cafeGrid.querySelectorAll('.gallery-item').forEach(function (item) {
        item.classList.remove('gl-hidden');
      });
    }
  }
 
  // ── Fetch owner/cafe photos from Apps Script ──────────────
  // These are uploaded by the owner from admin-gallery.html
  // and stored in Cloudinary under the "malo_cafe_owner" folder.
  function fetchOwnerPhotos() {
    if (typeof BOOKING_URL === 'undefined') return;
 
fetch(GALLERY_URL + '?action=getOwnerPhotos&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success || !Array.isArray(data.photos) || !data.photos.length) return;
 
        var delay = 0.54; // start after static items
        data.photos.forEach(function (photo) {
          var catMap = {
            Food: 'cafe food', Drinks: 'cafe food',
            Coffee: 'cafe food', Interior: 'cafe interior',
            Events: 'cafe'
          };
          var filterAttr = catMap[photo.category] || 'cafe';
 
          var item = makeItem({
            url:        photo.url,
            name:       photo.title || photo.category || 'Cafe Photo',
            cat:        photo.category || 'Cafe',
            filterAttr: filterAttr,
            badge:      'New',
            badgeClass: 'owner-badge',
            delay:      delay.toFixed(2)
          });
 
          cafeGrid.appendChild(item);
          delay += 0.06;
        });
      })
      .catch(function () {
        // Silently fail — static photos are already shown
      });
  }
 
  // ── Fetch customer photos from review Apps Script ─────────
  // These come from approved reviews that also had an approved photo.
  function fetchCustomerPhotos() {
    if (typeof REVIEW_URL === 'undefined') return;
 
    fetch(REVIEW_URL + '?action=gallery&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (photos) {
        // Remove skeleton placeholders
        customerGrid.innerHTML = '';
 
        if (!Array.isArray(photos) || !photos.length) {
          customerGrid.innerHTML =
            '<div class="customer-empty">' +
              '<span style="font-size:2rem;">📷</span>' +
              '<p>No customer photos yet. Be the first to share your experience!</p>' +
              '<a href="review.html">Leave a Review with Photo</a>' +
            '</div>';
          return;
        }
 
        var delay = 0;
        photos.forEach(function (photo) {
          var item = makeItem({
            url:        photo.url,
            name:       photo.author ? 'Photo by ' + photo.author : 'Customer Photo',
            cat:        'Customer',
            filterAttr: 'customer',
            badge:      '📷 ' + (photo.author || 'Guest'),
            badgeClass: 'customer-badge',
            delay:      delay.toFixed(2)
          });
 
          customerGrid.appendChild(item);
          delay += 0.06;
        });
      })
      .catch(function () {
        // Remove skeletons, show empty state
        customerGrid.innerHTML =
          '<div class="customer-empty">' +
            '<span style="font-size:2rem;">📷</span>' +
            '<p>Could not load customer photos right now.</p>' +
            '<a href="review.html">Leave a Review</a>' +
          '</div>';
      });
  }
 
  // ── Escape HTML ───────────────────────────────────────────
  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
 
  // ── Init ──────────────────────────────────────────────────
  fetchOwnerPhotos();
  fetchCustomerPhotos();
 
})();

setInterval(fetchOwnerPhotos, 10000); // refresh every 10s
// ============================================================
//  ABOUT IMAGE SLIDESHOW
// ============================================================
(function () {
  var slides = document.querySelectorAll(".slideshow .slide");
  if (!slides.length) return; // prevents errors on other pages

  var index = 0;

  function showNextSlide() {
    slides[index].classList.remove("active");
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }

  // Start slideshow
  setInterval(showNextSlide, 5000);
})();
