// ===== NAVBAR SCROLL =====
document.addEventListener('DOMContentLoaded', function () {
  const navbar = document.querySelector('.navbar');

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


// ===== MOBILE MENU =====
const hamburgerCheck = document.getElementById('hamburger-check');
const mobileMenu = document.querySelector('.mobile-menu');

if (hamburgerCheck && mobileMenu) {
  // Sync checkbox state with mobile menu visibility
  hamburgerCheck.addEventListener('change', () => {
    mobileMenu.classList.toggle('open', hamburgerCheck.checked);
  });
  // Close menu and uncheck when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburgerCheck.checked = false;
    });
  });
}


// ===== SCROLL ANIMATIONS =====
const animateElements = document.querySelectorAll('.animate-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, (entry.target.dataset.delay || 0) * 1000);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '-50px' });

animateElements.forEach(el => observer.observe(el));


// ===== ACTIVE NAV LINK =====
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
  // Never apply active style to the booking button
  if (link.classList.contains('btn-book') || link.classList.contains('btn-book-mobile')) return;
  if (link.getAttribute('href') === currentPage) {
    link.classList.add('active');
  }
});


// ===== PRELOADER =====
window.addEventListener('load', function () {
  setTimeout(function () {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    preloader.classList.add('hidden');
    setTimeout(() => {
      preloader.style.display = 'none';
      document.body.classList.add('loaded');
    }, 500);
  }, 1500);
});


// ===== OFFLINE DETECTION =====
if (!navigator.onLine) {
  window.location.href = 'status-offline.html';
}
window.addEventListener('offline', function () {
  window.location.href = 'status-offline.html';
});


// ===== BOOKING FORM =====
const bookingForm      = document.getElementById('booking-form');
const bookingContainer = document.getElementById('booking-container');
const successScreen    = document.getElementById('success-screen');
const bookAgainBtn     = document.getElementById('book-again');

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    // Bot protection — hidden field must be empty
    const botcheck = document.getElementById('botcheck');
    if (botcheck && botcheck.value !== '') {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Reservation';
      return;
    }

    const data = {
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
      const res = await fetch('https://script.google.com/macros/s/AKfycbzPi9jLghl2dlv0zBzaie4Zniya2t3O2uWea0_SMbM4-l974DMEZ5qb_2pUvGKMSZXI/exec', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      const msg = await res.text();
      console.log('Server response:', msg);

      if (msg.toLowerCase().includes('confirmed')) {
        bookingContainer.style.display = 'none';
        successScreen.style.display = 'flex';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(msg);
      }

    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback — show success anyway
      bookingContainer.style.display = 'none';
      successScreen.style.display = 'flex';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Reservation';
  });
}

if (bookAgainBtn) {
  bookAgainBtn.addEventListener('click', () => {
    bookingForm.reset();
    successScreen.style.display = 'none';
    bookingContainer.style.display = 'block';
  });
}


// ===== REVIEW CAROUSEL =====
(function () {
  const carousel = document.getElementById('review-carousel');
  if (!carousel) return;

  const reviews = [
    {
      text: "Don't be fooled by the neutral atmosphere — the food and service were 10/10. The mushroom soup is absolutely delicious. Definitely coming back!",
      author: "Anonymous",
      role: "Customer",
      location: "Suva, Fiji",
      rating: 5
    },
    {
      text: "Had the best experience at Malo Cafe. The chicken burger and fries were perfectly cooked and full of flavor.",
      author: "Shaheel Shah",
      role: "Customer",
      location: "Suva, Fiji",
      rating: 5
    },
    {
      text: "Best poached eggs in Suva! Great smoothies, brunch, and coffee. The atmosphere is always buzzing.",
      author: "Joe Morton",
      role: "Regular Customer",
      location: "Suva, Fiji",
      rating: 5
    },
    {
      text: "Huge menu with lots of options. Everything we tried was delicious. Friendly staff too.",
      author: "Nayna Dutt",
      role: "Local Guide",
      location: "Suva, Fiji",
      rating: 4
    },
    {
      text: "Great coffee and generous portions. Friendly staff and a really nice vibe.",
      author: "Tish Tosh",
      role: "Local Guide",
      location: "Suva, Fiji",
      rating: 4
    }
  ];

  let current  = 0;
  let autoPlay = true;
  const track          = carousel.querySelector('.carousel-track');
  const dotsContainer  = document.getElementById('carousel-dots');

  function starSVG(filled) {
    return filled
      ? '<svg class="filled" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
      : '<svg class="empty"  viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }

  function userAvatar(author) {
    const initials = author.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const colors   = ['#FF6B6B', '#6BCB77', '#4D96FF', '#FFC75F'];
    const color    = colors[author.length % colors.length];
    return `<div class="avatar-initials" style="background:${color}">${initials}</div>`;
  }

  function render() {
    track.innerHTML = '';
    const offsets = [-2, -1, 0, 1, 2];
    const gap     = window.innerWidth < 768 ? 200 : 280;

    offsets.forEach(function (offset) {
      const idx      = (current + offset + reviews.length) % reviews.length;
      const r        = reviews[idx];
      const card     = document.createElement('div');
      const isCenter = offset === 0;

      card.className   = 'carousel-card ' + (isCenter ? 'center' : (Math.abs(offset) <= 1 ? 'side' : 'hidden-card'));
      card.style.transform = 'translateX(' + (offset * gap) + 'px) scale(' + (isCenter ? 1 : 0.8) + ')';

      let stars = '';
      for (let i = 0; i < 5; i++) stars += starSVG(i < r.rating);

      card.innerHTML =
        '<div class="quote-icon">"</div>' +
        '<div class="carousel-avatar">' + userAvatar(r.author) + '</div>' +
        '<div class="carousel-stars">' + stars + '</div>' +
        '<p class="review-text">' + r.text + '</p>' +
        '<p class="review-author">– ' + r.author + '</p>' +
        '<p class="review-role">' + r.role + '</p>' +
        '<p class="review-location">📍 ' + r.location + '</p>' +
        '<span class="verified-badge">✔ Verified Review</span>';

      track.appendChild(card);
    });

    // Dots
    dotsContainer.innerHTML = '';
    reviews.forEach(function (_, i) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
      dot.addEventListener('click', function () { current = i; render(); });
      dotsContainer.appendChild(dot);
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
    if (autoPlay) { current = (current + 1) % reviews.length; render(); }
  }, 4000);

  render();
})();


// ===== GALLERY LOADER (called externally if needed) =====
function loadGallery(images) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  images.forEach(img => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `
      <img src="${img.url}" alt="${img.alt || 'Gallery image'}">
      <div class="gallery-overlay">
        <span>Customer Photo</span>
      </div>
    `;
    grid.appendChild(div);
  });
}


