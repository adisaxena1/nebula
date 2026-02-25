const API_URL = 'http://localhost:3000/api';

let allEvents = [];
let html5QrCode = null;
let scanHistory = [];

// Navigation
window.showView = (viewName) => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`${viewName}-view`).classList.add('active');
  
  // Update active nav button
  document.querySelectorAll('.nav-links button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`nav-${viewName}`)?.classList.add('active');
  
  if (viewName === 'events') loadEvents();
  if (viewName === 'admin') loadDashboard();
  if (viewName === 'scanner') initScanner();
};

// ============ EVENTS ============

async function loadEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    allEvents = await res.json();
    renderEvents(allEvents);
  } catch (error) {
    console.error('Failed to load events:', error);
  }
}

function renderEvents(events) {
  const container = document.getElementById('events-list');
  
  if (events.length === 0) {
    container.innerHTML = '<p class="empty-message">No events available</p>';
    return;
  }
  
  container.innerHTML = events.map(event => {
    const eventDate = new Date(event.date);
    const isPast = eventDate < new Date();
    const isSoldOut = event.tickets_sold >= event.capacity;
    
    return `
      <div class="event-card ${isPast ? 'past-event' : ''}" onclick="showEventDetails(${event.id})">
        <div class="event-category">${event.category || 'General'}</div>
        <h3>${event.name}</h3>
        <p>📅 ${eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <p>🕐 ${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
        <p>📍 ${event.location}</p>
        <p>💰 ${event.price > 0 ? '$' + event.price.toFixed(2) : 'Free'}</p>
        <div class="ticket-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(event.tickets_sold / event.capacity) * 100}%"></div>
          </div>
          <span>${event.tickets_sold}/${event.capacity} tickets</span>
        </div>
        <button onclick="event.stopPropagation(); bookTicket(${event.id})" 
                ${isSoldOut || isPast ? 'disabled' : ''} 
                class="${isSoldOut ? 'sold-out' : ''}">
          ${isPast ? 'Event Ended' : isSoldOut ? 'Sold Out' : 'Get Ticket'}
        </button>
      </div>
    `;
  }).join('');
}

window.filterEvents = () => {
  const category = document.getElementById('category-filter').value;
  const search = document.getElementById('search-filter').value.toLowerCase();
  
  let filtered = allEvents;
  
  if (category) {
    filtered = filtered.filter(e => e.category === category);
  }
  
  if (search) {
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(search) || 
      e.location.toLowerCase().includes(search)
    );
  }
  
  renderEvents(filtered);
};

window.showEventDetails = async (eventId) => {
  try {
    const res = await fetch(`${API_URL}/events/${eventId}`);
    const event = await res.json();
    
    const modal = document.getElementById('event-modal');
    const details = document.getElementById('event-details');
    const eventDate = new Date(event.date);
    
    details.innerHTML = `
      <div class="event-detail-header">
        <span class="event-category">${event.category || 'General'}</span>
        <h2>${event.name}</h2>
      </div>
      <div class="event-detail-body">
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <span>${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🕐</span>
          <span>${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <span>${event.location}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">💰</span>
          <span>${event.price > 0 ? '$' + event.price.toFixed(2) : 'Free Entry'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🎫</span>
          <span>${event.tickets_sold || 0}/${event.capacity} tickets sold</span>
        </div>
        ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
      </div>
      <button onclick="closeEventModal(); bookTicket(${event.id})" 
              ${event.tickets_sold >= event.capacity ? 'disabled' : ''}>
        ${event.tickets_sold >= event.capacity ? 'Sold Out' : 'Get Ticket'}
      </button>
    `;
    
    modal.classList.add('active');
  } catch (error) {
    console.error('Failed to load event details:', error);
  }
};

window.closeEventModal = () => {
  document.getElementById('event-modal').classList.remove('active');
};

// ============ BOOKING ============

