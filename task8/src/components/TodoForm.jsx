import { useState, memo } from 'react';

/** @param {(text:string, completed:boolean)=>void} onAdd */
function TodoForm({ onAdd }) {
  
  const [text, setText] = useState('');
  const [completed, setCompleted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault(); // чтобы страница не перезагружалась
    if (!text.trim()) return;
    onAdd(text, completed);
    setText('');
    setCompleted(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Новая задача" />
      <select
        value={completed ? 'done' : 'active'}
        onChange={(e) => setCompleted(e.target.value === 'done')}
      >
        <option value="active">Невыполненная</option>
        <option value="done">Выполненная</option>
      </select>
      <button type="submit">Добавить</button>
    </form>
  );
}

export default memo(TodoForm);