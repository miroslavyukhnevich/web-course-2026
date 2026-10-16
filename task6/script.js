"use strict";

/* ============================================================
 *  Константы и настройки игры
 * ============================================================ */
const CELL_SIZE = 20;         // размер одной клетки в пикселях
const GRID_SIZE = 20;         // 20×20 клеток → поле 400×400
const CANVAS_SIZE = CELL_SIZE * GRID_SIZE;
const MOVE_INTERVAL = 150;    // мс между перемещениями змейки
const INITIAL_LENGTH = 3;

const DIRECTIONS = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y: 1  },
  ArrowLeft:  { x: -1, y: 0  },
  ArrowRight: { x: 1,  y: 0  },
};

/* ============================================================
 *  Состояние игры (логика отделена от отрисовки)
 * ============================================================ */
const state = {
  snake: [],           // массив сегментов [{x, y}, ...], голова — snake[0]
  direction: null,     // текущее направление {x, y}
  nextDirection: null, // направление, применённое на следующем шаге
  apple: null,         // {x, y}
  score: 0,
  gameOver: false,
  lastMoveTime: 0,     // время последнего перемещения
};

/* ============================================================
 *  Ссылки на DOM
 * ============================================================ */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const finalScoreEl = document.getElementById("finalScore");
const overlayEl = document.getElementById("overlay");
const restartBtn = document.getElementById("restartBtn");

/* ============================================================
 *  Инициализация / перезапуск игры
 * ============================================================ */
function initGame() {
  // Змейка из 3 сегментов по центру, движется вправо
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);

  state.snake = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    state.snake.push({ x: startX - i, y: startY });
  }

  state.direction = { ...DIRECTIONS.ArrowRight };
  state.nextDirection = { ...DIRECTIONS.ArrowRight };
  state.score = 0;
  state.gameOver = false;
  state.lastMoveTime = performance.now();

  spawnApple();
  updateHUD();
  hideOverlay();
}

/* ============================================================
 *  Спавн яблока в случайной свободной клетке
 * ============================================================ */
function spawnApple() {
  const freeCells = [];

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const occupied = state.snake.some(seg => seg.x === x && seg.y === y);
      if (!occupied) freeCells.push({ x, y });
    }
  }

  if (freeCells.length === 0) {
    // Победный случай: всё поле занято змейкой
    state.apple = null;
    return;
  }

  const idx = Math.floor(Math.random() * freeCells.length);
  state.apple = freeCells[idx];
}

/* ============================================================
 *  Проверка столкновений
 * ============================================================ */
function checkCollision(head, willGrow) {
  // Столкновение со стенами
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }

  // Столкновение с собственным телом.
  // Если змейка растёт (съела яблоко), хвост останется на месте — его тоже надо учитывать.
  // Если не растёт — последний сегмент исчезнет, поэтому его проверять не нужно.
  const body = willGrow ? state.snake : state.snake.slice(0, -1);
  return body.some(seg => seg.x === head.x && seg.y === head.y);
}

/* ============================================================
 *  Один шаг змейки на одну клетку
 * ============================================================ */
function moveSnake() {
  // Применяем отложенное направление (защита от разворота на 180°)
  if (state.nextDirection) {
    state.direction = state.nextDirection;
    state.nextDirection = null;
  }

  const dir = state.direction;
  const head = state.snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };

  // Съест ли яблоко на этом шаге?
  const willGrow =
    state.apple !== null &&
    newHead.x === state.apple.x &&
    newHead.y === state.apple.y;

  // Проверка столкновения (с учётом того, будет ли хвост сдвигаться)
  if (checkCollision(newHead, willGrow)) {
    endGame();
    return;
  }

  // Добавляем новую голову
  state.snake.unshift(newHead);

  if (willGrow) {
    // Хвост не удаляем — змейка растёт
    state.score += 1;
    updateHUD();
    spawnApple();
  } else {
    // Убираем хвост — змейка сохраняет длину
    state.snake.pop();
  }
}

/* ============================================================
 *  Обновление состояния (вызывается по таймеру с deltaTime)
 * ============================================================ */
function update(currentTime) {
  if (state.gameOver) return;

  if (currentTime - state.lastMoveTime >= MOVE_INTERVAL) {
    // Пересчитываем lastMoveTime так, чтобы не копить «долг»
    // при пропущенных кадрах (сохраняем постоянную скорость).
    state.lastMoveTime = currentTime - ((currentTime - state.lastMoveTime) % MOVE_INTERVAL);
    moveSnake();
  }
}

/* ============================================================
 *  Отрисовка (только визуализация текущего состояния)
 * ============================================================ */
function draw() {
  // Фон
  ctx.fillStyle = "#101018";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawGrid();
  drawApple();
  drawSnake();

  if (state.gameOver) {
    drawGameOverOverlay();
  }
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
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
}

function drawSnake() {
  state.snake.forEach((seg, index) => {
    const x = seg.x * CELL_SIZE;
    const y = seg.y * CELL_SIZE;

    ctx.fillStyle = index === 0 ? "#34d399" : "#6ee7b7";
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  });
}

function drawApple() {
  if (!state.apple) return;

  const cx = state.apple.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = state.apple.y * CELL_SIZE + CELL_SIZE / 2;

  ctx.fillStyle = "#f87171";
  ctx.beginPath();
  ctx.arc(cx, cy, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawGameOverOverlay() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Игра окончена", CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

  ctx.font = "18px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`Счёт: ${state.score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 18);
}

/* ============================================================
 *  Игровой цикл через requestAnimationFrame
 * ============================================================ */
function gameLoop(currentTime) {
  update(currentTime);
  draw();
  requestAnimationFrame(gameLoop);
}

/* ============================================================
 *  Обработка клавиатуры
 * ============================================================ */
function handleKeyDown(event) {
  const newDir = DIRECTIONS[event.key];
  if (!newDir) return;

  event.preventDefault();

  if (state.gameOver) return;

  // Нельзя развернуться на 180° относительно текущего направления.
  // Сравниваем с направлением, которое уже применено (direction),
  // а не с nextDirection — иначе можно было бы «накликать» разворот.
  const current = state.direction;
  const isOpposite = current.x + newDir.x === 0 && current.y + newDir.y === 0;

  if (isOpposite) return;                // игнорируем разворот
  if (newDir.x === current.x && newDir.y === current.y) return; // уже так движемся

  state.nextDirection = newDir;
}

/* ============================================================
 *  Окончание игры
 * ============================================================ */
function endGame() {
  state.gameOver = true;
  finalScoreEl.textContent = state.score;
  showOverlay();
}

/* ============================================================
 *  UI-хелперы
 * ============================================================ */
function updateHUD() {
  scoreEl.textContent = state.score;
}

function showOverlay() {
  overlayEl.classList.remove("hidden");
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

/* ============================================================
 *  Точка входа
 * ============================================================ */
function start() {
  initGame();
  document.addEventListener("keydown", handleKeyDown);
  restartBtn.addEventListener("click", () => {
    initGame();
  });
  requestAnimationFrame(gameLoop);
}

start();