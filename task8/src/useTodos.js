import { useState } from 'react';
import { createTodo, filterTodos, sortTodos, getStats } from './todoModel';

// Controller: состояние и действия над задачами.
// Хук вызывается внутри App, поэтому состояние по-прежнему принадлежит App.
export default function useTodos() {
  const [todos, setTodos] = useState([
    createTodo('Выучить React'),
    createTodo('Сделать лабу', true),
  ]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const addTodo = (text, completed) =>
    setTodos((prev) => [createTodo(text, completed), ...prev]);
  const toggleTodo = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const deleteTodo = (id) => setTodos((prev) => prev.filter((t) => t.id !== id));
  const editTodo = (id, text) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: text.trim() } : t)));

  return {
    visibleTodos: sortTodos(filterTodos(todos, filter), sort),
    stats: getStats(todos),
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