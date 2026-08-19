const demoEvents = [
  {
    id: 1,
    title: "AI Study Jam",
    description: "A practical student session for experimenting with AI tools and sharing useful workflows.",
    category: "Technology",
    location: "New Campus Lab",
    startsAt: "2026-09-12T15:00",
    capacity: 30,
    registered: 18
  },
  {
    id: 2,
    title: "CV Review Session",
    description: "Bring your CV and get quick feedback before internship and graduate job applications.",
    category: "Career",
    location: "Career Center",
    startsAt: "2026-09-18T12:30",
    capacity: 20,
    registered: 20
  },
  {
    id: 3,
    title: "Design for Developers",
    description: "An introduction to simple design decisions that make student projects easier to use.",
    category: "Design",
    location: "Engineering Hall",
    startsAt: "2026-09-24T14:00",
    capacity: 25,
    registered: 11
  }
];

const savedEvents = localStorage.getItem("campusflow-events");

Vue.createApp({
  data() {
    return {
      events: savedEvents ? JSON.parse(savedEvents) : structuredClone(demoEvents),
      search: "",
      category: "all",
      status: "all",
      categories: ["Technology", "Career", "Design", "Community"],
      showCreate: false,
      showRegister: false,
      selectedEvent: null,
      message: "",
      messageTimer: null,
      newEvent: {
        title: "",
        description: "",
        category: "Technology",
        location: "",
        startsAt: "",
        capacity: 30
      },
      registration: {
        name: "",
        email: ""
      }
    };
  },

  computed: {
    filteredEvents() {
      const query = this.search.toLowerCase();

      return this.events.filter((event) => {
        const matchesSearch = [event.title, event.description, event.location]
          .some((value) => value.toLowerCase().includes(query));

        const matchesCategory = this.category === "all" || event.category === this.category;
        const isFull = this.spotsLeft(event) === 0;
        const matchesStatus = this.status === "all"
          || (this.status === "full" && isFull)
          || (this.status === "available" && !isFull);

        return matchesSearch && matchesCategory && matchesStatus;
      });
    },

    availableEvents() {
      return this.events.filter((event) => this.spotsLeft(event) > 0).length;
    },

    totalRegistrations() {
      return this.events.reduce((total, event) => total + event.registered, 0);
    },

    occupancyRate() {
      const totalCapacity = this.events.reduce((total, event) => total + event.capacity, 0);
      if (totalCapacity === 0) return 0;
      return Math.round((this.totalRegistrations / totalCapacity) * 100);
    }
  },

  methods: {
    spotsLeft(event) {
      return Math.max(event.capacity - event.registered, 0);
    },

    occupancy(event) {
      return Math.min(Math.round((event.registered / event.capacity) * 100), 100);
    },

    createEvent() {
      this.events.unshift({
        id: Date.now(),
        title: this.newEvent.title,
        description: this.newEvent.description,
        category: this.newEvent.category,
        location: this.newEvent.location,
        startsAt: this.newEvent.startsAt,
        capacity: Number(this.newEvent.capacity),
        registered: 0
      });

      this.saveEvents();
      this.showCreate = false;
      this.newEvent = {
        title: "",
        description: "",
        category: "Technology",
        location: "",
        startsAt: "",
        capacity: 30
      };
      this.showMessage("Event created.");
    },

    openRegistration(event) {
      if (this.spotsLeft(event) === 0) return;
      this.selectedEvent = event;
      this.registration = { name: "", email: "" };
      this.showRegister = true;
    },

    closeRegistration() {
      this.showRegister = false;
      this.selectedEvent = null;
    },

    registerForEvent() {
      if (!this.selectedEvent || this.spotsLeft(this.selectedEvent) === 0) return;

      this.selectedEvent.registered += 1;
      const eventTitle = this.selectedEvent.title;
      this.saveEvents();
      this.closeRegistration();
      this.showMessage(`Registered for ${eventTitle}.`);
    },

    resetDemo() {
      this.events = structuredClone(demoEvents);
      this.search = "";
      this.category = "all";
      this.status = "all";
      this.saveEvents();
      this.showMessage("Demo data reset.");
    },

    saveEvents() {
      localStorage.setItem("campusflow-events", JSON.stringify(this.events));
    },

    formatDate(value) {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(new Date(value));
    },

    formatTime(value) {
      return new Intl.DateTimeFormat("en", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(value));
    },

    showMessage(text) {
      clearTimeout(this.messageTimer);
      this.message = text;
      this.messageTimer = setTimeout(() => {
        this.message = "";
      }, 3000);
    }
  }
}).mount("#app");
