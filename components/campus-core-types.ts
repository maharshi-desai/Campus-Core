export interface StudentProfile {
  name: string;
  major: string;
  gpa: number;
  gpaScale: number;
}

export interface Course {
  code: string;
  title: string;
  department: string;
}

export type CourseList = readonly Course[];

export interface HostelMetrics {
  blockName: string;
  roomCapacity: number;
  airQualityIndex: number;
  airQualityLabel?: string;
  /** Maximum value represented by the gauge. Defaults to 500. */
  airQualityMax?: number;
}
