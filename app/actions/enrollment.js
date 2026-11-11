"use server";

import { auth } from "../../auth.js";
import { prisma } from "../../lib/prisma.js";

async function getSessionUserId(sessionUser) {
  if (typeof sessionUser?.id === "string" && sessionUser.id.length > 0) {
    return sessionUser.id;
  }

  // Auth.js's default JWT session exposes email, name, and image, but not id.
  // Resolve the adapter's database user from the trusted server-side session.
  if (typeof sessionUser?.email !== "string" || sessionUser.email.length === 0) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function getAllCourses() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("You must be signed in to view courses.");
  }

  return prisma.course.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      credits: true,
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: [{ code: "asc" }],
  });
}

export async function enrollInCourse(courseId) {
  if (typeof courseId !== "string" || courseId.trim().length === 0) {
    return { success: false, message: "A valid course ID is required." };
  }

  const session = await auth();

  if (!session?.user) {
    return { success: false, message: "You must be signed in to enroll." };
  }

  // Never trust a userId supplied by the client; derive it from the session.
  const userId = await getSessionUserId(session.user);

  if (!userId) {
    return {
      success: false,
      message: "The signed-in account could not be found.",
    };
  }

  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    return {
      success: false,
      message: "No student profile is linked to this account.",
    };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });

  if (!course) {
    return { success: false, message: "Course not found." };
  }

  try {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
      },
    });

    return { success: true, message: "Enrollment successful." };
  } catch (error) {
    if (error?.code === "P2002") {
      return {
        success: false,
        message: "You are already enrolled in this course.",
      };
    }

    throw error;
  }
}
