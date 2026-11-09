# Kanban Assessor API — Claude Code Instructions

## 1. Project Context

This project is a RESTful API for managing financial advisors, clients, Kanban workflows, authentication, and future AI-powered features.

### Technology Stack

- Node.js 22+ with ESM
- TypeScript 7 with strict typing
- Express 5
- Prisma ORM 7 with PostgreSQL adapter
- PostgreSQL 17
- Zod 4
- OpenAPI 3.1 / Swagger UI
- pnpm
- Vitest and Supertest
- Biome
- Pino
- Helmet
- Docker Compose

Always respect the project's existing versions, dependencies, conventions, and architecture.

The actual repository configuration is the source of truth.

## 2. General Instructions

- Always communicate with the developer in Brazilian Portuguese.
- Write code and technical identifiers in English.
- Follow existing project conventions.
- Prefer simple, readable, maintainable, and secure solutions.
- Avoid unnecessary abstractions and overengineering.
- Reuse existing utilities, schemas, and patterns.
- Do not introduce new dependencies without explaining why.
- Do not modify unrelated files.
- Do not make changes solely based on personal preference.
- Do not replace existing implementations just because an alternative exists.
- Preserve backward compatibility unless explicitly authorized.

## 3. Before Making Changes

Before modifying any code:

1. Understand the user's request and its scope.
2. Inspect the relevant files and dependencies.
3. Identify existing patterns and reusable components.
4. Evaluate possible impacts on other modules.
5. Check whether the requested change affects API contracts, validation, authentication, database schemas, or security.

For simple, low-risk changes, proceed directly.

For changes involving business rules, public API behavior, authentication, authorization, database structures, or potentially destructive operations, explain the impact and request approval before changing behavior.

Do not modify files when the user only requests an explanation, analysis, or code review.

## 4. Scope and Change Control

- Implement only what was requested.
- Prefer minimal, focused changes.
- Do not perform unrelated refactoring.
- Do not rename files, functions, variables, or endpoints without a clear reason.
- Do not remove existing features without authorization.
- Do not silently modify business rules.
- Do not silently change validation rules.
- Do not silently change HTTP methods, routes, status codes, or response structures.
- Do not silently modify authentication requirements or permissions.
- Do not change public contracts simply to simplify implementation.

If a problem outside the requested scope is discovered, report it separately instead of automatically fixing it.

## 5. Architecture Rules

The project follows a feature-based modular architecture.

Each module should follow the existing structure:

src/modules/<feature>/
- <feature>.contract.ts
- <feature>.routes.ts
- <feature>.controller.ts
- <feature>.middleware.ts
- <feature>.service.ts
- <feature>.test.ts
- schemas/

### Responsibilities

**Contracts**
- Define HTTP methods and paths.
- Define request and response schemas.
- Define required middleware.
- Define OpenAPI security requirements.
- Connect controller handlers.
- Remain the source of truth for route definitions.

**Routes**
- Generate Express Routers from contracts.
- Avoid manually duplicating routes already defined in contracts.

**Controllers**
- Handle HTTP requests and responses.
- Read validated request data.
- Call services.
- Set appropriate status codes, headers, and cookies.
- Avoid implementing business logic directly.

**Services**
- Implement business rules.
- Coordinate database operations.
- Handle domain-specific validations.
- Manage transactions when necessary.
- Avoid direct HTTP response handling.

**Schemas**
- Use Zod for request validation.
- Define response contracts.
- Reuse shared validation rules where appropriate.

**Prisma**
- Handle database persistence.
- Use the existing Prisma configuration and adapter.
- Do not create unnecessary PrismaClient instances.

Do not introduce a repository layer, dependency injection framework, or additional architecture layers unless a concrete need justifies them.

## 6. Route Contracts and Swagger

The project uses a contract-driven architecture.

Relevant files:

- src/config/createRoute.ts
- src/config/routeRegistry.ts
- src/config/openapi.ts
- src/config/swagger.ts

Rules:

