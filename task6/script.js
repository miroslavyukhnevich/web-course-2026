"use strict";

/* ============================================================
 *  Константы и настройки
 * ============================================================ */
const CELL_SIZE = 20;
const GRID_SIZE = 20;
const CANVAS_SIZE = CELL_SIZE * GRID_SIZE;
const MOVE_INTERVAL = 150;   // мс на одну клетку
const INITIAL_LENGTH = 3;

// Управление: стрелки + WASD
const DIRECTIONS = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y: 1  },
  ArrowLeft:  { x: -1, y: 0  },
  ArrowRight: { x: 1,  y: 0  },
  w:          { x: 0,  y: -1 },
  s:          { x: 0,  y: 1  },
  a:          { x: -1, y: 0  },
  d:          { x: 1,  y: 0  },
  // Заглавные — на случай Caps Lock / Shift
  W:          { x: 0,  y: -1 },
  S:          { x: 0,  y: 1  },
  A:          { x: -1, y: 0  },
  D:          { x: 1,  y: 0  },
};

/* ============================================================
 *  Состояние игры (логика отделена от отрисовки)
 * ============================================================ */
const state = {
  snake: [],
  direction: null,
  nextDirection: null,
  apple: null,
  score: 0,
  best: 0,
  gameOver: false,
  running: false,      // игра активна только после нажатия "Играть"
  lastMoveTime: 0,
  // Прогресс плавной интерполяции между клетками (0..1) для отрисовки
  tickProgress: 0,
};

/* ============================================================
 *  DOM
 * ============================================================ */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const finalScoreEl = document.getElementById("finalScore");
const finalBestEl = document.getElementById("finalBest");
const startMenuEl = document.getElementById("startMenu");
const gameOverMenuEl = document.getElementById("gameOverMenu");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

/* ============================================================
 *  Фон поля (генерируем один раз — статичный паттерн)
 * ============================================================ */
const backgroundCanvas = document.createElement("canvas");
backgroundCanvas.width = CANVAS_SIZE;
backgroundCanvas.height = CANVAS_SIZE;
const bgCtx = backgroundCanvas.getContext("2d");

function buildBackground() {
  // 1) Градиент "ночного моря"
  const grad = bgCtx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  grad.addColorStop(0,   "#0a1226");
  grad.addColorStop(0.5, "#0d1830");
  grad.addColorStop(1,   "#08101f");
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // 2) Декоративные "звёзды"/точки — детерминированные, чтобы не мерцали
  bgCtx.fillStyle = "rgba(120, 200, 255, 0.18)";
  for (let i = 0; i < 90; i++) {
    const x = (i * 53) % CANVAS_SIZE;
    const y = (i * 97 + 31) % CANVAS_SIZE;
    const r = (i % 3) + 0.5;
    bgCtx.beginPath();
    bgCtx.arc(x, y, r, 0, Math.PI * 2);
    bgCtx.fill();
  }

  // 3) Туманные пятна
  const blobs = [
    { x: 80,  y: 90,  r: 120, c: "rgba(34, 211, 238, 0.07)" },
    { x: 320, y: 300, r: 140, c: "rgba(110, 231, 183, 0.06)" },
    { x: 260, y: 80,  r: 100, c: "rgba(168, 85, 247, 0.06)" },
  ];
  for (const b of blobs) {
    const g = bgCtx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.c);
    g.addColorStop(1, "transparent");
    bgCtx.fillStyle = g;
    bgCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

/* ============================================================
 *  Инициализация
 * ============================================================ */
function initGame() {
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);

  state.snake = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    state.snake.push({ x: startX - i, y: startY });
  }

  state.direction = { ...DIRECTIONS.ArrowRight };
  state.nextDirection = null;
  state.score = 0;
  state.gameOver = false;
  state.running = false;
  state.lastMoveTime = performance.now();
  state.tickProgress = 0;

  spawnApple();
  updateHUD();
}

/* ============================================================
 *  Спавн яблока
 * ============================================================ */
function spawnApple() {
  const freeCells = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const occupied = state.snake.some(seg => seg.x === x && seg.y === y);
      if (!occupied) freeCells.push({ x, y });
    }
  }
  if (freeCells.length === 0) { state.apple = null; return; }
  state.apple = freeCells[Math.floor(Math.random() * freeCells.length)];
}

/* ============================================================
 *  Столкновения
 * ============================================================ */
function checkCollision(head, willGrow) {
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }
  const body = willGrow ? state.snake : state.snake.slice(0, -1);
  return body.some(seg => seg.x === head.x && seg.y === head.y);
}

/* ============================================================
 *  Шаг змейки
 * ============================================================ */
