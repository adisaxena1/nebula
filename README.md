# Campus Event Ticketing + QR System

A complete event management solution that allows organizers to create events, sell or distribute tickets, and generate unique QR-based passes. During entry, QR scanning verifies authenticity and updates attendance in real-time.

## Features

### Event Management
- Create and manage events with categories (Concert, Workshop, Sports, Seminar, Party)
- Set capacity limits and pricing
- Edit or cancel events
- Filter and search events

### Ticketing
- Generate unique QR code tickets
- Multiple ticket types (Standard, VIP, Student)
- Email-based ticket lookup
- Downloadable ticket images
- Attendee registration with name, email, phone

### QR Scanner
- Camera-based QR code scanning
- Manual code entry option
- Multiple gate support (Main, VIP, Staff, Side)
- Real-time verification with audio feedback
- Scan history log
- Duplicate entry prevention

### Admin Dashboard
- Overview statistics (events, tickets, revenue, check-ins)
- Event analytics with:
  - Peak entry time detection
  - Hourly entry distribution chart
  - Gate distribution tracking
  - Recent entries log
  - Attendance rate metrics
- Attendee management per event

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla), Vite
- **Backend:** Node.js, Express
- **Database:** LowDB (JSON file-based)
- **QR Generation:** qrcode library
- **QR Scanning:** html5-qrcode library

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the backend server:
```bash
npm run server
```

3. In a new terminal, start the frontend:
```bash
npm run dev
```

4. Open http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/events | Get all active events |
| GET | /api/events/:id | Get single event |
| POST | /api/events | Create new event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |
| POST | /api/tickets | Book a ticket |
| GET | /api/tickets/user/:email | Get user's tickets |
| GET | /api/tickets/:code | Get ticket by code |
| POST | /api/verify | Verify and check-in ticket |
| GET | /api/stats | Get all event statistics |
| GET | /api/stats/:eventId | Get detailed event analytics |
| GET | /api/events/:eventId/attendees | Get event attendees |
| GET | /api/dashboard | Get dashboard overview |

## Usage

### For Organizers (Admin)
1. Go to Admin tab
2. Create events with details
3. Monitor ticket sales and attendance
4. View analytics for insights

### For Attendees
1. Browse available events
2. Click "Get Ticket" to book
3. Enter your details
4. Save/download QR code for entry

### For Gate Staff (Scanner)
1. Go to Scanner tab
2. Use camera or manual entry
3. Select entry gate
4. Scan tickets for verification

## Screenshots

The application includes:
- Event listing with category badges
- Ticket booking modal with QR generation
- Admin dashboard with statistics
- QR scanner with camera support
- Analytics dashboard with charts

## License

MIT

## Tech Stack

- Frontend: Vanilla JS + Vite
- Backend: Express.js
- Database: SQLite (better-sqlite3)
- QR Generation: qrcode library
