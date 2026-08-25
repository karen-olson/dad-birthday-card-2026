const WORDS = [
  {
    number: 1,
    direction: "across",
    row: 0,
    col: 0,
    answer: "BIRTHDAY",
    clue: "The occasion this card is for",
  },
  {
    number: 2,
    direction: "down",
    row: 0,
    col: 5,
    answer: "DAD",
    clue: "Today’s guest of honor",
  },
  {
    number: 3,
    direction: "across",
    row: 3,
    col: 0,
    answer: "ADVICE",
    clue: "Dad is always ready with this",
  },
  {
    number: 4,
    direction: "down",
    row: 3,
    col: 4,
    answer: "CAKE",
    clue: "It’s not a party without this dessert",
  },
  {
    number: 5,
    direction: "across",
    row: 5,
    col: 2,
    answer: "JOKES",
    clue: "The groany ones he tells anyway",
  },
  {
    number: 6,
    direction: "across",
    row: 7,
    col: 0,
    answer: "WALKS",
    clue: "Long ones, per the birthday note",
  },
  {
    number: 7,
    direction: "down",
    row: 7,
    col: 2,
    answer: "LOVE",
    clue: "What this card is full of",
  },
  {
    number: 8,
    direction: "across",
    row: 8,
    col: 1,
    answer: "COFFEE",
    clue: "A good cup of this, mentioned in the note",
  },
];

const ROWS = 11;
const COLS = 8;

function cellsFor(word) {
  return [...word.answer].map((letter, index) => ({
    row: word.row + (word.direction === "down" ? index : 0),
    col: word.col + (word.direction === "across" ? index : 0),
    letter,
  }));
}

function buildSolution() {
  const solution = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (const word of WORDS) {
    for (const cell of cellsFor(word)) {
      const existing = solution[cell.row][cell.col];
      if (existing && existing !== cell.letter) {
        throw new Error(
          `Conflict at ${cell.row},${cell.col}: ${existing} vs ${cell.letter}`
        );
      }
      solution[cell.row][cell.col] = cell.letter;
    }
  }
  return solution;
}

const SOLUTION = buildSolution();

const state = {
  direction: "across",
  active: null,
  word: WORDS[0],
};

const gridEl = document.getElementById("grid");
const acrossEl = document.getElementById("across-clues");
const downEl = document.getElementById("down-clues");
const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");

gridEl.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;

function wordAt(row, col, direction) {
  return (
    WORDS.find((word) =>
      cellsFor(word).some(
        (cell) =>
          cell.row === row && cell.col === col && word.direction === direction
      )
    ) || null
  );
}

function numberAt(row, col) {
  const starts = WORDS.filter((word) => word.row === row && word.col === col);
  return starts.length ? Math.min(...starts.map((word) => word.number)) : null;
}

function renderGrid() {
  const fragment = document.createDocumentFragment();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      if (!SOLUTION[row][col]) {
        cell.classList.add("cell--block");
        cell.setAttribute("aria-hidden", "true");
      } else {
        const number = numberAt(row, col);
        if (number) {
          const num = document.createElement("span");
          num.className = "cell__num";
          num.textContent = String(number);
          cell.appendChild(num);
        }
        const input = document.createElement("input");
        input.maxLength = 1;
        input.autocomplete = "off";
        input.spellcheck = false;
        input.inputMode = "text";
        input.ariaLabel = `Row ${row + 1}, column ${col + 1}`;
        input.dataset.row = String(row);
        input.dataset.col = String(col);
        cell.appendChild(input);
      }
      fragment.appendChild(cell);
    }
  }
  gridEl.appendChild(fragment);
}

function renderClues() {
  for (const word of WORDS) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "clue";
    button.dataset.number = String(word.number);
    button.dataset.direction = word.direction;
    button.innerHTML = `<span class="clue__num">${word.number}</span><span>${word.clue}</span>`;
    button.addEventListener("click", () => selectWord(word, true));
    item.appendChild(button);
    (word.direction === "across" ? acrossEl : downEl).appendChild(item);
  }
}

function inputAt(row, col) {
  return gridEl.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
}

