import type {
  CourseList,
  HostelMetrics,
  StudentProfile,
} from "./campus-core-types";

export const demoStudent: StudentProfile = {
  name: "Avery Morgan",
  major: "Computer Science · Class of 2027",
  gpa: 3.82,
  gpaScale: 4,
};

export const demoCourses: CourseList = [
  { code: "CS 341", title: "Algorithms & Complexity", department: "Computer Science" },
  { code: "MATH 228", title: "Linear Algebra", department: "Mathematics" },
  { code: "DES 210", title: "Human-Centered Design", department: "Design" },
  { code: "STAT 205", title: "Applied Statistics", department: "Statistics" },
];

export const demoHostel: HostelMetrics = {
  blockName: "Maple Hall",
  roomCapacity: 2,
  airQualityIndex: 42,
  airQualityLabel: "Excellent",
};
