"use client";

import dynamic from "next/dynamic";
import type { MatchRecord } from "@/lib/records";

const DeviceProgressIsland = dynamic(
  () => import("@/components/home/device-progress").then((mod) => mod.DeviceProgress),
  { ssr: false },
);

const LibraryDeskIsland = dynamic(
  () => import("@/components/library/library-desk").then((mod) => mod.LibraryDesk),
  { ssr: false, loading: () => <p className="quiet">Opening the shelf…</p> },
);

const TicTacToeIsland = dynamic(
  () => import("@/components/games/tic-tac-toe-game").then((mod) => mod.TicTacToeGame),
  { ssr: false, loading: () => <p className="quiet">Ruling the grid…</p> },
);

const ChessRouteIsland = dynamic(
  () => import("@/components/games/chess-route").then((mod) => mod.ChessRoute),
  { ssr: false, loading: () => <p className="quiet">Setting the pieces…</p> },
);

export function DeviceProgress({ note }: { note?: string }) {
  return <DeviceProgressIsland note={note} />;
}

export function LibraryDesk({
  initialBooks,
}: {
  initialBooks: { id: string; title: string; author: string; pages: number; read: boolean; createdAt: string }[] | null;
}) {
  return <LibraryDeskIsland initialBooks={initialBooks} />;
}

export function TicTacToeGame({ signedIn, historySeed }: { signedIn: boolean; historySeed: MatchRecord[] }) {
  return <TicTacToeIsland signedIn={signedIn} historySeed={historySeed} />;
}

export function ChessRoute({ signedIn, history }: { signedIn: boolean; history: MatchRecord[] }) {
  return <ChessRouteIsland signedIn={signedIn} history={history} />;
}