function cellEl(row, col) {
  return gridEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function selectWord(word, focusStart = false) {
  state.word = word;
  state.direction = word.direction;
  document.querySelectorAll(".clue").forEach((el) => {
    el.classList.toggle(
      "is-active",
      el.dataset.number === String(word.number) &&
        el.dataset.direction === word.direction
    );
  });
  document.querySelectorAll(".cell").forEach((el) => {
    el.classList.remove("is-word", "is-active");
  });
  for (const cell of cellsFor(word)) {
    cellEl(cell.row, cell.col)?.classList.add("is-word");
  }
  if (focusStart) {
    const start = inputAt(word.row, word.col);
    start?.focus();
    markActive(word.row, word.col);
  }
}

function markActive(row, col) {
  document.querySelectorAll(".cell.is-active").forEach((el) => {
    el.classList.remove("is-active");
  });
  cellEl(row, col)?.classList.add("is-active");
  state.active = { row, col };
}

function nextCell(row, col, delta) {
  const word = state.word;
  const cells = cellsFor(word);
  const index = cells.findIndex((cell) => cell.row === row && cell.col === col);
  const next = cells[index + delta];
  return next || null;
}

function move(row, col, dRow, dCol) {
  let nextRow = row + dRow;
  let nextCol = col + dCol;
  while (
    nextRow >= 0 &&
    nextRow < ROWS &&
    nextCol >= 0 &&
    nextCol < COLS
  ) {
    if (SOLUTION[nextRow][nextCol]) {
      const preferred =
        dRow !== 0 ? "down" : dCol !== 0 ? "across" : state.direction;
      const word =
        wordAt(nextRow, nextCol, preferred) ||
        wordAt(nextRow, nextCol, preferred === "across" ? "down" : "across");
      if (word) selectWord(word);
      inputAt(nextRow, nextCol)?.focus();
      markActive(nextRow, nextCol);
      return;
    }
    nextRow += dRow;
    nextCol += dCol;
  }
}

function allFilled() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (!SOLUTION[row][col]) continue;
      if (!inputAt(row, col).value) return false;
    }
  }
  return true;
}

function checkPuzzle() {
  let correct = 0;
  let filled = 0;
  let total = 0;
  document.querySelectorAll(".cell").forEach((el) => {
    el.classList.remove("is-wrong", "is-right");
  });
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const expected = SOLUTION[row][col];
      if (!expected) continue;
      total += 1;
      const value = inputAt(row, col).value.toUpperCase();
      if (!value) continue;
      filled += 1;
      if (value === expected) {
        correct += 1;
        cellEl(row, col).classList.add("is-right");
      } else {
        cellEl(row, col).classList.add("is-wrong");
      }
    }
  }
  if (correct === total) {
    statusEl.textContent = "Every square is right — message unlocked.";
    messageEl.hidden = false;
    messageEl.classList.add("is-open");
    messageEl.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (!filled) {
    statusEl.textContent = "Fill in a few letters, then check again.";
  } else {
    statusEl.textContent = `${correct} of ${total} letters are correct.`;
    messageEl.hidden = true;
    messageEl.classList.remove("is-open");
  }
}

function resetPuzzle() {
  gridEl.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });
  document.querySelectorAll(".cell").forEach((el) => {
    el.classList.remove("is-wrong", "is-right");
  });
  statusEl.textContent = "";
  messageEl.hidden = true;
  messageEl.classList.remove("is-open");
  selectWord(WORDS[0], true);
}

gridEl.addEventListener("focusin", (event) => {
  const input = event.target.closest("input");
  if (!input) return;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  const current = wordAt(row, col, state.direction);
  const fallback =
    wordAt(row, col, state.direction === "across" ? "down" : "across");
  selectWord(current || fallback);
  markActive(row, col);
});

gridEl.addEventListener("click", (event) => {
  const input = event.target.closest("input");
  if (!input || !state.active) return;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  if (state.active.row === row && state.active.col === col) {
    const other = state.direction === "across" ? "down" : "across";
    const word = wordAt(row, col, other);
    if (word) selectWord(word);
  }
});

gridEl.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const letter = input.value.replace(/[^a-z]/gi, "").slice(-1).toUpperCase();
  input.value = letter;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  cellEl(row, col).classList.remove("is-wrong", "is-right");
  if (!letter) return;
  const next = nextCell(row, col, 1);
  if (next) {
    inputAt(next.row, next.col)?.focus();
    markActive(next.row, next.col);
  }
  if (allFilled()) checkPuzzle();
});

gridEl.addEventListener("keydown", (event) => {
  const input = event.target.closest("input");
  if (!input) return;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  if (event.key === "Backspace") {
    if (!input.value) {
      event.preventDefault();
      const prev = nextCell(row, col, -1);
      if (prev) {
        const prevInput = inputAt(prev.row, prev.col);
        prevInput.value = "";
        prevInput.focus();
        markActive(prev.row, prev.col);
      }
    }
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    move(row, col, 0, 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    move(row, col, 0, -1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    move(row, col, 1, 0);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    move(row, col, -1, 0);
  } else if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    const other = state.direction === "across" ? "down" : "across";
    const word = wordAt(row, col, other);
    if (word) selectWord(word);
  }
});

document.getElementById("check-btn").addEventListener("click", checkPuzzle);
document.getElementById("reset-btn").addEventListener("click", resetPuzzle);

renderGrid();
renderClues();
selectWord(WORDS[0], true);
