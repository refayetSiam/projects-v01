# NOVION Natural Asset Management System

A React-based web application for managing natural assets and capital planning.

## Features

- **Asset Management**: Track forests, wetlands, urban trees, and grasslands
- **Project Management**: Create and manage capital improvement projects
- **Action Planning**: Schedule and track maintenance activities with cost modeling
- **Capital Planning**: Generate 10-year capital expenditure forecasts
- **Data-Driven**: All data stored in CSV files for easy management

## Project Structure

```
projects-v01/
├── src/
│   ├── App.js              # Main application component
│   ├── index.js            # React entry point
│   └── utils/
│       └── csvLoader.js    # CSV data loading utilities
├── public/
│   ├── index.html          # HTML template
│   └── data/               # CSV data files
│       ├── asset-types.csv
│       ├── assets.csv
│       ├── cost-database.csv
│       ├── projects.csv
│       ├── actions.csv
│       ├── audit-trail.csv
│       ├── teams.csv
│       └── regions.csv
└── package.json

```

## Data Files

### asset-types.csv
Defines the types of natural assets (FRT-Forest, WTD-Wetland, UBT-Urban Trees, GRS-Grass)

### assets.csv  
Individual asset records with condition scores, locations, and lifecycle data

### cost-database.csv
Hierarchical maintenance action costs organized by asset class and type

### projects.csv
Capital improvement projects with status, timeline, and team assignments

### actions.csv
Specific maintenance actions linked to projects and assets

### teams.csv & regions.csv
Reference data for organizational teams and geographic regions

### audit-trail.csv
Change tracking for projects and actions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Data Management

To modify the data:
1. Edit the CSV files in the `public/data/` directory
2. Refresh the application to load the updated data
3. The application automatically parses and transforms the CSV data on startup

## Technologies Used

- React 18
- Lucide React (icons)
- Papa Parse (CSV parsing)
- Tailwind CSS (styling)

## Original Features Preserved

All functionality from the original Claude artifact has been preserved:
- Project and action management
- Recurring action generation
- Cost modeling and overrides
- Status tracking and completion calculation
- Export functionality
- Audit trail
- Archive system