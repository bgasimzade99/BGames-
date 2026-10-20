"use client";

import { useEffect, useRef, useState } from "react";
import type { Color, PieceSymbol, Square } from "chess.js";
import Link from "next/link";
import { saveMatch } from "@/app/actions/play";
import { ChessPiece, pieceName } from "@/components/games/chess-piece";
import {
  createChessSession,
  resultForPerspective,
  type ChessSession,
  type ChessView,
} from "@/lib/games/chess/session";
import { readLocalMatches, saveLocalMatch, type MatchRecord } from "@/lib/records";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function boot(fen?: string) {
  try {
    return { session: createChessSession(fen), notice: fen ? null : null };
  } catch {
    return {
      session: createChessSession(),
      notice: "That position could not be loaded. The board was reset to the opening.",
    };
  }
}

interface Cell {
  square: Square;
  piece: { type: PieceSymbol; color: Color } | null;
}

function cellsFor(view: ChessView, orientation: Color): Cell[][] {
  const mapped = view.rows.map((row, rowIndex) =>
    row.map((piece, colIndex) => ({
      square: `${FILES[colIndex]}${8 - rowIndex}` as Square,
      piece: piece ? { type: piece.type, color: piece.color } : null,
    })),
  );
  if (orientation === "w") return mapped;
  return [...mapped].reverse().map((row) => [...row].reverse());
}

function neighbor(square: Square, key: string, orientation: Color): Square | null {
  const file = FILES.indexOf(square[0] as (typeof FILES)[number]);
  const rank = Number(square[1]);
  let nextFile = file;
  let nextRank = rank;
  const forward = orientation === "w" ? 1 : -1;
  if (key === "ArrowLeft") nextFile += orientation === "w" ? -1 : 1;
  if (key === "ArrowRight") nextFile += orientation === "w" ? 1 : -1;
  if (key === "ArrowUp") nextRank += forward;
  if (key === "ArrowDown") nextRank -= forward;
  if (nextFile < 0 || nextFile > 7 || nextRank < 1 || nextRank > 8) return null;
  return `${FILES[nextFile]}${nextRank}` as Square;
}

