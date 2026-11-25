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