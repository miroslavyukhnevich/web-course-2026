import { useState } from 'react';
import { createTodo } from '../todoModel';
import TodoList from './TodoList';

export default function App() {
  const [todos, setTodos] = useState([
    createTodo('Выучить React'),
    createTodo('Сделать лабу', true),
  ]);

  const toggleTodo = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const deleteTodo = (id) => setTodos((prev) => prev.filter((t) => t.id !== id));
  const editTodo = (id, text) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text: text.trim() } : t)));

  return (
    <>
      <h1>Todo-list</h1>
      <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} />
    </>
  );
}