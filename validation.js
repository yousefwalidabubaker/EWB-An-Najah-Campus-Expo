export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

const categories = new Set(["Technology", "Career", "Design", "Community"]);

export function validateEvent(payload) {
  const event = {
    title: cleanText(payload.title),
    description: cleanText(payload.description),
    category: cleanText(payload.category),
    location: cleanText(payload.location),
    startsAt: cleanText(payload.startsAt),
    capacity: Number(payload.capacity)
  };

  const errors = [];
  if (event.title.length < 3 || event.title.length > 100) {
    errors.push("Title must contain between 3 and 100 characters.");
  }
  if (event.description.length < 10 || event.description.length > 1000) {
    errors.push("Description must contain between 10 and 1000 characters.");
  }
  if (!categories.has(event.category)) {
    errors.push("Choose a valid event category.");
  }
  if (event.location.length < 2 || event.location.length > 100) {
    errors.push("Location must contain between 2 and 100 characters.");
  }
  if (!isValidDate(event.startsAt)) {
    errors.push("Start date must be a valid date and time.");
  }
  if (!Number.isInteger(event.capacity) || event.capacity < 1 || event.capacity > 500) {
    errors.push("Capacity must be an integer between 1 and 500.");
  }

  if (errors.length > 0) {
    throw new ValidationError("Event validation failed.", errors);
  }

  event.startsAt = new Date(event.startsAt).toISOString();
  return event;
}

export function validateRegistration(payload) {
  const registration = {
    name: cleanText(payload.name),
    email: cleanText(payload.email).toLowerCase()
  };

  const errors = [];
  if (registration.name.length < 2 || registration.name.length > 80) {
    errors.push("Name must contain between 2 and 80 characters.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email)) {
    errors.push("Enter a valid email address.");
  }

  if (errors.length > 0) {
    throw new ValidationError("Registration validation failed.", errors);
  }

  return registration;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isValidDate(value) {
  return value.length > 0 && !Number.isNaN(Date.parse(value));
}