export function ChessGame({
  variant = "full",
  initialFen,
  signedIn = false,
  historySeed = [],
}: {
  variant?: "full" | "preview";
  initialFen?: string;
  signedIn?: boolean;
  historySeed?: MatchRecord[];
}) {
  const [table] = useState(() => boot(initialFen));
  const session: ChessSession = table.session;

  const [view, setView] = useState(() => session.view());
  const [orientation, setOrientation] = useState<Color>("w");
  const [perspective, setPerspective] = useState<Color>("w");
  const [selected, setSelected] = useState<Square | null>(null);
  const [pending, setPending] = useState<{ from: Square; to: Square } | null>(null);
  const [armReset, setArmReset] = useState(false);
  const [matches, setMatches] = useState<MatchRecord[]>(() => {
    if (variant !== "full" || signedIn || typeof window === "undefined") return historySeed;
    return readLocalMatches().filter((match) => match.game === "CHESS").slice(0, 8);
  });
  const [notice, setNotice] = useState<string | null>(table.notice);
  const recorded = useRef<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const queenRef = useRef<HTMLButtonElement>(null);

  const legal = selected ? session.legalFrom(selected) : [];
  const targets = new Set(legal.map((move) => move.to));

  function publish(next = session.view()) {
    setView(next);
    if (variant !== "full" || !next.status.over || recorded.current === next.fen) return;
    const result = resultForPerspective(next.status, perspective);
    if (!result) return;
    recorded.current = next.fen;
    const payload = {
      game: "CHESS" as const,
      result,
      opponent: `Local · ${perspective === "w" ? "White" : "Black"}`,
      moves: Math.max(1, next.history.length),
    };
    if (signedIn) {
      void saveMatch(payload).then((response) => {
        if (response.match) setMatches((current) => [response.match!, ...current].slice(0, 8));
        else if (response.message) setNotice(response.message);
      });
      return;
    }
    const stored = saveLocalMatch({
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
    });
    setMatches(stored.filter((match) => match.game === "CHESS").slice(0, 8));
  }

  function choose(square: Square) {
    if (view.status.over) return;
    const piece = view.rows.flat().find((entry) => entry?.square === square);
    if (selected && targets.has(square)) {
      const choices = legal.filter((move) => move.to === square);
      if (choices.some((move) => move.promotion)) {
        setPending({ from: selected, to: square });
        return;
      }
      session.play(selected, square);
      setSelected(null);
      publish();
      return;
    }
    if (piece && piece.color === view.turn) {
      setSelected(square);
      return;
    }
    setSelected(null);
  }

  function promote(piece: "q" | "r" | "b" | "n") {
    if (!pending) return;
    session.play(pending.from, pending.to, piece);
    setPending(null);
    setSelected(null);
    publish();
  }

  useEffect(() => {
    if (pending) queenRef.current?.focus();
  }, [pending]);

  const rows = cellsFor(view, orientation);
  const bottomRank = orientation === "w" ? "1" : "8";
  const leftFile = orientation === "w" ? "a" : "h";

  return (
    <div className={variant === "preview" ? "panel" : "split"}>
      <div>
        <div className="panel-head">
          <p className={`status-${view.status.tone}`} aria-live="polite">
            {view.status.label}
          </p>
          {variant === "preview" ? <span className="kicker">Opening</span> : <span className="kicker">Local board</span>}
        </div>
        <div className="chess-board" role="grid" aria-label="Chessboard">
          {rows.flat().map((cell) => {
            const file = cell.square[0];
            const rank = cell.square[1];
            const isLight = (FILES.indexOf(file as (typeof FILES)[number]) + Number(rank)) % 2 === 0;
            const isTarget = targets.has(cell.square);
            const label = [
              cell.square,
              cell.piece ? pieceName(cell.piece.type, cell.piece.color) : "empty",
              isTarget ? "legal move" : "",
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <button
                key={cell.square}
                type="button"
                role="gridcell"
                ref={(node) => {
                  if (node) buttons.current.set(cell.square, node);
                }}
                className={[
                  "square",
                  isLight ? "is-light" : "is-dark",
                  selected === cell.square ? "is-selected" : "",
                  view.lastMove && (view.lastMove.from === cell.square || view.lastMove.to === cell.square) ? "is-last" : "",
                  view.checkSquare === cell.square ? "is-check" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-label={label}
                aria-selected={selected === cell.square}
                onClick={() => choose(cell.square)}
                onKeyDown={(event) => {
                  const next = neighbor(cell.square, event.key, orientation);
                  if (!next) return;
                  event.preventDefault();
                  buttons.current.get(next)?.focus();
                }}
              >
                {file === leftFile ? <span className="coord coord-rank">{rank}</span> : null}
                {rank === bottomRank ? <span className="coord coord-file">{file}</span> : null}
                {cell.piece ? <ChessPiece type={cell.piece.type} color={cell.piece.color} /> : null}
                {isTarget && cell.piece ? <span className="capture-ring" /> : null}
                {isTarget && !cell.piece ? <span className="move-dot" /> : null}
              </button>
            );
          })}
        </div>
        {variant === "preview" ? (
          <div className="hero-actions">
            <Link className="btn btn-primary" href={`/games/chess?fen=${encodeURIComponent(view.fen)}`}>
              Take this position
            </Link>
            <Link className="btn btn-line" href="/games/chess">
              New game
            </Link>
          </div>
        ) : null}
      </div>

      {variant === "full" ? (
        <aside className="panel">
          <p className="quiet">No engine. Two people, one screen. Rules come from chess.js.</p>
          <div className="field" style={{ marginTop: "0.9rem" }}>
            <label htmlFor="perspective">Record the result for</label>
            <select
              id="perspective"
              value={perspective}
              onChange={(event) => setPerspective(event.target.value as Color)}
            >
              <option value="w">White</option>
              <option value="b">Black</option>
            </select>
          </div>
          <p className="kicker">Captured by White</p>
          <div className="captured" aria-label="Pieces captured by White">
            {view.captured.b.map((type, index) => (
              <ChessPiece key={`b-${type}-${index}`} type={type} color="b" />
            ))}
          </div>
          <p className="kicker">Captured by Black</p>
          <div className="captured" aria-label="Pieces captured by Black">
            {view.captured.w.map((type, index) => (
              <ChessPiece key={`w-${type}-${index}`} type={type} color="w" />
            ))}
          </div>
          <div className="inline-actions">
            <button
              type="button"
              className="btn btn-line"
              onClick={() => {
                session.undo();
                recorded.current = null;
                setSelected(null);
                publish();
              }}
            >
              Undo
            </button>
            <button
              type="button"
              className="btn btn-line"
              onClick={() => setOrientation((side) => (side === "w" ? "b" : "w"))}
            >
              Flip
            </button>
            <button
              type="button"
              className="btn btn-line"
              onClick={() => {
                if (view.status.over) return;
                session.resign();
                publish();
              }}
            >
              Resign
            </button>
            <button
              type="button"
              className="btn btn-line"
              onClick={() => {
                if (!armReset) {
                  setArmReset(true);
                  window.setTimeout(() => setArmReset(false), 2400);
                  return;
                }
                session.reset();
                recorded.current = null;
                setSelected(null);
                setArmReset(false);
                publish();
              }}
            >
              {armReset ? "Confirm reset" : "Reset"}
            </button>
          </div>
          <h2 className="kicker" style={{ marginTop: "1rem" }}>
            Moves
          </h2>
          <ol className="move-list">
            {Array.from({ length: Math.ceil(view.history.length / 2) }, (_, index) => (
              <li key={index}>
                <span>{index + 1}</span>
                <span>{view.history[index * 2]?.san}</span>
                <span>{view.history[index * 2 + 1]?.san ?? ""}</span>
              </li>
            ))}
          </ol>
          {matches.length > 0 ? (
            <>
              <h2 className="kicker" style={{ marginTop: "1rem" }}>
                Recent results
              </h2>
              <ul className="move-list">
                {matches.map((match) => (
                  <li key={match.id}>
                    <span />
                    <span>{match.result}</span>
                    <span>{match.opponent}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="hint">Finished games appear here.</p>
          )}
          {notice ? <p className="note">{notice}</p> : null}
        </aside>
      ) : null}

      {pending ? (
        <div className="dialog-backdrop">
          <div role="dialog" aria-modal="true" aria-labelledby="promo-title" className="dialog">
            <h2 id="promo-title">Promote the pawn</h2>
            <div className="promo-grid">
              {(
                [
                  ["q", "Queen"],
                  ["r", "Rook"],
                  ["b", "Bishop"],
                  ["n", "Knight"],
                ] as const
              ).map(([piece, label]) => (
                <button key={piece} type="button" ref={piece === "q" ? queenRef : undefined} onClick={() => promote(piece)}>
                  <ChessPiece type={piece} color={view.turn} />
                  <span className="sr-only">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
