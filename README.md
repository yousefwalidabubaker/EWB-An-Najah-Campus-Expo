# EWB Najah Campus Expo

A small frontend portal for a student engineering expo at An-Najah National University.

The idea came from my time working with Engineers Without Borders at An-Najah. I wanted one simple page where students could see who was exhibiting, check the day schedule, reserve visitor seats, or request a booth for a student project.

The event shown in the demo is dated **20 March 2025**.

## Live Demo

https://yousefwalidabubaker.github.io/CampusFlow/

## What it does

- Shows a directory of student project booths
- Searches booths by project or team name
- Filters booths by area
- Displays a simple expo schedule
- Lets visitors reserve between 1 and 4 seats
- Updates the remaining visitor seat count after a reservation
- Lets student teams submit a booth request
- Adds submitted booths directly to the directory
- Tracks the remaining booth spaces
- Keeps booth and reservation changes in browser local storage
- Restores the original sample data with a reset button

## Built with

- HTML
- CSS
- JavaScript
- Vue 3
- Browser Local Storage
- GitHub Pages

## Project structure

```text
CampusFlow/
├── index.html
└── src/
    ├── app.js
    └── styles.css
```

## Things I practiced

- Vue data and computed values
- Form handling and validation
- Button and input events
- Conditional rendering
- Rendering lists with `v-for`
- Search and filter logic
- Updating displayed information from user input
- Saving simple data in local storage
- Responsive CSS without a UI library

## Run locally

Clone the repository and open `index.html` with a local server such as Live Server in VS Code.

```bash
git clone https://github.com/yousefwalidabubaker/CampusFlow.git
cd CampusFlow
```

The project does not need a backend or database.
