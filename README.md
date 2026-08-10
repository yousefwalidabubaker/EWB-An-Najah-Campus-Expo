# CampusFlow

CampusFlow is a full stack web application for managing university workshops, events, registrations, and capacity from one dashboard.

The workflow is based on practical problems I encountered while coordinating student programs and technical events. Organizers need a clear view of attendance, students need a simple registration experience, and capacity rules must remain reliable when several people register.

## What it includes

* Responsive event dashboard built with semantic HTML and modern CSS
* Vanilla JavaScript frontend with search, filtering, forms, dialogs, and live updates
* REST API built with Node.js and Express
* SQLite persistence with foreign keys, constraints, transactions, and indexes
* Event creation, editing, deletion, search, and status filtering
* Registration workflow with duplicate prevention and capacity protection
* Dashboard metrics for events, registrations, and occupancy
* Central validation, structured errors, secure HTTP headers, and request size limits
* Integration tests using the Node.js test runner and real HTTP requests

## Technology

| Layer | Tools |
| --- | --- |
| Interface | HTML, CSS, JavaScript |
| Server | Node.js, Express |
| Database | SQLite, SQL, better sqlite3 |
| Security | Helmet, input validation, parameterized queries |
| Testing | Node.js test runner, Assert, Fetch API |

## Architecture

```text
Browser interface
      |
Express REST API
      |
Validation and business rules
      |
SQLite database
```

The browser communicates only through JSON endpoints. The API owns validation, capacity checks, duplicate prevention, and database operations. SQLite constraints provide a second layer of protection for data integrity.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm start
```

Open `http://localhost:3000`.

The database is created automatically and includes three clearly labeled demo events on the first run.

## Run the tests

```bash
npm test
```

The test suite starts the real Express application with an isolated in memory database. It verifies health checks, event creation, validation, registration limits, duplicate prevention, dashboard calculations, and safe capacity updates.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status |
| GET | `/api/dashboard` | Summary metrics |
| GET | `/api/events` | Search and filter events |
| GET | `/api/events/:id` | Retrieve one event |
| POST | `/api/events` | Create an event |
| PATCH | `/api/events/:id` | Update an event |
| DELETE | `/api/events/:id` | Delete an event |
| GET | `/api/events/:id/registrations` | List registrations |
| POST | `/api/events/:id/registrations` | Reserve a seat |
| DELETE | `/api/events/:eventId/registrations/:registrationId` | Cancel a registration |

Event list filters include `search`, `category`, and `status`. Supported status values are `upcoming`, `available`, `full`, and `past`.

## Engineering decisions

* Registration and capacity checks run inside a database transaction.
* Emails are normalized before storage and protected by a unique database constraint.
* SQL statements use parameters instead of building queries from untrusted values.
* Frontend content is escaped before it enters rendered event cards.
* Static routes expose only the three browser files, not server source or database files.
* Error responses use a consistent JSON structure that the interface can display.

## Project background

I am a fourth year Computer Science student at An Najah National University. CampusFlow connects my software engineering studies with my experience coordinating university workshops, capacity building programs, and student technology events.

Built by Yousef AbuBaker.
