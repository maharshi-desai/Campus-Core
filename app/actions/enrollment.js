"use server";

import { auth } from "../../auth.js";
import {
  campusApiRequest,
  getAuthenticatedUserId,
} from "../../lib/campus-api.js";

async function requireSignedInUserId() {
  const session = await auth();

  if (!session?.user) {
    return { error: { success: false, message: "You must be signed in." } };
  }

  const userId = await getAuthenticatedUserId(session.user);

  if (!userId) {
    return {
      error: {
        success: false,
        message: "The signed-in account could not be found.",
      },
    };
  }

  return { userId };
}

export async function getAllCourses() {
  const { userId, error } = await requireSignedInUserId();

  if (error) {
    throw new Error(error.message);
  }

  return campusApiRequest(`/api/courses?userId=${encodeURIComponent(userId)}`);
}

export async function enrollInCourse(courseId) {
  if (typeof courseId !== "string" || courseId.trim().length === 0) {
    return { success: false, message: "A valid course ID is required." };
  }

  const { userId, error } = await requireSignedInUserId();

  if (error) {
    return error;
  }

  try {
    return await campusApiRequest("/api/enrollments", {
      method: "POST",
      body: { userId, courseId },
    });
  } catch (requestError) {
    console.error("Course enrollment request failed:", requestError);
    return {
      success: false,
      message: "We couldn’t complete your enrollment. Please try again.",
    };
  }
}
