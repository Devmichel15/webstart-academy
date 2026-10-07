import { useMemo } from "react";
import {
  buildSixMonthActivityGraph,
  formatActivityDay,
  getActivityTotalForSixMonths,
} from "../../utils/activityCalendar.js";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function activityClass(count) {
  if (count === 0) return "bg-slate-100 dark:bg-slate-800";
  if (count <= 2) return "bg-green-300 dark:bg-green-900";
  if (count <= 4) return "bg-green-500 dark:bg-green-700";
  if (count <= 6) return "bg-green-700 dark:bg-green-500";
  return "bg-green-900 dark:bg-green-300";
}

function activityLabel(count, dayKey) {
  const formattedDay = formatActivityDay(dayKey);
  return `${count} ${count === 1 ? "aula" : "aulas"} em ${formattedDay}`;
}

export function ActivityHeatmap({ data = [] }) {
  const graph = useMemo(() => buildSixMonthActivityGraph(data), [data]);
  const total = getActivityTotalForSixMonths(data);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-sm font-bold text-primary">
          {total} {total === 1 ? "aula" : "aulas"} nos últimos 6 meses
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-secondary">
          <span>Menos</span>
          <span className="h-3 w-3 rounded-[3px] bg-slate-100 dark:bg-slate-800" />
          <span className="h-3 w-3 rounded-[3px] bg-green-300 dark:bg-green-900" />
          <span className="h-3 w-3 rounded-[3px] bg-green-500 dark:bg-green-700" />
          <span className="h-3 w-3 rounded-[3px] bg-green-700 dark:bg-green-500" />
          <span className="h-3 w-3 rounded-[3px] bg-green-900 dark:bg-green-300" />
          <span>Mais</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div
          className="w-max"
          role="grid"
          aria-label="Atividade nos últimos 6 meses"
        >
          <div
            className="mb-1 ml-[30px] grid h-4 gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${graph.weeks.length}, 12px)` }}
            aria-hidden="true"
          >
            {graph.weeks.map((_, weekIndex) => {
              const monthLabel = graph.monthLabels.find((month) => month.weekIndex === weekIndex);
              return (
                <span
                  key={weekIndex}
                  className="overflow-visible whitespace-nowrap text-[10px] leading-4 text-secondary"
                >
                  {monthLabel?.label}
                </span>
              );
            })}
          </div>

          {WEEKDAYS.map((weekday, dayIndex) => (
            <div key={weekday} className="flex items-center gap-1.5" role="row">
              <span
                role="rowheader"
                className="w-6 shrink-0 text-[9px] leading-none text-secondary"
              >
                {weekday}
              </span>
              <div
                className="grid grid-flow-col auto-cols-[12px] gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${graph.weeks.length}, 12px)` }}
              >
                {graph.weeks.map((week, weekIndex) => {
                  const cell = week[dayIndex];
                  if (!cell) {
                    return (
                      <span
                        key={`${weekIndex}-${dayIndex}`}
                        className="size-3"
                        aria-hidden="true"
                      />
                    );
                  }

                  const label = activityLabel(cell.count, cell.dayKey);
                  const todayClass = cell.isToday
                    ? "outline outline-1 outline-offset-1 outline-green-900 dark:outline-green-300"
                    : "";

                  return (
                    <span
                      key={cell.dayKey}
                      role="gridcell"
                      aria-label={label}
                      title={label}
                      className={`size-3 rounded-[3px] ${activityClass(cell.count)} ${todayClass}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
