import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { CourseRegistrationCatalog } from "../../components/CourseRegistrationCatalog";
import { demoCatalogCourses } from "../../components/campus-core-demo-data";

export default async function RegisterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <CourseRegistrationCatalog courses={demoCatalogCourses} />;
}
