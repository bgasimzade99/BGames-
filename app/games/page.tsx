import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/shell/page-intro";

export const metadata: Metadata = { title: "Games" };

export default function GamesPage() {
  return (
    <>
      <PageIntro
        index="Games"
        title="Two tables. Both playable."
        lede="BGames does not pretend to be a storefront. These are the games on the platform, and both of them run in the browser."
      />
      <section className="catalog" aria-label="Available games">
        <Link href="/games/chess">
          <span className="idx">01</span>
          <div>
            <h2>Chess</h2>
            <p>
              Starting position, legal move highlights, check and checkmate, stalemate and other draws, pawn promotion,
              castling, en passant, captured pieces, move history, undo, and board flip.
            </p>
          </div>
          <span className="go btn btn-line">Enter</span>
        </Link>
        <Link href="/games/tic-tac-toe">
          <span className="idx">02</span>
          <div>
            <h2>Tic Tac Toe</h2>
            <p>
              Human against human, or human against a computer. Easy picks a random empty square. Hard uses minimax and
              plays perfectly.
            </p>
          </div>
          <span className="go btn btn-line">Enter</span>
        </Link>
      </section>
    </>
  );
}
