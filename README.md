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
