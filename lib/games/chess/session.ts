/**
 * Chess session factory.
 *
 * chess.js owns the rules: legal moves, check, checkmate, stalemate, draws,
 * castling, en passant, and promotion. This factory keeps that engine behind
 * a small interface the board can render. It is not a chess engine.
 */
import {
  Chess,
  validateFen,
  type Color,
  type Move,
  type PieceSymbol,
  type Square,
} from "chess.js";

export interface StatusView {
  label: string;
  tone: "play" | "check" | "over";
  over: boolean;
  draw: boolean;
  winner: Color | null;
}

export interface HistoryEntry {
  san: string;
  from: Square;
  to: Square;
}

export interface ChessView {
  fen: string;
  rows: ({ square: Square; type: PieceSymbol; color: Color } | null)[][];
  turn: Color;
  status: StatusView;
  history: HistoryEntry[];
  captured: Record<Color, PieceSymbol[]>;
  checkSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
}

const PIECE_ORDER: PieceSymbol[] = ["q", "r", "b", "n", "p"];

export function describePosition(chess: Chess, resigned: Color | null): StatusView {
  if (resigned) {
    const winner: Color = resigned === "w" ? "b" : "w";
    const resignedName = resigned === "w" ? "White" : "Black";
    const winnerName = winner === "w" ? "White" : "Black";
    return {
      label: `${resignedName} resigns. ${winnerName} wins.`,
      tone: "over",
      over: true,
      draw: false,
      winner,
    };
  }

  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === "w" ? "b" : "w";
    const winnerName = winner === "w" ? "White" : "Black";
    return {
      label: `Checkmate. ${winnerName} wins.`,
      tone: "over",
      over: true,
      draw: false,
      winner,
    };
  }

  if (chess.isStalemate()) {
    return { label: "Stalemate. The game is a draw.", tone: "over", over: true, draw: true, winner: null };
  }
  if (chess.isThreefoldRepetition()) {
    return { label: "Draw by threefold repetition.", tone: "over", over: true, draw: true, winner: null };
  }
  if (chess.isInsufficientMaterial()) {
    return { label: "Draw by insufficient material.", tone: "over", over: true, draw: true, winner: null };
  }
  if (chess.isDrawByFiftyMoves()) {
    return { label: "Draw by the fifty-move rule.", tone: "over", over: true, draw: true, winner: null };
  }
  if (chess.isDraw()) {
    return { label: "Draw.", tone: "over", over: true, draw: true, winner: null };
  }

  const side = chess.turn() === "w" ? "White" : "Black";
  if (chess.inCheck()) {
    return { label: `${side} is in check.`, tone: "check", over: false, draw: false, winner: null };
  }
  return { label: `${side} to move.`, tone: "play", over: false, draw: false, winner: null };
}

export function capturedFrom(history: readonly Move[]): Record<Color, PieceSymbol[]> {
  const taken: Record<Color, PieceSymbol[]> = { w: [], b: [] };
  for (const move of history) {
    if (!move.captured) continue;
    const victim: Color = move.color === "w" ? "b" : "w";
    taken[victim].push(move.captured);
  }
  for (const color of ["w", "b"] as const) {
    taken[color].sort((a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b));
  }
  return taken;
}

export function resultForPerspective(
  status: StatusView,
  perspective: Color,
): "WIN" | "LOSS" | "DRAW" | null {
  if (!status.over) return null;
  if (status.draw || !status.winner) return "DRAW";
  return status.winner === perspective ? "WIN" : "LOSS";
}

export function createChessSession(fen?: string) {
  const chess = new Chess();
  let resigned: Color | null = null;

  if (fen) {
    const parsed = validateFen(fen);
    if (!parsed.ok) throw new Error(parsed.error ?? "Invalid FEN");
    chess.load(fen);
  }

  function view(): ChessView {
    const history = chess.history({ verbose: true });
    const last = history.at(-1) ?? null;
    const inCheck = resigned === null && chess.inCheck();
    const checkSquare = inCheck ? (chess.findPiece({ type: "k", color: chess.turn() })[0] ?? null) : null;

    return {
      fen: chess.fen(),
      rows: chess.board(),
      turn: chess.turn(),
      status: describePosition(chess, resigned),
      history: history.map((move) => ({ san: move.san, from: move.from, to: move.to })),
      captured: capturedFrom(history),
      checkSquare,
      lastMove: last ? { from: last.from, to: last.to } : null,
    };
  }

  return {
    view,
    legalFrom(square: Square): Move[] {
      if (resigned || chess.isGameOver()) return [];
      return chess.moves({ square, verbose: true });
    },
    play(from: Square, to: Square, promotion?: string): Move | null {
      if (resigned || chess.isGameOver()) return null;
      try {
        return chess.move({ from, to, promotion });
      } catch {
        return null;
      }
    },
    undo() {
      resigned = null;
      return chess.undo();
    },
    reset() {
      resigned = null;
      chess.reset();
    },
    resign() {
      if (resigned || chess.isGameOver()) return false;
      resigned = chess.turn();
      return true;
    },
  };
}

export type ChessSession = ReturnType<typeof createChessSession>;
