import { redirect } from "next/navigation";
import { auth } from "../../auth.js";
import { getAllCourses } from "../actions/enrollment.js";
import { CourseRegistrationCatalog } from "../../components/CourseRegistrationCatalog";

export default async function RegisterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const courses = await getAllCourses();

  return <CourseRegistrationCatalog courses={courses} />;
}
