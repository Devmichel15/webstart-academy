import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabase } from "./harness.js";
import { makeAuthUser, makeProfile } from "./fakeSupabase.js";

const AUTH_UID = "11111111-1111-4111-8111-111111111111";
const PROFILE_ID = "22222222-2222-4222-8222-222222222222";

let fake;
let communityService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  fake.setSession(makeAuthUser({ id: AUTH_UID, email: "person@example.test" }));
  communityService = await import("../services/communityService.js");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getUserProjects profile identity", () => {
  it("resolves the auth UID to profiles.id before querying project author_id", async () => {
    fake.db.profiles.push(makeProfile({
      id: PROFILE_ID,
      auth_user_id: AUTH_UID,
      email: "person@example.test",
    }));
    fake.db.community_projects.push({
      id: "project-1",
      author_id: PROFILE_ID,
      title: "Meu portfólio pessoal",
      description: "Portfolio",
      tags: [],
      project_url: null,
      github_url: null,
      like_count: 0,
      comment_count: 0,
      created_at: "2026-09-23T12:00:00.000Z",
    });

    const projects = await communityService.getUserProjects(AUTH_UID);

    expect(projects.map((project) => project.title)).toEqual(["Meu portfólio pessoal"]);
    expect(fake.queries.find((query) => query.table === "community_projects")?.filters).toContainEqual({
      kind: "eq",
      column: "author_id",
      value: PROFILE_ID,
    });
  });
});
