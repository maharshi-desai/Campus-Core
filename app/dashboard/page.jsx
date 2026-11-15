import { redirect } from "next/navigation";
import { auth } from "../../auth.js";
import { getHostelMetrics } from "../actions/hostel.js";
import { getStudentDashboardData } from "../actions/student.js";
import { StudentHub } from "../../components/StudentHub";
import { demoStudent } from "../../components/campus-core-demo-data";

export default async function DashboardPage() {
  const session = await auth();

  // Keep the page guarded as well as the middleware. This protects the data
  // even when the page is rendered from a path that bypasses middleware.
  if (!session?.user) {
    redirect("/login");
  }

  const [hostel, studentData] = await Promise.all([
    getHostelMetrics(),
    getStudentDashboardData(),
  ]);

  return (
    <StudentHub
      student={{
        ...demoStudent,
        profileLinked: studentData.profileLinked,
        studentNumber: studentData.studentNumber,
        name:
          session.user.name ||
          session.user.email?.split("@")[0] ||
          demoStudent.name,
        email: session.user.email || "Email unavailable",
        major: studentData.major || "Student profile not linked",
      }}
      courses={studentData.enrolledCourses}
      hostel={hostel}
    />
  );
}
