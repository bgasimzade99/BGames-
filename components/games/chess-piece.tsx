import type { Color, PieceSymbol } from "chess.js";

export function ChessPiece({ type, color }: { type: PieceSymbol; color: Color }) {
  const fill = color === "w" ? "#FBFBFB" : "#161616";
  const stroke = color === "w" ? "#161616" : "#FBFBFB";
  const shared = { fill, stroke, strokeWidth: 1.5, strokeLinejoin: "round" as const };

  return (
    <svg viewBox="0 0 40 40" className="piece" aria-hidden="true">
      {type === "p" && (
        <>
          <circle cx="20" cy="12" r="5" {...shared} />
          <path d="M15 22h10l2 8H13z" {...shared} />
          <rect x="11" y="31" width="18" height="3.5" rx="1" {...shared} />
        </>
      )}
      {type === "r" && (
        <>
          <path d="M11 9h5v4h3V9h4v4h3V9h4v8H11z" {...shared} />
          <rect x="13" y="17" width="14" height="12" {...shared} />
          <rect x="10" y="30" width="20" height="4" rx="1" {...shared} />
        </>
      )}
      {type === "n" && <path d="M11 33V22l6-2-2-7 6-4 5 6-2 4 6 3v11z" {...shared} />}
      {type === "b" && (
        <>
          <path d="M20 6l8 16H12z" {...shared} />
          <path d="M20 11v8" stroke={stroke} strokeWidth="1.4" />
          <rect x="12" y="24" width="16" height="4" {...shared} />
          <rect x="10" y="30" width="20" height="4" rx="1" {...shared} />
        </>
      )}
      {type === "q" && (
        <>
          <circle cx="11" cy="11" r="2.2" {...shared} />
          <circle cx="20" cy="8" r="2.2" {...shared} />
          <circle cx="29" cy="11" r="2.2" {...shared} />
          <path d="M10 15l4 12h12l4-12" {...shared} />
          <rect x="10" y="29" width="20" height="4" rx="1" {...shared} />
        </>
      )}
      {type === "k" && (
        <>
          <path d="M18 4h4v4h4v4h-4v4h-4v-4h-4V8h4z" {...shared} />
          <path d="M12 18h16l-2 10H14z" {...shared} />
          <rect x="10" y="30" width="20" height="4" rx="1" {...shared} />
        </>
      )}
    </svg>
  );
}

const NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

export function pieceName(type: PieceSymbol, color: Color): string {
  return `${color === "w" ? "white" : "black"} ${NAMES[type]}`;
}
