// ===== NAVBAR SCROLL =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ===== MOBILE MENU =====
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const icon = hamburger.querySelector('svg use');
    // Toggle icon handled via display
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// ===== SCROLL ANIMATIONS =====
const animateElements = document.querySelectorAll('.animate-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, (entry.target.dataset.delay || 0) * 1000);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '-50px' });

animateElements.forEach(el => observer.observe(el));

// ===== BOOKING FORM =====
const bookingForm = document.getElementById('booking-form');
const bookingContainer = document.getElementById('booking-container');
const successScreen = document.getElementById('success-screen');
const bookAgainBtn = document.getElementById('book-again');

if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    bookingContainer.style.display = 'none';
    successScreen.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
(function() {
  const carousel = document.getElementById('review-carousel');
  if (!carousel) return;

 const reviews = [
  {
    text: "Don’t be fooled by the neutral atmosphere — the food and service were 10/10. The mushroom soup is absolutely delicious. Definitely coming back!",
    author: "Anonymous",
    role: "Customer",
    location: "Suva, Fiji",
    rating: 5,
    image: "https://i.pravatar.cc/100?img=1"
  },
  {
    text: "Had the best experience at Malo Cafe. The chicken burger and fries were perfectly cooked and full of flavor.",
    author: "Shaheel Shah",
    role: "Customer",
    location: "Suva, Fiji",
    rating: 5,
    image: "https://i.pravatar.cc/100?img=2"
  },
  {
    text: "Best poached eggs in Suva! Great smoothies, brunch, and coffee. The atmosphere is always buzzing.",
    author: "Joe Morton",
    role: "Regular Customer",
    location: "Suva, Fiji",
    rating: 5,
    image: "https://i.pravatar.cc/100?img=3"
  },
  {
    text: "Huge menu with lots of options. Everything we tried was delicious. Friendly staff too.",
    author: "Nayna Dutt",
    role: "Local Guide",
    location: "Suva, Fiji",
    rating: 4,
    image: "https://i.pravatar.cc/100?img=4"
  },
  {
    text: "Great coffee and generous portions. Friendly staff and a really nice vibe.",
    author: "Tish Tosh",
    role: "Local Guide",
    location: "Suva, Fiji",
    rating: 4,
    image: "https://i.pravatar.cc/100?img=5"
  }
];

  let current = 0;
  let autoPlay = true;
  const track = carousel.querySelector('.carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');

  function starSVG(filled) {
    return filled
      ? '<svg class="filled" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
      : '<svg class="empty" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }

 function userAvatar(author) {
  const initials = author
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return `<div class="avatar-initials">${initials}</div>`;
}

  function render() {
    track.innerHTML = '';
    var offsets = [-2, -1, 0, 1, 2];
    var gap = window.innerWidth < 768 ? 200 : 280;
    offsets.forEach(function(offset) {
      var idx = (current + offset + reviews.length) % reviews.length;
      var r = reviews[idx];
      var card = document.createElement('div');
      var isCenter = offset === 0;
      card.className = 'carousel-card ' + (isCenter ? 'center' : (Math.abs(offset) <= 1 ? 'side' : 'hidden-card'));
      card.style.transform = 'translateX(' + (offset * gap) + 'px) scale(' + (isCenter ? 1 : 0.8) + ')';

      var stars = '';
      for (var i = 0; i < 5; i++) stars += starSVG(i < r.rating);

    card.innerHTML =
    '<div class="quote-icon">“</div>' +
    '<div class="carousel-avatar">' + userAvatar(r.author) + '</div>' +
    '<div class="carousel-stars">' + stars + '</div>' +
    '<p class="review-text">' + r.text + '</p>' +
    '<p class="review-author">– ' + r.author + '</p>' +
    '<p class="review-role">' + r.role + '</p>' +
    '<p class="review-location">📍 ' + r.location + '</p>' +
    '<p class="verified">✔ Verified Google Review</p>';
        track.appendChild(card);
    });

    // dots
    dotsContainer.innerHTML = '';
    reviews.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
      dot.addEventListener('click', function() { current = i; render(); });
      dotsContainer.appendChild(dot);
    });
  }

  carousel.querySelector('.carousel-prev').addEventListener('click', function() {
    current = (current - 1 + reviews.length) % reviews.length; render();
  });
  carousel.querySelector('.carousel-next').addEventListener('click', function() {
    current = (current + 1) % reviews.length; render();
  });
  carousel.addEventListener('mouseenter', function() { autoPlay = false; });
  carousel.addEventListener('mouseleave', function() { autoPlay = true; });

  setInterval(function() { if (autoPlay) { current = (current + 1) % reviews.length; render(); } }, 4000);
  render();
})();

// ===== ACTIVE NAV LINK =====
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
    link.classList.add('active');
  }
});