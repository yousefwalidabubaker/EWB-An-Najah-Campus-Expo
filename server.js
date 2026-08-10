import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createDatabase } from "./database.js";
import { ValidationError, validateEvent, validateRegistration } from "./validation.js";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createApp(database = createDatabase()) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));

  app.get("/", (request, response) => response.sendFile(path.join(projectRoot, "index.html")));
  app.get("/styles.css", (request, response) => response.sendFile(path.join(projectRoot, "styles.css")));
  app.get("/app.js", (request, response) => response.sendFile(path.join(projectRoot, "app.js")));

  app.get("/api/health", (request, response) => {
    response.json({ status: "ok", service: "CampusFlow" });
  });

  app.get("/api/dashboard", (request, response) => {
    const eventMetrics = database.prepare(`
      SELECT
        COUNT(*) AS total_events,
        SUM(CASE WHEN datetime(starts_at) >= datetime('now') THEN 1 ELSE 0 END) AS upcoming_events,
        COALESCE(SUM(capacity), 0) AS total_capacity
      FROM events
    `).get();
    const { total_registrations } = database.prepare(`
      SELECT COUNT(*) AS total_registrations FROM registrations
    `).get();
    const occupancyRate = eventMetrics.total_capacity === 0
      ? 0
      : Math.round((total_registrations / eventMetrics.total_capacity) * 100);

    response.json({
      data: {
        totalEvents: eventMetrics.total_events,
        upcomingEvents: eventMetrics.upcoming_events || 0,
        totalRegistrations: total_registrations,
        occupancyRate
      }
    });
  });

  app.get("/api/events", (request, response) => {
    const search = typeof request.query.search === "string" ? request.query.search.trim().toLowerCase() : "";
    const category = typeof request.query.category === "string" ? request.query.category.trim() : "";
    const status = typeof request.query.status === "string" ? request.query.status.trim() : "";
    const where = [];
    const parameters = [];

    if (search) {
      where.push("(lower(e.title) LIKE ? OR lower(e.description) LIKE ? OR lower(e.location) LIKE ?)");
      const searchValue = `%${search}%`;
      parameters.push(searchValue, searchValue, searchValue);
    }
    if (category) {
      where.push("e.category = ?");
      parameters.push(category);
    }
    if (status === "upcoming") {
      where.push("datetime(e.starts_at) >= datetime('now')");
    }
    if (status === "past") {
      where.push("datetime(e.starts_at) < datetime('now')");
    }

    let query = eventSelectSql();
    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }
    query += " GROUP BY e.id";
    if (status === "available") {
      query += " HAVING COUNT(r.id) < e.capacity AND datetime(e.starts_at) >= datetime('now')";
    }
    if (status === "full") {
      query += " HAVING COUNT(r.id) >= e.capacity";
    }
    query += " ORDER BY datetime(e.starts_at) ASC, e.id ASC";

    const events = database.prepare(query).all(...parameters).map(mapEvent);
    response.json({ data: events, count: events.length });
  });

  app.get("/api/events/:id", (request, response) => {
    response.json({ data: findEvent(database, request.params.id) });
  });

  app.post("/api/events", (request, response) => {
    const event = validateEvent(request.body);
    const result = database.prepare(`
      INSERT INTO events (title, description, category, location, starts_at, capacity)
      VALUES (@title, @description, @category, @location, @startsAt, @capacity)
    `).run(event);

    response.status(201).json({ data: findEvent(database, result.lastInsertRowid) });
  });

  app.patch("/api/events/:id", (request, response) => {
    const current = findEvent(database, request.params.id);
    const event = validateEvent({
      title: request.body.title ?? current.title,
      description: request.body.description ?? current.description,
      category: request.body.category ?? current.category,
      location: request.body.location ?? current.location,
      startsAt: request.body.startsAt ?? current.startsAt,
      capacity: request.body.capacity ?? current.capacity
    });

    if (event.capacity < current.registrationCount) {
      throw new HttpError(409, "Capacity cannot be lower than the current registration count.");
    }

    database.prepare(`
      UPDATE events
      SET title = @title,
          description = @description,
          category = @category,
          location = @location,
          starts_at = @startsAt,
          capacity = @capacity
      WHERE id = @id
    `).run({ ...event, id: Number(request.params.id) });

    response.json({ data: findEvent(database, request.params.id) });
  });

  app.delete("/api/events/:id", (request, response) => {
    findEvent(database, request.params.id);
    database.prepare("DELETE FROM events WHERE id = ?").run(Number(request.params.id));
    response.status(204).end();
  });

  app.get("/api/events/:id/registrations", (request, response) => {
    findEvent(database, request.params.id);
    const registrations = database.prepare(`
      SELECT id, event_id AS eventId, name, email, created_at AS createdAt
      FROM registrations
      WHERE event_id = ?
      ORDER BY datetime(created_at) ASC, id ASC
    `).all(Number(request.params.id));

    response.json({ data: registrations, count: registrations.length });
  });

  app.post("/api/events/:id/registrations", (request, response) => {
    const registration = validateRegistration(request.body);
    const eventId = Number(request.params.id);

    const register = database.transaction(() => {
      const event = findEvent(database, eventId);
      if (event.registrationCount >= event.capacity) {
        throw new HttpError(409, "This event has reached its capacity.");
      }

      try {
        const result = database.prepare(`
          INSERT INTO registrations (event_id, name, email)
          VALUES (?, ?, ?)
        `).run(eventId, registration.name, registration.email);

        return database.prepare(`
          SELECT id, event_id AS eventId, name, email, created_at AS createdAt
          FROM registrations
          WHERE id = ?
        `).get(result.lastInsertRowid);
      } catch (error) {
        if (String(error.code).startsWith("SQLITE_CONSTRAINT")) {
          throw new HttpError(409, "This email is already registered for the event.");
        }
        throw error;
      }
    });

    response.status(201).json({ data: register() });
  });

  app.delete("/api/events/:eventId/registrations/:registrationId", (request, response) => {
    const result = database.prepare(`
      DELETE FROM registrations WHERE id = ? AND event_id = ?
    `).run(Number(request.params.registrationId), Number(request.params.eventId));

    if (result.changes === 0) {
      throw new HttpError(404, "Registration not found.");
    }
    response.status(204).end();
  });

  app.use("/api", (request, response) => {
    response.status(404).json({ error: { message: "API route not found." } });
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }
    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: { message: error.message, details: error.details }
      });
    }
    if (error instanceof HttpError) {
      return response.status(error.status).json({ error: { message: error.message } });
    }

    console.error(error);
    return response.status(500).json({ error: { message: "Unexpected server error." } });
  });

  return app;
}

function eventSelectSql() {
  return `
    SELECT
      e.id,
      e.title,
      e.description,
      e.category,
      e.location,
      e.starts_at,
      e.capacity,
      e.created_at,
      COUNT(r.id) AS registration_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
  `;
}

function findEvent(database, id) {
  const row = database.prepare(`${eventSelectSql()} WHERE e.id = ? GROUP BY e.id`).get(Number(id));
  if (!row) {
    throw new HttpError(404, "Event not found.");
  }
  return mapEvent(row);
}

function mapEvent(row) {
  const registrationCount = Number(row.registration_count || 0);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    startsAt: row.starts_at,
    capacity: row.capacity,
    registrationCount,
    spotsLeft: Math.max(row.capacity - registrationCount, 0),
    createdAt: row.created_at
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3000;
  const app = createApp();
  app.listen(port, () => {
    console.log(`CampusFlow is running at http://localhost:${port}`);
  });
}
