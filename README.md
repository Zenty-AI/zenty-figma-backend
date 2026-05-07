# ZentyAIHelper Backend

Strapi powers the plugin auth flow and stores plugin-specific GitHub identity data.

## Local dev

Use the safe watcher mode first:

```bash
npm run dev
```

This mode enables polling and disables admin hot-watch, which avoids the `EMFILE` / watch-admin crash path that was happening locally.

For Figma desktop development, bind Strapi to `::` in `.env`. That makes `localhost`, `127.0.0.1`, and `::1` all work against the same server, which avoids local auth failures inside the plugin runtime.

If you want the default Strapi watcher flow again, use:

```bash
npm run dev:fast
```

## Required env

Copy `.env.example` values into `.env` and add:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `PUBLIC_SERVER_URL`

For local plugin work, the default callback becomes:

```text
http://localhost:1337/api/plugin-auth/github/callback
```

## Plugin auth endpoints

- `POST /api/plugin-auth/github/start`
- `GET /api/plugin-auth/github/status?state=...`
- `GET /api/plugin-auth/github/callback`
- `GET /api/plugin-auth/me`

The flow either links a GitHub account to an existing Strapi user by email or creates a new `users-permissions` user on first login.
