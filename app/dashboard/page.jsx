import { redirect } from "next/navigation";
import { auth } from "../../auth.js";
import { getHostelMetrics } from "../actions/hostel.js";
import { prisma } from "../../lib/prisma.js";
import { StudentHub } from "../../components/StudentHub";
import { demoStudent } from "../../components/campus-core-demo-data";

export default async function DashboardPage() {
  const session = await auth();

  // Keep the page guarded as well as the middleware. This protects the data
  // even when the page is rendered from a path that bypasses middleware.
  if (!session?.user) {
    redirect("/login");
  }

  const [hostel, databaseUser] = await Promise.all([
    getHostelMetrics(),
    session.user.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            student: {
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
            },
          },
        })
      : null,
  ]);

  const profile = databaseUser?.student;
  const enrolledCourses =
    profile?.enrollments.map(({ course }) => ({
      id: course.id,
      code: course.code,
      title: course.title,
      department: course.department.code,
    })) ?? [];

  return (
    <StudentHub
      student={{
        ...demoStudent,
        profileLinked: Boolean(profile),
        studentNumber: profile?.studentNumber ?? null,
        name:
          session.user.name ||
          session.user.email?.split("@")[0] ||
          demoStudent.name,
        email: session.user.email || "Email unavailable",
        major: profile?.department.name || "Student profile not linked",
      }}
      courses={enrolledCourses}
      hostel={hostel}
    />
  );
}
