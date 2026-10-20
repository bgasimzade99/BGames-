import type { Metadata } from "next";
import { Suspense } from "react";
import { ChessRoute } from "@/components/islands";
import { PageIntro } from "@/components/shell/page-intro";
import { getCurrentAccount } from "@/lib/data/account";
import { recentMatches } from "@/lib/data/queries";
import type { MatchRecord } from "@/lib/records";

export const metadata: Metadata = { title: "Chess" };

export default function ChessPage() {
  return (
    <>
      <PageIntro
        index="Chess"
        title="One board. Two players."
        lede="Legal moves are validated by chess.js. BGames does not include a chess engine or online multiplayer."
      />
      <Suspense fallback={<p className="quiet">Setting the pieces…</p>}>
        <ChessLoader />
      </Suspense>
    </>
  );
}

async function ChessLoader() {
  let signedIn = false;
  let history: MatchRecord[] = [];
  try {
    const account = await getCurrentAccount();
    if (account) {
      signedIn = true;
      history = await recentMatches(account.id, "CHESS");
    }
  } catch {
    signedIn = false;
  }
  return (
    <Suspense fallback={null}>
      <ChessRoute signedIn={signedIn} history={history} />
    </Suspense>
  );
}