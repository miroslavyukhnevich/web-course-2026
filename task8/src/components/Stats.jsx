import { memo } from 'react';

/** @param {{total:number, done:number, active:number}} stats */
function Stats({ stats }) {
  return (
    <p>
      Всего: {stats.total} · Выполнено: {stats.done} · Осталось: {stats.active}
    </p>
  );
}

export default memo(Stats);