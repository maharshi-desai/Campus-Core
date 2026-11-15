import { prisma } from "./prisma.js";

export async function getAuthenticatedUserId(sessionUser) {
  if (typeof sessionUser?.id === "string" && sessionUser.id.length > 0) {
    return sessionUser.id;
  }

  if (typeof sessionUser?.email !== "string" || sessionUser.email.length === 0) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function campusApiRequest(path, { method = "GET", body } = {}) {
  const baseUrl = process.env.CAMPUS_API_URL?.replace(/\/+$/, "");
  const secret = process.env.CAMPUS_API_SECRET;

  if (!baseUrl || !secret) {
    throw new Error("CAMPUS_API_URL and CAMPUS_API_SECRET must be configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${secret}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `CampusCore API returned ${response.status}.`);
  }

  return result;
}
