const initialBooths = [
  { id: 1, title: "Solar Water Monitor", team: "Civil & Energy Team", category: "Sustainability" },
  { id: 2, title: "Smart Cane Prototype", team: "Assistive Tech Group", category: "Technology" },
  { id: 3, title: "Low-Cost Greywater Filter", team: "Water Project Team", category: "Sustainability" },
  { id: 4, title: "Bridge Model Challenge", team: "Structural Students", category: "Engineering" },
  { id: 5, title: "Community Mapping Board", team: "EWB Volunteers", category: "Community" },
  { id: 6, title: "Arduino Safety Alarm", team: "First-Year Makers", category: "Technology" }
];

const MAX_VISITOR_SEATS = 180;
const MAX_BOOTHS = 12;

function readStoredNumber(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;

  const value = Number(stored);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readStoredBooths() {
  try {
    const saved = JSON.parse(localStorage.getItem("ewb-expo-booths"));
    return Array.isArray(saved) && saved.length ? saved : structuredClone(initialBooths);
  } catch {
    return structuredClone(initialBooths);
  }
}

Vue.createApp({
  data() {
    return {
      categories: ["Engineering", "Technology", "Sustainability", "Community"],
      booths: readStoredBooths(),
      visitorCount: readStoredNumber("ewb-expo-visitors", 96),
      boothSearch: "",
      boothCategory: "all",
      activeForm: "visitor",
      message: "",
      visitor: {
        name: "",
        email: "",
        slot: "10:00",
        seats: 1
      },
      boothForm: {
        team: "",
        title: "",
        category: "Engineering",
        members: 2,
        summary: ""
      }
    };
  },

  computed: {
    filteredBooths() {
      const query = this.boothSearch.toLowerCase();

      return this.booths.filter((booth) => {
        const matchesText = [booth.title, booth.team]
          .some((value) => value.toLowerCase().includes(query));
        const matchesCategory = this.boothCategory === "all" || booth.category === this.boothCategory;
        return matchesText && matchesCategory;
      });
    },

    visitorSpotsLeft() {
      return Math.max(MAX_VISITOR_SEATS - this.visitorCount, 0);
    },

    boothSpotsLeft() {
      return Math.max(MAX_BOOTHS - this.booths.length, 0);
    }
  },

  methods: {
    reserveVisitor() {
      const seats = Number(this.visitor.seats);

      if (!Number.isInteger(seats) || seats < 1 || seats > 4) {
        this.message = "Choose between 1 and 4 seats.";
        return;
      }

      if (seats > this.visitorSpotsLeft) {
        this.message = "There are not enough visitor seats left.";
        return;
      }

      this.visitorCount += seats;
      localStorage.setItem("ewb-expo-visitors", String(this.visitorCount));

      const name = this.visitor.name;
      this.visitor = { name: "", email: "", slot: "10:00", seats: 1 };
      this.message = `${name}, your ${seats === 1 ? "seat is" : "seats are"} reserved.`;
    },

    submitBooth() {
      if (this.boothSpotsLeft === 0) {
        this.message = "All booth spaces are currently taken.";
        return;
      }

      const nextId = this.booths.reduce((highest, booth) => Math.max(highest, Number(booth.id)), 0) + 1;

      this.booths.push({
        id: nextId,
        title: this.boothForm.title,
        team: this.boothForm.team,
        category: this.boothForm.category,
        members: Number(this.boothForm.members),
        summary: this.boothForm.summary
      });

      localStorage.setItem("ewb-expo-booths", JSON.stringify(this.booths));
      const projectTitle = this.boothForm.title;
      this.boothForm = {
        team: "",
        title: "",
        category: "Engineering",
        members: 2,
        summary: ""
      };
      this.message = `${projectTitle} was added to the booth list.`;
    },

    resetDemo() {
      this.booths = structuredClone(initialBooths);
      this.visitorCount = 96;
      this.boothSearch = "";
      this.boothCategory = "all";
      this.activeForm = "visitor";
      this.message = "Sample data restored.";
      localStorage.removeItem("ewb-expo-booths");
      localStorage.removeItem("ewb-expo-visitors");
    }
  }
}).mount("#app");
