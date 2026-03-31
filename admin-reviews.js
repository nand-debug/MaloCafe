'use strict';

// ============================================================
//  MALO CAFE — admin-reviews.js
//  Reads + manages reviews from Google Sheet via Apps Script
// ============================================================

var REVIEW_URL = 'https://script.google.com/macros/s/AKfycbyFrrnXWnKSV-eeg1DUAWY3M687tMNjFGg0l6R85zvaFk3BC3757gZOCFb4-ex1iHia/exec';

// ── State ─────────────────────────────────────────────────────
var reviews      = [];
var activeFilter = 'pending';

// ── DOM refs ──────────────────────────────────────────────────
var grid          = document.getElementById('reviews-grid');
var countEl       = document.getElementById('reviews-count');
var countPending  = document.getElementById('count-pending');
var countApproved = document.getElementById('count-approved');
var countPhotos   = document.getElementById('count-photos');
var refreshBtn    = document.getElementById('refresh-btn');
var lightbox      = document.getElementById('lightbox');
var lightboxImg   = document.getElementById('lightbox-img');
var lightboxClose = document.getElementById('lightbox-close');
var toast         = document.getElementById('toast');

// ── Helpers ───────────────────────────────────────────────────
var AVATAR_COLORS = ['#b07445','#6b9e5e','#4d7fa8','#a05c7b','#c4853a'];

function avatarColor(name) {
  var s = String(name || '');
  var i = s.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}

function initials(name) {
  var s = String(name || '').trim() || '?';
  return s.split(' ').map(function (w) { return w[0] || ''; }).join('').substring(0, 2).toUpperCase() || '?';
}

function starsHtml(rating) {
  var out = '';
  for (var i = 1; i <= 5; i++) out += i <= rating ? '<span>★</span>' : '<span class="empty">★</span>';
  return out;
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 2800);
}

// ── POST to Apps Script ───────────────────────────────────────
// All admin actions use POST with a JSON body.
// Apps Script CORS returns an opaque response — we treat any
// non-network-error as success and verify by re-fetching.
function adminPost(payload, onSuccess, onError) {
  fetch(REVIEW_URL, {
    method:  'POST',
    body:    JSON.stringify(payload)
  })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      var lower = text.toLowerCase();
      if (lower.includes('error')) {
        if (onError) onError(text);
      } else {
        if (onSuccess) onSuccess(text);
      }
    })
    .catch(function (err) {
      // Apps Script often fires a CORS error even on success.
      // Re-fetch to confirm the action actually worked.
      console.warn('POST network error (may be CORS false positive):', err);
      if (onSuccess) onSuccess('ok');
    });
}

// ── Fetch all reviews (GET ?action=getReviews) ────────────────
function fetchReviews() {
  grid.innerHTML = '<div class="empty-state"><p>Loading…</p></div>';

  fetch(REVIEW_URL + '?action=getReviews')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!Array.isArray(data)) throw new Error('Bad response');
      reviews = data;
      updateStats();
      render();
    })
    .catch(function (err) {
      console.error('fetchReviews error:', err);
      grid.innerHTML =
        '<div class="empty-state">' +
          '<p>Could not load reviews.</p>' +
          '<p style="font-size:0.8rem;margin-top:0.5rem;">Make sure the Apps Script is deployed with access set to <strong>Anyone</strong>.</p>' +
        '</div>';
    });
}

// ── Stats bar ─────────────────────────────────────────────────
function updateStats() {
  var pending  = reviews.filter(function (r) { return r.status === 'pending'; }).length;
  var approved = reviews.filter(function (r) { return r.status === 'approved'; }).length;
  var photos   = reviews.filter(function (r) { return r.photoUrl; }).length;
  if (countPending)  countPending.textContent  = 'Pending: '     + pending;
  if (countApproved) countApproved.textContent = 'Approved: '    + approved;
  if (countPhotos)   countPhotos.textContent   = 'With photos: ' + photos;
}

