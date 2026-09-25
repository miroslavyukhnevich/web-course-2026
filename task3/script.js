// ===== Состояние приложения =====
let tasks = [];            // массив объектов { id, text, completed }
let nextId = 1;            // счётчик для уникальных id
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// ===== DOM-элементы =====
const input = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const warning = document.getElementById('warning');
const counter = document.getElementById('counter');
const list = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');

// ===== Добавление задачи =====
function addTask() {
    const text = input.value.trim();

    if (!text) {
        // Пустой ввод — показываем предупреждение
        warning.hidden = false;
        return;
    }

    warning.hidden = true;

    tasks.push({
        id: nextId++,
        text: text,
        completed: false
    });

    input.value = '';
    input.focus();
    render();
}

// ===== Удаление задачи =====
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    render();
}

// ===== Переключение статуса «выполнено» =====
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        render();
    }
}

// ===== Смена фильтра =====
function setFilter(filter) {
    currentFilter = filter;

    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    render();
}

// ===== Получение задач по текущему фильтру =====
function getVisibleTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        case 'all':
        default:
            return tasks;
    }
}

// ===== Создание DOM-элемента одной задачи =====
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) {
        li.classList.add('completed');
    }

    // Чекбокс
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Текст
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Удалить';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(checkbox, span, deleteBtn);
    return li;
}

// ===== Счётчик =====
function renderCounter() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const remaining = total - completed;
    counter.textContent = `Осталось: ${remaining}, Выполнено: ${completed}`;
}

// ===== Главная функция отрисовки =====
function render() {
    // Очищаем список
    list.innerHTML = '';

    // Берём задачи по фильтру и рендерим через map
    const visibleTasks = getVisibleTasks();
    const elements = visibleTasks.map(createTaskElement);
    elements.forEach(el => list.appendChild(el));

    // Обновляем счётчик
    renderCounter();
}

// ===== Обработчики событий =====
addBtn.addEventListener('click', addTask);

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        addTask();
    }
});

// Скрываем предупреждение при вводе текста
input.addEventListener('input', () => {
    if (input.value.trim()) {
        warning.hidden = true;
    }
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});


render();