window.bookTicket = async (eventId) => {
  const modal = document.getElementById('ticket-modal');
  const details = document.getElementById('ticket-details');
  
  details.innerHTML = `
    <h2>Book Ticket</h2>
    <form id="booking-form">
      <input type="text" id="attendee-name" placeholder="Full Name" required>
      <input type="email" id="attendee-email" placeholder="Email Address" required>
      <input type="tel" id="attendee-phone" placeholder="Phone Number (optional)">
      <select id="ticket-type">
        <option value="standard">Standard Ticket</option>
        <option value="vip">VIP Ticket</option>
        <option value="student">Student Ticket</option>
      </select>
      <button type="submit">Confirm Booking</button>
    </form>
  `;
  
  modal.classList.add('active');
  
  document.getElementById('booking-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('attendee-name').value;
    const email = document.getElementById('attendee-email').value;
    const phone = document.getElementById('attendee-phone').value;
    const ticketType = document.getElementById('ticket-type').value;
    
    details.innerHTML = '<div class="loading">Processing your booking...</div>';
    
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event_id: eventId, 
          attendee_name: name, 
          attendee_email: email,
          attendee_phone: phone,
          ticket_type: ticketType
        })
      });
      
      const ticket = await res.json();
      
      if (ticket.error) {
        details.innerHTML = `<div class="error-message">${ticket.error}</div>`;
        return;
      }
      
      showTicketConfirmation(ticket);
      loadEvents();
    } catch (error) {
      details.innerHTML = `<div class="error-message">Failed to book ticket. Please try again.</div>`;
    }
  };
};

function showTicketConfirmation(ticket) {
  const details = document.getElementById('ticket-details');
  
  details.innerHTML = `
    <div class="ticket-confirmed">
      <div class="success-icon">✓</div>
      <h2>Ticket Confirmed!</h2>
      <div class="ticket-info">
        <div class="ticket-qr">
          <img src="${ticket.qr_code}" alt="QR Code">
        </div>
        <div class="ticket-text">
          <p><strong>Event:</strong> ${ticket.event_name}</p>
          <p><strong>Date:</strong> ${new Date(ticket.event_date).toLocaleString()}</p>
          <p><strong>Location:</strong> ${ticket.event_location}</p>
          <p><strong>Name:</strong> ${ticket.attendee_name}</p>
          <p><strong>Type:</strong> ${ticket.ticket_type}</p>
          <p><strong>Code:</strong> <span class="ticket-code">${ticket.code}</span></p>
        </div>
      </div>
      <p class="ticket-note">Screenshot or save this QR code for entry</p>
      <button onclick="downloadTicket('${ticket.code}')">Download Ticket</button>
    </div>
  `;
}

