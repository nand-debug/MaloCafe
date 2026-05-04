'use strict';

// ============================================================
//  MALO CAFE — script.js
//  Shared across all pages. Each section is guarded so it
//  only runs when the relevant DOM elements exist.
// ============================================================

// ── Google Apps Script endpoints ─────────────────────────────
var BOOKING_URL = 'https://script.google.com/macros/s/AKfycbwMwsAyh38oFXbq1b-rrPOi1tErLQBL00RAxTUJs_XcPlKpXhRdy_nOJQ8vJex8vYt8/exec';
var REVIEW_URL  = 'https://script.google.com/macros/s/AKfycbxGbSQ-Zz5ddUMBYDbH534Om0igRK2WFvofrNaUODlDU7hW8dyrrabvwzU2cqGsXxXuRg/exec';
var GALLERY_URL = 'https://script.google.com/macros/s/AKfycbwRDzFLQRXt0yFqGAYPXBdjFpxDjpd73Te2MZovwm1PJT3RE8340hkMHryWIS3NzDlN/exec';

// ── Shared HTML-escape helper (used by multiple sections) ────
function escHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


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
document.addEventListener('DOMContentLoaded', function () {
  var hamburgerCheck = document.getElementById('hamburger-check');
  var mobileMenu     = document.querySelector('.mobile-menu');

  if (!hamburgerCheck || !mobileMenu) return;

  hamburgerCheck.addEventListener('change', function () {
    mobileMenu.classList.toggle('open', hamburgerCheck.checked);
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      hamburgerCheck.checked = false;
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', function (e) {
    if (!hamburgerCheck.checked) return;
    var label = hamburgerCheck.closest('label');
    var clickedInsideMenu  = mobileMenu.contains(e.target);
    var clickedInsideLabel = label ? label.contains(e.target) : false;
    if (!clickedInsideMenu && !clickedInsideLabel) {
      mobileMenu.classList.remove('open');
      hamburgerCheck.checked = false;
    }
  });
});


// ============================================================
//  SCROLL ANIMATIONS
// ============================================================
// scrollObserver is module-level so gallery.js items can use it
var scrollObserver = null;

(function () {
  var animateElements = document.querySelectorAll('.animate-in');
  if (!animateElements.length) return;

  if ('IntersectionObserver' in window) {
    scrollObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var delay = (parseFloat(entry.target.dataset.delay) || 0) * 1000;
        setTimeout(function () {
          entry.target.classList.add('visible');
        }, delay);
        scrollObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '-50px' });

    animateElements.forEach(function (el) { scrollObserver.observe(el); });
  } else {
    // Fallback for browsers without IntersectionObserver
    animateElements.forEach(function (el) { el.classList.add('visible'); });
  }
})();


