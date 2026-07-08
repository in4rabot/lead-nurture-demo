"use client";

import { FormEvent, useState } from "react";

const INTERESTS = [
  "Web Development",
  "Mobile App",
  "Automation / Workflow",
  "Consulting",
  "Other",
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  interest: string;
  company: string; // honeypot — hidden from real users, bots auto-fill it
}

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  phone: "",
  interest: INTERESTS[0],
  company: "",
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          interest: form.interest,
          company: form.company,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          (data && typeof data.error === "string" && data.error) ||
            "Something went wrong submitting your request. Please try again."
        );
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage(
        "We couldn't reach the server. Check your connection and try again."
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          {status !== "success" && (
            <div className="mb-8 text-center sm:mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Now accepting new projects
              </span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Let&rsquo;s build something great together
              </h1>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Tell us a bit about your project and we&rsquo;ll follow up
                personally within one business day &mdash; no forms
                disappearing into a black hole.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            {status === "success" ? (
              <SuccessMessage
                onReset={() => {
                  setForm(INITIAL_STATE);
                  setStatus("idle");
                  setErrorMessage(null);
                }}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                >
                  <label htmlFor="company">Company (leave this blank)</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Jordan Alvarez"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jordan@company.com"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Phone{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="interest"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    What are you looking for?
                  </label>
                  <select
                    id="interest"
                    name="interest"
                    value={form.interest}
                    onChange={(e) => updateField("interest", e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {INTERESTS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {status === "error" && errorMessage && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900"
                >
                  {status === "loading" ? (
                    <>
                      <Spinner />
                      Sending your request&hellip;
                    </>
                  ) : (
                    "Get in touch"
                  )}
                </button>

                <p className="text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                  We respect your inbox. Your details are only used to follow
                  up about this inquiry.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <svg
          className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
        Thanks &mdash; you&rsquo;re all set
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        A confirmation email is on its way to your inbox, and someone from
        our team will personally follow up soon to talk through your
        project.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        Submit another inquiry
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