window.downloadTicket = async (code) => {
  try {
    const res = await fetch(`${API_URL}/tickets/${code}`);
    const ticket = await res.json();
    
    // Create a downloadable ticket image
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 600);
    
    // Header
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 400, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎫 Campus Events', 200, 50);
    
    // Event name
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(ticket.event_name, 200, 120);
    
    // Details
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(`📅 ${new Date(ticket.event_date).toLocaleDateString()}`, 200, 160);
    ctx.fillText(`🕐 ${new Date(ticket.event_date).toLocaleTimeString()}`, 200, 185);
    ctx.fillText(`📍 ${ticket.event_location}`, 200, 210);
    
    // Attendee
    ctx.fillText(`Name: ${ticket.attendee_name}`, 200, 250);
    ctx.fillText(`Type: ${ticket.ticket_type}`, 200, 275);
    
    // QR Code
    const qrImage = new Image();
    qrImage.onload = () => {
      ctx.drawImage(qrImage, 100, 300, 200, 200);
      
      // Ticket code
      ctx.font = '12px monospace';
      ctx.fillText(`Code: ${ticket.code}`, 200, 530);
      
      // Footer
      ctx.font = '10px Arial';
      ctx.fillText('Present this ticket at entry', 200, 570);
      
      // Download
      const link = document.createElement('a');
      link.download = `ticket-${ticket.code.substring(0, 8)}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    qrImage.src = ticket.qr_code;
  } catch (error) {
    console.error('Failed to download ticket:', error);
  }
};

window.closeModal = () => {
  document.getElementById('ticket-modal').classList.remove('active');
};

// ============ MY TICKETS ============

window.lookupTickets = async () => {
  const email = document.getElementById('lookup-email').value.trim();
  if (!email) return;
  
  const container = document.getElementById('my-tickets-list');
  container.innerHTML = '<div class="loading">Loading tickets...</div>';
  
  try {
    const res = await fetch(`${API_URL}/tickets/user/${encodeURIComponent(email)}`);
    const tickets = await res.json();
    
    if (tickets.length === 0) {
      container.innerHTML = '<p class="empty-message">No tickets found for this email</p>';
      return;
    }
    
    container.innerHTML = tickets.map(ticket => `
      <div class="my-ticket-card ${ticket.checked_in ? 'checked-in' : ''}">
        <div class="ticket-status ${ticket.checked_in ? 'used' : 'valid'}">
          ${ticket.checked_in ? 'Used' : 'Valid'}
        </div>
        <div class="my-ticket-info">
          <h3>${ticket.event_name}</h3>
          <p>📅 ${new Date(ticket.event_date).toLocaleString()}</p>
          <p>📍 ${ticket.event_location}</p>
          <p>🎫 ${ticket.ticket_type}</p>
          ${ticket.checked_in ? `<p>✓ Checked in: ${new Date(ticket.checked_in_at).toLocaleString()}</p>` : ''}
        </div>
        <div class="my-ticket-qr">
          <img src="${ticket.qr_code}" alt="QR Code">
          <span class="ticket-code">${ticket.code.substring(0, 8)}...</span>
        </div>
        <button onclick="downloadTicket('${ticket.code}')" ${ticket.checked_in ? 'disabled' : ''}>
          Download
        </button>
      </div>
    `).join('');
  } catch (error) {
    container.innerHTML = '<p class="error-message">Failed to load tickets</p>';
  }
};

// ============ ADMIN DASHBOARD ============

async function loadDashboard() {
  try {
    const res = await fetch(`${API_URL}/dashboard`);
    const data = await res.json();
    
    document.getElementById('total-events').textContent = data.totalEvents;
    document.getElementById('total-tickets').textContent = data.totalTickets;
    document.getElementById('total-revenue').textContent = '$' + (data.totalRevenue || 0).toFixed(2);
    document.getElementById('total-checkins').textContent = data.todayCheckins;
    
    loadManageEvents();
    loadAnalyticsEventSelect();
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

window.showAdminTab = (tabName) => {
  document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`${tabName}-tab`).classList.add('active');
  event.target.classList.add('active');
  
  if (tabName === 'manage') loadManageEvents();
  if (tabName === 'analytics') loadAnalyticsEventSelect();
};

// Create Event
document.getElementById('create-event-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const event = {
    name: document.getElementById('event-name').value,
    date: document.getElementById('event-date').value,
    location: document.getElementById('event-location').value,
    capacity: parseInt(document.getElementById('event-capacity').value),
    price: parseFloat(document.getElementById('event-price').value),
    description: document.getElementById('event-description').value,
    category: document.getElementById('event-category').value
  };
  
  try {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    
    const result = await res.json();
    
    if (result.success) {
      e.target.reset();
      alert('Event created successfully!');
      loadDashboard();
      loadEvents();
    }
  } catch (error) {
    alert('Failed to create event');
  }
});

// Manage Events
async function loadManageEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();
    
    const container = document.getElementById('manage-events-list');
    
    if (events.length === 0) {
      container.innerHTML = '<p class="empty-message">No events created yet</p>';
      return;
    }
    
    container.innerHTML = events.map(event => `
      <div class="manage-event-card">
        <div class="manage-event-info">
          <h4>${event.name}</h4>
          <p>📅 ${new Date(event.date).toLocaleString()}</p>
          <p>📍 ${event.location}</p>
          <p>🎫 ${event.tickets_sold}/${event.capacity} tickets</p>
        </div>
        <div class="manage-event-actions">
          <button onclick="viewAttendees(${event.id})" class="btn-secondary">Attendees</button>
          <button onclick="editEvent(${event.id})" class="btn-secondary">Edit</button>
          <button onclick="deleteEvent(${event.id})" class="btn-danger">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load events:', error);
  }
}

window.editEvent = async (eventId) => {
  try {
    const res = await fetch(`${API_URL}/events/${eventId}`);
    const event = await res.json();
    
    document.getElementById('edit-event-id').value = event.id;
    document.getElementById('edit-event-name').value = event.name;
    document.getElementById('edit-event-category').value = event.category || 'General';
    document.getElementById('edit-event-date').value = event.date.substring(0, 16);
    document.getElementById('edit-event-location').value = event.location;
    document.getElementById('edit-event-capacity').value = event.capacity;
    document.getElementById('edit-event-price').value = event.price;
    document.getElementById('edit-event-description').value = event.description || '';
    
    document.getElementById('edit-modal').classList.add('active');
  } catch (error) {
    alert('Failed to load event');
  }
};

window.closeEditModal = () => {
  document.getElementById('edit-modal').classList.remove('active');
};

