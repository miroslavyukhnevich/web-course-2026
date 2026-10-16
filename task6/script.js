"use strict";
 
/* ---------- Константы ---------- */
const CELL_SIZE = 20;
const GRID_SIZE = 20;
const CANVAS_SIZE = CELL_SIZE * GRID_SIZE;
const MOVE_INTERVAL = 130;     // мс на шаг
const INITIAL_LENGTH = 3;
const MAX_QUEUE = 3;           // сколько поворотов помним
const EARLY_TURN_AT = 0.35;    // если нажали после этой доли шага — поворачиваем сразу
 
const UP = { x: 0, y: -1 }, DOWN = { x: 0, y: 1 }, LEFT = { x: -1, y: 0 }, RIGHT = { x: 1, y: 0 };
 
// event.code не зависит от раскладки: W/A/S/D работают и на русской
const KEYMAP = {
  ArrowUp: UP, ArrowDown: DOWN, ArrowLeft: LEFT, ArrowRight: RIGHT,
  KeyW: UP, KeyS: DOWN, KeyA: LEFT, KeyD: RIGHT,
};
 
/* ---------- Состояние ---------- */
const state = {
  snake: [], direction: RIGHT, queue: [], apple: null,
  score: 0, best: 0, gameOver: false, running: false,
  lastMoveTime: 0, tickProgress: 0,
};
 
/* ---------- DOM ---------- */
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
 
/* ---------- Картинка поля (images/field.svg — замените на свою) ---------- */
const fieldImg = new Image();
fieldImg.src = "field.svg";
 
function drawField() {
  if (fieldImg.complete && fieldImg.naturalWidth) {
    ctx.drawImage(fieldImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    ctx.fillStyle = "#1d6b3c";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
  // мягкая шахматка вместо жёсткой сетки
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if ((x + y) % 2) ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }
}
 
/* ---------- Инициализация ---------- */
function initGame() {
  const sx = Math.floor(GRID_SIZE / 2), sy = Math.floor(GRID_SIZE / 2);
  state.snake = [];
  for (let i = 0; i < INITIAL_LENGTH; i++) state.snake.push({ x: sx - i, y: sy });
  state.direction = RIGHT;
  state.queue = [];
  state.score = 0;
  state.gameOver = false;
  state.running = false;
  state.lastMoveTime = performance.now();
  state.tickProgress = 0;
  spawnApple();
  updateHUD();
}
 
function spawnApple() {
  const free = [];
  for (let x = 0; x < GRID_SIZE; x++)
    for (let y = 0; y < GRID_SIZE; y++)
      if (!state.snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
  state.apple = free.length ? free[Math.floor(Math.random() * free.length)] : null;
}
 
/* ---------- Логика ---------- */
function checkCollision(head, willGrow) {
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) return true;
  const body = willGrow ? state.snake : state.snake.slice(0, -1);
  return body.some(s => s.x === head.x && s.y === head.y);
}
 
function moveSnake() {
  if (state.queue.length) state.direction = state.queue.shift();
  const dir = state.direction, head = state.snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };
  const willGrow = !!state.apple && newHead.x === state.apple.x && newHead.y === state.apple.y;
 
  if (checkCollision(newHead, willGrow)) { endGame(); return; }
 
  state.snake.unshift(newHead);
  if (willGrow) { state.score++; updateHUD(); spawnApple(); }
  else state.snake.pop();
}
 
function update(now) {
  if (!state.running || state.gameOver) return;
  const elapsed = now - state.lastMoveTime;
  if (elapsed >= MOVE_INTERVAL) {
    state.lastMoveTime = now - (elapsed % MOVE_INTERVAL);
    moveSnake();
    state.tickProgress = 0;
  } else {
    state.tickProgress = elapsed / MOVE_INTERVAL;
  }
}
 
/* ---------- Отрисовка ---------- */
function draw() {
  drawField();
  drawApple();
  drawSnake();
}
 
function drawApple() {
  if (!state.apple) return;
  const cx = state.apple.x * CELL_SIZE + CELL_SIZE / 2;
  const cy = state.apple.y * CELL_SIZE + CELL_SIZE / 2;
  const r = CELL_SIZE / 2 - 2;
 
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath(); ctx.ellipse(cx + 1, cy + r - 1, r * 0.9, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
 
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 1, cx, cy, r);
  g.addColorStop(0, "#fecaca"); g.addColorStop(0.5, "#ef4444"); g.addColorStop(1, "#991b1b");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
 
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath(); ctx.arc(cx - r * 0.35, cy - r * 0.45, r * 0.25, 0, Math.PI * 2); ctx.fill();
 
  ctx.strokeStyle = "#3f6212"; ctx.lineWidth = 2; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + 2, cy - r - 4, cx + 5, cy - r - 3); ctx.stroke();
}
 
function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
 
