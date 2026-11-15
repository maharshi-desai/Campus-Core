"use server";

import { auth } from "../../auth.js";
import {
  campusApiRequest,
  getAuthenticatedUserId,
} from "../../lib/campus-api.js";

export async function getHostelMetrics() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("You must be signed in to view hostel details.");
  }

  const userId = await getAuthenticatedUserId(session.user);

  if (!userId) {
    throw new Error("The signed-in account could not be found.");
  }

  return campusApiRequest(
    `/api/students/${encodeURIComponent(userId)}/hostel`,
  );
}
