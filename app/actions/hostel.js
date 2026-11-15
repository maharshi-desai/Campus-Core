"use server";

import { auth } from "../../auth.js";
import { prisma } from "../../lib/prisma.js";

async function getSessionUserId(sessionUser) {
  if (typeof sessionUser?.id === "string" && sessionUser.id.length > 0) {
    return sessionUser.id;
  }

  // Auth.js's default JWT session may only expose the user's email.
  if (typeof sessionUser?.email !== "string" || sessionUser.email.length === 0) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });

  return user?.id ?? null;
}

/**
 * Fetch the signed-in student's assigned hostel and its current metrics.
 * Returns null when the account has no student profile or hostel assignment.
 */
export async function getHostelMetrics() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("You must be signed in to view hostel details.");
  }

  const userId = await getSessionUserId(session.user);

  if (!userId) {
    throw new Error("The signed-in account could not be found.");
  }

  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          capacity: true,
          hostel: {
            select: {
              id: true,
              name: true,
              capacity: true,
              air_quality_score: true,
              rooms: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!student?.room?.hostel) {
    return null;
  }

  const { room } = student;
  const hostel = room.hostel;
  const roomIds = hostel.rooms.map(({ id }) => id);
  const [currentOccupancy, roomOccupancy] = await Promise.all([
    prisma.student.count({ where: { roomId: { in: roomIds } } }),
    prisma.student.count({ where: { roomId: room.id } }),
  ]);

  return {
    blockName: hostel.name,
    totalCapacity: hostel.capacity,
    currentOccupancy,
    roomNumber: room.roomNumber,
    roomCapacity: room.capacity,
    roomOccupancy,
    airQualityScore: hostel.air_quality_score,
  };
}
