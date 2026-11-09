# Document Vault authentication client

The client contains a public home page, email/password signup and login, Google
sign-in, a protected dashboard placeholder, and a not-found page. User data and
authentication are owned by the Spring Boot API.

## Setup

1. Use Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` and
   `VITE_GOOGLE_CLIENT_ID`.
3. Configure the backend to allow the exact frontend origin through CORS with
   credentials enabled. Do not use a wildcard origin when credentials are
   enabled.
4. Run `npm install`, then `npm run dev`.

The backend must serve the documented `/api/v1/auth/*` endpoints over HTTPS in
production, allow credentialed CORS from the frontend origin, and set its
refresh token as an httpOnly cookie. The client keeps access tokens in memory
only.

## Visual theme

The shared mint-green visual tokens, type scale, radii, shadow, focus styles,
and reduced-motion preferences are defined in `src/theme.css`. The theme toggle
supports light and dark modes, follows the system preference on first visit, and
saves the selected mode in local storage. Poppins is loaded from Google Fonts
with a sans-serif fallback.

## Commands

- `npm run dev` — start the Vite development server.
- `npm run build` — create a production build in `dist`.
- `npm test` — run unit and component tests.
- `npm run test:watch` — run tests in watch mode.
- `npm run lint` — run ESLint.
- `npm run format:check` — check formatting with Prettier.
