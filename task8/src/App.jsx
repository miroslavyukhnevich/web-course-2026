import useTodos from './useTodos';
import TodoForm from './components/TodoForm';
import Filters from './components/Filters';
import SortSelect from './components/SortSelect';
import ImportButton from './components/ImportButton';
import Stats from './components/Stats';
import TodoList from './components/TodoList';

export default function App() {
  const {
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
  } = useTodos();

  return (
    <>
      <h1>Todo-list</h1>
      <TodoForm onAdd={addTodo} />
      <Filters current={filter} onChange={setFilter} />
      <SortSelect current={sort} onChange={setSort} />
      <ImportButton onImport={importTodos} loading={loading} error={error} />
      <Stats stats={stats} />
      <TodoList
        todos={visibleTodos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onEdit={editTodo}
      />
    </>
  );
}