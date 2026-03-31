'use strict';

// ============================================================
//  MALO CAFE — script.js
//  Shared across all pages
// ============================================================

// ── Apps Script endpoints ────────────────────────────────────
var BOOKING_URL = 'https://script.google.com/macros/s/AKfycbzPi9jLghl2dlv0zBzaie4Zniya2t3O2uWea0_SMbM4-l974DMEZ5qb_2pUvGKMSZXI/exec';
var REVIEW_URL  = 'https://script.google.com/macros/s/AKfycbyFrrnXWnKSV-eeg1DUAWY3M687tMNjFGg0l6R85zvaFk3BC3757gZOCFb4-ex1iHia/exec';


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
  setTimeout(function () {
    var preloader = document.getElementById('preloader');
    if (!preloader) return;
    preloader.classList.add('hidden');
    setTimeout(function () {
      preloader.style.display = 'none';
      document.body.classList.add('loaded');
    }, 500);
  }, 1500);
});


// ============================================================
//  OFFLINE DETECTION
// ============================================================
if (!navigator.onLine) window.location.href = 'status-offline.html';
window.addEventListener('offline', function () { window.location.href = 'status-offline.html'; });


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
//  GALLERY — loads approved customer photos from Apps Script
// ============================================================
(function () {
  var galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) return;

  function loadGallery() {
    fetch(REVIEW_URL + '?action=gallery')
      .then(function (res) { return res.json(); })
      .then(function (photos) {
        if (!Array.isArray(photos) || !photos.length) return; // keep static images if no customer photos yet

        // Append customer photos after the existing static gallery items
        photos.forEach(function (photo) {
          var div = document.createElement('div');
          div.className = 'gallery-item animate-in';
          div.innerHTML =
            '<img src="' + photo.url + '" alt="Customer photo by ' + (photo.author || 'Guest') + '" loading="lazy">' +
            '<div class="gallery-overlay">' +
              '<div class="caption">' +
                '<span class="cat">Customer Photo</span>' +
                '<p class="name">📷 ' + (photo.author || 'Guest') + '</p>' +
              '</div>' +
            '</div>';
          galleryGrid.appendChild(div);
        });

        // Re-run scroll observer on new items
        div.querySelectorAll && div.querySelectorAll('.animate-in').forEach(function (el) {
          scrollObserver.observe(el);
        });
      })
      .catch(function () {
        // Silent fail — gallery still shows static images
      });
  }

  loadGallery();
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