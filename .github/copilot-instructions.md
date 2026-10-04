# Jajabor Trekkers Backend — Rules

## Stack
Node.js, Express, TypeScript (strict), PostgreSQL, Prisma, Better Auth, Zod.

## Architecture
Modular monolith. Each module in src/modules/<name>/ has:
routes, controller, service, repository, validation, types.
- Routes: wire URL + middleware + controller only.
- Controllers: no business logic, no Prisma.
- Services: business logic and authorization checks (e.g. is user a trip member?).
- Repositories: the only place that uses Prisma.
- Always wrap async handlers with asyncHandler.

## Conventions
- API base path: /api/v1
- Success response: { success: true, message, data, meta? }
- Error response: { success: false, message, errors? }
- Throw ApiError(statusCode, message); never send errors manually.
- Validate every request with Zod via the validate middleware.
- Roles: USER, ADMIN. Only PUBLISHED destinations are visible to normal users.
- Destination status: DRAFT, PUBLISHED, ARCHIVED.
- Use named exports, async/await, no `any`.
- Env variables only via src/config/env.ts, never process.env directly.
- Never commit secrets; update .env.example when adding variables.
- All list endpoints use pagination (page, limit).
- Better Auth handler must be mounted BEFORE express.json().
