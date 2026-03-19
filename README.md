# Bible Memory Website

First iteration of a Bible memory web app with Angular 19 frontend and Spring Boot backend. Features user authentication, profiles, verse collections, typing practice with green/red feedback, and spaced repetition.

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

Set `ESV_API_KEY` in your system environment variables (Windows: System Properties → Environment Variables) for ESV verse lookup. **Restart Cursor/your terminal** after adding it so the new variable is picked up.

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
ng serve
```

Frontend runs at `http://localhost:4200`. Open this URL in your browser.

### 5. Production Build

Build Angular and serve from Spring Boot:

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

## License

See project plan for ESV API citation and copyright requirements.
