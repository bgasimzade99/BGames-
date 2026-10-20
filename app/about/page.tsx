import type { Metadata } from "next";
import Link from "next/link";
import { developer } from "@/content/developer";

export const metadata: Metadata = { title: "About" };

const ASSIGNMENTS = [
  { index: "01", title: "Sign-up form", href: "/sign-up", note: "Labels, types, validation" },
  { index: "02", title: "Library", href: "/library", note: "Add, edit, read, search" },
  { index: "03", title: "Tic Tac Toe", href: "/games/tic-tac-toe", note: "Rules and minimax" },
  { index: "04", title: "Admin dashboard", href: "/admin", note: "Server-side role check" },
];

const STACK = [
  ["Next.js", "App Router and server actions"],
  ["TypeScript", "Strict game logic and UI"],
  ["PostgreSQL", "Accounts, matches, books"],
  ["Prisma", "Schema and queries"],
  ["Auth.js", "Hashed credentials and sessions"],
  ["Zod", "Shared input rules"],
  ["chess.js", "Legal chess, not a custom engine"],
  ["CSS Grid", "Boards, dashboard, and shelf"],
];

export default function AboutPage() {
  return (
    <>
      <header className="about-layout">
        <div>
          <p className="kicker">About</p>
          <h1 className="poster">{developer.name}</h1>
          <p className="lede">{developer.summary}</p>
          <p className="hint">{developer.role}. Personal links stay empty until they are set in the profile file.</p>
        </div>
        <img className="about-mark" src="/brandi.png" alt="" />
      </header>

      <nav className="ledger" aria-label="Project assignments">
        {ASSIGNMENTS.map((item) => (
          <Link key={item.href} href={item.href}>
            <span>{item.index}</span>
            <strong>{item.title}</strong>
            <em>{item.note}</em>
          </Link>
        ))}
      </nav>

      <section className="section-gap">
        <h2>Stack</h2>
        <dl className="stack-index">
          {STACK.map(([name, job]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{job}</dd>
            </div>
          ))}
        </dl>
        <div className="inline-actions">
          {developer.githubUrl ? (
            <a className="btn btn-line" href={developer.githubUrl}>
              GitHub
            </a>
          ) : null}
          {developer.portfolioUrl ? (
            <a className="btn btn-line" href={developer.portfolioUrl}>
              Portfolio
            </a>
          ) : null}
        </div>
      </section>
    </>
  );
}
