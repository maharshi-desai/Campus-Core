import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { StudentHub } from "../../components/StudentHub";
import {
  demoCourses,
  demoHostel,
  demoStudent,
} from "../../components/campus-core-demo-data";

export default async function DashboardPage() {
  const session = await auth();

  // Keep the page guarded as well as the middleware. This protects the data
  // even when the page is rendered from a path that bypasses middleware.
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <StudentHub
      student={{ ...demoStudent, name: session.user.name ?? demoStudent.name }}
      courses={demoCourses}
      hostel={demoHostel}
    />
  );
}
