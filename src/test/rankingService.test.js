import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabase } from "./harness.js";
import { makeProfile } from "./fakeSupabase.js";

let fake;
let rankingService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  rankingService = await import("../services/rankingService.js");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getTop10Users", () => {
  it("returns public profiles ordered by XP, limited to ten", async () => {
    fake.db.profiles.push(
      makeProfile({ name: "Private", xp: 999, is_public: false }),
      makeProfile({ name: "Second", xp: 200 }),
      makeProfile({ name: "First", xp: 500 }),
    );

    const users = await rankingService.getTop10Users();

    expect(users.map((user) => user.name)).toEqual(["First", "Second"]);
    expect(users[0]).toMatchObject({
      name: "First",
      xp: 500,
      level: 1,
      username: expect.any(String),
    });
    expect(fake.queries.at(-1)).toMatchObject({
      table: "profiles",
      operation: "select",
      filters: [{ kind: "eq", column: "is_public", value: true }],
    });
  });

  it("propagates query errors", async () => {
    fake.injectedError = { message: "Database unavailable" };

    await expect(rankingService.getTop10Users()).rejects.toThrow(
      "Database unavailable",
    );
  });
});
