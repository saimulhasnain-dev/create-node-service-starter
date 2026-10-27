# create-node-service-starter

Scaffold a production-ready **Node.js + TypeScript + Express** API in one command. Skip the first day of every new service: env validation, health check, error handling, graceful shutdown, tests and a Dockerfile are already wired.

## What it does

Copies a small, opinionated template into a new folder. The generated project has:

- **Config validation at startup**: invalid `PORT`, `NODE_ENV`, `LOG_LEVEL` are all reported together, then the process exits.
- **Express app** with request ids (`x-request-id`), JSON request logs, `/health`, JSON 404 and a global error handler that never leaks 5xx internals.
- **Graceful shutdown** on SIGTERM/SIGINT (in-flight requests finish, forced exit after 10s) and exit on `unhandledRejection`.
- **Tests** with the built-in `node:test` against a real server on a random port; no test framework to install.
- **Dockerfile**: multi-stage, non-root user, healthcheck.
- Scripts: `dev` (watch + `--env-file`), `build`, `start`, `typecheck`, `test`.

Only one runtime dependency (`express`). The scaffolder itself has zero dependencies.

## Install

Nothing to install. Run it with npx or `npm create`:

```sh
npm create node-service-starter my-api
# or
npx create-node-service-starter my-api
```

## Usage

```sh
cd my-api
cp .env.example .env
npm install
npm run dev          # http://localhost:3000/health
npm test
npm run build && npm start
docker build -t my-api . && docker run -p 3000:3000 my-api
```

## API

`create-node-service-starter <project-name>`

- `<project-name>` becomes the folder and the `name` in `package.json`. It must be lowercase letters, digits, `-`, `.` or `_`.
- The target folder must be empty or not exist yet; the tool refuses to overwrite files.
- Needs Node.js 20 or newer (the template uses `node --env-file`).

## Where to use it

- Starting a new microservice or internal API and you want sane defaults on day one.
- Teams that want every new service to start with the same health, logging and shutdown behaviour.
- Workshops and interviews where you need a working TypeScript API in a minute.
- Looking for NestJS instead? See `create-nest-api-starter`.

## Integrate

Add your routes in `src/app.ts` before the 404 handler, or split them into routers:

```ts
// src/app.ts
app.get('/users/:id', async (req, res) => {
  const user = await db.users.find(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json(user);
});
```

Add env variables to `.env.example` and parse them in `src/config.ts` so they are validated at startup.

## Limitations

- Express 4 does not forward errors from `async` handlers automatically: use `try/catch` + `next(err)`, or upgrade to Express 5.
- No database, auth or ORM is included on purpose; add what your service needs.
- Logging uses `console` with JSON lines; swap in pino if you need log levels and transports.
