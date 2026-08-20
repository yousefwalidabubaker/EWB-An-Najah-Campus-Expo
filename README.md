# EWB Campus Expo 2025

A multi-page frontend portal inspired by the real EWB Campus Expo held at An-Najah National University on **20 March 2025**.

I built the project around a simple idea: instead of putting everything on one long page, visitors can move through separate pages for the booth directory, schedule, reservations, and information about the expo.

## Live Demo

https://yousefwalidabubaker.github.io/EWB-An-Najah-Campus-Expo/

## Pages

- **Home** - event overview and links to the main parts of the portal
- **Booths** - searchable and filterable student project directory
- **Schedule** - a demo day plan for the expo portal
- **Reserve** - interactive visitor and exhibitor forms
- **About** - project story, real event date, and what I practiced

## Main features

- Searches booths by project or team name
- Filters booths by area
- Lets visitors reserve between 1 and 4 seats
- Updates remaining visitor seats after a reservation
- Lets student teams submit a booth request
- Adds submitted booths to the directory
- Tracks remaining booth spaces
- Saves demo changes in browser local storage
- Restores the sample data with a reset button
- Uses the same responsive navigation and visual identity across multiple pages

## Built with

- HTML
- CSS
- JavaScript
- Vue 3
- Browser Local Storage
- GitHub Pages

## Project structure

```text
EWB-An-Najah-Campus-Expo/
├── index.html
├── booths.html
├── schedule.html
├── reserve.html
├── about.html
└── src/
    ├── app.js
    └── styles.css
```

## Things I practiced

- Building a small multi-page website
- Vue data and computed values
- Form handling and validation
- Button and input events
- Conditional rendering
- Rendering lists with `v-for`
- Search and filter logic
- Updating displayed information from user input
- Saving simple data in local storage
- Responsive CSS without a UI library
- Keeping navigation and design consistent between pages

## Note about the data

The event name and date are real. The booth names, reservation numbers, and detailed schedule used in the website are demo data for the frontend project.

## Run locally

Clone the repository and open `index.html` with a local server such as Live Server in VS Code.

```bash
git clone https://github.com/yousefwalidabubaker/EWB-An-Najah-Campus-Expo.git
cd EWB-An-Najah-Campus-Expo
```

The project does not need a backend or database.