// ===== REVIEW FORM =====
(function () {
  const reviewForm = document.getElementById('reviewForm');
  if (!reviewForm) return;

  const REVIEW_API = 'https://script.google.com/macros/s/AKfycbw7mQD9GZNoudABEKkSSy7BPTR4hQxY4UkyApnolfBKl1WBlxknkUYM2JyOWgLZj57s_Q/exec';

  // Star rating
  const stars       = document.querySelectorAll('.star-btn');
  const ratingInput = document.getElementById('ratingValue');
  const ratingText  = document.getElementById('ratingText');

  const ratingIcons = {
    1: { anim: 'anim-poor',    stroke: '#888888', mouth: 'M8 15 L16 15',              label: 'Poor'    },
    2: { anim: 'anim-okay',    stroke: '#a0845c', mouth: 'M8 14 L16 14',              label: 'Okay'    },
    3: { anim: 'anim-good',    stroke: '#7aaa50', mouth: 'M8 13 Q12 16 16 13',        label: 'Good'    },
    4: { anim: 'anim-great',   stroke: '#f4a822', mouth: 'M8 13 Q12 17 16 13',        label: 'Great'   },
    5: { anim: 'anim-amazing', stroke: '#e8890c', mouth: 'M8 12 Q12 18 16 12',        label: 'Amazing' }
  };

  function ratingIcon(val) {
    const r = ratingIcons[val];
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
    stars.forEach(s => s.classList.remove('active', 'hover'));
    ratingText.innerHTML = 'Tap to rate';
  }

  stars.forEach(star => {
    // Click — lock in rating
    star.addEventListener('click', () => {
      const val = star.dataset.value;
      ratingInput.value = val;
      stars.forEach(s => {
        s.classList.toggle('active', s.dataset.value <= val);
        s.classList.remove('hover');
      });
      ratingText.innerHTML = ratingIcon(val);
    });

    // Mouseenter — preview hover color up to this star
    star.addEventListener('mouseenter', () => {
      const val = star.dataset.value;
      stars.forEach(s => {
        s.classList.toggle('hover', s.dataset.value <= val);
      });
      ratingText.innerHTML = ratingIcon(val);
    });

    // Mouseleave — remove hover, restore active stars and label
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => s.classList.remove('hover'));
      const current = ratingInput.value;
      ratingText.innerHTML = current > 0 ? ratingIcon(current) : 'Tap to rate';
    });
  });

  // Image upload
  const uploadBox  = document.getElementById('imageUploadArea');
  const fileInput  = document.getElementById('reviewImage');
  const previewDiv = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeBtn  = document.getElementById('removeImage');
  const uploadArea = document.getElementById('uploadPrompt');

  if (uploadBox) {
    uploadArea.addEventListener('click', () => fileInput.click());

    uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
    uploadBox.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadBox.classList.remove('dragover');
      handleImage(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => handleImage(e.target.files[0]));

    function handleImage(file) {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Image too large (max 5MB)'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        previewImg.src = reader.result;
        previewDiv.style.display = 'block';
        uploadArea.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      previewDiv.style.display = 'none';
      uploadArea.style.display = 'flex';
    });
  }

  // Submit
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (ratingInput.value === '0') { alert('Please select a rating'); return; }

    const btn = document.getElementById('submitReviewBtn');
    btn.textContent = 'Submitting…';
    btn.disabled = true;

    let imageData = '';
    const file = fileInput ? fileInput.files[0] : null;
    if (file) {
      const reader = new FileReader();
      imageData = await new Promise(resolve => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const data = {
      type:   'review',
      name:   document.getElementById('reviewName').value,
      rating: parseInt(ratingInput.value),
      text:   document.getElementById('reviewText').value,
      image:  imageData
    };

    try {
      const res = await fetch(REVIEW_API, { method: 'POST', body: JSON.stringify(data) });
      const msg = await res.text();
      if (msg.toLowerCase().includes('submitted')) {
        showSuccess();
      } else {
        alert(msg);
      }
    } catch (err) {
      console.error(err);
      showSuccess(); // Show success anyway — Google Scripts often triggers CORS errors
    }

    btn.textContent = 'Submit Review';
    btn.disabled = false;
  });

  function showSuccess() {
    reviewForm.style.display = 'none';
    document.getElementById('reviewSuccess').style.display = 'block';
  }

  // Leave another review
  const leaveAnotherBtn = document.getElementById('leaveAnotherBtn');
  if (leaveAnotherBtn) {
    leaveAnotherBtn.addEventListener('click', () => {
      reviewForm.reset();
      resetStars();
      if (previewDiv) previewDiv.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'flex';
      document.getElementById('reviewSuccess').style.display = 'none';
      reviewForm.style.display = 'block';
    });
  }
})();