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
      { code: "CSE101", title: "Introduction to Programming", credits: 4, seatCapacity: 30 },
      { code: "CSE201", title: "Data Structures", credits: 4, seatCapacity: 35 },
      { code: "CSE301", title: "Database Systems", credits: 3, seatCapacity: 25 },
    ],
  },
  {
    code: "ECE",
    name: "Electronics and Communication Engineering",
    description: "Electronics, communications, and embedded systems.",
    courses: [
      { code: "ECE101", title: "Circuit Fundamentals", credits: 4, seatCapacity: 32 },
      { code: "ECE202", title: "Digital Logic Design", credits: 3, seatCapacity: 28 },
    ],
  },
  {
    code: "MAT",
    name: "Mathematics",
    description: "Pure and applied mathematics.",
    courses: [
      { code: "MAT101", title: "Calculus I", credits: 4, seatCapacity: 40 },
      { code: "MAT205", title: "Linear Algebra", credits: 3, seatCapacity: 24 },
    ],
  },
];

const hostels = [
  {
    code: "NORTH",
    name: "North Block",
    capacity: 240,
    air_quality_score: 38,
    rooms: [
      { roomNumber: "N-101", capacity: 2 },
      { roomNumber: "N-102", capacity: 3 },
    ],
  },
  {
    code: "EAST",
    name: "East Block",
    capacity: 180,
    air_quality_score: 64,
    rooms: [
      { roomNumber: "E-201", capacity: 2 },
      { roomNumber: "E-202", capacity: 4 },
    ],
  },
  {
    code: "SOUTH",
    name: "South Block",
    capacity: 320,
    air_quality_score: 91,
    rooms: [
      { roomNumber: "S-301", capacity: 2 },
      { roomNumber: "S-302", capacity: 3 },
    ],
  },
];

async function main() {
  let courseCount = 0;
  let roomCount = 0;

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
          seatCapacity: courseData.seatCapacity,
        },
        create: {
          ...courseData,
          departmentId: department.id,
        },
      });
      courseCount += 1;
    }
  }

  for (const { rooms, ...hostelData } of hostels) {
    await prisma.hostel.upsert({
      where: { code: hostelData.code },
      update: {
        name: hostelData.name,
        capacity: hostelData.capacity,
        air_quality_score: hostelData.air_quality_score,
      },
      create: hostelData,
    });

    const hostel = await prisma.hostel.findUniqueOrThrow({
      where: { code: hostelData.code },
      select: { id: true },
    });

    for (const roomData of rooms) {
      await prisma.hostelRoom.upsert({
        where: {
          hostelId_roomNumber: {
            hostelId: hostel.id,
            roomNumber: roomData.roomNumber,
          },
        },
        update: { capacity: roomData.capacity },
        create: {
          ...roomData,
          hostelId: hostel.id,
        },
      });
      roomCount += 1;
    }
  }

  console.log(
    `Seeded ${departments.length} departments, ${courseCount} courses, ${hostels.length} hostels, and ${roomCount} rooms.`,
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
