/** @param {{total:number, done:number, active:number}} stats */
export default function Stats({ stats }) {
  return (
    <p>Всего: {stats.total} · Выполнено: {stats.done} · Осталось: {stats.active}</p>
  );
}