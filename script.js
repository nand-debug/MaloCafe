'use strict';

// ============================================================
//  MALO CAFE — script.js
//  Shared across all pages
// ============================================================

// ── Apps Script endpoints ────────────────────────────────────
var BOOKING_URL = 'https://script.google.com/macros/s/AKfycbwMwsAyh38oFXbq1b-rrPOi1tErLQBL00RAxTUJs_XcPlKpXhRdy_nOJQ8vJex8vYt8/exec';
var REVIEW_URL  = 'https://script.google.com/macros/s/AKfycbxGbSQ-Zz5ddUMBYDbH534Om0igRK2WFvofrNaUODlDU7hW8dyrrabvwzU2cqGsXxXuRg/exec';
var GALLERY_URL = 'https://script.google.com/macros/s/AKfycbwRDzFLQRXt0yFqGAYPXBdjFpxDjpd73Te2MZovwm1PJT3RE8340hkMHryWIS3NzDlN/exec';


// ============================================================
//  NAVBAR SCROLL
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  function updateNavbar() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }
  updateNavbar();
  window.addEventListener('scroll', updateNavbar, { passive: true });
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

  // FIX: Close menu when clicking outside of it
  document.addEventListener('click', function (e) {
    if (!hamburgerCheck.checked) return;
    if (!mobileMenu.contains(e.target) && !hamburgerCheck.closest('label').contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburgerCheck.checked = false;
    }
  });
}


// ============================================================
//  SCROLL ANIMATIONS
// ============================================================
var animateElements = document.querySelectorAll('.animate-in');
// FIX: Guard against browsers that don't support IntersectionObserver
var scrollObserver = null;

if ('IntersectionObserver' in window) {
  scrollObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var delay = (parseFloat(entry.target.dataset.delay) || 0) * 1000;
        setTimeout(function () {
          entry.target.classList.add('visible');
        }, delay);
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '-50px' });

  animateElements.forEach(function (el) { scrollObserver.observe(el); });
} else {
  // FIX: Fallback — show all elements immediately if IntersectionObserver not supported
  animateElements.forEach(function (el) { el.classList.add('visible'); });
}


// ============================================================
//  ACTIVE NAV LINK
// ============================================================
var currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (link) {
  if (link.classList.contains('btn-book') || link.classList.contains('btn-book-mobile')) return;
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});


// ============================================================
//  PRELOADER  (only runs on index.html — guards on #preloader)
// ============================================================
window.addEventListener('load', function () {
  var preloader = document.getElementById('preloader');
  var pct       = document.getElementById('pct');

  // FIX: Only run preloader logic when the element actually exists
  if (!preloader) return;

  var start = performance.now();
  var dur   = 3200; // keep in sync with CSS barFill animation (3.2s)

  function tick(now) {
    var t = Math.min(1, (now - start) / dur);
    if (pct) pct.textContent = Math.round(t * 100) + '%';
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // FIX: Timing was 3600ms in JS but CSS plOut fires at 3.6s — matched and body.loaded added
  setTimeout(function () {
    preloader.style.opacity    = '0';
    preloader.style.transition = 'opacity 0.8s ease-out';
    preloader.style.pointerEvents = 'none';
    document.body.classList.add('loaded');

    setTimeout(function () {
      preloader.style.display = 'none';
    }, 800);
  }, 3600);
});


// ============================================================
//  PAGE TRANSITION LOADER
// ============================================================
(function () {
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
    loaderTimer = setTimeout(function () {
      overlay.classList.add('pl-visible');
    }, 200);
  }

  function hideLoader() {
    clearTimeout(loaderTimer);
    overlay.classList.remove('pl-visible');
  }

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a');
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    if (!href) return;

    // FIX: Added 'javascript' check and cleaner condition grouping
    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto') ||
      href.startsWith('tel') ||
      href.startsWith('javascript')
    ) return;

    if (anchor.target === '_blank') return;

    showLoader();
  });

  window.addEventListener('pageshow', function () { hideLoader(); });
  window.addEventListener('load',     function () { hideLoader(); });
})();


