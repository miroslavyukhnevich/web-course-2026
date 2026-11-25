import useTodos from './useTodos';
import TodoForm from './components/TodoForm';
import Filters from './components/Filters';
import Stats from './components/Stats';
import TodoList from './components/TodoList';

export default function App() {
  const { visibleTodos, stats, filter, setFilter, addTodo, toggleTodo, deleteTodo, editTodo } = useTodos();

  return (
    <>
      <h1>Todo-list</h1>
      <TodoForm onAdd={addTodo} />
      <Filters current={filter} onChange={setFilter} />
      <Stats stats={stats} />
      <TodoList todos={visibleTodos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} />
    </>
  );
}