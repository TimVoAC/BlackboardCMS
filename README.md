# CampusBoard

CampusBoard is a Next.js college CMS inspired by Blackboard, designed for school operations across registration, teaching, and learning.

## Database Choice

This project uses PostgreSQL with Prisma. PostgreSQL is the best fit because registration, enrollment, teaching assignments, grades, submissions, schedules, and permissions are relational, transaction-heavy, and audit-sensitive.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Create the database schema:

```bash
npm run prisma:migrate
```

5. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Run With Docker

Build and start the full stack:

```bash
docker compose up --build
```

This starts:

- `campusboard-web`: the production Next.js web server on port `3000`
- `campusboard-postgres`: PostgreSQL 16 on port `5432`
- Prisma migrations on app startup
- Optional seed data when `SEED_DATABASE=true`

Open http://localhost:3000.

Stop the stack:

```bash
docker compose down
```

Remove the database volume and start fresh:

```bash
docker compose down -v
```

## Included Modules

- Institution dashboard
- Student registration planner
- Teaching workspace
- Learning activity stream
- Gradebook overview
- Administrative approvals
- PostgreSQL/Prisma schema for users, programs, terms, courses, sections, enrollments, assignments, submissions, grades, attendance, announcements, discussions, and audit logs
