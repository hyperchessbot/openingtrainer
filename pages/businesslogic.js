import {
  requestLichessBook,
  weightedRandom,
  chessopsToExplorer
} from "../mixins/lichess.js";

export function posChanged(self) {
  console.log("pos changed, history", self.history, "ptr", self.historyptr);
  self.ingoremoveplayed = true;
  self.currentbook = null;
  requestLichessBook(
    self.pos.reportFen(),
    chessopsToExplorer(self.pos.rules)
  ).then((result) => {
    console.log("book", result);
    self.bookmoves = result.moves;
    self.currentbook = result;

    if (self.manyRandom) {
      setTimeout((_) => {
        self.manyRandom--;

        makeWeightedrandom(self);
      }, 200);
    }
  });
}

export function makemove(self, kind, str) {
  console.log("makemove", kind, str);
  const moveinpute = document.getElementById("moveinput");
  const move = str || moveinpute.value;
  moveinpute.value = "";
  try {
    const pos = self.pos;
    console.log("pos", pos);
    console.log("making move", move, "for", pos.toString());
    const m = kind === "SAN" ? pos.sanToMove(move) : pos.uciToMove(move);
    pos.play(m);
    const fen = pos.reportFen();
    console.log("done", pos.toString());
    self.pos = pos;
    self.history = self.history.slice(0, self.historyptr + 1);
    if (self.history[self.historyptr] !== fen) {
      self.history.push(fen);
      self.historyptr++;
    }
    self.currentFen = fen;
    posChanged(self);
  } catch (err) {
    window.alert(`Invalid ${kind} move ${move} !`);
    console.error(err);
  }
}

export function reset(self) {
  const pos = self.pos;
  pos.setVariant(pos.rules);
  self.pos = pos;
  const fen = pos.reportFen();
  self.currentFen = fen;
  self.history = [fen];
  self.historyptr = 0;
  posChanged(self);
}

export function movePlayed(self, info) {
  console.log("move played", info);
  if (self.ingoremoveplayed) {
    console.log("ignoring move played");
    self.ingoremoveplayed = false;
    return;
  }
  const fen = info.fen;
  self.history = self.history.slice(0, self.historyptr + 1);
  if (self.history[self.historyptr] !== fen) {
    self.history.push(fen);
    self.historyptr++;
  }
  self.currentFen = fen;
  self.pos.setFen(fen);
  posChanged(self);
}

export function makeStep(self, dir) {
  console.log(
    "step dir",
    dir,
    "hist len",
    self.history.length,
    "old ptr",
    self.historyptr
  );
  self.historyptr += dir;
  if (self.historyptr < 0) self.historyptr = 0;
  if (self.historyptr >= self.history.length)
    self.historyptr = self.history.length - 1;
  console.log("new ptr", self.historyptr);
  const fen = self.history[self.historyptr];
  self.pos.setFen(fen);
  self.currentFen = fen;
  posChanged(self);
}

export function makeWeightedrandom(self) {
  if (self.currentbook) {
    if (self.currentbook.fen === self.pos.reportFen()) {
      const selectedMove = weightedRandom(self.currentbook);

      if (!selectedMove) {
        console.log("no book move for the position");

        self.manyRandom = 0;

        return;
      }

      makeSanMove(self, selectedMove.san);
    } else {
      console.log("book out of sync with position for weighted random");
    }
  } else {
    self.manyRandom = 0;

    console.log("no book to make weighted random from");
  }
}

export function makeManyWeightedRandom(self) {
  self.manyRandom = Math.floor(Math.random() * 20);

  posChanged(self);
}

export function doFlip(self) {
  self.orientation = self.orientation === "white" ? "black" : "white";
  self.ingoremoveplayed = true;
}

export function makeSanMove(self, san) {
  console.log("makesanmove", san);
  makemove(self, "SAN", san);
}

export function makeUciMove(self, uci) {
  console.log("makeucimove", uci);
  makemove(self, "UCI", uci);
}

export function selectVariant(self, variant) {
  self.pos.rules = variant;
  reset(self);
  console.log("changed pos", self.pos.pos);
}
