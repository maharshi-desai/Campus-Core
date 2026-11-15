# CampusCore

CampusCore is a full-stack university portal for student academics, course registration, and campus housing. Students sign in with Google, view their linked academic and housing information, and browse or enroll in courses from a responsive dashboard.

## Features

- Google OAuth sign-in with Auth.js v5.
- Student dashboard with profile, enrolled courses, hostel and room occupancy, and an AQI gauge.
- Department-filtered course catalog with seat availability, duplicate-enrollment checks, and enrollment feedback.
- Prisma-backed PostgreSQL data model and repeatable seed data.
- Protected dashboard and registration routes.

## Tech stack

- **Next.js 15 App Router** and React 19
- **Tailwind CSS 4**
- **Auth.js v5** with Google OAuth and the Prisma adapter
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

This keeps department, course, and housing facts out of dependent rows, reducing update, insertion, and deletion anomalies. The current ER diagram is available at [`docs/CampusCore-ERD.md`](docs/CampusCore-ERD.md).

## Requirements

- Node.js 20.19+, 22.12+, or 24+
- npm
- A running PostgreSQL database
- A Google OAuth client ID and client secret

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/maharshi-desai/Campus-Core.git
cd Campus-Core
npm install
```

### 2. Create a PostgreSQL database

Create an empty database named `campuscore` locally, or create a database with your PostgreSQL provider. Keep the connection string and credentials private.

### 3. Configure environment variables

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/campuscore?schema=public"
AUTH_SECRET="replace-with-a-generated-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
```

Generate a secret with:

```bash
openssl rand -base64 32
```

In Google Cloud Console, configure the OAuth consent screen and create a Web OAuth client. For local development, add `http://localhost:3000` as an authorized JavaScript origin and `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Use the same variable names in `.env` as shown above. `.env` is ignored by Git; do not commit credentials.

### 4. Generate Prisma Client and sync the schema

```bash
npm run db:generate
npx prisma db push
```

`db:generate` builds the Prisma Client used by the application and refreshes the ER diagram. `db push` creates or updates the local database to match `prisma/schema.prisma`.

### 5. Seed the database

```bash
node prisma/seed.js
```

The seed script can be run again safely. It creates the sample departments, courses, hostel blocks, and rooms used by the catalog and dashboard.

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root page redirects to `/login`; sign in with the Google account configured for the OAuth client.

## Link a student profile

Google sign-in creates an Auth.js user account. A student profile is linked separately by an administrator using the CLI. First sign in with the Google account at least once, then run:

```bash
npm run db:link-student
```

Provide the Google account email, student ID, and a seeded department code (`CSE`, `ECE`, or `MAT`). A hostel assignment is optional. If assigning housing, choose a seeded hostel (`NORTH`, `EAST`, or `SOUTH`) and one of its seeded room numbers. The CLI checks room and block capacity before saving the assignment.

## Application routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/login` | Google sign-in | Public |
| `/dashboard` | Academic and housing dashboard | Authenticated |
| `/register` | Browse courses and enroll | Authenticated, linked student profile required to enroll |
| `/api/auth/*` | Auth.js handlers | Auth.js |

## Useful commands

```bash
npm run dev            # Start the local development server
npm run build          # Create a production build
npm run start          # Serve the production build
npm run db:generate    # Generate Prisma Client and update the ERD
npx prisma db push     # Sync the schema to the configured database
node prisma/seed.js    # Seed sample catalog and housing data
npm run db:link-student # Link a Google account to a student profile
```

For production, configure the same database and Auth.js secrets in the hosting provider, add the production Google callback URL (`https://YOUR_DOMAIN/api/auth/callback/google`), and apply the Prisma schema to the production database before seeding or starting the app.
