import { memo } from 'react';
import { SORTS } from '../todoModel';

/**
 * @param {string} current - ключ выбранной сортировки
 * @param {(key:string)=>void} onChange - вызывается при выборе пункта
 */
function SortSelect({ current, onChange }) {
  
  return (
    <label>
      Сортировка:{' '}
      <select value={current} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(SORTS).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default memo(SortSelect);