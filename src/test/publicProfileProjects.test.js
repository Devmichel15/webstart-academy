import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabase } from "./harness.js";

let fake;
let publicProfileService;

beforeEach(async () => {
  vi.resetModules();
  fake = mockSupabase();
  publicProfileService = await import("../services/publicProfileService.js");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public profile projects", () => {
  it("loads public projects by username RPC and maps project IDs", async () => {
    fake.rpc = vi.fn().mockResolvedValue({
      data: [{
        id: "project-1",
        title: "Meu portfólio pessoal",
        description: "Portfolio",
        tags: ["web"],
        project_url: "https://example.test",
        github_url: null,
        like_count: 2,
        comment_count: 1,
        created_at: "2026-09-23T12:00:00.000Z",
      }],
      error: null,
    });

    const projects = await publicProfileService.getPublicProjectsByUsername("pessoa");

    expect(fake.rpc).toHaveBeenCalledWith("get_public_projects_by_username", {
      p_username: "pessoa",
    });
    expect(projects).toEqual([{
      id: "project-1",
      title: "Meu portfólio pessoal",
      description: "Portfolio",
      tags: ["web"],
      projectUrl: "https://example.test",
      githubUrl: null,
      likeCount: 2,
      commentCount: 1,
      createdAt: "2026-09-23T12:00:00.000Z",
    }]);
  });
});
