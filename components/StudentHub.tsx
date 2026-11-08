import type {
  CourseList,
  HostelMetrics,
  StudentProfile,
} from "./campus-core-types";

export interface StudentHubProps {
  student: StudentProfile;
  courses: CourseList;
  hostel: HostelMetrics;
}

export function StudentHub({ student, courses, hostel }: StudentHubProps) {
  const gpaProgress = Math.min(100, Math.max(0, (student.gpa / student.gpaScale) * 100));

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-950 text-xs font-semibold tracking-tight text-white">
              CC
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">CampusCore</p>
              <p className="text-xs text-slate-500">Student hub</p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white text-xs font-semibold text-slate-600 shadow-sm" aria-label={`Signed in as ${student.name}`}>
            {getInitials(student.name)}
          </div>
        </header>

        <div className="mb-7 sm:mb-8">
          <p className="mb-2 text-sm font-medium text-blue-600">Your campus, at a glance</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-[40px]">
            Good to see you, {getFirstName(student.name)}.
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-[15px]">
            A clear view of your academics and campus life.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-28px_rgba(15,23,42,0.28)] sm:p-7 lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Academic standing</p>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                  {student.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{student.major}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <AcademicIcon />
              </span>
            </div>

            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Current GPA
                </p>
                <p className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.065em] text-slate-950">
                  {student.gpa.toFixed(2)}
                  <span className="ml-1 text-lg font-medium tracking-normal text-slate-400">
                    / {student.gpaScale.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
            <div
              className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label="GPA relative to scale"
              aria-valuemin={0}
              aria-valuemax={student.gpaScale}
              aria-valuenow={student.gpa}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-[width] duration-700 ease-out"
                style={{ width: `${gpaProgress}%` }}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-28px_rgba(15,23,42,0.28)] sm:p-7 lg:col-span-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Learning this term</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Enrolled courses
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {courses.length} courses
              </span>
            </div>

            <ul className="divide-y divide-slate-100">
              {courses.map((course) => (
                <li key={course.code} className="flex items-center gap-4 py-4 first:pt-1 last:pb-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-slate-50 text-slate-500">
                    <BookIcon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-sm font-semibold text-slate-800">{course.title}</h3>
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        {course.department}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{course.code}</p>
                  </div>
                  <span aria-hidden="true" className="text-slate-300">
                    <ChevronIcon />
                  </span>
                </li>
              ))}
              {courses.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-500">
                  No courses to show yet.
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-28px_rgba(15,23,42,0.28)] sm:p-7 lg:col-span-12">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <HomeIcon />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-500">Housing &amp; environment</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                    {hostel.blockName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Your hostel block</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 sm:gap-12">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                    Room capacity
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {hostel.roomCapacity}
                    <span className="ml-1.5 text-sm font-medium text-slate-500">
                      {hostel.roomCapacity === 1 ? "student" : "students"}
                    </span>
                  </p>
                </div>
                <div className="h-10 w-px bg-slate-100" />
                <AirQualityGauge metrics={hostel} />
              </div>
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}

function AirQualityGauge({ metrics }: { metrics: HostelMetrics }) {
  const max = metrics.airQualityMax ?? 500;
  const value = Math.min(max, Math.max(0, metrics.airQualityIndex));
  const progress = max > 0 ? value / max : 0;
  const circumference = 2 * Math.PI * 19;

  return (
    <div className="flex items-center gap-3" aria-label="Hostel air quality">
      <div className="relative h-[68px] w-[68px] shrink-0">
        <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90" role="img" aria-label={`Air quality index ${metrics.airQualityIndex}`}>
          <circle cx="24" cy="24" r="19" fill="none" stroke="#e8edf3" strokeWidth="4" />
          <circle
            cx="24"
            cy="24"
            r="19"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circumference * progress} ${circumference}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold tracking-tight text-slate-900">
          {metrics.airQualityIndex}
        </span>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">
          Air quality
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800">AQI</p>
        {metrics.airQualityLabel && (
          <p className="mt-0.5 text-xs text-teal-700">{metrics.airQualityLabel}</p>
        )}
      </div>
    </div>
  );
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AcademicIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 11.2v4.3c2.9 2.5 7.1 2.5 10 0v-4.3M21 9v6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h13v16H7a2.5 2.5 0 0 0-2.5 2v-15.5Z" />
      <path d="M4.5 5.5v15.1A2.4 2.4 0 0 1 7 19h13M9 7h7M9 10h7" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}
