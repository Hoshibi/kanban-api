# Kanban Assessor API

> A RESTful API for the **Kanban Assessor** application — a platform for managing advisors, roles, and Kanban-based workflows.

---

## 🎯 Project Objective

This API serves as the backend for the **Kanban Assessor** system, designed to:

- **Manage advisors** (consultants, senior partners, admins) with role-based access control
- **Provide authentication & authorization** foundations (password hashing, JWT-ready)
- **Persist data** in a robust PostgreSQL database via Prisma ORM with native driver adapter
- **Expose a clean REST interface** for frontend integration (web/mobile)
- **Auto-generate OpenAPI documentation** via Swagger UI
- **Enable rapid development** with TypeScript, hot-reload, and Dockerized infra

---

## 🛠 Tech Stack

| Category          | Technology                          | Version |
|-------------------|-------------------------------------|---------|
| **Runtime**       | Node.js                             | 22+ (ESM) |
| **Language**      | TypeScript                          | 7.x     |
| **Framework**     | Express                             | 5.x     |
| **API Docs**      | swagger-jsdoc + swagger-ui-express  | Latest  |
| **ORM**           | Prisma Client / Prisma Migrate      | 7.x     |
| **DB Adapter**    | @prisma/adapter-pg (native driver)  | 7.x     |
| **Database**      | PostgreSQL                          | 17 (Docker) |
| **Package Manager**| pnpm                               | 12.x    |
| **Dev Tooling**   | tsx (watch), tsc (build)            | Latest  |
| **Env Management**| dotenv                              | 18.x    |
| **Validation**    | Zod-ready (extensible)              | —       |

---

## 📁 Project Structure

```
kanban-api/
├── prisma/
│   ├── schema.prisma          # Database schema (Advisor, roles, enums)
│   └── migrations/            # SQL migration history
├── src/
│   ├── server.ts              # Entry point: starts HTTP server (port 3333)
│   ├── app.ts                 # Express app factory + middleware + Swagger UI
│   ├── config/
│   │   ├── prisma.ts          # PrismaClient singleton with Pg adapter
│   │   └── swagger.ts         # OpenAPI 3.0.3 spec (swagger-jsdoc)
│   ├── modules/               # Feature modules (routes, controllers, services)
│   │   └── **/*.routes.ts     # Route files picked up by swagger-jsdoc
│   └── generated/
│       └── prisma/            # Prisma Client (generated, do not edit)
├── .env                       # Local environment variables (gitignored)
├── .gitignore
├── compose.yaml               # Docker Compose for Postgres
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts           # Prisma CLI config (ESM)
└── tsconfig.json              # Strict TypeScript config
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22 (with `corepack` enabled)
- **pnpm** ≥ 12 (`corepack enable && corepack prepare pnpm@12.15.0 --activate`)
- **Docker** & **Docker Compose** (for PostgreSQL)

---

### 1. Clone & Install

```bash
# Navigate to project
cd kanban-api

# Install dependencies (uses pnpm)
pnpm install
```

### 2. Configure Environment

```bash
# Copy example (if provided) or create .env
cp .env.example .env   # or create manually
```

**Required `.env` variables:**

```env
# Database (matches compose.yaml)
DATABASE_URL="postgresql://kanban:kanban_dev@localhost:5432/kanban_db?schema=public"

# Server
PORT=3333
NODE_ENV=development
```

### 3. Start PostgreSQL (Docker)

```bash
# Start DB in background
docker compose up -d

# Verify it's healthy
docker compose ps
# → kanban-postgres   Up (healthy)
```

### 4. Run Migrations & Generate Client

```bash
# Apply migrations to DB
pnpm prisma migrate dev --name init