function moveSnake() {
  if (state.nextDirection) {
    state.direction = state.nextDirection;
    state.nextDirection = null;
  }

  const dir = state.direction;
  const head = state.snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  const willGrow =
    state.apple !== null &&
    newHead.x === state.apple.x &&
    newHead.y === state.apple.y;

  if (checkCollision(newHead, willGrow)) {
    endGame();
    return;
  }

  state.snake.unshift(newHead);

  if (willGrow) {
    state.score += 1;
    updateHUD();
    spawnApple();
  } else {
    state.snake.pop();
  }
}

/* ============================================================
 *  update — логика по времени
 * ============================================================ */
function update(currentTime) {
  if (!state.running || state.gameOver) return;

  const elapsed = currentTime - state.lastMoveTime;
  if (elapsed >= MOVE_INTERVAL) {
    state.lastMoveTime = currentTime - (elapsed % MOVE_INTERVAL);
    moveSnake();
    state.tickProgress = 0;
  } else {
    state.tickProgress = elapsed / MOVE_INTERVAL;
  }
}

/* ============================================================
 *  draw — только отрисовка
 * ============================================================ */
function draw() {
  // 1) Фон поля (паттерн + градиент) — заранее отрисован на offscreen-canvas
  ctx.drawImage(backgroundCanvas, 0, 0);

  // 2) Сетка клеток поверх фона, чтобы очертания квадратов остались
  drawGrid();

  // 3) Игровые объекты
  drawApple();
  drawSnake();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(140, 200, 255, 0.10)";
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID_SIZE; i++) {
    const pos = i * CELL_SIZE + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_SIZE, pos);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---------- Яблоко: круглая "вишня" с бликом ---------- */
function drawApple() {
  if (!state.apple) return;

  const cx = state.apple.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = state.apple.y * CELL_SIZE + CELL_SIZE / 2;
  const r  = CELL_SIZE / 2 - 2;

  // Тень
  ctx.beginPath();
  ctx.fillStyle = "rgba(248, 113, 113, 0.25)";
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fill();

  // Тело
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 1, cx, cy, r);
  grad.addColorStop(0, "#fecaca");
  grad.addColorStop(0.5, "#f87171");
  grad.addColorStop(1, "#b91c1c");
  ctx.beginPath();
  ctx.fillStyle = grad;
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Блик
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.arc(cx - r * 0.35, cy - r * 0.45, r * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Хвостик
  ctx.strokeStyle = "#65a30d";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + 2, cy - r - 4, cx + 5, cy - r - 3);
  ctx.stroke();
}

/* ---------- Змейка: сегменты со скруглением + голова с глазами ---------- */
function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}

function drawSnake() {
  const n = state.snake.length;
  const t = state.tickProgress; // 0..1 — плавная интерполяция между клетками

  // Рисуем от хвоста к голове — голова поверх
  for (let i = n - 1; i >= 0; i--) {
    const seg = state.snake[i];

    // Плавное движение: каждый сегмент "догоняет" предыдущий.
    // Смещение = вектор от текущей позиции к позиции i-1 (или к nextDirection для головы).
    let px = seg.x;
    let py = seg.y;

    if (state.running && !state.gameOver) {
      let targetX = seg.x;
      let targetY = seg.y;

      if (i > 0) {
        // следующий по «телу» сегмент ближе к голове
        targetX = state.snake[i - 1].x;
        targetY = state.snake[i - 1].y;
      } else {
        // голова — движется в направлении движения
        targetX = seg.x + state.direction.x;
        targetY = seg.y + state.direction.y;
      }

      px = seg.x + (targetX - seg.x) * t;
      py = seg.y + (targetY - seg.y) * t;
    }

    const x = px * CELL_SIZE;
    const y = py * CELL_SIZE;

    if (i === 0) {
      drawHead(x, y);
    } else {
      drawBodySegment(x, y, i, n);
    }
  }
}

function drawBodySegment(x, y, index, total) {
  const isTail = index === total - 1;

  // Плавное сужение к хвосту
  const shrink = isTail ? 5 : 3;
  const inset = shrink / 2;

  // Цвет от головы (яркий) к хвосту (глубже)
  const ratio = index / Math.max(1, total - 1);
  const r = Math.round(110 - 40 * ratio);
  const g = Math.round(231 - 60 * ratio);
  const b = Math.round(183 - 60 * ratio);
  const fill = `rgb(${r}, ${g}, ${b})`;

  // Лёгкая тень-подложка
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(x + inset + 1, y + inset + 1, CELL_SIZE - shrink, CELL_SIZE - shrink, 6);
  ctx.fill();

  // Тело
  ctx.fillStyle = fill;
  roundRect(x + inset, y + inset, CELL_SIZE - shrink, CELL_SIZE - shrink, 6);
  ctx.fill();

  // Внутренний блик — «чешуя»
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(x + inset + 2, y + inset + 2, (CELL_SIZE - shrink) * 0.6, 4, 2);
  ctx.fill();
}