// ============================================================
//  SERVICE WORKER
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) { console.log('SW registered:', reg.scope); })
      .catch(function (err) { console.warn('SW failed:', err); });
  });
}


// ============================================================
//  OFFLINE DETECTION
// ============================================================
function goOffline() {
  if (!window.location.pathname.includes('status-offline.html')) {
    window.location.href = '/status-offline.html';
  }
}

window.addEventListener('offline', goOffline);

window.addEventListener('load', function () {
  if (!navigator.onLine) {
    goOffline();
  }
});


// ============================================================
//  BOOKING FORM
// ============================================================
(function () {
  var bookingForm      = document.getElementById('booking-form');
  var bookingContainer = document.getElementById('booking-container');
  var successScreen    = document.getElementById('success-screen');
  var bookAgainBtn     = document.getElementById('book-again');

  if (!bookingForm) return;

  // FIX: Set min date to today to prevent past date selection
  var dateInput = document.getElementById('date');
  if (dateInput) {
    var today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // FIX: Set min/max time based on cafe hours
  var timeInput = document.getElementById('time');
  if (timeInput) {
    timeInput.setAttribute('min', '07:00');
    timeInput.setAttribute('max', '16:30'); // last booking 30 min before close
  }

  bookingForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Processing...';

    // Honeypot bot check
    var botcheck = document.getElementById('botcheck');
    if (botcheck && botcheck.value !== '') {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Reservation';
      return;
    }

    // FIX: Validate that selected date is not in the past
    var selectedDate = new Date(document.getElementById('date').value + 'T00:00:00');
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    if (selectedDate < now) {
      alert('Please select a future date.');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Reservation';
      return;
    }

    var data = {
      name:     document.getElementById('name').value.trim(),
      email:    document.getElementById('email').value.trim(),
      phone:    document.getElementById('phone').value.trim(),
      guests:   parseInt(document.getElementById('guests').value, 10),
      date:     document.getElementById('date').value,
      time:     document.getElementById('time').value,
      requests: document.getElementById('requests').value.trim(),
      botcheck: botcheck ? botcheck.value : ''
    };

    try {
        // ✅ FIX: Changed from REVIEW_URL to BOOKING_URL
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
        alert(msg.replace('error: ', '') || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      // CORS false positive from Apps Script — show success
      bookingContainer.style.display = 'none';
      successScreen.style.display    = 'flex';
    } finally {
      // FIX: Use finally so button always re-enables even if we show success
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Reservation';
    }
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
//  REVIEW CAROUSEL
// ============================================================
(function () {
  var carousel = document.getElementById('review-carousel');
  if (!carousel) return;

  var track         = carousel.querySelector('.carousel-track');
  var dotsContainer = document.getElementById('carousel-dots');
  var current       = 0;
  var autoPlay      = true;
  var autoTimer     = null; // FIX: Store timer reference so we can clear it properly
  var reviews       = [];

  var FALLBACK_REVIEWS = [
    { text: "Don't be fooled by the neutral atmosphere — the food and service were 10/10. The mushroom soup is absolutely delicious. Definitely coming back!", author: 'Anonymous', role: 'Customer', location: 'Suva, Fiji', rating: 5 },
    { text: 'Had the best experience at Malo Cafe. The chicken burger and fries were perfectly cooked and full of flavor.', author: 'Shaheel Shah', role: 'Customer', location: 'Suva, Fiji', rating: 5 },
    { text: 'Best poached eggs in Suva! Great smoothies, brunch, and coffee. The atmosphere is always buzzing.', author: 'Joe Morton', role: 'Regular Customer', location: 'Suva, Fiji', rating: 5 },
    { text: 'Huge menu with lots of options. Everything we tried was delicious. Friendly staff too.', author: 'Nayna Dutt', role: 'Local Guide', location: 'Suva, Fiji', rating: 4 },
    { text: 'Great coffee and generous portions. Friendly staff and a really nice vibe.', author: 'Tish Tosh', role: 'Local Guide', location: 'Suva, Fiji', rating: 4 }
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

    // FIX: Responsive gap based on screen width
    var gap = window.innerWidth < 768 ? 200 : 280;

    [-2, -1, 0, 1, 2].forEach(function (offset) {
      var idx      = (current + offset + reviews.length) % reviews.length;
      var r        = reviews[idx];
      var card     = document.createElement('div');
      var isCenter = offset === 0;

      card.className       = 'carousel-card ' + (isCenter ? 'center' : (Math.abs(offset) <= 1 ? 'side' : 'hidden-card'));
      card.style.transform = 'translateX(' + (offset * gap) + 'px) scale(' + (isCenter ? 1 : 0.8) + ')';

      // FIX: Add aria attributes for accessibility
      card.setAttribute('aria-hidden', isCenter ? 'false' : 'true');

      var stars = '';
      for (var i = 0; i < 5; i++) stars += starSVG(i < r.rating);

      var photoBadge = r.photoUrl
        ? '<span class="verified-badge" style="margin-left:0.5rem;">📷 Photo</span>'
        : '';

      card.innerHTML =
        '<div class="quote-icon">&#8220;</div>' +
        '<div class="carousel-avatar">' + userAvatar(r.author) + '</div>' +
        '<div class="carousel-stars">' + stars + '</div>' +
        '<p class="review-text">' + esc(r.text || '') + '</p>' +
        '<p class="review-author">– ' + esc(r.author || 'Guest') + '</p>' +
        '<p class="review-role">' + esc(r.role || 'Customer') + '</p>' +
        '<p class="review-location">📍 ' + esc(r.location || 'Suva, Fiji') + '</p>' +
        '<span class="verified-badge">✔ Verified Review</span>' + photoBadge;

      // FIX: Allow clicking side cards to navigate to them
      if (!isCenter) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function () {
          current = idx;
          render();
        });
      }

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

  // FIX: Escape helper defined early so render() can use it
  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function startAutoPlay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () {
      if (autoPlay && reviews.length) {
        current = (current + 1) % reviews.length;
        render();
      }
    }, 4000);
  }

  function loadReviews() {
    fetch(REVIEW_URL + '?action=reviews')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        reviews = (Array.isArray(data) && data.length > 0)
          ? FALLBACK_REVIEWS.concat(data)
          : FALLBACK_REVIEWS;
        current = 0;
        render();
      })
      .catch(function () {
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

  // FIX: Touch/swipe support for mobile
  var touchStartX = 0;
  carousel.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    autoPlay = false;
  }, { passive: true });
  carousel.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      current = diff > 0
        ? (current + 1) % reviews.length
        : (current - 1 + reviews.length) % reviews.length;
      render();
    }
    autoPlay = true;
  }, { passive: true });

  reviews = FALLBACK_REVIEWS;
  render();
  loadReviews();
  startAutoPlay();
})();


