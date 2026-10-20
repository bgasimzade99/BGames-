import Link from "next/link";
import { Suspense } from "react";
import { ChessGame } from "@/components/games/chess-game";
import { DeviceProgress } from "@/components/islands";
import { StatGrid } from "@/components/stats/stat-grid";
import { developer } from "@/content/developer";
import { getCurrentAccount } from "@/lib/data/account";
import { userSummary } from "@/lib/data/queries";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="kicker">01 — Arena</p>
          <h1 className="hero-title">
            <span>Think.</span>
            <span>Play.</span>
            <span>Dominate.</span>
          </h1>
          <p className="lede">
            A new playground for strategic minds. Challenge yourself, sharpen your skills, and make every move count.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/games/chess">
              Open the board
            </Link>
            <Link className="btn btn-line" href="/games/tic-tac-toe">
              Play tic tac toe
            </Link>
          </div>
        </div>
        <ChessGame variant="preview" />
      </section>

      <section className="catalog" aria-label="Featured games">
        <Link href="/games/chess">
          <span className="idx">01</span>
          <div>
            <h2>Chess</h2>
            <p>A local board. Legal moves, check, castling, promotion, and en passant. No engine and no online opponent.</p>
          </div>
          <span className="go btn btn-line">Play</span>
        </Link>
        <Link href="/games/tic-tac-toe">
          <span className="idx">02</span>
          <div>
            <h2>Tic Tac Toe</h2>
            <p>Pass-and-play, or sit across from a minimax opponent that does not miss a forced win.</p>
          </div>
          <span className="go btn btn-line">Play</span>
        </Link>
        <Link href="/library">
          <span className="idx">03</span>
          <div>
            <h2>Library</h2>
            <p>A private shelf. Guests keep it on this device. An account keeps it in PostgreSQL.</p>
          </div>
          <span className="go btn btn-line">Open</span>
        </Link>
      </section>

      <Suspense fallback={<p className="section-gap quiet">Reading the record…</p>}>
        <HomeProgress />
      </Suspense>

      <section className="steps" aria-label="How BGames works">
        <article>
          <p className="kicker">01</p>
          <h2>Choose a table</h2>
          <p className="quiet">Chess for a full ruleset. Tic tac toe for a short duel. The library for everything you are reading.</p>
        </article>
        <article>
          <p className="kicker">02</p>
          <h2>Play the position</h2>
          <p className="quiet">Moves are checked before they land. Hard tic tac toe searches the tree. Chess never invents a rule.</p>
        </article>
        <article>
          <p className="kicker">03</p>
          <h2>Keep the record</h2>
          <p className="quiet">Guests store results on this device. Signed-in players write matches and books to their own account.</p>
        </article>
      </section>

      <section className="section-gap developer-grid">
        <div>
          <p className="kicker">Builder</p>
          <h2>{developer.name}</h2>
          <p className="lede">{developer.summary}</p>
          <Link className="btn btn-line" href="/about" style={{ marginTop: "1rem" }}>
            Project notes
          </Link>
        </div>
        <p className="quiet">
          BGames is a student project with a production shape: accounts, a database, and games whose rules you can test.
        </p>
      </section>
    </>
  );
}

async function HomeProgress() {
  let account = null;
  let databaseDown = false;
  try {
    account = await getCurrentAccount();
  } catch {
    databaseDown = true;
  }
  if (databaseDown || !account) {
    return (
      <DeviceProgress
        note={databaseDown ? "Account stats need PostgreSQL. This device can still keep a local record." : undefined}
      />
    );
  }

  let summary = null;
  try {
    summary = await userSummary(account.id);
  } catch {
    return <DeviceProgress note="Account stats need PostgreSQL. This device can still keep a local record." />;
  }

  return (
    <section className="section-gap" aria-label="Your record">
      <p className="kicker">Record</p>
      <h2>Your account</h2>
      {summary.games === 0 ? (
        <p className="quiet">No saved matches yet. Finish a game while you are signed in and the count starts here.</p>
      ) : (
        <StatGrid summary={summary} />
      )}
    </section>
  );
}
