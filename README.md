# NewServer

Production-ready Node.js + Express + Prisma backend server written in TypeScript (ESM).

---

## Tech Stack

| Package                | Why                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **dotenv**             | Loads environment variables from `.env` files so secrets (DB URL, JWT keys, etc.) stay out of source code.             |
| **helmet**             | Sets secure HTTP headers (Content-Security-Policy, X-Frame-Options, etc.) to protect against common web attacks.       |
| **cors**               | Controls Cross-Origin Resource Sharing — allows the frontend origin(s) to call the API while blocking unknown origins. |
| **compression**        | Gzip/Brotli compresses HTTP responses, reducing bandwidth and improving response times.                                |
| **express-rate-limit** | Protects API endpoints from brute-force and DDoS by limiting requests per IP per time window.                          |
| **cookie-parser**      | Parses `Cookie` headers into `req.cookies` and supports signed cookies via a secret.                                   |

---

## File-by-File Explanation

### `src/app.ts` — Express Application

1. **`helmet()`** — Sets security-related HTTP headers. Must be first so every response is hardened.
2. **`compression()`** — Compresses response bodies. Applied early so all downstream responses benefit.
3. **`cookieParser(COOKIE_SECRET)`** — Parses cookies from requests. The secret enables signed cookie verification.
4. **`express.json()` / `express.urlencoded()`** — Parses JSON and URL-encoded request bodies. The `10mb` limit prevents excessively large payloads while allowing reasonable uploads.
5. **`cors(corsOptions)`** — Restricts cross-origin access. Origins are configurable via the `ALLOWED_ORIGINS` env var (comma-separated) with localhost defaults for development.
6. **`rateLimit`** — Applied only to `/api/` routes. Limits each IP to 100 requests per 15-minute window to prevent abuse.

### `src/server.ts` — Server Bootstrap & Shutdown

1. **`bootstrap()`** — Connects to the database via Prisma, then starts the HTTP server on the configured port. If either step fails, the process exits immediately so the orchestrator (PM2, Docker, etc.) can restart it.
2. **`gracefulShutdown(signal)`** — On receiving SIGTERM/SIGINT (or an unhandled error), it stops accepting new connections, disconnects from the database, and exits cleanly. A 30-second timeout forces exit if connections hang — critical in containerised deployments where shutdown time is limited.
3. **`uncaughtException` / `unhandledRejection` handlers** — Catches fatal errors that would otherwise crash silently, logs them, and triggers graceful shutdown.