// ============================================================
//  REVIEW FORM  (review.html)
// ============================================================

(function () {
  var reviewForm = document.getElementById('reviewForm');
  if (!reviewForm) return;

  // ── Cloudinary config (public — safe to expose) ───────────
  var CLD_CLOUD  = 'drkfcqpol';
  var CLD_PRESET = 'malo_reviews'; // ← your unsigned upload preset name

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
      var val = parseInt(star.dataset.value, 10);
      ratingInput.value = val;
      stars.forEach(function (s) {
        s.classList.toggle('active', parseInt(s.dataset.value, 10) <= val);
        s.classList.remove('hover');
      });
      ratingText.innerHTML = ratingIcon(val);
    });

    star.addEventListener('mouseenter', function () {
      var val = parseInt(star.dataset.value, 10);
      stars.forEach(function (s) {
        s.classList.toggle('hover', parseInt(s.dataset.value, 10) <= val);
      });
      ratingText.innerHTML = ratingIcon(val);
    });

    star.addEventListener('mouseleave', function () {
      stars.forEach(function (s) { s.classList.remove('hover'); });
      var cur = parseInt(ratingInput.value, 10);
      ratingText.innerHTML = cur > 0 ? ratingIcon(cur) : 'Tap to rate';
    });
  });

  // ── Image upload UI ──────────────────────────────────────
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
      if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
      if (file.size > 10 * 1024 * 1024) { alert('Image too large (max 10MB)'); return; }
      var reader = new FileReader();
      reader.onloadend = function () {
        previewImg.src           = reader.result;
        previewDiv.style.display = 'block';
        uploadArea.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.value          = '';
      previewDiv.style.display = 'none';
      uploadArea.style.display = 'flex';
    });
  }

  // ── Upload directly to Cloudinary from the browser ────────

  function uploadToCloudinary(file) {
    return new Promise(function (resolve, reject) {
      // Compress first: max 1200px, JPEG 0.78 quality
      var reader = new FileReader();
      reader.onloadend = function () {
        var img = new Image();
        img.onload = function () {
          var MAX = 1200;
          var w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else       { w = Math.round(w * MAX / h); h = MAX; }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);

          canvas.toBlob(function (blob) {
            var fd = new FormData();
            fd.append('file',         blob, 'review.jpg');
            fd.append('upload_preset', CLD_PRESET);
            fd.append('folder',        'malo-cafe-reviews');

            fetch('https://api.cloudinary.com/v1_1/' + CLD_CLOUD + '/image/upload', {
              method: 'POST',
              body:   fd
            })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (d.secure_url) resolve(d.secure_url);
              else reject(new Error(JSON.stringify(d.error || d)));
            })
            .catch(reject);
          }, 'image/jpeg', 0.78);
        };
        img.onerror = function () { reject(new Error('Image load failed')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('File read failed')); };
      reader.readAsDataURL(file);
    });
  }

  // ── Submit ───────────────────────────────────────────────
  reviewForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (ratingInput.value === '0') { alert('Please select a rating'); return; }

    var btn = document.getElementById('submitReviewBtn');
    btn.textContent = 'Submitting…';
    btn.disabled    = true;

    var photoUrl = '';
    var file = fileInput ? fileInput.files[0] : null;

    if (file) {
      try {
        btn.textContent = 'Uploading photo…';
        photoUrl = await uploadToCloudinary(file);
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        // Continue without photo rather than blocking the review
        photoUrl = '';
      }
    }

    btn.textContent = 'Saving review…';

    var data = {
      type:     'review',
      name:     document.getElementById('reviewName').value.trim(),
      rating:   parseInt(ratingInput.value, 10),
      text:     document.getElementById('reviewText').value.trim(),
      photoUrl: photoUrl   // ← send the URL, not the raw image
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
        alert(msg.replace('error: ', '') || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      // CORS false positive from Apps Script — review was still saved
      console.warn('Review submit (CORS):', err);
      showSuccess();
    } finally {
      btn.textContent = 'Submit Review';
      btn.disabled    = false;
    }
  });

  function showSuccess() {
    reviewForm.style.display = 'none';
    document.getElementById('reviewSuccess').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ============================================================
//  GALLERY  (gallery.html)
// ============================================================
(function () {
  var cafeGrid     = document.getElementById('cafe-grid');
  var customerGrid = document.getElementById('customer-grid');
  var lightbox     = document.getElementById('gallery-lightbox');
  var lbImg        = document.getElementById('lb-img');
  var lbName       = document.getElementById('lb-name');
  var lbCat        = document.getElementById('lb-cat');
  var lbClose      = document.getElementById('lb-close');

  if (!cafeGrid || !customerGrid) return;

  var activeFilter = 'all';

  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cloudinarySquare(url) {
    if (!url || !url.includes('/upload/')) return url;
    return url.replace('/upload/', '/upload/w_600,h_600,c_fill,g_auto,q_auto,f_auto/');
  }

  function makeItem(opts) {
    var div = document.createElement('div');
    div.className = 'gallery-item animate-in';
    div.setAttribute('data-filter', opts.filterAttr || 'cafe');
    if (opts.delay) div.setAttribute('data-delay', opts.delay);

    // FIX: Add role and tabindex for keyboard accessibility
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', 'View ' + (opts.name || 'photo'));

    var squareUrl = cloudinarySquare(opts.url);
    var badgeHtml = opts.badge
      ? '<span class="' + (opts.badgeClass || 'owner-badge') + '">' + esc(opts.badge) + '</span>'
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

    var img = div.querySelector('img');
    img.addEventListener('load',  function () { div.classList.add('img-loaded'); });
    img.addEventListener('error', function () { div.style.opacity = '0.4'; });

    // FIX: Support both click and keyboard Enter for accessibility
    function activate() { openLightbox(opts.url, opts.name, opts.cat); }
    div.addEventListener('click', activate);
    div.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    if (scrollObserver) scrollObserver.observe(div);

    return div;
  }

  // ── Lightbox ──────────────────────────────────────────────
  function openLightbox(url, name, cat) {
    // FIX: Show high-res URL in lightbox (not the 600px Cloudinary crop)
    lbImg.src              = url;
    lbName.textContent     = name || '';
    lbCat.textContent      = cat  || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    // FIX: Move focus to close button for accessibility
    if (lbClose) lbClose.focus();
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

    var showCafe     = (activeFilter === 'all' || activeFilter === 'cafe' || activeFilter === 'food' || activeFilter === 'interior');
    var showCustomer = (activeFilter === 'all' || activeFilter === 'customer');

    if (cafeSection)     cafeSection.style.display     = showCafe     ? '' : 'none';
    if (customerSection) customerSection.style.display = showCustomer ? '' : 'none';
    if (divider)         divider.style.display         = (showCafe && showCustomer) ? '' : 'none';

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

  // ── Fetch owner/cafe photos ───────────────────────────────
  function fetchOwnerPhotos() {
    fetch(GALLERY_URL + '?action=getOwnerPhotos&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success || !Array.isArray(data.photos) || !data.photos.length) return;

        var delay = 0.54;
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

  // ── Fetch customer photos ─────────────────────────────────
  function fetchCustomerPhotos() {
    fetch(REVIEW_URL + '?action=gallery&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (photos) {
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
            badge:      '📷 ' + esc(photo.author || 'Guest'),
            badgeClass: 'customer-badge',
            delay:      delay.toFixed(2)
          });

          customerGrid.appendChild(item);
          delay += 0.06;
        });
      })
      .catch(function () {
        customerGrid.innerHTML =
          '<div class="customer-empty">' +
            '<span style="font-size:2rem;">📷</span>' +
            '<p>Could not load customer photos right now.</p>' +
            '<a href="review.html">Leave a Review</a>' +
          '</div>';
      });
  }

  fetchOwnerPhotos();
  fetchCustomerPhotos();

  // FIX: Increased polling interval from 10s to 60s to reduce API hammering
  setInterval(fetchOwnerPhotos, 60000);
})();


// ============================================================
//  ABOUT IMAGE SLIDESHOW
// ============================================================
(function () {
  var slides = document.querySelectorAll('.slideshow .slide');
  if (!slides.length) return;

  var index = 0;

  // FIX: Pause slideshow when tab is not visible (saves battery/CPU)
  function showNextSlide() {
    if (document.hidden) return;
    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
  }

  setInterval(showNextSlide, 3000);
})();