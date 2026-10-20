import type { Metadata } from "next";
import { Suspense } from "react";
import { TicTacToeGame } from "@/components/islands";
import { PageIntro } from "@/components/shell/page-intro";
import { getCurrentAccount } from "@/lib/data/account";
import { recentMatches } from "@/lib/data/queries";
import type { MatchRecord } from "@/lib/records";

export const metadata: Metadata = { title: "Tic Tac Toe" };

export default function TicTacToePage() {
  return (
    <>
      <PageIntro
        index="Tic Tac Toe"
        title="A small board with a serious opponent."
        lede="X is violet and moves first. O is ice. Hard mode is minimax: it takes a win, blocks a loss, and draws a perfect game."
      />
      <Suspense fallback={<p className="quiet">Ruling the grid…</p>}>
        <TicTacToeLoader />
      </Suspense>
    </>
  );
}

async function TicTacToeLoader() {
  let signedIn = false;
  let history: MatchRecord[] = [];
  try {
    const account = await getCurrentAccount();
    if (account) {
      signedIn = true;
      history = await recentMatches(account.id, "TIC_TAC_TOE");
    }
  } catch {
    signedIn = false;
  }
  return (
    <Suspense fallback={null}>
      <TicTacToeGame signedIn={signedIn} historySeed={history} />
    </Suspense>
  );
}