- Define each endpoint through the existing RouteContract pattern.
- Use generateRouter() to generate Express routes.
- Use generateSwaggerSpec() to generate OpenAPI documentation.
- Do not duplicate endpoint definitions manually.
- Reuse existing Zod schemas.
- Keep request and response documentation synchronized with actual behavior.
- Document relevant success and error responses.
- Configure security requirements for each endpoint.
- Remember that OpenAPI security declarations do not enforce authentication at runtime.
- Apply real authentication and authorization through middleware or services.
- Do not modify the contract-generation architecture without a demonstrated need.

When adding new modules, ensure route prefixes are correctly represented in both Express and OpenAPI.

## 7. TypeScript and Zod

- Use strict TypeScript typing.
- Avoid `any`; prefer `unknown` when appropriate.
- Use type inference whenever possible.
- Use `z.infer` or `z.output` to derive types from Zod schemas.
- Use `z.input` when input and transformed output types differ.
- Prefer safeParse() when validation errors need custom handling.
- Use parse() when invalid configuration should stop initialization.
- Use validated data instead of unvalidated request values.
- Avoid unnecessary type assertions.
- Preserve existing validation behavior.
- Do not loosen schemas merely to fix TypeScript errors.
- Do not suppress compiler errors without understanding their cause.

Import Zod through the existing OpenAPI configuration when schemas require `.openapi()`.

Follow the project's actual ESM and TypeScript module-resolution configuration.

Do not globally enforce `.ts` or `.js` extensions without checking the build configuration.

## 8. Security Rules

Security must be considered for every change.

### Authentication and Authorization

- Preserve existing JWT authentication behavior.
- Distinguish Access Tokens from Refresh Tokens.
- Do not expose tokens, secrets, passwords, or password hashes.
- Preserve refresh-token rotation and revocation behavior.
- Do not bypass authentication middleware.
- Never rely on Swagger security definitions as runtime protection.
- Enforce authorization based on the authenticated user and their permissions.
- Never trust user identifiers or roles supplied by the frontend.

### Passwords

- Use the existing password hashing implementation.
- Never store passwords in plaintext.
- Preserve bcrypt compatibility and password-length validation.
- Do not change password hashing parameters without evaluating compatibility.

### Cookies and Sessions

- Preserve HttpOnly refresh-token cookies.
- Use Secure cookies in production HTTPS environments.
- Maintain consistent cookie paths and expiration settings.
- Ensure logout invalidates the relevant session.
- Consider CSRF protections for cookie-based operations.
- Do not expose Refresh Tokens in JSON responses unless explicitly required by an approved design.

### Sensitive Data

- Never commit real secrets or credentials.
- Never print passwords, tokens, private keys, or sensitive client information in logs.
- Do not expose internal errors or database details in API responses.
- Validate external input before use.
- Apply least-privilege principles.

## 9. Prisma and Database

- Use Prisma ORM with PostgreSQL.
- Follow the existing Prisma 7 configuration.
- Inspect schema.prisma before changing models.
- Preserve existing table and column mappings.
- Do not modify database constraints without explaining the impact.
- Do not execute destructive migrations without explicit authorization.
- Never reset, drop, or truncate a database without explicit authorization.
- Do not use `prisma db push` as a replacement for migrations without justification.
- Review relationships and indexes when implementing new database features.
- Use transactions when multiple dependent database operations must succeed or fail together.
- Do not edit generated Prisma Client files.

For new migrations, use descriptive names and verify that schema changes match the requested requirements.

## 10. Error Handling

- Reuse the existing AppError class.
- Use the centralized errorHandler middleware.
- Preserve the established error response format.
- Return appropriate HTTP status codes.
- Avoid exposing internal implementation details.
- Do not silently swallow errors.
- Do not add unnecessary try/catch blocks when the existing Express 5 error handling is sufficient.
- Do not change existing error codes without authorization.

## 11. Testing and Verification

After modifying code, verify the relevant behavior whenever possible.

Prioritize:

1. TypeScript type checking.
2. Relevant automated tests.
3. Linting and formatting.
4. API contract consistency.
5. Security-sensitive behavior.

Use the scripts already defined in package.json.

Do not invent script names or assume tools are configured without checking.

For API changes, verify when relevant:

- Successful requests.
- Invalid request validation.
- Authentication failures.
- Authorization failures.
- Correct status codes.
- Expected response structures.
- Rate limiting.
- Cookie behavior.
- Swagger/OpenAPI consistency.

Do not claim tests passed unless they were actually executed.

If tests cannot be run, explain why.

## 12. Code Review Rules

When asked to analyze or review code:

- Do not modify files unless explicitly requested.
- Identify actual bugs before suggesting stylistic changes.
- Evaluate security, correctness, types, and maintainability.
- Distinguish confirmed problems from potential risks.
- Classify findings by severity: critical, high, medium, or low.
- Explain why each problem matters.
- Suggest the smallest effective correction.
- Avoid proposing large architectural changes without strong justification.
- Explicitly state when the implementation is already adequate.

Do not repeatedly suggest refactoring code that already meets the project's needs.

## 13. Working with AI Features

The project may include AI-powered financial analysis and assistant features.

When implementing them:

- Keep AI integrations isolated from core business logic.
- Do not send sensitive client information to external AI providers without explicit authorization.
- Minimize personal and financial data included in prompts.
- Treat AI-generated content as untrusted.
- Validate structured AI outputs.
- Do not allow AI-generated recommendations to automatically execute financial operations.
- Preserve human review for financial decisions.
- Avoid logging prompts or responses containing sensitive information.
- Keep provider credentials in environment variables.

Do not introduce AI services, providers, or integrations unless requested.

## 14. Dependencies and Tooling

- Use pnpm for dependency management.
- Do not use npm or yarn to modify dependencies.
- Check existing dependencies before installing new packages.
- Prefer built-in Node.js features when appropriate.
- Keep Biome conventions.
- Follow existing logging conventions with Pino.
- Preserve established Vitest and Supertest patterns.
- Do not modify tsconfig.json or build configuration without understanding the impact.
- Do not change package versions without a reason connected to the requested task.

## 15. File and Command Safety

Never execute destructive commands without explicit authorization.

Examples include:

- Deleting project directories.
- Resetting databases.
- Dropping tables.
- Deleting migrations.
- Force-pushing Git branches.
- Discarding uncommitted changes.
- Overwriting configuration files containing credentials.

Before potentially destructive actions, explain the consequences.

Do not modify `.env` secrets unless explicitly authorized.

Do not commit or push changes unless requested.

## 16. Communication Style

- Respond in Brazilian Portuguese.
- Be clear, concise, and technically accurate.
- Explain unfamiliar concepts when relevant.
- Prefer concrete examples using this project.
- Avoid excessive theoretical explanations.
- Distinguish recommendations from requirements.
- Explain trade-offs when multiple solutions exist.
- Do not repeatedly ask for confirmation on low-risk implementation details.
- Prioritize practical solutions.

## 17. Completion Report

After completing a coding task, provide:

### Changes

- Which files were changed.
- What was implemented or corrected.

### Verification

- Which commands or tests were executed.
- Whether they passed or failed.

### Notes

- Any remaining issues.
- Any relevant security considerations.
- Any changes that require further action.

Do not claim successful verification without evidence.

## 18. Priority of Instructions

When working on this project:

1. Follow the user's current explicit request.
2. Respect applicable safety and security requirements.
3. Preserve existing business behavior and public contracts.
4. Follow the actual repository architecture and configuration.
5. Apply these project conventions.
6. Prefer minimal changes over unnecessary refactoring.

If these instructions conflict with the actual repository behavior, inspect the relevant code and explain the discrepancy before changing established behavior.

## Core Principle

Implement exactly what is requested, preserve what already works, and avoid unnecessary complexity.

Correctness, security, maintainability, and compatibility are more important than introducing new abstractions.
