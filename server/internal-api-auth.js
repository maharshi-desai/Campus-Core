import { timingSafeEqual } from "node:crypto";

export function requireInternalApi(request, response, next) {
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (!expectedSecret) {
    console.error("INTERNAL_API_SECRET is not configured.");
    return response.status(503).json({ message: "API authentication is unavailable." });
  }

  const authorization = request.get("authorization") ?? "";
  const suppliedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expected = Buffer.from(expectedSecret);
  const supplied = Buffer.from(suppliedSecret);

  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return response.status(401).json({ message: "Unauthorized." });
  }

  return next();
}
