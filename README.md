# GoGoStudy API

GoGoStudy backend API for authentication, user management, studies, and attendance tracking.

## Requirements
- Node.js 18+
- PostgreSQL
- Redis

## Setup
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```
2. Fill in required values in `.env`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Run
- Dev server:
  ```bash
  npm run dev
  ```
- Build:
  ```bash
  npm run build
  npm start
  ```

## Seed
```bash
npm run seed
```
- Seeds 20 users, 10 studies, 200 study members, and 600 attendance records.

## API Docs
- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/docs.json`

## Postman
- Collection file: `docs/postman-collection.json`
- Variables:
  - `BASE_URL` (default `http://localhost:8080`)
  - `ACCESS_TOKEN`
  - `REFRESH_TOKEN`

## Tests
```bash
npm test
```
- e2e: `tests/e2e/auth.test.js`, `tests/e2e/study-attendance.test.js`
- unit: `tests/unit/auth.service.test.js`

## Roles
- `USER`: default role
- `ADMIN`: admin routes under `/admin/users`

## Team
- Auth/Users/Infra: A
- Seed/Test/Docs/Swagger/Postman: A
