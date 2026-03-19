# Bible Memory Website

First iteration of a Bible memory web app with React (Vite) frontend and Spring Boot backend. Features user authentication, profiles, verse collections, typing practice with green/red feedback, and spaced repetition.

## Prerequisites

- Java 17+
- Node.js 18+ and npm
- Docker and Docker Compose (for local PostgreSQL)
- Maven 3.8+

## Quick Start

### 1. Database

Start PostgreSQL with Docker Compose:

```bash
docker-compose up -d
```

### 2. Environment

The backend requires `ESV_API_KEY` for Bible text lookup. Set it in your environment (or in `.env` in the backend directory):

- **Obtain a key**: https://api.esv.org/account/create-application/
- **Backend**: Set `ESV_API_KEY` in the backend environment (system env vars or `.env`). **Restart Cursor/your terminal** after adding it so the new variable is picked up.
- See `.env.example` for a template.

### 3. Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`.

### 4. Frontend (development)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. The Vite dev server proxies `/api` and `/actuator` to the backend at `http://localhost:8080`. **Start the backend first** so API calls work.

### 5. Production Build

Build React and serve from Spring Boot:

```bash
cd frontend
npm run build
```

The build output goes to `backend/src/main/resources/static/`. Then run:

```bash
cd backend
mvn spring-boot:run
```

Access the full site at `http://localhost:8080`.

## API

- Health: `GET /actuator/health`
- All other endpoints under `/api/*` (see plan for details)
- `/api/passages` and all `/api/**` routes require JWT authentication (login required).

## ESV API Notes

- **Rate limits**: The ESV API has usage limits for non-commercial use. Consider adding backend caching (e.g. up to 500 verses) in the future to reduce API calls.

## License

See project plan for ESV API citation and copyright requirements.
