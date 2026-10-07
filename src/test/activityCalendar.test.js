import { describe, expect, it } from "vitest";
import {
  buildSixMonthActivityGraph,
  formatActivityDay,
  formatActivityMonth,
  getActivityTotalForSixMonths,
  getLuandaDayKey,
} from "../utils/activityCalendar.js";

describe("six-month activity graph", () => {
  it("uses Africa/Luanda dates for timestamp activity without shifting database dates", () => {
    expect(getLuandaDayKey("2026-10-01T23:30:00.000Z")).toBe("2026-10-02");
    expect(getLuandaDayKey("2026-10-02")).toBe("2026-10-02");

    const { weeks, todayKey } = buildSixMonthActivityGraph(
      [{ day: "2026-10-02", count: 3 }],
      new Date("2026-10-01T23:30:00.000Z"),
    );
    const today = weeks.flat().find((cell) => cell?.isToday);

    expect(todayKey).toBe("2026-10-02");
    expect(today).toMatchObject({ dayKey: "2026-10-02", count: 3 });
  });

  it("includes today and starts six calendar months earlier across a year boundary", () => {
    const { weeks, startDay, todayKey, monthLabels } = buildSixMonthActivityGraph(
      [],
      new Date("2027-01-15T12:00:00.000Z"),
    );

    expect(startDay).toBe("2026-07-15");
    expect(todayKey).toBe("2027-01-15");
    expect(weeks.flat().filter(Boolean)).toHaveLength(185);
    expect(monthLabels.map((month) => month.monthKey)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
    ]);
    expect(weeks.flat().find((cell) => cell?.isToday)?.dayKey).toBe(todayKey);
  });

  it("keeps weekly columns Sunday-first, includes the start and end dates, and aligns month labels", () => {
    const { weeks, monthLabels, startDay, todayKey } = buildSixMonthActivityGraph(
      [{ day: "2026-10-06", count: 2 }],
      new Date("2026-10-07T12:00:00.000Z"),
    );
    const cells = weeks.flat();
    const octoberSix = cells.find((cell) => cell?.dayKey === "2026-10-06");

    expect(startDay).toBe("2026-04-07");
    expect(todayKey).toBe("2026-10-07");
    expect(cells[0]).toBeNull();
    expect(cells.filter(Boolean).at(-1).dayKey).toBe("2026-10-07");
    expect(octoberSix).toMatchObject({ count: 2, isToday: false });
    expect(monthLabels.find((month) => month.monthKey === "2026-10")).toBeDefined();
    expect(formatActivityMonth("2026-10")).toBe("out");
    expect(formatActivityDay("2026-10-06")).toBe("06/10/2026");
  });

  it("clamps six-month subtraction for short months and leap years", () => {
    expect(
      buildSixMonthActivityGraph([], new Date("2024-08-31T12:00:00.000Z")).startDay,
    ).toBe("2024-02-29");
    expect(
      buildSixMonthActivityGraph([], new Date("2026-08-31T12:00:00.000Z")).startDay,
    ).toBe("2026-02-28");
  });

  it("counts only activity within the trailing six calendar months through today", () => {
    expect(
      getActivityTotalForSixMonths(
        [
          { day: "2026-04-06", count: 9 },
          { day: "2026-04-07", count: 2 },
          { day: "2026-10-07", count: 3 },
          { day: "2026-10-08", count: 20 },
        ],
        new Date("2026-10-07T12:00:00.000Z"),
      ),
    ).toBe(5);
  });
});
