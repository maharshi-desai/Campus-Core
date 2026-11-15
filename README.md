# CampusCore

CampusCore is a university portal for academics, course registration, and student housing. Students sign in with Google, view their linked academic and housing information, and browse or enroll in courses from a responsive dashboard.

## Architecture

The frontend and authentication run in Next.js on Vercel. An Express API on Render owns the application data endpoints for courses, enrollment, student dashboard data, and hostel metrics. PostgreSQL is hosted on Render and shared by both services: Auth.js uses Prisma from Next.js for identity records, while Express uses Prisma for the campus data API.

```text
Browser
  └── Next.js on Vercel
        ├── Auth.js: Google OAuth, sessions, protected routes
        └── Server Actions: verify the session and call Express privately
              └── Express API on Render
                    └── PostgreSQL on Render
```

Next.js derives the user ID from the verified Auth.js session before calling Express. Calls carry a private shared secret from server to server; the browser never receives that secret. The Express API does not accept browser cross-origin calls. Auth.js callbacks stay on the Next.js domain, so the Google OAuth redirect URI points to Vercel.

## Features

- Google OAuth sign-in with Auth.js v5.
- Student dashboard with profile, enrolled courses, hostel and room occupancy, and an AQI gauge.
- Department-filtered course catalog with seat availability, duplicate-enrollment checks, and enrollment feedback.
- Express API endpoints for course listings, enrollments, student dashboard data, and hostel metrics.
- Prisma-backed PostgreSQL data model and repeatable seed data.
- Protected dashboard and registration routes.

## Tech stack

- **Next.js 15 App Router** and React 19
- **Tailwind CSS 4**
- **Auth.js v5** with Google OAuth and the Prisma adapter
- **Express 5** for the Render-hosted application API
- **Prisma ORM 7** with the PostgreSQL driver adapter
- **PostgreSQL**

## Database architecture and normalization

The schema separates facts by entity so updates happen in one place:

- `Department` stores department identity and description. `Student` and `Course` reference it through foreign keys instead of copying department details.
- `Course` stores course details and its seat capacity. Its department and course code pair is unique.
- `Student` stores student-specific profile data and references its Auth.js `User`, `Department`, and optional `HostelRoom` records.
- `Hostel` stores block-level capacity and air-quality measurements. `HostelRoom` stores each room and its capacity; students reference a room rather than duplicating hostel data.
- `Enrollment` is the junction table between `Student` and `Course`. Its composite primary key prevents duplicate student-course rows.
- Auth.js identity and OAuth records are kept in `User`, `Account`, `Session`, and `VerificationToken`.

This keeps department, course, and housing facts out of dependent rows, reducing update, insertion, and deletion anomalies. The ER diagram is available at [`docs/CampusCore-ERD.md`](docs/CampusCore-ERD.md).

## Requirements

- Node.js 24 or later
- npm
- PostgreSQL
- A Google OAuth client ID and client secret

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/maharshi-desai/Campus-Core.git
cd Campus-Core
npm install
```

### 2. Create a PostgreSQL database

Create an empty local database named `campuscore`, or use a PostgreSQL provider. Keep the connection string and credentials private.

### 3. Configure environment variables

Create a `.env` file in the repository root:

```dotenv
# Local PostgreSQL URL, used by Auth.js, Prisma, seed scripts, and Express.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/campuscore?schema=public"

# Auth.js and Google OAuth credentials.
AUTH_SECRET="replace-with-a-generated-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# Local Next.js-to-Express connection. Keep the two secret values identical.
CAMPUS_API_URL="http://localhost:4000"
CAMPUS_API_SECRET="replace-with-a-long-random-api-secret"
INTERNAL_API_SECRET="replace-with-the-same-long-random-api-secret"
PORT="4000"
```

Generate independent secrets with:

```bash
openssl rand -base64 32
```

Set `CAMPUS_API_SECRET` and `INTERNAL_API_SECRET` to the same generated API secret. Never use an `NEXT_PUBLIC_` prefix for either API secret.

In Google Cloud Console, configure the OAuth consent screen and create a Web OAuth client. Add `http://localhost:3000` as an authorized JavaScript origin and `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. `.env` is ignored by Git; do not commit credentials.

### 4. Generate Prisma Client and sync the schema

```bash
npm run db:generate
npx prisma db push
```

`db:generate` builds the Prisma Client used by Next.js and Express and refreshes the ER diagram. `db push` creates or updates the configured database to match `prisma/schema.prisma`.

### 5. Seed the database

```bash
node prisma/seed.js
```

The seed script can be run again safely. It creates sample departments, courses, hostel blocks, and rooms for the catalog and dashboard.

### 6. Start both development servers

In one terminal, start Next.js:

```bash
npm run dev
```

In another terminal, start Express:

```bash
npm run api:dev
```