document.getElementById('edit-event-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const eventId = document.getElementById('edit-event-id').value;
  const event = {
    name: document.getElementById('edit-event-name').value,
    date: document.getElementById('edit-event-date').value,
    location: document.getElementById('edit-event-location').value,
    capacity: parseInt(document.getElementById('edit-event-capacity').value),
    price: parseFloat(document.getElementById('edit-event-price').value),
    description: document.getElementById('edit-event-description').value,
    category: document.getElementById('edit-event-category').value,
    status: 'active'
  };
  
  try {
    await fetch(`${API_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    
    closeEditModal();
    loadManageEvents();
    loadEvents();
    alert('Event updated successfully!');
  } catch (error) {
    alert('Failed to update event');
  }
});

window.deleteEvent = async (eventId) => {
  if (!confirm('Are you sure you want to delete this event?')) return;
  
  try {
    await fetch(`${API_URL}/events/${eventId}`, { method: 'DELETE' });
    loadManageEvents();
    loadEvents();
    loadDashboard();
  } catch (error) {
    alert('Failed to delete event');
  }
};

window.viewAttendees = async (eventId) => {
  try {
    const res = await fetch(`${API_URL}/events/${eventId}/attendees`);
    const attendees = await res.json();
    
    const container = document.getElementById('attendees-list');
    
    if (attendees.length === 0) {
      container.innerHTML = '<p class="empty-message">No attendees yet</p>';
    } else {
      container.innerHTML = `
        <table class="attendees-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Status</th>
              <th>Check-in Time</th>
            </tr>
          </thead>
          <tbody>
            ${attendees.map(a => `
              <tr class="${a.checked_in ? 'checked-in' : ''}">
                <td>${a.attendee_name}</td>
                <td>${a.attendee_email}</td>
                <td>${a.attendee_phone || '-'}</td>
                <td>${a.ticket_type}</td>
                <td><span class="status-badge ${a.checked_in ? 'checked' : 'pending'}">${a.checked_in ? 'Checked In' : 'Pending'}</span></td>
                <td>${a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    document.getElementById('attendees-modal').classList.add('active');
  } catch (error) {
    alert('Failed to load attendees');
  }
};

window.closeAttendeesModal = () => {
  document.getElementById('attendees-modal').classList.remove('active');
};

// Analytics
async function loadAnalyticsEventSelect() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();
    
    const select = document.getElementById('analytics-event-select');
    select.innerHTML = '<option value="">Select an event</option>' + 
      events.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  } catch (error) {
    console.error('Failed to load events for analytics:', error);
  }
}

window.loadEventAnalytics = async () => {
  const eventId = document.getElementById('analytics-event-select').value;
  if (!eventId) return;
  
  const container = document.getElementById('analytics-container');
  container.innerHTML = '<div class="loading">Loading analytics...</div>';
  
  try {
    const res = await fetch(`${API_URL}/stats/${eventId}`);
    const data = await res.json();
    
    container.innerHTML = `
      <div class="analytics-grid">
        <div class="analytics-card">
          <h4>Overview</h4>
          <div class="analytics-stats">
            <div class="stat-item">
              <span class="stat-value">${data.event.total_tickets}</span>
              <span class="stat-label">Total Tickets</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${data.event.checked_in || 0}</span>
              <span class="stat-label">Checked In</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${data.event.total_tickets > 0 ? ((data.event.checked_in || 0) / data.event.total_tickets * 100).toFixed(1) : 0}%</span>
              <span class="stat-label">Attendance Rate</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">$${(data.event.revenue || 0).toFixed(2)}</span>
              <span class="stat-label">Revenue</span>
            </div>
          </div>
        </div>
        
        <div class="analytics-card">
          <h4>Peak Entry Time</h4>
          <div class="peak-time">
            <span class="peak-hour">${data.peakHour}</span>
            <span class="peak-entries">${data.peakEntries} entries</span>
          </div>
        </div>
        
        <div class="analytics-card full-width">
          <h4>Entry by Hour</h4>
          <div class="hour-chart">
            ${generateHourChart(data.entryByHour)}
          </div>
        </div>
        
        <div class="analytics-card">
          <h4>Gate Distribution</h4>
          <div class="gate-distribution">
            ${data.gateDistribution.length > 0 ? data.gateDistribution.map(g => `
              <div class="gate-item">
                <span class="gate-name">${g.gate}</span>
                <span class="gate-count">${g.entries}</span>
              </div>
            `).join('') : '<p>No entries yet</p>'}
          </div>
        </div>
        
        <div class="analytics-card">
          <h4>Recent Entries</h4>
          <div class="recent-entries">
            ${data.recentEntries.length > 0 ? data.recentEntries.slice(0, 10).map(e => `
              <div class="entry-item">
                <span class="entry-name">${e.attendee_name}</span>
                <span class="entry-time">${new Date(e.entry_time).toLocaleTimeString()}</span>
                <span class="entry-gate">${e.gate}</span>
              </div>
            `).join('') : '<p>No entries yet</p>'}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p class="error-message">Failed to load analytics</p>';
  }
};

function generateHourChart(entryByHour) {
  const hours = Array(24).fill(0);
  entryByHour.forEach(e => {
    hours[parseInt(e.hour)] = e.entries;
  });
  
  const maxEntries = Math.max(...hours, 1);
  
  return `
    <div class="hour-bars">
      ${hours.map((count, hour) => `
        <div class="hour-bar-container">
          <div class="hour-bar" style="height: ${(count / maxEntries) * 100}%">
            ${count > 0 ? `<span class="bar-value">${count}</span>` : ''}
          </div>
          <span class="hour-label">${hour}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ============ QR SCANNER ============

function initScanner() {
  if (html5QrCode) return;
  
  try {
    html5QrCode = new Html5Qrcode("qr-reader");
  } catch (error) {
    console.log('QR Scanner not available, using manual input');
    setScannerMode('manual');
  }
}

window.setScannerMode = (mode) => {
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  if (mode === 'camera') {
    document.getElementById('camera-scanner').style.display = 'block';
    document.getElementById('manual-scanner').style.display = 'none';
    startCameraScanner();
  } else {
    document.getElementById('camera-scanner').style.display = 'none';
    document.getElementById('manual-scanner').style.display = 'block';
    stopCameraScanner();
    document.getElementById('qr-input').focus();
  }
};

async function startCameraScanner() {
  if (!html5QrCode) {
    initScanner();
  }
  
  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      () => {} // Ignore scan errors
    );
  } catch (error) {
    console.log('Camera not available');
    setScannerMode('manual');
  }
}

function stopCameraScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().catch(() => {});
  }
}