function drawSnake() {
  const n = state.snake.length, t = state.tickProgress;
  const moving = state.running && !state.gameOver;
  for (let i = n - 1; i >= 0; i--) {
    const seg = state.snake[i];
    let px = seg.x, py = seg.y;
    if (moving) {
      const tx = i > 0 ? state.snake[i - 1].x : seg.x + state.direction.x;
      const ty = i > 0 ? state.snake[i - 1].y : seg.y + state.direction.y;
      px += (tx - seg.x) * t;
      py += (ty - seg.y) * t;
    }
    if (i === 0) drawHead(px * CELL_SIZE, py * CELL_SIZE);
    else drawBodySegment(px * CELL_SIZE, py * CELL_SIZE, i, n);
  }
}
 
function drawBodySegment(x, y, index, total) {
  const shrink = index === total - 1 ? 6 : 3;
  const inset = shrink / 2, size = CELL_SIZE - shrink;
  const k = index / Math.max(1, total - 1);
  const r = Math.round(217 - 90 * k), g = Math.round(249 - 90 * k), b = Math.round(157 - 100 * k);
 
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  roundRect(x + inset + 1, y + inset + 2, size, size, 6); ctx.fill();
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  roundRect(x + inset, y + inset, size, size, 6); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  roundRect(x + inset + 2, y + inset + 2, size * 0.6, 3, 1.5); ctx.fill();
}
 
function drawHead(x, y) {
  const inset = 1, w = CELL_SIZE - inset * 2;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(x + inset + 1, y + inset + 2, w, w, 7); ctx.fill();
 
  const grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
  grad.addColorStop(0, "#f7fee7"); grad.addColorStop(1, "#bef264");
  ctx.fillStyle = grad;
  roundRect(x + inset, y + inset, w, w, 7); ctx.fill();
  ctx.strokeStyle = "rgba(63,98,18,0.9)"; ctx.lineWidth = 1.5;
  roundRect(x + inset, y + inset, w, w, 7); ctx.stroke();
 
  const dir = state.direction;
  const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2;
  const px = -dir.y, py = dir.x;               // перпендикуляр
  for (const s of [-1, 1]) {
    const ex = cx + dir.x * 3.5 + px * 3 * s;
    const ey = cy + dir.y * 3.5 + py * 3 * s;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#10210a"; ctx.beginPath(); ctx.arc(ex + dir.x * 0.6, ey + dir.y * 0.6, 1.2, 0, Math.PI * 2); ctx.fill();
  }
 
  const bx = cx + dir.x * 8, by = cy + dir.y * 8;
  const wag = Math.sin(performance.now() / 120) * 1.5;
  const tx = bx + dir.x * 5 + px * wag, ty = by + dir.y * 5 + py * wag;
  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty);
  ctx.moveTo(tx, ty); ctx.lineTo(tx + px * 2 + dir.x * 2, ty + py * 2 + dir.y * 2);
  ctx.moveTo(tx, ty); ctx.lineTo(tx - px * 2 + dir.x * 2, ty - py * 2 + dir.y * 2);
  ctx.stroke();
}
 
/* ---------- Цикл ---------- */
function gameLoop(now) {
  update(now);
  draw();
  requestAnimationFrame(gameLoop);
}
 
/* ---------- Управление ---------- */
function isMenuOpen() {
  return !startMenuEl.classList.contains("hidden") || !gameOverMenuEl.classList.contains("hidden");
}
 
function queueTurn(newDir) {
  if (!state.running || state.gameOver) return;
  const last = state.queue.length ? state.queue[state.queue.length - 1] : state.direction;
  if (newDir === last) return;                                   // то же направление
  if (last.x + newDir.x === 0 && last.y + newDir.y === 0) return; // разворот на 180°
  if (state.queue.length >= MAX_QUEUE) return;
 
  const wasEmpty = state.queue.length === 0;
  state.queue.push(newDir);
 
  // Ключ к отзывчивости: не ждём конца шага, если он уже наполовину пройден
  if (wasEmpty && state.tickProgress >= EARLY_TURN_AT) {
    state.lastMoveTime = performance.now();
    moveSnake();
    state.tickProgress = 0;
  }
}
 
function handleKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
 
  if ((event.code === "Enter" || event.code === "Space") && isMenuOpen()) {
    event.preventDefault();
    if (!event.repeat) startGame();
    return;
  }
 
  const dir = KEYMAP[event.code];
  if (!dir) return;
  event.preventDefault();       // стрелки не скроллят страницу
  if (event.repeat) return;
  queueTurn(dir);
}
 
/* ---------- Старт / конец ---------- */
function startGame() {
  initGame();
  state.running = true;
  state.lastMoveTime = performance.now();
  startMenuEl.classList.add("hidden");
  gameOverMenuEl.classList.add("hidden");
  startBtn.blur(); restartBtn.blur();   // чтобы пробел не «нажимал» кнопку повторно
}
 
function endGame() {
  state.gameOver = true;
  state.running = false;
  state.queue = [];
  if (state.score > state.best) state.best = state.score;
  finalScoreEl.textContent = state.score;
  finalBestEl.textContent = state.best;
  updateHUD();
  gameOverMenuEl.classList.remove("hidden");
}
 
function updateHUD() {
  scoreEl.textContent = state.score;
  bestEl.textContent = state.best;
}
 
/* ---------- Точка входа ---------- */
function bootstrap() {
  initGame();
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);
  document.addEventListener("keydown", handleKeyDown);
  requestAnimationFrame(gameLoop);
}
 
bootstrap();
 