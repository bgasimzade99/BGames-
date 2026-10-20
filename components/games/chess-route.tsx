"use client";

import { useSearchParams } from "next/navigation";
import { ChessGame } from "@/components/games/chess-game";
import type { MatchRecord } from "@/lib/records";

export function ChessRoute({ signedIn, history }: { signedIn: boolean; history: MatchRecord[] }) {
  const params = useSearchParams();
  const fen = params.get("fen") ?? undefined;
  return <ChessGame key={fen ?? "start"} initialFen={fen} signedIn={signedIn} historySeed={history} />;
}
