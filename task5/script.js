(() => {
    'use strict';

    // -------- Константы ----------
    const PADS_COUNT      = 4;      // 4 сектора (индексы 0..3)
    const SHOW_DELAY      = 500;    // длительность подсветки, мс
    const GAP_DELAY       = 250;    // пауза между подсветками, мс
    const START_DELAY     = 600;    // пауза перед началом показа, мс

    // -------- DOM ----------
    const pads        = Array.from(document.querySelectorAll('.pad'));
    const startBtn    = document.getElementById('startBtn');
    const levelEl     = document.getElementById('level');
    const statusEl    = document.getElementById('status');
    const hintEl      = document.getElementById('hint');

    // -------- Состояние игры ----------
    const state = {
        sequence: [],        // последовательность (массив индексов 0..3)
        playerIndex: 0,      // сколько шагов игрок уже ввёл верно
        isPlaying: false,    // идёт ли игра (показ или ввод)
        isShowing: false,    // true — сейчас компьютер показывает последовательность
        timers: [],          // активные setTimeout id (для очистки)
        audioCtx: null       // ленивый AudioContext
    };

    // -------- Утилиты работы с таймерами ----------
    function clearAllTimers() {
        state.timers.forEach(id => clearTimeout(id));
        state.timers = [];
    }

    // Обёртка над setTimeout: сохраняет id, чтобы потом можно было очистить.
    function schedule(fn, delay) {
        const id = setTimeout(() => {
            // убираем себя из списка активных
            state.timers = state.timers.filter(t => t !== id);
            fn();
        }, delay);
        state.timers.push(id);
        return id;
    }

    // Promise-обёртка над setTimeout (для async/await показа)
    function wait(delay) {
        return new Promise(resolve => {
            schedule(resolve, delay);
        });
    }

    // -------- Звук (AudioContext, не блокирует логику) ----------
    const PAD_FREQS = [329.63, 261.63, 220.00, 164.81]; // E4, C4, A3, E3

    function playTone(index) {
        try {
            if (!state.audioCtx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                state.audioCtx = new AC();
            }
            const ctx = state.audioCtx;
            if (ctx.state === 'suspended') ctx.resume();

            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = PAD_FREQS[index];

            gain.gain.setValueAtTime(0.0001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.36);
        } catch (_) {
            /* звук не должен ломать игру */
        }
    }

    // -------- Визуальная подсветка ----------
    function flashPad(index, duration = SHOW_DELAY) {
        const pad = pads[index];
        if (!pad) return;
        pad.classList.add('active');
        schedule(() => pad.classList.remove('active'), duration);
    }

    // -------- Блокировка / разблокировка кликов ----------
    function setPadsEnabled(enabled) {
        pads.forEach(p => { p.disabled = !enabled; });
    }

    // -------- UI ----------
    function updateHUD() {
        levelEl.textContent = state.sequence.length;
    }

    function setStatus(text, cls = '') {
        statusEl.textContent = text;
    }

    function setHint(text, cls = '') {
        hintEl.textContent = text;
        hintEl.className = 'hint' + (cls ? ' ' + cls : '');
    }

    // -------- Логика игры ----------
    function resetGame() {
        clearAllTimers();
        state.sequence = [];
        state.playerIndex = 0;
        state.isPlaying = false;
        state.isShowing = false;
        pads.forEach(p => p.classList.remove('active'));
    }

    function startGame() {
        resetGame();
        state.isPlaying = true;
        setPadsEnabled(false);
        setStatus('Показ...');
        setHint('Смотрите внимательно...');

        // Первый раунд: 1 случайный элемент
        state.sequence.push(randomIndex());
        updateHUD();

        // Небольшая задержка перед стартом показа, затем показываем
        schedule(() => showSequence(), START_DELAY);
    }

    function randomIndex() {
        return Math.floor(Math.random() * PADS_COUNT);
    }

    // Асинхронный показ последовательности через await + wait (setTimeout)
    async function showSequence() {
        state.isShowing = true;
        setPadsEnabled(false);
        setStatus('Показ...');
        setHint('Смотрите внимательно...');

        // Проходим по всей последовательности заново
        for (let i = 0; i < state.sequence.length; i++) {
            const idx = state.sequence[i];

            // подсветка + звук
            playTone(idx);
            flashPad(idx, SHOW_DELAY);

            // ждём окончания подсветки + пауза
            await wait(SHOW_DELAY + GAP_DELAY);

            // если игру сбросили во время показа — прерываемся
            if (!state.isPlaying) return;
        }

        // Показ закончен — ждём ввода игрока
        state.isShowing = false;
        state.playerIndex = 0;
        setPadsEnabled(true);
        setStatus('Ваш ход');
        setHint('Повторите последовательность');
    }

    // Обработка клика по сектору
    function handlePadClick(event) {
        const pad = event.currentTarget;
        const index = Number(pad.dataset.index);

        // Игнорируем клики, если игра не идёт или идёт показ
        if (!state.isPlaying || state.isShowing) return;

        // Визуальный и звуковой отклик
        playTone(index);
        flashPad(index, 220);

        // Проверка шага
        if (state.sequence[state.playerIndex] === index) {
            // Верный шаг
            state.playerIndex++;

            // Вся последовательность введена верно?
            if (state.playerIndex === state.sequence.length) {
                // Переходим к следующему раунду
                state.isPlaying = false;      // временно блокируем ввод
                setPadsEnabled(false);
                setStatus('Верно!');
                setHint('Уровень пройден!', 'success');

                // добавляем новый элемент и показываем заново
                state.sequence.push(randomIndex());
                updateHUD();

                schedule(() => {
                    if (!state.sequence.length) return;
                    state.isPlaying = true;
                    showSequence();
                }, START_DELAY);
            }
        } else {
            // Ошибка — конец игры
            gameOver();
        }
    }

    function gameOver() {
        clearAllTimers();          // все «зависшие» таймеры убираем
        state.isPlaying = false;
        state.isShowing = false;
        setPadsEnabled(false);

        const reached = state.sequence.length; // достигнутый уровень
        setStatus('Игра окончена');
        setHint(`Вы дошли до уровня ${reached}`, 'error');

        // короткая «прощальная» подсветка всех секторов
        pads.forEach((p, i) => {
            schedule(() => p.classList.add('active'), i * 90);
            schedule(() => p.classList.remove('active'), i * 90 + 200);
        });
    }

    // -------- Навешивание обработчиков ----------
    pads.forEach(pad => pad.addEventListener('click', handlePadClick));
    startBtn.addEventListener('click', startGame);

    // Инициализация UI
    setPadsEnabled(false);
    updateHUD();
    setStatus('Нажмите «Старт»');
})();