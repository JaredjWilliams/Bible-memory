# Bible Memory Frontend

React (Vite + TypeScript) frontend for the Bible Memory app. Uses Radix UI components, Tailwind CSS, and React Router.

## Prerequisites

- Node.js 18+ and npm
- Backend running at `http://localhost:8080` (for API calls)

## Development

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api` and `/actuator` to the backend.

## Production Build

```bash
npm run build
```

Output goes to `backend/src/main/resources/static/`. Run the Spring Boot backend to serve the built app.

## Environment

- `VITE_API_BASE` – Override API base URL (default: empty, uses proxy in dev)

## Design

Original Figma design: https://www.figma.com/design/MTkK9rfBRIpJXJXmvBBtNW/Bible-Memory-UI-Design
