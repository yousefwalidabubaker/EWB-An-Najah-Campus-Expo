const elements = {
  eventsGrid: document.querySelector("#eventsGrid"),
  emptyState: document.querySelector("#emptyState"),
  resultCount: document.querySelector("#resultCount"),
  filterForm: document.querySelector("#filterForm"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  createDialog: document.querySelector("#createDialog"),
  registerDialog: document.querySelector("#registerDialog"),
  createEventForm: document.querySelector("#createEventForm"),
  registrationForm: document.querySelector("#registrationForm"),
  registrationTitle: document.querySelector("#registrationTitle"),
  toast: document.querySelector("#toast")
};

let events = [];
let searchTimer;

document.querySelector("#openCreateButton").addEventListener("click", () => {
  elements.createDialog.showModal();
});

document.querySelectorAll("[dataClose]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.close}`).close();
  });
});

elements.filterForm.addEventListener("submit", (event) => event.preventDefault());
elements.searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadEvents, 250);
});
elements.categoryFilter.addEventListener("change", loadEvents);
elements.statusFilter.addEventListener("change", loadEvents);

elements.createEventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.createEventForm);
  const payload = Object.fromEntries(formData.entries());
  payload.startsAt = new Date(payload.startsAt).toISOString();
  payload.capacity = Number(payload.capacity);

  try {
    await request("/api/events", { method: "POST", body: payload });
    elements.createEventForm.reset();
    elements.createDialog.close();
    showToast("Event created successfully.");
    await refreshPageData();
  } catch (error) {
    showToast(error.message, true);
  }
});

elements.registrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.registrationForm);
  const eventId = formData.get("eventId");

  try {
    await request(`/api/events/${eventId}/registrations`, {
      method: "POST",
      body: {
        name: formData.get("name"),
        email: formData.get("email")
      }
    });
    elements.registrationForm.reset();
    elements.registerDialog.close();
    showToast("Your seat is confirmed.");
    await refreshPageData();
  } catch (error) {
    showToast(error.message, true);
  }
});

async function refreshPageData() {
  await Promise.all([loadDashboard(), loadEvents()]);
}

async function loadDashboard() {
  try {
    const { data } = await request("/api/dashboard");
    document.querySelector("#totalEvents").textContent = data.totalEvents;
    document.querySelector("#upcomingEvents").textContent = data.upcomingEvents;
    document.querySelector("#totalRegistrations").textContent = data.totalRegistrations;
    document.querySelector("#occupancyRate").textContent = data.occupancyRate;
  } catch (error) {
    showToast(error.message, true);
  }
}

async function loadEvents() {
  const parameters = new URLSearchParams();
  if (elements.searchInput.value.trim()) {
    parameters.set("search", elements.searchInput.value.trim());
  }
  if (elements.categoryFilter.value) {
    parameters.set("category", elements.categoryFilter.value);
  }
  if (elements.statusFilter.value) {
    parameters.set("status", elements.statusFilter.value);
  }

  try {
    const response = await request(`/api/events?${parameters.toString()}`);
    events = response.data;
    renderEvents();
  } catch (error) {
    showToast(error.message, true);
  }
}

function renderEvents() {
  elements.eventsGrid.replaceChildren();
  elements.resultCount.textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
  elements.emptyState.hidden = events.length > 0;

  for (const event of events) {
    const occupancy = Math.min(Math.round((event.registrationCount / event.capacity) * 100), 100);
    const isFull = event.spotsLeft === 0;
    const card = document.createElement("article");
    card.className = "eventCard";
    card.innerHTML = `
      <div class="cardTop">
        <span class="categoryTag">${escapeHtml(event.category)}</span>
        <span class="dateText">${formatDate(event.startsAt)}</span>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      <p class="eventDescription">${escapeHtml(event.description)}</p>
      <div class="eventMeta">
        <span>${escapeHtml(event.location)}</span>
        <span>${formatTime(event.startsAt)}</span>
      </div>
      <div class="capacityRow">
        <span>${event.registrationCount} registered</span>
        <span>${event.spotsLeft} spots left</span>
      </div>
      <div class="progressTrack" aria-label="${occupancy}% full">
        <div class="progressBar" style="width: ${occupancy}%"></div>
      </div>
      <button class="primaryButton" type="button" ${isFull ? "disabled" : ""}>
        ${isFull ? "Event full" : "Register"}
      </button>
    `;

    const registerButton = card.querySelector("button");
    if (!isFull) {
      registerButton.addEventListener("click", () => openRegistration(event));
    }
    elements.eventsGrid.append(card);
  }
}

function openRegistration(event) {
  elements.registrationTitle.textContent = event.title;
  elements.registrationForm.elements.eventId.value = event.id;
  elements.registerDialog.showModal();
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();
  if (!response.ok) {
    const details = payload.error?.details?.join(" ");
    throw new Error(details || payload.error?.message || "Request failed.");
  }
  return payload;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en", { weekday: "short", hour: "numeric", minute: "2-digit" })
    .format(new Date(value));
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value);
  return element.innerHTML;
}

let toastTimer;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.classList.add("visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 3500);
}

refreshPageData();