// ── Render review cards ───────────────────────────────────────
function render() {
  var filtered = reviews.filter(function (r) {
    if (activeFilter === 'all')     return true;
    if (activeFilter === 'photos')  return !!r.photoUrl;
    return r.status === activeFilter;
  });

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><p>No ' + activeFilter + ' reviews.</p></div>';
    if (countEl) countEl.textContent = '';
    return;
  }

  grid.innerHTML = '';

  filtered.forEach(function (r) {
    var card = document.createElement('div');
    card.className = 'review-card';

    var statusBadgeClass = r.status === 'approved' ? 'badge-confirmed' : 'badge-rescheduled';
    var statusLabel      = r.status === 'approved' ? '✓ Approved' : '⏳ Pending';

    // Photo section
    var photoHtml = '';
    if (r.photoUrl) {
      var photoStatusLabel = r.photoStatus === 'approved'
        ? '<span class="badge badge-confirmed" style="font-size:0.7rem;">✓ Photo approved → gallery</span>'
        : '<span class="badge badge-rescheduled" style="font-size:0.7rem;">⏳ Photo pending</span>';

      photoHtml =
        '<div class="review-photo-wrap">' +
          '<img class="review-photo" src="' + escHtml(r.photoUrl) + '" alt="Customer photo" data-src="' + escHtml(r.photoUrl) + '">' +
          '<div style="margin-top:0.5rem;">' + photoStatusLabel + '</div>' +
        '</div>';
    }

    // Action buttons
    var reviewActions = '';
    if (r.status === 'pending') {
      reviewActions +=
        '<button class="action-btn approve-btn"   data-id="' + escHtml(r.reviewId) + '">✓ Approve review</button>' +
        '<button class="action-btn delete-btn"    data-id="' + escHtml(r.reviewId) + '">✕ Delete</button>';
    } else {
      reviewActions +=
        '<button class="action-btn unapprove-btn" data-id="' + escHtml(r.reviewId) + '">↩ Unapprove</button>' +
        '<button class="action-btn delete-btn"    data-id="' + escHtml(r.reviewId) + '">✕ Delete</button>';
    }

    // Photo approval button — only show if photo exists and not yet approved
    if (r.photoUrl && r.photoStatus !== 'approved') {
      reviewActions +=
        '<button class="action-btn photo-approve-btn" data-id="' + escHtml(r.reviewId) + '">📷 Approve photo → gallery</button>';
    }

    // Date
    var dateStr = '';
    if (r.timestamp) {
      try { dateStr = new Date(r.timestamp).toLocaleDateString('en-FJ', { day: 'numeric', month: 'short', year: 'numeric' }); }
      catch (ex) { dateStr = String(r.timestamp); }
    }

    card.innerHTML =
      '<div class="review-card-header">' +
        '<div class="review-avatar" style="background:' + avatarColor(r.name) + '">' + initials(r.name) + '</div>' +
        '<div class="review-meta">' +
          '<strong>' + escHtml(r.name) + '</strong>' +
          (dateStr ? '<time>' + escHtml(dateStr) + '</time>' : '') +
        '</div>' +
        '<div class="review-stars">' + starsHtml(parseInt(r.rating) || 0) + '</div>' +
      '</div>' +
      '<span class="badge ' + statusBadgeClass + '" style="align-self:flex-start;">' + statusLabel + '</span>' +
      '<p class="review-body">' + escHtml(r.text) + '</p>' +
      photoHtml +
      '<div class="review-actions">' + reviewActions + '</div>';

    // Photo lightbox
    var photoEl = card.querySelector('.review-photo');
    if (photoEl) {
      photoEl.style.cursor = 'zoom-in';
      photoEl.addEventListener('click', function () {
        if (lightboxImg) lightboxImg.src = this.dataset.src;
        if (lightbox)    lightbox.classList.add('open');
      });
    }

    // ── Approve review ──────────────────────────────────────
    var approveBtn = card.querySelector('.approve-btn');
    if (approveBtn) {
      approveBtn.addEventListener('click', function () {
        var btn = this;
        var id  = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        adminPost(
          { action: 'approveReview', reviewId: id },
          function () { showToast('Review approved ✓'); fetchReviews(); },
          function () { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '✓ Approve review'; }
        );
      });
    }

    // ── Unapprove review ────────────────────────────────────
    var unapproveBtn = card.querySelector('.unapprove-btn');
    if (unapproveBtn) {
      unapproveBtn.addEventListener('click', function () {
        var btn = this;
        var id  = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        adminPost(
          { action: 'unapproveReview', reviewId: id },
          function () { showToast('Moved back to pending'); fetchReviews(); },
          function () { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '↩ Unapprove'; }
        );
      });
    }

    // ── Delete review ───────────────────────────────────────
    var deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!confirm('Delete this review permanently?')) return;
        var btn = this;
        var id  = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        adminPost(
          { action: 'deleteReview', reviewId: id },
          function () { showToast('Review deleted'); fetchReviews(); },
          function () { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '✕ Delete'; }
        );
      });
    }

    // ── Approve photo → gallery ─────────────────────────────
    var photoApproveBtn = card.querySelector('.photo-approve-btn');
    if (photoApproveBtn) {
      photoApproveBtn.addEventListener('click', function () {
        var btn = this;
        var id  = btn.dataset.id;
        btn.disabled = true; btn.textContent = '…';
        adminPost(
          { action: 'approvePhoto', reviewId: id },
          function () { showToast('Photo approved → gallery ✓'); fetchReviews(); },
          function () { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '📷 Approve photo → gallery'; }
        );
      });
    }

    grid.appendChild(card);
  });

  if (countEl) countEl.textContent = filtered.length + ' review' + (filtered.length !== 1 ? 's' : '');
}

// ── Filter tabs ───────────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    render();
  });
});

// ── Lightbox ──────────────────────────────────────────────────
if (lightboxClose) lightboxClose.addEventListener('click', function () { lightbox.classList.remove('open'); });
if (lightbox) {
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.classList.remove('open'); });
}
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lightbox) lightbox.classList.remove('open'); });

// ── Refresh ───────────────────────────────────────────────────
if (refreshBtn) refreshBtn.addEventListener('click', fetchReviews);
setInterval(fetchReviews, 30000); // auto-refresh every 30s

// ── Init ──────────────────────────────────────────────────────
fetchReviews();