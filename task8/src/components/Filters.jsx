import { memo } from 'react';
import { FILTERS } from '../todoModel';

/**
 * @param {string} current - ключ выбранного фильтра
 * @param {(key:string)=>void} onChange - вызывается при клике на кнопку фильтра
 */
function Filters({ current, onChange }) {
 
  return (
    <div className="filters">
      {Object.entries(FILTERS).map(([key, { label }]) => (
        <button
          key={key}
          className={key === current ? 'active' : ''}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default memo(Filters);