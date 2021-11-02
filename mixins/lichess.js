import { simpleFetch } from "./utils.js";

const LICHESS_BOOK_URL = "https://explorer.lichess.ovh/lichess";

const LICHESS_BOOK_MAX_MOVES = 12;
const LICHESS_BOOK_AVG_RATINGS = [1600, 1800, 2000, 2200, 2500];
const LICHESS_BOOK_TIME_CONTROLS = ["bullet", "blitz", "rapid", "classical"];

const STANDARD_START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const DEFAULT_VARIANT = "standard";

let bookCache = {};

export function requestLichessBook(
  fenOpt,
  variantOpt,
  maxMovesOpt,
  ratingListOpt,
  speedListOpt
) {
  let fen = fenOpt || STANDARD_START_FEN;
  let variant = variantOpt || DEFAULT_VARIANT;
  let maxMoves = maxMovesOpt || LICHESS_BOOK_MAX_MOVES;
  let ratingList = ratingListOpt || LICHESS_BOOK_AVG_RATINGS;
  let speedList = speedListOpt || LICHESS_BOOK_TIME_CONTROLS;

  const key = `${fen}|${variant}|${maxMoves}|${ratingList}|${speedList}`;

  if (bookCache[key]) {
    console.log("book position found in cache for key", key);
    return Promise.resolve(bookCache[key]);
  }

  let ratings = ratingList.map((opt) => `ratings%5B%5D=${opt}`).join("&");

  let speeds = speedList.map((opt) => `speeds%5B%5D=${opt}`).join("&");

  let url =
    LICHESS_BOOK_URL + `?fen=${fen}&moves=${maxMoves}&variant=${variant}`;

  if (ratings) url += "&" + ratings;

  if (speeds) url += "&" + speeds;

  return new Promise((resolve) => {
    simpleFetch(
      url,
      {
        asJson: true
      },
      (result) => {
        if (result.ok) {
          result.content.fen = fen;
          bookCache[key] = result.content;
          resolve(result.content);
        }
      }
    );
  });
}

export function weightedRandom(book) {
  if (!book) return null;

  if (!book.moves.length) return null;

  let sum = 0;

  for (const move of book.moves) {
    move.total = move.white + move.draws + move.black;
    sum += move.total;
  }

  const rnd = Math.floor(Math.random() * sum);

  let ctotal = book.moves[0].total;

  let i = 0;

  while (ctotal < rnd) {
    ctotal += book.moves[i++].total;
  }

  const selectedMove = book.moves[i];

  return selectedMove;
}

function makeVariant(display, chessops, explorer) {
  return {
    display: display,
    chessops: chessops,
    explorer: explorer
  };
}

export const LICHESS_VARIANTS = [
  makeVariant("Standard", "chess", "standard"),
  makeVariant("Antichess", "antichess", "antichess"),
  makeVariant("Atomic", "atomic", "atomic"),
  makeVariant("Crazyhouse", "crazyhouse", "crazyhouse"),
  makeVariant("Horde", "horde", "horde"),
  makeVariant("King of the Hill", "kingofthehill", "kingOfTheHill"),
  makeVariant("Racing Kings", "racingkings", "racingKings")
];

export function chessopsToExplorer(variant) {
  const search = LICHESS_VARIANTS.find((test) => test.chessops === variant);
  return search ? search.explorer : "standard";
}
