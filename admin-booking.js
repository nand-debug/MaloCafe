'use strict';

  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzPi9jLghl2dlv0zBzaie4Zniya2t3O2uWea0_SMbM4-l974DMEZ5qb_2pUvGKMSZXI/exec';

  var bookings = [];
var bookingPaused = false;

// ================= DOM =================
var tbody = document.getElementById('bookings-body');
var countEl = document.getElementById('booking-count');
var filterInput = document.getElementById('filter-date');
var clearBtn = document.getElementById('clear-filter');
var refreshBtn = document.getElementById('refresh-btn');
var toggleBtn = document.getElementById('toggle-booking-btn');
var demoBadge = document.getElementById('demo-badge');

// ================= API =================
function apiUpdate(action, params, callback) {
  var url = new URL(ENDPOINT);
  url.searchParams.set('action', action);

  Object.keys(params).forEach(k => {
    url.searchParams.set(k, params[k]);
  });

  fetch(url.toString())
    .then(res => res.text())
    .then(text => {
      try {
        const data = JSON.parse(text);
        callback(data.success, data.state);
      } catch (e) {
        console.error("Bad JSON:", text);
        callback(false);
      }
    })
    .catch(err => {
      console.error(err);
      callback(false);
    });
}

// ================= ACTIONS =================
function markDone(row) {
  apiUpdate('markDone', { row: row }, function(ok) {
    if (ok) fetchBookings();
    else alert("Failed to mark done");
  });
}

function cancelBooking(row) {
  if (!confirm("Cancel booking?")) return;

  apiUpdate('cancel', { row: row }, function(ok) {
    if (ok) fetchBookings();
    else alert("Failed to cancel");
  });
}

function assignTable(row, value) {
  apiUpdate('assignTable', { row: row, table: value }, function(ok) {
    if (!ok) alert("Failed to assign table");
  });
}

// ================= BOOKING STATE =================
function fetchBookingPaused() {
  apiUpdate('getBookingPaused', {}, function(ok, state) {
    bookingPaused = state || false;
    toggleBtn.textContent = bookingPaused ? 'Resume Bookings' : 'Pause Bookings';
  });
}

function toggleBooking() {
  apiUpdate('toggleBookingPaused', { paused: !bookingPaused }, function(ok) {
    if (ok) {
      bookingPaused = !bookingPaused;
      toggleBtn.textContent = bookingPaused ? 'Resume Bookings' : 'Pause Bookings';
    } else {
      alert("Failed to toggle");
    }
  });
}

toggleBtn.addEventListener('click', toggleBooking);

// ================= FETCH BOOKINGS =================
function fetchBookings() {
  var url = ENDPOINT + '?action=getBookings';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      bookings = data.bookings || [];
      render();
    })
    .catch(err => {
      console.error(err);
    });
}

// ================= RENDER =================
function render() {
  var filterVal = filterInput.value;
  clearBtn.style.display = filterVal ? 'inline-flex' : 'none';

  var filtered = filterVal
    ? bookings.filter(b => b.date === filterVal)
    : bookings;

  tbody.innerHTML = '';

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8">No bookings</td></tr>';
    countEl.textContent = '0 bookings';
    return;
  }

  filtered.forEach(b => {
    var tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${b.name}</td>
      <td>${b.email}</td>
      <td>${b.guests}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>${b.status}</td>
      <td><input value="${b.table || ''}" /></td>
      <td></td>
    `;

    // TABLE INPUT
    var input = tr.querySelector('input');
    input.disabled = b.status !== 'confirmed' || bookingPaused;

    input.addEventListener('blur', function() {
      assignTable(b.row, this.value);
    });

    // ACTION BUTTONS
    var actionCell = tr.children[7];

    if (b.status === 'confirmed' && !bookingPaused) {
      var doneBtn = document.createElement('button');
      doneBtn.textContent = 'Done';
      doneBtn.onclick = function() { markDone(b.row); };

      var cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.onclick = function() { cancelBooking(b.row); };

      actionCell.appendChild(doneBtn);
      actionCell.appendChild(cancelBtn);
    } else {
      actionCell.textContent = '—';
    }

    tbody.appendChild(tr);
  });

  countEl.textContent = filtered.length + ' bookings';
}

// ================= EVENTS =================
filterInput.addEventListener('change', render);
clearBtn.addEventListener('click', function() {
  filterInput.value = '';
  render();
});
refreshBtn.addEventListener('click', fetchBookings);

// ================= AUTO REFRESH =================
setInterval(function () {
  fetchBookings();
}, 5000);

// ================= INIT =================
fetchBookingPaused();
fetchBookings();
