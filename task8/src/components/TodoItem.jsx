import { useState, memo } from 'react';

/**
 * @param {{id:string,text:string,completed:boolean}} todo
 * @param {(id:string)=>void} onToggle
 * @param {(id:string)=>void} onDelete
 * @param {(id:string, text:string)=>void} onEdit
 */
function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  
  // Локальное состояние: только то, что нужно этому компоненту (режим редактирования)
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  const save = () => {
    if (draft.trim()) onEdit(todo.id, draft);
    setIsEditing(false);
  };

  return (
    <li className={todo.completed ? 'done' : ''}>
      <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
      {isEditing ? (
        <>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button onClick={save}>Сохранить</button>
        </>
      ) : (
        <>
          <span onDoubleClick={() => setIsEditing(true)}>{todo.text}</span>
          <button onClick={() => onDelete(todo.id)}>Удалить</button>
        </>
      )}
    </li>
  );
}

export default memo(TodoItem);