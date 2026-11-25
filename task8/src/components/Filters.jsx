import { FILTERS } from '../todoModel';

/** @param {string} current  @param {(key:string)=>void} onChange */
export default function Filters({ current, onChange }) {
  return (
    <div className="filters">
      {Object.entries(FILTERS).map(([key, { label }]) => (
        <button key={key} className={key === current ? 'active' : ''} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}