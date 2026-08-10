import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

const demoEvents = [
  {
    title: "Full Stack Foundations",
    description: "A practical workshop covering browser fundamentals, REST APIs, and database design.",
    category: "Technology",
    location: "New Campus Lab 2",
    startsAt: "2027-03-12T14:00:00.000Z",
    capacity: 40
  },
  {
    title: "Career Ready Tech",
    description: "A career session focused on technical portfolios, interviews, and professional communication.",
    category: "Career",
    location: "Faculty Auditorium",
    startsAt: "2027-03-20T11:00:00.000Z",
    capacity: 80
  },
  {
    title: "Responsible AI Workshop",
    description: "An interactive introduction to responsible AI principles and practical product decisions.",
    category: "Technology",
    location: "Innovation Hub",
    startsAt: "2027-04-02T13:30:00.000Z",
    capacity: 50
  }
];

export function createDatabase(filename = process.env.DATABASE_FILE || "campusflow.db", options = {}) {
  const database = new Database(filename);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");
  database.exec(schema);

  if (options.seed !== false) {
    seedDatabase(database);
  }

  return database;
}

function seedDatabase(database) {
  const { count } = database.prepare("SELECT COUNT(*) AS count FROM events").get();
  if (count > 0) {
    return;
  }

  const insertEvent = database.prepare(`
    INSERT INTO events (title, description, category, location, starts_at, capacity)
    VALUES (@title, @description, @category, @location, @startsAt, @capacity)
  `);

  const insertAll = database.transaction((events) => {
    for (const event of events) {
      insertEvent.run(event);
    }
  });

  insertAll(demoEvents);
}
