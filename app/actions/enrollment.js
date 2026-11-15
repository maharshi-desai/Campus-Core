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

  const userId = await getSessionUserId(session.user);
  const student = userId
    ? await prisma.student.findUnique({
        where: { userId },
        select: { id: true },
      })
    : null;

  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        code: true,
        title: true,
        credits: true,
        seatCapacity: true,
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: { enrollments: { where: { status: "ENROLLED" } } },
        },
      },
      orderBy: [{ code: "asc" }],
    }),
    student
      ? prisma.enrollment.findMany({
          where: { studentId: student.id },
          select: { courseId: true },
        })
      : Promise.resolve([]),
  ]);

  const enrolledCourseIds = new Set(enrollments.map(({ courseId }) => courseId));

  return {
    hasStudentProfile: Boolean(student),
    courses: courses.map((course) => {
      const enrolledCount = course._count.enrollments;
      return {
        id: course.id,
        code: course.code,
        title: course.title,
        credits: course.credits,
        seatCapacity: course.seatCapacity,
        enrolledCount,
        seatsRemaining: Math.max(0, course.seatCapacity - enrolledCount),
        isEnrolled: enrolledCourseIds.has(course.id),
        department: course.department,
      };
    }),
  };
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

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const course = await transaction.course.findUnique({
            where: { id: courseId },
            select: {
              id: true,
              seatCapacity: true,
              _count: {
                select: { enrollments: { where: { status: "ENROLLED" } } },
              },
            },
          });

          if (!course) {
            return { success: false, code: "COURSE_NOT_FOUND", message: "Course not found." };
          }

          const existing = await transaction.enrollment.findUnique({
            where: {
              studentId_courseId: { studentId: student.id, courseId: course.id },
            },
            select: { status: true },
          });

          if (existing) {
            return {
              success: false,
              code: "ALREADY_ENROLLED",
              message: "You are already enrolled in this course.",
            };
          }

          if (course._count.enrollments >= course.seatCapacity) {
            return {
              success: false,
              code: "COURSE_FULL",
              message: "This course has reached its seat capacity.",
            };
          }

          await transaction.enrollment.create({
            data: { studentId: student.id, courseId: course.id },
          });

          const enrolledCount = await transaction.enrollment.count({
            where: { courseId: course.id, status: "ENROLLED" },
          });

          return {
            success: true,
            seatsRemaining: Math.max(0, course.seatCapacity - enrolledCount),
            message: "Enrollment successful.",
          };
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (error?.code === "P2002") {
        return {
          success: false,
          code: "ALREADY_ENROLLED",
          message: "You are already enrolled in this course.",
        };
      }

      if (error?.code === "P2034" && attempt < 2) {
        continue;
      }

      if (error?.code === "P2034") {
        return {
          success: false,
          code: "RETRY_ENROLLMENT",
          message: "Another enrollment was just processed. Please try again.",
        };
      }

      throw error;
    }
  }
}
