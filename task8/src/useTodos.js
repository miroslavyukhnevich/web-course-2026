import { useState, useEffect, useCallback, useMemo } from 'react';
import { createTodo, filterTodos, sortTodos, getStats } from './todoModel';

const STORAGE_KEY = 'todos';

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // битый JSON игнорируем и начинаем с демо-задач
  }
  return [createTodo('Выучить React'), createTodo('Сделать лабу', true)];
}

// Controller: состояние и действия над задачами.
// Хук вызывается внутри App, поэтому состояние по-прежнему принадлежит App.
export default function useTodos() {
  const [todos, setTodos] = useState(loadTodos);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // useCallback: функция создаётся один раз и не меняется между рендерами.
  // Зависимости пустые, потому что внутри используется только setTodos
  // в виде prev => ..., а сам setTodos React не пересоздаёт.
  const addTodo = useCallback(
    (text, completed) => setTodos((prev) => [createTodo(text, completed), ...prev]),
    [],
  );
  const toggleTodo = useCallback(
    (id) =>
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))),
    [],
  );
  const deleteTodo = useCallback(
    (id) => setTodos((prev) => prev.filter((t) => t.id !== id)),
    [],
  );
  const editTodo = useCallback(
    (id, text) =>
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: text.trim() } : t))),
    [],
  );

  // useMemo: пересчитываем только если изменились исходные данные
  const visibleTodos = useMemo(
    () => sortTodos(filterTodos(todos, filter), sort),
    [todos, filter, sort],
  );
  const stats = useMemo(() => getStats(todos), [todos]);

  return {
    visibleTodos,
    stats,
    filter,
    setFilter,
    sort,
    setSort,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
  };
}