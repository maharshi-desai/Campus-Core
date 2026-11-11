import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before running the seed script.");
}

const connectionUrl = new URL(connectionString);
const placeholderCredentials = new Set(["johndoe", "user", "username"]);
const placeholderPasswords = new Set(["randompassword", "password"]);
const placeholderHosts = new Set(["host", "example.com"]);
const placeholderDatabases = new Set(["database", "mydb"]);

if (
  (placeholderCredentials.has(connectionUrl.username.toLowerCase()) &&
    placeholderPasswords.has(connectionUrl.password.toLowerCase())) ||
  placeholderHosts.has(connectionUrl.hostname.toLowerCase()) ||
  placeholderDatabases.has(connectionUrl.pathname.slice(1).toLowerCase())
) {
  throw new Error(
    "DATABASE_URL is still Prisma's placeholder. Set it to your PostgreSQL connection string before seeding.",
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const departments = [
  {
    code: "CSE",
    name: "Computer Science and Engineering",
    description: "Computing, software, and information systems.",
    courses: [
      { code: "CSE101", title: "Introduction to Programming", credits: 4 },
      { code: "CSE201", title: "Data Structures", credits: 4 },
      { code: "CSE301", title: "Database Systems", credits: 3 },
    ],
  },
  {
    code: "ECE",
    name: "Electronics and Communication Engineering",
    description: "Electronics, communications, and embedded systems.",
    courses: [
      { code: "ECE101", title: "Circuit Fundamentals", credits: 4 },
      { code: "ECE202", title: "Digital Logic Design", credits: 3 },
    ],
  },
  {
    code: "MAT",
    name: "Mathematics",
    description: "Pure and applied mathematics.",
    courses: [
      { code: "MAT101", title: "Calculus I", credits: 4 },
      { code: "MAT205", title: "Linear Algebra", credits: 3 },
    ],
  },
];

const hostels = [
  { code: "NORTH", name: "North Block", capacity: 240, air_quality_score: 38 },
  { code: "EAST", name: "East Block", capacity: 180, air_quality_score: 64 },
  { code: "SOUTH", name: "South Block", capacity: 320, air_quality_score: 91 },
];

async function main() {
  let courseCount = 0;

  for (const { courses, ...departmentData } of departments) {
    const department = await prisma.department.upsert({
      where: { code: departmentData.code },
      update: {
        name: departmentData.name,
        description: departmentData.description,
      },
      create: departmentData,
    });

    for (const courseData of courses) {
      await prisma.course.upsert({
        where: {
          departmentId_code: {
            departmentId: department.id,
            code: courseData.code,
          },
        },
        update: {
          title: courseData.title,
          credits: courseData.credits,
        },
        create: {
          ...courseData,
          departmentId: department.id,
        },
      });
      courseCount += 1;
    }
  }

  for (const hostelData of hostels) {
    await prisma.hostel.upsert({
      where: { code: hostelData.code },
      update: {
        name: hostelData.name,
        capacity: hostelData.capacity,
        air_quality_score: hostelData.air_quality_score,
      },
      create: hostelData,
    });
  }

  console.log(
    `Seeded ${departments.length} departments, ${courseCount} courses, and ${hostels.length} hostels.`,
  );
}

try {
  await main();
} catch (error) {
  console.error("Database seeding failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