Open [http://localhost:3000](http://localhost:3000). The root page redirects to `/login`. Express listens on [http://localhost:4000](http://localhost:4000); its public health check is `/health`, while `/api/*` routes require the internal bearer secret.

## Link a student profile

Google sign-in creates an Auth.js user account. Link a student profile separately with the administrator CLI. First sign in with the Google account at least once, then run:

```bash
npm run db:link-student
```

Provide the Google account email, student ID, and a seeded department code (`CSE`, `ECE`, or `MAT`). A hostel assignment is optional. If assigning housing, choose a seeded hostel (`NORTH`, `EAST`, or `SOUTH`) and one of its seeded room numbers. The CLI checks room and block capacity before saving the assignment.

## Routes

| Route | Service | Purpose | Access |
| --- | --- | --- | --- |
| `/login` | Next.js | Google sign-in | Public |
| `/dashboard` | Next.js | Academic and housing dashboard | Authenticated |
| `/register` | Next.js | Browse and enroll in courses | Authenticated; linked student profile required to enroll |
| `/api/auth/*` | Next.js | Auth.js handlers | Auth.js |
| `/health` | Express | Service health check | Public |
| `/api/courses` | Express | Course catalog and enrollment state | Internal service secret |
| `/api/enrollments` | Express | Enroll the authenticated student in a course | Internal service secret |
| `/api/students/:userId/dashboard` | Express | Student profile and enrolled courses | Internal service secret |
| `/api/students/:userId/hostel` | Express | Hostel occupancy and AQI | Internal service secret |

The Express API is intended to be called by Next.js Server Actions. Do not expose its shared secret in client components or send it from browser code.

## Useful commands

```bash
npm run dev             # Start the Next.js development server
npm run api:dev         # Start the Express API with file watching
npm run build           # Generate Prisma Client and build Next.js
npm run start           # Serve the Next.js production build
npm run api:start       # Start the Express API
npm run db:client       # Generate the Prisma Client for deployment
npm run db:generate     # Generate Prisma Client and update the ERD
npx prisma db push      # Sync the schema to the configured database
node prisma/seed.js     # Seed sample academic and housing data
npm run db:link-student # Link a Google account to a student profile
```

## Deploy Express and PostgreSQL on Render, Next.js on Vercel

Deploy the Express API and PostgreSQL database to Render. Deploy the Next.js app to Vercel. Both services share the Render database, but use the correct connection URL for their network: Express uses Render's internal database URL; Vercel uses the external URL with TLS.

### 1. Create the Render PostgreSQL database

In the [Render Dashboard](https://dashboard.render.com/), create a PostgreSQL database and choose its region and plan. Review its cost, storage, backup, and expiration terms before creating it. Keep the database in the same region as the Express web service. Save both the **Internal Database URL** for Express and the **External Database URL** for Vercel and one-time database setup. The external URL must use TLS (`sslmode=require`). Treat both URLs as secrets.

### 2. Create the Express web service on Render

Create a **Web Service** from the `maharshi-desai/Campus-Core` GitHub repository. Use the repository root, choose Node, and configure:

| Setting | Value |
| --- | --- |
| Build command | `npm ci --include=dev && npm run db:client` |
| Start command | `npm run api:start` |
| Health check path | `/health` |

Set the service's Node version to 24 if the dashboard asks for it. Add these Render environment variables:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Render's **Internal Database URL** |
| `INTERNAL_API_SECRET` | A long random secret shared with Vercel |

Render supplies `PORT` to the web service. The API binds to `0.0.0.0` and uses that port. After deployment, copy the service's public HTTPS URL, such as `https://campuscore-api.onrender.com`.

### 3. Create the Vercel project

In the [Vercel Dashboard](https://vercel.com/new), import `maharshi-desai/Campus-Core` from GitHub and select `main`. Use the repository root, the Next.js framework preset, and Node.js 24.x. The build command is `npm run build`. Vercel deploys future pushes to the connected branch automatically.

### 4. Add Vercel environment variables

In **Project Settings → Environment Variables**, add these variables for Production. Add them to Preview only if you also configure OAuth for preview domains.

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Render's **External Database URL**, with `sslmode=require` |
| `AUTH_SECRET` | A newly generated Auth.js secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `CAMPUS_API_URL` | The public HTTPS URL for the Render Express service, without a trailing slash |
| `CAMPUS_API_SECRET` | The exact same value as Render's `INTERNAL_API_SECRET` |

The API URL and secret are only used by server-side Next.js code. Do not add `NEXT_PUBLIC_` to their names. Vercel is detected by Auth.js as a trusted host. Do not put credentials in Git or share them in chat.

### 5. Configure Google OAuth for Vercel

In Google Cloud Console, add the Vercel production domain as an authorized JavaScript origin and add this redirect URI:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/api/auth/callback/google
```

Replace `YOUR-VERCEL-DOMAIN` with the Vercel project domain. Add the same origin and callback for any custom production domain. Google OAuth redirects to Next.js; it does not redirect to Express.

### 6. Create the production schema and seed data

From a terminal with the project checked out, create a temporary ignored `.env.render` containing the Render **External Database URL**:

```dotenv
DATABASE_URL="paste-the-render-external-database-url-here"
```

Then run:

```bash
DOTENV_CONFIG_PATH=.env.render npx prisma db push
DOTENV_CONFIG_PATH=.env.render node prisma/seed.js
rm .env.render
```

These commands create the tables and sample departments, courses, hostels, and rooms in the Render database. `.env.render` is ignored by Git. Review schema changes and backups before pointing these commands at any database with important data. Never commit or share the Render URL.

### 7. Deploy and link a student

Deploy the Render service and Vercel project after configuring their variables. If a variable changes, trigger a new deploy so the service picks it up. Then open the Vercel URL and sign in with Google. To show student-specific information and enable enrollments, link that Google user to a seeded student profile using `npm run db:link-student` with `DATABASE_URL` set to the Render external URL. Confirm `/dashboard` and `/register` load and that the Render service's `/health` endpoint returns `{"status":"ok"}`.

For connection details, see the [Render PostgreSQL guide](https://render.com/docs/postgresql-creating-connecting) and [Vercel environment variable guide](https://vercel.com/docs/environment-variables/managing-environment-variables).
