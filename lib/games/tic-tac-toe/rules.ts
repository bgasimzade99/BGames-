export type Mark = "X" | "O";
export type Cell = Mark | null;

export const WIN_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export interface WinResult {
  winner: Mark;
  line: number[];
}

export function findWinner(board: readonly Cell[]): WinResult | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) {
      return { winner: mark, line: [...line] };
    }
  }
  return null;
}

export function isDraw(board: readonly Cell[]): boolean {
  return findWinner(board) === null && board.every((cell) => cell !== null);
}

export function emptySquares(board: readonly Cell[]): number[] {
  const open: number[] = [];
  board.forEach((cell, index) => {
    if (cell === null) open.push(index);
  });
  return open;
}

export function opponent(mark: Mark): Mark {
  return mark === "X" ? "O" : "X";
}