function drawHead(x, y) {
  const inset = 1;
  const w = CELL_SIZE - inset * 2;

  // Тень
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(x + inset + 1, y + inset + 1, w, w, 7);
  ctx.fill();

  // Голова — градиент
  const grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
  grad.addColorStop(0, "#a7f3d0");
  grad.addColorStop(1, "#34d399");
  ctx.fillStyle = grad;
  roundRect(x + inset, y + inset, w, w, 7);
  ctx.fill();

  // Обводка
  ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
  ctx.lineWidth = 1.5;
  roundRect(x + inset, y + inset, w, w, 7);
  ctx.stroke();

  // Глаза в зависимости от направления
  const dir = state.direction;
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;
  const eyeOffset = 3.5;
  const eyeR = 2.2;

  let eye1, eye2;
  if (dir.x === 1) { // вправо
    eye1 = { x: cx + eyeOffset, y: cy - 3 };
    eye2 = { x: cx + eyeOffset, y: cy + 3 };
  } else if (dir.x === -1) { // влево
    eye1 = { x: cx - eyeOffset, y: cy - 3 };
    eye2 = { x: cx - eyeOffset, y: cy + 3 };
  } else if (dir.y === 1) { // вниз
    eye1 = { x: cx - 3, y: cy + eyeOffset };
    eye2 = { x: cx + 3, y: cy + eyeOffset };
  } else { // вверх
    eye1 = { x: cx - 3, y: cy - eyeOffset };
    eye2 = { x: cx + 3, y: cy - eyeOffset };
  }

  for (const e of [eye1, eye2]) {
    // Белок
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
    ctx.fill();
    // Зрачок
    ctx.beginPath();
    ctx.fillStyle = "#0a0f1c";
    ctx.arc(e.x + dir.x * 0.6, e.y + dir.y * 0.6, eyeR * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Язык — торчит по направлению движения, чуть покачивается
  const tongueBase = { x: cx + dir.x * 8, y: cy + dir.y * 8 };
  const wag = Math.sin(performance.now() / 120) * 1.5;
  const perpX = -dir.y;
  const perpY = dir.x;
  const tip = {
    x: tongueBase.x + dir.x * 5 + perpX * wag,
    y: tongueBase.y + dir.y * 5 + perpY * wag,
  };

  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tongueBase.x, tongueBase.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();

  // Раздвоение
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x + perpX * 2 + dir.x * 2, tip.y + perpY * 2 + dir.y * 2);
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - perpX * 2 + dir.x * 2, tip.y - perpY * 2 + dir.y * 2);
  ctx.stroke();
}

/* ============================================================
 *  Игровой цикл
 * ============================================================ */
function gameLoop(currentTime) {
  update(currentTime);
  draw();
  requestAnimationFrame(gameLoop);
}

/* ============================================================
 *  Управление
 * ============================================================ */
function handleKeyDown(event) {
  const newDir = DIRECTIONS[event.key];
  if (!newDir) return;

  // Не даём странице скроллиться стрелками
  event.preventDefault();

  if (!state.running || state.gameOver) return;

  const current = state.direction;
  const isOpposite = current.x + newDir.x === 0 && current.y + newDir.y === 0;
  if (isOpposite) return;
  if (newDir.x === current.x && newDir.y === current.y) return;

  state.nextDirection = newDir;
}

/* ============================================================
 *  Старт / конец игры
 * ============================================================ */
function startGame() {
  initGame();
  state.running = true;
  state.lastMoveTime = performance.now();
  hideOverlay(startMenuEl);
  hideOverlay(gameOverMenuEl);
}

function endGame() {
  state.gameOver = true;
  state.running = false;

  if (state.score > state.best) {
    state.best = state.score;
    bestEl.textContent = state.best;
  }

  finalScoreEl.textContent = state.score;
  finalBestEl.textContent = state.best;
  showOverlay(gameOverMenuEl);
}

/* ============================================================
 *  UI-хелперы
 * ============================================================ */
function updateHUD() {
  scoreEl.textContent = state.score;
  bestEl.textContent = state.best;
}

function showOverlay(el) { el.classList.remove("hidden"); }
function hideOverlay(el) { el.classList.add("hidden"); }

/* ============================================================
 *  Точка входа
 * ============================================================ */
function bootstrap() {
  buildBackground();
  initGame();

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
  document.addEventListener("keydown", handleKeyDown);

  // Стартовое меню открыто, игра на паузе (running = false)
  showOverlay(startMenuEl);

  requestAnimationFrame(gameLoop);
}

bootstrap();