import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ResultChart } from "@/components/charts/result-chart";
import { PageIntro } from "@/components/shell/page-intro";
import { StatGrid } from "@/components/stats/stat-grid";
import { getCurrentAccount } from "@/lib/data/account";
import { libraryCount, userSummary } from "@/lib/data/queries";
import { formatWhen, gameLabel } from "@/lib/records";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="quiet">Opening your board…</p>}>
      <DashboardBody />
    </Suspense>
  );
}

async function DashboardBody() {
  let account;
  try {
    account = await getCurrentAccount();
  } catch {
    return (
      <PageIntro
        index="Dashboard"
        title="Record unavailable."
        lede="Your session is fine, but PostgreSQL did not answer. Start the database and reload."
      />
    );
  }
  if (!account) redirect("/sign-in");

  let summary;
  let shelf;
  try {
    [summary, shelf] = await Promise.all([userSummary(account.id), libraryCount(account.id)]);
  } catch {
    return (
      <>
        <PageIntro index="Dashboard" title={account.name} lede="Your record lives in PostgreSQL. The database is not reachable from this environment." />
      </>
    );
  }

  return (
    <>
      <PageIntro
        index="Dashboard"
        title={account.name}
        lede="Matches you finish while signed in, and the books on your shelf. Empty numbers stay empty."
      />
      {summary.games === 0 ? (
        <p className="quiet">
          No matches yet. <Link href="/games">Play a game</Link> and the result will be stored on this account.
        </p>
      ) : (
        <>
          <StatGrid summary={summary} />
          <ResultChart
            data={[
              { name: "Wins", value: summary.wins, fill: "#3DDC97" },
              { name: "Losses", value: summary.losses, fill: "#F07178" },
              { name: "Draws", value: summary.draws, fill: "#929AAA" },
            ]}
          />
        </>
      )}
      <section className="section-gap">
        <h2>Library</h2>
        <p className="quiet">
          {shelf.total === 0
            ? "No books saved to this account."
            : `${shelf.total} books · ${shelf.read} read · ${shelf.pages} pages`}
        </p>
        <Link className="btn btn-line" href="/library">
          Open library
        </Link>
      </section>
      <section className="section-gap">
        <h2>Recent matches</h2>
        {summary.recent.length === 0 ? (
          <p className="quiet">Nothing recorded.</p>
        ) : (
          <table className="data-table">
            <caption className="sr-only">Recent matches for {account.name}</caption>
            <thead>
              <tr>
                <th scope="col">Game</th>
                <th scope="col">Result</th>
                <th scope="col">Opponent</th>
                <th scope="col">Moves</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent.map((match) => (
                <tr key={match.id}>
                  <td>{gameLabel(match.game)}</td>
                  <td>{match.result}</td>
                  <td>{match.opponent}</td>
                  <td className="num">{match.moves}</td>
                  <td>{formatWhen(match.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
