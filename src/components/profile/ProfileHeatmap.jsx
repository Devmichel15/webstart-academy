import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildMonthActivityGraph,
  formatActivityDay,
} from "../../utils/activityCalendar.js";

const WEEKDAYS = ["Dom", "", "Ter", "", "Qui", "", "Sáb"];

function levelFor(count) {
  if (!count || count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

const LEVEL_CLASS = {
  0: "bg-slate-100 dark:bg-slate-800",
  1: "bg-green-300 dark:bg-green-900",
  2: "bg-green-500 dark:bg-green-700",
  3: "bg-green-700 dark:bg-green-500",
  4: "bg-green-900 dark:bg-green-300",
};

function activityLabel(count, dayKey) {
  return `${count} ${count === 1 ? "aula" : "aulas"} em ${formatActivityDay(dayKey)}`;
}

export function ProfileHeatmap({ data = [] }) {
  const now = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );

  const graph = useMemo(
    () => buildMonthActivityGraph(data, cursor.getFullYear(), cursor.getMonth()),
    [data, cursor],
  );

  const isCurrentMonth =
    cursor.getFullYear() === now.getFullYear() &&
    cursor.getMonth() === now.getMonth();

  const goPrev = () =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNext = () => {
    if (isCurrentMonth) return;
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  };

  const totalAllTime = useMemo(
    () => (data || []).reduce((sum, record) => sum + (Number(record.count) || 0), 0),
    [data],
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="flex-1 text-sm font-bold text-primary">
          {totalAllTime} {totalAllTime === 1 ? "aula" : "aulas"} registadas
        </h3>
        <button
          type="button"
          onClick={goPrev}
          aria-label="Mês anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-strong hover:bg-surface-hover"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[130px] text-center text-sm font-bold capitalize text-primary">
          {graph.label}
        </span>
        <button
          type="button"
          onClick={goNext}
          aria-label="Mês seguinte"
          disabled={isCurrentMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2" role="grid" aria-label={`Atividade em ${graph.label}`}>
          <div className="grid grid-rows-7 gap-1 text-[10px] leading-4 text-secondary" aria-hidden="true">
            {WEEKDAYS.map((weekday, index) => (
              <span key={index} className="h-4">
                {weekday}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {graph.weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-1">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const cell = week[dayIndex];
                  if (!cell) {
                    return <span key={dayIndex} className="h-4 w-4" aria-hidden="true" />;
                  }
                  const level = cell.isFuture ? 0 : levelFor(cell.count);
                  const label = activityLabel(cell.count, cell.dayKey);
                  const todayClass = cell.isToday
                    ? "outline outline-2 outline-offset-1 outline-green-900 dark:outline-green-300"
                    : "";
                  const futureClass = cell.isFuture ? "opacity-40" : "";
                  return (
                    <span
                      key={cell.dayKey}
                      role="gridcell"
                      aria-label={label}
                      title={label}
                      className={`h-4 w-4 rounded ${LEVEL_CLASS[level]} ${todayClass} ${futureClass}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-secondary">
        <span>{graph.total} {graph.total === 1 ? "aula" : "aulas"} neste mês</span>
        <span className="flex items-center gap-1">
          Menos
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`h-3 w-3 rounded-sm ${LEVEL_CLASS[level]}`} />
          ))}
          Mais
        </span>
      </div>
    </div>
  );
}