# (Re)generate Prisma Client after schema changes
pnpm prisma generate
```

> **Note:** `postinstall` hook runs `prisma skills sync` automatically after `pnpm install`.

### 5. Start Development Server

```bash
# Hot-reload with tsx
pnpm dev
```

Server runs at: **http://localhost:3333**  
Swagger UI: **http://localhost:3333/api-docs**

---

## 📦 Available Commands

| Command                  | Description                                              |
|--------------------------|----------------------------------------------------------|
| `pnpm dev`               | Start dev server with file watching (`tsx watch src/server.ts`) |
| `pnpm build`             | Compile TypeScript → `dist/` (`tsc`)                     |
| `pnpm start`             | Run production build (`node dist/server.js`)             |
| `pnpm test`              | Placeholder (no test runner configured yet)              |
| `pnpm prisma studio`     | Open Prisma Studio (visual DB editor)                    |
| `pnpm prisma migrate dev`| Create & apply a new migration                           |
| `pnpm prisma migrate deploy` | Apply pending migrations (prod/CI)                |
| `pnpm prisma generate`   | Regenerate Prisma Client                                 |
| `pnpm prisma db push`    | Push schema changes without migration (dev only)         |
| `pnpm prisma db seed`    | Run seed script (if defined in `package.json`)           |
| `docker compose up -d`   | Start PostgreSQL container                               |
| `docker compose down`    | Stop & remove containers (keeps volume)                  |
| `docker compose down -v` | Stop & remove containers **and** volume (full reset)     |

---

## 🗄 Database Schema (Prisma)

### `Advisor` Model

```prisma
model Advisor {
  id           Int           @id @default(autoincrement())
  name         String        @db.VarChar(150)
  email        String        @unique @db.VarChar(150)
  passwordHash String        @map("password_hash") @db.VarChar(255)
  avatarUrl    String?       @map("avatar_url") @db.VarChar(255)
  role         AdvisorRole   @default(advisor)
  createdAt    DateTime      @default(now()) @map("created_at") @db.Timestamp(6)

  @@map("advisors")
}
```

### `AdvisorRole` Enum

```prisma
enum AdvisorRole {
  advisor
  senior_partner
  admin
}
```

---

## 🔌 API Endpoints

| Method | Path         | Description                              |
|--------|--------------|------------------------------------------|
| `GET`  | `/health`    | Health check → `{ status: "ok" }`        |
| `GET`  | `/`          | Welcome message                          |
| `GET`  | `/api-docs`  | **Swagger UI** — Interactive API docs    |

> **Planned:** Auth (`POST /auth/login`, `POST /auth/register`), Advisors CRUD, Boards, Cards, Columns, Activities.

### Swagger / OpenAPI

- **UI**: `http://localhost:3333/api-docs`
- **Spec**: Generated from JSDoc comments in `src/modules/**/*.routes.ts`
- **Config**: `src/config/swagger.ts` (OpenAPI 3.0.3)

---

## 🧪 Development Workflow

### Adding a New Feature Module

1. **Create module** under `src/modules/<feature>/`
   - `routes.ts` — route definitions with JSDoc for Swagger
   - `controller.ts` — request handling
   - `service.ts` — business logic
   - `schemas.ts` — Zod validation schemas (optional)
2. **Register routes** in `src/app.ts` (import and `app.use()`)
3. **Update schema** → `prisma/schema.prisma` (if DB changes)
4. **Create migration** → `pnpm prisma migrate dev --name descriptive_name`
5. **Test manually** via `pnpm dev` + Swagger UI / curl / Insomnia
6. **Build & verify** → `pnpm build && pnpm start`

### Code Style & Quality

- **Strict TypeScript** (`strict: true`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)
- **ESM only** (`"type": "module"` in `package.json`, `.ts` imports with extensions)
- **Path aliases** via `tsconfig.json` (`@/*` → `src/*`)
- **No linting/formatter configured yet** — consider adding Biome or ESLint + Prettier

---

## 🐳 Docker Compose Details

```yaml
services:
  postgres:
    image: postgres:17
    container_name: kanban-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: kanban
      POSTGRES_PASSWORD: kanban_dev
      POSTGRES_DB: kanban_db
    ports:
      - "127.0.0.1:5432:5432"   # Only localhost for security
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kanban -d kanban_db"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

- **Port binding** is restricted to `127.0.0.1` (not exposed to LAN)
- **Named volume** persists data across `docker compose down`
- **Healthcheck** ensures app waits for DB readiness

---

## 🔐 Environment Variables Reference

| Variable         | Required | Default        | Description                        |
|------------------|----------|----------------|------------------------------------|
| `DATABASE_URL`   | ✅       | —              | PostgreSQL connection string       |
| `PORT`           | ❌       | `3333`         | HTTP server port                   |
| `NODE_ENV`       | ❌       | `development`  | Runtime environment                |
| `JWT_SECRET`     | 🔜       | —              | For token signing (planned)        |
| `CORS_ORIGIN`    | 🔜       | `*`            | Allowed frontend origin (planned)  |

---

## 📚 Useful Prisma Commands

```bash
# Visual database browser
pnpm prisma studio

# Reset DB (drop all, re-run migrations, run seed)
pnpm prisma migrate reset

# Format schema file
pnpm prisma format

# Validate schema syntax
pnpm prisma validate

# Show migration status
pnpm prisma migrate status

# Generate types for external use (e.g., frontend)
pnpm prisma generate --output=../../packages/shared/prisma
```

---

## 🧭 Roadmap / TODO

- [ ] **Authentication**: JWT login/register, password hashing (bcrypt/argon2)
- [ ] **Authorization**: Role guards (advisor / senior_partner / admin)
- [ ] **Advisors CRUD**: Full REST endpoints with validation (Zod)
- [ ] **Kanban Core**: Boards, Columns, Cards, Labels, Comments
- [ ] **Activity Log**: Audit trail for card movements
- [ ] **Tests**: Unit (Vitest) + Integration (Supertest + Testcontainers)
- [ ] **API Docs**: Enhance Swagger with examples, auth schemes, error responses
- [ ] **CI/CD**: GitHub Actions (lint, typecheck, test, build, deploy)
- [ ] **Observability**: Structured logging (pino), metrics (Prometheus), tracing

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

**ISC License** — feel free to use, modify, and distribute.

---

## 👤 Author

**Hoshibi** — [GitHub](https://github.com/Hoshibi)

---

> Generated with ❤️ using **Claude Code** — *`pnpm dev` and start building!*