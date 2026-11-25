import { useState, useEffect, useCallback, useMemo } from 'react';
import { createTodo, fromApiTodo, filterTodos, sortTodos, getStats } from './todoModel';

const STORAGE_KEY = 'todos';
const API_URL = 'https://jsonplaceholder.typicode.com/todos?_limit=10';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

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

  // Загрузка задач с сервера по нажатию кнопки
  const importTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Сервер ответил с ошибкой ${response.status}`);
      const data = await response.json();
      setTodos((prev) => [...data.map(fromApiTodo), ...prev]);
    } catch (e) {
      setError(`Не удалось загрузить задачи: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

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
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    importTodos,
  };
}