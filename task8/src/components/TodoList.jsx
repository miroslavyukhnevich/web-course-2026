import { memo } from 'react';
import TodoItem from './TodoItem';

function TodoList({ todos, onToggle, onDelete, onEdit }) {
  
  if (todos.length === 0) return <p>Задач нет</p>;
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}

export default memo(TodoList);