async function onScanSuccess(decodedText) {
  stopCameraScanner();
  await processVerification(decodedText);
  setTimeout(() => startCameraScanner(), 2000);
}

window.verifyTicket = async () => {
  const code = document.getElementById('qr-input').value.trim();
  if (!code) return;
  
  await processVerification(code);
  document.getElementById('qr-input').value = '';
  document.getElementById('qr-input').focus();
};

async function processVerification(code) {
  const gate = document.getElementById('gate-select').value;
  const resultDiv = document.getElementById('scan-result');
  
  try {
    const res = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, gate })
    });
    
    const result = await res.json();
    
    if (result.valid) {
      resultDiv.className = 'scan-result success';
      resultDiv.innerHTML = `
        <div class="result-icon">✓</div>
        <h3>Valid Ticket</h3>
        <p class="result-name">${result.attendee_name}</p>
        <p class="result-event">${result.event_name}</p>
        <p class="result-type">${result.ticket_type}</p>
        ${result.already_checked_in ? '<p class="warning">⚠️ Already checked in</p>' : '<p class="success-text">Checked in successfully</p>'}
      `;
      
      addToScanHistory(result, true);
      playSound('success');
    } else {
      resultDiv.className = 'scan-result error';
      resultDiv.innerHTML = `
        <div class="result-icon">✗</div>
        <h3>Invalid Ticket</h3>
        <p>${result.message}</p>
      `;
      
      addToScanHistory({ code: code.substring(0, 8), message: result.message }, false);
      playSound('error');
    }
  } catch (error) {
    resultDiv.className = 'scan-result error';
    resultDiv.innerHTML = `
      <div class="result-icon">✗</div>
      <h3>Error</h3>
      <p>Failed to verify ticket</p>
    `;
  }
}

function addToScanHistory(result, valid) {
  const historyList = document.getElementById('scan-history-list');
  const time = new Date().toLocaleTimeString();
  
  scanHistory.unshift({ result, valid, time });
  if (scanHistory.length > 20) scanHistory.pop();
  
  historyList.innerHTML = scanHistory.map(item => `
    <li class="${item.valid ? 'valid' : 'invalid'}">
      <span class="history-status">${item.valid ? '✓' : '✗'}</span>
      <span class="history-name">${item.result.attendee_name || item.result.code}</span>
      <span class="history-time">${item.time}</span>
    </li>
  `).join('');
}

function playSound(type) {
  // Audio feedback for scanning
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (type === 'success') {
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;
  } else {
    oscillator.frequency.value = 300;
    gainNode.gain.value = 0.1;
  }
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.15);
}

document.getElementById('qr-input')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') verifyTicket();
});

// Initialize
loadEvents();