// ============================================================
//  ACTIVE NAV LINK
// ============================================================
(function () {
  function getPageName(path) {
    return path
      .toLowerCase()
      .replace(/\/$/, "")
      .split("/")
      .pop();
  }

  const currentPage = getPageName(window.location.pathname) || "index.html";

  document.querySelectorAll(".nav-links a").forEach(link => {
    if (link.classList.contains("btn-book")) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const linkPage = getPageName(href);

    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
})();

// ============================================================
//  PRELOADER  (index.html only — guards on #preloader)
// ============================================================
window.addEventListener('load', function () {
  var preloader = document.getElementById('preloader');
  var pct       = document.getElementById('pct');

  if (!preloader) return;

  var start = performance.now();
  var dur   = 3200; // keep in sync with CSS barFill animation (3.2 s)

  function tick(now) {
    var t = Math.min(1, (now - start) / dur);
    if (pct) pct.textContent = Math.round(t * 100) + '%';
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Fade out at 3.6 s (matches CSS plOut animation-delay)
  setTimeout(function () {
    preloader.style.transition   = 'opacity 0.8s ease-out';
    preloader.style.opacity      = '0';
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
document.addEventListener('DOMContentLoaded', function () {
  var overlay = document.createElement('div');
  overlay.id  = 'page-loader';
  overlay.innerHTML =
    '<div class="pl-inner">' +
      '<div class="pl-spinner"></div>' +
      '<p class="pl-text">Loading\u2026</p>' +
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
    if (
      href.startsWith('http')       ||
      href.startsWith('//')         ||
      href.startsWith('#')          ||
      href.startsWith('mailto')     ||
      href.startsWith('tel')        ||
      href.startsWith('javascript')
    ) return;
    if (anchor.target === '_blank') return;
    showLoader();
  });

  window.addEventListener('pageshow', hideLoader);
  window.addEventListener('load',     hideLoader);
});


// ============================================================
//  SERVICE WORKER REGISTRATION
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .catch(function (err) { console.warn('[SW] Registration failed:', err); });
  });
}


// ============================================================
//  OFFLINE DETECTION
// ============================================================
(function () {
  function goOffline() {
    if (!window.location.pathname.includes('status-offline.html')) {
      window.location.href = '/status-offline.html';
    }
  }

  window.addEventListener('offline', goOffline);

  // Check on initial load in case the page opened while already offline
  window.addEventListener('load', function () {
    if (!navigator.onLine) goOffline();
  });
})();


// ============================================================
//  INLINE FORM ERROR HELPER
//  Replaces alert() with accessible inline messages
// ============================================================
function showFieldError(fieldId, message) {
  var field = document.getElementById(fieldId);
  if (!field) return;
  var existing = field.parentNode.querySelector('.field-error');
  if (existing) existing.remove();
  var err = document.createElement('span');
  err.className   = 'field-error';
  err.textContent = message;
  err.style.cssText = 'display:block;color:#c0392b;font-size:0.8rem;margin-top:4px;';
  field.parentNode.appendChild(err);
  field.setAttribute('aria-invalid', 'true');
}

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(function (el) { el.remove(); });
  form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
}

function showFormBanner(form, message, isError) {
  var existing = form.querySelector('.form-banner');
  if (existing) existing.remove();
  var banner = document.createElement('div');
  banner.className   = 'form-banner';
  banner.textContent = message;
  banner.style.cssText =
    'padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:0.9rem;' +
    (isError
      ? 'background:#fdecea;color:#c0392b;border:1px solid #f5c6c2;'
      : 'background:#eafaf1;color:#1a7a45;border:1px solid #a9dfbf;');
  form.insertBefore(banner, form.firstChild);
}


// ============================================================
//  BOOKING FORM  (booking.html)
// ============================================================
(function () {
  var bookingForm      = document.getElementById('booking-form');
  var bookingContainer = document.getElementById('booking-container');
  var successScreen    = document.getElementById('success-screen');
  var bookAgainBtn     = document.getElementById('book-again');

  if (!bookingForm) return;

  // Set min date to today
  var dateInput = document.getElementById('date');
  if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

  // Set time bounds (cafe hours: 07:00–17:00, last booking 16:30)
  var timeInput = document.getElementById('time');
  if (timeInput) {
    timeInput.setAttribute('min', '07:00');
    timeInput.setAttribute('max', '16:30');
  }

  // Adjust max time on weekends (cafe closes at 15:00)
  if (dateInput && timeInput) {
    dateInput.addEventListener('change', function () {
      var d = new Date(dateInput.value + 'T00:00:00');
      var day = d.getDay(); // 0=Sun, 6=Sat
      timeInput.setAttribute('max', (day === 0 || day === 6) ? '14:30' : '16:30');
    });
  }

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFieldErrors(bookingForm);

    var submitBtn = bookingForm.querySelector('button[type="submit"]');

    // Honeypot bot check — silently abort if filled
    var botcheck = document.getElementById('botcheck');
    if (botcheck && botcheck.value !== '') return;

    // Validate date is not in the past
    var dateVal = document.getElementById('date').value;
    if (dateVal) {
      var selected = new Date(dateVal + 'T00:00:00');
      var today    = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        showFieldError('date', 'Please select today or a future date.');
        return;
      }
    }

    // Validate time within cafe hours
    var timeVal = document.getElementById('time').value;
    if (timeVal) {
      var parts = timeVal.split(':');
      var h = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10);
      var mins = h * 60 + m;
      var d = new Date(dateVal + 'T00:00:00');
      var day = d.getDay();
      var closeMins = (day === 0 || day === 6) ? (14 * 60 + 30) : (16 * 60 + 30);
      if (mins < 7 * 60 || mins > closeMins) {
        showFieldError('time', 'Please choose a time within our opening hours.');
        return;
      }
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Processing\u2026';

    var data = {
      name:     document.getElementById('name').value.trim(),
      email:    document.getElementById('email').value.trim(),
      phone:    document.getElementById('phone').value.trim(),
      guests:   parseInt(document.getElementById('guests').value, 10) || 1,
      date:     dateVal,
      time:     timeVal,
      requests: document.getElementById('requests').value.trim(),
      botcheck: botcheck ? botcheck.value : ''
    };

    fetch(BOOKING_URL, {
      method: 'POST',
      body:   JSON.stringify(data)
    })
    .then(function (res) { return res.text(); })
    .then(function (msg) {
      if (msg.toLowerCase().includes('confirmed')) {
        bookingContainer.style.display = 'none';
        successScreen.style.display    = 'flex';
        successScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        showFormBanner(bookingForm, msg.replace('error: ', '') || 'Something went wrong. Please try again.', true);
      }
    })
    .catch(function () {
      // Google Apps Script CORS — the request still goes through
      bookingContainer.style.display = 'none';
      successScreen.style.display    = 'flex';
      successScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })
    .finally(function () {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Submit Reservation';
    });
  });

  if (bookAgainBtn) {
    bookAgainBtn.addEventListener('click', function () {
      bookingForm.reset();
      clearFieldErrors(bookingForm);
      successScreen.style.display    = 'none';
      bookingContainer.style.display = 'block';
    });
  }
})();


