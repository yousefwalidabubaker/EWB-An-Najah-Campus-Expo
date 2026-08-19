# CampusFlow

CampusFlow is a small frontend web app for discovering and managing university events.

I wanted the project to solve a simple campus problem: students often hear about workshops and events in different places, while organizers need an easy way to see capacity and registrations. CampusFlow puts those basic actions in one dashboard.

## Live Demo

https://yousefwalidabubaker.github.io/CampusFlow/

## Features

- Browse university events in a responsive card layout
- Search by title, description, or location
- Filter events by category and seat availability
- Create a new event from a form
- Register for an event and see the seat count update immediately
- Dashboard statistics that update when the data changes
- Local storage so changes remain after refreshing the page
- Reset button to restore the original demo data

## Built With

- HTML
- CSS
- JavaScript
- Vue 3
- Browser Local Storage
- GitHub Pages

## Project Structure

```text
CampusFlow/
├── index.html
└── src/
    ├── app.js
    └── styles.css
```

## What I Practiced

This project helped me practice the frontend fundamentals I want to keep improving:

- Vue state and computed values
- Event handling with buttons and forms
- Conditional rendering and list rendering
- Search and filtering logic
- Form validation
- Updating the interface when data changes
- Saving data in local storage
- Responsive CSS

## Run Locally

Clone the repository and open `index.html` in a browser. You can also use a local extension such as Live Server in VS Code.

```bash
git clone https://github.com/yousefwalidabubaker/CampusFlow.git
cd CampusFlow
```

No backend or database setup is required for this version.
