import { GoogleLoginCard } from "../../components/GoogleLoginCard";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const requestedPath = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
  const redirectTo =
    requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/dashboard";

  return <GoogleLoginCard redirectTo={redirectTo} />;
}
