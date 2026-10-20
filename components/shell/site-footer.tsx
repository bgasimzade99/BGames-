import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>BGames · a table for chess, tic tac toe, and the books between matches.</p>
      <p>
        <Link href="/about">Project notes</Link>
      </p>
    </footer>
  );
}
