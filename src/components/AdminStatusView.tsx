import Link from "next/link";

export type AdminStatusKind =
  | "400"
  | "401"
  | "403"
  | "404"
  | "408"
  | "429"
  | "500"
  | "502"
  | "503"
  | "504"
  | "offline"
  | "maintenance"
  | "session"
  | "unexpected";

const COPY: Record<
  AdminStatusKind,
  { code: string; title: string; body: string; primaryHref: string; primaryLabel: string }
> = {
  "400": {
    code: "400",
    title: "Bad request",
    body: "That request could not be processed. Check the form and try again.",
    primaryHref: "/dashboard",
    primaryLabel: "Dashboard",
  },
  "401": {
    code: "401",
    title: "Sign in required",
    body: "Staff must sign in to use the Aura Fresh admin console.",
    primaryHref: "/login",
    primaryLabel: "Go to login",
  },
  "403": {
    code: "403",
    title: "Access denied",
    body: "Your account does not have permission for this admin area.",
    primaryHref: "/dashboard",
    primaryLabel: "Dashboard",
  },
  "404": {
    code: "404",
    title: "Page not found",
    body: "This admin route doesn't exist.",
    primaryHref: "/dashboard",
    primaryLabel: "Dashboard",
  },
  "408": {
    code: "408",
    title: "Request timeout",
    body: "The request took too long. Try again.",
    primaryHref: "/dashboard",
    primaryLabel: "Retry",
  },
  "429": {
    code: "429",
    title: "Too many requests",
    body: "Rate limit hit. Wait a moment, then retry.",
    primaryHref: "/dashboard",
    primaryLabel: "Retry",
  },
  "500": {
    code: "500",
    title: "Server error",
    body: "The admin API failed. Try again in a moment.",
    primaryHref: "/dashboard",
    primaryLabel: "Retry dashboard",
  },
  "502": {
    code: "502",
    title: "Bad gateway",
    body: "A gateway error occurred while talking to the API.",
    primaryHref: "/dashboard",
    primaryLabel: "Retry",
  },
  "503": {
    code: "503",
    title: "Service unavailable",
    body: "Admin tools are temporarily unavailable.",
    primaryHref: "/login",
    primaryLabel: "Check again",
  },
  "504": {
    code: "504",
    title: "Gateway timeout",
    body: "The upstream service timed out.",
    primaryHref: "/dashboard",
    primaryLabel: "Retry",
  },
  offline: {
    code: "Offline",
    title: "You're offline",
    body: "Reconnect to manage products and orders.",
    primaryHref: "/dashboard",
    primaryLabel: "Retry",
  },
  maintenance: {
    code: "Soon",
    title: "Under maintenance",
    body: "Admin tools are briefly unavailable. Check back soon.",
    primaryHref: "/login",
    primaryLabel: "Check again",
  },
  session: {
    code: "Session",
    title: "Session expired",
    body: "Please sign in again to continue.",
    primaryHref: "/login",
    primaryLabel: "Sign in",
  },
  unexpected: {
    code: "Error",
    title: "Something went wrong",
    body: "An unexpected error stopped this page.",
    primaryHref: "/dashboard",
    primaryLabel: "Dashboard",
  },
};

export function AdminStatusView({
  kind,
  detail,
}: {
  kind: AdminStatusKind;
  detail?: string;
}) {
  const cfg = COPY[kind];

  return (
    <main className="min-h-screen grid place-items-center bg-[#f4f7f5] px-6 text-[#1a2e24]">
      <div className="max-w-md text-center">
        <p className="text-6xl font-semibold tracking-tight text-[#2d6a4f]">{cfg.code}</p>
        <h1 className="mt-3 text-2xl font-semibold">{cfg.title}</h1>
        <p className="mt-2 text-sm text-[#5c6f66]">{cfg.body}</p>
        {detail ? (
          <p className="mt-3 rounded-xl border border-[#c45c26]/20 bg-white px-3 py-2 text-left text-[11px] font-mono text-[#5c6f66] break-words">
            {detail}
          </p>
        ) : null}
        <Link
          href={cfg.primaryHref}
          className="mt-8 inline-flex rounded-xl bg-[#2d6a4f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#40916c]"
        >
          {cfg.primaryLabel}
        </Link>
      </div>
    </main>
  );
}
