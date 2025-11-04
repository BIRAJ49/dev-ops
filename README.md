# DevOps Practice API

## Overview

This project delivers a production-ready authentication API built with Express and hardened for real-world use through layered security, observability, and automated delivery tooling across the DevOps stack.

## Architecture & Diagram

Neon-hosted Postgres backs a containerized Node.js service fronted by Express. Arcjet applies adaptive security rules at the edge, while Terraform provisions AWS infrastructure and GitHub Actions orchestrate CI/CD pipelines .

![Architecture Diagram](docs/architecture-diagram.png)

> Replace the placeholder above with a diagram or screenshot of your deployed architecture (recommended location: `docs/architecture-diagram.png`).

## Tech Stack

- Node.js 22 (ESM) with Express 5 for the HTTP layer.
- Drizzle ORM targeting Neon Postgres for data persistence.
- Arcjet (shield, bot detection, role-based rate limiting) and Zod validation.
- Winston logging, Morgan request tracing, and Helmet/CORS/cookie hardening.
- Docker for reproducible builds and runtime parity.
- Terraform to define AWS networking, database, and EC2 resources as code.
- AWS (EC2, VPC, security groups, managed Postgres) for hosting.
- GitHub Actions for CI/CD, running lint/tests, and pushing Docker images.

## Setup Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/devops-practice.git
   cd devops-practice
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment**
   Create a `.env` file and populate the required values (examples below):
   ```bash
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
   ARCJET_KEY=ajkey_your_arcjet_site_key
   JWT_SECRET=super-secret-string
   JWT_EXPIRES_IN=1d
   ```
4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```
   Use `npm run db:generate` after adjusting schema files in `src/models/` to create new migrations.
5. **Start the service**
   - Development (watch mode):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

The API listens on `http://localhost:3000` and exposes `/health` for monitoring probes.

## Key Features & Learnings

- Implemented GitHub Actions workflow to lint, test, and deploy the Dockerized app to AWS EC2.
- Provisioned VPC, security groups, and Neon-compatible Postgres endpoints with Terraform.
- Integrated Arcjet sliding-window rate limiting and bot detection tied to user roles.
- Added structured JSON logging and centralized security middleware for traceability.
- Practiced secrets management via environment variables and container-friendly configuration.

## Docker Usage

Build and run the production image locally:

```bash
docker build -t devops-practice-api .
docker run --rm -p 3000:3000 --env-file .env devops-practice-api
```

## API Reference

All authentication routes live under `/api/auth`.

| Method | Path        | Description                                              |
| ------ | ----------- | -------------------------------------------------------- |
| POST   | `/sign-up`  | Registers a user, hashes the password, and issues a JWT. |
| POST   | `/sign-in`  | Validates credentials (authentication logic pending).    |
| POST   | `/sign-out` | Placeholder endpoint returning a confirmation string.    |

Support endpoints:

- `GET /` — simple hello world response.
- `GET /health` — status and uptime metadata.
- `GET /api` — API readiness message.

### Security Middleware

Every request traverses `securityMiddleware`, which:

- Derives client identity from proxy-aware IP heuristics.
- Applies Arcjet shielding, bot detection, and sliding-window rate limits.
- Supports role-based rate caps (`admin`, `user`, `guest`).

Review `src/middleware/security.middleware.js` and `src/config/arcjet.js` before relaxing limits in production.

## Logging

- JSON and timestamped logs persist to `logs/combined.log` and `logs/error.log`.
- Console logging is enabled when `NODE_ENV` is not `production`.
- Update the log level with `LOG_LEVEL` (e.g., `debug`, `warn`, `error`).

## npm Scripts

| Script                 | Purpose                           |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Run the app with file watching.   |
| `npm start`            | Production-mode start.            |
| `npm run lint`         | Lint the codebase with ESLint.    |
| `npm run lint-fix`     | Autofix lint issues.              |
| `npm run format`       | Format with Prettier.             |
| `npm run format-check` | Check formatting without writing. |
| `npm run db:generate`  | Generate a Drizzle migration.     |
| `npm run db:migrate`   | Apply pending migrations.         |
| `npm run db:studio`    | Launch Drizzle Studio UI.         |

## Development Notes

- JWT helpers in `src/utils/jwt.js` use `JWT_SECRET` and `JWT_EXPIRES_IN`; replace defaults before deploying.
- The current `signIn` controller returns a mocked response—implement credential verification in `src/controller/auth.controller.js` and `src/services/auth.service.js` before production use.
- Logs and generated artifacts are ignored by Git; ensure the `logs/` directory exists or create it before running the app.

## Troubleshooting

- **Arcjet key issues**: verify `ARCJET_KEY` is set and valid; run in `DRY_RUN` mode during testing by adjusting the rule configuration in `src/config/arcjet.js`.
- **SSL errors when connecting to Neon**: append `?sslmode=require` to the `DATABASE_URL` if your provider mandates TLS.
- **Migrations not running**: confirm the `DATABASE_URL` points to a database the current user can write to and that migrations in the `drizzle/` directory exist.
