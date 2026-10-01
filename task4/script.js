

/* ======================= Состояние приложения ======================= */

const state = {
  secret: '',
  attempts: 0,
  history: [],
  isGameOver: false,
  bestScore: null,
};

/* ===================== Ссылки на DOM-элементы ====================== */

const inputEl        = document.getElementById('guessInput');
const inputWrapEl    = document.getElementById('guessInputWrap');
const cellsEl        = document.getElementById('cells');
const checkBtn       = document.getElementById('checkBtn');
const newGameBtn     = document.getElementById('newGameBtn');
const messageEl      = document.getElementById('message');
const attemptsEl     = document.getElementById('attemptsCount');
const bestScoreEl    = document.getElementById('bestScore');
const historyListEl  = document.getElementById('historyList');
const historyEmptyEl = document.getElementById('historyEmpty');

const cellEls = Array.from(cellsEl.children);

/* ==================== Функция генерации числа ====================== */
function generateSecret() {
  const digits = ['0','1','2','3','4','5','6','7','8','9'];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4).join('');
}

/* ==================== Функция валидации ввода ====================== */
function validateGuess(raw) {
  const value = String(raw).trim();
  if (value.length === 0)     return { valid: false, error: 'Введите 4 цифры.' };
  if (value.length !== 4)     return { valid: false, error: 'Нужно ровно 4 цифры.' };
  if (!/^\d{4}$/.test(value)) return { valid: false, error: 'Допустимы только цифры (0–9).' };
  if (new Set(value.split('')).size !== 4) {
    return { valid: false, error: 'Цифры не должны повторяться.' };
  }
  return { valid: true };
}

/* ============= Функция подсчёта быков и коров ====================== */
function countBullsAndCows(secret, guess) {
  let bulls = 0;
  let cows = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) bulls++;
    else if (secret.includes(guess[i])) cows++;
  }
  return { bulls, cows };
}

/* ==================== Рендер ячеек ввода ========================== */
function renderCells() {
  const value = inputEl.value;
  cellEls.forEach((cell, i) => {
    cell.textContent = value[i] || '';
    cell.classList.toggle('is-filled', Boolean(value[i]));
  });
}

/* ===================== Рендер истории попыток ===================== */
function renderHistory() {
  historyListEl.innerHTML = '';
  historyEmptyEl.classList.toggle('is-hidden', state.history.length > 0);

  state.history.forEach((item) => {
    const li = document.createElement('li');

    const digits = document.createElement('div');
    digits.className = 'history__digits';
    item.guess.split('').forEach((d) => {
      const span = document.createElement('span');
      span.className = 'history__digit';
      span.textContent = d;
      digits.appendChild(span);
    });

    const result = document.createElement('div');
    result.className = 'history__result';

    const bullsBadge = document.createElement('span');
    bullsBadge.className = 'badge badge--bull' + (item.bulls === 0 ? ' badge--zero' : '');
    bullsBadge.textContent = `🐂 ${item.bulls} ${pluralizeBulls(item.bulls)}`;

    const cowsBadge = document.createElement('span');
    cowsBadge.className = 'badge badge--cow' + (item.cows === 0 ? ' badge--zero' : '');
    cowsBadge.textContent = `🐄 ${item.cows} ${pluralizeCows(item.cows)}`;

    result.append(bullsBadge, cowsBadge);
    li.append(digits, result);
    historyListEl.appendChild(li);
  });

  historyListEl.scrollTop = historyListEl.scrollHeight;
}

/* ================= Вспомогательные функции склонения =============== */
function pluralizeBulls(n) { return pluralize(n, ['бык', 'быка', 'быков']); }
function pluralizeCows(n)  { return pluralize(n, ['корова', 'коровы', 'коров']); }
function pluralize(n, forms) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
  return forms[2];
}

/* ===================== Вспомогательные UI-функции ================== */
function setMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
}

function updateStats() {
  attemptsEl.textContent = String(state.attempts);
  bestScoreEl.textContent = state.bestScore === null ? '—' : String(state.bestScore);
}

function setInputDisabled(disabled) {
  inputEl.disabled = disabled;
  checkBtn.disabled = disabled;
  inputWrapEl.classList.toggle('is-locked', disabled);
}

function clearInput() {
  inputEl.value = '';
  renderCells();
  if (!inputEl.disabled) inputEl.focus();
}

function flashError() {
  inputWrapEl.classList.remove('is-error');
  void inputWrapEl.offsetWidth;
  inputWrapEl.classList.add('is-error');
  setTimeout(() => inputWrapEl.classList.remove('is-error'), 500);
}

/* ========================= Логика новой игры ====================== */
function startNewGame() {
  state.secret = generateSecret();
  state.attempts = 0;
  state.history = [];
  state.isGameOver = false;

  updateStats();
  renderHistory();
  renderCells();
  setInputDisabled(false);
  setMessage('Введите 4 неповторяющиеся цифры.', 'info');
  clearInput();
  // console.log('Секрет:', state.secret);
}

/* ==================== Обработчик попытки игрока ==================== */
function handleCheck() {
  if (state.isGameOver) return;

  const validation = validateGuess(inputEl.value);
  if (!validation.valid) {
    flashError();
    setMessage(validation.error, 'error');
    return;
  }

  const guess = inputEl.value.trim();
  const { bulls, cows } = countBullsAndCows(state.secret, guess);

  state.attempts++;
  state.history.push({ guess, bulls, cows });

  updateStats();
  renderHistory();
  clearInput();

  if (bulls === 4) {
    state.isGameOver = true;
    if (state.bestScore === null || state.attempts < state.bestScore) {
      state.bestScore = state.attempts;
    }
    updateStats();
    setInputDisabled(true);
    setMessage(
      `🎉 Победа! Угадано за ${state.attempts} ${pluralizeAttempts(state.attempts)}`,
      'win'
    );
  } else {
    setMessage(`Быков: ${bulls} · Коров: ${cows}`, 'info');
  }
}

function pluralizeAttempts(n) {
  return pluralize(n, ['попытку', 'попытки', 'попыток']);
}

/* ========================= Навешивание событий ===================== */
checkBtn.addEventListener('click', handleCheck);

inputEl.addEventListener('input', () => {
  inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 4);
  renderCells();
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleCheck();
});

inputEl.addEventListener('focus', () => inputWrapEl.classList.add('is-focused'));
inputEl.addEventListener('blur',  () => inputWrapEl.classList.remove('is-focused'));

newGameBtn.addEventListener('click', startNewGame);

cellsEl.addEventListener('click', () => {
  if (!inputEl.disabled) inputEl.focus();
});

/* ============================ Старт игры =========================== */
startNewGame();