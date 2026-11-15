import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

function readId(value) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 128
    ? value
    : null;
}

router.get("/courses", async (request, response, next) => {
  try {
    const userId = readId(request.query.userId);

    if (!userId) {
      return response.status(400).json({ message: "A valid userId is required." });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    const [courses, enrollments] = await Promise.all([
      prisma.course.findMany({
        select: {
          id: true,
          code: true,
          title: true,
          credits: true,
          seatCapacity: true,
          department: { select: { id: true, code: true, name: true } },
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

    return response.json({
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
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/students/:userId/dashboard", async (request, response, next) => {
  try {
    const userId = readId(request.params.userId);

    if (!userId) {
      return response.status(400).json({ message: "A valid userId is required." });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        studentNumber: true,
        department: { select: { name: true } },
        enrollments: {
          where: { status: "ENROLLED" },
          orderBy: { enrolledAt: "asc" },
          select: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                department: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    return response.json({
      profileLinked: Boolean(student),
      studentNumber: student?.studentNumber ?? null,
      major: student?.department.name ?? null,
      enrolledCourses:
        student?.enrollments.map(({ course }) => ({
          id: course.id,
          code: course.code,
          title: course.title,
          department: course.department.code,
        })) ?? [],
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/students/:userId/hostel", async (request, response, next) => {
  try {
    const userId = readId(request.params.userId);

    if (!userId) {
      return response.status(400).json({ message: "A valid userId is required." });
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
      return response.json(null);
    }

    const { room } = student;
    const hostel = room.hostel;
    const roomIds = hostel.rooms.map(({ id }) => id);
    const [currentOccupancy, roomOccupancy] = await Promise.all([
      prisma.student.count({ where: { roomId: { in: roomIds } } }),
      prisma.student.count({ where: { roomId: room.id } }),
    ]);

    return response.json({
      blockName: hostel.name,
      totalCapacity: hostel.capacity,
      currentOccupancy,
      roomNumber: room.roomNumber,
      roomCapacity: room.capacity,
      roomOccupancy,
      airQualityScore: hostel.air_quality_score,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/enrollments", async (request, response, next) => {
  try {
    const userId = readId(request.body?.userId);
    const courseId = readId(request.body?.courseId);

    if (!userId || !courseId) {
      return response.status(400).json({
        success: false,
        message: "A valid user and course are required.",
      });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      return response.json({
        success: false,
        message: "No student profile is linked to this account.",
      });
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await prisma.$transaction(
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
              return {
                success: false,
                code: "COURSE_NOT_FOUND",
                message: "Course not found.",
              };
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

        return response.json(result);
      } catch (error) {
        if (error?.code === "P2002") {
          return response.json({
            success: false,
            code: "ALREADY_ENROLLED",
            message: "You are already enrolled in this course.",
          });
        }

        if (error?.code === "P2034" && attempt < 2) {
          continue;
        }

        if (error?.code === "P2034") {
          return response.json({
            success: false,
            code: "RETRY_ENROLLMENT",
            message: "Another enrollment was just processed. Please try again.",
          });
        }

        throw error;
      }
    }

    return response.status(500).json({ success: false, message: "Enrollment failed." });
  } catch (error) {
    return next(error);
  }
});

export default router;
