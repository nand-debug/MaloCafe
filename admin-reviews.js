'use strict';

// ─────────────────────────────────────────────
// PASTE YOUR APPS SCRIPT URL HERE
// ─────────────────────────────────────────────
var REVIEW_ENDPOINT = 'https://script.google.com/macros/s/AKfycbza7xMavpDylBTUveDrfsTFo8EwPkS8JA9J2Rs828aarHbAeop_3buskgJXMGoPYg14aA/exec';

// ── State ──────────────────────────────────────
var reviews      = [];
var activeFilter = 'pending';
 
// ── DOM refs ───────────────────────────────────
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
 
// ── Avatar colours ─────────────────────────────
var AVATAR_COLORS = ['#b07445','#6b9e5e','#4d7fa8','#a05c7b','#c4853a'];
function avatarColor(name) {
  var str = (name === null || name === undefined) ? '' : String(name);
  var idx = str.split('').reduce(function(a,c){ return a + c.charCodeAt(0); }, 0);
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}
function initials(name) {
  var str = (name === null || name === undefined || String(name).trim() === '') ? '?' : String(name);
  return str.split(' ').map(function(w){ return w[0] || ''; }).join('').substring(0,2).toUpperCase() || '?';
}
 
// ── Stars ──────────────────────────────────────
function starsHtml(rating) {
  var out = '';
  for (var i = 1; i <= 5; i++) {
    out += i <= rating ? '<span>★</span>' : '<span class="empty">★</span>';
  }
  return out;
}
 
// ── Toast ──────────────────────────────────────
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function(){ toast.classList.remove('show'); }, 2800);
}
 
// ── HTML escape ────────────────────────────────
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
 
// ── API call ───────────────────────────────────
// Google Apps Script doesn't support CORS for fetch() in some browsers.
// Using a <script> JSONP-style tag is more reliable, but the easiest
// fix is to add &callback= and use no-cors mode, OR just use fetch
// with mode 'no-cors' for actions and a normal fetch for GET.
// Best approach: use fetch with redirect follow and no-cors fallback.
 
