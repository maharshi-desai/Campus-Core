import { GoogleLoginCard } from "../../components/GoogleLoginCard";

export default async function LoginPage({ searchParams = {} }) {
  const { callbackUrl } = await searchParams;
  const requestedPath = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
  const redirectTo =
    requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    !requestedPath.includes("\\")
      ? requestedPath
      : "/dashboard";

  return <GoogleLoginCard redirectTo={redirectTo} />;
}