// ============================================================
//  REVIEW CAROUSEL  (index.html)
// ============================================================
(function () {
  var carousel = document.getElementById('review-carousel');
  if (!carousel) return;

  var track         = carousel.querySelector('.carousel-track');
  var dotsContainer = document.getElementById('carousel-dots');
  var current       = 0;
  var autoPlay      = true;
  var autoTimer     = null;
  var reviews       = [];

  var FALLBACK_REVIEWS = [
    { text: "Don't be fooled by the neutral atmosphere \u2014 the food and service were 10/10. The mushroom soup is absolutely delicious. Definitely coming back!", author: 'Anonymous',    role: 'Customer',        location: 'Suva, Fiji', rating: 5 },
    { text: 'Had the best experience at Malo Cafe. The chicken burger and fries were perfectly cooked and full of flavor.',                                          author: 'Shaheel Shah', role: 'Customer',        location: 'Suva, Fiji', rating: 5 },
    { text: 'Best poached eggs in Suva! Great smoothies, brunch, and coffee. The atmosphere is always buzzing.',                                                     author: 'Joe Morton',   role: 'Regular Customer', location: 'Suva, Fiji', rating: 5 },
    { text: 'Huge menu with lots of options. Everything we tried was delicious. Friendly staff too.',                                                                 author: 'Nayna Dutt',  role: 'Local Guide',     location: 'Suva, Fiji', rating: 4 },
    { text: 'Great coffee and generous portions. Friendly staff and a really nice vibe.',                                                                             author: 'Tish Tosh',   role: 'Local Guide',     location: 'Suva, Fiji', rating: 4 }
  ];

  function starSVG(filled) {
    var cls = filled ? 'filled' : 'empty';
    return '<svg class="' + cls + '" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }

  function userAvatar(author) {
    var ini    = (author || '?').split(' ').map(function (w) { return w[0] || ''; }).join('').substring(0, 2).toUpperCase();
    var colors = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFC75F'];
    var color  = colors[(author || '').length % colors.length];
    return '<div class="avatar-initials" style="background:' + color + '">' + ini + '</div>';
  }

  function render() {
    if (!reviews.length) return;

    // Read viewport width once per render, not inside the loop
    var gap = window.innerWidth < 768 ? 200 : 280;

    track.innerHTML = '';

    [-2, -1, 0, 1, 2].forEach(function (offset) {
      // Fix: capture idx in its own scope to avoid closure-in-loop bug
      var idx      = (current + offset + reviews.length) % reviews.length;
      var r        = reviews[idx];
      var card     = document.createElement('div');
      var isCenter = offset === 0;

      card.className = 'carousel-card ' + (isCenter ? 'center' : (Math.abs(offset) <= 1 ? 'side' : 'hidden-card'));
      card.style.transform = 'translateX(' + (offset * gap) + 'px) scale(' + (isCenter ? 1 : 0.8) + ')';
      card.setAttribute('aria-hidden', isCenter ? 'false' : 'true');

      var stars = '';
      for (var i = 0; i < 5; i++) stars += starSVG(i < r.rating);

      var photoBadge = r.photoUrl
        ? '<span class="verified-badge" style="margin-left:0.5rem;">\uD83D\uDCF7 Photo</span>'
        : '';

      card.innerHTML =
        '<div class="quote-icon">&#8220;</div>' +
        '<div class="carousel-avatar">' + userAvatar(r.author) + '</div>' +
        '<div class="carousel-stars">' + stars + '</div>' +
        '<p class="review-text">'      + escHtml(r.text     || '') + '</p>' +
        '<p class="review-author">\u2013 ' + escHtml(r.author   || 'Guest')      + '</p>' +
        '<p class="review-role">'      + escHtml(r.role     || 'Customer')   + '</p>' +
        '<p class="review-location">\uD83D\uDCCD ' + escHtml(r.location || 'Suva, Fiji') + '</p>' +
        '<span class="verified-badge">\u2714 Verified Review</span>' + photoBadge;

      // Fix: use an IIFE to capture idx correctly inside the click handler
      if (!isCenter) {
        card.style.cursor = 'pointer';
        (function (capturedIdx) {
          card.addEventListener('click', function () {
            current = capturedIdx;
            render();
          });
        })(idx);
      }

      track.appendChild(card);
    });

    // Rebuild dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      reviews.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
        // Fix: capture i in IIFE
        (function (capturedI) {
          dot.addEventListener('click', function () {
            current = capturedI;
            render();
          });
        })(i);
        dotsContainer.appendChild(dot);
      });
    }
  }

  function startAutoPlay() {
    clearInterval(autoTimer);
    autoTimer = setInterval(function () {
      if (!autoPlay || !reviews.length) return;
      if (document.hidden) return; // don't animate hidden tabs
      current = (current + 1) % reviews.length;
      render();
    }, 4000);
  }

  function loadReviews() {
    fetch(REVIEW_URL + '?action=reviews&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        reviews = (Array.isArray(data) && data.length)
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

  // Prev / Next buttons
  var prevBtn = carousel.querySelector('.carousel-prev');
  var nextBtn = carousel.querySelector('.carousel-next');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      current = (current - 1 + reviews.length) % reviews.length;
      render();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      current = (current + 1) % reviews.length;
      render();
    });
  }

  carousel.addEventListener('mouseenter', function () { autoPlay = false; });
  carousel.addEventListener('mouseleave', function () { autoPlay = true; });

  // Touch / swipe support
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

  // Show fallbacks immediately, then load real reviews
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

  // Cloudinary config — unsigned upload preset, safe to expose
  var CLD_CLOUD  = 'drkfcqpol';
  var CLD_PRESET = 'malo_reviews';

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
    if (!r) return '';
    return '<span class="rating-icon ' + r.anim + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="' + r.stroke + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="' + r.mouth + '"/>' +
      '<line x1="9" y1="9" x2="9.01" y2="9"/>' +
      '<line x1="15" y1="9" x2="15.01" y2="9"/>' +
      '</svg></span> ' + r.label;
  }

  function resetStars() {
    if (ratingInput) ratingInput.value = '0';
    stars.forEach(function (s) { s.classList.remove('active', 'hover'); });
    if (ratingText) ratingText.innerHTML = 'Tap to rate';
  }

  stars.forEach(function (star) {
    star.addEventListener('click', function () {
      var val = parseInt(star.dataset.value, 10);
      if (ratingInput) ratingInput.value = val;
      stars.forEach(function (s) {
        s.classList.toggle('active', parseInt(s.dataset.value, 10) <= val);
        s.classList.remove('hover');
      });
      if (ratingText) ratingText.innerHTML = ratingIcon(val);
    });

    star.addEventListener('mouseenter', function () {
      var val = parseInt(star.dataset.value, 10);
      stars.forEach(function (s) {
        s.classList.toggle('hover', parseInt(s.dataset.value, 10) <= val);
      });
      if (ratingText) ratingText.innerHTML = ratingIcon(val);
    });

    star.addEventListener('mouseleave', function () {
      stars.forEach(function (s) { s.classList.remove('hover'); });
      var cur = ratingInput ? parseInt(ratingInput.value, 10) : 0;
      if (ratingText) ratingText.innerHTML = cur > 0 ? ratingIcon(cur) : 'Tap to rate';
    });
  });

  // ── Image upload UI ──────────────────────────────────────────
  var uploadBox  = document.getElementById('imageUploadArea');
  var fileInput  = document.getElementById('reviewImage');
  var previewDiv = document.getElementById('imagePreview');
  var previewImg = document.getElementById('previewImg');
  var removeBtn  = document.getElementById('removeImage');
  var uploadPrompt = document.getElementById('uploadPrompt');

  function handleImage(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFormBanner(reviewForm, 'Please upload an image file (JPG, PNG, etc.).', true);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showFormBanner(reviewForm, 'Image too large. Please upload a file under 10 MB.', true);
      return;
    }
    var reader = new FileReader();
    reader.onloadend = function () {
      if (previewImg)   previewImg.src = reader.result;
      if (previewDiv)   previewDiv.style.display = 'block';
      if (uploadPrompt) uploadPrompt.style.display = 'none';
    };
    reader.onerror = function () {
      showFormBanner(reviewForm, 'Could not read the selected file. Please try again.', true);
    };
    reader.readAsDataURL(file);
  }

  if (uploadBox && fileInput) {
    if (uploadPrompt) {
      uploadPrompt.addEventListener('click', function () { fileInput.click(); });
    }
    uploadBox.addEventListener('dragover',  function (e) { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', function ()  { uploadBox.classList.remove('dragover'); });
    uploadBox.addEventListener('drop', function (e) {
      e.preventDefault();
      uploadBox.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function (e) {
      if (e.target.files[0]) handleImage(e.target.files[0]);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (fileInput)    fileInput.value = '';
      if (previewDiv)   previewDiv.style.display = 'none';
      if (uploadPrompt) uploadPrompt.style.display = 'flex';
    });
  }

  // ── Cloudinary upload with client-side compression ──────────
  function uploadToCloudinary(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('File read failed')); };
      reader.onloadend = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Image decode failed')); };
        img.onload = function () {
          var MAX = 1200;
          var w = img.width, h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else       { w = Math.round(w * MAX / h); h = MAX; }
          }
          var canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);

          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
            var fd = new FormData();
            fd.append('file',          blob, 'review.jpg');
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
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Submit ────────────────────────────────────────────────────
  reviewForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFieldErrors(reviewForm);

    if (!ratingInput || ratingInput.value === '0') {
      showFormBanner(reviewForm, 'Please select a star rating before submitting.', true);
      return;
    }

    var btn = document.getElementById('submitReviewBtn');
    btn.textContent = 'Submitting\u2026';
    btn.disabled    = true;

    var file = fileInput ? fileInput.files[0] : null;

    function doSubmit(photoUrl) {
      var data = {
        type:     'review',
        name:     document.getElementById('reviewName').value.trim(),
        rating:   parseInt(ratingInput.value, 10),
        text:     document.getElementById('reviewText').value.trim(),
        photoUrl: photoUrl || ''
      };

      fetch(REVIEW_URL, {
        method: 'POST',
        body:   JSON.stringify(data)
      })
      .then(function (res) { return res.text(); })
      .then(function (msg) {
        if (msg.toLowerCase().includes('submitted')) {
          showSuccess();
        } else {
          showFormBanner(reviewForm, msg.replace('error: ', '') || 'Something went wrong. Please try again.', true);
        }
      })
      .catch(function () {
        // Apps Script CORS quirk — submission still goes through
        showSuccess();
      })
      .finally(function () {
        btn.textContent = 'Submit Review';
        btn.disabled    = false;
      });
    }

    if (file) {
      btn.textContent = 'Uploading photo\u2026';
      uploadToCloudinary(file)
        .then(function (url) { doSubmit(url); })
        .catch(function (err) {
          console.warn('Photo upload failed, submitting without photo:', err);
          doSubmit('');
        });
    } else {
      doSubmit('');
    }
  });

  function showSuccess() {
    reviewForm.style.display = 'none';
    var successEl = document.getElementById('reviewSuccess');
    if (successEl) {
      successEl.style.display = 'block';
      successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  var leaveAnotherBtn = document.getElementById('leaveAnotherBtn');
  if (leaveAnotherBtn) {
    leaveAnotherBtn.addEventListener('click', function () {
      reviewForm.reset();
      resetStars();
      clearFieldErrors(reviewForm);
      if (previewDiv)   previewDiv.style.display   = 'none';
      if (uploadPrompt) uploadPrompt.style.display  = 'flex';
      if (fileInput)    fileInput.value             = '';
      var successEl = document.getElementById('reviewSuccess');
      if (successEl) successEl.style.display = 'none';
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

  var galleryPollTimer = null;

  function cloudinarySquare(url) {
    if (!url || !url.includes('/upload/')) return url;
    return url.replace('/upload/', '/upload/w_600,h_600,c_fill,g_auto,q_auto,f_auto/');
  }

  function makeItem(opts) {
    var div = document.createElement('div');
    div.className = 'gallery-item animate-in';
    div.setAttribute('data-filter', opts.filterAttr || 'cafe');
    if (opts.delay) div.setAttribute('data-delay', opts.delay);
    div.setAttribute('role',       'button');
    div.setAttribute('tabindex',   '0');
    div.setAttribute('aria-label', 'View ' + escHtml(opts.name || 'photo'));

    var squareUrl = cloudinarySquare(opts.url);
    var badgeHtml = opts.badge
      ? '<span class="' + (opts.badgeClass || 'owner-badge') + '">' + escHtml(opts.badge) + '</span>'
      : '';

    div.innerHTML =
      '<img src="' + escHtml(squareUrl) + '" alt="' + escHtml(opts.name) + '" loading="lazy">' +
      badgeHtml +
      '<div class="gallery-overlay">' +
        '<div class="caption">' +
          '<span class="cat">' + escHtml(opts.cat)  + '</span>' +
          '<p class="name">'   + escHtml(opts.name) + '</p>'   +
        '</div>' +
      '</div>';

    var img = div.querySelector('img');
    img.addEventListener('load',  function () { div.classList.add('img-loaded'); });
    img.addEventListener('error', function () { div.style.opacity = '0.4'; });

    function activate() { openLightbox(opts.url, opts.name, opts.cat); }
    div.addEventListener('click', activate);
    div.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(); }
    });

    // Register with the shared scroll observer if available
    if (scrollObserver) scrollObserver.observe(div);

    return div;
  }

  // ── Lightbox ────────────────────────────────────────────────
  function openLightbox(url, name, cat) {
    if (!lightbox || !lbImg) return;
    lbImg.src          = url || '';
    if (lbName) lbName.textContent = name || '';
    if (lbCat)  lbCat.textContent  = cat  || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    if (lbImg) lbImg.src = '';
    document.body.style.overflow = '';
  }

  if (lbClose)  lbClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });

  // ── Filter tabs ──────────────────────────────────────────────
  var activeFilter = 'all';

  document.querySelectorAll('.gallery-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.gallery-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeFilter = tab.dataset.filter || 'all';
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

  // ── Fetch owner/cafe photos from Apps Script/Cloudinary ─────
  function fetchOwnerPhotos() {
    fetch(GALLERY_URL + '?action=getOwnerPhotos&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success || !Array.isArray(data.photos) || !data.photos.length) return;

        var catMap = {
          Food: 'cafe food', Drinks: 'cafe food',
          Coffee: 'cafe food', Interior: 'cafe interior',
          Events: 'cafe'
        };
        var delay = 0.54;

        data.photos.forEach(function (photo) {
          var item = makeItem({
            url:        photo.url,
            name:       photo.title || photo.category || 'Cafe Photo',
            cat:        photo.category || 'Cafe',
            filterAttr: catMap[photo.category] || 'cafe',
            badge:      'New',
            badgeClass: 'owner-badge',
            delay:      delay.toFixed(2)
          });
          cafeGrid.appendChild(item);
          delay += 0.06;
        });
      })
      .catch(function () {
        // Silently fail — static photos are already visible
      });
  }

  // ── Fetch customer review photos ─────────────────────────────
  function fetchCustomerPhotos() {
    fetch(REVIEW_URL + '?action=gallery&_=' + Date.now())
      .then(function (res) { return res.json(); })
      .then(function (photos) {
        customerGrid.innerHTML = '';

        if (!Array.isArray(photos) || !photos.length) {
          customerGrid.innerHTML =
            '<div class="customer-empty">' +
              '<span style="font-size:2rem;">\uD83D\uDCF7</span>' +
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
            badge:      '\uD83D\uDCF7 ' + escHtml(photo.author || 'Guest'),
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
            '<span style="font-size:2rem;">\uD83D\uDCF7</span>' +
            '<p>Could not load customer photos right now.</p>' +
            '<a href="review.html">Leave a Review</a>' +
          '</div>';
      });
  }

  function pollGallery() {
    fetchOwnerPhotos();
    fetchCustomerPhotos();
  }

  // Initial load
  pollGallery();

  // Poll every 60 s, but only when the tab is visible
  galleryPollTimer = setInterval(function () {
    if (!document.hidden) pollGallery();
  }, 60000);

  // Stop polling if user navigates away (single-page navigation)
  window.addEventListener('pagehide', function () {
    clearInterval(galleryPollTimer);
  });
})();


// ============================================================
//  ABOUT IMAGE SLIDESHOW
// ============================================================
(function () {
  var slides = document.querySelectorAll('.slideshow .slide');
  if (!slides.length) return;

  var index = 0;

  setInterval(function () {
    if (document.hidden) return; // skip increment while tab is hidden

    slides[index].classList.remove('active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('active');
  }, 3000);
})();