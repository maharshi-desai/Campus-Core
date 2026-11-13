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
    include: {
      hostel: {
        select: {
          name: true,
          capacity: true,
          air_quality_score: true,
          _count: {
            select: { students: true },
          },
        },
      },
    },
  });

  if (!student?.hostel) {
    return null;
  }

  return {
    blockName: student.hostel.name,
    totalCapacity: student.hostel.capacity,
    currentOccupancy: student.hostel._count.students,
    airQualityScore: student.hostel.air_quality_score,
  };
}
