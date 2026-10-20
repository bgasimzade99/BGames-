import { describe, expect, it } from "vitest";
import { ticTacToeAi } from "../lib/games/tic-tac-toe/ai";
import { createTicTacToeGame } from "../lib/games/tic-tac-toe/factory";
import { findWinner, isDraw } from "../lib/games/tic-tac-toe/rules";
import { createChessSession } from "../lib/games/chess/session";
import { Book, addBookToLibrary } from "../lib/library/book.js";
import { createLibrary, libraryStats, queryBooks } from "../lib/library/collection.js";

describe("tic tac toe rules", () => {
  it("detects a row, a column, and a diagonal", () => {
    expect(findWinner(["X", "X", "X", null, null, null, null, null, null])?.line).toEqual([0, 1, 2]);
    expect(findWinner(["O", null, null, "O", null, null, "O", null, null])?.winner).toBe("O");
    expect(findWinner([null, null, "X", null, "X", null, "X", null, null])?.line).toEqual([2, 4, 6]);
  });

  it("detects a draw only when the board is full and undecided", () => {
    const draw = ["X", "O", "X", "X", "O", "O", "O", "X", "X"] as const;
    expect(isDraw(draw)).toBe(true);
    expect(isDraw(Array(9).fill(null))).toBe(false);
  });
});

describe("tic tac toe factory", () => {
  it("rejects an occupied square and a move after the game ends", () => {
    const game = createTicTacToeGame();
    game.play(0);
    const blocked = game.play(0);
    expect(blocked.moves).toBe(1);
    expect(blocked.board[0]).toBe("X");

    const finished = createTicTacToeGame();
    finished.play(0);
    finished.play(3);
    finished.play(1);
    finished.play(4);
    const won = finished.play(2);
    expect(won.status).toBe("win");
    expect(won.winner).toBe("X");
    expect(finished.play(5).moves).toBe(5);
  });
});

describe("minimax module", () => {
  it("takes an immediate win", () => {
    const board = ["O", "O", null, "X", "X", null, null, null, null] as const;
    expect(ticTacToeAi.chooseMove(board, "O", "hard")).toBe(2);
  });

  it("blocks an immediate loss", () => {
    const board = ["X", "X", null, "O", null, null, null, null, null] as const;
    expect(ticTacToeAi.chooseMove(board, "O", "hard")).toBe(2);
  });

  it("plays a forced draw from the opening against itself", () => {
    const game = createTicTacToeGame();
    let snap = game.snapshot();
    while (snap.status === "playing") {
      const index = ticTacToeAi.chooseMove(snap.board, snap.current, "hard");
      snap = game.play(index);
    }
    expect(snap.status).toBe("draw");
  });

  it("uses the injected random source on easy", () => {
    const board = [null, "X", null, null, null, null, null, null, null] as const;
    expect(ticTacToeAi.chooseMove(board, "O", "easy", () => 0)).toBe(0);
    expect(ticTacToeAi.chooseMove(board, "O", "easy", () => 0.99)).toBe(8);
  });
});

describe("chess session", () => {
  it("accepts a legal opening move and rejects an illegal one", () => {
    const session = createChessSession();
    expect(session.play("e2", "e4")).not.toBeNull();
    expect(session.play("e2", "e5")).toBeNull();
    expect(session.view().turn).toBe("b");
  });

  it("recognizes scholar's mate", () => {
    const session = createChessSession();
    const plies = [
      ["e2", "e4"],
      ["e7", "e5"],
      ["d1", "h5"],
      ["b8", "c6"],
      ["f1", "c4"],
      ["g8", "f6"],
      ["h5", "f7"],
    ] as const;
    for (const [from, to] of plies) {
      expect(session.play(from, to)).not.toBeNull();
    }
    expect(session.view().status.label).toBe("Checkmate. White wins.");
  });

  it("recognizes stalemate", () => {
    const session = createChessSession("k7/8/1Q6/8/8/8/8/7K b - - 0 1");
    expect(session.view().status.label).toBe("Stalemate. The game is a draw.");
  });

  it("promotes, castles, and plays en passant", () => {
    const promotion = createChessSession("8/P7/8/8/8/8/8/4K2k w - - 0 1");
    const promoted = promotion.play("a7", "a8", "q");
    expect(promoted?.isPromotion()).toBe(true);

    const castle = createChessSession();
    for (const [from, to] of [
      ["e2", "e4"],
      ["e7", "e5"],
      ["g1", "f3"],
      ["b8", "c6"],
      ["f1", "c4"],
      ["g8", "f6"],
    ] as const) {
      expect(castle.play(from, to)).not.toBeNull();
    }
    expect(castle.play("e1", "g1")?.isKingsideCastle()).toBe(true);

    const passant = createChessSession();
    for (const [from, to] of [
      ["e2", "e4"],
      ["e7", "e6"],
      ["e4", "e5"],
      ["d7", "d5"],
    ] as const) {
      expect(passant.play(from, to)).not.toBeNull();
    }
    expect(passant.play("e5", "d6")?.isEnPassant()).toBe(true);
  });

  it("undoes a move and rejects a broken FEN", () => {
    const session = createChessSession();
    session.play("e2", "e4");
    expect(session.undo()).not.toBeNull();
    expect(session.view().history).toHaveLength(0);
    expect(() => createChessSession("not-a-fen")).toThrow();
  });
});

describe("library constructor", () => {
  it("builds a book with the Odin info sentence and toggles read on the prototype", () => {
    const library: InstanceType<typeof Book>[] = [];
    const book = addBookToLibrary(library, "The Design of Everyday Things", "Don Norman", 368, false);
    expect(book.info()).toBe("The Design of Everyday Things by Don Norman, 368 pages, not read yet");
    expect(book.toggleRead()).toBe(true);
    expect(book.info()).toContain("already read");
    expect(library).toHaveLength(1);
    const callWithoutNew = Book as unknown as (title: string, author: string, pages: number, read: boolean) => void;
    expect(() => callWithoutNew("Nope", "Nope", 1, false)).toThrow(/new Book/);
  });

  it("searches, filters, sorts, and counts a collection", () => {
    const shelf = createLibrary();
    const first = shelf.add("Zebra", "A", 10, false);
    const second = shelf.add("Alpha", "B", 20, true);
    shelf.toggleRead(first.id);
    expect(queryBooks(shelf.list(), { query: "alp", status: "read", sort: "title" })).toEqual([
      expect.objectContaining({ title: "Alpha" }),
    ]);
    expect(second.id).toBeTruthy();
    expect(libraryStats(shelf.list())).toMatchObject({ total: 2, read: 2, unread: 0, pages: 30 });
  });
});
