import assert from "node:assert/strict";
import test from "node:test";
import { createDatabase } from "./database.js";
import { createApp } from "./server.js";

async function createTestServer(t) {
  const database = createDatabase(":memory:", { seed: false });
  const app = createApp(database);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));

  t.after(() => {
    server.close();
    database.close();
  });

  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function jsonRequest(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = response.status === 204 ? null : await response.json();
  return { response, payload };
}

const validEvent = {
  title: "Backend Engineering Workshop",
  description: "Build and test a small REST API with persistent data.",
  category: "Technology",
  location: "Computer Lab 1",
  startsAt: "2027-05-10T12:00:00.000Z",
  capacity: 2
};

test("health endpoint reports service status", async (t) => {
  const baseUrl = await createTestServer(t);
  const { response, payload } = await jsonRequest(baseUrl, "/api/health");

  assert.equal(response.status, 200);
  assert.deepEqual(payload, { status: "ok", service: "CampusFlow" });
});

test("event creation validates input and persists data", async (t) => {
  const baseUrl = await createTestServer(t);
  const created = await jsonRequest(baseUrl, "/api/events", { method: "POST", body: validEvent });

  assert.equal(created.response.status, 201);
  assert.equal(created.payload.data.title, validEvent.title);
  assert.equal(created.payload.data.spotsLeft, 2);

  const listed = await jsonRequest(baseUrl, "/api/events?status=upcoming");
  assert.equal(listed.response.status, 200);
  assert.equal(listed.payload.count, 1);
});

test("registration prevents duplicates and respects capacity", async (t) => {
  const baseUrl = await createTestServer(t);
  const created = await jsonRequest(baseUrl, "/api/events", { method: "POST", body: validEvent });
  const eventId = created.payload.data.id;

  const first = await jsonRequest(baseUrl, `/api/events/${eventId}/registrations`, {
    method: "POST",
    body: { name: "Yousef AbuBaker", email: "yousef@example.com" }
  });
  assert.equal(first.response.status, 201);

  const duplicate = await jsonRequest(baseUrl, `/api/events/${eventId}/registrations`, {
    method: "POST",
    body: { name: "Yousef AbuBaker", email: "yousef@example.com" }
  });
  assert.equal(duplicate.response.status, 409);

  const second = await jsonRequest(baseUrl, `/api/events/${eventId}/registrations`, {
    method: "POST",
    body: { name: "Second Student", email: "second@example.com" }
  });
  assert.equal(second.response.status, 201);

  const full = await jsonRequest(baseUrl, `/api/events/${eventId}/registrations`, {
    method: "POST",
    body: { name: "Third Student", email: "third@example.com" }
  });
  assert.equal(full.response.status, 409);

  const event = await jsonRequest(baseUrl, `/api/events/${eventId}`);
  assert.equal(event.payload.data.registrationCount, 2);
  assert.equal(event.payload.data.spotsLeft, 0);
});

test("dashboard calculates event and occupancy metrics", async (t) => {
  const baseUrl = await createTestServer(t);
  const created = await jsonRequest(baseUrl, "/api/events", { method: "POST", body: validEvent });
  await jsonRequest(baseUrl, `/api/events/${created.payload.data.id}/registrations`, {
    method: "POST",
    body: { name: "Registered Student", email: "student@example.com" }
  });

  const dashboard = await jsonRequest(baseUrl, "/api/dashboard");
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.payload.data.totalEvents, 1);
  assert.equal(dashboard.payload.data.upcomingEvents, 1);
  assert.equal(dashboard.payload.data.totalRegistrations, 1);
  assert.equal(dashboard.payload.data.occupancyRate, 50);
});

test("event updates protect existing registrations", async (t) => {
  const baseUrl = await createTestServer(t);
  const eventPayload = { ...validEvent, capacity: 3 };
  const created = await jsonRequest(baseUrl, "/api/events", { method: "POST", body: eventPayload });
  const eventId = created.payload.data.id;

  await jsonRequest(baseUrl, `/api/events/${eventId}/registrations`, {
    method: "POST",
    body: { name: "Student One", email: "one@example.com" }
  });
  await jsonRequest(baseUrl, `/api/events/${eventId}/registrations`, {
    method: "POST",
    body: { name: "Student Two", email: "two@example.com" }
  });

  const invalidUpdate = await jsonRequest(baseUrl, `/api/events/${eventId}`, {
    method: "PATCH",
    body: { capacity: 1 }
  });
  assert.equal(invalidUpdate.response.status, 409);

  const validUpdate = await jsonRequest(baseUrl, `/api/events/${eventId}`, {
    method: "PATCH",
    body: { capacity: 4, location: "Innovation Lab" }
  });
  assert.equal(validUpdate.response.status, 200);
  assert.equal(validUpdate.payload.data.capacity, 4);
  assert.equal(validUpdate.payload.data.location, "Innovation Lab");
});
