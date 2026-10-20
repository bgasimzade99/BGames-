import Link from "next/link";

export default function NotFound() {
  return (
    <header className="page-intro">
      <p className="kicker">404</p>
      <h1>That square is empty.</h1>
      <p className="lede">The page is not on the board.</p>
      <Link className="btn btn-primary" href="/">
        Back to BGames
      </Link>
    </header>
  );
}
