// Model: описание задачи и чистые функции. React здесь не используется.

export function createTodo(text, completed = false) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed,
    createdAt: Date.now(),
  };
}

// Реестр фильтров. Новый фильтр = одна новая строка здесь,
// остальной код (кнопки, фильтрация) не меняется.
export const FILTERS = {
  all: { label: 'Все', predicate: () => true },
  active: { label: 'Невыполненные', predicate: (t) => !t.completed },
  done: { label: 'Выполненные', predicate: (t) => t.completed },
};

export function filterTodos(todos, filterKey) {
  return todos.filter(FILTERS[filterKey].predicate);
}

export function getStats(todos) {
  const done = todos.filter((t) => t.completed).length;
  return { total: todos.length, done, active: todos.length - done };
}

// Реестр сортировок. Новая сортировка = одна новая строка здесь.
export const SORTS = {
  newest: { label: 'Сначала новые', compare: (a, b) => b.createdAt - a.createdAt },
  oldest: { label: 'Сначала старые', compare: (a, b) => a.createdAt - b.createdAt },
  az: { label: 'По алфавиту (А→Я)', compare: (a, b) => a.text.localeCompare(b.text, 'ru') },
  za: { label: 'По алфавиту (Я→А)', compare: (a, b) => b.text.localeCompare(a.text, 'ru') },
};

export function sortTodos(todos, sortKey) {
  // [...todos] делает копию, поэтому исходный массив не меняется
  return [...todos].sort(SORTS[sortKey].compare);
}

// Преобразует задачу из jsonplaceholder в формат нашего приложения.
// index нужен, чтобы у загруженных задач были немного разные даты
// и порядок при сортировке «сначала новые» сохранялся.
export function fromApiTodo(item, index = 0) {
  return {
    id: crypto.randomUUID(),
    text: item.title,
    completed: item.completed,
    createdAt: Date.now() - index,
  };
}