function apiCall(params, callback) {
  var url = new URL(REVIEW_ENDPOINT);
  Object.keys(params).forEach(function(k){ url.searchParams.set(k, params[k]); });
 
  fetch(url.toString(), {
    method: 'GET',
    redirect: 'follow'
  })
    .then(function(res) {
      // Apps Script sometimes returns a redirect — follow it
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function(text) {
      // Strip any JSONP wrapper if present
      var clean = text.trim();
      if (clean.startsWith('/*')) {
        // Remove safety prefix Google sometimes adds
        clean = clean.replace(/^\/\*.*?\*\//s, '').trim();
      }
      var data = JSON.parse(clean);
      callback(data.success, data);
    })
    .catch(function(err) {
      console.error('API error:', err);
      // Try JSONP fallback
      jsonpCall(url.toString(), callback);
    });
}
 
// ── JSONP fallback (bypasses CORS completely) ──
function jsonpCall(url, callback) {
  var callbackName = 'mc_cb_' + Date.now();
  var script = document.createElement('script');
 
  window[callbackName] = function(data) {
    delete window[callbackName];
    document.head.removeChild(script);
    callback(data.success, data);
  };
 
  // Apps Script supports ?callback= for JSONP
  script.src = url + '&callback=' + callbackName;
  script.onerror = function() {
    delete window[callbackName];
    document.head.removeChild(script);
    grid.innerHTML = '<div class="empty-state"><p>Could not reach the server. Make sure your Apps Script is deployed as <strong>Anyone</strong> can access.</p></div>';
  };
  document.head.appendChild(script);
}
 
// ── Fetch reviews ──────────────────────────────
function fetchReviews() {
  grid.innerHTML = '<div class="empty-state"><p>Loading…</p></div>';
 
  apiCall({ action: 'getReviews' }, function(ok, data) {
    if (!ok || !data.reviews) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<p>Could not load reviews.</p>' +
          '<p style="margin-top:0.5rem;font-size:0.8rem;">Check: Is the Apps Script deployed with access set to <strong>Anyone</strong>? Open the browser console (F12) for the exact error.</p>' +
        '</div>';
      return;
    }
 
    // Force every field to the correct type before anything touches it
    reviews = data.reviews.map(function(r) {
      return {
        row:       r.row,
        timestamp: String(r.timestamp || ''),
        name:      String(r.name      || ''),
        rating:    parseInt(r.rating) || 0,
        text:      String(r.text      || ''),
        photoUrl:  String(r.photoUrl  || ''),
        status:    String(r.status    || 'pending')
      };
    });
    updateStats();
    render();
  });
}
 
// ── Stats ──────────────────────────────────────
function updateStats() {
  var pending  = reviews.filter(function(r){ return r.status === 'pending'; }).length;
  var approved = reviews.filter(function(r){ return r.status === 'approved'; }).length;
  var photos   = reviews.filter(function(r){ return r.photoUrl; }).length;
  countPending.textContent  = 'Pending: ' + pending;
  countApproved.textContent = 'Approved: ' + approved;
  countPhotos.textContent   = 'With photos: ' + photos;
}
 
// ── Render cards ───────────────────────────────
function render() {
  var filtered = reviews.filter(function(r){
    if (activeFilter === 'all') return true;
    return r.status === activeFilter;
  });
 
  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state"><p>No ' + activeFilter + ' reviews.</p></div>';
    countEl.textContent = '';
    return;
  }
 
  grid.innerHTML = '';
 
  filtered.forEach(function(r) {
    var card = document.createElement('div');
    card.className = 'review-card';
 
    var badgeClass = r.status === 'approved' ? 'badge-confirmed' : 'badge-rescheduled';
    var badgeLabel = r.status === 'approved' ? '✓ Approved' : '⏳ Pending';
 
    // Coerce all fields to strings defensively
    r.name     = String(r.name     || '');
    r.text     = String(r.text     || '');
    r.photoUrl = String(r.photoUrl || '');
    r.status   = String(r.status   || 'pending');
 
    var dateStr = '';
    if (r.timestamp) {
      try { dateStr = new Date(r.timestamp).toLocaleDateString('en-FJ', { day:'numeric', month:'short', year:'numeric' }); }
      catch(e) { dateStr = String(r.timestamp); }
    }
 
    var photoHtml = r.photoUrl
      ? '<img class="review-photo" src="' + r.photoUrl + '" alt="Customer photo" data-src="' + r.photoUrl + '">'
      : '';
 
    var actionsHtml = r.status === 'pending'
      ? '<button class="action-btn approve-btn"   data-row="' + r.row + '">✓ Approve</button>' +
        '<button class="action-btn delete-btn"    data-row="' + r.row + '">✕ Delete</button>'
      : '<button class="action-btn unapprove-btn" data-row="' + r.row + '">↩ Unapprove</button>' +
        '<button class="action-btn delete-btn"    data-row="' + r.row + '">✕ Delete</button>';
 
    card.innerHTML =
      '<div class="review-card-header">' +
        '<div class="review-avatar" style="background:' + avatarColor(r.name) + '">' + initials(r.name) + '</div>' +
        '<div class="review-meta">' +
          '<strong>' + escHtml(r.name) + '</strong>' +
          (dateStr ? '<time>' + dateStr + '</time>' : '') +
        '</div>' +
        '<div class="review-stars">' + starsHtml(parseInt(r.rating) || 0) + '</div>' +
      '</div>' +
      '<span class="badge ' + badgeClass + '" style="align-self:flex-start;">' + badgeLabel + (r.photoUrl ? ' · 📷' : '') + '</span>' +
      '<p class="review-body">' + escHtml(r.text) + '</p>' +
      photoHtml +
      '<div class="review-actions">' + actionsHtml + '</div>';
 
    // Photo lightbox
    if (r.photoUrl) {
      card.querySelector('.review-photo').addEventListener('click', function() {
        lightboxImg.src = this.dataset.src;
        lightbox.classList.add('open');
      });
    }
 
    // Approve
    var approveBtn = card.querySelector('.approve-btn');
    if (approveBtn) {
      approveBtn.addEventListener('click', function() {
        var btn = this;
        btn.disabled = true; btn.textContent = '…';
        apiCall({ action: 'approveReview', row: btn.dataset.row }, function(ok) {
          if (ok) { showToast('Review approved ✓'); fetchReviews(); }
          else    { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '✓ Approve'; }
        });
      });
    }
 
    // Unapprove
    var unapproveBtn = card.querySelector('.unapprove-btn');
    if (unapproveBtn) {
      unapproveBtn.addEventListener('click', function() {
        var btn = this;
        btn.disabled = true; btn.textContent = '…';
        apiCall({ action: 'unapproveReview', row: btn.dataset.row }, function(ok) {
          if (ok) { showToast('Moved back to pending'); fetchReviews(); }
          else    { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '↩ Unapprove'; }
        });
      });
    }
 
    // Delete
    var deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
      if (!confirm('Delete this review? This cannot be undone.')) return;
      var btn = this;
      btn.disabled = true; btn.textContent = '…';
      apiCall({ action: 'deleteReview', row: btn.dataset.row }, function(ok) {
        if (ok) { showToast('Review deleted'); fetchReviews(); }
        else    { showToast('Failed — try again'); btn.disabled = false; btn.textContent = '✕ Delete'; }
      });
    });
 
    grid.appendChild(card);
  });
 
  countEl.textContent = filtered.length + ' review' + (filtered.length !== 1 ? 's' : '');
}
 
// ── Filter tabs ────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.filter-tab').forEach(function(t){ t.classList.remove('active'); });
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    render();
  });
});
 
// ── Lightbox ───────────────────────────────────
lightboxClose.addEventListener('click', function(){ lightbox.classList.remove('open'); });
lightbox.addEventListener('click', function(e){ if (e.target === lightbox) lightbox.classList.remove('open'); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') lightbox.classList.remove('open'); });
 
// ── Refresh ────────────────────────────────────
refreshBtn.addEventListener('click', fetchReviews);
setInterval(fetchReviews, 30000);
 
// ── Init ───────────────────────────────────────
fetchReviews();
 