"use client";

import { useState } from "react";

export function CourseRegistrationCatalog({ courses }) {
  const departments = [...new Set(courses.map((course) => course.department))];
  const [selectedDepartment, setSelectedDepartment] = useState("All departments");
  const visibleCourses =
    selectedDepartment === "All departments"
      ? courses
      : courses.filter((course) => course.department === selectedDepartment);

  return (
    <main className="min-h-screen bg-[#f5f5f7] px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-950 text-xs font-semibold tracking-tight text-white">
            CC
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">CampusCore</p>
            <p className="text-xs text-slate-500">Course registration</p>
          </div>
        </header>

        <section className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-600">Build your semester</p>
            <h1 className="text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-[40px]">
              Course catalog
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
              Explore courses from across campus and find the right fit for your term.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            <span className="font-semibold text-slate-900">{visibleCourses.length}</span>{" "}
            {visibleCourses.length === 1 ? "course" : "courses"} available
          </div>
        </section>

        <section aria-label="Filter courses by department" className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All departments", ...departments].map((department) => {
              const isSelected = selectedDepartment === department;
              return (
                <button
                  key={department}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDepartment(department)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 ${
                    isSelected
                      ? "bg-slate-950 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {department}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Available courses" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course) => (
            <article
              key={course.code}
              className="group flex min-h-56 flex-col rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_42px_-28px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  {course.department}
                </span>
                <span className="text-xs font-medium tracking-wide text-slate-400">{course.code}</span>
              </div>
              <div className="mt-6 flex-1">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">{course.title}</h2>
                <p className="mt-2 text-sm text-slate-500">Undergraduate · Fall term</p>
              </div>
              <button
                type="button"
                disabled
                aria-label={`Enroll in ${course.code} ${course.title} (unavailable)`}
                className="mt-5 min-h-11 w-full cursor-not-allowed rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-400"
              >
                Enroll
              </button>
            </article>
          ))}
          {visibleCourses.length === 0 && (
            <p className="col-span-full rounded-[26px] border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-500">
              No courses are available in this department yet.
            </p>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Enrollment will be available once registration opens.
        </p>
      </div>
    </main>
  );
}
