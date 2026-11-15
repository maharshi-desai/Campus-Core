import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before linking a student profile.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const prompt = createInterface({ input, output });

try {
  const email = (await prompt.question("Google account email: ")).trim().toLowerCase();
  const studentNumber = (await prompt.question("Student ID: ")).trim();
  const departmentCode = (await prompt.question("Department code (for example CSE): "))
    .trim()
    .toUpperCase();
  const hostelCode = (await prompt.question("Hostel code (optional, press Enter to skip): "))
    .trim()
    .toUpperCase();
  const roomNumber = hostelCode
    ? (await prompt.question("Room number in the selected hostel: ")).trim().toUpperCase()
    : "";

  if (!email || !studentNumber || !departmentCode) {
    throw new Error("Google email, student ID, and department code are required.");
  }

  const googleUser = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      accounts: { some: { provider: "google" } },
    },
    select: {
      id: true,
      email: true,
      student: { select: { id: true } },
    },
  });

  if (!googleUser) {
    throw new Error(
      "No Google account was found for that email. Sign in with Google once, then run this command again.",
    );
  }

  if (googleUser.student) {
    throw new Error("This Google account already has a linked student profile.");
  }

  const existingStudentNumber = await prisma.student.findUnique({
    where: { studentNumber },
    select: { id: true },
  });

  if (existingStudentNumber) {
    throw new Error("That student ID is already linked to another account.");
  }

  const department = await prisma.department.findUnique({
    where: { code: departmentCode },
    select: { id: true },
  });

  if (!department) {
    throw new Error(`Department ${departmentCode} was not found. Check the seeded department codes.`);
  }

  let hostel = null;
  let room = null;
  if (hostelCode) {
    hostel = await prisma.hostel.findUnique({
      where: { code: hostelCode },
      select: { id: true, capacity: true, name: true },
    });

    if (!hostel) {
      throw new Error(`Hostel ${hostelCode} was not found. Check the seeded hostel codes.`);
    }

    room = await prisma.hostelRoom.findUnique({
      where: {
        hostelId_roomNumber: {
          hostelId: hostel.id,
          roomNumber,
        },
      },
      select: { id: true, capacity: true, roomNumber: true },
    });

    if (!room) {
      throw new Error(`Room ${roomNumber} was not found in ${hostel.name}.`);
    }

  }

  await prisma.$transaction(
    async (transaction) => {
      if (room && hostel) {
        const [roomOccupancy, hostelOccupancy] = await Promise.all([
          transaction.student.count({ where: { roomId: room.id } }),
          transaction.student.count({ where: { room: { is: { hostelId: hostel.id } } } }),
        ]);

        if (roomOccupancy >= room.capacity) {
          throw new Error(`Room ${roomNumber} is full (${room.capacity} residents).`);
        }

        if (hostelOccupancy >= hostel.capacity) {
          throw new Error(`${hostel.name} is at full capacity.`);
        }
      }

      return transaction.student.create({
        data: {
          userId: googleUser.id,
          studentNumber,
          departmentId: department.id,
          roomId: room?.id ?? null,
        },
      });
    },
    { isolationLevel: "Serializable" },
  );

  const assignment = room ? ` and assigned ${hostel.name}, room ${room.roomNumber}` : "";
  console.log(`Linked student ${studentNumber} to Google account ${googleUser.email}${assignment}.`);
} catch (error) {
  const message =
    error?.code === "P2034"
      ? "Room availability changed during linking. Run the command again and choose another room."
      : error instanceof Error
        ? error.message
        : "Could not link the student profile.";
  console.error(message);
  process.exitCode = 1;
} finally {
  prompt.close();
  await prisma.$disconnect();
}
