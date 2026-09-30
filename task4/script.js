'use strict';

/* ======================= Состояние приложения ======================= */

const state = {
  secret: '',        // загаданное число (строка из 4 цифр)
  attempts: 0,       // счётчик попыток
  history: [],       // массив объектов { guess, bulls, cows }
  isGameOver: false, // флаг окончания игры
};

/* ===================== Ссылки на DOM-элементы ====================== */

const inputEl = document.getElementById('guessInput');
const checkBtn = document.getElementById('checkBtn');
const newGameBtn = document.getElementById('newGameBtn');
const messageEl = document.getElementById('message');
const attemptsEl = document.getElementById('attemptsCount');
const historyListEl = document.getElementById('historyList');

/* ==================== Функция генерации числа ======================
   Возвращает строку из 4 неповторяющихся цифр (первая цифра может быть 0,
   так как по правилам игры число — это набор цифр, а не «натуральное число»).
*/
function generateSecret() {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  // Перемешивание Фишера–Йетса
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }

  return digits.slice(0, 4).join('');
}

/* ==================== Функция валидации ввода ======================
   Возвращает объект: { valid: boolean, error?: string }
*/
function validateGuess(raw) {
  const value = String(raw).trim();

  if (value.length === 0) {
    return { valid: false, error: 'Введите 4 цифры.' };
  }

  if (value.length !== 4) {
    return { valid: false, error: 'Нужно ровно 4 цифры.' };
  }

  if (!/^\d{4}$/.test(value)) {
    return { valid: false, error: 'Допустимы только цифры (0–9).' };
  }

  // Проверка на уникальность цифр
  const unique = new Set(value.split(''));
  if (unique.size !== 4) {
    return { valid: false, error: 'Цифры не должны повторяться.' };
  }

  return { valid: true };
}

/* ============= Функция подсчёта быков и коров ======================
   Принимает две строки по 4 цифры, возвращает { bulls, cows }.
   «Бык» — цифра на своём месте.
   «Корова» — цифра есть в загаданном числе, но стоит на другом месте.
*/
function countBullsAndCows(secret, guess) {
  let bulls = 0;
  let cows = 0;

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      bulls++;
    } else if (secret.includes(guess[i])) {
      cows++;
    }
  }

  return { bulls, cows };
}

/* ===================== Рендер истории попыток ======================
   История рендерится из массива state.history (полная перерисовка).
*/
function renderHistory() {
  historyListEl.innerHTML = '';

  state.history.forEach((item) => {
    const li = document.createElement('li');

    const guessSpan = document.createElement('span');
    guessSpan.className = 'guess';
    guessSpan.textContent = item.guess;

    const resultSpan = document.createElement('span');
    resultSpan.className = 'result';

    const bullsSpan = document.createElement('span');
    bullsSpan.className = 'bulls';
    bullsSpan.textContent = `${item.bulls} ${pluralizeBulls(item.bulls)}`;

    const cowsSpan = document.createElement('span');
    cowsSpan.className = 'cows';
    cowsSpan.textContent = `${item.cows} ${pluralizeCows(item.cows)}`;

    resultSpan.append(bullsSpan, ', ', cowsSpan);

    li.append(guessSpan, resultSpan);
    historyListEl.appendChild(li);
  });
}

/* ================= Вспомогательные функции склонения =============== */

function pluralizeBulls(n) {
  return pluralize(n, ['бык', 'быка', 'быков']);
}

function pluralizeCows(n) {
  return pluralize(n, ['корова', 'коровы', 'коров']);
}

function pluralize(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/* ===================== Вспомогательные UI-функции ================== */

function setMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
}

function updateAttempts() {
  attemptsEl.textContent = String(state.attempts);
}

function setInputDisabled(disabled) {
  inputEl.disabled = disabled;
  checkBtn.disabled = disabled;
}

function clearInput() {
  inputEl.value = '';
  inputEl.focus();
}

/* ========================= Логика новой игры ====================== */

function startNewGame() {
  state.secret = generateSecret();
  state.attempts = 0;
  state.history = [];
  state.isGameOver = false;

  updateAttempts();
  renderHistory();
  setInputDisabled(false);
  setMessage('', 'info');
  clearInput();

  // Для отладки — раскомментируйте:
  // console.log('Секрет:', state.secret);
}

/* ==================== Обработчик попытки игрока ==================== */

function handleCheck() {
  if (state.isGameOver) return;

  const raw = inputEl.value;
  const validation = validateGuess(raw);

  if (!validation.valid) {
    setMessage(validation.error, 'error');
    return;
  }

  const guess = raw.trim();
  const { bulls, cows } = countBullsAndCows(state.secret, guess);

  state.attempts++;
  state.history.push({ guess, bulls, cows });

  updateAttempts();
  renderHistory();
  clearInput();

  if (bulls === 4) {
    state.isGameOver = true;
    setInputDisabled(true);
    setMessage(`Победа! Угадано за ${state.attempts} ${pluralizeAttempts(state.attempts)}`, 'win');
  } else {
    setMessage(`Быков: ${bulls}, коров: ${cows}`, 'info');
  }
}

function pluralizeAttempts(n) {
  return pluralize(n, ['попытку', 'попытки', 'попыток']);
}

/* ========================= Навешивание событий ===================== */

checkBtn.addEventListener('click', handleCheck);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleCheck();
  }
});

// Разрешаем вводить только цифры
inputEl.addEventListener('input', () => {
  inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 4);
});

newGameBtn.addEventListener('click', startNewGame);

/* ============================ Старт игры =========================== */

startNewGame();