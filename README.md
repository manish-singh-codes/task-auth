# Auth Service

Node.js + TypeScript + Express API with JWT auth, PostgreSQL (Prisma) and a Redis-backed login rate limiter.

## Setup

```bash
npm install
docker compose up -d                 # postgres + redis
cp .env.example .env                 # already copied, edit JWT_SECRET
npx prisma migrate dev --name init   # creates the users table
npm run dev
```

## Endpoints

| Method | Path               | Auth | Description                  |
|--------|--------------------|------|------------------------------|
| POST   | /api/auth/register | no   | create account               |
| POST   | /api/auth/login    | no   | login (rate limited by IP)   |
| GET    | /api/users/me      | JWT  | current user                 |
| GET    | /api/users         | JWT  | list users (latest 50)       |
| GET    | /health            | no   | service + redis status       |

## Try it

```bash
curl -X POST localhost:3000/api/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'

curl -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"secret123"}'

curl localhost:3000/api/users/me -H "Authorization: Bearer <token>"
```

## Rate limiting

- Key `rl:login:attempts:<ip>` is `INCR`ed on each login request; its TTL (60s) is the window.
- The 6th request in the window sets `rl:login:block:<ip>` with a 5 minute TTL and returns `429` with a `Retry-After` header.
- While the block key exists, every login request from that IP gets `429` without touching the database.
- Everything expires through Redis TTL, no cleanup job needed.
- If Redis is down the limiter logs a warning and lets the request through (fail-open).

Window, limit and block duration are configurable via env vars.

## Structure

```
src/
  config/        env validation, prisma client, redis client
  middlewares/   authenticate, loginRateLimiter, validate, errorHandler
  modules/
    auth/        routes, controller, service, zod schemas
    users/       protected routes
  utils/         jwt, AppError, asyncHandler
prisma/schema.prisma
```
